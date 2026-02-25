-- CreateTable
CREATE TABLE "municipality_scores" (
    "id" TEXT NOT NULL,
    "prefCode" TEXT NOT NULL,
    "municipalityName" TEXT NOT NULL,
    "activeCount" INTEGER NOT NULL DEFAULT 0,
    "upcomingCount" INTEGER NOT NULL DEFAULT 0,
    "nearestDeadlineDate" DATE,
    "nearestDeadlineDays" INTEGER,
    "score" INTEGER NOT NULL DEFAULT 0,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "municipality_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "municipality_briefs" (
    "id" TEXT NOT NULL,
    "prefCode" TEXT NOT NULL,
    "municipalityName" TEXT NOT NULL,
    "briefText" TEXT NOT NULL,
    "topSubsidiesJson" TEXT NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "municipality_briefs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "municipality_scores_prefCode_municipalityName_key" ON "municipality_scores"("prefCode", "municipalityName");

-- CreateIndex
CREATE UNIQUE INDEX "municipality_briefs_prefCode_municipalityName_key" ON "municipality_briefs"("prefCode", "municipalityName");
