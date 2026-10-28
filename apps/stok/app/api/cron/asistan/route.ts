import { prepareDay } from "@/lib/assistant";
import { cronAuthorized } from "@/lib/cron-auth";

// Each customer takes up to a minute of web research; give the whole morning list room.
export const maxDuration = 300;

// Daily, an hour before the morning email: prepare today's call and email suggestions.
export async function GET(request: Request) {
  if (!cronAuthorized(request)) return new Response("Yetkisiz", { status: 401 });
  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ skipped: "ANTHROPIC_API_KEY tanımlı değil." });
  return Response.json(await prepareDay());
}
