CREATE TYPE "public"."suggestion_outcome" AS ENUM('cevap_geldi', 'teklif', 'siparis', 'cevap_yok', 'ilgilenmiyor', 'girilmedi');--> statement-breakpoint
ALTER TABLE "assistant_suggestion" ADD COLUMN "result_ask_on" date;--> statement-breakpoint
ALTER TABLE "assistant_suggestion" ADD COLUMN "result_asks" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "assistant_suggestion" ADD COLUMN "outcome" "suggestion_outcome";--> statement-breakpoint
ALTER TABLE "assistant_suggestion" ADD COLUMN "outcome_note" text;--> statement-breakpoint
ALTER TABLE "assistant_suggestion" ADD COLUMN "outcome_at" timestamp with time zone;--> statement-breakpoint
UPDATE "assistant_suggestion" SET "result_ask_on" = "done_on" + CASE extract(isodow FROM "done_on")::int WHEN 1 THEN 3 WHEN 2 THEN 3 WHEN 6 THEN 4 WHEN 7 THEN 3 ELSE 5 END WHERE "done_on" IS NOT NULL AND "status" IN ('gonderildi', 'yapildi');
