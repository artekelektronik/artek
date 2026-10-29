ALTER TABLE "customer" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "customer" ADD COLUMN "archived_by" text;--> statement-breakpoint
ALTER TABLE "customer" ADD COLUMN "archive_reason" text;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "archived_by" text;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "archive_reason" text;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "archived_by" text;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "archive_reason" text;--> statement-breakpoint
ALTER TABLE "customer" ADD CONSTRAINT "customer_archived_by_user_id_fk" FOREIGN KEY ("archived_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_archived_by_user_id_fk" FOREIGN KEY ("archived_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead" ADD CONSTRAINT "lead_archived_by_user_id_fk" FOREIGN KEY ("archived_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;