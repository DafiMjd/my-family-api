-- Add nullable contact fields on persons
ALTER TABLE "public"."persons" ADD COLUMN "phoneNumber" VARCHAR(50);
ALTER TABLE "public"."persons" ADD COLUMN "address" TEXT;
