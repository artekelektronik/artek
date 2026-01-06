import { getMessages } from "next-intl/server";
import type { Metadata } from "next";
import { fetchProduct } from "@/lib/api/products";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://artek-elektronik.vercel.app";
  const localePrefix = locale === "tr" ? "" : `/${locale}`;

  try {
    const product = await fetchProduct(slug);
    const productName = product.fields["Product Name"] || "Product";
    
    // Handle AI field - it could be an AIField object or string
    const rawDescription = product.fields["Product Summary (AI)"] || product.fields.Description || `${productName} - High quality electronic components`;
    const descriptionText = typeof rawDescription === "string" 
      ? rawDescription 
      : (rawDescription as any).value || `${productName} - High quality electronic components`;
    const description = (descriptionText as string).substring(0, 160);

    return {
      title: `${productName} | Artek Elektronik`,
      description: description,
      alternates: {
        canonical: `${siteUrl}${localePrefix}/products/${slug}`,
      },
      openGraph: {
        title: `${productName} | Artek Elektronik`,
        description: description,
        url: `${siteUrl}${localePrefix}/products/${slug}`,
        type: "website",
        images: product.fields.Photo
          ? [
              {
                url: product.fields.Photo[0].thumbnails?.large?.url || product.fields.Photo[0].url,
                width: 1200,
                height: 630,
                alt: productName,
              },
            ]
          : [],
      },
    };
  } catch (error) {
    console.error(`Failed to fetch product metadata for slug: ${slug}`, error);
    // Fallback metadata if product fetch fails
    return {
      title: "Product | Artek Elektronik",
      description: "High quality electronic components from Artek Elektronik",
      alternates: {
        canonical: `${siteUrl}${localePrefix}/products/${slug}`,
      },
    };
  }
}

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string; slug: string }>;
};

export default async function Layout({ children, params }: LayoutProps) {
  return children;
}
