/**
 * デモ用：シード済みデータがある県コード。
 * 本番運用では ALLOW_DEMO_PREFS を false にし、契約県（homePrefCode / accessPrefCodes）のみ閲覧可能にする。
 */
export const DEMO_PREF_CODES = ["11", "13", "14", "02", "03", "04", "05", "06", "07"];

/** 開発・ステージングで true にすると、ホーム県設定ユーザーがデモ9県のデータも閲覧可能になる。本番では未設定または 'false' にすること。 */
export const ALLOW_DEMO_PREFS = process.env.ALLOW_DEMO_PREFS === "true";

/** デモ時: ホーム県が設定されていれば任意の県を閲覧可能（近隣・デモ9県に限らない） */
export function canViewPrefAsDemo(pref: string, homePrefCode: string | null | undefined): boolean {
  return Boolean(ALLOW_DEMO_PREFS && homePrefCode);
}
