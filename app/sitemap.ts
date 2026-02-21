import { MetadataRoute } from "next";
import base from "@/lib/airtable";
import { generateProductSlug } from "@/lib/utils";

export const dynamic = "force-dynamic"; // Generate at request time, not build time
export const revalidate = 3600; // Regenerate sitemap every hour

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<T>((_, reject) =>
    setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
}

type AirtableProductRecord = {
  id: string;
  fields: { "Product Name"?: string };
  _rawJson?: { createdTime?: string };
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
  ];

  // Fetch all products from Airtable (with 30 second timeout)
  try {
    const records = (await withTimeout(
      base("Ürünler").select({ fields: ["Product Name"] }).all(),
      30000
    )) as unknown as AirtableProductRecord[];

    const productUrls = records
      .filter((record) => record.fields["Product Name"])
      .map((record) => {
        const slug = generateProductSlug(
          record.fields["Product Name"] as string,
          record.id
        );

        return {
          url: `${siteUrl}/products/${slug}`,
          lastModified: record._rawJson?.createdTime
            ? new Date(record._rawJson.createdTime)
            : new Date(),
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
  } catch (error) {
    console.error("Error fetching products for sitemap:", error);
    // Return at least static pages if product fetch fails
    return staticPages;
  }
}
