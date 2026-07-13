CREATE TYPE "public"."combo_pricing_mode" AS ENUM('fixed', 'base_item_plus_delta');--> statement-breakpoint
ALTER TABLE "combo_rules" ADD COLUMN "pricing_mode" "combo_pricing_mode" DEFAULT 'fixed' NOT NULL;--> statement-breakpoint
ALTER TABLE "combo_rules" ADD COLUMN "price_delta_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "combo_rules" ADD COLUMN "base_pricing_group_name" varchar(255);
