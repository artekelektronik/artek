ALTER TYPE "public"."customer_status" ADD VALUE 'kapandi';--> statement-breakpoint
ALTER TYPE "public"."suggestion_status" ADD VALUE 'yapilamadi';--> statement-breakpoint
ALTER TYPE "public"."suggestion_status" ADD VALUE 'ertelendi';--> statement-breakpoint
ALTER TYPE "public"."suggestion_status" ADD VALUE 'onay_bekliyor';--> statement-breakpoint
ALTER TABLE "assistant_suggestion" ADD COLUMN "scheduled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "assistant_suggestion" ADD COLUMN "done_on" date;--> statement-breakpoint
ALTER TABLE "assistant_suggestion" ADD COLUMN "close_reason" text;--> statement-breakpoint
ALTER TABLE "assistant_suggestion" ADD COLUMN "close_note" text;--> statement-breakpoint
ALTER TABLE "assistant_suggestion" ADD COLUMN "waiting_for" text;--> statement-breakpoint
ALTER TABLE "assistant_suggestion" ADD COLUMN "ask_again_on" date;--> statement-breakpoint
UPDATE "assistant_suggestion" SET "scheduled" = true WHERE "reason" LIKE 'Takip günü geldi.%';--> statement-breakpoint
UPDATE "assistant_suggestion" SET "done_on" = ("decided_at" AT TIME ZONE 'Europe/Istanbul')::date WHERE "status" IN ('gonderildi', 'yapildi');
