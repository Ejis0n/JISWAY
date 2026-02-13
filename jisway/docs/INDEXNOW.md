# IndexNow（任意）

目的:
- Bing系に新規/更新URLを通知してクロールを促進する。

## いつ使うか

- SKUやHubのURLが増えた
- 重要ページの更新を早く反映させたい

## 環境変数

- `INDEXNOW_KEY`（任意）
- `INDEXNOW_HOST`（任意・省略時は `APP_BASE_URL` のホスト）

## 実装（任意）

このリポジトリでは任意機能として以下を実装できます。
- `POST /api/indexnow` でURLリストを通知
- `GET /api/indexnow/key` でキー位置（keyLocation）を提供

## 実装しない場合の代替

- Search Console / Bing Webmaster で sitemap 送信
- 代表URLの検査・インデックスリクエスト

