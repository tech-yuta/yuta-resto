CREATE TYPE "public"."reputation_audit_entity_type" AS ENUM('FEEDBACK', 'REPLY', 'INCIDENT', 'CONNECTOR', 'SETTINGS');--> statement-breakpoint
CREATE TYPE "public"."reputation_connector_provider" AS ENUM('GOOGLE');--> statement-breakpoint
CREATE TYPE "public"."reputation_connector_status" AS ENUM('DISCONNECTED', 'CONNECTING', 'CONNECTED', 'SYNCING', 'ERROR', 'AUTH_EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."feedback_reply_status" AS ENUM('AI_SUGGESTION', 'DRAFT', 'READY', 'PUBLISHING', 'PUBLISHED', 'FAILED', 'DELETED');--> statement-breakpoint
CREATE TYPE "public"."feedback_sentiment" AS ENUM('POSITIVE', 'NEUTRAL', 'NEGATIVE');--> statement-breakpoint
CREATE TYPE "public"."feedback_source" AS ENUM('GOOGLE', 'DIRECT');--> statement-breakpoint
CREATE TYPE "public"."feedback_status" AS ENUM('NEW', 'TO_PROCESS', 'DRAFTED', 'REPLIED', 'FOLLOW_UP', 'RESOLVED', 'ARCHIVED', 'SPAM');--> statement-breakpoint
CREATE TYPE "public"."feedback_type" AS ENUM('PUBLIC_REVIEW', 'DIRECT_FEEDBACK');--> statement-breakpoint
CREATE TYPE "public"."feedback_urgency" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');--> statement-breakpoint
CREATE TYPE "public"."feedback_incident_priority" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');--> statement-breakpoint
CREATE TYPE "public"."feedback_incident_status" AS ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."feedback_service_period" AS ENUM('LUNCH', 'DINNER', 'OTHER');--> statement-breakpoint
CREATE TABLE "direct_customer_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"establishment_id" uuid NOT NULL,
	"feedback_item_id" uuid NOT NULL,
	"selected_topics" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"customer_name" varchar(255),
	"customer_email" varchar(320),
	"customer_phone" varchar(40),
	"consent_to_contact" boolean DEFAULT false NOT NULL,
	"consent_recorded_at" timestamp with time zone,
	"order_reference" varchar(100),
	"visit_date" timestamp with time zone,
	"service_period" "feedback_service_period",
	"source_tag" varchar(50),
	"submission_ip_hash" varchar(64),
	"user_agent" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"feedback_item_id" uuid NOT NULL,
	"sentiment" "feedback_sentiment" NOT NULL,
	"urgency" "feedback_urgency" NOT NULL,
	"summary" varchar(500) NOT NULL,
	"topics" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"suggested_action" varchar(500),
	"requires_follow_up" boolean DEFAULT false NOT NULL,
	"requires_manager_attention" boolean DEFAULT false NOT NULL,
	"confidence" real,
	"model" varchar(150) NOT NULL,
	"prompt_version" varchar(100) NOT NULL,
	"content_hash" varchar(64) NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feedback_analyses_confidence_check" CHECK ("feedback_analyses"."confidence" is null or ("feedback_analyses"."confidence" >= 0 and "feedback_analyses"."confidence" <= 1))
);
--> statement-breakpoint
CREATE TABLE "feedback_incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"establishment_id" uuid NOT NULL,
	"feedback_item_id" uuid NOT NULL,
	"category" varchar(100) NOT NULL,
	"priority" "feedback_incident_priority" NOT NULL,
	"status" "feedback_incident_status" DEFAULT 'OPEN' NOT NULL,
	"owner_user_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text,
	"root_cause" text,
	"corrective_action" text,
	"internal_notes" text,
	"due_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback_internal_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"feedback_item_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"establishment_id" uuid NOT NULL,
	"source" "feedback_source" NOT NULL,
	"type" "feedback_type" NOT NULL,
	"external_id" varchar(255),
	"external_url" text,
	"author_name" varchar(255),
	"author_avatar_url" text,
	"rating" integer,
	"title" varchar(500),
	"content" text,
	"language" varchar(35),
	"sentiment" "feedback_sentiment",
	"urgency" "feedback_urgency",
	"status" "feedback_status" DEFAULT 'NEW' NOT NULL,
	"assigned_to_user_id" uuid,
	"published_at" timestamp with time zone,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_synced_at" timestamp with time zone,
	"provider_metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feedback_items_rating_check" CHECK ("feedback_items"."rating" is null or ("feedback_items"."rating" >= 1 and "feedback_items"."rating" <= 5))
);
--> statement-breakpoint
CREATE TABLE "feedback_replies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"feedback_item_id" uuid NOT NULL,
	"content" text NOT NULL,
	"status" "feedback_reply_status" DEFAULT 'DRAFT' NOT NULL,
	"external_reply_id" varchar(255),
	"external_reply_status" varchar(100),
	"generated_by_ai" boolean DEFAULT false NOT NULL,
	"original_ai_content" text,
	"created_by_user_id" uuid,
	"edited_by_user_id" uuid,
	"approved_by_user_id" uuid,
	"published_by_user_id" uuid,
	"published_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"error_code" varchar(100),
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reputation_audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"entity_type" "reputation_audit_entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" varchar(100) NOT NULL,
	"actor_user_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reputation_connectors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"establishment_id" uuid NOT NULL,
	"provider" "reputation_connector_provider" NOT NULL,
	"external_account_id" varchar(255) NOT NULL,
	"external_location_id" varchar(255) NOT NULL,
	"status" "reputation_connector_status" DEFAULT 'DISCONNECTED' NOT NULL,
	"encrypted_access_token" text,
	"encrypted_refresh_token" text,
	"token_expires_at" timestamp with time zone,
	"granted_scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"last_synced_at" timestamp with time zone,
	"last_successful_sync_at" timestamp with time zone,
	"last_sync_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reputation_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"establishment_id" uuid NOT NULL,
	"brand_voice" text NOT NULL,
	"reply_signature" varchar(255),
	"default_reply_language" varchar(35) DEFAULT 'fr' NOT NULL,
	"allow_employee_publish" boolean DEFAULT false NOT NULL,
	"require_manager_approval" boolean DEFAULT false NOT NULL,
	"google_review_url" text,
	"facebook_review_url" text,
	"instagram_url" text,
	"public_feedback_enabled" boolean DEFAULT false NOT NULL,
	"public_feedback_slug" varchar(100) NOT NULL,
	"notify_on_new_review" boolean DEFAULT true NOT NULL,
	"notify_on_negative_review" boolean DEFAULT true NOT NULL,
	"negative_rating_threshold" integer DEFAULT 3 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reputation_settings_negative_threshold_check" CHECK ("reputation_settings"."negative_rating_threshold" >= 1 and "reputation_settings"."negative_rating_threshold" <= 5)
);
--> statement-breakpoint
ALTER TABLE "direct_customer_feedback" ADD CONSTRAINT "direct_customer_feedback_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_customer_feedback" ADD CONSTRAINT "direct_customer_feedback_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_customer_feedback" ADD CONSTRAINT "direct_customer_feedback_feedback_item_id_feedback_items_id_fk" FOREIGN KEY ("feedback_item_id") REFERENCES "public"."feedback_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_analyses" ADD CONSTRAINT "feedback_analyses_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_analyses" ADD CONSTRAINT "feedback_analyses_feedback_item_id_feedback_items_id_fk" FOREIGN KEY ("feedback_item_id") REFERENCES "public"."feedback_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_incidents" ADD CONSTRAINT "feedback_incidents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_incidents" ADD CONSTRAINT "feedback_incidents_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_incidents" ADD CONSTRAINT "feedback_incidents_feedback_item_id_feedback_items_id_fk" FOREIGN KEY ("feedback_item_id") REFERENCES "public"."feedback_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_internal_notes" ADD CONSTRAINT "feedback_internal_notes_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_internal_notes" ADD CONSTRAINT "feedback_internal_notes_feedback_item_id_feedback_items_id_fk" FOREIGN KEY ("feedback_item_id") REFERENCES "public"."feedback_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_items" ADD CONSTRAINT "feedback_items_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_items" ADD CONSTRAINT "feedback_items_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_replies" ADD CONSTRAINT "feedback_replies_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_replies" ADD CONSTRAINT "feedback_replies_feedback_item_id_feedback_items_id_fk" FOREIGN KEY ("feedback_item_id") REFERENCES "public"."feedback_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reputation_audit_events" ADD CONSTRAINT "reputation_audit_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reputation_connectors" ADD CONSTRAINT "reputation_connectors_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reputation_connectors" ADD CONSTRAINT "reputation_connectors_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reputation_settings" ADD CONSTRAINT "reputation_settings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reputation_settings" ADD CONSTRAINT "reputation_settings_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "direct_customer_feedback_item_unique_idx" ON "direct_customer_feedback" USING btree ("feedback_item_id");--> statement-breakpoint
CREATE INDEX "direct_customer_feedback_tenant_idx" ON "direct_customer_feedback" USING btree ("organization_id","establishment_id");--> statement-breakpoint
CREATE INDEX "direct_customer_feedback_ip_created_idx" ON "direct_customer_feedback" USING btree ("submission_ip_hash","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "feedback_analyses_feedback_item_unique_idx" ON "feedback_analyses" USING btree ("feedback_item_id");--> statement-breakpoint
CREATE INDEX "feedback_analyses_organization_id_idx" ON "feedback_analyses" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "feedback_analyses_urgency_idx" ON "feedback_analyses" USING btree ("urgency");--> statement-breakpoint
CREATE INDEX "feedback_incidents_tenant_idx" ON "feedback_incidents" USING btree ("organization_id","establishment_id");--> statement-breakpoint
CREATE INDEX "feedback_incidents_feedback_item_id_idx" ON "feedback_incidents" USING btree ("feedback_item_id");--> statement-breakpoint
CREATE INDEX "feedback_incidents_status_idx" ON "feedback_incidents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "feedback_incidents_priority_idx" ON "feedback_incidents" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "feedback_incidents_owner_user_id_idx" ON "feedback_incidents" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "feedback_incidents_due_at_idx" ON "feedback_incidents" USING btree ("due_at");--> statement-breakpoint
CREATE INDEX "feedback_internal_notes_organization_id_idx" ON "feedback_internal_notes" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "feedback_internal_notes_feedback_item_id_idx" ON "feedback_internal_notes" USING btree ("feedback_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "feedback_items_provider_external_unique_idx" ON "feedback_items" USING btree ("organization_id","source","external_id");--> statement-breakpoint
CREATE INDEX "feedback_items_organization_id_idx" ON "feedback_items" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "feedback_items_establishment_id_idx" ON "feedback_items" USING btree ("establishment_id");--> statement-breakpoint
CREATE INDEX "feedback_items_source_idx" ON "feedback_items" USING btree ("source");--> statement-breakpoint
CREATE INDEX "feedback_items_status_idx" ON "feedback_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "feedback_items_rating_idx" ON "feedback_items" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "feedback_items_sentiment_idx" ON "feedback_items" USING btree ("sentiment");--> statement-breakpoint
CREATE INDEX "feedback_items_urgency_idx" ON "feedback_items" USING btree ("urgency");--> statement-breakpoint
CREATE INDEX "feedback_items_published_at_idx" ON "feedback_items" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "feedback_items_received_at_idx" ON "feedback_items" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "feedback_items_assigned_to_user_id_idx" ON "feedback_items" USING btree ("assigned_to_user_id");--> statement-breakpoint
CREATE INDEX "feedback_items_tenant_inbox_idx" ON "feedback_items" USING btree ("organization_id","establishment_id","received_at");--> statement-breakpoint
CREATE INDEX "feedback_replies_organization_id_idx" ON "feedback_replies" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "feedback_replies_feedback_item_id_idx" ON "feedback_replies" USING btree ("feedback_item_id");--> statement-breakpoint
CREATE INDEX "feedback_replies_status_idx" ON "feedback_replies" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reputation_audit_events_organization_id_idx" ON "reputation_audit_events" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "reputation_audit_events_entity_idx" ON "reputation_audit_events" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "reputation_audit_events_created_at_idx" ON "reputation_audit_events" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "reputation_connectors_location_provider_unique_idx" ON "reputation_connectors" USING btree ("organization_id","establishment_id","provider");--> statement-breakpoint
CREATE INDEX "reputation_connectors_status_idx" ON "reputation_connectors" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "reputation_settings_location_unique_idx" ON "reputation_settings" USING btree ("organization_id","establishment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reputation_settings_public_slug_unique_idx" ON "reputation_settings" USING btree ("public_feedback_slug");