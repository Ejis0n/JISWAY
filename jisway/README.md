# JISWAY

JIS 規格品の e-commerce + 見積・調達・送料エンジン（Next.js + Prisma + Stripe）。

## 必要な環境

- Node.js >= 20
- PostgreSQL（本番は Neon / Supabase 等を推奨）
- Stripe アカウント
- Resend（メール送信、任意）

## クイックスタート

```bash
cd jisway
cp .env.example .env
# .env に DATABASE_URL, NEXTAUTH_SECRET 等を設定

npm install
npm run db:migrate        # 開発用マイグレーション
npm run db:seed           # 管理者 + カタログ
npm run dev
```

[http://localhost:3000](http://localhost:3000) で起動。管理画面は `/admin`（要ログイン）。

## 主要スクリプト

| コマンド | 説明 |
|----------|------|
| `npm run dev` | 開発サーバー |
| `npm run build` | 本番ビルド（`prisma generate` 含む） |
| `npm run start` | 本番サーバー起動 |
| `npm run db:migrate` | 開発用マイグレーション |
| `npm run db:migrate:deploy` | **本番用**マイグレーション適用 |
| `npm run db:seed` | 管理者・カタログの seed（本番でも安全） |
| `npm run db:studio` | Prisma Studio |
| `npm run test` | テスト実行 |
| `npm run catalog:gen` | カタログ JSON 生成 |
| `npm run catalog:validate` | カタログ検証 |

## 環境変数

- **必須（本番）**: `DATABASE_URL`, `APP_BASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`
- **一覧と説明**: [docs/ENV_PRODUCTION.md](docs/ENV_PRODUCTION.md)
- **ローカル**: [.env.example](.env.example) をコピーして編集

## 本番デプロイ（Vercel）

1. リポジトリを Vercel にインポート（Node >= 20）。
2. 環境変数を **Production** に設定（上記参照）。
3. デプロイ後、本番 DB に対して **一度だけ**:
   - `npm run db:migrate:deploy`
   - `npm run db:seed`（管理者作成・カタログ投入）
4. Stripe 本番で Webhook を登録: `https://<your-domain>/api/stripe/webhook`（イベント一覧は [docs/STRIPE_PROD.md](docs/STRIPE_PROD.md) 参照）。

**詳細手順**: [docs/RUNBOOK.md](docs/RUNBOOK.md)

## ドキュメント（docs/）

| ドキュメント | 内容 |
|-------------|------|
| [ENV_PRODUCTION.md](docs/ENV_PRODUCTION.md) | 本番環境変数一覧 |
| [RUNBOOK.md](docs/RUNBOOK.md) | デプロイ手順（Vercel + Neon + Stripe） |
| [STRIPE_PROD.md](docs/STRIPE_PROD.md) | Stripe 本番チェックリスト・Webhook |
| [STRIPE_DESCRIPTOR.md](docs/STRIPE_DESCRIPTOR.md) | ディスクリプタ・領収書 |
| [SHIPPING_ENGINE.md](docs/SHIPPING_ENGINE.md) | 送料ゾーン・キャリア・見積 |
| [DISPUTE_PREVENTION.md](docs/DISPUTE_PREVENTION.md) | ディスプート対策方針 |
| [DISPUTE_PLAYBOOK.md](docs/DISPUTE_PLAYBOOK.md) | チャージバック時の手順 |
| [EVIDENCE_SCHEMA.md](docs/EVIDENCE_SCHEMA.md) | 証拠スキーマ（OrderEvidence 等） |
| [POLICY_COPY_GUIDE.md](docs/POLICY_COPY_GUIDE.md) | ポリシー文言・コピー |

## ライセンス

Private.
