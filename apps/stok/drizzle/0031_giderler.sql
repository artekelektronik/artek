ALTER TYPE "public"."activity_entity" ADD VALUE 'gider';--> statement-breakpoint
CREATE TABLE "expense" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"spent_on" date NOT NULL,
	"category" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"party" text,
	"net_amount" numeric(14, 2) NOT NULL,
	"total_amount" numeric(14, 2) NOT NULL,
	"file_name" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_file" (
	"expense_id" uuid PRIMARY KEY NOT NULL,
	"content_type" text NOT NULL,
	"bytes" "bytea" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_file" ADD CONSTRAINT "expense_file_expense_id_expense_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expense"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "expense_spent_idx" ON "expense" USING btree ("spent_on");