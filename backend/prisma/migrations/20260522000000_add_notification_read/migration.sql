-- Create NotificationRead table for persistent read status
CREATE TABLE IF NOT EXISTS "notification_read" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "activityId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notification_read_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "notification_read_userId_activityId_key" ON "notification_read"("userId", "activityId");
CREATE INDEX IF NOT EXISTS "notification_read_userId_idx" ON "notification_read"("userId");
