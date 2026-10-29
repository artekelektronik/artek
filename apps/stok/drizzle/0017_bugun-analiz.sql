ALTER TABLE "assistant_suggestion" ADD COLUMN "analysis" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "assistant_suggestion" ADD COLUMN "steps" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "assistant_suggestion" ADD COLUMN "refreshed_at" timestamp with time zone;