/**
 * 営業テンプレ（ルールベース）。LLM 禁止。差し込みのみ。
 * 業者がコピペして使える短文・長文を生成。
 */

const DISCLAIMER = "※制度内容・条件は自治体の公式ページで必ずご確認ください。";

export type TemplateCategory =
  | "ALL"
  | "DEMOLITION"
  | "VACANT_HOUSE"
  | "ESTATE_CLEARING"
  | "ELDERLY_REFORM"
  | "ENERGY"
  | "SEISMIC"
  | "BUSINESS_SUPPORT"
  | "OTHER";

export type TopSubsidy = {
  title: string;
  url: string;
  deadline: string | null;
  status: string;
};

export type SalesTemplateInput = {
  prefName: string;
  municipalityName: string;
  category: TemplateCategory;
  activeCount: number;
  upcomingCount: number;
  nearestDeadlineDate: string | null; // YYYY-MM-DD or 表示用
  topSubsidies: TopSubsidy[];
};

export type SalesTemplateOutput = {
  messageShort: string;
  messageLong: string;
};

function formatDeadline(d: string | null): string {
  if (!d) return "未定";
  const ymd = d.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
    const [y, m, day] = ymd.split("-");
    return `${y}年${m}月${day}日`;
  }
  return d;
}

function subsidyLines(subsidies: TopSubsidy[]): string {
  if (subsidies.length === 0) return "（該当する補助金の詳細は自治体ページでご確認ください）";
  return subsidies
    .map((s) => `・${s.title}（締切：${formatDeadline(s.deadline)}）`)
    .join("\n");
}

/**
 * カテゴリごとの営業メッセージを生成。短文（SMS/DM）と長文（メール/提案）を返す。
 */
