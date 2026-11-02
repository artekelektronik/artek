CREATE TYPE "public"."currency" AS ENUM('TRY', 'USD', 'EUR');--> statement-breakpoint
CREATE TABLE "product_price" (
	"product_id" uuid PRIMARY KEY NOT NULL,
	"purchase_price" numeric(14, 4),
	"purchase_currency" "currency" NOT NULL,
	"sale_price" numeric(14, 4),
	"sale_currency" "currency" NOT NULL,
	"updated_by" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_price" ADD CONSTRAINT "product_price_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_price" ADD CONSTRAINT "product_price_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;