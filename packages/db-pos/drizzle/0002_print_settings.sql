CREATE TABLE "print_settings" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"kitchen_copies" integer DEFAULT 1 NOT NULL,
	"counter_copies" integer DEFAULT 1 NOT NULL,
	"font_size_preset" varchar(16) DEFAULT 'standard' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "print_settings_singleton_check" CHECK ("print_settings"."id" = 'default'),
	CONSTRAINT "print_settings_kitchen_copies_check" CHECK ("print_settings"."kitchen_copies" between 1 and 3),
	CONSTRAINT "print_settings_counter_copies_check" CHECK ("print_settings"."counter_copies" between 1 and 3),
	CONSTRAINT "print_settings_font_size_preset_check" CHECK ("print_settings"."font_size_preset" in ('compact', 'standard', 'large'))
);
--> statement-breakpoint
INSERT INTO "print_settings" ("id") VALUES ('default');
