/**
 * 市町村スコア＋営業用briefを計算し DB に保存。
 * 全体（category=ALL）とタイプ別（DEMOLITION/VACANT_HOUSE/...）を生成。
 * 実行: npm run compute:municipality-scores
 */
import { PrismaClient } from "@prisma/client";
import { MAIN_CATEGORIES_FOR_SCORES } from "../lib/subsidy_taxonomy";

const prisma = new PrismaClient();

const CATEGORIES_TO_COMPUTE = ["ALL", ...MAIN_CATEGORIES_FOR_SCORES];

const DAY_MS = 24 * 60 * 60 * 1000;

function daysFromToday(d: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  const diff = Math.round((day.getTime() - today.getTime()) / DAY_MS);
  return diff < 0 ? 0 : diff;
}

async function main() {
  console.log("[compute_municipality_scores] Start.");
  const items = await prisma.subsidyItem.findMany({
    where: { status: { in: ["active", "upcoming"] } },
    select: {
      prefCode: true,
      municipalityName: true,
      category: true,
      status: true,
      deadlineDate: true,
      endDate: true,
      title: true,
      sourceUrl: true,
    },
  });
  console.log(`[compute_municipality_scores] Input: ${items.length} active/upcoming subsidy items.`);

  const SEP = "::";
  const key = (pref: string, mun: string, cat: string) => `${pref}${SEP}${mun}${SEP}${cat}`;
  type Agg = {
    activeCount: number;
    upcomingCount: number;
    nearestDate: Date | null;
    subsidies: { title: string; url: string; deadline: string | null; status: string }[];
  };
  const agg = new Map<string, Agg>();

  for (const i of items) {
    const mun = i.municipalityName?.trim() || "県全域";
    const itemCat = i.category ?? "OTHER";

    const addTo = (cat: string) => {
      const k = key(i.prefCode, mun, cat);
      let a = agg.get(k);
      if (!a) {
        a = { activeCount: 0, upcomingCount: 0, nearestDate: null, subsidies: [] };
        agg.set(k, a);
      }
      if (i.status === "active") a.activeCount += 1;
      else if (i.status === "upcoming") a.upcomingCount += 1;
      const d = i.deadlineDate ?? i.endDate;
      if (d) {
        const dt = new Date(d);
        if (!a.nearestDate || dt < a.nearestDate) a.nearestDate = dt;
      }
      a.subsidies.push({
        title: i.title,
        url: i.sourceUrl,
        deadline: d ? new Date(d).toISOString().slice(0, 10) : null,
        status: i.status,
      });
    };

    addTo("ALL");
    if (CATEGORIES_TO_COMPUTE.includes(itemCat)) addTo(itemCat);
  }

  const now = new Date();
  let upserted = 0;
  for (const [k, a] of agg) {
    const parts = k.split(SEP);
    const prefCode = parts[0];
    const municipalityName = parts[1];
    const category = parts[2];
    if (!prefCode || !municipalityName || !category) continue;

    const nearestDeadlineDate = a.nearestDate;
    const nearestDeadlineDays = nearestDeadlineDate ? daysFromToday(nearestDeadlineDate) : null;
    const deadlineBonus =
      nearestDeadlineDays !== null && nearestDeadlineDays >= 0 && nearestDeadlineDays <= 30
        ? 30 - nearestDeadlineDays
        : 0;
    const score = a.activeCount * 10 + a.upcomingCount * 4 + deadlineBonus;

    await prisma.municipalityScore.upsert({
      where: {
        prefCode_municipalityName_category: { prefCode, municipalityName, category },
      },
      create: {
        prefCode,
        municipalityName,
        category,
        activeCount: a.activeCount,
        upcomingCount: a.upcomingCount,
        nearestDeadlineDate: nearestDeadlineDate ?? undefined,
        nearestDeadlineDays,
        score,
        computedAt: now,
      },
      update: {
        activeCount: a.activeCount,
        upcomingCount: a.upcomingCount,
        nearestDeadlineDate: nearestDeadlineDate ?? undefined,
        nearestDeadlineDays,
        score,
        computedAt: now,
      },
    });

    const sortedSubsidies = [...a.subsidies].sort((x, y) => {
      if (!x.deadline) return 1;
      if (!y.deadline) return -1;
      return x.deadline.localeCompare(y.deadline);
    });
    const top3 = sortedSubsidies.slice(0, 3);
    const topSubsidiesJson = JSON.stringify(top3);
    const dateStr = nearestDeadlineDate ? nearestDeadlineDate.toISOString().slice(0, 10) : "未定";
    const briefText = `${municipalityName}で募集中の補助金が${a.activeCount}件、これから募集のものが${a.upcomingCount}件。直近締切は${dateStr}。関連する工事・片付け系の需要が発生しやすいので早めの提案推奨。`;

    await prisma.municipalityBrief.upsert({
      where: {
        prefCode_municipalityName_category: { prefCode, municipalityName, category },
      },
      create: {
        prefCode,
        municipalityName,
        category,
        briefText,
        topSubsidiesJson,
        computedAt: now,
      },
      update: {
        briefText,
        topSubsidiesJson,
        computedAt: now,
      },
    });
    upserted += 1;
  }

  console.log(`[compute_municipality_scores] Done. Upserted ${upserted} (pref,municipality,category) rows.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
