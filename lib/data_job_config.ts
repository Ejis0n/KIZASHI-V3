/**
 * 全国データジョブの本番運用向け設定。
 * 環境変数で上書き可能。未設定時は安全側のデフォルトを使用。
 */

function envNum(key: string, defaultVal: number, min?: number, max?: number): number {
  const v = process.env[key];
  if (v === undefined || v === "") return defaultVal;
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return defaultVal;
  if (min !== undefined && n < min) return min;
  if (max !== undefined && n > max) return max;
  return n;
}

/** 一覧取得 (collect:sources) */
export const collectSourcesConfig = {
  /** 1リクエストのタイムアウト（ミリ秒） */
  fetchTimeoutMs: envNum("COLLECT_SOURCES_TIMEOUT_MS", 30_000, 5_000, 120_000),
  /** ソース間の待機（ミリ秒）。過負荷防止。0で無効。 */
  delayBetweenSourcesMs: envNum("COLLECT_SOURCES_DELAY_MS", 1_000, 0, 60_000),
  /** 失敗時のリトライ回数（1ソースあたり） */
  retryAttempts: envNum("COLLECT_SOURCES_RETRY", 2, 0, 5),
  /** リトライ時の待機（ミリ秒） */
  retryDelayMs: envNum("COLLECT_SOURCES_RETRY_DELAY_MS", 5_000, 1_000, 60_000),
} as const;

/** 詳細取得 (collect:subsidy-details) */
export const subsidyDetailsConfig = {
  /** 1ラウンドあたりの最大処理件数。0の場合は 100。 */
  batchSize: (() => {
    const n = envNum("SUBSIDY_DETAILS_BATCH", 100, 1, 500);
    return n === 0 ? 100 : n;
  })(),
  /** 1件取得後の待機（ミリ秒）。サーバー負荷軽減。 */
  delayBetweenItemsMs: envNum("SUBSIDY_DETAILS_DELAY_MS", 2_000, 500, 30_000),
  /** 1件あたりのリトライ回数 */
  retryAttempts: envNum("SUBSIDY_DETAILS_RETRY", 2, 0, 5),
  /** リトライ時の待機（ミリ秒） */
  retryDelayMs: envNum("SUBSIDY_DETAILS_RETRY_DELAY_MS", 10_000, 2_000, 120_000),
  /** 1回のスクリプト実行で最大何ラウンドまで回すか。0=1ラウンドのみ。本番フルランでは 50 などにすると全件消化しやすい。 */
  maxRounds: envNum("SUBSIDY_DETAILS_MAX_ROUNDS", 0, 0, 200),
  /** フェッチタイムアウト（ミリ秒） */
  fetchTimeoutMs: envNum("SUBSIDY_DETAILS_TIMEOUT_MS", 30_000, 5_000, 120_000),
} as const;

/** 分類 (classify:subsidies) */
export const classifyConfig = {
  /** バッチ更新の件数。0の場合は1件ずつ。 */
  batchSize: envNum("CLASSIFY_BATCH_SIZE", 200, 1, 1000),
} as const;

/** パイプライン全体 (data:full-run) */
export const pipelineConfig = {
  /** 詳細取得を何ラウンドまでループするか。0の場合はスクリプト側のデフォルト（50）。 */
  subsidyDetailsRounds: envNum("DATA_FULL_RUN_DETAILS_ROUNDS", 50, 0, 200),
} as const;
