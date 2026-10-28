CREATE TYPE "public"."follow_up_channel" AS ENUM('telefon', 'eposta');--> statement-breakpoint
CREATE TYPE "public"."suggestion_kind" AS ENUM('arama', 'eposta');--> statement-breakpoint
CREATE TYPE "public"."suggestion_status" AS ENUM('bekliyor', 'gonderildi', 'yapildi', 'atlandi', 'basarisiz');--> statement-breakpoint
CREATE TABLE "assistant_suggestion" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"for_day" date NOT NULL,
	"kind" "suggestion_kind" NOT NULL,
	"reason" text NOT NULL,
	"talking_points" text[] DEFAULT '{}'::text[] NOT NULL,
	"subject" text,
	"body" text,
	"findings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "suggestion_status" DEFAULT 'bekliyor' NOT NULL,
	"error" text,
	"model" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_at" timestamp with time zone,
	"decided_by" text
);
--> statement-breakpoint
ALTER TABLE "customer" ADD COLUMN "follow_up_channel" "follow_up_channel" DEFAULT 'telefon' NOT NULL;--> statement-breakpoint
ALTER TABLE "customer" ADD COLUMN "email_opt_out_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "assistant_suggestion" ADD CONSTRAINT "assistant_suggestion_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_suggestion" ADD CONSTRAINT "assistant_suggestion_decided_by_user_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "assistant_suggestion_customer_day_idx" ON "assistant_suggestion" USING btree ("customer_id","for_day");--> statement-breakpoint
CREATE INDEX "assistant_suggestion_day_idx" ON "assistant_suggestion" USING btree ("for_day");