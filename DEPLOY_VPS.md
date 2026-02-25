# VPS 本番デプロイ チェックリスト

`kizashi.officet2.jp` で本番運用するときの手順。サーバーに SSH ログインしてから順に実行する。

---

## SSH 接続

```bash
ssh -p 10022 root@163.44.99.98
```

（パスワードまたは鍵でログイン。接続できたら以下の手順を VPS 上で実行する。）

---

## 前提

- [ ] Ubuntu 22.04 等（sudo あり）
- [ ] Node.js 20 以上（`nvm use` または `node -v` で確認）
- [ ] ドメイン `kizashi.officet2.jp` の A レコードが VPS の IP を向いている
- [ ] PostgreSQL（Neon 等）の本番接続文字列を用意済み

---

## Step 1: リポジトリ取得と環境変数

```bash
cd /var/www
sudo mkdir -p /var/www && sudo chown $USER /var/www
git clone <このリポジトリのURL> kizashi
cd kizashi
cp .env.example .env.local
nano .env.local   # または vi
```

**.env.local で本番用に設定する項目:**

| 項目 | 値 |
|------|-----|
| APP_URL | `https://kizashi.officet2.jp` |
| AUTH_SECRET | `openssl rand -base64 32` で生成した本番用 |
| DATABASE_URL | 本番 Postgres 接続文字列 |
| STRIPE_SECRET_KEY | 本番 `sk_live_...` |
| STRIPE_WEBHOOK_SECRET | 後で Step 5 で設定 |
| STRIPE_PRICE_ID_BETA | 9,800円/月の本番 Price ID |
| SMTP_* / MAIL_FROM | 日次メール用 |
| ADMIN_ALERT_EMAIL | 任意 |
| ALLOW_DEMO_PREFS | **未設定** または `false` |

---

## Step 2: ビルド・マイグレーション

```bash
cd /var/www/kizashi
npm ci
npx prisma generate
npm run build
npx dotenv -e .env.local -- prisma migrate deploy
```

（初回のみ）ソース登録:

```bash
npm run seed:sources
```

---

## Step 3: PM2 で常時起動

```bash
npm install -g pm2
pm2 start npm --name kizashi -- start
pm2 save
pm2 startup   # 表示されたコマンドをそのまま実行
```

---

## Step 4: Nginx + SSL

```bash
sudo nano /etc/nginx/sites-available/kizashi
```

以下を貼り付けて保存:

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

有効化・SSL:

```bash
sudo ln -s /etc/nginx/sites-available/kizashi /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d kizashi.officet2.jp
```

---

## Step 5: Stripe Webhook 本番登録

1. [Stripe ダッシュボード](https://dashboard.stripe.com/webhooks)（**ライブモード**）→「エンドポイントを追加」
2. URL: `https://kizashi.officet2.jp/api/stripe/webhook`
3. イベント: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
4. 作成後に表示される **署名シークレット（whsec_...）** をコピー
5. VPS の `.env.local` の `STRIPE_WEBHOOK_SECRET=` に貼り付け
6. `pm2 restart kizashi`

---

## Step 6: ログ用ディレクトリ（cron 用）

```bash
sudo mkdir -p /var/log/kizashi
sudo chown $USER /var/log/kizashi
```

---

## Step 7: cron でデータジョブ（任意）

```bash
crontab -e
```

以下を追加（パスは `/var/www/kizashi` に合わせる）:

```cron
0 */12 * * * cd /var/www/kizashi && npx dotenv -e .env.local -- npx tsx scripts/collect_sources.ts >> /var/log/kizashi/collect_sources.log 2>&1
0 6,18 * * * cd /var/www/kizashi && npx dotenv -e .env.local -- npx tsx scripts/collect_subsidy_details.ts >> /var/log/kizashi/collect_subsidy_details.log 2>&1
30 6,18 * * * cd /var/www/kizashi && npx dotenv -e .env.local -- npx tsx scripts/classify_subsidies.ts >> /var/log/kizashi/classify.log 2>&1
0 3 * * * cd /var/www/kizashi && npx dotenv -e .env.local -- npx tsx scripts/compute_municipality_scores.ts >> /var/log/kizashi/compute_scores.log 2>&1
30 5 * * * cd /var/www/kizashi && npx dotenv -e .env.local -- npx tsx scripts/compute_priority_municipality.ts >> /var/log/kizashi/compute_priority.log 2>&1
0 7 * * * cd /var/www/kizashi && npx dotenv -e .env.local -- npx tsx scripts/send_daily_digest.ts >> /var/log/kizashi/daily_digest.log 2>&1
```

---

## 確認

- ブラウザで https://kizashi.officet2.jp を開く
- https://kizashi.officet2.jp/api/health で `{"ok":true,...}` を確認
- ログイン → 県選択 → ダッシュボード表示を確認

---

## 以降のコード更新

```bash
cd /var/www/kizashi
npm run deploy:vps
```

DB スキーマ変更がある場合:

```bash
npx dotenv -e .env.local -- prisma migrate deploy
pm2 restart kizashi
```
