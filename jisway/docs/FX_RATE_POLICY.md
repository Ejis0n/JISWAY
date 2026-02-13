# FX Rate Policy (v1)

v1 では外部プロバイダ連携を行わず、Admin が **JPY per USD** を手動登録します。

## 取り扱うレート
- **pair**: `JPYUSD`
- **rate**: **JPY per 1 USD**（例: 150.25）

## 運用
- `/admin/pricing` で更新
- 更新のたびに `FxRate` に履歴として追加（上書きしない）
- pricing preview/apply は常に最新の FX を使用

## 将来の拡張（provider）
- source=`provider` として定期取得（例: 1日1回）
- provider由来のレートでも、preview/apply の guardrails により急変を抑制

