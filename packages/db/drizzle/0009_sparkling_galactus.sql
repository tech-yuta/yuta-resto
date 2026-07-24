CREATE TABLE "auth_audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event" varchar(100) NOT NULL,
	"actor_user_id" uuid,
	"subject_user_id" uuid,
	"organization_id" uuid,
	"establishment_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auth_audit_events" ADD CONSTRAINT "auth_audit_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_audit_events" ADD CONSTRAINT "auth_audit_events_subject_user_id_users_id_fk" FOREIGN KEY ("subject_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_audit_events" ADD CONSTRAINT "auth_audit_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_audit_events" ADD CONSTRAINT "auth_audit_events_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auth_audit_events_actor_user_id_idx" ON "auth_audit_events" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "auth_audit_events_subject_user_id_idx" ON "auth_audit_events" USING btree ("subject_user_id");--> statement-breakpoint
CREATE INDEX "auth_audit_events_scope_idx" ON "auth_audit_events" USING btree ("organization_id","establishment_id");--> statement-breakpoint
CREATE INDEX "auth_audit_events_created_at_idx" ON "auth_audit_events" USING btree ("created_at");