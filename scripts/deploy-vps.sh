#!/usr/bin/env sh
# VPS 本番デプロイ: git pull → npm ci → prisma generate → build → pm2 restart
# 実行: リポジトリ直下で ./scripts/deploy-vps.sh
# 前提: .env.local が設定済み、PM2 で "kizashi" として登録済み

set -e
cd "$(dirname "$0")/.."

echo "[deploy-vps] Pulling..."
git pull

echo "[deploy-vps] Installing dependencies..."
npm ci

echo "[deploy-vps] Prisma generate..."
npx prisma generate

echo "[deploy-vps] Building..."
npm run build

if command -v pm2 >/dev/null 2>&1; then
  echo "[deploy-vps] Restarting PM2 process 'kizashi'..."
  pm2 restart kizashi
  echo "[deploy-vps] Done. Check: pm2 logs kizashi"
else
  echo "[deploy-vps] Done. PM2 not found; restart app manually (e.g. npm run start)."
fi
