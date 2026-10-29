CREATE TYPE "public"."change_source" AS ENUM('not', 'fatura', 'elle', 'oneri');--> statement-breakpoint
CREATE TABLE "customer_change" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"field" text NOT NULL,
	"old_value" text,
	"new_value" text,
	"source" "change_source" NOT NULL,
	"note_id" uuid,
	"user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customer_note" ADD COLUMN "proposal" jsonb;--> statement-breakpoint
ALTER TABLE "customer_note" ADD COLUMN "proposal_decided_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "customer_change" ADD CONSTRAINT "customer_change_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_change" ADD CONSTRAINT "customer_change_note_id_customer_note_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."customer_note"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_change" ADD CONSTRAINT "customer_change_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "customer_change_customer_idx" ON "customer_change" USING btree ("customer_id","created_at");