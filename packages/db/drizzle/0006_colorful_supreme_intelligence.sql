CREATE TYPE "public"."allergy_severity" AS ENUM('intolerance', 'allergy', 'severe_no_traces');--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "quick_instructions" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "selected_variants" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "allergen_codes" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "allergy_severity" "allergy_severity";--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "allergy_kitchen_confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "allergy_kitchen_confirmed_by" uuid;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_allergy_kitchen_confirmed_by_users_id_fk" FOREIGN KEY ("allergy_kitchen_confirmed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;