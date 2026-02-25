-- CreateTable
CREATE TABLE "subsidy_items" (
    "id" TEXT NOT NULL,
    "prefCode" TEXT NOT NULL,
    "municipalityName" TEXT,
    "title" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "summary" TEXT,
    "startDate" DATE,
    "endDate" DATE,
    "deadlineDate" DATE,
    "status" TEXT NOT NULL,
    "lastCrawledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawPath" TEXT,
    "parseConfidence" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subsidy_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subsidy_items_sourceUrl_key" ON "subsidy_items"("sourceUrl");
