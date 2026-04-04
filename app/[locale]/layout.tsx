import type { Metadata } from "next";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import "../globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Providers } from "@/components/providers";
import { routing } from "@/i18n/routing";
import {
  getLanguageAlternates,
  getLocalizedPath,
  getOgImageUrl,
  getSiteUrl,
  getTwitterImageUrl,
} from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages({ locale });
  const allMetadata = messages.metadata as Record<string, { title: string; description: string }>;
  // Default to home metadata
  const metadata = allMetadata.home || { title: "Artek Elektronik", description: "Premium magnetic components manufacturer" };
  const siteUrl = await getSiteUrl();
  const localizedPath = getLocalizedPath(locale);

  return {
    title: metadata.title,
    description: metadata.description,
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: `${siteUrl}${localizedPath}`,
      languages: getLanguageAlternates(siteUrl),
    },
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      url: `${siteUrl}${localizedPath}`,
      siteName: "Artek Elektronik",
      locale: locale === "tr" ? "tr_TR" : "en_US",
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
    twitter: {
      card: "summary_large_image",
      title: metadata.title,
      description: metadata.description,
      images: [getTwitterImageUrl(siteUrl, locale)],
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const siteUrl = await getSiteUrl();

  // Validate that the incoming locale is valid
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Get messages for the current locale
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "@id": `${siteUrl}/#business`,
              name: locale === "tr" ? "Artek Elektronik - Ferrit Nüve ve Bobin Üreticisi" : "Artek Elektronik - Ferrite Core & Bobbin Manufacturer",
              url: siteUrl,
              logo: `${siteUrl}/icon`,
              image: `${siteUrl}/hero.webp`,
              description: locale === "tr"
                ? "Ferrit nüve, bobin, SMPS transformatör ve indüktör üreten Türk üreticisi. EE, ETD, UU, Toroid serisi nüveler, karkaslar ve özel tasarım çözümleri."
                : "Turkish manufacturer of ferrite cores, bobbins, SMPS transformers and inductors. EE, ETD, UU, Toroid cores, bobbins and custom design solutions.",
              telephone: ["+90-212-252-11-68", "+90-532-718-33-64"],
              email: "artek@ferritnuve.com",
              address: {
                "@type": "PostalAddress",
                streetAddress: "Ferrit Nüve Erişteci Sokak, Abed Han No: 7/1",
                addressLocality: "Karaköy",
                addressRegion: "İstanbul",
                postalCode: "34425",
                addressCountry: "TR",
              },
              geo: {
                "@type": "GeoCoordinates",
                latitude: 41.0228,
                longitude: 28.9744,
              },
              openingHoursSpecification: [
                {
                  "@type": "OpeningHoursSpecification",
                  dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                  opens: "08:30",
                  closes: "18:00",
                },
              ],
              hasOfferCatalog: {
                "@type": "OfferCatalog",
                name: locale === "tr" ? "Ferrit Nüve ve Manyetik Bileşenler" : "Ferrite Cores & Magnetic Components",
                itemListElement: [
                  { "@type": "Offer", itemOffered: { "@type": "Product", name: locale === "tr" ? "Ferrit Nüve" : "Ferrite Core", description: locale === "tr" ? "EE, ETD, UU, Toroid ve özel geometri ferrit nüveler" : "EE, ETD, UU, Toroid and custom geometry ferrite cores" } },
                  { "@type": "Offer", itemOffered: { "@type": "Product", name: locale === "tr" ? "Bobin (Karkas)" : "Bobbin", description: locale === "tr" ? "Transformatör ve indüktör için EE, ETD, PQ serisi karkaslar" : "EE, ETD, PQ series bobbins for transformers and inductors" } },
                  { "@type": "Offer", itemOffered: { "@type": "Product", name: locale === "tr" ? "SMPS Transformatör" : "SMPS Transformer", description: locale === "tr" ? "Yüksek frekanslı anahtarlamalı güç kaynağı transformatörleri" : "High-frequency switched-mode power supply transformers" } },
                  { "@type": "Offer", itemOffered: { "@type": "Product", name: locale === "tr" ? "Sac Transformatör" : "Laminated Transformer", description: locale === "tr" ? "Endüstriyel uygulamalar için sac nüveli transformatörler" : "Laminated core transformers for industrial applications" } },
                  { "@type": "Offer", itemOffered: { "@type": "Product", name: locale === "tr" ? "İndüktör" : "Inductor", description: locale === "tr" ? "Güç ve RF indüktörleri" : "Power and RF inductors" } },
                  { "@type": "Offer", itemOffered: { "@type": "Product", name: locale === "tr" ? "EMI/EMC Filtre" : "EMI/EMC Filter", description: locale === "tr" ? "Elektromanyetik girişim filtreleri" : "Electromagnetic interference filters" } },
                ],
              },
              areaServed: ["TR", "DE", "GB", "NL", "US", "EU"],
              foundingDate: "1987",
              numberOfEmployees: { "@type": "QuantitativeValue", value: 50 },
              sameAs: [
                "https://www.instagram.com/artekelectronics",
                "https://www.linkedin.com/company/artek-elektronik",
              ],
              knowsAbout: [
                "Ferrit Nüve", "Ferrite Core", "Bobin", "Bobbin", "SMPS Transformatör",
                "Sac Transformatör", "Toroid Nüve", "EE Nüve", "ETD Nüve", "İndüktör",
                "EMI Filtre", "EMC Filtre", "Manyetik Bileşenler",
              ],
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
                  page_path: window.location.pathname,
                  locale: '${locale}'
                });
              `}
            </Script>
          </>
        )}

        <NextIntlClientProvider messages={messages}>
          <Providers>
            <Header />
            {/* <HeaderTwo /> */}
            {children}
            <Footer />
          </Providers>
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
