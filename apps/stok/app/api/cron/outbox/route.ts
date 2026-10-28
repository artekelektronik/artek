import { timingSafeEqual } from "node:crypto";
import { queueFinanceReminders } from "@/lib/finance-reminders";
import { processOutbox } from "@/lib/outbox";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

// Daily: queue the invoice reminder and CRM follow-ups, then send whatever is unsent. Vercel Cron sends Bearer $CRON_SECRET.
export async function GET(request: Request) {
  if (!authorized(request)) return new Response("Yetkisiz", { status: 401 });
  const queued = await queueFinanceReminders();
  const processed = await processOutbox();
  return Response.json({ queued, processed });
}
