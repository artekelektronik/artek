import { setRequestLocale } from "next-intl/server";
import { getMessages } from "next-intl/server";
import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { Box } from "@/components/box";
import { Feature } from "@/components/feature";
import HeroSection from "@/components/hero-section";
import Link from "next/link";
import {
  getLanguageAlternates,
  getLocalizedPath,
  getOgImageUrl,
  getSiteUrl,
} from "@/lib/seo";
import { productCatalogPaths } from "@/lib/product-taxonomy";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages({ locale });
  const allMetadata = messages.metadata as Record<string, { title: string; description: string }>;
  const metadata = allMetadata.home;
  const siteUrl = await getSiteUrl();
  const localizedPath = getLocalizedPath(locale);

  return {
    title: metadata.title,
    description: metadata.description,
    alternates: {
      canonical: `${siteUrl}${localizedPath}`,
      languages: getLanguageAlternates(siteUrl),
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

export default async function Home({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HomeContent />;
}

function HomeContent() {
  const t = useTranslations();

  const contactLink = `/contact`;

  return (
    <div>
      <HeroSection />

      {/* Keyword-rich category overview section for SEO */}
      <section className="bg-background py-16 px-6">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight">
              {t("homeKeywords.sectionTitle")}
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto text-base leading-relaxed">
              {t("homeKeywords.sectionSubtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="rounded-lg border bg-card p-6 space-y-3">
              <h3 className="font-semibold text-lg">{t("homeKeywords.ferritNuveTitle")}</h3>
              <p className="text-sm text-muted-foreground">{t("homeKeywords.ferritNuveDesc")}</p>
              <Link href="/ferrit-nuve" className="text-sm font-medium text-primary hover:underline">
                {t("homeKeywords.learnMore")} →
              </Link>
            </div>
            <div className="rounded-lg border bg-card p-6 space-y-3">
              <h3 className="font-semibold text-lg">{t("homeKeywords.bobinTitle")}</h3>
              <p className="text-sm text-muted-foreground">{t("homeKeywords.bobinDesc")}</p>
              <Link href="/bobin" className="text-sm font-medium text-primary hover:underline">
                {t("homeKeywords.learnMore")} →
              </Link>
            </div>
            <div className="rounded-lg border bg-card p-6 space-y-3">
              <h3 className="font-semibold text-lg">{t("homeKeywords.transformatorTitle")}</h3>
              <p className="text-sm text-muted-foreground">{t("homeKeywords.transformatorDesc")}</p>
              <Link href="/transformator" className="text-sm font-medium text-primary hover:underline">
                {t("homeKeywords.learnMore")} →
              </Link>
            </div>
          </div>
        </div>
      </section>
      {/* Row 1 - Ferrit Nüve / Ferrite Core */}
      <Box
        backgroundColor="bg-gray-100"
        title={t("home.hero1.title")}
        subtitle={t("home.hero1.subtitle")}
        buttons={[
          { text: t("buttons.viewProducts"), variant: "default", href: productCatalogPaths.ferrit },
          { text: t("buttons.contactUs"), variant: "outline", href: contactLink },
        ]}
        imageSrc="/products/core.png"
        imageAlt="Ferrite Core"
        imageClassName="max-w-lg"
      />

      {/* Row 2 - Karkaslar / Bobbins */}
      <Box
        backgroundColor="bg-background"
        title={t("home.hero2.title")}
        subtitle={t("home.hero2.subtitle")}
        description={t("home.hero2.description")}
        buttons={[
          { text: t("buttons.viewProducts"), variant: "default", href: productCatalogPaths.pem },
          { text: t("buttons.contactUs"), variant: "outline", href: contactLink },
        ]}
        imageSrc="/products/bobbins.png"
        imageAlt="Bobbins"
        imageClassName="max-w-sm md:max-w-lg"
      />

      {/* Row 3 - Ferrit Trafolar / Ferrite Transformers */}
      <Box
        backgroundColor="bg-muted"
        title={t("home.hero3.title")}
        subtitle={t("home.hero3.subtitle")}
        description={t("home.hero3.description")}
        buttons={[
          { text: t("buttons.viewProducts"), variant: "default", href: productCatalogPaths.ferrit },
          { text: t("buttons.contactUs"), variant: "outline", href: contactLink },
        ]}
        imageSrc="/products/feritte-transformers.png"
        imageAlt="Ferrite Transformers"
        imageClassName="max-w-lg"
      />

      {/* Row 4 - Saclı Trafolar / Laminated Transformers */}
      <Box
        backgroundColor="bg-background"
        title={t("home.hero4.title")}
        subtitle={t("home.hero4.subtitle")}
        description={t("home.hero4.description")}
        buttons={[
          { text: t("buttons.viewProducts"), variant: "default", href: "/transformator" },
          { text: t("buttons.contactUs"), variant: "outline", href: contactLink },
        ]}
        imageSrc="/products/laminated-transformers.png"
        imageAlt="Laminated Transformers"
        imageClassName="max-w-lg"
      />

      {/* 2x2 Grid Section - 4 Product Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        {/* 5. İndüktörler - Inductors */}
        <Box
          backgroundGradient="bg-gradient-to-br from-muted to-muted/60"
          height="h-[600px]"
          title={t("home.grid.inductors.title")}
          subtitle={t("home.grid.inductors.subtitle")}
          description={t("home.grid.inductors.description")}
          buttons={[
            { text: t("buttons.learnMore"), variant: "default", href: productCatalogPaths.ironPowder },
            { text: t("buttons.buy"), variant: "outline", href: contactLink },
          ]}
          imageSrc="/products/inductors.png"
          imageAlt="Inductors"
          imageClassName="max-w-xs"
        />

        {/* 6. Güç İndüktörleri - Power Inductors */}
        <Box
          backgroundGradient="bg-gradient-to-br from-emerald-50 to-teal-50"
          height="h-[600px]"
          title={t("home.grid.powerInductors.title")}
          subtitle={t("home.grid.powerInductors.subtitle")}
          description={t("home.grid.powerInductors.description")}
          buttons={[
            { text: t("buttons.learnMore"), variant: "default", href: productCatalogPaths.ironPowder },
            { text: t("buttons.buy"), variant: "outline", href: contactLink },
          ]}
          imageSrc="/products/power-inductors.png"
          imageAlt="Power Inductors"
          imageClassName="max-w-xs"
        />

        {/* 7. EMI/EMC Filtreler - EMC Filters */}
        <Box
          backgroundGradient="bg-gradient-to-br from-blue-50 to-slate-100"
          height="h-[600px]"
          title={t("home.grid.emcFilters.title")}
          subtitle={t("home.grid.emcFilters.subtitle")}
          description={t("home.grid.emcFilters.description")}
          buttons={[
            { text: t("buttons.learnMore"), variant: "default", href: productCatalogPaths.pem },
            { text: t("buttons.buy"), variant: "outline", href: contactLink },
          ]}
          imageSrc="/products/emc-filters.png"
          imageAlt="EMC Filters"
          imageClassName="max-w-xs"
        />

        {/* 8. Hava Nüveli Bobinler - Air Core Coils */}
        <Box
          backgroundGradient="bg-gradient-to-br from-muted/70 to-muted/40"
          height="h-[600px]"
          title={t("home.grid.airCoreCoils.title")}
          subtitle={t("home.grid.airCoreCoils.subtitle")}
          description={t("home.grid.airCoreCoils.description")}
          buttons={[
            { text: t("buttons.learnMore"), variant: "default", href: "/contact" },
            { text: t("buttons.buy"), variant: "outline", href: contactLink },
          ]}
          imageSrc="/products/air-core-coils.png"
          imageAlt="Air Core Coils"
          imageClassName="max-w-xs"
        />
      </div>

      <Feature />
    </div>
  );
}
