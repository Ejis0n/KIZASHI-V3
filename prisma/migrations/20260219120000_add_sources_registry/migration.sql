-- CreateTable
CREATE TABLE "sources_registry" (
    "id" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "prefCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "fetchIntervalMinutes" INTEGER NOT NULL DEFAULT 720,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sources_registry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_fetch_runs" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "httpStatus" INTEGER,
    "itemCount" INTEGER,
    "bytes" INTEGER,
    "error" TEXT,
    "rawPath" TEXT,
    "contentType" TEXT,

    CONSTRAINT "source_fetch_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_fetch_items" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT,
    "url" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "lastFetchedAt" TIMESTAMP(3),
    "lastError" TEXT,

    CONSTRAINT "source_fetch_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sources_registry_prefCode_sourceType_key" ON "sources_registry"("prefCode", "sourceType");

-- CreateIndex
CREATE UNIQUE INDEX "source_fetch_items_fingerprint_key" ON "source_fetch_items"("fingerprint");

-- AddForeignKey
ALTER TABLE "source_fetch_runs" ADD CONSTRAINT "source_fetch_runs_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "sources_registry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_fetch_items" ADD CONSTRAINT "source_fetch_items_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "sources_registry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
