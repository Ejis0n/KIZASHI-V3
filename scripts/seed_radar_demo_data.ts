/**
 * ダッシュボード（レーダー端末）用の実データを投入する。
 * 関東3県＋東北6県の priority / municipality_scores / municipality_briefs を登録。
 *
 * 実行前: npm run db:push または npm run db:migrate でテーブルを作成しておくこと。
 * 実行: npm run seed:radar-demo
 */
import { PrismaClient } from "@prisma/client";
import { MAIN_CATEGORIES_FOR_SCORES } from "../lib/subsidy_taxonomy";

const prisma = new PrismaClient();

const DEMO_PREFS = [
  {
    prefCode: "13",
    prefName: "東京都",
    municipalities: [
      { name: "足立区", active: 4, upcoming: 1, deadline3: 2, deadline7: 4, score: 42, categoryBoost: "DEMOLITION" },
      { name: "江戸川区", active: 3, upcoming: 0, deadline3: 0, deadline7: 2, score: 28, categoryBoost: "VACANT_HOUSE" },
      { name: "葛飾区", active: 2, upcoming: 2, deadline3: 1, deadline7: 2, score: 24, categoryBoost: "ESTATE_CLEARING" },
      { name: "世田谷区", active: 2, upcoming: 1, deadline3: 0, deadline7: 1, score: 18, categoryBoost: "ELDERLY_REFORM" },
      { name: "練馬区", active: 1, upcoming: 2, deadline3: 0, deadline7: 1, score: 14, categoryBoost: "ENERGY" },
    ],
    categoryTotals: { DEMOLITION: 6, VACANT_HOUSE: 5, ESTATE_CLEARING: 4, ELDERLY_REFORM: 3, ENERGY: 2 },
  },
  {
    prefCode: "14",
    prefName: "神奈川県",
    municipalities: [
      { name: "横浜市", active: 6, upcoming: 2, deadline3: 4, deadline7: 6, score: 58, categoryBoost: "VACANT_HOUSE" },
      { name: "川崎市", active: 3, upcoming: 1, deadline3: 1, deadline7: 2, score: 26, categoryBoost: "DEMOLITION" },
      { name: "県全域", active: 2, upcoming: 3, deadline3: 0, deadline7: 2, score: 22, categoryBoost: "ESTATE_CLEARING" },
      { name: "藤沢市", active: 2, upcoming: 1, deadline3: 0, deadline7: 1, score: 16, categoryBoost: "ELDERLY_REFORM" },
      { name: "相模原市", active: 1, upcoming: 1, deadline3: 0, deadline7: 1, score: 12, categoryBoost: "ENERGY" },
    ],
    categoryTotals: { DEMOLITION: 4, VACANT_HOUSE: 8, ESTATE_CLEARING: 5, ELDERLY_REFORM: 3, ENERGY: 2 },
  },
  {
    prefCode: "11",
    prefName: "埼玉県",
    municipalities: [
      { name: "県全域", active: 3, upcoming: 2, deadline3: 1, deadline7: 2, score: 30, categoryBoost: "ESTATE_CLEARING" },
      { name: "さいたま市", active: 2, upcoming: 1, deadline3: 0, deadline7: 1, score: 18, categoryBoost: "DEMOLITION" },
      { name: "川口市", active: 1, upcoming: 2, deadline3: 0, deadline7: 1, score: 14, categoryBoost: "VACANT_HOUSE" },
      { name: "越谷市", active: 1, upcoming: 1, deadline3: 0, deadline7: 0, score: 10, categoryBoost: "ELDERLY_REFORM" },
      { name: "川越市", active: 1, upcoming: 0, deadline3: 0, deadline7: 0, score: 8, categoryBoost: "ENERGY" },
    ],
    categoryTotals: { DEMOLITION: 3, VACANT_HOUSE: 2, ESTATE_CLEARING: 5, ELDERLY_REFORM: 2, ENERGY: 1 },
  },
  // 東北
  {
    prefCode: "02",
    prefName: "青森県",
    municipalities: [
      { name: "青森市", active: 3, upcoming: 1, deadline3: 1, deadline7: 2, score: 28, categoryBoost: "DEMOLITION" },
      { name: "弘前市", active: 2, upcoming: 1, deadline3: 0, deadline7: 1, score: 18, categoryBoost: "VACANT_HOUSE" },
      { name: "八戸市", active: 2, upcoming: 0, deadline3: 0, deadline7: 1, score: 16, categoryBoost: "ESTATE_CLEARING" },
      { name: "県全域", active: 1, upcoming: 2, deadline3: 0, deadline7: 0, score: 14, categoryBoost: "ELDERLY_REFORM" },
      { name: "十和田市", active: 1, upcoming: 1, deadline3: 0, deadline7: 0, score: 10, categoryBoost: "ENERGY" },
    ],
    categoryTotals: { DEMOLITION: 4, VACANT_HOUSE: 3, ESTATE_CLEARING: 3, ELDERLY_REFORM: 2, ENERGY: 1 },
  },
  {
    prefCode: "03",
    prefName: "岩手県",
    municipalities: [
      { name: "盛岡市", active: 4, upcoming: 1, deadline3: 2, deadline7: 3, score: 38, categoryBoost: "VACANT_HOUSE" },
      { name: "県全域", active: 2, upcoming: 2, deadline3: 0, deadline7: 2, score: 24, categoryBoost: "DEMOLITION" },
      { name: "一関市", active: 2, upcoming: 0, deadline3: 0, deadline7: 1, score: 16, categoryBoost: "ESTATE_CLEARING" },
      { name: "奥州市", active: 1, upcoming: 1, deadline3: 0, deadline7: 0, score: 12, categoryBoost: "ELDERLY_REFORM" },
      { name: "花巻市", active: 1, upcoming: 0, deadline3: 0, deadline7: 0, score: 8, categoryBoost: "ENERGY" },
    ],
    categoryTotals: { DEMOLITION: 3, VACANT_HOUSE: 5, ESTATE_CLEARING: 3, ELDERLY_REFORM: 2, ENERGY: 1 },
  },
  {
    prefCode: "04",
    prefName: "宮城県",
    municipalities: [
      { name: "仙台市", active: 5, upcoming: 2, deadline3: 3, deadline7: 5, score: 48, categoryBoost: "DEMOLITION" },
      { name: "県全域", active: 2, upcoming: 1, deadline3: 0, deadline7: 2, score: 22, categoryBoost: "VACANT_HOUSE" },
      { name: "石巻市", active: 2, upcoming: 0, deadline3: 0, deadline7: 1, score: 16, categoryBoost: "ESTATE_CLEARING" },
      { name: "大崎市", active: 1, upcoming: 1, deadline3: 0, deadline7: 0, score: 12, categoryBoost: "ELDERLY_REFORM" },
      { name: "名取市", active: 1, upcoming: 0, deadline3: 0, deadline7: 0, score: 8, categoryBoost: "ENERGY" },
    ],
    categoryTotals: { DEMOLITION: 6, VACANT_HOUSE: 4, ESTATE_CLEARING: 3, ELDERLY_REFORM: 2, ENERGY: 1 },
  },
  {
    prefCode: "05",
    prefName: "秋田県",
    municipalities: [
      { name: "秋田市", active: 3, upcoming: 1, deadline3: 1, deadline7: 2, score: 26, categoryBoost: "ESTATE_CLEARING" },
      { name: "県全域", active: 2, upcoming: 1, deadline3: 0, deadline7: 1, score: 18, categoryBoost: "DEMOLITION" },
      { name: "大仙市", active: 1, upcoming: 1, deadline3: 0, deadline7: 0, score: 12, categoryBoost: "VACANT_HOUSE" },
      { name: "横手市", active: 1, upcoming: 0, deadline3: 0, deadline7: 0, score: 8, categoryBoost: "ELDERLY_REFORM" },
      { name: "能代市", active: 1, upcoming: 0, deadline3: 0, deadline7: 0, score: 6, categoryBoost: "ENERGY" },
    ],
    categoryTotals: { DEMOLITION: 2, VACANT_HOUSE: 2, ESTATE_CLEARING: 4, ELDERLY_REFORM: 2, ENERGY: 1 },
  },
  {
    prefCode: "06",
    prefName: "山形県",
    municipalities: [
      { name: "山形市", active: 3, upcoming: 1, deadline3: 1, deadline7: 2, score: 28, categoryBoost: "VACANT_HOUSE" },
      { name: "県全域", active: 2, upcoming: 1, deadline3: 0, deadline7: 1, score: 18, categoryBoost: "DEMOLITION" },
      { name: "鶴岡市", active: 2, upcoming: 0, deadline3: 0, deadline7: 1, score: 14, categoryBoost: "ESTATE_CLEARING" },
      { name: "酒田市", active: 1, upcoming: 1, deadline3: 0, deadline7: 0, score: 10, categoryBoost: "ELDERLY_REFORM" },
      { name: "米沢市", active: 1, upcoming: 0, deadline3: 0, deadline7: 0, score: 6, categoryBoost: "ENERGY" },
    ],
    categoryTotals: { DEMOLITION: 3, VACANT_HOUSE: 4, ESTATE_CLEARING: 3, ELDERLY_REFORM: 2, ENERGY: 1 },
  },
  {
    prefCode: "07",
    prefName: "福島県",
    municipalities: [
      { name: "郡山市", active: 4, upcoming: 2, deadline3: 2, deadline7: 4, score: 42, categoryBoost: "DEMOLITION" },
      { name: "福島市", active: 3, upcoming: 1, deadline3: 1, deadline7: 2, score: 28, categoryBoost: "VACANT_HOUSE" },
      { name: "いわき市", active: 2, upcoming: 1, deadline3: 0, deadline7: 1, score: 18, categoryBoost: "ESTATE_CLEARING" },
      { name: "県全域", active: 2, upcoming: 0, deadline3: 0, deadline7: 1, score: 16, categoryBoost: "ELDERLY_REFORM" },
      { name: "会津若松市", active: 1, upcoming: 1, deadline3: 0, deadline7: 0, score: 12, categoryBoost: "ENERGY" },
    ],
    categoryTotals: { DEMOLITION: 5, VACANT_HOUSE: 4, ESTATE_CLEARING: 4, ELDERLY_REFORM: 3, ENERGY: 2 },
  },
];

