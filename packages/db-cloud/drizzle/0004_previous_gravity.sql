CREATE TYPE "public"."establishment_service_mode" AS ENUM('DINE_IN', 'TAKEAWAY', 'RESERVATION', 'DELIVERY', 'CLICK_AND_COLLECT', 'PRIVATE_EVENTS', 'CATERING');--> statement-breakpoint
ALTER TABLE "establishments" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "establishments" ADD COLUMN "address_line_1" varchar(255);--> statement-breakpoint
ALTER TABLE "establishments" ADD COLUMN "address_line_2" varchar(255);--> statement-breakpoint
ALTER TABLE "establishments" ADD COLUMN "postal_code" varchar(32);--> statement-breakpoint
ALTER TABLE "establishments" ADD COLUMN "city" varchar(120);--> statement-breakpoint
ALTER TABLE "establishments" ADD COLUMN "country_code" varchar(2);--> statement-breakpoint
ALTER TABLE "establishments" ADD COLUMN "phone" varchar(30);--> statement-breakpoint
ALTER TABLE "establishments" ADD COLUMN "email" varchar(254);--> statement-breakpoint
ALTER TABLE "establishments" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "establishments" ADD COLUMN "public_phone" varchar(30);--> statement-breakpoint
ALTER TABLE "establishments" ADD COLUMN "public_email" varchar(254);--> statement-breakpoint
ALTER TABLE "establishments" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "establishments" ADD COLUMN "cover_image_url" text;--> statement-breakpoint
ALTER TABLE "establishments" ADD COLUMN "languages" varchar(35)[] DEFAULT ARRAY[]::varchar[] NOT NULL;--> statement-breakpoint
ALTER TABLE "establishments" ADD COLUMN "service_modes" "establishment_service_mode"[] DEFAULT ARRAY[]::establishment_service_mode[] NOT NULL;--> statement-breakpoint
ALTER TABLE "establishments" ADD COLUMN "public_description" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "establishments" ADD COLUMN "public_address" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "establishments" ADD COLUMN "public_phone_visible" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "establishments" ADD COLUMN "public_email_visible" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "establishments" ADD COLUMN "public_website" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "establishments" ADD COLUMN "public_languages" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "establishments" ADD COLUMN "public_service_modes" boolean DEFAULT true NOT NULL;--> statement-breakpoint
UPDATE "establishments" AS "establishment"
SET
  "phone" = COALESCE("establishment"."phone", "settings"."public_phone"),
  "email" = COALESCE("establishment"."email", "settings"."public_email"),
  "public_phone" = COALESCE("establishment"."public_phone", "settings"."public_phone"),
  "public_email" = COALESCE("establishment"."public_email", "settings"."public_email"),
  "address_line_1" = COALESCE("establishment"."address_line_1", "settings"."address"),
  "logo_url" = COALESCE("establishment"."logo_url", "settings"."logo_url"),
  "cover_image_url" = COALESCE("establishment"."cover_image_url", "settings"."cover_image_url")
FROM "booking_settings" AS "settings"
WHERE "settings"."organization_id" = "establishment"."organization_id"
  AND "settings"."establishment_id" = "establishment"."id";--> statement-breakpoint
ALTER TABLE "booking_settings" DROP COLUMN "public_phone";--> statement-breakpoint
ALTER TABLE "booking_settings" DROP COLUMN "public_email";--> statement-breakpoint
ALTER TABLE "booking_settings" DROP COLUMN "address";--> statement-breakpoint
ALTER TABLE "booking_settings" DROP COLUMN "logo_url";--> statement-breakpoint
ALTER TABLE "booking_settings" DROP COLUMN "cover_image_url";
