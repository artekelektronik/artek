CREATE TABLE "expense_recurrence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"party" text,
	"net_amount" numeric(14, 2) NOT NULL,
	"kdv_rate" numeric(5, 2) NOT NULL,
	"total_amount" numeric(14, 2) NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date,
	"filled_through" text NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "expense" ADD COLUMN "recurrence_id" uuid;--> statement-breakpoint
ALTER TABLE "expense_recurrence" ADD CONSTRAINT "expense_recurrence_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_recurrence_id_expense_recurrence_id_fk" FOREIGN KEY ("recurrence_id") REFERENCES "public"."expense_recurrence"("id") ON DELETE no action ON UPDATE no action;