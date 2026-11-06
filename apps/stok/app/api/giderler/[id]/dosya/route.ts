import { revalidatePath } from "next/cache";
import { UserError } from "@/lib/errors";
import { attachExpenseFile, expenseFile } from "@/lib/expenses";
import { Forbidden, NotSignedIn } from "@/lib/guard";

type Params = { params: Promise<{ id: string }> };

const refused = (error: unknown) => {
  if (error instanceof NotSignedIn) return new Response(error.message, { status: 401 });
  if (error instanceof Forbidden) return new Response(error.message, { status: 403 });
  if (error instanceof UserError) return Response.json({ error: error.message }, { status: 400 });
  throw error;
};

export async function GET(request: Request, { params }: Params) {
  try {
    const file = await expenseFile(request.headers, (await params).id);
    if (!file) return new Response("Bu giderin fişi yok.", { status: 404 });
    return new Response(new Uint8Array(file.bytes), {
      headers: {
        "Content-Type": file.contentType,
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.fileName ?? "fis")}`,
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return refused(error);
  }
}

// The receipt is sent apart from the form, so a photo doesn't hit the server action size limit.
export async function POST(request: Request, { params }: Params) {
  try {
    const file = (await request.formData()).get("file");
    if (!(file instanceof File)) return Response.json({ error: "Dosya yok." }, { status: 400 });
    await attachExpenseFile(request.headers, (await params).id, { fileName: file.name, contentType: file.type, bytes: new Uint8Array(await file.arrayBuffer()) });
    revalidatePath("/finans/giderler");
    return Response.json({ ok: true });
  } catch (error) {
    return refused(error);
  }
}
