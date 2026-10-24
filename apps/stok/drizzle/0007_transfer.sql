CREATE TYPE "public"."loss_reason" AS ENUM('kayip', 'hasarli');--> statement-breakpoint
CREATE TYPE "public"."transfer_status" AS ENUM('yolda', 'teslim_alindi');--> statement-breakpoint
CREATE TABLE "transfer" (
	"id" uuid PRIMARY KEY NOT NULL,
	"from_lokasyon_id" uuid NOT NULL,
	"to_lokasyon_id" uuid NOT NULL,
	"status" "transfer_status" DEFAULT 'yolda' NOT NULL,
	"note" text,
	"send_document_id" uuid NOT NULL,
	"sent_by" text NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"receive_document_id" uuid,
	"received_by" text,
	"received_at" timestamp with time zone,
	CONSTRAINT "transfer_between_two_lokasyon" CHECK ("transfer"."from_lokasyon_id" <> "transfer"."to_lokasyon_id")
);
--> statement-breakpoint
CREATE TABLE "transfer_line" (
	"transfer_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"sent" numeric(14, 3) NOT NULL,
	"received" numeric(14, 3),
	"lost" numeric(14, 3),
	"loss_reason" "loss_reason",
	CONSTRAINT "transfer_line_transfer_id_product_id_pk" PRIMARY KEY("transfer_id","product_id")
);
--> statement-breakpoint
ALTER TABLE "transfer" ADD CONSTRAINT "transfer_from_lokasyon_id_lokasyon_id_fk" FOREIGN KEY ("from_lokasyon_id") REFERENCES "public"."lokasyon"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer" ADD CONSTRAINT "transfer_to_lokasyon_id_lokasyon_id_fk" FOREIGN KEY ("to_lokasyon_id") REFERENCES "public"."lokasyon"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer" ADD CONSTRAINT "transfer_send_document_id_stock_document_id_fk" FOREIGN KEY ("send_document_id") REFERENCES "public"."stock_document"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer" ADD CONSTRAINT "transfer_sent_by_user_id_fk" FOREIGN KEY ("sent_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer" ADD CONSTRAINT "transfer_receive_document_id_stock_document_id_fk" FOREIGN KEY ("receive_document_id") REFERENCES "public"."stock_document"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer" ADD CONSTRAINT "transfer_received_by_user_id_fk" FOREIGN KEY ("received_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_line" ADD CONSTRAINT "transfer_line_transfer_id_transfer_id_fk" FOREIGN KEY ("transfer_id") REFERENCES "public"."transfer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_line" ADD CONSTRAINT "transfer_line_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- Movements of a Transfer point at it; the transfer row is written first, in the same transaction.
ALTER TABLE stock_movement ADD CONSTRAINT stock_movement_transfer_id_fk FOREIGN KEY (transfer_id) REFERENCES transfer(id);
