/**
 * 47都道府県マスタ（JISコード01-47）
 * neighbors: 隣接県コード。不足時は同地方で補完して「近県+4」とする。
 */
export const PREF_LIST: { code: string; name: string; neighbors: string[]; region: string }[] = [
  { code: "01", name: "北海道", neighbors: [], region: "北海道" },
  { code: "02", name: "青森県", neighbors: ["01", "03", "05"], region: "東北" },
  { code: "03", name: "岩手県", neighbors: ["02", "04", "05", "06"], region: "東北" },
  { code: "04", name: "宮城県", neighbors: ["03", "06", "07"], region: "東北" },
  { code: "05", name: "秋田県", neighbors: ["02", "03", "06", "07"], region: "東北" },
  { code: "06", name: "山形県", neighbors: ["03", "04", "05", "07", "15"], region: "東北" },
  { code: "07", name: "福島県", neighbors: ["04", "05", "06", "08", "09", "10", "15"], region: "東北" },
  { code: "08", name: "茨城県", neighbors: ["07", "09", "11", "12"], region: "関東" },
  { code: "09", name: "栃木県", neighbors: ["07", "08", "10", "11", "20"], region: "関東" },
  { code: "10", name: "群馬県", neighbors: ["07", "09", "11", "15", "20"], region: "関東" },
  { code: "11", name: "埼玉県", neighbors: ["08", "09", "10", "12", "13", "20"], region: "関東" },
  { code: "12", name: "千葉県", neighbors: ["08", "11", "13", "14"], region: "関東" },
  { code: "13", name: "東京都", neighbors: ["11", "12", "14", "19"], region: "関東" },
  { code: "14", name: "神奈川県", neighbors: ["12", "13", "19", "22"], region: "関東" },
  { code: "15", name: "新潟県", neighbors: ["06", "07", "10", "16", "20"], region: "中部" },
  { code: "16", name: "富山県", neighbors: ["15", "17", "20", "21"], region: "中部" },
  { code: "17", name: "石川県", neighbors: ["16", "18", "21"], region: "中部" },
  { code: "18", name: "福井県", neighbors: ["17", "21", "25"], region: "中部" },
  { code: "19", name: "山梨県", neighbors: ["11", "13", "14", "20", "22"], region: "中部" },
  { code: "20", name: "長野県", neighbors: ["09", "10", "15", "16", "19", "21", "22", "23"], region: "中部" },
  { code: "21", name: "岐阜県", neighbors: ["16", "17", "18", "20", "23", "24", "25"], region: "中部" },
  { code: "22", name: "静岡県", neighbors: ["14", "19", "20", "23"], region: "中部" },
  { code: "23", name: "愛知県", neighbors: ["20", "21", "22", "24"], region: "中部" },
  { code: "24", name: "三重県", neighbors: ["21", "23", "25", "26", "30"], region: "近畿" },
  { code: "25", name: "滋賀県", neighbors: ["18", "21", "24", "26", "27"], region: "近畿" },
  { code: "26", name: "京都府", neighbors: ["24", "25", "27", "28", "30"], region: "近畿" },
  { code: "27", name: "大阪府", neighbors: ["25", "26", "28", "29", "30"], region: "近畿" },
  { code: "28", name: "兵庫県", neighbors: ["26", "27", "31", "33", "36"], region: "近畿" },
  { code: "29", name: "奈良県", neighbors: ["24", "26", "27", "30"], region: "近畿" },
  { code: "30", name: "和歌山県", neighbors: ["24", "26", "27", "29"], region: "近畿" },
  { code: "31", name: "鳥取県", neighbors: ["28", "32", "33", "34"], region: "中国" },
  { code: "32", name: "島根県", neighbors: ["31", "33", "35"], region: "中国" },
  { code: "33", name: "岡山県", neighbors: ["28", "31", "32", "34", "37"], region: "中国" },
  { code: "34", name: "広島県", neighbors: ["31", "33", "35", "38"], region: "中国" },
  { code: "35", name: "山口県", neighbors: ["32", "34", "40"], region: "中国" },
  { code: "36", name: "徳島県", neighbors: ["28", "37", "39"], region: "四国" },
  { code: "37", name: "香川県", neighbors: ["33", "36", "38"], region: "四国" },
  { code: "38", name: "愛媛県", neighbors: ["34", "37", "39"], region: "四国" },
  { code: "39", name: "高知県", neighbors: ["36", "38"], region: "四国" },
  { code: "40", name: "福岡県", neighbors: ["35", "41", "43"], region: "九州" },
  { code: "41", name: "佐賀県", neighbors: ["40", "42", "43"], region: "九州" },
  { code: "42", name: "長崎県", neighbors: ["41"], region: "九州" },
  { code: "43", name: "熊本県", neighbors: ["40", "41", "44", "45", "46"], region: "九州" },
  { code: "44", name: "大分県", neighbors: ["43", "45"], region: "九州" },
  { code: "45", name: "宮崎県", neighbors: ["43", "44", "46"], region: "九州" },
  { code: "46", name: "鹿児島県", neighbors: ["43", "45"], region: "九州" },
  { code: "47", name: "沖縄県", neighbors: [], region: "沖縄" },
];

const BY_CODE = new Map(PREF_LIST.map((p) => [p.code, p]));
const BY_REGION = new Map<string, typeof PREF_LIST>();
for (const p of PREF_LIST) {
  const list = BY_REGION.get(p.region) ?? [];
  list.push(p);
  BY_REGION.set(p.region, list);
}

export function getPrefByCode(code: string) {
  return BY_CODE.get(code);
}

export function getAllPrefs() {
  return PREF_LIST;
}

/**
 * trial用: home県 + 近県4（最大5県）。
 * neighbors が4未満の場合は同地方の他県で補完。
 */
export function getAccessPrefCodesForTrial(homePrefCode: string): string[] {
  const home = BY_CODE.get(homePrefCode);
  if (!home) return [homePrefCode];

  const result: string[] = [homePrefCode];
  const used = new Set(result);

  for (const code of home.neighbors) {
    if (result.length >= 5) break;
    if (!used.has(code)) {
      result.push(code);
      used.add(code);
    }
  }

  if (result.length < 5) {
    const sameRegion = BY_REGION.get(home.region) ?? [];
    for (const p of sameRegion) {
      if (result.length >= 5) break;
      if (!used.has(p.code)) {
        result.push(p.code);
        used.add(p.code);
      }
    }
  }

  return result;
}
