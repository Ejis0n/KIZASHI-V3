/**
 * 補助金をタイプ別に分類して subsidy_items.category を更新。
 * title + summary のキーワード辞書で 1 件 1 カテゴリに決定。
 * 実行: npm run classify:subsidies
 * 本番: CLASSIFY_BATCH_SIZE でバッチサイズ変更可（lib/data_job_config.ts）
 */
import { PrismaClient } from "@prisma/client";
import { classifySubsidyByText } from "../lib/subsidy_taxonomy";
import { classifyConfig } from "../lib/data_job_config";

const prisma = new PrismaClient();

const BATCH_SIZE = classifyConfig.batchSize;
const LOG_EVERY = 500;

async function main() {
  const items = await prisma.subsidyItem.findMany({
    select: { id: true, title: true, summary: true },
  });

  const total = items.length;
  console.log(`[classify_subsidies] Start. total=${total}, batchSize=${BATCH_SIZE}`);

  let updated = 0;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const chunk = items.slice(i, i + BATCH_SIZE);
    await Promise.all(
      chunk.map((item) => {
        const category = classifySubsidyByText(item.title, item.summary);
        return prisma.subsidyItem.update({
          where: { id: item.id },
          data: { category },
        });
      })
    );
    updated += chunk.length;
    if (updated % LOG_EVERY < chunk.length || updated === total) {
      console.log(`[classify_subsidies] Progress ${updated}/${total}`);
    }
  }

  console.log(`[classify_subsidies] Done. Updated category for ${updated} items.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
