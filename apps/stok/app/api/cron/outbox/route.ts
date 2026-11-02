import { queueActivityReports } from "@/lib/activity-report";
import { cronAuthorized } from "@/lib/cron-auth";
import { queueFinanceReminders } from "@/lib/finance-reminders";
import { processOutbox } from "@/lib/outbox";

// Daily: queue the invoice reminder, CRM follow-ups and the İşlem geçmişi reports, then send whatever is unsent. Vercel Cron sends Bearer $CRON_SECRET.
export async function GET(request: Request) {
  if (!cronAuthorized(request)) return new Response("Yetkisiz", { status: 401 });
  const queued = [...(await queueFinanceReminders()), ...(await queueActivityReports())];
  const processed = await processOutbox();
  return Response.json({ queued, processed });
}
