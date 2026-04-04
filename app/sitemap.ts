import { MetadataRoute } from "next";
import { getProductsFromJSON } from "@/lib/local-products";
import { generateProductSlug } from "@/lib/utils";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.ferritnuve.com/";

  // Static pages for both locales
  const staticPages = [
    {
      url: siteUrl,
      lastModified: new Date(),
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
      lastModified: new Date(),
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
      lastModified: new Date(),
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
      lastModified: new Date(),
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
      lastModified: new Date(),
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
      lastModified: new Date(),
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
      lastModified: new Date(),
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
      lastModified: new Date(),
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

  const products = getProductsFromJSON();

  const productUrls = products.map((record) => {
    const slug = generateProductSlug(
      record.fields["Product Name"],
      record.id
    );

    return {
      url: `${siteUrl}/products/${slug}`,
      lastModified: new Date(),
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

  return [...staticPages, ...productUrls];
}
