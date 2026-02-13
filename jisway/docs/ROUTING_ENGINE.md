# Procurement Routing Engine (v1)

v1 では、SupplierOffer を入力として、注文の各ラインを「最適なサプライヤ」に割り当てます。
外部API連携は不要で、**手動/CSV取込のデータ**で動作します。

## 目的
- 複数サプライヤ（卸）を前提に、**安い/早い/在庫優先/バランス**の戦略で割当
- 透明性: **候補ごとのスコア内訳**を保存（監査可能）
- 自動分割: サプライヤごとに ProcurementTask を作成（必要に応じて手動割当タスクも作成）

## 主要モデル
### SupplierOffer
サプライヤの提示条件（コスト/リードタイム/可用性）を保持します。
variantId の exact と、category/size/length/finish/strength/pack の部分一致（nullableワイルドカード）を混在できます。

### RoutingDecision
注文ラインごとの「選定結果」を永続化します。
- `strategy`
- `scoreJson`（候補ごとの cost/lead/availability/match の内訳）
- `reasonText`（短い説明）

### RoutingConfig
デフォルト戦略と BALANCED の weight、routing の有効/無効を管理します。
- UI: `/admin/routing`

## マッチング（候補生成）
`src/lib/procurement/match.ts` が注文ライン（Variant仕様）と SupplierOffer を照合します。

優先順:
1) **Exact**: `variant_id + pack_qty`
2) **Spec**: `(category,size,length,strength,finish,pack_qty)` の一致（Offer側の nullable はワイルドカード）
3) **Category+Size(+Pack)**: `(category,size,pack_qty)`
4) **Fallback**: サプライヤデフォルト（categoryのみ、あるいは spec 未指定）

候補には `match_quality` と `match_score` を付与します:
- exact=1.0
- partial=0.6
- fallback=0.3

## ルーティング（戦略）
`src/lib/procurement/router.ts` が候補をスコアリングして選定します。

### 戦略
- `CHEAPEST`: 推定総コスト最小を優先
- `FASTEST`: リードタイム最短を優先
- `AVAILABILITY_FIRST`: 可用性を優先
- `BALANCED`: 重み付きスコア（デフォルト）

### スコア
- `cost_score`: 候補内で min/max 正規化（低いほど良い）
- `lead_score`: 候補内で min/max 正規化（低いほど良い）
- `availability_score`:
  - in_stock=1.0
  - limited=0.7
  - backorder=0.2
  - unknown=0.4
- `match_score`: 上記の match_score

BALANCED:
\[
final = w_{cost}·cost + w_{lead}·lead + w_{availability}·availability + w_{match}·match
\]

### min_order_packs
`min_order_packs > qty` の場合、推定コストは `effective_packs = max(qty, min_order_packs)` で計算します。

## 自動分割（Paid → ProcurementTask）
Stripe `checkout.session.completed` 受信時:
- Routing enabled の場合:
  - line → supplier を決定
  - **supplier ごとに ProcurementTask を作成**
  - 候補ゼロの line は `needs_assignment` タスクへ集約（supplierId=null）
- Routing disabled の場合:
  - 従来通り 1タスク（supplierは任意）

## 管理UI
- `/admin/routing`: enabled/strategy/weights
- `/admin/offers`: offer一覧（フィルタ）
- `/admin/suppliers/import`: CSV取込
- `/admin/orders/[id]`: 「Run routing」ボタン（既存タスク/decisionを上書き）

## 監査・エクスポート
- `RoutingDecision` は常に保存されます。
- CSVエクスポート: `/api/admin/routing/decisions.csv`（`order_id` を付けると絞り込み）

