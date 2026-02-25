/**
 * 47都道府県分のソース登録用データ。
 * 補助金ポータル（hojyokin-portal.jp）の都道府県別一覧を取得元にしている。
 * pref_id は 1〜47（北海道〜沖縄）でポータルの都道府県IDと対応。
 */
import { getAllPrefs } from "../../lib/prefs";

const PORTAL_BASE = "https://hojyokin-portal.jp/subsidies/list";

export type SourceSeedRow = {
  prefCode: string;
  prefName: string;
  sourceType: "subsidy" | "tender";
  name: string;
  url: string;
};

export function getSourcesSeedData(): SourceSeedRow[] {
  const prefs = getAllPrefs();
  return prefs.map((p) => {
    const prefId = parseInt(p.code, 10);
    return {
      prefCode: p.code,
      prefName: p.name,
      sourceType: "subsidy",
      name: `${p.name} 補助金一覧`,
      url: `${PORTAL_BASE}?pref_id=${prefId}`,
    };
  });
}
