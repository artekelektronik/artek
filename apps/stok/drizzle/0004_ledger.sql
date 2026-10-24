CREATE TYPE "public"."document_kind" AS ENUM('mal_kabul', 'stok_cikisi', 'transfer_sevk', 'transfer_teslim', 'sayim', 'acilis', 'ters_kayit');--> statement-breakpoint
CREATE TYPE "public"."movement_type" AS ENUM('acilis', 'mal_kabul', 'transfer_sevk', 'transfer_teslim', 'transfer_kaybi', 'satis_teslimati', 'uretim_tuketimi', 'fire', 'sayim_duzeltmesi');--> statement-breakpoint
CREATE TABLE "stock" (
	"product_id" uuid NOT NULL,
	"lokasyon_id" uuid NOT NULL,
	"physical" numeric(14, 3) DEFAULT '0' NOT NULL,
	"reserved" numeric(14, 3) DEFAULT '0' NOT NULL,
	CONSTRAINT "stock_product_id_lokasyon_id_pk" PRIMARY KEY("product_id","lokasyon_id"),
	CONSTRAINT "stock_available_not_negative" CHECK ("stock"."physical" >= "stock"."reserved" AND "stock"."reserved" >= 0)
);
--> statement-breakpoint
CREATE TABLE "stock_document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "document_kind" NOT NULL,
	"lokasyon_id" uuid,
	"supplier" text,
	"reference" text,
	"reason" text,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"idempotency_key" text NOT NULL,
	CONSTRAINT "stock_document_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "stock_movement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"lokasyon_id" uuid,
	"transfer_id" uuid,
	"type" "movement_type" NOT NULL,
	"quantity" numeric(14, 3) NOT NULL,
	"unit" "unit" NOT NULL,
	"reason" text,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reverses_id" uuid,
	CONSTRAINT "stock_movement_reverses_id_unique" UNIQUE("reverses_id"),
	CONSTRAINT "movement_not_zero" CHECK ("stock_movement"."quantity" <> 0)
);
--> statement-breakpoint
ALTER TABLE "stock" ADD CONSTRAINT "stock_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock" ADD CONSTRAINT "stock_lokasyon_id_lokasyon_id_fk" FOREIGN KEY ("lokasyon_id") REFERENCES "public"."lokasyon"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_document" ADD CONSTRAINT "stock_document_lokasyon_id_lokasyon_id_fk" FOREIGN KEY ("lokasyon_id") REFERENCES "public"."lokasyon"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_document" ADD CONSTRAINT "stock_document_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_document_id_stock_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."stock_document"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_lokasyon_id_lokasyon_id_fk" FOREIGN KEY ("lokasyon_id") REFERENCES "public"."lokasyon"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "movement_product_idx" ON "stock_movement" USING btree ("product_id","created_at");--> statement-breakpoint
CREATE INDEX "movement_lokasyon_idx" ON "stock_movement" USING btree ("lokasyon_id","created_at");