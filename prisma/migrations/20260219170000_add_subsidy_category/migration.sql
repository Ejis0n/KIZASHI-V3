-- PROMPT 07: subsidy_items に category 追加、scores/briefs に category 追加（ALL=全体）
-- AlterTable subsidy_items
ALTER TABLE "subsidy_items" ADD COLUMN "category" TEXT;

-- AlterTable municipality_scores: category 追加、unique 変更
ALTER TABLE "municipality_scores" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'ALL';
DROP INDEX IF EXISTS "municipality_scores_prefCode_municipalityName_key";
CREATE UNIQUE INDEX "municipality_scores_prefCode_municipalityName_category_key" ON "municipality_scores"("prefCode", "municipalityName", "category");

-- AlterTable municipality_briefs: category 追加、unique 変更
ALTER TABLE "municipality_briefs" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'ALL';
DROP INDEX IF EXISTS "municipality_briefs_prefCode_municipalityName_key";
CREATE UNIQUE INDEX "municipality_briefs_prefCode_municipalityName_category_key" ON "municipality_briefs"("prefCode", "municipalityName", "category");
