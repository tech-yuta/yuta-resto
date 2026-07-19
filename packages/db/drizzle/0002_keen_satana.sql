CREATE TYPE "public"."domain_status" AS ENUM('pending', 'active', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."membership_status" AS ENUM('active', 'invited', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."tenant_role" AS ENUM('owner', 'admin', 'manager', 'cashier', 'kitchen', 'waiter', 'accountant', 'employee');--> statement-breakpoint
CREATE TYPE "public"."tenant_status" AS ENUM('active', 'disabled');--> statement-breakpoint
CREATE TABLE "establishments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"status" "tenant_status" DEFAULT 'active' NOT NULL,
	"locale" varchar(35) DEFAULT 'fr-FR' NOT NULL,
	"timezone" varchar(100) DEFAULT 'Europe/Paris' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"status" "tenant_status" DEFAULT 'active' NOT NULL,
	"locale" varchar(35) DEFAULT 'fr-FR' NOT NULL,
	"timezone" varchar(100) DEFAULT 'Europe/Paris' NOT NULL,
	"currency" varchar(3) DEFAULT 'EUR' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"establishment_id" uuid,
	"role" "tenant_role" NOT NULL,
	"status" "membership_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "establishments" ADD CONSTRAINT "establishments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_domains" ADD CONSTRAINT "tenant_domains_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_domains" ADD CONSTRAINT "tenant_domains_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_entitlements" ADD CONSTRAINT "tenant_entitlements_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_entitlements" ADD CONSTRAINT "tenant_entitlements_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_memberships" ADD CONSTRAINT "tenant_memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_memberships" ADD CONSTRAINT "tenant_memberships_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "establishments_org_slug_unique_idx" ON "establishments" USING btree ("organization_id","slug");--> statement-breakpoint
CREATE INDEX "establishments_organization_id_idx" ON "establishments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "establishments_status_idx" ON "establishments" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "organizations_slug_unique_idx" ON "organizations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "organizations_status_idx" ON "organizations" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_domains_hostname_unique_idx" ON "tenant_domains" USING btree ("hostname");--> statement-breakpoint
CREATE INDEX "tenant_domains_tenant_idx" ON "tenant_domains" USING btree ("organization_id","establishment_id");--> statement-breakpoint
CREATE INDEX "tenant_domains_status_idx" ON "tenant_domains" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tenant_entitlements_tenant_idx" ON "tenant_entitlements" USING btree ("organization_id","establishment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_memberships_scope_unique_idx" ON "tenant_memberships" USING btree ("user_id","organization_id","establishment_id");--> statement-breakpoint
CREATE INDEX "tenant_memberships_user_id_idx" ON "tenant_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tenant_memberships_tenant_idx" ON "tenant_memberships" USING btree ("organization_id","establishment_id");--> statement-breakpoint
CREATE INDEX "tenant_memberships_status_idx" ON "tenant_memberships" USING btree ("status");
