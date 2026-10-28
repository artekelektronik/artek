import faq from "../content/faq.json";
import { blogPosts, englishBlogPosts, getBlogPost, headingId } from "./blog";
import type { FaqItem } from "./faq-search";

// Own questions from content/faq.json first, then every guide's FAQ, each linking back to its guide.
export function faqItems(locale: string): FaqItem[] {
  const en = locale === "en";
  const guideLink = (slug: string) => {
    const tr = getBlogPost(slug)!;
    const post = en ? getBlogPost(tr.translations.en, "en")! : tr;
    return {href: `/blog/${post.slug}`, label: post.title};
  };
  const own = faq.map(entry => {
    const text = en ? entry.en : entry.tr;
    const link = "guide" in entry && entry.guide ? guideLink(entry.guide) : "href" in entry && entry.href ? {href: entry.href, label: en ? "More information" : "Ayrıntılı bilgi"} : undefined;
    const source = "source" in entry && entry.source ? {href: entry.source.url, label: en ? entry.source.en : entry.source.tr} : undefined;
    return {id: headingId(text.q), group: entry.group as FaqItem["group"], question: text.q, answer: text.a, link, source};
  });
  const fromGuides = (en ? englishBlogPosts : blogPosts).flatMap(post => post.faq.map(({question, answer}) => ({
    id: headingId(question), group: "guides" as const, question, answer, link: {href: `/blog/${post.slug}`, label: post.title},
  })));
  return [...own, ...fromGuides];
}

// Guide questions are already marked up on their guide pages, so only this page's own questions go here.
export function faqStructuredData(items: FaqItem[], url: string, locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    inLanguage: locale === "en" ? "en" : "tr-TR",
    mainEntity: items.filter(item => item.group !== "guides").map(item => ({
      "@type": "Question", name: item.question, acceptedAnswer: {"@type": "Answer", text: item.answer},
    })),
  };
}
