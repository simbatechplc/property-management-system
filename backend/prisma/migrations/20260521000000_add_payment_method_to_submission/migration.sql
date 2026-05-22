-- Add paymentMethod field to PaymentSubmission
ALTER TABLE "PaymentSubmission" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT;