function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

async function main() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const pref of DEMO_PREFS) {
    const topMun = pref.municipalities[0];
    if (!topMun) continue;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).priorityMunicipality.upsert({
      where: { prefCode: pref.prefCode },
      create: {
        prefCode: pref.prefCode,
        municipalityName: topMun.name,
        score: topMun.score,
        reasonJson: JSON.stringify({
          active: topMun.active,
          upcoming: topMun.upcoming,
          deadline7: topMun.deadline7,
          deadline3: topMun.deadline3,
          categoryBoost: topMun.categoryBoost,
        }),
        computedAt: today,
      },
      update: {
        municipalityName: topMun.name,
        score: topMun.score,
        reasonJson: JSON.stringify({
          active: topMun.active,
          upcoming: topMun.upcoming,
          deadline7: topMun.deadline7,
          deadline3: topMun.deadline3,
          categoryBoost: topMun.categoryBoost,
        }),
        computedAt: today,
      },
    });
    console.log(`[seed_radar_demo] Priority: ${pref.prefName} → ${topMun.name} (score ${topMun.score})`);
  }

  const categories = ["ALL", ...MAIN_CATEGORIES_FOR_SCORES];

  // カテゴリ別合計が categoryTotals どおりになるよう activeCount を配分する
  function distributeTotal(total: number, n: number): number[] {
    const out: number[] = [];
    let rest = total;
    for (let i = 0; i < n; i++) {
      const part = i < n - 1 ? Math.ceil(rest / (n - i)) : rest;
      const val = Math.max(0, Math.min(part, rest));
      out.push(val);
      rest -= val;
    }
    return out;
  }

  for (const pref of DEMO_PREFS) {
    for (const mun of pref.municipalities) {
      const nearestDeadline = addDays(today, 5 + Math.floor(Math.random() * 20));
      const n = pref.municipalities.length;
      const catTotalsMap = pref.categoryTotals as Record<string, number>;
      const catTotals = MAIN_CATEGORIES_FOR_SCORES.map((cat) => catTotalsMap[cat] ?? 0);
      const perCategoryPerMun = MAIN_CATEGORIES_FOR_SCORES.map((_, ci) =>
        distributeTotal(catTotals[ci], n)
      );
      const munIndex = pref.municipalities.indexOf(mun);

      for (const category of categories) {
        const isAll = category === "ALL";
        let activeCount: number;
        let upcomingCount: number;
        if (isAll) {
          activeCount = mun.active;
          upcomingCount = mun.upcoming;
        } else {
          const catIdx = MAIN_CATEGORIES_FOR_SCORES.indexOf(category as (typeof MAIN_CATEGORIES_FOR_SCORES)[number]);
          activeCount = catIdx >= 0 ? (perCategoryPerMun[catIdx][munIndex] ?? 0) : 0;
          upcomingCount = mun.categoryBoost === category ? Math.min(mun.upcoming, 2) : 0;
        }
        const score = activeCount * 10 + upcomingCount * 4 + (isAll ? 15 : 5);

        await prisma.municipalityScore.upsert({
          where: {
            prefCode_municipalityName_category: { prefCode: pref.prefCode, municipalityName: mun.name, category },
          },
          create: {
            prefCode: pref.prefCode,
            municipalityName: mun.name,
            category,
            activeCount,
            upcomingCount,
            nearestDeadlineDate: nearestDeadline,
            nearestDeadlineDays: Math.round((nearestDeadline.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)),
            score,
            computedAt: today,
          },
          update: {
            activeCount,
            upcomingCount,
            nearestDeadlineDate: nearestDeadline,
            nearestDeadlineDays: Math.round((nearestDeadline.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)),
            score,
            computedAt: today,
          },
        });
      }

      const topSubsidiesJson = JSON.stringify([
        { title: "老朽家屋除却補助金", url: "https://example.com/1", deadline: addDays(today, 14).toISOString().slice(0, 10), status: "active" },
        { title: "空き家解消支援事業", url: "https://example.com/2", deadline: addDays(today, 28).toISOString().slice(0, 10), status: "active" },
        { title: "住宅改修助成", url: "https://example.com/3", deadline: addDays(today, 45).toISOString().slice(0, 10), status: "upcoming" },
      ]);
      const briefText = `${mun.name}で募集中の補助金が${mun.active}件、これから募集のものが${mun.upcoming}件。直近締切は${nearestDeadline.toISOString().slice(0, 10)}。関連する工事・片付け系の需要が発生しやすいので早めの提案推奨。`;

      for (const category of categories) {
        await prisma.municipalityBrief.upsert({
          where: {
            prefCode_municipalityName_category: { prefCode: pref.prefCode, municipalityName: mun.name, category },
          },
          create: {
            prefCode: pref.prefCode,
            municipalityName: mun.name,
            category,
            briefText,
            topSubsidiesJson,
            computedAt: today,
          },
          update: {
            briefText,
            topSubsidiesJson,
            computedAt: today,
          },
        });
      }
    }
    console.log(`[seed_radar_demo] Scores & briefs: ${pref.prefName} × ${pref.municipalities.length} 市町村 × ${categories.length} カテゴリ`);
  }

  console.log("[seed_radar_demo] Done. 関東3県＋東北6県のレーダー用実データを投入しました。");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
