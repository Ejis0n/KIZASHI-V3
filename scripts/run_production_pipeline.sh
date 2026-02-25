#!/usr/bin/env sh
# 本番データパイプラインを順に実行し、ダッシュボード用データを用意する。
# 実行: npm run data:full-run または ./scripts/run_production_pipeline.sh
# 前提: .env.local に DATABASE_URL 等が設定済みであること。
#
# 環境変数（オプション）:
#   KIZASHI_RAW_DIR          raw 保存先（未設定時は .data/raw）
#   SUBSIDY_DETAILS_MAX_ROUNDS  詳細取得の最大ラウンド数（未設定時は 50。0 のときは 1 ラウンドのみ）
#   DATA_FULL_RUN_DETAILS_ROUNDS 上記の別名（TS 側は SUBSIDY_DETAILS_MAX_ROUNDS を参照）

set -e
cd "$(dirname "$0")/.."
export KIZASHI_RAW_DIR="${KIZASHI_RAW_DIR:-$PWD/.data/raw}"

# フルラン時は詳細取得を複数ラウンド実行してキューを消化する（未設定時 50 ラウンド）
export SUBSIDY_DETAILS_MAX_ROUNDS="${SUBSIDY_DETAILS_MAX_ROUNDS:-${DATA_FULL_RUN_DETAILS_ROUNDS:-50}}"

_ts() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

_ts "[data:full-run] 1/6 seed:sources"
npx dotenv -e .env.local -- npx tsx scripts/seed-sources.ts

_ts "[data:full-run] 2/6 collect:sources"
npx dotenv -e .env.local -- npx tsx scripts/collect_sources.ts

_ts "[data:full-run] 3/6 collect:subsidy-details (max ${SUBSIDY_DETAILS_MAX_ROUNDS} rounds)"
npx dotenv -e .env.local -- npx tsx scripts/collect_subsidy_details.ts

_ts "[data:full-run] 4/6 classify:subsidies"
npx dotenv -e .env.local -- npx tsx scripts/classify_subsidies.ts

_ts "[data:full-run] 5/6 compute:municipality-scores"
npx dotenv -e .env.local -- npx tsx scripts/compute_municipality_scores.ts

_ts "[data:full-run] 6/6 compute:priority"
npx dotenv -e .env.local -- npx tsx scripts/compute_priority_municipality.ts

_ts "[data:full-run] Done. ダッシュボード: npm run dev で起動後 http://localhost:3002/app を開く"
