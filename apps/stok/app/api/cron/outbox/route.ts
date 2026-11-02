import { queueActivityReports } from "@/lib/activity-report";
import { cronAuthorized } from "@/lib/cron-auth";
import { queueFinanceReminders } from "@/lib/finance-reminders";
import { processOutbox } from "@/lib/outbox";
import { queueWeeklyStockOutReport } from "@/lib/stock-out-report";

// Daily: queue the invoice reminder, CRM follow-ups, the Monday stock-out report and the İşlem geçmişi reports, then send whatever is unsent. Vercel Cron sends Bearer $CRON_SECRET.
export async function GET(request: Request) {
  if (!cronAuthorized(request)) return new Response("Yetkisiz", { status: 401 });
  const queued = [...(await queueFinanceReminders()), ...(await queueWeeklyStockOutReport()), ...(await queueActivityReports())];
  const processed = await processOutbox();
  return Response.json({ queued, processed });
}
