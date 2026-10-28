import { revalidatePath } from "next/cache";
import { prepareDay } from "@/lib/assistant";
import { Forbidden, NotSignedIn, requirePermission } from "@/lib/guard";

export const maxDuration = 300;

// "Önerileri şimdi hazırla" on the Bugün screen; does what the morning run does, for whoever may edit customers.
export async function POST(request: Request) {
  try {
    await requirePermission(request.headers, "crm.edit");
  } catch (error) {
    if (error instanceof NotSignedIn) return Response.json({ error: error.message }, { status: 401 });
    if (error instanceof Forbidden) return Response.json({ error: error.message }, { status: 403 });
    throw error;
  }
  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ error: "Asistan için ANTHROPIC_API_KEY tanımlı değil." }, { status: 503 });
  const result = await prepareDay();
  revalidatePath("/musteriler/bugun");
  return Response.json(result);
}
