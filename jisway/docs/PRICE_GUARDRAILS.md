# Price Guardrails (v1)

Dynamic pricing は入力（コスト/FX）が変動するため、事故防止のガードレールを必須とします。

## 1) Min/Max clamp
`PricingRule` の `minPriceUsdCents` と `maxPriceUsdCents` に必ずクランプします。

## 2) Weekly change limit
`maxWeeklyChangePct` を超える変動は、**override=false** の場合は上限でクランプします。

例: 現在 $10.00、上限 15% の場合
- 最大上げ: $11.50
- 最大下げ: $8.50

## 3) Hard floor (cost protection)
最低でも以下を下回りません:
- `cost_usd + handling_usd + fixed_fee_usd`

## 4) Audit log
Apply 時は必ず `PriceChangeLog` に記録します:
- old/new（USD cents）
- 内訳JSON（FX、CostBasis、Rule、calc breakdown）
- appliedByAdminId / appliedAt

## 5) Preview first
運用は必ず preview を確認してから apply してください（CSV export も可能）。

