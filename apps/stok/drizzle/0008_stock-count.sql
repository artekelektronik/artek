CREATE TYPE "public"."count_kind" AS ENUM('sayim', 'acilis');--> statement-breakpoint
CREATE TYPE "public"."count_status" AS ENUM('taslak', 'onaylandi', 'iptal');--> statement-breakpoint
CREATE TABLE "stock_count" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lokasyon_id" uuid NOT NULL,
	"kind" "count_kind" NOT NULL,
	"status" "count_status" DEFAULT 'taslak' NOT NULL,
	"category" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_by" text,
	"approved_at" timestamp with time zone,
	"approve_document_id" uuid,
	"cancelled_by" text,
	"cancelled_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "stock_count_line" (
	"count_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"raf_kodu" text,
	"counted" numeric(14, 3),
	"balance_at_count" numeric(14, 3),
	"counted_at" timestamp with time zone,
	"counted_by" text,
	CONSTRAINT "stock_count_line_count_id_product_id_pk" PRIMARY KEY("count_id","product_id")
);
--> statement-breakpoint
ALTER TABLE "stock_count" ADD CONSTRAINT "stock_count_lokasyon_id_lokasyon_id_fk" FOREIGN KEY ("lokasyon_id") REFERENCES "public"."lokasyon"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_count" ADD CONSTRAINT "stock_count_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_count" ADD CONSTRAINT "stock_count_approved_by_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_count" ADD CONSTRAINT "stock_count_approve_document_id_stock_document_id_fk" FOREIGN KEY ("approve_document_id") REFERENCES "public"."stock_document"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_count" ADD CONSTRAINT "stock_count_cancelled_by_user_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_count_line" ADD CONSTRAINT "stock_count_line_count_id_stock_count_id_fk" FOREIGN KEY ("count_id") REFERENCES "public"."stock_count"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_count_line" ADD CONSTRAINT "stock_count_line_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_count_line" ADD CONSTRAINT "stock_count_line_counted_by_user_id_fk" FOREIGN KEY ("counted_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;