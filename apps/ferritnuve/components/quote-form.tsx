"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { company } from "@/lib/company";

// Phone photos are 3-8 MB; the server takes 4 MB. Shrinks to at most 1600 px on the long side, as JPEG.
async function shrinkPhoto(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", 0.8));
    return blob ? new File([blob], "foto.jpg", {type: "image/jpeg"}) : file;
  } catch {
    return file; // a format the browser can't draw: the server decides
  }
}

const field = "mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-artek-violet focus:ring-2 focus:ring-artek-violet/20";

// The short quote form. `subject` and `productCode` say which product or guide it was opened from.
export function QuoteForm({subject, productCode}: {subject?: string; productCode?: string}) {
  const tr = useLocale() !== "en";
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const photo = form.get("photo");
    if (photo instanceof File && photo.size > 0) form.set("photo", await shrinkPhoto(photo));
    else form.delete("photo");
    if (subject) form.set("subject", subject);
    if (productCode) form.set("productCode", productCode);
    form.set("pageUrl", window.location.href);
    form.set("locale", tr ? "tr" : "en");
    setState("sending");
    setError("");
    try {
      const response = await fetch("/api/teklif", {method: "POST", body: form});
      if (response.ok) {
        (window as {gtag?: (...args: unknown[]) => void}).gtag?.("event", "generate_lead", {method: "form", product: subject});
        return setState("sent");
      }
      const reason = response.status === 400 ? (await response.json()).error : "";
      setError(reason || (tr ? "Talebiniz gönderilemedi. Lütfen WhatsApp veya e-posta ile yazın." : "Your request could not be sent. Please write to us on WhatsApp or by email."));
    } catch {
      setError(tr ? "Bağlantı kurulamadı. Lütfen tekrar deneyin veya WhatsApp'tan yazın." : "No connection. Please try again or write to us on WhatsApp.");
    }
    setState("idle");
  }

  if (state === "sent") return <div role="status" className="rounded-xl bg-artek-mist p-6">
    <h3 className="text-xl font-semibold text-artek-ink">{tr ? "Talebiniz bize ulaştı" : "We have your request"}</h3>
    <p className="mt-2 leading-7 text-slate-700">{tr ? "Yazdığınız e-posta veya telefondan size dönüş yapacağız. Acil ise bizi arayabilirsiniz: " : "We will reply to the email or phone number you gave. If it is urgent, call us: "}<a href={company.phones[0].href} className="font-semibold underline underline-offset-4">{company.phones[0].label}</a></p>
  </div>;

  return <form onSubmit={submit} className="space-y-5">
    {subject && <p className="rounded-lg bg-artek-mist px-4 py-3 text-sm">{tr ? "Konu" : "About"}: <b>{subject}</b>{productCode ? ` (${productCode})` : ""}</p>}
    <label className="block text-sm font-semibold">{tr ? "Adınız veya firmanız" : "Your name or company"}
      <input name="name" required minLength={2} maxLength={200} autoComplete="name" className={field} />
    </label>
    <label className="block text-sm font-semibold">{tr ? "E-posta veya telefon" : "Email or phone"}
      <input name="contact" required minLength={5} maxLength={200} inputMode="email" autoComplete="email" className={field} />
    </label>
    <label className="block text-sm font-semibold">{tr ? "Neye ihtiyacınız var?" : "What do you need?"}
      <textarea name="message" required minLength={5} maxLength={4000} rows={4} placeholder={tr ? "Örn. ETD39 nüve ve karkas, 200 adet" : "e.g. ETD39 core and bobbin, 200 pcs"} className={field} />
    </label>
    <label className="block text-sm font-semibold">{tr ? "Fotoğraf (isteğe bağlı)" : "Photo (optional)"}
      <span className="block font-normal text-slate-600">{tr ? "Parçanın adını bilmiyorsanız fotoğrafını ekleyin." : "If you don't know the part's name, add a photo of it."}</span>
      <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" className="mt-2 block w-full text-sm file:mr-4 file:min-h-11 file:rounded-lg file:border file:border-slate-300 file:bg-white file:px-4 file:font-semibold" />
    </label>
    <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
    {error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
    <button type="submit" disabled={state === "sending"} className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-primary px-6 font-semibold text-primary-foreground disabled:opacity-60 sm:w-auto">{state === "sending" ? (tr ? "Gönderiliyor…" : "Sending…") : (tr ? "Teklif iste" : "Request a quote")}</button>
    <p className="text-sm text-slate-600">{tr ? "Bilgileriniz şu metinde açıklandığı şekilde işlenir: " : "Your details are processed as described in our "}<Link href="/kvkk" className="underline underline-offset-4">{tr ? "KVKK Aydınlatma Metni" : "Privacy Notice"}</Link>.</p>
  </form>;
}
