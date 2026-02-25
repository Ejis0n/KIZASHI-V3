/**
 * sources_registry に 47 都道府県分のソースを投入する。
 * 実行: npm run seed:sources （dotenv -e .env.local で DATABASE_URL を読む想定）
 */
import { PrismaClient } from "@prisma/client";
import { getSourcesSeedData } from "../prisma/seeds/sources-data";

const prisma = new PrismaClient();

async function main() {
  const rows = getSourcesSeedData();
  console.log(`[seed:sources] Upserting ${rows.length} sources (1 per pref, type=subsidy)...`);

  for (const row of rows) {
    await prisma.sourceRegistry.upsert({
      where: {
        prefCode_sourceType: { prefCode: row.prefCode, sourceType: row.sourceType },
      },
      create: {
        sourceType: row.sourceType,
        prefCode: row.prefCode,
        name: row.name,
        url: row.url,
        enabled: true,
        fetchIntervalMinutes: 720,
      },
      update: {
        name: row.name,
        url: row.url,
      },
    });
  }

  console.log("[seed:sources] Done.");
  console.log("\n--- 登録一覧（県・タイプ・名前・URL） ---");
  for (const row of rows) {
    console.log(`${row.prefCode} ${row.prefName} | ${row.sourceType} | ${row.name}`);
    console.log(`  ${row.url}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
