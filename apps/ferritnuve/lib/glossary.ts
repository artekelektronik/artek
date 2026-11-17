import glossary from "../content/glossary.json";
import { getBlogPost, headingId } from "./blog";

// Terms from content/glossary.json in alphabetical order for the language, each with its source
// and, where one fits, the guide that explains the term in context.
export function glossaryTerms(locale: string) {
  const en = locale === "en";
  return glossary.map(entry => {
    const text = en ? entry.en : entry.tr;
    const guide = "guide" in entry && entry.guide ? getBlogPost(entry.guide) : undefined;
    const post = guide && en ? getBlogPost(guide.translations.en, "en") : guide;
    return {
      id: headingId(text.term), term: text.term, definition: text.definition,
      source: {href: entry.source.url, label: en ? entry.source.en : entry.source.tr},
      guide: post && {href: `/blog/${post.slug}`, label: post.title},
    };
  }).sort((a, b) => a.term.localeCompare(b.term, en ? "en" : "tr"));
}

export function glossaryStructuredData(terms: ReturnType<typeof glossaryTerms>, url: string, locale: string) {
  const en = locale === "en";
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    "@id": `${url}#glossary`,
    name: en ? "Ferrite core and EMI filter glossary" : "Ferrit nüve ve EMI filtre sözlüğü",
    inLanguage: en ? "en" : "tr-TR",
    hasDefinedTerm: terms.map(term => ({"@type": "DefinedTerm", "@id": `${url}#${term.id}`, name: term.term, description: term.definition, inDefinedTermSet: `${url}#glossary`})),
  };
}
