-- CreateTable
CREATE TABLE "email_digest_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prefCode" TEXT NOT NULL,
    "digestDate" DATE NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_digest_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_digest_logs_userId_digestDate_key" ON "email_digest_logs"("userId", "digestDate");

-- AddForeignKey
ALTER TABLE "email_digest_logs" ADD CONSTRAINT "email_digest_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
