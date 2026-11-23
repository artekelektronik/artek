CREATE TYPE "public"."request_status" AS ENUM('yeni', 'yanitlandi', 'kapandi');--> statement-breakpoint
ALTER TYPE "public"."activity_entity" ADD VALUE 'talep';--> statement-breakpoint
CREATE TABLE "quote_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"contact" text NOT NULL,
	"message" text NOT NULL,
	"subject" text,
	"product_code" text,
	"page_url" text,
	"locale" text DEFAULT 'tr' NOT NULL,
	"photo_url" text,
	"status" "request_status" DEFAULT 'yeni' NOT NULL,
	"status_by" text,
	"status_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quote_request" ADD CONSTRAINT "quote_request_status_by_user_id_fk" FOREIGN KEY ("status_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quote_request_created_idx" ON "quote_request" USING btree ("created_at");