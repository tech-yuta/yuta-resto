CREATE TABLE "local_auth_login_attempts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"attempted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"succeeded" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "local_auth_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"auth_version" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "local_users" ADD COLUMN "pin_hash" varchar(255);--> statement-breakpoint
ALTER TABLE "local_users" ADD COLUMN "auth_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "local_users" ADD COLUMN "last_login_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "local_auth_login_attempts" ADD CONSTRAINT "local_auth_login_attempts_user_id_local_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."local_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local_auth_sessions" ADD CONSTRAINT "local_auth_sessions_user_id_local_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."local_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "local_auth_login_attempts_user_time_idx" ON "local_auth_login_attempts" USING btree ("user_id","attempted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "local_auth_sessions_token_hash_unique_idx" ON "local_auth_sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "local_auth_sessions_user_id_idx" ON "local_auth_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "local_auth_sessions_expires_at_idx" ON "local_auth_sessions" USING btree ("expires_at");