export function buildSalesMessages(input: SalesTemplateInput): SalesTemplateOutput {
  const {
    prefName,
    municipalityName,
    category,
    activeCount,
    upcomingCount,
    nearestDeadlineDate,
    topSubsidies,
  } = input;

  const deadlineStr = formatDeadline(nearestDeadlineDate);
  const total = activeCount + upcomingCount;
  const subsidyList = subsidyLines(topSubsidies);

  const shortByCategory: Record<TemplateCategory, () => string> = {
    ALL: () =>
      `${prefName}${municipalityName}で補助金が${total}件あります。募集中${activeCount}件、これから${upcomingCount}件。直近締切は${deadlineStr}です。詳しくは自治体ページをご確認ください。\n${DISCLAIMER}`,
    DEMOLITION: () =>
      `${municipalityName}で解体・除却関連の補助金が${total}件。募集中${activeCount}件。直近締切${deadlineStr}。該当するお客様への案内にご利用ください。\n${DISCLAIMER}`,
    VACANT_HOUSE: () =>
      `${municipalityName}の空き家対策・除却等の補助が${total}件。募集中${activeCount}件、締切${deadlineStr}。空き家でお困りの方への提案にどうぞ。\n${DISCLAIMER}`,
    ESTATE_CLEARING: () =>
      `${municipalityName}で片付け・遺品整理等の補助が${total}件。募集中${activeCount}件、締切${deadlineStr}。ご依頼検討中の方への一案として。\n${DISCLAIMER}`,
    ELDERLY_REFORM: () =>
      `${municipalityName}で高齢者向け住宅改修の補助が${total}件。募集中${activeCount}件、締切${deadlineStr}。バリアフリー改修の提案に。\n${DISCLAIMER}`,
    ENERGY: () =>
      `${municipalityName}で省エネ・断熱等の補助が${total}件。募集中${activeCount}件、締切${deadlineStr}。リフォーム提案の材料に。\n${DISCLAIMER}`,
    SEISMIC: () =>
      `${municipalityName}で耐震関連の補助が${total}件。募集中${activeCount}件、締切${deadlineStr}。耐震改修の案内にご利用ください。\n${DISCLAIMER}`,
    BUSINESS_SUPPORT: () =>
      `${municipalityName}で事業者向け補助が${total}件。募集中${activeCount}件、締切${deadlineStr}。条件は自治体ページでご確認ください。\n${DISCLAIMER}`,
    OTHER: () =>
      `${municipalityName}で補助金が${total}件。募集中${activeCount}件、締切${deadlineStr}。詳細は自治体ページでご確認ください。\n${DISCLAIMER}`,
  };

  const longByCategory: Record<TemplateCategory, () => string> = {
    ALL: () =>
      [
        `【${prefName} ${municipalityName} 補助金のご案内】`,
        ``,
        `${municipalityName}では現在、補助金が${total}件あります（募集中${activeCount}件、これから募集${upcomingCount}件）。`,
        `直近の締切は${deadlineStr}です。`,
        ``,
        `代表的な補助金：`,
        subsidyList,
        ``,
        `制度の条件・申請方法は自治体の公式ページで必ずご確認のうえ、お客様へご案内ください。`,
        ``,
        DISCLAIMER,
      ].join("\n"),
    DEMOLITION: () =>
      [
        `【${municipalityName} 解体・除却関連補助のご案内】`,
        ``,
        `現在、${municipalityName}で解体・除却に関連する補助金が${total}件あります（募集中${activeCount}件）。`,
        `直近締切は${deadlineStr}です。`,
        ``,
        `主な制度：`,
        subsidyList,
        ``,
        `老朽建物の解体やブロック塀撤去などでご検討中の方への案内材料としてご利用ください。条件は自治体ページでご確認ください。`,
        ``,
        DISCLAIMER,
      ].join("\n"),
    VACANT_HOUSE: () =>
      [
        `【${municipalityName} 空き家対策補助のご案内】`,
        ``,
        `${municipalityName}では空き家の除却・利活用等の補助が${total}件あります（募集中${activeCount}件）。`,
        `直近締切は${deadlineStr}です。`,
        ``,
        `主な制度：`,
        subsidyList,
        ``,
        `空き家でお困りのお客様への提案の参考にしてください。制度内容は自治体の公式ページで必ずご確認ください。`,
        ``,
        DISCLAIMER,
      ].join("\n"),
    ESTATE_CLEARING: () =>
      [
        `【${municipalityName} 片付け・整理関連補助のご案内】`,
        ``,
        `${municipalityName}で残置物・片付け・遺品整理等に関連する補助が${total}件あります（募集中${activeCount}件）。`,
        `直近締切は${deadlineStr}です。`,
        ``,
        `主な制度：`,
        subsidyList,
        ``,
        `ご依頼検討中のお客様への一案としてご利用ください。条件は自治体ページでご確認ください。`,
        ``,
        DISCLAIMER,
      ].join("\n"),
    ELDERLY_REFORM: () =>
      [
        `【${municipalityName} 高齢者向け住宅改修補助のご案内】`,
        ``,
        `${municipalityName}では高齢者向けの住宅改修（手すり・段差解消等）の補助が${total}件あります（募集中${activeCount}件）。`,
        `直近締切は${deadlineStr}です。`,
        ``,
        `主な制度：`,
        subsidyList,
        ``,
        `バリアフリー改修のご提案の材料としてご利用ください。制度内容は自治体の公式ページで必ずご確認ください。`,
        ``,
        DISCLAIMER,
      ].join("\n"),
    ENERGY: () =>
      [
        `【${municipalityName} 省エネ・断熱等補助のご案内】`,
        ``,
        `${municipalityName}で省エネ・断熱・太陽光等の補助が${total}件あります（募集中${activeCount}件）。`,
        `直近締切は${deadlineStr}です。`,
        ``,
        `主な制度：`,
        subsidyList,
        ``,
        `リフォーム提案の参考にしてください。条件は自治体ページでご確認ください。`,
        ``,
        DISCLAIMER,
      ].join("\n"),
    SEISMIC: () =>
      [
        `【${municipalityName} 耐震関連補助のご案内】`,
        ``,
        `${municipalityName}で耐震改修・耐震診断等の補助が${total}件あります（募集中${activeCount}件）。`,
        `直近締切は${deadlineStr}です。`,
        ``,
        `主な制度：`,
        subsidyList,
        ``,
        `耐震改修のご案内にご利用ください。制度内容は自治体の公式ページで必ずご確認ください。`,
        ``,
        DISCLAIMER,
      ].join("\n"),
    BUSINESS_SUPPORT: () =>
      [
        `【${municipalityName} 事業者向け補助のご案内】`,
        ``,
        `${municipalityName}で事業者向けの補助が${total}件あります（募集中${activeCount}件）。`,
        `直近締切は${deadlineStr}です。`,
        ``,
        `主な制度：`,
        subsidyList,
        ``,
        `条件・申請方法は自治体の公式ページで必ずご確認ください。`,
        ``,
        DISCLAIMER,
      ].join("\n"),
    OTHER: () =>
      [
        `【${prefName} ${municipalityName} 補助金のご案内】`,
        ``,
        `${municipalityName}で補助金が${total}件あります（募集中${activeCount}件）。`,
        `直近締切は${deadlineStr}です。`,
        ``,
        `代表的な制度：`,
        subsidyList,
        ``,
        `制度内容・条件は自治体の公式ページで必ずご確認ください。`,
        ``,
        DISCLAIMER,
      ].join("\n"),
  };

  const cat = category in shortByCategory ? category : "ALL";
  const messageShort = shortByCategory[cat as TemplateCategory]();
  const messageLong = longByCategory[cat as TemplateCategory]();

  return { messageShort, messageLong };
}
