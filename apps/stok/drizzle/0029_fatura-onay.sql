CREATE TYPE "public"."invoice_status" AS ENUM('taslak', 'onaylandi');--> statement-breakpoint
ALTER TYPE "public"."activity_action" ADD VALUE 'onaylandi';--> statement-breakpoint
ALTER TYPE "public"."document_kind" ADD VALUE 'fatura';--> statement-breakpoint
ALTER TYPE "public"."movement_type" ADD VALUE 'satis_iadesi';--> statement-breakpoint
CREATE TABLE "invoice_file" (
	"invoice_id" uuid PRIMARY KEY NOT NULL,
	"bytes" "bytea" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invoice" ALTER COLUMN "customer_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "status" "invoice_status" DEFAULT 'taslak' NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "buyer" jsonb;--> statement-breakpoint
-- Invoices uploaded before this were linked to their Müşteri on upload; that Müşteri is their buyer.
UPDATE "invoice" SET "buyer" = jsonb_build_object('name', c."name", 'taxId', c."tax_id", 'taxIdType', c."tax_id_type", 'city', c."city", 'district', c."district", 'email', c."email") FROM "customer" c WHERE c."id" = "invoice"."customer_id";--> statement-breakpoint
ALTER TABLE "invoice" ALTER COLUMN "buyer" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "lokasyon_id" uuid;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "stock_document_id" uuid;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "confirmed_by" text;--> statement-breakpoint
ALTER TABLE "invoice_line" ADD COLUMN "product_id" uuid;--> statement-breakpoint
ALTER TABLE "invoice_line" ADD COLUMN "stock_quantity" numeric(14, 3);--> statement-breakpoint
ALTER TABLE "invoice_file" ADD CONSTRAINT "invoice_file_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_lokasyon_id_lokasyon_id_fk" FOREIGN KEY ("lokasyon_id") REFERENCES "public"."lokasyon"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_stock_document_id_stock_document_id_fk" FOREIGN KEY ("stock_document_id") REFERENCES "public"."stock_document"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_confirmed_by_user_id_fk" FOREIGN KEY ("confirmed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line" ADD CONSTRAINT "invoice_line_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_confirmed_has_customer" CHECK ("invoice"."status" = 'taslak' OR "invoice"."customer_id" IS NOT NULL);