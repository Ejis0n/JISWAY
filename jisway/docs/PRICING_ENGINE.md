# Dynamic Pricing Engine (v1)

v1 では、仕入コスト（JPY/pack）と FX（JPY/USD）を入力として、`Variant.priceUsd`（USD cents）を **週次/オンデマンド**で再計算します。

## 目的
- 透明性: 計算の内訳を保存（`PriceChangeLog.reasonJson`）
- 安全性: 価格の急変を防ぐ（週次変動上限、min/max、コスト割れ防止）
- 運用: Admin UI で preview/apply

## データモデル
- `FxRate`: JPY per USD を保存（手動）
- `CostBasis`: variant単位のコスト基準（JPY/pack）
- `PricingRule`: マージン目標/上下限/丸め/週次変動上限
- `PriceChangeLog`: 価格変更ログ（内訳JSON + admin）

## 入力選定
`src/lib/pricing/inputs.ts`
- FX: 最新の `FxRate(JPYUSD)`
- Cost: `CostBasis` の最新30日から **backorder以外**を優先、かつ **最安**を選択
- Rule: variant > size > category > global（最も具体的なもの）

## 計算式
`src/lib/pricing/calc.ts`
- \(cost\_usd = cost\_jpy / jpy\_per\_usd\)
- fee_rate = 0.035（Stripe推定）
- fixed_fee = 0.30 USD
- handling = 1.50 USD（BAND_A） / 2.00 USD（BAND_B）

計算:
- base = cost_usd + handling
- price_before_fees = base / (1 - target_margin)
- price_with_fees = (price_before_fees + fixed_fee) / (1 - fee_rate)
- rounding（0.00 / 0.49 / 0.99）

## Guardrails
- clamp: [min_price_usd, max_price_usd]
- weekly change limit: `max_weekly_change_pct`
  - override=false の場合は **上限でクランプ**
- hard floor: cost_usd + handling + fixed_fee を下回らない

## 実行
- Preview: `POST /api/admin/pricing/preview`
- Apply: `POST /api/admin/pricing/apply`
- CSV export: `GET /api/admin/pricing/preview.csv`

UI: `/admin/pricing`

## 週次実行（設計）
Vercel Cron（例）
- 毎週月曜 09:00 JST に preview を実行し、結果を admin にメール（v1では設計のみ、実装は必要に応じて）。

