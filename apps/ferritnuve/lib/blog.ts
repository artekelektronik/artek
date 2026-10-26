import fs from "node:fs";
import path from "node:path";
import posts from "../content/blog/posts.json";

export function headingId(text: string) {
  return text.toLocaleLowerCase("tr").replace(/[ğüşıöç]/g, character => ({ğ:"g",ü:"u",ş:"s",ı:"i",ö:"o",ç:"c"})[character] ?? character).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const escapeHtml = (text: string) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");

// Only the checked-in Markdown subset is supported. Raw HTML is always escaped.
export function renderBlogMarkdown(markdown: string) {
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
    if (references) value = value.replace(/\[(\d+)\]/g, '<sup><a href="#kaynak-$1" aria-label="Kaynak $1">[$1]</a></sup>');
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

export const blogPosts = posts.map(post => {
  const markdown = fs.readFileSync(path.join(process.cwd(), "content/blog", post.file), "utf8");
  return {...post, ...renderBlogMarkdown(markdown)};
});

export function getBlogPost(slug: string) {
  return blogPosts.find(post => post.slug === slug);
}

export function blogStructuredData(post: typeof blogPosts[number], siteUrl: string) {
  const url = `${siteUrl}/blog/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting", "@id": `${url}#article`, headline: post.title,
        description: post.description, image: [`${siteUrl}${post.image}`],
        datePublished: post.publishedAt, dateModified: post.modifiedAt, inLanguage: "tr-TR",
        mainEntityOfPage: {"@type": "WebPage", "@id": url},
        author: {"@type": "Organization", name: "Artek Elektronik", url: `${siteUrl}/about`},
        publisher: {"@type": "Organization", name: "Artek Elektronik", url: siteUrl},
        isPartOf: {"@type": "Blog", "@id": `${siteUrl}/blog`, name: "Artek Teknik Rehberler"},
      },
      {
        "@type": "BreadcrumbList", itemListElement: [
          {"@type": "ListItem", position: 1, name: "Ana sayfa", item: siteUrl},
          {"@type": "ListItem", position: 2, name: "Blog", item: `${siteUrl}/blog`},
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
  if (productTypes?.includes("YUVARLAK")) return "kablo-ferriti-secimi";
}
