import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { glossaryTerms, glossaryStructuredData } from "@/lib/glossary";
import { getLanguageAlternates, getLocalizedPath, getOgImageUrl, getSiteUrl } from "@/lib/seo";

type Props = {params: Promise<{locale: string}>};
export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale} = await params;
  const site = await getSiteUrl();
  const title = locale === "tr" ? "Ferrit Nüve ve EMI Filtre Sözlüğü | Artek Elektronik" : "Ferrite Core and EMI Filter Glossary | Artek Elektronik";
  const description = locale === "tr" ? "AL değeri, geçirgenlik, doyma, hava aralığı, ortak mod ve diğer ferrit nüve ve EMI filtre terimlerinin kaynaklı, kısa tanımları." : "Short, sourced definitions of AL value, permeability, saturation, air gap, common mode and other ferrite core and EMI filter terms.";
  const url = site + getLocalizedPath(locale, "/sozluk");
  return {title, description, alternates: {canonical: url, languages: getLanguageAlternates(site, "/sozluk")},
    openGraph: {title, description, url, type: "website", images: [getOgImageUrl(site, locale)]},
    twitter: {card: "summary_large_image", title, description, images: [getOgImageUrl(site, locale)]}};
}
export default async function GlossaryPage({params}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);
  const tr = locale === "tr";
  const terms = glossaryTerms(locale);
  const url = (await getSiteUrl()) + getLocalizedPath(locale, "/sozluk");
  const initial = (term: string) => term[0].toLocaleUpperCase(locale);
  const letters = [...new Set(terms.map(term => initial(term.term)))];
  return <main className="mx-auto max-w-4xl px-6 pb-24 pt-28">
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(glossaryStructuredData(terms, url, locale)).replace(/</g, "\\u003c")}} />
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-artek-violet">{tr ? "ARTEK / SÖZLÜK" : "ARTEK / GLOSSARY"}</p>
    <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-artek-ink sm:text-5xl">{tr ? "Ferrit nüve ve EMI filtre sözlüğü" : "Ferrite core and EMI filter glossary"}</h1>
    <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">{tr
      ? `Veri sayfalarında ve tekliflerde karşınıza çıkan ${terms.length} terimin kısa tanımı. Her tanımın altında dayandığı üretici kaynağı ve varsa konuyu ayrıntılı anlatan rehber yer alır.`
      : `Short definitions of ${terms.length} terms you meet in datasheets and enquiries. Each definition names the manufacturer source it rests on and, where there is one, the guide that covers the topic in detail.`}</p>
    <nav aria-label={tr ? "Harfler" : "Letters"} className="mt-8 flex flex-wrap gap-2">
      {letters.map(letter => <a key={letter} href={`#${tr ? "harf" : "letter"}-${letter}`} className="flex h-10 min-w-10 items-center justify-center rounded-lg bg-slate-100 px-3 text-sm font-semibold hover:bg-artek-violet hover:text-white">{letter}</a>)}
    </nav>
    {letters.map(letter => <section key={letter} id={`${tr ? "harf" : "letter"}-${letter}`} aria-label={letter} className="mt-12 scroll-mt-24">
      <h2 className="border-b border-slate-200 pb-2 text-2xl font-semibold text-artek-violet">{letter}</h2>
      <dl>
        {terms.filter(term => initial(term.term) === letter).map(term => <div key={term.id} id={term.id} className="scroll-mt-24 border-b border-slate-100 py-6">
          <dt className="text-xl font-semibold tracking-tight text-artek-ink">{term.term}</dt>
          <dd className="mt-2 leading-8 text-slate-700">{term.definition}
            <span className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <a href={term.source.href} target="_blank" rel="noopener noreferrer" className="text-slate-600 underline underline-offset-4">{tr ? "Kaynak" : "Source"}: {term.source.label}</a>
              {term.guide && <Link href={term.guide.href} className="font-medium underline underline-offset-4">{tr ? "Rehber" : "Guide"}: {term.guide.label} →</Link>}
            </span>
          </dd>
        </div>)}
      </dl>
    </section>)}
    <p className="mt-12 leading-8 text-slate-600">{tr ? "Aradığınız terim burada yoksa " : "If the term you need is not here, "}<Link href="/contact" className="font-medium underline underline-offset-4">{tr ? "bize yazın" : "write to us"}</Link>{tr ? "; ekleyelim. Konuları sırayla okumak için " : " and we will add it. To read the topics in order, see "}<Link href="/blog" className="font-medium underline underline-offset-4">{tr ? "teknik kütüphaneye" : "the technical library"}</Link>{tr ? " bakın." : "."}</p>
  </main>;
}
