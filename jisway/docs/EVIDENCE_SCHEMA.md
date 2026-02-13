# EVIDENCE_SCHEMA (v1)

Stripe 争議対応のため、注文に紐づく証跡を **DB に保存**します。

## 1) OrderAcknowledgement
目的: 「購入前に同意した」ことを Stripe に提出できる形で保存。

保存タイミング:
- `/api/checkout`（Stripe へのリダイレクト前）

主なフィールド:
- `orderId`
- `checkoutSessionId`（Session 作成後に更新）
- `ackExactSpec`, `ackNoInventory`, `ackDutiesTaxes`, `ackRefundPolicy`
- `ipAddress`, `userAgent`
- `acknowledgedAt`

## 2) OrderEvidence
目的: 注文ごとの「提出可能な証拠」を時系列で蓄積。

`type`:
- `acknowledgement`
- `receipt`
- `invoice`
- `tracking`
- `delivery_confirmation`
- `packaging_photo`
- `item_photo`
- `communication`
（`shipping_label` は将来拡張用）

保存例:
- checkout acknowledgements（テキストスナップショット）
- Stripe receipt URL / payment snapshot
- 出荷時の carrier / tracking / shipped_at
- support ticket の本文・添付URL
- 管理画面で貼り付けた写真URL（OrderShipping / ProcurementTask 側の保持も別途）

## 3) Evidence export
- `/admin/orders/[id]` から「Generate Stripe Evidence (PDF)」で PDF を生成し、Stripe へ手動提出できます。

