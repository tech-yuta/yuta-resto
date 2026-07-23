ALTER TABLE "orders" ADD COLUMN "has_allergy" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "allergy_note" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "allergy_acknowledged_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "allergy_acknowledged_by" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_allergy_acknowledged_by_users_id_fk" FOREIGN KEY ("allergy_acknowledged_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;