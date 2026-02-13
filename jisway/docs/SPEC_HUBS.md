# Spec Hub ページ（/jis/{category}/{size}）

目的:
- SKUページの発見性を上げる（内部リンクの受け皿）
- 同一サイズのバリアントをまとめ、検索意図「M12 procurement」などに対応

## URL 仕様

- 例:
  - `/jis/bolt/m12`
  - `/jis/nut/m12`
  - `/jis/washer/m12`

サイズはカタログに存在するもの（M6, M8, M10, M12, M16, M20）を対象に生成します。

## ページ内容

- タイトル: `JIS [Category] M12 Procurement`
- 2〜3行の短い導入（procurement / exact spec）
- 対象サイズ+カテゴリの全バリアントの内部リンク一覧
- 必須3行の注記:
  - No substitutes. Exact JIS specification.
  - Procured through Japan-based industrial supply chain.
  - Import duties and taxes are the responsibility of the recipient.
- JSON-LD `ItemList` を出力

## ルーティング

`/jis/[category]/[slug]` で以下のように分岐します。
- `slug` が `m12` 等のサイズ形式 → Hub として表示
- それ以外 → SKU（商品）ページとして表示

