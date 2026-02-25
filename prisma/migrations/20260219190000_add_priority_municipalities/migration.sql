-- CreateTable
CREATE TABLE "priority_municipalities" (
    "id" TEXT NOT NULL,
    "prefCode" TEXT NOT NULL,
    "municipalityName" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "reasonJson" TEXT NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "priority_municipalities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "priority_municipalities_prefCode_key" ON "priority_municipalities"("prefCode");
