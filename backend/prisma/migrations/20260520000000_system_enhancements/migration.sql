-- Add bank account fields to SiteConfig
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS "bankName" TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS "bankAccountHolder" TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS "bankAccountNumber" TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS "bankInstructions" TEXT;

-- Add FurnishingStatus enum and field to Property
DO $$ BEGIN
  CREATE TYPE "FurnishingStatus" AS ENUM ('FURNISHED', 'UNFURNISHED', 'PARTIALLY_FURNISHED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "furnishingStatus" "FurnishingStatus";

-- Add PaymentSubmissionStatus enum
DO $$ BEGIN
  CREATE TYPE "PaymentSubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create PaymentSubmission table
CREATE TABLE IF NOT EXISTS "PaymentSubmission" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "referenceNumber" TEXT NOT NULL,
  "amountPaid" DOUBLE PRECISION NOT NULL,
  "fullName" TEXT NOT NULL,
  "screenshotUrl" TEXT NOT NULL,
  "status" "PaymentSubmissionStatus" NOT NULL DEFAULT 'PENDING',
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaymentSubmission_pkey" PRIMARY KEY ("id")
);

-- Add unique constraint on bookingId
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentSubmission_bookingId_key" ON "PaymentSubmission"("bookingId");

-- Add foreign key constraint
ALTER TABLE "PaymentSubmission" ADD CONSTRAINT "PaymentSubmission_bookingId_fkey" 
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable pg_trgm extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create trigram indexes for fuzzy search
CREATE INDEX IF NOT EXISTS "Property_name_trgm_idx" ON "Property" USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Property_address_trgm_idx" ON "Property" USING gin(address gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Location_city_trgm_idx" ON "Location" USING gin(city gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Location_subcity_trgm_idx" ON "Location" USING gin(subcity gin_trgm_ops);
