CREATE TYPE "public"."lead_event_kind" AS ENUM('eklendi', 'gorundu', 'durum', 'not', 'musteri');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('yeni', 'ulasildi', 'gorusuluyor', 'musteri_oldu', 'ilgilenmiyor');--> statement-breakpoint
CREATE TABLE "lead" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"norm_name" text NOT NULL,
	"website" text,
	"city" text,
	"sector" text,
	"why" text,
	"contact" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sources" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tax_id" text,
	"status" "lead_status" DEFAULT 'yeni' NOT NULL,
	"customer_id" uuid,
	"seen_count" integer DEFAULT 1 NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lead_norm_name_unique" UNIQUE("norm_name")
);
--> statement-breakpoint
CREATE TABLE "lead_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"kind" "lead_event_kind" NOT NULL,
	"text" text NOT NULL,
	"user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lead" ADD CONSTRAINT "lead_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_event" ADD CONSTRAINT "lead_event_lead_id_lead_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."lead"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_event" ADD CONSTRAINT "lead_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lead_event_lead_idx" ON "lead_event" USING btree ("lead_id","created_at");