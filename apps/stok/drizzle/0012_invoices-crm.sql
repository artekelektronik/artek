CREATE TYPE "public"."customer_status" AS ENUM('aranacak', 'arandi', 'ulasilamadi', 'teklif_verildi', 'siparis_geldi', 'ilgilenmiyor');--> statement-breakpoint
CREATE TYPE "public"."panel" AS ENUM('musteri', 'finans');--> statement-breakpoint
CREATE TYPE "public"."panel_level" AS ENUM('gorur', 'duzenler');--> statement-breakpoint
CREATE TABLE "customer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tax_id" text NOT NULL,
	"tax_id_type" text NOT NULL,
	"name" text NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"district" text DEFAULT '' NOT NULL,
	"phone" text,
	"email" text,
	"website" text,
	"about" text,
	"contact_source" text,
	"status" "customer_status" DEFAULT 'aranacak' NOT NULL,
	"next_follow_up_on" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_tax_id_unique" UNIQUE("tax_id")
);
--> statement-breakpoint
CREATE TABLE "customer_note" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ettn" uuid NOT NULL,
	"number" text NOT NULL,
	"issued_on" date NOT NULL,
	"scenario" text NOT NULL,
	"type" text NOT NULL,
	"customer_id" uuid NOT NULL,
	"net_amount" numeric(14, 2) NOT NULL,
	"total_amount" numeric(14, 2) NOT NULL,
	"file_name" text NOT NULL,
	"file_sha256" text NOT NULL,
	"raw_text" text NOT NULL,
	"uploaded_by" text NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoice_ettn_unique" UNIQUE("ettn")
);
--> statement-breakpoint
CREATE TABLE "invoice_line" (
	"invoice_id" uuid NOT NULL,
	"seq" integer NOT NULL,
	"description" text NOT NULL,
	"product_name" text NOT NULL,
	"product_group" text NOT NULL,
	"quantity" numeric(14, 3) NOT NULL,
	"unit" text NOT NULL,
	"unit_price" numeric(14, 4) NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	CONSTRAINT "invoice_line_invoice_id_seq_pk" PRIMARY KEY("invoice_id","seq")
);
--> statement-breakpoint
CREATE TABLE "user_panel" (
	"user_id" text NOT NULL,
	"panel" "panel" NOT NULL,
	"level" "panel_level" NOT NULL,
	CONSTRAINT "user_panel_user_id_panel_pk" PRIMARY KEY("user_id","panel")
);
--> statement-breakpoint
ALTER TABLE "customer_note" ADD CONSTRAINT "customer_note_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_note" ADD CONSTRAINT "customer_note_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line" ADD CONSTRAINT "invoice_line_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_panel" ADD CONSTRAINT "user_panel_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "customer_note_customer_idx" ON "customer_note" USING btree ("customer_id","created_at");--> statement-breakpoint
CREATE INDEX "invoice_issued_idx" ON "invoice" USING btree ("issued_on");--> statement-breakpoint
CREATE INDEX "invoice_customer_idx" ON "invoice" USING btree ("customer_id");