/**
 * 県ごとに「本日最優先1市町村」を算出し priority_municipalities に upsert。
 * スコア式: active*3 + upcoming*1 + deadline7*5 + deadline3*8 + カテゴリ重み
 * 実行: npm run compute:priority
 */
import { PrismaClient } from "@prisma/client";
import { getAllPrefs } from "../lib/prefs";

const prisma = new PrismaClient();

const CATEGORY_WEIGHTS: Record<string, number> = {
  DEMOLITION: 5,
  VACANT_HOUSE: 4,
  ESTATE_CLEARING: 4,
  ELDERLY_REFORM: 2,
  ENERGY: 1,
};
const CATEGORY_ORDER = ["DEMOLITION", "VACANT_HOUSE", "ESTATE_CLEARING", "ELDERLY_REFORM", "ENERGY"];

function getCategoryBoost(categoryScores: Map<string, { activeCount: number; upcomingCount: number }>): { category: string; weight: number } {
  for (const cat of CATEGORY_ORDER) {
    const s = categoryScores.get(cat);
    if (s && (s.activeCount > 0 || s.upcomingCount > 0)) {
      return { category: cat, weight: CATEGORY_WEIGHTS[cat] ?? 0 };
    }
  }
  return { category: "OTHER", weight: 0 };
}

async function main() {
  console.log("[compute_priority_municipality] Start.");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in7 = new Date(today);
  in7.setDate(in7.getDate() + 7);
  const in3 = new Date(today);
  in3.setDate(in3.getDate() + 3);

  const prefs = getAllPrefs();
  let upserted = 0;

  for (const pref of prefs) {
    const prefCode = pref.code;

    const [scoresAll, scoresByCategory, itemsActive] = await Promise.all([
      prisma.municipalityScore.findMany({
        where: { prefCode, category: "ALL" },
        select: { municipalityName: true, activeCount: true, upcomingCount: true },
      }),
      prisma.municipalityScore.findMany({
        where: { prefCode, category: { in: CATEGORY_ORDER } },
        select: { municipalityName: true, category: true, activeCount: true, upcomingCount: true },
      }),
      prisma.subsidyItem.findMany({
        where: {
          prefCode,
          status: "active",
          OR: [
            { deadlineDate: { gte: today, lte: in7 } },
            { endDate: { gte: today, lte: in7 } },
          ],
        },
        select: { municipalityName: true, deadlineDate: true, endDate: true },
      }),
    ]);

    const munToDeadline7 = new Map<string, number>();
    const munToDeadline3 = new Map<string, number>();
    for (const i of itemsActive) {
      const mun = i.municipalityName?.trim() || "県全域";
      const d = i.deadlineDate ?? i.endDate;
      if (!d) continue;
      const dt = new Date(d);
      if (dt >= today && dt <= in7) {
        munToDeadline7.set(mun, (munToDeadline7.get(mun) ?? 0) + 1);
        if (dt <= in3) {
          munToDeadline3.set(mun, (munToDeadline3.get(mun) ?? 0) + 1);
        }
      }
    }

    const categoryByMun = new Map<string, Map<string, { activeCount: number; upcomingCount: number }>>();
    for (const s of scoresByCategory) {
      let m = categoryByMun.get(s.municipalityName);
      if (!m) {
        m = new Map();
        categoryByMun.set(s.municipalityName, m);
      }
      m.set(s.category, { activeCount: s.activeCount, upcomingCount: s.upcomingCount });
    }

    let best: { municipalityName: string; score: number; reason: { active: number; upcoming: number; deadline7: number; deadline3: number; categoryBoost: string } } | null = null;

    for (const row of scoresAll) {
      const active = row.activeCount;
      const upcoming = row.upcomingCount;
      const deadline7 = munToDeadline7.get(row.municipalityName) ?? 0;
      const deadline3 = munToDeadline3.get(row.municipalityName) ?? 0;
      const { category: categoryBoost, weight } = getCategoryBoost(categoryByMun.get(row.municipalityName) ?? new Map());
      const score = active * 3 + upcoming * 1 + deadline7 * 5 + deadline3 * 8 + weight;

      if (best === null || score > best.score) {
        best = {
          municipalityName: row.municipalityName,
          score,
          reason: { active, upcoming, deadline7, deadline3, categoryBoost },
        };
      }
    }

    if (best === null) continue;

    await prisma.priorityMunicipality.upsert({
      where: { prefCode },
      create: {
        prefCode,
        municipalityName: best.municipalityName,
        score: best.score,
        reasonJson: JSON.stringify(best.reason),
        computedAt: today,
      },
      update: {
        municipalityName: best.municipalityName,
        score: best.score,
        reasonJson: JSON.stringify(best.reason),
        computedAt: today,
      },
    });
    upserted += 1;
  }

  console.log(`[compute_priority_municipality] Done. Upserted ${upserted} prefs.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
