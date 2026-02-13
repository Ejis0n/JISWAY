# POLICY_COPY_GUIDE

このガイドは、JISWAY のポリシー文言を **短く・非マーケティング・争点になりにくい**形で維持するための基準です。

## 原則
- **断定を避けつつ明確に**（例: “may require processing time”）
- **条件と期限**を明示（7日、14営業日など）
- **例外条件**（当社誤配送など）を必ず書く
- “legal advice” にならない範囲で **実務上の取り扱い**を記載

## 必須要素（ページ共通）
- no inventory（支払い確認後に調達開始）
- no substitutes（仕様変更不可）
- duties/taxes（受取人負担）
- customs delays（返金理由にならない）
- windows（damage/wrong item: 7日、non-delivery: ETA+14営業日）
- quote/invoice（wire/USDTは原則 final sale）
- jurisdiction/venue（Japan）

## ページ別の焦点
- `/policies/terms`
  - サービス利用条件、準拠法/裁判地、支払い区分
- `/policies/refund`
  - 例外（当社誤配送/破損/紛失）と必要証拠
- `/policies/shipping`
  - 处理時間・ETA・関税・住所責任
- `/policies/privacy`
  - 収集項目・利用目的・共有先（Stripe/キャリア/サプライヤ）

## UI 文言（短文）
- Product notes:
  - “No substitutes. Exact JIS specification.”
  - “Confirm size/length before ordering. No substitutes.”
- Cart:
  - “All items are procured after payment. Processing begins immediately after confirmation.”
  - “Import duties and taxes are the responsibility of the recipient.”
- Invoice:
  - “Quote/invoice orders are final sale except supplier/shipping errors by us.”

