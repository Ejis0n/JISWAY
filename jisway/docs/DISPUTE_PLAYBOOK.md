# DISPUTE_PLAYBOOK (v1)

目的: Stripe dispute の理由別に、**提出すべき証拠**と **添える短文**を定型化する。

## 1) Product unacceptable / Not as described
**提出する証拠**
- `OrderAcknowledgement`（exact spec / no substitutes / no inventory / refund policy）
- 注文サマリ（SKU・仕様・数量）
- Refund policy excerpt（misorder / 7-day window / customs non-refundable）
- Support communication（あれば）

**Notes（短文例）**
- "Customer acknowledged exact JIS specification and no substitutes before checkout. The shipped item matches the order specification."

## 2) Fraud / Card not present
**提出する証拠**
- Stripe receipt / payment snapshot（PaymentIntent/Charge）
- `OrderAcknowledgement`（IP / user-agent）
- 顧客 email・注文内容

**Notes（短文例）**
- "Order was placed with acknowledgements captured (IP and user-agent). Receipt and order details match the customer email on file."

## 3) Unrecognized
**提出する証拠**
- Descriptor 設定（`JISWAY JAPAN` / `IND SUPPLY`）の説明
- Stripe receipt / payment snapshot
- 顧客 email と Order ID

**Notes（短文例）**
- "Statement descriptor is 'JISWAY JAPAN'. Receipt includes the Order ID and procurement terms."

## 4) Not received
**提出する証拠**
- `tracking` evidence（carrier / tracking / shipped_at）
- Shipping policy excerpt（ETA は推定、customs delays は返金理由にならない）
- Support communication（あれば）

**Notes（短文例）**
- "Shipment was dispatched with tracking. Customer was informed that ETAs exclude customs delays and non-delivery cases open after 14 business days past ETA."

