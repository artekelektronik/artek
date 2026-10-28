import { revalidatePath } from "next/cache";
import { Forbidden, NotSignedIn } from "@/lib/guard";
import { importInvoicePdf } from "@/lib/invoices";

// One invoice PDF per request, so a folder of hundreds stays under the request size limit.
export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return Response.json({ error: "Dosya yok." }, { status: 400 });
    if (file.size > 4 * 1024 * 1024) return Response.json({ status: "okunamadi", reason: "Dosya 4 MB'tan büyük." });
    const result = await importInvoicePdf(request.headers, { fileName: file.name, bytes: new Uint8Array(await file.arrayBuffer()) });
    if (result.status === "eklendi") revalidatePath("/", "layout");
    return Response.json(result);
  } catch (error) {
    if (error instanceof NotSignedIn) return Response.json({ error: error.message }, { status: 401 });
    if (error instanceof Forbidden) return Response.json({ error: error.message }, { status: 403 });
    throw error;
  }
}
