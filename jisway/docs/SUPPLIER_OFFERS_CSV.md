# Supplier Offers CSV

Supplier offers は v1 では **CSVで一括取り込み**し、ルーティングエンジンの入力にします。

## 取り込み先
- UI: `/admin/suppliers/import`
- API: `POST /api/admin/offers/import`（JSONでレポートを返す）
- CLI: `npm run offers:import -- path/to/offers.csv`

## 必須カラム
- `supplier_name`
- `unit_cost_jpy`

## 推奨カラム（マッチ精度が上がる）
- `category`（bolt|nut|washer）
- `size`（M12 など）
- `length_mm`（boltのみ）
- `strength_class`（boltのみ）
- `finish`（zinc/plain/stainless など）
- `pack_qty`（10/20/50/100 など）
- `lead_time_days`
- `availability`（in_stock|limited|backorder|unknown）
- `variant_id`（任意: Variant slug を直接指定すると exact match になる）

## 例

```csv
supplier_name,category,size,length_mm,strength_class,finish,pack_qty,unit_cost_jpy,lead_time_days,availability
Supplier A,bolt,M12,50,8.8,zinc,20,120,3,in_stock
Supplier B,bolt,M12,50,8.8,zinc,20,90,10,limited
Supplier A,nut,M12,,,stainless,20,80,5,unknown
```

## 取り込みの挙動
- `supplier_name` が存在しない場合は **Supplier を新規作成**します（同名が複数ある場合は先頭を使用）。
- `variant_id` が指定され、DB上の `Variant.slug` が見つかる場合は `SupplierOffer.variantId` に紐づけます（最優先マッチ）。
- それ以外は、行の spec（nullable をワイルドカードとして扱う）でマッチされます。

