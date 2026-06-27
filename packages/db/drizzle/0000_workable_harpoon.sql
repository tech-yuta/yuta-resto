CREATE TYPE "public"."check_split_mode" AS ENUM('items', 'equal');--> statement-breakpoint
CREATE TYPE "public"."check_status" AS ENUM('open', 'paid', 'void');--> statement-breakpoint
CREATE TYPE "public"."kitchen_station" AS ENUM('kitchen', 'bar', 'dessert', 'none');--> statement-breakpoint
CREATE TYPE "public"."order_item_status" AS ENUM('pending', 'sent', 'preparing', 'ready', 'served', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('draft', 'sent', 'preparing', 'ready', 'served', 'paid', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."order_type" AS ENUM('dine_in', 'takeaway', 'delivery');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'card', 'ticket_resto', 'other');--> statement-breakpoint
CREATE TYPE "public"."payment_mode" AS ENUM('single', 'split_by_items', 'split_equally');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."print_job_source" AS ENUM('pos', 'kitchen', 'delivery', 'manual');--> statement-breakpoint
CREATE TYPE "public"."print_job_status" AS ENUM('pending', 'printing', 'printed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."print_job_type" AS ENUM('kitchen_ticket', 'customer_receipt', 'test');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'manager', 'staff', 'kitchen');--> statement-breakpoint
CREATE TABLE "check_discount_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"check_discount_id" uuid NOT NULL,
	"check_item_id" uuid NOT NULL,
	"quantity_applied" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "check_discounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"check_id" uuid NOT NULL,
	"combo_rule_id" uuid,
	"name_snapshot" varchar(255) NOT NULL,
	"discount_cents" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "check_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"check_id" uuid NOT NULL,
	"order_item_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"amount_cents_snapshot" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"check_label" varchar(255) NOT NULL,
	"split_mode" "check_split_mode" NOT NULL,
	"status" "check_status" DEFAULT 'open' NOT NULL,
	"subtotal_cents" integer DEFAULT 0 NOT NULL,
	"discount_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "combo_rule_group_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"combo_rule_group_id" uuid NOT NULL,
	"menu_item_id" uuid NOT NULL,
	"extra_price_cents" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "combo_rule_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"combo_rule_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"min_quantity" integer NOT NULL,
	"max_quantity" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "combo_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"combo_price_cents" integer NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"max_applications" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"price_cents" integer NOT NULL,
	"kitchen_station" "kitchen_station" NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_discount_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_discount_id" uuid NOT NULL,
	"order_item_id" uuid NOT NULL,
	"quantity_applied" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_discounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"combo_rule_id" uuid,
	"name_snapshot" varchar(255) NOT NULL,
	"discount_cents" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"menu_item_id" uuid NOT NULL,
	"item_name_snapshot" varchar(255) NOT NULL,
	"unit_price_cents_snapshot" integer NOT NULL,
	"kitchen_station_snapshot" "kitchen_station" NOT NULL,
	"quantity" integer NOT NULL,
	"note" text,
	"status" "order_item_status" DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp with time zone,
	"ready_at" timestamp with time zone,
	"served_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancelled_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" varchar(64) NOT NULL,
	"table_label" varchar(255) NOT NULL,
	"order_type" "order_type" NOT NULL,
	"status" "order_status" DEFAULT 'draft' NOT NULL,
	"subtotal_cents" integer DEFAULT 0 NOT NULL,
	"discount_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer DEFAULT 0 NOT NULL,
	"payment_mode" "payment_mode" DEFAULT 'single' NOT NULL,
	"note" text,
	"created_by" uuid NOT NULL,
	"sent_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancelled_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"check_id" uuid,
	"method" "payment_method" NOT NULL,
	"amount_cents" integer NOT NULL,
	"tendered_cents" integer,
	"change_cents" integer,
	"tip_cents" integer DEFAULT 0 NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"paid_by" varchar(255),
	"paid_at" timestamp with time zone,
	"refunded_at" timestamp with time zone,
	"refund_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "print_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" "print_job_source" NOT NULL,
	"printer_name" varchar(255) NOT NULL,
	"job_type" "print_job_type" NOT NULL,
	"status" "print_job_status" DEFAULT 'pending' NOT NULL,
	"payload" jsonb NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"printed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(320),
	"role" "user_role" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "check_discount_items" ADD CONSTRAINT "check_discount_items_check_discount_id_check_discounts_id_fk" FOREIGN KEY ("check_discount_id") REFERENCES "public"."check_discounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_discount_items" ADD CONSTRAINT "check_discount_items_check_item_id_check_items_id_fk" FOREIGN KEY ("check_item_id") REFERENCES "public"."check_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_discounts" ADD CONSTRAINT "check_discounts_check_id_checks_id_fk" FOREIGN KEY ("check_id") REFERENCES "public"."checks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_discounts" ADD CONSTRAINT "check_discounts_combo_rule_id_combo_rules_id_fk" FOREIGN KEY ("combo_rule_id") REFERENCES "public"."combo_rules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_items" ADD CONSTRAINT "check_items_check_id_checks_id_fk" FOREIGN KEY ("check_id") REFERENCES "public"."checks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_items" ADD CONSTRAINT "check_items_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checks" ADD CONSTRAINT "checks_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "combo_rule_group_items" ADD CONSTRAINT "combo_rule_group_items_combo_rule_group_id_combo_rule_groups_id_fk" FOREIGN KEY ("combo_rule_group_id") REFERENCES "public"."combo_rule_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "combo_rule_group_items" ADD CONSTRAINT "combo_rule_group_items_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "combo_rule_groups" ADD CONSTRAINT "combo_rule_groups_combo_rule_id_combo_rules_id_fk" FOREIGN KEY ("combo_rule_id") REFERENCES "public"."combo_rules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_category_id_menu_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."menu_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_discount_items" ADD CONSTRAINT "order_discount_items_order_discount_id_order_discounts_id_fk" FOREIGN KEY ("order_discount_id") REFERENCES "public"."order_discounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_discount_items" ADD CONSTRAINT "order_discount_items_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_discounts" ADD CONSTRAINT "order_discounts_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_discounts" ADD CONSTRAINT "order_discounts_combo_rule_id_combo_rules_id_fk" FOREIGN KEY ("combo_rule_id") REFERENCES "public"."combo_rules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_check_id_checks_id_fk" FOREIGN KEY ("check_id") REFERENCES "public"."checks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "check_discount_items_check_discount_id_idx" ON "check_discount_items" USING btree ("check_discount_id");--> statement-breakpoint
CREATE INDEX "check_discount_items_check_item_id_idx" ON "check_discount_items" USING btree ("check_item_id");--> statement-breakpoint
CREATE INDEX "check_discounts_check_id_idx" ON "check_discounts" USING btree ("check_id");--> statement-breakpoint
CREATE INDEX "check_discounts_combo_rule_id_idx" ON "check_discounts" USING btree ("combo_rule_id");--> statement-breakpoint
CREATE INDEX "check_items_check_id_idx" ON "check_items" USING btree ("check_id");--> statement-breakpoint
CREATE INDEX "check_items_order_item_id_idx" ON "check_items" USING btree ("order_item_id");--> statement-breakpoint
CREATE INDEX "checks_order_id_idx" ON "checks" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "checks_status_idx" ON "checks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "checks_created_at_idx" ON "checks" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "combo_rule_group_items_combo_rule_group_id_idx" ON "combo_rule_group_items" USING btree ("combo_rule_group_id");--> statement-breakpoint
CREATE INDEX "combo_rule_group_items_menu_item_id_idx" ON "combo_rule_group_items" USING btree ("menu_item_id");--> statement-breakpoint
CREATE INDEX "combo_rule_groups_combo_rule_id_idx" ON "combo_rule_groups" USING btree ("combo_rule_id");--> statement-breakpoint
CREATE INDEX "combo_rule_groups_sort_order_idx" ON "combo_rule_groups" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "combo_rules_priority_idx" ON "combo_rules" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "combo_rules_is_active_idx" ON "combo_rules" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "menu_categories_sort_order_idx" ON "menu_categories" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "menu_categories_is_active_idx" ON "menu_categories" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "menu_items_category_id_idx" ON "menu_items" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "menu_items_kitchen_station_idx" ON "menu_items" USING btree ("kitchen_station");--> statement-breakpoint
CREATE INDEX "menu_items_is_available_idx" ON "menu_items" USING btree ("is_available");--> statement-breakpoint
CREATE INDEX "menu_items_sort_order_idx" ON "menu_items" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "order_discount_items_order_discount_id_idx" ON "order_discount_items" USING btree ("order_discount_id");--> statement-breakpoint
CREATE INDEX "order_discount_items_order_item_id_idx" ON "order_discount_items" USING btree ("order_item_id");--> statement-breakpoint
CREATE INDEX "order_discounts_order_id_idx" ON "order_discounts" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_discounts_combo_rule_id_idx" ON "order_discounts" USING btree ("combo_rule_id");--> statement-breakpoint
CREATE INDEX "order_discounts_created_at_idx" ON "order_discounts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "order_items_order_id_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_menu_item_id_idx" ON "order_items" USING btree ("menu_item_id");--> statement-breakpoint
CREATE INDEX "order_items_status_idx" ON "order_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "order_items_created_at_idx" ON "order_items" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_order_number_unique_idx" ON "orders" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "orders_created_by_idx" ON "orders" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "payments_order_id_idx" ON "payments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "payments_check_id_idx" ON "payments" USING btree ("check_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payments_created_at_idx" ON "payments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "print_jobs_status_idx" ON "print_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "print_jobs_created_at_idx" ON "print_jobs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_is_active_idx" ON "users" USING btree ("is_active");