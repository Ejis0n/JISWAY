# Analytics（軽量・プライバシーフレンドリー）

目的:
- インデックス後の導線が機能しているかを最小コストで確認
- 重要アクションのカウントを管理画面で見られるようにする

## 収集イベント

DBテーブル `AnalyticsEvent` に保存します。

- `PageView`
- `AddToCart`
- `StartCheckout`
- `SubmitQuote`
- `SubmitProcure`

保存項目:
- `name`（イベント名）
- `path`
- `createdAt`
- `country`（フォームで入力された場合のみ）
- `variantId`（SKUがある場合のみ）

## 実装方針

- ページ表示: クライアントから `/api/event` に送信（`sendBeacon` も利用）
- 重要サーバー処理（quote/procure）: API側でもイベント保存
- レート制限: `/api/event` はIPベースのインメモリ制限（Vercelの複数インスタンスでは完全ではない）

## 管理画面

- `/admin/analytics` で日次集計（イベント名別）を表示します。

