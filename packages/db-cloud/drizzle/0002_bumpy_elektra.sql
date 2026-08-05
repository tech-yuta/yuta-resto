CREATE TYPE "public"."booking_actor_type" AS ENUM('GUEST', 'USER', 'SYSTEM');--> statement-breakpoint
CREATE TYPE "public"."booking_confirmation_mode" AS ENUM('AUTOMATIC', 'MANUAL');--> statement-breakpoint
CREATE TYPE "public"."booking_exception_kind" AS ENUM('CLOSED_ALL_DAY', 'CLOSED_SERVICE', 'MODIFIED_HOURS', 'BLOCKED_SLOT');--> statement-breakpoint
CREATE TYPE "public"."booking_notification_status" AS ENUM('PENDING', 'PROCESSING', 'SENT', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."reservation_source" AS ENUM('DIRECT', 'GOOGLE', 'FACEBOOK', 'INSTAGRAM', 'TIKTOK', 'QR_CODE', 'WEBSITE', 'PHONE', 'BACK_OFFICE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."reservation_status" AS ENUM('PENDING', 'CONFIRMED', 'DECLINED', 'CANCELLED', 'SEATED', 'COMPLETED', 'NO_SHOW');--> statement-breakpoint
CREATE TABLE "booking_audit_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"establishment_id" uuid NOT NULL,
	"reservation_id" uuid,
	"actor_type" "booking_actor_type" NOT NULL,
	"actor_user_id" uuid,
	"event_type" varchar(100) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_exceptions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"establishment_id" uuid NOT NULL,
	"exception_date" date NOT NULL,
	"kind" "booking_exception_kind" NOT NULL,
	"service_period_id" uuid,
	"start_time" time(0),
	"end_time" time(0),
	"capacity_override" integer,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_notification_deliveries" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"establishment_id" uuid NOT NULL,
	"reservation_id" uuid NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"channel" varchar(30) DEFAULT 'EMAIL' NOT NULL,
	"recipient" varchar(254) NOT NULL,
	"status" "booking_notification_status" DEFAULT 'PENDING' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"provider_message_id" text,
	"last_error" text,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_public_attempts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"establishment_id" uuid NOT NULL,
	"action" varchar(30) NOT NULL,
	"subject_hash" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_service_periods" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"establishment_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"start_time" time(0) NOT NULL,
	"end_time" time(0) NOT NULL,
	"capacity" integer NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_settings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"establishment_id" uuid NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"confirmation_mode" "booking_confirmation_mode" DEFAULT 'MANUAL' NOT NULL,
	"minimum_party_size" integer DEFAULT 1 NOT NULL,
	"maximum_party_size" integer DEFAULT 12 NOT NULL,
	"slot_interval_minutes" integer DEFAULT 30 NOT NULL,
	"average_duration_minutes" integer DEFAULT 90 NOT NULL,
	"minimum_notice_minutes" integer DEFAULT 120 NOT NULL,
	"booking_window_days" integer DEFAULT 60 NOT NULL,
	"cancellation_deadline_minutes" integer DEFAULT 120 NOT NULL,
	"public_phone" varchar(30),
	"public_email" varchar(254),
	"address" text,
	"welcome_message" text,
	"booking_policy" text,
	"logo_url" text,
	"cover_image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservation_internal_notes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"establishment_id" uuid NOT NULL,
	"reservation_id" uuid NOT NULL,
	"author_user_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservation_status_history" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"establishment_id" uuid NOT NULL,
	"reservation_id" uuid NOT NULL,
	"from_status" "reservation_status",
	"to_status" "reservation_status" NOT NULL,
	"actor_type" "booking_actor_type" NOT NULL,
	"actor_user_id" uuid,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"establishment_id" uuid NOT NULL,
	"reference" varchar(30) NOT NULL,
	"status" "reservation_status" NOT NULL,
	"source" "reservation_source" DEFAULT 'DIRECT' NOT NULL,
	"local_date" date NOT NULL,
	"local_time" time(0) NOT NULL,
	"timezone" varchar(100) NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"party_size" integer NOT NULL,
	"guest_first_name" varchar(100) NOT NULL,
	"guest_last_name" varchar(100) NOT NULL,
	"guest_email" varchar(254) NOT NULL,
	"guest_phone" varchar(30) NOT NULL,
	"special_requirements" text,
	"marketing_consent" boolean DEFAULT false NOT NULL,
	"policy_accepted_at" timestamp with time zone,
	"public_token_hash" varchar(64) NOT NULL,
	"idempotency_hash" varchar(64) NOT NULL,
	"request_fingerprint" varchar(64) NOT NULL,
	"establishment_name_snapshot" varchar(255) NOT NULL,
	"created_by_user_id" uuid,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "booking_audit_events" ADD CONSTRAINT "booking_audit_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_audit_events" ADD CONSTRAINT "booking_audit_events_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_audit_events" ADD CONSTRAINT "booking_audit_events_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_audit_events" ADD CONSTRAINT "booking_audit_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_exceptions" ADD CONSTRAINT "booking_exceptions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_exceptions" ADD CONSTRAINT "booking_exceptions_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_exceptions" ADD CONSTRAINT "booking_exceptions_service_period_id_booking_service_periods_id_fk" FOREIGN KEY ("service_period_id") REFERENCES "public"."booking_service_periods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_notification_deliveries" ADD CONSTRAINT "booking_notification_deliveries_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_notification_deliveries" ADD CONSTRAINT "booking_notification_deliveries_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_notification_deliveries" ADD CONSTRAINT "booking_notification_deliveries_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_public_attempts" ADD CONSTRAINT "booking_public_attempts_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_service_periods" ADD CONSTRAINT "booking_service_periods_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_service_periods" ADD CONSTRAINT "booking_service_periods_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_settings" ADD CONSTRAINT "booking_settings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_settings" ADD CONSTRAINT "booking_settings_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_internal_notes" ADD CONSTRAINT "reservation_internal_notes_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_internal_notes" ADD CONSTRAINT "reservation_internal_notes_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_internal_notes" ADD CONSTRAINT "reservation_internal_notes_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_internal_notes" ADD CONSTRAINT "reservation_internal_notes_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_status_history" ADD CONSTRAINT "reservation_status_history_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_status_history" ADD CONSTRAINT "reservation_status_history_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_status_history" ADD CONSTRAINT "reservation_status_history_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_status_history" ADD CONSTRAINT "reservation_status_history_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "booking_audit_events_scope_idx" ON "booking_audit_events" USING btree ("organization_id","establishment_id");--> statement-breakpoint
CREATE INDEX "booking_exceptions_scope_date_idx" ON "booking_exceptions" USING btree ("organization_id","establishment_id","exception_date");--> statement-breakpoint
CREATE INDEX "booking_notification_outbox_idx" ON "booking_notification_deliveries" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "booking_public_attempts_lookup_idx" ON "booking_public_attempts" USING btree ("establishment_id","action","subject_hash","created_at");--> statement-breakpoint
CREATE INDEX "booking_public_attempts_cleanup_idx" ON "booking_public_attempts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "booking_service_periods_scope_day_idx" ON "booking_service_periods" USING btree ("organization_id","establishment_id","day_of_week");--> statement-breakpoint
CREATE UNIQUE INDEX "booking_settings_scope_unique_idx" ON "booking_settings" USING btree ("organization_id","establishment_id");--> statement-breakpoint
CREATE INDEX "reservation_internal_notes_reservation_idx" ON "reservation_internal_notes" USING btree ("reservation_id");--> statement-breakpoint
CREATE INDEX "reservation_status_history_reservation_idx" ON "reservation_status_history" USING btree ("reservation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reservations_reference_unique_idx" ON "reservations" USING btree ("reference");--> statement-breakpoint
CREATE UNIQUE INDEX "reservations_public_token_hash_unique_idx" ON "reservations" USING btree ("public_token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "reservations_scope_idempotency_unique_idx" ON "reservations" USING btree ("organization_id","establishment_id","idempotency_hash");--> statement-breakpoint
CREATE INDEX "reservations_scope_start_idx" ON "reservations" USING btree ("organization_id","establishment_id","start_at");--> statement-breakpoint
CREATE INDEX "reservations_capacity_idx" ON "reservations" USING btree ("organization_id","establishment_id","local_date","local_time","status");