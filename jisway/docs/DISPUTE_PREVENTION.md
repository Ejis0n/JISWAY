# DISPUTE_PREVENTION (v1)

このドキュメントは **チャージバック/紛争を減らすための運用ルール**と、JISWAY 内での **証跡(エビデンス)保全**の方針をまとめたものです。
（法的助言ではありません。実務向けの最小ポリシーです。）

## 1) 争点別の標準対応

### Misorder（注文者の選定ミス：サイズ/長さ/仕様違い）
- **原則**: 注文者責任。返金/返品不可。
- **例外**: 当社 listing が誤っていた（仕様表記が間違い）場合は交換/返金対象。
- **必要証跡**
  - 注文の仕様（SKU/サイズ/長さ/pack）
  - product page の仕様表示（キャプチャ/URL）

### Damage（輸送中破損）
- **受付**: 配達完了から **7日以内** にチケット作成＋写真提出。
- **必要証跡**
  - 外装梱包（全体/ラベル/破損箇所）
  - 商品本体（破損箇所）
  - 可能なら開封時の状態

### Lost / Non-delivery（紛失/未達）
- **受付開始**: ETA を過ぎて **14営業日** 以降にケースオープン
- **対応**: キャリア手続き後、再送 or 返金（当社裁量）
- **必要証跡**
  - tracking の状態（URL/スクショ）
  - キャリアの紛失確認（可能なら）

### Customs（税関遅延）
- **原則**: 税関遅延は返金理由にならない。
- **関税/消費税**: 受取人負担。

### Billing（課金/支払い）
- 支払い方法（Stripe/請求書）と状況を確認。
- invoice（wire/USDT）注文は **原則 final sale**（当社誤配送などの例外あり）。

## 2) 重要メッセージの配置
- 商品ページ: **No substitutes** と **サイズ/長さ確認**
- カート: **支払い後に調達開始**、**関税/税金受取人負担**、**返金ポリシー同意**
- 見積: 同上（同意チェック）
- 請求書: invoice 注文は **final sale** の注意

## 3) 証跡の保存（DB）
- `SupportTicket` / `SupportAttachment`: 顧客の主張と証拠 URL
- `OrderShipping.packagingPhotoUrls` / `shipmentPhotoUrls`
- `ProcurementTask.packagingPhotoUrls` / `shipmentPhotoUrls`
- `AuditLog` / `AppEvent`: 操作ログ

## 4) 最小運用フロー（推奨）
1. 顧客は `/support` からチケット作成（order id を可能な限り付与）
2. 管理者は `/admin/support` で status を更新し、internal notes に対応方針を記録
3. 破損/未達は「写真/追跡/キャリア確認」を揃えるまで `waiting_customer`
4. 解決後 `resolved`（返金/再送などの結果を internal notes に記録）

