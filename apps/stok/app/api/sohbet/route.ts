import { z } from "zod";
import { askAssistant } from "@/lib/chat";
import { Forbidden, NotSignedIn, requirePermission } from "@/lib/guard";

export const maxDuration = 120;

const body = z.object({ question: z.string().trim().min(1).max(4000) });

// One question from the Bugün screen; the conversation so far is read from today's saved chat.
export async function POST(request: Request) {
  let actor;
  try {
    actor = await requirePermission(request.headers, "crm.view");
  } catch (error) {
    if (error instanceof NotSignedIn) return Response.json({ error: error.message }, { status: 401 });
    if (error instanceof Forbidden) return Response.json({ error: error.message }, { status: 403 });
    throw error;
  }
  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ error: "Asistan için ANTHROPIC_API_KEY tanımlı değil." }, { status: 503 });
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Mesaj okunamadı." }, { status: 400 });
  try {
    const answer = await askAssistant(actor.userId, parsed.data.question);
    return Response.json({ id: answer.id, text: answer.text, proposals: answer.proposals });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Asistan şu an cevap veremedi." }, { status: 500 });
  }
}
