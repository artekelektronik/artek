import fs from "node:fs";
import path from "node:path";
import posts from "../content/blog/posts.json";
import type { AirtableProduct } from "../types/airtable";

export function headingId(text: string) {
  return text.toLocaleLowerCase("tr").replace(/[ğüşıöç]/g, character => ({ğ:"g",ü:"u",ş:"s",ı:"i",ö:"o",ç:"c"})[character] ?? character).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const escapeHtml = (text: string) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");

// Only the checked-in Markdown subset is supported. Raw HTML is always escaped.
export function renderBlogMarkdown(markdown: string, locale = "tr") {
  const lines = markdown.trim().split(/\r?\n/);
  const title = lines.shift()!.replace(/^# /, "");
  const lead = lines.find(line => line.trim()) ?? "";
  const headings: {id: string; title: string}[] = [];
  const html: string[] = [];
  // Questions (###) under the FAQ section and their paragraphs as plain text, for FAQPage data.
  const faq: {question: string; answer: string}[] = [];
  let inFaq = false;
  let paragraph: string[] = [];
  let inList = false;
  function inline(text: string, references = true) {
    const links: string[] = [];
    let value = text.replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g, (_, label: string, href: string) => {
      const url = new URL(href);
      const internal = url.hostname === "www.ferritnuve.com";
      const destination = internal ? url.pathname + url.search + url.hash : href;
      const index = links.push(`<a href="${escapeHtml(destination)}"${internal ? "" : ' target="_blank" rel="noopener noreferrer"'}>${escapeHtml(label)}</a>`) - 1;
      return `BLOG_LINK_${index}_END`;
    });
    value = escapeHtml(value).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    if (references) value = value.replace(/\[(\d+)\]/g, `<sup><a href="#kaynak-$1" aria-label="${locale === "en" ? "Source" : "Kaynak"} $1">[$1]</a></sup>`);
    return value.replace(/BLOG_LINK_(\d+)_END/g, (_, index: string) => links[Number(index)]);
  }
  function flush() {
    if (!paragraph.length) return;
    const text = paragraph.join(" ");
    html.push(`<p>${inline(text)}</p>`);
    const question = inFaq ? faq.at(-1) : undefined;
    if (question) question.answer = [question.answer, plainText(text)].filter(Boolean).join(" ");
    paragraph = [];
  }
  function closeList() {
    if (inList) { html.push("</ul>"); inList = false; }
  }
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flush(); closeList(); continue; }
    if (/^#{2,3} /.test(line)) {
      flush(); closeList();
      const level = line.startsWith("### ") ? 3 : 2;
      const label = line.replace(/^#{2,3} /, "");
      const id = headingId(label);
      if (level === 2) headings.push({id, title: label});
      if (level === 2) inFaq = /^(Sık sorulan sorular|Frequently asked questions)$/.test(label);
      else if (inFaq) faq.push({question: label, answer: ""});
      html.push(`<h${level} id="${id}">${inline(label)}</h${level}>`);
    } else if (line.startsWith("- ")) {
      flush();
      if (!inList) { html.push("<ul>"); inList = true; }
      const entry = line.slice(2);
      const reference = entry.match(/^\[(\d+)\] /);
      html.push(`<li${reference ? ` id="kaynak-${reference[1]}"` : ""}>${inline(entry, !reference)}</li>`);
    } else {
      closeList(); paragraph.push(line);
    }
  }
  flush(); closeList();
  return {title, lead, html: html.slice(1).join("\n"), headings, faq, minutes: Math.ceil(markdown.split(/\s+/).length / 180)};
}

const plainText = (text: string) => text.replace(/\[([^\]]+)\]\(https:\/\/[^\s)]+\)/g, "$1").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\s*\[\d+\]/g, "").trim();

