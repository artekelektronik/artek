"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Search } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { company } from "@/lib/company";
import { matchFaq, scrubSearch, type FaqItem } from "@/lib/faq-search";

declare global {
  interface Window { gtag?: (...args: unknown[]) => void }
}

const groups = [
  {key: "technical", tr: "Teknik sorular", en: "Technical questions"},
  {key: "guides", tr: "Teknik rehberlerden", en: "From the technical guides"},
  {key: "company", tr: "Teklif ve iletişim", en: "Quotes and contact"},
] as const;

export function FaqSearch({items}: {items: FaqItem[]}) {
  const tr = useLocale() === "tr";
  const [query, setQuery] = useState("");
  const results = matchFaq(items, query);
  const searching = query.trim().length > 0;
  const lastLogged = useRef("");

  // Record what visitors look for, even without Enter: once they pause for 2 s or leave the box.
  // Searches with results = 0 are the questions the page should answer next.
  function record(term: string, count: number) {
    if (term.length < 3 || term === lastLogged.current) return;
    lastLogged.current = term;
    window.gtag?.("event", "search", {search_term: term, results: count, search_location: "faq"});
  }
  useEffect(() => {
    const timer = setTimeout(() => record(scrubSearch(query), results.length), 2000);
    return () => clearTimeout(timer);
  }, [query, results.length]);

  const whatsapp = `https://wa.me/${company.whatsapp}?text=${encodeURIComponent((tr ? "Merhaba, bir sorum var: " : "Hello, I have a question: ") + query.trim())}`;

  const list = (shown: FaqItem[]) => <ul className="divide-y divide-slate-200 border-y border-slate-200">
    {shown.map(item => <li key={item.id}>
      <details id={item.id} open={searching || undefined} className="group py-1">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-3 font-medium marker:hidden">
          <h3 className="text-base">{item.question}</h3>
          <span aria-hidden className="text-xl text-artek-violet transition-transform group-open:rotate-45">+</span>
        </summary>
        <div className="pb-5 leading-7 text-slate-700">
          <p>{item.answer}</p>
          {(item.link || item.source) && <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {item.link && <Link href={item.link.href} className="py-1 underline underline-offset-4">{item.link.label} →</Link>}
            {item.source && <a href={item.source.href} target="_blank" rel="noopener noreferrer" className="py-1 text-slate-500 underline underline-offset-4">{tr ? "Kaynak" : "Source"}: {item.source.label}</a>}
          </p>}
        </div>
      </details>
    </li>)}
  </ul>;

  return <div>
    <label htmlFor="faq-search" className="text-sm font-semibold">{tr ? "Sorunuzu arayın" : "Search your question"}</label>
    <div className="relative mt-2">
      <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
      <input id="faq-search" type="search" value={query} onChange={e => setQuery(e.target.value)} onBlur={() => record(scrubSearch(query), results.length)}
        placeholder={tr ? "Örn. AL değeri, hava aralığı, EMI filtre" : "e.g. AL value, air gap, EMI filter"} aria-describedby="faq-search-note" autoComplete="off"
        className="h-12 w-full rounded-lg border border-slate-300 bg-white pl-12 pr-4 text-base outline-none focus:border-artek-violet focus:ring-2 focus:ring-artek-violet/20" />
    </div>
    <p id="faq-search-note" className="mt-2 text-xs text-slate-500">{tr ? "Aramalar, eksik soruları eklemek için anonim olarak kaydedilir." : "Searches are recorded anonymously so we can add missing questions."}</p>

    {searching ? <section className="mt-8" aria-live="polite">
      <p className="mb-4 text-sm text-slate-600">{tr ? `${results.length} soru bulundu` : `${results.length} question${results.length === 1 ? "" : "s"} found`}</p>
      {results.length > 0 ? list(results) : <div className="rounded-xl bg-slate-100 p-6">
        <h2 className="text-lg font-semibold">{tr ? "Bu sorunun cevabı henüz burada yok" : "This question isn't answered here yet"}</h2>
        <p className="mt-2 leading-7 text-slate-700">{tr ? "Sorunuzu bize doğrudan sorun; cevabı kısa sürede iletelim ve bu sayfaya ekleyelim." : "Ask us directly; we'll reply and add the answer to this page."}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-lg bg-primary px-5 font-semibold text-primary-foreground">{tr ? "WhatsApp'tan sorun" : "Ask on WhatsApp"}</a>
          <Link href="/contact" className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-5 font-semibold">{tr ? "İletişim formu" : "Contact form"}</Link>
        </div>
      </div>}
    </section> : groups.map(group => {
      const shown = items.filter(item => item.group === group.key);
      return shown.length > 0 && <section key={group.key} className="mt-10" aria-labelledby={`faq-${group.key}`}>
        <h2 id={`faq-${group.key}`} className="mb-3 text-2xl font-semibold">{tr ? group.tr : group.en}</h2>
        {list(shown)}
      </section>;
    })}
  </div>;
}
