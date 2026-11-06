ALTER TYPE "public"."activity_action" ADD VALUE 'silindi';--> statement-breakpoint
CREATE TABLE "product_component" (
	"product_id" uuid NOT NULL,
	"component_id" uuid NOT NULL,
	"quantity" numeric(14, 3) NOT NULL,
	CONSTRAINT "product_component_product_id_component_id_pk" PRIMARY KEY("product_id","component_id")
);
--> statement-breakpoint
ALTER TABLE "invoice" ALTER COLUMN "ettn" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice" ALTER COLUMN "file_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice" ALTER COLUMN "file_sha256" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice" ALTER COLUMN "raw_text" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "materials_lokasyon_id" uuid;--> statement-breakpoint
ALTER TABLE "invoice_line" ADD COLUMN "components" jsonb;--> statement-breakpoint
ALTER TABLE "product_component" ADD CONSTRAINT "product_component_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_component" ADD CONSTRAINT "product_component_component_id_product_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_materials_lokasyon_id_lokasyon_id_fk" FOREIGN KEY ("materials_lokasyon_id") REFERENCES "public"."lokasyon"("id") ON DELETE no action ON UPDATE no action;