import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Stays at the bottom of the screen while the page content is in view, then scrolls away before the footer.
// Clicks are counted by the listener in app/[locale]/layout.tsx; data-cta tells them apart from in-page links.
export function QuoteBar({links, locale, className}: {links: {whatsapp: string; email: string}; locale: string; className?: string}) {
  const tr = locale !== "en";
  return <aside aria-label={tr ? "Teklif al" : "Get a quote"} className={cn("sticky bottom-0 z-30 -mx-6 mt-12 flex items-center gap-3 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-t-xl sm:border-x sm:px-5", className)}>
    <p className="hidden flex-1 text-sm font-medium text-slate-700 sm:block">{tr ? "Aradığınız parçayı yazın, teklif verelim." : "Tell us the part you need and we'll quote it."}</p>
    <a href={links.whatsapp} data-cta="sticky" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-5 font-semibold text-primary-foreground sm:flex-none">
      <MessageCircle className="size-5" aria-hidden /> {tr ? "WhatsApp'tan teklif al" : "Quote via WhatsApp"}
    </a>
    <a href={links.email} data-cta="sticky" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 font-semibold">{tr ? "E-posta" : "Email"}</a>
  </aside>;
}
