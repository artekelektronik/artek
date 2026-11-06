import { Forbidden, NotSignedIn } from "@/lib/guard";
import { invoicePdf } from "@/lib/invoices";

// The invoice as uploaded, shown inline in the review sheet.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const file = await invoicePdf(request.headers, (await params).id);
    if (!file) return new Response("Bu faturanın PDF'i yok.", { status: 404 });
    return new Response(new Uint8Array(file.bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof NotSignedIn) return new Response(error.message, { status: 401 });
    if (error instanceof Forbidden) return new Response(error.message, { status: 403 });
    throw error;
  }
}
