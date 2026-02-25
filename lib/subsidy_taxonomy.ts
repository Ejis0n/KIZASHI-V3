/**
 * 補助金タイプ分類（ルールベース辞書）。LLM 禁止。
 * title + summary に対するキーワードマッチで 1 件 1 カテゴリに決定（優先順位あり）。
 */

export const SUBSIDY_CATEGORIES = [
  "DEMOLITION",
  "VACANT_HOUSE",
  "ESTATE_CLEARING",
  "ELDERLY_REFORM",
  "SEISMIC",
  "ENERGY",
  "BUSINESS_SUPPORT",
  "OTHER",
] as const;

export type SubsidyCategory = (typeof SUBSIDY_CATEGORIES)[number];

/** 優先順位（先にマッチした方を採用）。1 = 最優先 */
const PRIORITY_ORDER: SubsidyCategory[] = [
  "DEMOLITION",
  "VACANT_HOUSE",
  "ESTATE_CLEARING",
  "ELDERLY_REFORM",
  "SEISMIC",
  "ENERGY",
  "BUSINESS_SUPPORT",
  "OTHER",
];

const KEYWORDS: Record<Exclude<SubsidyCategory, "OTHER">, string[]> = {
  DEMOLITION: ["解体", "除却", "撤去", "老朽", "ブロック塀撤去", "建物撤去"],
  VACANT_HOUSE: ["空き家", "空家", "特定空家", "利活用", "空き家除却", "空き家対策"],
  ESTATE_CLEARING: ["残置物", "家財", "片付け", "整理", "遺品", "ごみ屋敷", "遺品整理", "生前整理"],
  ELDERLY_REFORM: ["高齢者", "バリアフリー", "手すり", "段差解消", "介護", "住宅改修", "在宅"],
  SEISMIC: ["耐震", "耐震改修", "耐震診断", "耐震化"],
  ENERGY: ["省エネ", "断熱", "ゼロカーボン", "太陽光", "蓄電池", "窓改修", "ZEH", "リフォーム"],
  BUSINESS_SUPPORT: [
    "事業者",
    "中小企業",
    "設備投資",
    "補助",
    "助成",
    "創業",
    "販路",
    "DX",
    "小規模事業者",
    "経営",
  ],
};

/** タイプ別TOP5で使う主要カテゴリ（OTHER / SEISMIC / BUSINESS_SUPPORT はスコア対象外でも可、要件では5種） */
export const MAIN_CATEGORIES_FOR_SCORES: SubsidyCategory[] = [
  "DEMOLITION",
  "VACANT_HOUSE",
  "ESTATE_CLEARING",
  "ELDERLY_REFORM",
  "ENERGY",
];

/** 表示用ラベル（ALL は TOP5 用） */
export const CATEGORY_LABELS: Record<SubsidyCategory | "ALL", string> = {
  ALL: "全体",
  DEMOLITION: "解体",
  VACANT_HOUSE: "空き家",
  ESTATE_CLEARING: "残置物・片付け",
  ELDERLY_REFORM: "高齢者改修",
  SEISMIC: "耐震",
  ENERGY: "省エネ・エネルギー",
  BUSINESS_SUPPORT: "事業者支援",
  OTHER: "その他",
};

/** TOP5 セレクト用（全体 + 各タイプ） */
export const TOP_CATEGORY_OPTIONS = ["ALL", ...SUBSIDY_CATEGORIES] as const;

/**
 * title と summary を結合した文字列に対してキーワードマッチし、
 * 優先順位に従って 1 つのカテゴリを返す。マッチしなければ OTHER。
 */
export function classifySubsidyByText(title: string, summary: string | null): SubsidyCategory {
  const text = `${title || ""}\n${summary || ""}`;
  const normalized = text.normalize("NFKC");

  for (const cat of PRIORITY_ORDER) {
    if (cat === "OTHER") return "OTHER";
    const keywords = KEYWORDS[cat];
    for (const kw of keywords) {
      if (normalized.includes(kw.normalize("NFKC"))) return cat;
    }
  }
  return "OTHER";
}
