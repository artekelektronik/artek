CREATE TYPE "public"."unit" AS ENUM('adet', 'takim', 'rulo', 'kg', 'metre');--> statement-breakpoint
CREATE TABLE "product" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"is_trade_goods" boolean NOT NULL,
	"is_material" boolean NOT NULL,
	"unit" "unit" NOT NULL,
	"show_on_site" boolean NOT NULL,
	"archived_at" timestamp with time zone,
	"product_type" text,
	"sub_category" text,
	"manufacturer" text,
	"manufacturer_code" text,
	"description" text,
	"images" text[] DEFAULT '{}'::text[] NOT NULL,
	"datasheets" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"import_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_code_unique" UNIQUE("code"),
	CONSTRAINT "product_import_key_unique" UNIQUE("import_key"),
	CONSTRAINT "product_has_type" CHECK ("product"."is_trade_goods" OR "product"."is_material")
);
--> statement-breakpoint
CREATE TABLE "product_shelf" (
	"product_id" uuid NOT NULL,
	"lokasyon_id" uuid NOT NULL,
	"raf_kodu" text NOT NULL,
	CONSTRAINT "product_shelf_product_id_lokasyon_id_pk" PRIMARY KEY("product_id","lokasyon_id")
);
--> statement-breakpoint
ALTER TABLE "product_shelf" ADD CONSTRAINT "product_shelf_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_shelf" ADD CONSTRAINT "product_shelf_lokasyon_id_lokasyon_id_fk" FOREIGN KEY ("lokasyon_id") REFERENCES "public"."lokasyon"("id") ON DELETE no action ON UPDATE no action;