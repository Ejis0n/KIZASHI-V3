# KIZASHI

https://kizashi.officet2.jp 向けの新規実装リポジトリ。Next.js App Router + TypeScript。Web と API は同一ドメインの `/api` で提供。

**ローカル開発**: 開発サーバーは **ポート 3002** で起動（`npm run dev` → `http://localhost:3002`）。LP は `/lp`、ダッシュボードは `/app`。料金は **9,800円/月/県**（Beta、15日無料）。

## 必要な環境

- Node.js 20 以上（`.nvmrc` または `package.json` の `engines` を参照）
- npm
- PostgreSQL（Vercel から接続可能なマネージド推奨。例: [Neon](https://neon.tech)）

## ローカル起動手順

1. リポジトリをクローン（またはこのディレクトリで作業）
2. Node バージョン合わせ（nvm 利用時）:
   ```bash
   nvm use
   ```
3. 依存関係インストール:
   ```bash
   npm install
   ```
4. 環境変数設定（後述）。**必須**: `DATABASE_URL`（Postgres）、`AUTH_SECRET`（32文字以上のランダム文字列）
5. Prisma マイグレーション適用:
   ```bash
   npx prisma generate
   npm run db:migrate
   ```
   - 初回は `DATABASE_URL` を設定したうえで上記を実行。Neon 等の接続文字列例: `postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require`
6. 開発サーバー起動:
   ```bash
   npm run dev
   ```
7. ブラウザで http://localhost:3002 を開く

### 公開 LP（/lp）

申し込み導線用のランディングページ。**ローカル**: http://localhost:3002/lp 。料金表示（9,800円/月/県）と「15日無料で開始する」ボタンで Checkout へ誘導。**本番**: https://kizashi.officet2.jp/lp 。

### 認証フロー確認（ローカル）

1. http://localhost:3002/login を開く
2. メールアドレスを入力して「ログイン用URLを送信」をクリック
3. ターミナルに表示された **URL をコピーしてブラウザで開く**（開発時はメール送信しない）
4. ログイン後 `/app` にリダイレクトされ、「あなたはログイン中です: (email)」と表示される
5. 「ログアウト」でトップへ戻る

### ローカル Stripe テスト手順

trial → active → cancel まで検証する流れは次のとおり。

① **Stripe CLI のインストールと起動**  
   Stripe CLI が未インストールの場合:
   ```bash
   brew install stripe/stripe-cli/stripe
   stripe login
   ```
   その後、Webhook をローカルに転送:
   ```bash
   stripe listen --forward-to localhost:3002/api/stripe/webhook
   ```

② **出力された `whsec_...` を `.env.local` の `STRIPE_WEBHOOK_SECRET` に設定する**  
   設定後、開発サーバーを再起動する。

③ **ローカル起動**  
   ```bash
   npm run dev
   ```

④ **流れ確認**  
   `/login` → ログイン → 県選択（保存）→ 「無料15日で開始」→ Checkout → テスト決済 → `/app` で trialing 表示 → 「解約（即停止）」→ 閲覧不可になることを確認。

---

### Stripe ローカル確認（Webhook + Checkout）（詳細）

1. **別ターミナルで Stripe CLI を起動**（Webhook をローカルに転送）:
   ```bash
   stripe listen --forward-to localhost:3002/api/stripe/webhook
   ```
   表示される `whsec_...` を `.env.local` の `STRIPE_WEBHOOK_SECRET` に設定し、開発サーバーを再起動する。

2. ブラウザで http://localhost:3002/app にログイン済みでアクセス。

3. **県選択**: ホーム県を選んで「保存」。一度保存すると変更不可（UI・API ともにブロック）。

4. **Checkout**: 「無料15日で開始」をクリック → Stripe Checkout に遷移。テスト用カード（例: 4242 4242 4242 4242）で完了。

5. **Webhook 確認**: `stripe listen` を動かしたターミナルで、`checkout.session.completed` や `customer.subscription.created` が 200 で処理されることを確認。`/app` を再読み込みすると「ステータス: trialing」「閲覧可能: ホーム県+近県4」等が表示される。

6. **解約**: 「解約（即停止）」をクリック → 確認後に即時キャンセル。Webhook で `customer.subscription.deleted` が飛び、DB 上で entitlement が canceled / accessPrefCodes が空になる。再読み込みで「閲覧可能県はありません」になる。

**Webhook 受信ログの確認方法**:
- `stripe listen` のターミナル: 各イベントごとに `POST /api/stripe/webhook` への転送結果（200/4xx/5xx）が表示される。
- アプリ側でログを出す場合は `app/api/stripe/webhook/route.ts` 内で `console.log(event.id, event.type)` 等を追加する。

## セキュリティ上の注意

- **`.env.local` は絶対に Git へ push しない**。このファイルは `.gitignore` に含まれており、コミット対象外とする。
- **本番キーとテストキーを混ぜない**。ローカルでは必ず `sk_test_...` の Stripe テストキーを使い、`STRIPE_WEBHOOK_SECRET` は `stripe listen` で表示される `whsec_...` を使用する。本番用の `sk_live_...` や本番 Webhook の `whsec_...` は `.env.local` に書かない。

## 環境変数設定手順

1. リポジトリ直下に `.env.local` を作成（存在しない場合のみ。既にある場合は上書きしない）。
2. `.env.example` をコピーするか、雛形として用意された `.env.local` のプレースホルダを実際の値に書き換える:
   ```bash
   cp .env.example .env.local
   ```
   または、既にプレースホルダ入りの `.env.local` が生成されている場合は、そのファイルの値を編集する。
3. **必須（認証・DB）**:
   - `AUTH_SECRET`: 32文字以上のランダム文字列（例: `openssl rand -base64 32`）
   - `DATABASE_URL`: Postgres 接続文字列。Neon の場合: ダッシュボードの Connection string（例: `postgresql://USER:PASSWORD@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`）。Vercel から到達できるホストであること。
4. **Stripe（請求・Webhook）**:
   - `STRIPE_SECRET_KEY`: Stripe のシークレットキー（テストは `sk_test_...`）
   - `STRIPE_WEBHOOK_SECRET`: ローカルは `stripe listen` で表示される `whsec_...`。本番は Stripe ダッシュボードで Webhook URL 登録時に発行。
   - `STRIPE_PRICE_ID_BETA`: サブスク用 Price ID（trial 15日で使用）
   - `APP_URL`: 本番は `https://kizashi.officet2.jp`、ローカルは `http://localhost:3002`
5. **日次メールダイジェスト（VPSで実行する場合）**  
   - `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` または `SMTP_PASSWORD`（または `EMAIL_SERVER_*`）  
   - 例: `SMTP_HOST=...`、`SMTP_PORT=587`、`SMTP_USER=...`、`SMTP_PASS=...` または `SMTP_PASSWORD=...`  
   - `SMTP_FROM` または `EMAIL_FROM` または `MAIL_FROM`: 送信元表示。`APP_URL`: メール内リンクのベースURL。
6. 本番・Vercel では Vercel ダッシュボードの「Environment Variables」で同じ項目を設定（ドメイン設定は別途）

## API

### GET /api/health

ヘルスチェック。常に JSON で `ok`, `ts`, `env` を返す。

**例（ローカル）:**

```bash
curl http://localhost:3002/api/health
```

**レスポンス例:**

```json
{
  "ok": true,
  "ts": "2025-02-19T01:00:00.000Z",
  "env": "dev"
}
```

### GET /api/version

ビルド/デプロイ識別用。git sha またはビルド情報を返す（Vercel では `VERCEL_GIT_COMMIT_SHA` を利用）。

### GET /api/me（要ログイン）

ログイン中のユーザー情報を返す。未ログインは 401。

**例（ログイン済みセッションの Cookie 付き）:**

```bash
curl -b cookies.txt http://localhost:3002/api/me
```

**レスポンス例:**

```json
{
  "email": "user@example.com",
  "role": "user",
  "entitlement": {
    "status": "inactive",
    "trialEndAt": null,
    "homePrefCode": "13",
    "accessPrefCodes": []
  }
}
```

### POST /api/app/home-pref（要ログイン）

ホーム県を初回のみ設定。body: `{ "prefCode": "13" }`。既に設定済みの場合は 400（変更不可）。

### POST /api/billing/checkout（要ログイン）

Stripe Checkout Session 作成（trial 15日）。homePrefCode 未設定は 400、既に有効なサブスクありは 409。レスポンス: `{ "url": "https://checkout.stripe.com/..." }`。

### POST /api/billing/cancel（要ログイン）

サブスクを即時キャンセル。Webhook で entitlement が停止に反映される。

### POST /api/stripe/webhook

Stripe Webhook 受信（署名検証・冪等化あり）。本番 URL: `https://kizashi.officet2.jp/api/stripe/webhook`。イベント: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`。

## Vercel にデプロイする際の注意

- GitHub と Vercel を連携し、このリポジトリをインポート
- 環境変数は `.env.example` の項目を Vercel の「Environment Variables」に登録（値は本番用に設定）
- ドメイン `kizashi.officet2.jp` の設定は Vercel の「Domains」で後から行ってよい
- ビルドコマンド: `npm run build`、出力: Next.js のデフォルト（設定不要）

## VPS デプロイ・本番運用開始

VPS 上で Next.js を動かし、全国データジョブを cron で回す場合の手順。ドメインは `kizashi.officet2.jp`、料金 9,800円/月/県 の本番運用を想定。

### 前提

- **サーバー**: Ubuntu 22.04 等（root または sudo あり）
- **Node.js 20 以上**: `nvm` または `nodesource` でインストール
- **PostgreSQL**: 同一サーバーでもリモート（Neon 等）でも可。`DATABASE_URL` で接続
- **ドメイン**: `kizashi.officet2.jp` を VPS の A レコードで向けておく

### 1. リポジトリ・環境変数

```bash
cd /var/www  # 任意のディレクトリ
git clone <このリポジトリのURL> kizashi
cd kizashi
cp .env.example .env.local
```

`.env.local` を**本番用**に編集する:

- `APP_URL=https://kizashi.officet2.jp`
- `AUTH_SECRET`: 本番用に別の 32 文字以上
- `DATABASE_URL`: 本番 Postgres 接続文字列
- `STRIPE_SECRET_KEY`: **本番**の `sk_live_...`
- `STRIPE_WEBHOOK_SECRET`: Stripe ダッシュボードで本番 Webhook URL を登録したときに発行される `whsec_...`
- `STRIPE_PRICE_ID_BETA`: 9,800円/月・15日無料 trial の本番 Price ID
- `STRIPE_PRICE_ID_REGULAR`: 29,800円/月のレギュラープラン Price ID（任意）
- SMTP / `MAIL_FROM` / `ADMIN_ALERT_EMAIL`: 日次メール・管理者アラート用
- **`ALLOW_DEMO_PREFS`**: 本番では**未設定**または `false`（契約県のみ閲覧）

### 2. ビルド・マイグレーション

```bash
npm ci
npx prisma generate
npm run build
npx dotenv -e .env.local -- prisma migrate deploy
```

- 初回のみ必要に応じて `npm run seed:sources` でソース登録（その後 `prisma/seeds/sources-data.ts` の URL を各県の実際のページに差し替えてから再実行可）。

### 3. プロセス管理（PM2 推奨）

```bash
npm install -g pm2
pm2 start npm --name kizashi -- start
pm2 save && pm2 startup
```

- Next.js は `npm run start` でポート **3000** で起動。PM2 が再起動時も自動で立ち上げる。

### 4. Nginx リバースプロキシ + SSL

Nginx をインストールし、`/etc/nginx/sites-available/kizashi` を用意（例）:

```nginx
server {
    listen 80;
    server_name kizashi.officet2.jp;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

有効化・SSL（Let's Encrypt）:

```bash
sudo ln -s /etc/nginx/sites-available/kizashi /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d kizashi.officet2.jp
```

### 5. Stripe Webhook 本番登録

- [Stripe ダッシュボード](https://dashboard.stripe.com/webhooks) → 本番で「エンドポイントを追加」
- URL: `https://kizashi.officet2.jp/api/stripe/webhook`
- イベント: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
- 署名シークレット（`whsec_...`）を `.env.local` の `STRIPE_WEBHOOK_SECRET` に設定し、アプリを再起動（`pm2 restart kizashi`）。

### 6. データジョブの cron

VPS 上でジョブを回す場合。`/var/www/kizashi` に clone している前提。環境変数は `dotenv -e .env.local` で読み込む。

```bash
crontab -e
```

例（ユーザー `www-data` や専用ユーザーで実行する場合はパス・ユーザーを合わせる）:

```cron
# 一覧取得 12時間ごと
0 */12 * * * cd /var/www/kizashi && npx dotenv -e .env.local -- npx tsx scripts/collect_sources.ts >> /var/log/kizashi/collect_sources.log 2>&1

# 詳細取得 1日2回（6:00, 18:00）
0 6,18 * * * cd /var/www/kizashi && npx dotenv -e .env.local -- npx tsx scripts/collect_subsidy_details.ts >> /var/log/kizashi/collect_subsidy_details.log 2>&1

# 分類 1日2回（details の 30 分後）
30 6,18 * * * cd /var/www/kizashi && npx dotenv -e .env.local -- npx tsx scripts/classify_subsidies.ts >> /var/log/kizashi/classify.log 2>&1

# スコア・優先度 毎日 3:00, 5:30
0 3 * * * cd /var/www/kizashi && npx dotenv -e .env.local -- npx tsx scripts/compute_municipality_scores.ts >> /var/log/kizashi/compute_scores.log 2>&1
30 5 * * * cd /var/www/kizashi && npx dotenv -e .env.local -- npx tsx scripts/compute_priority_municipality.ts >> /var/log/kizashi/compute_priority.log 2>&1

# 日次メール 毎日 7:00
0 7 * * * cd /var/www/kizashi && npx dotenv -e .env.local -- npx tsx scripts/send_daily_digest.ts >> /var/log/kizashi/daily_digest.log 2>&1
```

ログ用ディレクトリ: `sudo mkdir -p /var/log/kizashi && sudo chown $USER /var/log/kizashi`（必要に応じて）。

### 7. デプロイ更新（コード反映）

```bash
cd /var/www/kizashi
npm run deploy:vps
# または
./scripts/deploy-vps.sh
```

手動で行う場合:

```bash
git pull
npm ci
npx prisma generate
npm run build
pm2 restart kizashi
```

- DB スキーマ変更がある場合は `npx dotenv -e .env.local -- prisma migrate deploy` を追加。

### 8. ログ・監視

- **アプリ**: `pm2 logs kizashi` / `pm2 monit`
- **ヘルス**: `curl -s https://kizashi.officet2.jp/api/health`
- **ジョブログ**: `/var/log/kizashi/*.log`。失敗時は `source_fetch_runs` / `source_fetch_items.lastError` / `email_digest_logs` を DB で確認。

---

## スクリプト

| コマンド           | 説明                 |
| ------------------ | -------------------- |
| `npm run dev`      | 開発サーバー起動     |
| `npm run build`    | 本番ビルド           |
| `npm run start`    | 本番サーバー起動     |
| `npm run lint`     | ESLint 実行          |
| `npm run db:generate` | Prisma Client 生成 |
| `npm run db:migrate`  | マイグレーション適用（開発） |
| `npm run db:push`     | スキーマを DB に反映（プロトタイプ用） |
| `npm run deploy:vps`  | VPS 本番デプロイ（pull → ci → build → pm2 restart） |

## DB スキーマ（Prisma）

- **User**: id, email, role ("user" | "admin"), Auth.js 用の name / emailVerified / image、createdAt / updatedAt
- **Entitlement**: 1ユーザー1件。homePrefCode（初回のみ設定・変更不可）, accessPrefCodes（trial=home+近県4、paid=homeのみ、停止時=[]）, status, trialEndAt
- **StripeLink**: 1ユーザー1件。customerId, subscriptionId, priceId, subscriptionStatus, currentPeriodEnd
- **WebhookEvent**: 冪等化用。eventId, type, processedAt, status (ok/error), error
- Auth.js 用: Account, Session, VerificationToken

## 動作確認チェックリスト（Stripe）

- [ ] **LP（/lp）**の「15日無料で開始する」から Checkout に遷移し、ログイン〜テスト決済で申し込み完了までできる
- [ ] 県選択 → 保存 → 再度変更しようとすると API が 400 を返す（ロック）
- [ ] 「無料15日で開始」→ Stripe Checkout に遷移し、テスト決済で完了できる
- [ ] `stripe listen` で Webhook が 200 で返る（`checkout.session.completed` 等）
- [ ] /app でステータスが trialing、閲覧可能が「ホーム県+近県4」になる
- [ ] 解約 → 即停止し、DB 上で accessPrefCodes が空になる（/api/me や /app で確認）
- [ ] admin は /app で「全県閲覧（管理者）」と表示される

## 次にやるべきこと（ローカル E2E まで）

以下を順にやると、trial → active → cancel まで検証できます。

1. **`.env.local` のプレースホルダを実際の値に置き換える**
   - `AUTH_SECRET`: 32文字以上のランダム文字列（例: `openssl rand -base64 32`）。未設定ならターミナルで `openssl rand -base64 32` を実行して貼り付け。
   - `DATABASE_URL`: [Neon](https://neon.tech) で「New Project」→ 作成後「Connection string」をコピー。形式は `postgresql://USER:PASSWORD@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`（`PORT` は含めない）。
   - `STRIPE_SECRET_KEY`: [Stripe ダッシュボード](https://dashboard.stripe.com/test/apikeys) の「テスト用のシークレットキー」（`sk_test_...`）。
   - `STRIPE_PRICE_ID_BETA`: Stripe で **9,800円/月** の定額・月次価格を作成し、その Price ID を設定。15日無料はアプリ側で Checkout 時に付与するため、Stripe の価格では「無料トライアル」を選ばなくてよい。[Stripe ダッシュボード](https://dashboard.stripe.com/products) → 商品 → 価格を追加 → 定額・月次・9,800円 → 保存後の Price ID をコピー。
   - `STRIPE_PRICE_ID_REGULAR`: レギュラープラン用。**29,800円/月** の価格を同様に作成し、その Price ID を設定（任意）。
   - `STRIPE_WEBHOOK_SECRET`: いったん空のままでよい（ステップ3で `stripe listen` の値を入れる）。

2. **DB の準備**  
   `DATABASE_URL` を設定したあとで実行する。
   ```bash
   npx prisma generate
   npm run db:migrate
   ```
   ※ `db:migrate` は `.env.local` を読む。Neon の URL を入れてから実行すること。

3. **Stripe CLI で Webhook を転送**
   - [Stripe CLI](https://docs.stripe.com/stripe-cli) をインストール後、別ターミナルで:
   ```bash
   stripe listen --forward-to localhost:3002/api/stripe/webhook
   ```
   - 表示された **`whsec_...`** を `.env.local` の `STRIPE_WEBHOOK_SECRET` に貼り付け、保存。

4. **開発サーバー起動**
   ```bash
   npm run dev
   ```

5. **ブラウザで E2E の流れを確認**
   - http://localhost:3002/login → メール入力 → ターミナルに出た URL でログイン
   - http://localhost:3002/app → 県を選んで「保存」→「無料15日で開始」→ Stripe Checkout（テストカード `4242 4242 4242 4242`）で完了
   - `/app` を再読み込み → 「ステータス: trialing」「閲覧可能: ホーム県+近県4」を確認
   - 「解約（即停止）」→ 確認 → 再読み込みで「閲覧可能県はありません」になることを確認
   - `stripe listen` のターミナルで各イベントが **200** で返っていることを確認

ここまでできれば「次にやるべきこと」は完了。以降は本番デプロイや全国データジョブ等に進める。

---

## 全国ソースレジストリ＋収集ジョブ（PROMPT 04）

補助金/入札の「取得元URL」を登録し、VPS で定期的に取得して raw 保存・DB にログを残す。

### マイグレーション・seed

1. **マイグレーション適用**（sources_registry / source_fetch_runs / source_fetch_items）:
   ```bash
   npm run db:migrate
   ```
2. **ソース登録（47都道府県・1件ずつ subsidy）**:
   ```bash
   npm run seed:sources
   ```
   - 登録一覧がターミナルに出力される。**URL は要確認・差し替え**: 編集対象は `prisma/seeds/sources-data.ts` の `getSourcesSeedData()` 内で各県の `url`。現在はプレースホルダ（`https://www.pref.{domain}.lg.jp/site/subsidy/`）なので、本番で `collect:sources` を回す前に各県の実際の補助金一覧ページ URL に差し替えること。

### Raw 保存先

- デフォルト: プロジェクト直下の `.data/raw`（`KIZASHI_RAW_DIR` 未設定時）。パスは `{RAW_BASE}/{pref_code}/{source_type}/{YYYYMMDD}/{timestamp}.html` など。
- 環境変数で変更: `KIZASHI_RAW_DIR=/path/to/raw`

**手順（VPS / ローカル共通）**:
```bash
# 未設定時はプロジェクト内 .data/raw を使用
mkdir -p .data/raw
# または別ディレクトリを指定
export KIZASHI_RAW_DIR=/var/lib/kizashi/raw
mkdir -p "$KIZASHI_RAW_DIR"
```

### 収集ジョブの実行

- **ローカル**（DATABASE_URL 必須）:
  ```bash
  npm run collect:sources
  ```
- **VPS**（cron 例）:
  ```bash
  # 12時間ごと
  0 */12 * * * cd /path/to/KZASHI-V3 && dotenv -e .env.local -- npx tsx scripts/collect_sources.ts >> /var/log/kizashi-collect.log 2>&1
  ```
  ```bash
  # 1時間ごと
  0 * * * * cd /path/to/KZASHI-V3 && dotenv -e .env.local -- npx tsx scripts/collect_sources.ts >> /var/log/kizashi-collect.log 2>&1
  ```

### 失敗時の確認

- **DB で実行ログを確認**:
  - `source_fetch_runs`: 各実行の status（success/failed）、httpStatus、error、rawPath
  - 連続失敗は `error` にタイムアウト/403/HTTP status 等が入る
- **管理者用ヘルス API**:
  - `GET /api/admin/sources/health`（admin のみ）
  - 県別: 有効ソース数、直近24h 成功/失敗数、lastSuccessAt、failStreak（連続失敗数）
- **/app ダッシュボード**: 管理者でログインすると「ソース取得ヘルス」テーブルが表示される

### 注意

- robots.txt やサイト規約に反しない範囲で取得すること。403 が多い場合は User-Agent や取得間隔（fetch_interval_minutes）の調整を検討する。

---

## 補助金詳細取得（PROMPT 05）

一覧リンク（source_fetch_items）から詳細ページを取得し、タイトル・期間・市町村・ステータスを抽出して `subsidy_items` に保存する。

### マイグレーション

```bash
npm run db:migrate
```
（`subsidy_items` テーブルが追加される）

### 実行コマンド

| コマンド | 説明 |
|----------|------|
| `npm run collect:sources` | 一覧ページ取得・source_fetch_items 投入（既存） |
| `npm run collect:subsidy-details` | 詳細ページ取得・日付/市町村抽出・subsidy_items upsert |
| `npm run classify:subsidies` | 補助金タイプ分類（title+summary のキーワード辞書で category 更新） |
| `npm run compute:municipality-scores` | 市町村スコア・営業用brief（全体＋タイプ別）算出 |
| `npm run compute:priority` | 県ごと最優先1市町村算出（priority_municipalities に upsert） |
| `npm run send:daily-digest` | 日次メールダイジェスト送信（契約中ユーザーへ home 県の TOP5・タイプ別・直近締切＋最優先） |
| `npm run seed:radar-demo` | ダッシュボード用デモ実データ投入（関東3県＋東北6県の priority / scores / briefs）。テーブル作成後（`db:push` 等）に実行。 |
| `npm run data:full-run` | 本番データパイプラインを1回だけ通しで実行（seed:sources → collect:sources → collect:subsidy-details → classify:subsidies → compute:municipality-scores → compute:priority）。完了後は `/app` でダッシュボードを表示。 |

### 実行順序（推奨）

1. `collect:sources`
2. `collect:subsidy-details`
3. `classify:subsidies`
4. `compute:municipality-scores`
5. `compute:priority`（メールの前に実行）
6. `send:daily-digest`

**一括実行**: `npm run data:full-run` で上記 1〜5（seed:sources 含む）を順に実行できる。RAW 保存先は `KIZASHI_RAW_DIR` 未設定時はプロジェクト直下の `.data/raw`。フルラン時は詳細取得を**複数ラウンド**（デフォルト 50 ラウンド）実行してキューを消化する。完了後に `npm run dev` で起動し `http://localhost:3002/app` でダッシュボードを開く。

### 全国データジョブの本番運用（環境変数・リトライ・フルラン）

ジョブの挙動は `lib/data_job_config.ts` で読み込む環境変数で調整できる。未設定時は安全側のデフォルトを使用。

| 環境変数 | 対象 | デフォルト | 説明 |
|----------|------|------------|------|
| `KIZASHI_RAW_DIR` | 全体 | `.data/raw`（プロジェクト内） | 一覧・詳細 HTML の保存先 |
| `COLLECT_SOURCES_TIMEOUT_MS` | collect:sources | 30000 | 1リクエストのタイムアウト（ミリ秒） |
| `COLLECT_SOURCES_DELAY_MS` | collect:sources | 1000 | ソース間の待機（ミリ秒）。0 で無効。 |
| `COLLECT_SOURCES_RETRY` | collect:sources | 2 | 失敗時のリトライ回数 |
| `COLLECT_SOURCES_RETRY_DELAY_MS` | collect:sources | 5000 | リトライ時の待機（ミリ秒） |
| `SUBSIDY_DETAILS_BATCH` | collect:subsidy-details | 100 | 1ラウンドあたりの最大処理件数 |
| `SUBSIDY_DETAILS_DELAY_MS` | collect:subsidy-details | 2000 | 1件取得後の待機（ミリ秒） |
| `SUBSIDY_DETAILS_RETRY` | collect:subsidy-details | 2 | 1件あたりのリトライ回数 |
| `SUBSIDY_DETAILS_RETRY_DELAY_MS` | collect:subsidy-details | 10000 | リトライ時の待機（ミリ秒） |
| `SUBSIDY_DETAILS_MAX_ROUNDS` | collect:subsidy-details | 0（1回のみ） | 1回のスクリプト実行で最大何ラウンドまで回すか。フルラン時は `run_production_pipeline.sh` が 50 を指定。 |
| `CLASSIFY_BATCH_SIZE` | classify:subsidies | 200 | 分類のバッチ更新件数 |

- **リトライ**: 一覧取得・詳細取得で一時的なネットワークエラー時に自動リトライする。
- **フルラン**: `npm run data:full-run` 実行時は `SUBSIDY_DETAILS_MAX_ROUNDS=50` 相当で詳細取得を複数ラウンド回し、キューが空になるか上限まで処理する。最初から全国を一気に取りたい場合に利用する。
- **cron 運用**: 通常は各ジョブを個別に cron で回し、`SUBSIDY_DETAILS_MAX_ROUNDS` は 0（未設定）のままで 1 回あたり 100 件ずつ消化する。

### 実行頻度の目安（cron）

- **collect:sources**: 12時間ごと（例: `0 */12 * * *`）
- **collect:subsidy-details**: 1日2回（例: `0 6,18 * * *`）。1 run あたり最大 100 件（`SUBSIDY_DETAILS_BATCH`）、リクエスト間隔 2 秒（`SUBSIDY_DETAILS_DELAY_MS`）。
- **classify:subsidies**: 1日2回（details の後。例: `30 6,18 * * *`）
- **compute:municipality-scores**: 1日1回深夜（例: `0 3 * * *`）
- **compute:priority**: 毎日1回（メール送信の前。例: `30 5 * * *`）
- **send:daily-digest**: 毎日1回（例: `0 7 * * *`）

### 日次メールダイジェスト（send:daily-digest）

- **送信対象**: `user.role !== admin`、`entitlement.status` が trialing または active、`homePrefCode` があるユーザー。1ユーザー1通（home 県のみ）。
- **二重送信防止**: `email_digest_logs` の unique (userId, digestDate) で同日は1回のみ。
- **ローカルで dry-run（送信せず内容だけ確認）**:  
  `DRY_RUN=1 npm run send:daily-digest` または `dotenv -e .env.local -- env DRY_RUN=1 npx tsx scripts/send_daily_digest.ts`  
  先頭1ユーザー分の件名・本文（text）が標準出力に表示されます。

### 失敗時の見方

- **source_fetch_runs**: 一覧取得の成功/失敗
- **source_fetch_items.lastError**: 詳細取得に失敗したリンクの原因
- **subsidy_items.parse_confidence**: 抽出の信頼度（0–100）。低い場合は日付・市町村が取れていない可能性
- **municipality_scores / municipality_briefs**: ジョブ失敗時はログと DB を確認。`computed_at` の更新有無、該当県の件数。`subsidy_items` に active/upcoming が無い県はスコア 0 の「県全域」のみになる場合あり。`category` は `ALL`（全体）とタイプ別（DEMOLITION 等）で別行。
- **subsidy_items.category**: `classify:subsidies` で更新。未実行なら null のまま。辞書は `lib/subsidy_taxonomy.ts`。誤分類は辞書のキーワード追加で改善可能。
- **email_digest_logs**: 日次メールの送信ログ。`status` が sent/failed/skipped。失敗時は `error` を確認。管理者は `/app` の「日次メールダイジェスト（直近7日）」で sent/failed/skipped 件数と失敗エラー上位を確認可能。
- **priority_municipalities**: 県ごと最優先1市町村。`compute:priority` で更新。unique(prefCode) で二重防止。`reasonJson` で加点内訳を確認可能。

### ダッシュボード用デモデータ（実データ未取得時）

補助金クロールや `compute:municipality-scores` をまだ回していない環境で、レーダー端末ダッシュボードを実データ風で確認したい場合に使う。

1. マイグレーション済みであること: `npm run db:push` または `npm run db:migrate`
2. 投入: `npm run seed:radar-demo`

関東3県（東京都・神奈川県・埼玉県）と東北6県（青森・岩手・宮城・秋田・山形・福島）について、Lock Target / Scan Result / Deadline Radar / Category Cluster 用の priority・municipality_scores・municipality_briefs が投入される。ホーム県をいずれかに設定したユーザーで `/app` にアクセスすると表示される。

### リアルデータ本番運用（県の閲覧制限）

本番では**契約県のみ**閲覧可能にし、デモ用の「他県も選べる」挙動を無効にする。

- **環境変数 `ALLOW_DEMO_PREFS`**
  - **未設定または `false`（本番）**: ユーザーは **ホーム県（homePrefCode）** および **契約県（accessPrefCodes）** のデータのみ閲覧可能。表示県セレクトには契約県だけが並ぶ（1県契約なら1件のみ）。
  - **`true`（開発・ステージング）**: ホーム県が設定されていれば、シード済みデモ9県（関東3＋東北6）のデータも閲覧・表示県で選択可能。

- **本番デプロイ時**: `.env` や Vercel の Environment Variables に **`ALLOW_DEMO_PREFS` を設定しない**、または **`ALLOW_DEMO_PREFS=false`** にしておく。これで priority / top / detail / subsidies の各 API とダッシュボードの表示県リストが契約県のみに制限される。

- 実データは `collect:sources` → `collect:subsidy-details` → `classify:subsidies` → `compute:municipality-scores` → `compute:priority` の順で投入・更新する。

---

## 今後の工程

- 全国データジョブの URL 充実（各県の実際の補助金一覧 URL への差し替え・追加）
- コンテンツ・県別データの実装