export function getBlogPosts(locale = "tr") {
  return posts.map(post => {
    const localized = locale === "en" ? {...post, ...post.en} : post;
    const markdown = fs.readFileSync(path.join(process.cwd(), "content/blog", localized.file), "utf8");
    return {...localized, locale, translations: {tr: post.slug, en: post.en.slug}, ...renderBlogMarkdown(markdown, locale)};
  });
}

export const blogPosts = getBlogPosts();
export const englishBlogPosts = getBlogPosts("en");
export function getBlogPost(slug: string, locale = "tr") {
  return (locale === "en" ? englishBlogPosts : blogPosts).find(post => post.slug === slug);
}

// The guides read as one book. Chapters and the guides inside them are in reading order;
// a new guide must be added to a chapter here (the tests fail until it is).
const chapters = [
  {key: "basics", tr: "Temel bilgiler", en: "Basics",
    trIntro: "Ferrit nüvenin ne olduğu, hangi biçimlerde bulunduğu ve endüktans, doyma gibi temel kavramlar.", enIntro: "What a ferrite core is, which shapes it comes in, and basic concepts such as inductance and saturation.",
    slugs: ["ferrit-nuve-nedir", "ferrit-nuve-cesitleri", "smps-nedir", "al-degeri-sarim-sayisi-hesabi", "nuve-doymasi-hava-araligi", "deri-etkisi-litz-teli"]},
  {key: "shapes", tr: "Nüve biçimleri", en: "Core shapes",
    trIntro: "Her nüve biçimi için ölçü, malzeme ve kullanım yerine göre seçim adımları.", enIntro: "Selection steps for each core shape by size, material and application.",
    slugs: ["ee-nuve-secimi", "etd-nuve-secimi", "uu-nuve-secimi", "ferrit-toroid-nuve-secimi", "ferrit-cubuk-nuve-secimi", "makara-ferrit-nuve-secimi", "smps-trafosu-nuve-karkas-secimi"]},
  {key: "materials", tr: "Malzemeler", en: "Materials",
    trIntro: "Ferrit ve demir tozu malzemeler, malzeme kodları ve muadil karşılaştırması.", enIntro: "Ferrite and iron-powder materials, material codes and comparing equivalents.",
    slugs: ["ferrit-demir-tozu-toroid", "26-52-toroid-karsilastirmasi", "toroid-nuve-renkleri", "cf-ferrit-malzeme-kodlari"]},
  {key: "emi", tr: "EMI ve filtreler", en: "EMI and filters",
    trIntro: "Parazitin ne olduğu, onu bastıran ferritler, şok bobinleri ve şebeke girişi filtreleri.", enIntro: "What interference is, and the ferrites, chokes and mains input filters that suppress it.",
    slugs: ["emi-emc-rfi-nedir", "ferrit-boncuk-sok-bobini-farki", "kablo-ferriti-secimi", "yassi-kablo-ferriti-secimi", "ortak-mod-sok-bobini-secimi", "tek-fazli-emi-filtre-secimi"]},
  {key: "rfq", tr: "Teklif hazırlama", en: "Preparing an enquiry",
    trIntro: "Özel trafo ve indüktör talebinde hangi bilgilerin verilmesi gerektiği.", enIntro: "What to include when asking for a custom transformer or inductor.",
    slugs: ["ozel-trafo-teklif-rehberi", "ozel-induktor-teklif-rehberi"]},
];
export function libraryChapters(locale = "tr") {
  const en = locale === "en";
  const posts = en ? englishBlogPosts : blogPosts;
  return chapters.map((chapter, index) => ({
    key: chapter.key, number: index + 1, title: en ? chapter.en : chapter.tr, intro: en ? chapter.enIntro : chapter.trIntro,
    posts: chapter.slugs.flatMap(slug => posts.filter(post => post.translations.tr === slug)),
  }));
}
export function readingNeighbours(slug: string, locale = "tr") {
  const library = libraryChapters(locale);
  const order = library.flatMap(chapter => chapter.posts);
  const index = order.findIndex(post => post.slug === slug);
  return {previous: order[index - 1], next: order[index + 1], chapter: library.find(chapter => chapter.posts.includes(order[index]))!};
}

