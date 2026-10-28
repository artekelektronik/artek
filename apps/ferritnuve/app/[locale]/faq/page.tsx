import type { Metadata } from "next";
import { getMessages, setRequestLocale } from "next-intl/server";
import { FaqSearch } from "@/components/faq-search";
import { faqItems, faqStructuredData } from "@/lib/faq";
import { getLanguageAlternates, getLocalizedPath, getOgImageUrl, getSiteUrl } from "@/lib/seo";

type Props = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale} = await params;
  const metadata = ((await getMessages({locale})).metadata as Record<string, {title: string; description: string}>).faq;
  const siteUrl = await getSiteUrl();
  const url = `${siteUrl}${getLocalizedPath(locale, "/faq")}`;
  return {
    title: metadata.title,
    description: metadata.description,
    alternates: {canonical: url, languages: getLanguageAlternates(siteUrl, "/faq")},
    openGraph: {title: metadata.title, description: metadata.description, url, type: "website", images: [{url: getOgImageUrl(siteUrl, locale), width: 1200, height: 630, alt: "Artek Elektronik"}]},
  };
}

export default async function FaqPage({params}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);
  const tr = locale === "tr";
  const items = faqItems(locale);
  const url = `${await getSiteUrl()}${getLocalizedPath(locale, "/faq")}`;
  return <main className="mx-auto max-w-4xl px-6 pb-24 pt-24">
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(faqStructuredData(items, url, locale)).replace(/</g, "\\u003c")}} />
    <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{tr ? "Sık sorulan sorular" : "Frequently asked questions"}</h1>
    <p className="mt-5 mb-10 max-w-2xl leading-8 text-slate-600">{tr
      ? "Ferrit nüveler, demir tozu nüveler, EMI filtreler ve teklif süreci hakkında kısa cevaplar. Aradığınızı bulamazsanız bize doğrudan sorun."
      : "Short answers about ferrite cores, iron powder cores, EMI filters and the quote process. If you can't find your question, ask us directly."}</p>
    <FaqSearch items={items} />
  </main>;
}
