# Procurement Flow (v1)

在庫を持たない前提のため、**注文が paid になった瞬間に調達タスクを自動生成**し、管理画面で進捗を追跡します。

## ステータス
### Order.fulfillmentStatus
- `pending_procurement`: paid直後（調達タスク作成済み）
- `in_procurement`: 仕入先へ依頼済み/調達中
- `ready_to_ship`: 受領済み（出荷準備）
- `shipped`: 出荷済み（追跡番号あり）
- `completed`: クローズ
- `canceled`: キャンセル

### ProcurementTask.status
- `new`: タスク作成直後
- `requested`: 仕入先へ依頼（PO送付など）
- `confirmed`: 仕入先が仕様/納期を確認
- `received`: 受領済み
- `shipped`: 出荷済み
- `closed`: クローズ
- `canceled`: キャンセル

## 自動化（Stripe webhook）
- Stripe `checkout.session.completed` を受信すると:
  - `Order.status = paid`、`paidAt`、`email`、`country` を保存
  - **ProcurementTask を1件/Orderで作成**
  - OrderItem から ProcurementTaskLine を生成（qty=packs）

## 管理画面（v1）
- **Ops**: `/admin/ops`
  - Procurement Queue: `new/requested/confirmed`
  - Ready to Ship: `received`
  - filters: country / date range
- **Procurement**:
  - 一覧: `/admin/procurement`
  - 詳細: `/admin/procurement/[id]`
    - Supplier割当
    - ステータス更新（requestedAt/confirmedAt/... を自動セット）
    - PO PDFダウンロード
    - サプライヤメール送信（PO添付）
    - 出荷（carrier/tracking入力 → Shipment作成）
- **Suppliers**:
  - `/admin/suppliers`（追加）
  - `/admin/suppliers/[id]`（編集）

## PO（Purchase Order）
- PDF生成: `/admin/procurement/[id]/po.pdf`
  - PO番号=Task ID
  - 注文参照=Order ID
  - ライン: item title / pack / qty(packs)
- メール送信: `/api/admin/procurement/[id]/send-po`
  - Supplier email が必要
  - Resend設定が必要（`RESEND_API_KEY`, `EMAIL_FROM`）

## 出荷（Shipment）
- 出荷登録API: `/api/admin/orders/[id]/ship`
  - `carrier` と `tracking_number` 必須
  - `Order.shippedAt` と `Shipment` レコードを作成
  - `Order.fulfillmentStatus=shipped`
  - 紐づく `ProcurementTask` があれば `status=shipped` へ進める

## ガードレール（No inventory）
- 供給不足を「在庫切れ」ではなく **リードタイム** として扱う前提。
- v1では Supplier に `leadTimeDays` を保持します（表示の強化は次の段階で実施）。
- キャンセルルール（推奨）:
  - `requested` 以降は仕入先状況によりキャンセル可否が変わるため、Admin判断で `canceled` に遷移。

