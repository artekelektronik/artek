import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { Forbidden, NotSignedIn, requirePermission } from "@/lib/guard";

// Product images go from the browser straight to Vercel Blob; this route only hands out the
// short-lived upload token, and only to users who may manage products.
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        await requirePermission(request.headers, "products.manage");
        if (!pathname.startsWith("urunler/")) throw new Forbidden();
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"],
          maximumSizeInBytes: 5 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
    });
    return Response.json(result);
  } catch (error) {
    if (error instanceof NotSignedIn) return Response.json({ error: error.message }, { status: 401 });
    if (error instanceof Forbidden) return Response.json({ error: error.message }, { status: 403 });
    return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
