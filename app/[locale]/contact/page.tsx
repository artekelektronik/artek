import { setRequestLocale } from "next-intl/server";
import { getMessages } from "next-intl/server";
import type { Metadata } from "next";
import { Contact20 } from "@/components/contact";
import {
  getLanguageAlternates,
  getLocalizedPath,
  getOgImageUrl,
  getSiteUrl,
} from "@/lib/seo";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages({ locale });
  const allMetadata = messages.metadata as Record<string, { title: string; description: string }>;
  const metadata = allMetadata.contact;
  const siteUrl = await getSiteUrl();
  const localizedPath = getLocalizedPath(locale, "/contact");

  return {
    title: metadata.title,
    description: metadata.description,
    alternates: {
      canonical: `${siteUrl}${localizedPath}`,
      languages: getLanguageAlternates(siteUrl, "/contact"),
    },
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      url: `${siteUrl}${localizedPath}`,
      type: "website",
      images: [
        {
          url: getOgImageUrl(siteUrl, locale),
          width: 1200,
          height: 630,
          alt: "Artek Elektronik - Premium Magnetic Components",
        },
      ],
    },
  };
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <Contact20 />;
}
