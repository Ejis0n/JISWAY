# Catalog Generation (v1)

このプロジェクトでは、SKU/Variant を手書きで増やさず、**決定論的な生成ルール**から 500+ 件のカタログを生成します。

## 目的
- **SSOT**: `data/catalog.config.json`
- **生成物**: `data/catalog.generated.json`
- **アプリ実行時**: `catalog.generated.json` が存在すればそれを優先して読み込みます（無ければ `catalog.v0.json`）。

## 生成フロー
- **生成**: `npm run catalog:gen`
  - `data/catalog.config.json` を読み取り、`data/catalog.generated.json` を出力します。
- **監査**: `npm run catalog:audit`
  - 500+件であること
  - id の一意性・許可文字（`[a-z0-9-]`）
  - 必須フィールド（category/size/length/strength/finish/pack/price/image）
  - **SEO slug の一意性**（SEOエンジンが生成するslugが衝突しないこと）

## `catalog.config.json` の主な項目
- **sizes_mm**: `M3..M24` 相当を数値配列で指定（例: `[3,4,5,6,...]`）
- **targetCount**: 出力件数の上限（例: 520）
  - 初期はパフォーマンス/検証用に cap しておき、運用で増やす前提。
- **bolts/nuts/washers**:
  - finish / pack_qty /（boltは length/strength）などの組み合わせ定義

## ID/slug の安定性
- 生成 Variant の `id` は **仕様から組み立てる決定論的文字列**です（ハッシュ無し）。
- 公開URLの slug は SEOエンジンが `id` とは別に生成しますが、同じ仕様なら必ず同じslugになります。

## 価格ルール
価格は `src/lib/pricing/rules.ts` で生成します。
- category+size のベース
- bolt は length で増減
- finish/strength の倍率
- pack は割引カーブ（大容量ほど線形より安い）

出力 `price_usd` は **整数USD（.00）** に丸めます。

## よくある運用
- **SKUを増やす**: `data/catalog.config.json` の sizes/lengths/finish/pack を追加 → `catalog:gen` → `catalog:audit`
- **件数を抑える**: `targetCount` を下げる（検証/ビルド時間短縮）

## 注意点
- pack_qty を増やした場合、DB側 `PackType` と seed のマッピングも追随が必要です（現在: 10/20/50/100）。
- shipping は現行ロジックが **10=BandA / その他=BandB** の扱いです（安全側）。厳密なband設計は v1.1 以降で調整してください。

