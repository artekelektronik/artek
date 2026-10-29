import { leadsAuthorized } from "@/lib/cron-auth";
import { UserError } from "@/lib/errors";
import { importLeads } from "@/lib/leads";

// The sales routines post the firms in each report here: { rapor, adaylar: [...] }. Repeats are only marked as seen.
export async function POST(request: Request) {
  if (!leadsAuthorized(request)) return new Response("Yetkisiz", { status: 401 });
  try {
    return Response.json(await importLeads(await request.json(), { userId: null }));
  } catch (error) {
    if (error instanceof UserError || error instanceof SyntaxError) return Response.json({ error: error.message }, { status: 400 });
    throw error;
  }
}
