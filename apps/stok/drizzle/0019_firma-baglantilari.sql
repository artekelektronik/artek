CREATE TYPE "public"."link_type" AS ENUM('satildi', 'unvan_degisti', 'birlikte_calisiyor', 'ayni_sahip', 'musterimizin_musterisi', 'diger');--> statement-breakpoint
CREATE TABLE "firm_link" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_id" uuid NOT NULL,
	"to_id" uuid NOT NULL,
	"type" "link_type" NOT NULL,
	"note" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "firm_link_not_self" CHECK ("firm_link"."from_id" <> "firm_link"."to_id")
);
--> statement-breakpoint
ALTER TABLE "firm_link" ADD CONSTRAINT "firm_link_from_id_customer_id_fk" FOREIGN KEY ("from_id") REFERENCES "public"."customer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "firm_link" ADD CONSTRAINT "firm_link_to_id_customer_id_fk" FOREIGN KEY ("to_id") REFERENCES "public"."customer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "firm_link" ADD CONSTRAINT "firm_link_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "firm_link_pair_idx" ON "firm_link" USING btree ("from_id","to_id","type");--> statement-breakpoint
CREATE INDEX "firm_link_to_idx" ON "firm_link" USING btree ("to_id");