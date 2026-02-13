# JISWAY v1 Scale Pack

v1では MVP（50 variants）から、**500+ variants の決定論的生成**と、**Paid注文→調達タスクの自動化**、および **Ops最小機能（PO/出荷）** を追加します。

## 何が増えたか（概要）
- **カタログ生成**: `data/catalog.config.json` → `data/catalog.generated.json`
- **pack_qty拡張**: 10/20 に加えて 50/100 を扱える（DBの `PackType` も拡張）
- **調達タスク**: paid注文から ProcurementTask/Line を自動作成
- **サプライヤ管理**: Supplier の登録・割当
- **PO PDF**: supplier向けPOをPDFで生成
- **出荷**: carrier/tracking を入力し Shipment を作成
- **Opsページ**: Procurement Queue / Ready to Ship

## セットアップ（ローカル）
前提: Postgres が起動していること（docker compose など）

### 1) マイグレーション適用
- 開発DB:
  - `npm run db:migrate`
- 本番:
  - `npm run db:migrate:deploy`

### 2) カタログ生成（500+）
- `npm run catalog:gen`
- `npm run catalog:audit`

アプリは `catalog.generated.json` が存在すると自動でそれを読み込みます。

### 3) Seed（開発）
- `npm run db:seed`
  - Product/Variant を upsert
  - admin user を作成（未存在時のみ）

## Stripe webhook（調達タスク自動生成）
`checkout.session.completed` 受信時に:
- Order を paid に更新（email/country保存）
- ProcurementTask（1件/Order）を作成
- ProcurementTaskLine を OrderItem から生成

## 運用（Admin）
主要画面:
- `/admin/ops`（キュー/出荷準備）
- `/admin/procurement`（調達タスク）
- `/admin/suppliers`（サプライヤ管理）
- `/admin/orders/[id]`（出荷/Shipment確認）

## 既知の制約（v1）
- Supplier の自動割当（カテゴリ/サイズ別のルール）は未実装（v1.1候補）
- Shipping band は安全側に単純化（10=BandA / その他=BandB）

## 推奨のチェック
- `npm run catalog:audit`
- `npm run seo:audit`
- `npm run build`

