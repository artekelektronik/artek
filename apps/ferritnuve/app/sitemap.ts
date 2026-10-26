import { MetadataRoute } from "next";
import { getProducts } from "@/lib/catalog";
import { blogPosts, englishBlogPosts } from "@/lib/blog";
import { generateProductSlug } from "@/lib/utils";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.ferritnuve.com"
  ).replace(/\/+$/, "");

  // Static pages for both locales
  const staticPages = [
    {
      url: siteUrl,
      changeFrequency: "daily" as const,
      priority: 1,
      alternates: {
        languages: {
          tr: siteUrl,
          en: `${siteUrl}/en`,
        },
      },
    },
    {
      url: `${siteUrl}/products`,
      changeFrequency: "daily" as const,
      priority: 0.9,
      alternates: {
        languages: {
          tr: `${siteUrl}/products`,
          en: `${siteUrl}/en/products`,
        },
      },
    },
    {
      url: `${siteUrl}/about`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
      alternates: {
        languages: {
          tr: `${siteUrl}/about`,
          en: `${siteUrl}/en/about`,
        },
      },
    },
    {
      url: `${siteUrl}/certificates`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
      alternates: {
        languages: {
          tr: `${siteUrl}/certificates`,
          en: `${siteUrl}/en/certificates`,
        },
      },
    },
    {
      url: `${siteUrl}/contact`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
      alternates: {
        languages: {
          tr: `${siteUrl}/contact`,
          en: `${siteUrl}/en/contact`,
        },
      },
    },
    {
      url: `${siteUrl}/ferrit-nuve`,
      changeFrequency: "monthly" as const,
      priority: 0.85,
      alternates: {
        languages: {
          tr: `${siteUrl}/ferrit-nuve`,
          en: `${siteUrl}/en/ferrit-nuve`,
        },
      },
    },
    {
      url: `${siteUrl}/bobin`,
      changeFrequency: "monthly" as const,
      priority: 0.85,
      alternates: {
        languages: {
          tr: `${siteUrl}/bobin`,
          en: `${siteUrl}/en/bobin`,
        },
      },
    },
    {
      url: `${siteUrl}/transformator`,
      changeFrequency: "monthly" as const,
      priority: 0.85,
      alternates: {
        languages: {
          tr: `${siteUrl}/transformator`,
          en: `${siteUrl}/en/transformator`,
        },
      },
    },
  ];

  const products = await getProducts();

  const productUrls = products.map((record) => {
    const slug = generateProductSlug(
      record.fields["Product Name"],
      record.id
    );

    return {
      url: `${siteUrl}/products/${slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      alternates: {
        languages: {
          tr: `${siteUrl}/products/${slug}`,
          en: `${siteUrl}/en/products/${slug}`,
        },
      },
    };
  });

  const entries = [...staticPages, ...productUrls];
  return [
    ...entries.flatMap(entry => [entry, {...entry, url: entry.alternates.languages.en}]),
    ...["/blog", "/en/blog"].map(path => ({url: `${siteUrl}${path}`, changeFrequency: "weekly" as const, priority: 0.7, alternates: {languages: {tr: `${siteUrl}/blog`, en: `${siteUrl}/en/blog`}}})),
    ...[...blogPosts, ...englishBlogPosts].map(post => ({url: `${siteUrl}${post.locale === "en" ? "/en" : ""}/blog/${post.slug}`, lastModified: post.modifiedAt, changeFrequency: "monthly" as const, priority: 0.7, alternates: {languages: {tr: `${siteUrl}/blog/${post.translations.tr}`, en: `${siteUrl}/en/blog/${post.translations.en}`}}})),
  ];
}
