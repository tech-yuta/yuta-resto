CREATE TABLE "auth_selection_tickets" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"auth_version" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"ip_hash" varchar(64),
	"user_agent" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auth_selection_tickets" ADD CONSTRAINT "auth_selection_tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "auth_selection_tickets_token_hash_unique_idx" ON "auth_selection_tickets" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "auth_selection_tickets_user_id_idx" ON "auth_selection_tickets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_selection_tickets_expires_at_idx" ON "auth_selection_tickets" USING btree ("expires_at");