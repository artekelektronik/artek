CREATE TYPE "public"."activity_action" AS ENUM('eklendi', 'duzenlendi', 'arsivlendi', 'geri_alindi', 'musteri_oldu');--> statement-breakpoint
CREATE TYPE "public"."activity_entity" AS ENUM('fatura', 'musteri', 'aday');--> statement-breakpoint
CREATE TABLE "activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity" "activity_entity" NOT NULL,
	"entity_id" uuid NOT NULL,
	"label" text NOT NULL,
	"action" "activity_action" NOT NULL,
	"detail" text,
	"user_id" text,
	"via" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_log_created_idx" ON "activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "activity_log_entity_idx" ON "activity_log" USING btree ("entity","entity_id");