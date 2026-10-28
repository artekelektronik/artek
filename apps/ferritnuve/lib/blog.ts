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
    if (paragraph.length) { html.push(`<p>${inline(paragraph.join(" "))}</p>`); paragraph = []; }
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
  return {title, lead, html: html.slice(1).join("\n"), headings, minutes: Math.ceil(markdown.split(/\s+/).length / 180)};
}

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
        publisher: {"@type": "Organization", name: "Artek Elektronik", url: siteUrl},
        isPartOf: {"@type": "Blog", "@id": `${siteUrl}${prefix}/blog`, name: post.locale === "en" ? "Artek Technical Guides" : "Artek Teknik Rehberler"},
      },
      {
        "@type": "BreadcrumbList", itemListElement: [
          {"@type": "ListItem", position: 1, name: post.locale === "en" ? "Home" : "Ana sayfa", item: `${siteUrl}${prefix}`},
          {"@type": "ListItem", position: 2, name: "Blog", item: `${siteUrl}${prefix}/blog`},
          {"@type": "ListItem", position: 3, name: post.title, item: url},
        ],
      },
    ],
  };
}

export function productGuideSlug(category?: string, productTypes?: string[]) {
  if (category === "PEM") return "tek-fazli-emi-filtre-secimi";
  if (category === "IRON-POWDER" || productTypes?.includes("TOROID")) return "ferrit-demir-tozu-toroid";
  if (productTypes?.includes("ETD")) return "etd-nuve-secimi";
  if (productTypes?.includes("EE")) return "ee-nuve-secimi";
  if (productTypes?.includes("YUVARLAK")) return "kablo-ferriti-secimi";
}

// A product can support more than one guide. Take groups in turn so comparisons
// and the transformer enquiry guide show both relevant material/type families.
export function relatedProducts(products: AirtableProduct[], guideSlug: string, limit = 4) {
  const transformer = guideSlug === "ozel-trafo-teklif-rehberi";
  const powderComparison = guideSlug === "26-52-toroid-karsilastirmasi";
  const matches = products.filter(p => {
    if (transformer) return p.fields.Category === "Ferrit" && p.fields["Ürün Tipi"]?.some(type => type === "EE" || type === "ETD");
    if (powderComparison) return p.fields.Category === "IRON-POWDER" && /-\s*(26|52)\s*$/.test(p.fields["Product Name"]);
    return productGuideSlug(p.fields.Category, p.fields["Ürün Tipi"]) === guideSlug;
  });
  if (guideSlug === "ee-nuve-secimi") {
    const featured = (p: AirtableProduct) => /^EE\s*(25|42)\b/.test(p.fields["Product Name"]);
    matches.sort((a, b) => Number(featured(b)) - Number(featured(a)));
  }
  const categories = [...new Set(matches.map(p => p.fields.Category ?? ""))];
  const types = [...new Set(matches.flatMap(p => p.fields["Ürün Tipi"] ?? []))];
  const groupKey = (p: AirtableProduct) => transformer ? p.fields["Ürün Tipi"]?.[0] : powderComparison ? p.fields["Product Name"].match(/(26|52)\s*$/)?.[1] : p.fields.Category;
  const keys = [...new Set(matches.map(groupKey))];
  const groups = keys.map(key => matches.filter(p => groupKey(p) === key));
  const longest = Math.max(0, ...groups.map(group => group.length));
  const inTurn = Array.from({length: longest}, (_, i) => groups.map(group => group[i])).flat().filter(p => p !== undefined);
  const query = new URLSearchParams({categories: categories.join(",")});
  if (types.length) query.set("productTypes", types.join(","));
  return {products: inTurn.slice(0, limit), catalogHref: `/products?${query}`};
}
