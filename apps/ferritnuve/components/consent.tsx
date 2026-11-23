"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { resetConsent, setConsent, useConsent } from "@/lib/consent";

// Renders its children (the statistics scripts) only after the visitor accepts.
export function ConsentGate({children}: {children: React.ReactNode}) {
  return useConsent() === "granted" ? children : null;
}

export function ConsentBanner() {
  const tr = useLocale() !== "en";
  if (useConsent() !== null) return null;
  const button = "inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-white/40 px-5 font-semibold sm:flex-none";
  return <aside aria-label={tr ? "Çerez tercihi" : "Cookie choice"} className="fixed inset-x-0 bottom-0 z-50 bg-artek-ink px-4 py-4 text-white shadow-[0_-8px_30px_rgba(8,27,44,0.25)]">
    <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
      <p className="flex-1 text-sm leading-6">
        {tr ? "Hangi sayfaların işe yaradığını ölçmek için istatistik çerezleri kullanmak istiyoruz. Reddederseniz site aynı şekilde çalışır. " : "We would like to use statistics cookies to measure which pages are useful. The site works the same if you decline. "}
        <Link href="/kvkk" className="underline underline-offset-4">{tr ? "Ayrıntılar" : "Details"}</Link>
      </p>
      <div className="flex gap-3">
        <button type="button" onClick={() => setConsent("denied")} className={button}>{tr ? "Reddet" : "Decline"}</button>
        <button type="button" onClick={() => setConsent("granted")} className={button}>{tr ? "Kabul et" : "Accept"}</button>
      </div>
    </div>
  </aside>;
}

export function ConsentReset() {
  const tr = useLocale() !== "en";
  const consent = useConsent();
  const state = consent === "granted" ? (tr ? "İstatistik çerezlerini kabul ettiniz." : "You accepted statistics cookies.")
    : consent === "denied" ? (tr ? "İstatistik çerezlerini reddettiniz." : "You declined statistics cookies.")
    : (tr ? "Henüz bir seçim yapmadınız." : "You have not made a choice yet.");
  return <p className="mt-3 leading-7 text-slate-700">
    {state}{" "}
    {consent && <button type="button" onClick={resetConsent} className="font-semibold underline underline-offset-4">{tr ? "Seçimimi değiştir" : "Change my choice"}</button>}
  </p>;
}
