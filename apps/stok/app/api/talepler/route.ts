import { put } from "@vercel/blob";
import { requestsAuthorized } from "@/lib/cron-auth";
import { UserError } from "@/lib/errors";
import { createRequest } from "@/lib/requests";
import { sendNotificationsSoon } from "@/lib/send-soon";

const photoTypes: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const maxPhotoBytes = 4 * 1024 * 1024;

// The ferritnuve.com site forwards each quote form here as form data, with an optional "photo" file.
export async function POST(request: Request) {
  if (!requestsAuthorized(request)) return new Response("Yetkisiz", { status: 401 });
  try {
    const form = await request.formData();
    const field = (name: string) => {
      const value = form.get(name);
      return typeof value === "string" ? value : undefined;
    };
    const photo = form.get("photo");
    let photoUrl: string | undefined;
    if (photo instanceof File && photo.size > 0) {
      const extension = photoTypes[photo.type];
      if (!extension) throw new UserError("Fotoğraf JPEG, PNG veya WebP olmalı.");
      if (photo.size > maxPhotoBytes) throw new UserError("Fotoğraf 4 MB'tan büyük olamaz.");
      photoUrl = (await put(`talepler/${crypto.randomUUID()}.${extension}`, photo, { access: "public", addRandomSuffix: true, contentType: photo.type })).url;
    }
    const id = await createRequest({
      name: field("name") ?? "",
      contact: field("contact") ?? "",
      message: field("message") ?? "",
      subject: field("subject"),
      productCode: field("productCode"),
      pageUrl: field("pageUrl"),
      locale: field("locale") === "en" ? "en" : "tr",
      photoUrl,
    });
    sendNotificationsSoon();
    return Response.json({ id });
  } catch (error) {
    if (error instanceof UserError) return Response.json({ error: error.message }, { status: 400 });
    throw error;
  }
}
