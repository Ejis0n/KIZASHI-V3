# 次の手順（ハリ直し後）

`.env.local` に本番用の値を入れたあと、ここから進める。

---

## 1. ローカルで動かす（動作確認）

プロジェクト直下で実行。

```bash
# 依存関係（未インストールなら）
npm install

# Prisma の型生成
npx prisma generate

# DB マイグレーション（テーブル作成・更新）
npm run db:migrate

# 開発サーバー起動
npm run dev
```

ブラウザで **http://localhost:3002** を開く。

- LP: http://localhost:3002/lp  
- ログイン: http://localhost:3002/login  
- ダッシュボード: http://localhost:3002/app（要ログイン）

---

## 2. Stripe をローカルで試す（任意）

決済フローを確認する場合。

**2-1. 別ターミナルで Webhook を転送**

```bash
stripe listen --forward-to localhost:3002/api/stripe/webhook
```

表示された **`whsec_...`** を `.env.local` の `STRIPE_WEBHOOK_SECRET` に貼り、開発サーバーを再起動。

**2-2. 動作確認**

1. http://localhost:3002/login → メール入力 → ターミナルに出た URL でログイン  
2. http://localhost:3002/app → 県を選んで「保存」→「15日無料で開始」→ Checkout  
3. テストカード `4242 4242 4242 4242` で完了 → `/app` で trialing 表示を確認  

---

## 3. ダッシュボード用デモデータを入れる（任意）

補助金データがまだない場合、デモ用の priority・スコアを投入する。

```bash
npm run seed:radar-demo
```

関東3県＋東北6県のサンプルが入り、`/app` でレーダー表示が確認できる。

---

## 4. 全国データを取得する（補助金ポータル利用）

ソースは **補助金ポータル**（hojyokin-portal.jp）の都道府県別一覧に差し替え済み。`npm run seed:sources` で 47 件登録済みなら、以下で一覧→詳細→分類→スコア→優先度まで回す。

**4-1. 一覧取得（47 県分のリストページを取得し、リンクを DB に登録）**

```bash
npm run collect:sources
```

**4-2. 詳細取得〜スコアまで一括（時間がかかる。最大 50 ラウンドで詳細を消化）**

```bash
npm run data:full-run
```

※ すでに seed:sources 済みの場合は、data:full-run の 2 ステップ目（collect:sources）から実行される。詳細取得は 1 ラウンド 100 件・2 秒間隔のため、全件取り切るには複数ラウンドまたは複数回の実行が必要。

**4-3. 個別に実行する場合**

```bash
npm run collect:subsidy-details   # 100 件ずつ。SUBSIDY_DETAILS_MAX_ROUNDS=0 なら 1 回のみ
npm run classify:subsidies
npm run compute:municipality-scores
npm run compute:priority
```

途中で止めても、あとから `collect:subsidy-details` などを再実行すれば続きから可能。

---

## 5. VPS に本番デプロイする

サーバーにリポジトリを clone し、`.env.local` を本番用で用意したうえで:

```bash
cd /var/www/kizashi   # 実際のパスに合わせる

npm ci
npx prisma generate
npm run build
npx dotenv -e .env.local -- prisma migrate deploy

# PM2 で常時起動
pm2 start npm --name kizashi -- start
pm2 save && pm2 startup
```

Nginx で `kizashi.officet2.jp` → `http://127.0.0.1:3000` にプロキシし、`certbot` で SSL を付ける。  
Stripe の Webhook 本番 URL を `https://kizashi.officet2.jp/api/stripe/webhook` に登録する。

**コード更新時**

```bash
cd /var/www/kizashi
npm run deploy:vps
```

---

## よく使うコマンド一覧

| 目的           | コマンド |
|----------------|----------|
| 開発サーバー   | `npm run dev` |
| 本番ビルド     | `npm run build` |
| 本番起動       | `npm run start` |
| DB マイグレーション | `npm run db:migrate` |
| デモデータ投入 | `npm run seed:radar-demo` |
| 全国データ一括 | `npm run data:full-run` |
| VPS デプロイ   | `npm run deploy:vps` |

詳細は `README.md` を参照。
