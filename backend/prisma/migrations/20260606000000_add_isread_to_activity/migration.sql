-- Add isRead field to activity table
ALTER TABLE "activity" ADD COLUMN "isRead" BOOLEAN NOT NULL DEFAULT false;
