CREATE TYPE "public"."reputation_audit_entity_type" AS ENUM('FEEDBACK', 'REPLY', 'CONNECTOR', 'SETTINGS');--> statement-breakpoint
CREATE TYPE "public"."reputation_connector_provider" AS ENUM('GOOGLE');--> statement-breakpoint
CREATE TYPE "public"."reputation_connector_status" AS ENUM('DISCONNECTED', 'CONNECTING', 'CONNECTED', 'ERROR', 'AUTH_EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."feedback_reply_status" AS ENUM('DRAFT', 'READY', 'PUBLISHED', 'FAILED', 'DELETED');--> statement-breakpoint
CREATE TYPE "public"."feedback_sentiment" AS ENUM('POSITIVE', 'NEUTRAL', 'NEGATIVE');--> statement-breakpoint
CREATE TYPE "public"."feedback_source" AS ENUM('GOOGLE', 'DIRECT');--> statement-breakpoint
CREATE TYPE "public"."feedback_status" AS ENUM('NEW', 'TO_PROCESS', 'DRAFTED', 'REPLIED', 'FOLLOW_UP', 'RESOLVED', 'ARCHIVED', 'SPAM');--> statement-breakpoint
CREATE TYPE "public"."feedback_type" AS ENUM('PUBLIC_REVIEW', 'DIRECT_FEEDBACK');--> statement-breakpoint
CREATE TYPE "public"."feedback_urgency" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');--> statement-breakpoint
CREATE TYPE "public"."feedback_service_period" AS ENUM('LUNCH', 'DINNER', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."cloud_role" AS ENUM('owner', 'admin', 'manager', 'employee');--> statement-breakpoint
CREATE TYPE "public"."domain_status" AS ENUM('pending', 'active', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."membership_status" AS ENUM('active', 'invited', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."organization_status" AS ENUM('active', 'disabled');--> statement-breakpoint
CREATE TABLE "auth_audit_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"event" varchar(100) NOT NULL,
	"actor_user_id" uuid,
	"subject_user_id" uuid,
	"organization_id" uuid,
	"establishment_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_login_attempts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"key_hash" varchar(64) NOT NULL,
	"attempted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"succeeded" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"establishment_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"auth_version" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"ip_hash" varchar(64),
	"user_agent" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "direct_customer_feedback" (
	"id" uuid PRIMARY KEY NOT NULL,
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
CREATE TABLE "feedback_internal_notes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"feedback_item_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback_items" (
	"id" uuid PRIMARY KEY NOT NULL,
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
	"id" uuid PRIMARY KEY NOT NULL,
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
	"id" uuid PRIMARY KEY NOT NULL,
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
	"id" uuid PRIMARY KEY NOT NULL,
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
	"id" uuid PRIMARY KEY NOT NULL,
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
CREATE TABLE "establishments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"status" "organization_status" DEFAULT 'active' NOT NULL,
	"locale" varchar(35) DEFAULT 'fr-FR' NOT NULL,
	"timezone" varchar(100) DEFAULT 'Europe/Paris' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"status" "organization_status" DEFAULT 'active' NOT NULL,
	"locale" varchar(35) DEFAULT 'fr-FR' NOT NULL,
	"timezone" varchar(100) DEFAULT 'Europe/Paris' NOT NULL,
	"currency" varchar(3) DEFAULT 'EUR' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_domains" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"establishment_id" uuid NOT NULL,
	"hostname" varchar(253) NOT NULL,
	"status" "domain_status" DEFAULT 'pending' NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_entitlements" (
	"organization_id" uuid NOT NULL,
	"establishment_id" uuid NOT NULL,
	"key" varchar(150) NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_entitlements_organization_id_establishment_id_key_pk" PRIMARY KEY("organization_id","establishment_id","key")
);
--> statement-breakpoint
CREATE TABLE "tenant_memberships" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"establishment_id" uuid,
	"role" "cloud_role" NOT NULL,
	"status" "membership_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"password_hash" text,
	"email_verified_at" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"auth_version" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auth_audit_events" ADD CONSTRAINT "auth_audit_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_audit_events" ADD CONSTRAINT "auth_audit_events_subject_user_id_users_id_fk" FOREIGN KEY ("subject_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_audit_events" ADD CONSTRAINT "auth_audit_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_audit_events" ADD CONSTRAINT "auth_audit_events_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_customer_feedback" ADD CONSTRAINT "direct_customer_feedback_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_customer_feedback" ADD CONSTRAINT "direct_customer_feedback_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_customer_feedback" ADD CONSTRAINT "direct_customer_feedback_feedback_item_id_feedback_items_id_fk" FOREIGN KEY ("feedback_item_id") REFERENCES "public"."feedback_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_internal_notes" ADD CONSTRAINT "feedback_internal_notes_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_internal_notes" ADD CONSTRAINT "feedback_internal_notes_feedback_item_id_feedback_items_id_fk" FOREIGN KEY ("feedback_item_id") REFERENCES "public"."feedback_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_internal_notes" ADD CONSTRAINT "feedback_internal_notes_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_items" ADD CONSTRAINT "feedback_items_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_items" ADD CONSTRAINT "feedback_items_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_items" ADD CONSTRAINT "feedback_items_assigned_to_user_id_users_id_fk" FOREIGN KEY ("assigned_to_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_replies" ADD CONSTRAINT "feedback_replies_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_replies" ADD CONSTRAINT "feedback_replies_feedback_item_id_feedback_items_id_fk" FOREIGN KEY ("feedback_item_id") REFERENCES "public"."feedback_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_replies" ADD CONSTRAINT "feedback_replies_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_replies" ADD CONSTRAINT "feedback_replies_edited_by_user_id_users_id_fk" FOREIGN KEY ("edited_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_replies" ADD CONSTRAINT "feedback_replies_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_replies" ADD CONSTRAINT "feedback_replies_published_by_user_id_users_id_fk" FOREIGN KEY ("published_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reputation_audit_events" ADD CONSTRAINT "reputation_audit_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reputation_audit_events" ADD CONSTRAINT "reputation_audit_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reputation_connectors" ADD CONSTRAINT "reputation_connectors_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reputation_connectors" ADD CONSTRAINT "reputation_connectors_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reputation_settings" ADD CONSTRAINT "reputation_settings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reputation_settings" ADD CONSTRAINT "reputation_settings_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "establishments" ADD CONSTRAINT "establishments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_domains" ADD CONSTRAINT "tenant_domains_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_domains" ADD CONSTRAINT "tenant_domains_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_entitlements" ADD CONSTRAINT "tenant_entitlements_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_entitlements" ADD CONSTRAINT "tenant_entitlements_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_memberships" ADD CONSTRAINT "tenant_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_memberships" ADD CONSTRAINT "tenant_memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_memberships" ADD CONSTRAINT "tenant_memberships_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auth_audit_events_actor_user_id_idx" ON "auth_audit_events" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "auth_audit_events_subject_user_id_idx" ON "auth_audit_events" USING btree ("subject_user_id");--> statement-breakpoint
CREATE INDEX "auth_audit_events_scope_idx" ON "auth_audit_events" USING btree ("organization_id","establishment_id");--> statement-breakpoint
CREATE INDEX "auth_audit_events_created_at_idx" ON "auth_audit_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "auth_login_attempts_key_time_idx" ON "auth_login_attempts" USING btree ("key_hash","attempted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_sessions_token_hash_unique_idx" ON "auth_sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "auth_sessions_user_id_idx" ON "auth_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_sessions_scope_idx" ON "auth_sessions" USING btree ("organization_id","establishment_id");--> statement-breakpoint
CREATE INDEX "auth_sessions_expires_at_idx" ON "auth_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "password_reset_tokens_hash_unique_idx" ON "password_reset_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_expires_at_idx" ON "password_reset_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "direct_customer_feedback_item_unique_idx" ON "direct_customer_feedback" USING btree ("feedback_item_id");--> statement-breakpoint
CREATE INDEX "direct_customer_feedback_scope_idx" ON "direct_customer_feedback" USING btree ("organization_id","establishment_id");--> statement-breakpoint
CREATE INDEX "direct_customer_feedback_ip_created_idx" ON "direct_customer_feedback" USING btree ("submission_ip_hash","created_at");--> statement-breakpoint
CREATE INDEX "feedback_internal_notes_organization_id_idx" ON "feedback_internal_notes" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "feedback_internal_notes_feedback_item_id_idx" ON "feedback_internal_notes" USING btree ("feedback_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "feedback_items_provider_external_unique_idx" ON "feedback_items" USING btree ("organization_id","source","external_id");--> statement-breakpoint
CREATE INDEX "feedback_items_scope_idx" ON "feedback_items" USING btree ("organization_id","establishment_id");--> statement-breakpoint
CREATE INDEX "feedback_items_status_idx" ON "feedback_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "feedback_items_received_at_idx" ON "feedback_items" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "feedback_items_assigned_to_user_id_idx" ON "feedback_items" USING btree ("assigned_to_user_id");--> statement-breakpoint
CREATE INDEX "feedback_replies_organization_id_idx" ON "feedback_replies" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "feedback_replies_feedback_item_id_idx" ON "feedback_replies" USING btree ("feedback_item_id");--> statement-breakpoint
CREATE INDEX "feedback_replies_status_idx" ON "feedback_replies" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reputation_audit_events_organization_id_idx" ON "reputation_audit_events" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "reputation_audit_events_entity_idx" ON "reputation_audit_events" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "reputation_audit_events_created_at_idx" ON "reputation_audit_events" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "reputation_connectors_location_provider_unique_idx" ON "reputation_connectors" USING btree ("organization_id","establishment_id","provider");--> statement-breakpoint
CREATE INDEX "reputation_connectors_status_idx" ON "reputation_connectors" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "reputation_settings_location_unique_idx" ON "reputation_settings" USING btree ("organization_id","establishment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reputation_settings_public_slug_unique_idx" ON "reputation_settings" USING btree ("public_feedback_slug");--> statement-breakpoint
CREATE UNIQUE INDEX "establishments_org_slug_unique_idx" ON "establishments" USING btree ("organization_id","slug");--> statement-breakpoint
CREATE INDEX "establishments_organization_id_idx" ON "establishments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "establishments_status_idx" ON "establishments" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "organizations_slug_unique_idx" ON "organizations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "organizations_status_idx" ON "organizations" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_domains_hostname_unique_idx" ON "tenant_domains" USING btree ("hostname");--> statement-breakpoint
CREATE INDEX "tenant_domains_scope_idx" ON "tenant_domains" USING btree ("organization_id","establishment_id");--> statement-breakpoint
CREATE INDEX "tenant_entitlements_scope_idx" ON "tenant_entitlements" USING btree ("organization_id","establishment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_memberships_scope_unique_idx" ON "tenant_memberships" USING btree ("user_id","organization_id","establishment_id");--> statement-breakpoint
CREATE INDEX "tenant_memberships_user_id_idx" ON "tenant_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tenant_memberships_scope_idx" ON "tenant_memberships" USING btree ("organization_id","establishment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_is_active_idx" ON "users" USING btree ("is_active");