CREATE TYPE "public"."notification_status" AS ENUM('pending', 'sent', 'failed');--> statement-breakpoint
CREATE TABLE "notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"product_id" uuid,
	"document_id" uuid,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"recipients" text[] NOT NULL,
	"status" "notification_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "notification_setting" (
	"key" text PRIMARY KEY NOT NULL,
	"roles" "role"[] NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "min_level" numeric(14, 3);--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_document_id_stock_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."stock_document"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notification_due_idx" ON "notification" USING btree ("status","next_attempt_at");--> statement-breakpoint
-- Admin and mühendis are warned by default.
INSERT INTO "notification_setting" ("key", "roles") VALUES ('kritik_seviye', ARRAY['admin', 'muhendis']::role[]);