export function blogStructuredData(post: typeof blogPosts[number], siteUrl: string) {
  const prefix = post.locale === "en" ? "/en" : "";
  const url = `${siteUrl}${prefix}/blog/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting", "@id": `${url}#article`, headline: post.title,
        description: post.description, image: [`${siteUrl}${post.image}`],
        datePublished: post.publishedAt, dateModified: post.modifiedAt, inLanguage: post.locale === "en" ? "en" : "tr-TR",
        mainEntityOfPage: {"@type": "WebPage", "@id": url},
        author: {"@type": "Organization", name: "Artek Elektronik", url: `${siteUrl}${prefix}/about`},
        publisher: {"@type": "Organization", "@id": `${siteUrl}/#business`, name: "Artek Elektronik", url: siteUrl},
        isPartOf: {"@type": "Blog", "@id": `${siteUrl}${prefix}/blog`, name: post.locale === "en" ? "Artek Technical Guides" : "Artek Teknik Rehberler"},
      },
      {
        "@type": "BreadcrumbList", itemListElement: [
          {"@type": "ListItem", position: 1, name: post.locale === "en" ? "Home" : "Ana sayfa", item: `${siteUrl}${prefix}`},
          {"@type": "ListItem", position: 2, name: "Blog", item: `${siteUrl}${prefix}/blog`},
          {"@type": "ListItem", position: 3, name: post.title, item: url},
        ],
      },
      ...(post.faq.length ? [{
        "@type": "FAQPage", "@id": `${url}#faq`, inLanguage: post.locale === "en" ? "en" : "tr-TR",
        mainEntity: post.faq.map(({question, answer}) => ({"@type": "Question", name: question, acceptedAnswer: {"@type": "Answer", text: answer}})),
      }] : []),
    ],
  };
}

export function productGuideSlug(category?: string, productTypes?: string[], name = "") {
  if (category === "PEM") return "tek-fazli-emi-filtre-secimi";
  if (category === "IRON-POWDER") return "ferrit-demir-tozu-toroid";
  if (productTypes?.includes("TOROID")) return "ferrit-toroid-nuve-secimi";
  if (productTypes?.includes("CUBUK")) return "ferrit-cubuk-nuve-secimi";
  if (productTypes?.includes("ETD")) return "etd-nuve-secimi";
  if (productTypes?.includes("EE")) return "ee-nuve-secimi";
  if (productTypes?.includes("YUVARLAK")) return "kablo-ferriti-secimi";
  if (productTypes?.includes("YASSI")) return "yassi-kablo-ferriti-secimi";
  // UU cores have no Ürün Tipi in the catalog yet, so they are recognised by name.
  if (category === "Ferrit" && /^UUR?\s/.test(name)) return "uu-nuve-secimi";
  // Drum cores have no Ürün Tipi either.
  if (category === "Ferrit" && /^MAKARA\s/.test(name)) return "makara-ferrit-nuve-secimi";
}

// The material marking at the end of a catalog name, such as CF139 in "EE 25 / 13 / 7 - CF139".
const materialMark = (name: string) => name.match(/CF\s?(\d{3})/)?.[1];

// A product can support more than one guide. Take groups in turn so comparisons
// and the transformer and UU guides show both relevant material/type/shape families.
// Explanatory guides have no product type of their own: each shows one core of the shapes it talks about.
export const guideShapes: Record<string, string[]> = {
  "ferrit-nuve-cesitleri": ["EE", "ETD", "TOROID", "CUBUK"],
  "ferrit-nuve-nedir": ["EE", "ETD", "TOROID", "CUBUK"],
  "smps-nedir": ["EE", "ETD", "TOROID"],
  "ferrit-boncuk-sok-bobini-farki": ["YUVARLAK", "TOROID"],
  "al-degeri-sarim-sayisi-hesabi": ["TOROID", "EE", "ETD"],
  "smps-trafosu-nuve-karkas-secimi": ["EE", "ETD"],
  "nuve-doymasi-hava-araligi": ["EE", "ETD", "TOROID"],
  "ortak-mod-sok-bobini-secimi": ["TOROID"],
  "deri-etkisi-litz-teli": ["EE", "TOROID"],
};

