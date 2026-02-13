# インデックス設定チェックリスト（Google / Bing）

目的: `/jis` 配下の 50 SKU + ハブページを早くクロール/インデックスさせる。

## 事前確認（サイト側）

- `robots.txt` がクロール許可になっている（`/admin` と `/api` は除外）
- `sitemap.xml` が公開され、SKU/カテゴリ/ハブのURLを含む
- canonical が `APP_BASE_URL` で正規化されている

## Google Search Console（ドメインプロパティ）

1. Search Console で「ドメイン」プロパティを追加
2. 表示される DNS TXT レコードを、DNS 管理画面に追加
3. 反映後に「確認」
4. 「サイトマップ」から `https://<canonical-host>/sitemap.xml` を送信
5. 「URL 検査」で以下を検査して「インデックス登録をリクエスト」
   - `/jis`
   - 代表的な SKU ページを数件
   - 代表的なハブページ（例: `/jis/bolt/m12`）

## Bing Webmaster Tools

1. サイト追加（インポート機能が使える場合は Search Console 連携でも可）
2. いずれかの方法で所有権確認
   - DNS TXT（推奨）
   - HTML メタタグ
3. サイトマップとして `https://<canonical-host>/sitemap.xml` を送信
4. 主要URLをいくつか検査してインデックス要求

## 任意: IndexNow（Bingの即時通知）

- 新規/更新URLを IndexNow に通知すると、Bing 側の取り込みが速くなることがあります。
- 本リポジトリでは任意機能として実装可能です（`docs/INDEXNOW.md` 参照）。

