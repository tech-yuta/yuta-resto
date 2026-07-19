ALTER TABLE "payments" ADD COLUMN "idempotency_key" uuid;--> statement-breakpoint
ALTER TABLE "print_jobs" ADD COLUMN "order_id" uuid;--> statement-breakpoint
ALTER TABLE "print_jobs" ADD COLUMN "check_id" uuid;--> statement-breakpoint
ALTER TABLE "print_jobs" ADD COLUMN "payment_id" uuid;--> statement-breakpoint
ALTER TABLE "print_jobs" ADD COLUMN "idempotency_key" uuid;--> statement-breakpoint
ALTER TABLE "print_jobs" ADD CONSTRAINT "print_jobs_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "print_jobs" ADD CONSTRAINT "print_jobs_check_id_checks_id_fk" FOREIGN KEY ("check_id") REFERENCES "public"."checks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "print_jobs" ADD CONSTRAINT "print_jobs_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "payments_idempotency_key_unique_idx" ON "payments" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "print_jobs_order_id_idx" ON "print_jobs" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "print_jobs_check_id_idx" ON "print_jobs" USING btree ("check_id");--> statement-breakpoint
CREATE INDEX "print_jobs_payment_id_idx" ON "print_jobs" USING btree ("payment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "print_jobs_idempotency_key_unique_idx" ON "print_jobs" USING btree ("idempotency_key");