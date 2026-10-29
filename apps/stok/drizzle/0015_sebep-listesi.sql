CREATE TYPE "public"."close_effect" AS ENUM('kapandi', 'ilgilenmiyor', 'tekrar', 'not');--> statement-breakpoint
CREATE TABLE "close_reason" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"effect" "close_effect" NOT NULL,
	"days" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"archived_at" timestamp with time zone,
	CONSTRAINT "close_reason_days_check" CHECK (("close_reason"."effect" = 'tekrar') = ("close_reason"."days" is not null) and ("close_reason"."days" is null or "close_reason"."days" between 1 and 365))
);
--> statement-breakpoint
ALTER TABLE "assistant_suggestion" ADD COLUMN "proposal" jsonb;--> statement-breakpoint
ALTER TABLE "assistant_suggestion" ADD COLUMN "proposal_decided_at" timestamp with time zone;--> statement-breakpoint
INSERT INTO "close_reason" ("id", "label", "effect", "days", "sort_order") VALUES
	('ulasilamadi', 'Ulaşılamadı', 'tekrar', 7, 1),
	('kapandi', 'Şirket kapanmış', 'kapandi', NULL, 2),
	('unvan_degisti', 'Unvanı / sahibi değişti', 'not', NULL, 3),
	('yanlis_iletisim', 'Yanlış numara / e-posta', 'not', NULL, 4),
	('ilgilenmiyor', 'İlgilenmiyor', 'ilgilenmiyor', NULL, 5),
	('rakip', 'Rakip firma', 'not', NULL, 6),
	('diger', 'Diğer (not yazın)', 'not', NULL, 7);--> statement-breakpoint
ALTER TABLE "assistant_suggestion" ADD CONSTRAINT "assistant_suggestion_close_reason_close_reason_id_fk" FOREIGN KEY ("close_reason") REFERENCES "public"."close_reason"("id") ON DELETE no action ON UPDATE no action;