export function relatedProducts(products: AirtableProduct[], guideSlug: string, limit = 4) {
  const transformer = guideSlug === "ozel-trafo-teklif-rehberi";
  const powderComparison = guideSlug === "26-52-toroid-karsilastirmasi";
  const uu = guideSlug === "uu-nuve-secimi";
  const toroidComparison = guideSlug === "ferrit-demir-tozu-toroid" || guideSlug === "toroid-nuve-renkleri";
  const materials = guideSlug === "cf-ferrit-malzeme-kodlari";
  const inductor = guideSlug === "ozel-induktor-teklif-rehberi";
  const shapes = guideShapes[guideSlug];
  const filters = guideSlug === "emi-emc-rfi-nedir";
  const toroid = (p: AirtableProduct) => p.fields.Category === "Ferrit" && !!p.fields["Ürün Tipi"]?.includes("TOROID");
  const matches = products.filter(p => {
    if (transformer) return p.fields.Category === "Ferrit" && p.fields["Ürün Tipi"]?.some(type => type === "EE" || type === "ETD");
    if (powderComparison) return p.fields.Category === "IRON-POWDER" && /-\s*(26|52)\s*$/.test(p.fields["Product Name"]);
    if (toroidComparison) return p.fields.Category === "IRON-POWDER" || toroid(p);
    // Only typed products, so the catalog link can filter to exactly the shapes shown.
    if (materials) return p.fields.Category === "Ferrit" && !!p.fields["Ürün Tipi"]?.length && !!materialMark(p.fields["Product Name"]);
    if (inductor) return p.fields.Category === "IRON-POWDER" || toroid(p) || !!p.fields["Ürün Tipi"]?.includes("CUBUK");
    if (shapes) return p.fields.Category === "Ferrit" && shapes.includes(p.fields["Ürün Tipi"]?.[0] ?? "");
    if (filters) return p.fields.Category === "PEM";
    return productGuideSlug(p.fields.Category, p.fields["Ürün Tipi"], p.fields["Product Name"]) === guideSlug;
  });
  if (guideSlug === "ee-nuve-secimi") {
    const featured = (p: AirtableProduct) => /^EE\s*(25|42)\b/.test(p.fields["Product Name"]);
    matches.sort((a, b) => Number(featured(b)) - Number(featured(a)));
  }
  const categories = [...new Set(matches.map(p => p.fields.Category ?? ""))];
  const types = [...new Set(matches.flatMap(p => p.fields["Ürün Tipi"] ?? []))];
  const groupKey = (p: AirtableProduct) => transformer ? p.fields["Ürün Tipi"]?.[0] : powderComparison ? p.fields["Product Name"].match(/(26|52)\s*$/)?.[1] : uu ? p.fields["Product Name"].split(" ")[0] : materials ? materialMark(p.fields["Product Name"]) : inductor || shapes ? p.fields["Ürün Tipi"]?.[0] : p.fields.Category;
  const keys = [...new Set(matches.map(groupKey))];
  const groups = keys.map(key => matches.filter(p => groupKey(p) === key));
  const longest = Math.max(0, ...groups.map(group => group.length));
  const inTurn = Array.from({length: longest}, (_, i) => groups.map(group => group[i])).flat().filter(p => p !== undefined);
  const query = new URLSearchParams({categories: categories.join(",")});
  if (types.length) query.set("productTypes", types.join(","));
  return {products: inTurn.slice(0, limit), catalogHref: `/products?${query}`};
}
