CREATE TABLE "email_jobs" (
    "id" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sentAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "email_jobs_status_idx" ON "email_jobs"("status");
CREATE INDEX "email_jobs_recipientEmail_idx" ON "email_jobs"("recipientEmail");
CREATE INDEX "email_jobs_createdAt_idx" ON "email_jobs"("createdAt");

