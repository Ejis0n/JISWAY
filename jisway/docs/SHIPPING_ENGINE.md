# SHIPPING_ENGINE (v1)

JISWAY v1 の Shipping Engine は、**リアルタイム運賃 API を使わず**、DB のルールテーブルで「送料 + キャリア + ETA」を決定します。

## 目的
- **V0 のフラット送料**の分かりやすさを維持
- 国別（ゾーン）で **送料・キャリア・ETA を出し分け**
- カート/チェックアウトで **透明な送料 + ETA 表示**
- 管理画面から **CSV でチューニング**

## コア概念
- **Zone**: 国コード(ISO2) → グループ（ASEAN / North America / EU/UK / Oceania / Other）
- **Band**: カート内 pack による区分（`BAND_A_10PCS` / `BAND_B_20PCS` / `BAND_C_BULK`）
- **Rule**: (zone, band, carrier) → price + ETA + tracking
- **CarrierPolicy**: zone ごとの carrier 選択ポリシー（DEFAULT / CHEAPEST / FASTEST）と強制 DHL 閾値
- **OrderShipping**: 注文作成時点の shipping 選択スナップショット

## Zone 解決
- 宛先 ISO2 を `ShippingZoneCountry` で引いて `ShippingZone` を決定
- 一致しない場合は `Other` をフォールバック

## Band 計算（V0 ルール踏襲）
- packType → rule band
  - `PACK_10` → `BAND_A_10PCS`
  - `PACK_20` → `BAND_B_20PCS`
  - `PACK_50/PACK_100` → `BAND_C_BULK`
- **混在時**:
  - base = band 価格の最大値
  - surcharge = 追加の distinct band ごとに **+$5**

## Carrier 選択
`CarrierPolicy` に従って `JP_POST` / `DHL` を選択します。

- **DEFAULT**
  - 基本は `defaultCarrier`（未設定なら zone 名により `Oceania => DHL` / その他 => `JP_POST`）
  - ただし閾値超過で **DHL 強制**
- **CHEAPEST**
  - (carrier 別) 総送料が最小の候補
- **FASTEST**
  - `eta_min_days` が最小の候補（同率なら安い方）

## 表示コピー（カート/チェックアウト/見積）
- Estimated delivery: `{eta_min}-{eta_max} business days`
- Carrier: `JP_POST` または `DHL`
- Duties: `Import duties and taxes are the responsibility of the recipient.`

## CSV
例ファイル:
- `docs/SHIPPING_ZONES.csv`
- `docs/SHIPPING_RULES.csv`

管理画面:
- `/admin/shipping` から `ShippingRule` を CSV Export / Import できます。

