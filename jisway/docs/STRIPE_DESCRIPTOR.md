# STRIPE_DESCRIPTOR (v1)

このドキュメントは **チャージバック（Unrecognized / Fraud）対策**としての「表示名/明細/領収書」設定をまとめます。

## Stripe Dashboard 設定（手動）
- **Statement descriptor（静的 / <=22 chars）**
  - `JISWAY JAPAN`
- **Dynamic descriptor suffix（任意）**
  - `IND SUPPLY`
- **Receipt email sender name**
  - `JISWAY Procurement`

## コード設定（Checkout / PaymentIntent description）
`/api/checkout` で作成する Checkout Session に以下を設定しています:
- `payment_intent_data.description` に必須文言を含める
  - Order ID
  - `Exact JIS specification. No substitutes.`
  - `Procured after payment confirmation.`
- `payment_intent_data.statement_descriptor = "JISWAY JAPAN"`
- `payment_intent_data.statement_descriptor_suffix = "IND SUPPLY"`

注意:
- Stripe 側の制約により、descriptor の適用可否はアカウント/支払い方法で変わります。
- Receipt の差出人名は Dashboard 設定が優先されます。

