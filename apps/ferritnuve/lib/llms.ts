import { blogPosts, englishBlogPosts } from "./blog";
import { company } from "./company";
import { groupName, productGroups } from "./product-taxonomy";

// llms.txt (llmstxt.org): a plain Markdown summary of the site for AI assistants, built from the same data as the pages.
export function llmsText(siteUrl: string) {
  const guides = (posts: typeof blogPosts) => posts.map(post => `- [${post.title}](${siteUrl}${post.locale === "en" ? "/en" : ""}/blog/${post.slug}): ${post.description}`);
  return [
    `# ${company.name}`,
    "",
    `> ${company.name} (ferritnuve.com) is an electronic and magnetic components company in Karaköy, İstanbul, Türkiye. Its online catalog covers ferrite cores, iron powder cores and power / EMI filters; bobbins and transformers are handled by enquiry. The catalog shows no prices or stock: customers send an enquiry by form, phone, WhatsApp or email.`,
    "",
    "The site is bilingual: Turkish pages are at the root, English pages under /en.",
    "",
    "## Contact",
    "",
    `- Email: ${company.email}`,
    ...company.phones.map(phone => `- Phone: ${phone.href.replace("tel:", "")}`),
    `- Address: Erişteci Sokak Abed Han No: 7/1, Karaköy, İstanbul, Türkiye`,
    `- [Enquiry form](${siteUrl}/en/contact)`,
    "",
    "## Product catalog",
    "",
    `- [All products](${siteUrl}/en/products)`,
    ...productGroups.map(group => `- [${groupName(group, "en")}](${siteUrl}/en${group.href})`),
    "",
    "## Technical guides (English)",
    "",
    ...guides(englishBlogPosts),
    "",
    "## Teknik rehberler (Türkçe)",
    "",
    ...guides(blogPosts),
    "",
    "## Company",
    "",
    `- [Frequently asked questions](${siteUrl}/en/faq): technical answers (AL value, air gap, MnZn/NiZn ferrite, common-mode chokes) and the quote process`,
    `- [About](${siteUrl}/en/about)`,
    `- [Certificates](${siteUrl}/en/certificates)`,
    "",
  ].join("\n");
}
