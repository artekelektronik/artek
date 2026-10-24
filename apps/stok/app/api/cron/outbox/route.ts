import { processOutbox } from "@/lib/outbox";

// Catch-up for emails that failed or were queued without a follow-up request. Vercel Cron sends
// "Authorization: Bearer $CRON_SECRET"; anything else is refused.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Yetkisiz", { status: 401 });
  }
  const sent = await processOutbox();
  return Response.json({ processed: sent });
}
