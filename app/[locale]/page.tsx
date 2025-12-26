import { setRequestLocale } from "next-intl/server";
import { useTranslations, useLocale } from "next-intl";
import { Box } from "@/components/box";
import { Feature } from "@/components/feature";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function Home({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HomeContent />;
}

function HomeContent() {
  const t = useTranslations();
  const locale = useLocale();

  // Helper to create product links with category filter
  const productsLink = (category?: string) => {
    const base = `/${locale}/products`;
    if (category) {
      return `${base}?categories=${encodeURIComponent(category)}`;
    }
    return base;
  };

  const contactLink = `/${locale}/contact`;

  return (
    <div>
      {/* Row 1 - Ferrit Nüve / Ferrite Core */}
      <Box
        backgroundColor="bg-gray-100"
        title={t("home.hero1.title")}
        subtitle={t("home.hero1.subtitle")}
        buttons={[
          { text: t("buttons.viewProducts"), variant: "default", href: productsLink("Ferrit") },
          { text: t("buttons.contactUs"), variant: "outline", href: contactLink },
        ]}
        imageSrc="/products/core.png"
        imageAlt="Ferrite Core"
        imageClassName="max-w-lg"
      />

      {/* Row 2 - Karkaslar / Bobbins */}
      <Box
        backgroundColor="bg-white"
        title={t("home.hero2.title")}
        subtitle={t("home.hero2.subtitle")}
        description={t("home.hero2.description")}
        buttons={[
          { text: t("buttons.viewProducts"), variant: "default", href: productsLink("PEM") },
          { text: t("buttons.contactUs"), variant: "outline", href: contactLink },
        ]}
        imageSrc="/products/bobbins.png"
        imageAlt="Bobbins"
        imageClassName="max-w-lg"
      />

      {/* Row 3 - Ferrit Trafolar / Ferrite Transformers */}
      <Box
        backgroundColor="bg-gray-200"
        title={t("home.hero3.title")}
        subtitle={t("home.hero3.subtitle")}
        description={t("home.hero3.description")}
        buttons={[
          { text: t("buttons.viewProducts"), variant: "default", href: productsLink("IRON-POWDER") },
          { text: t("buttons.contactUs"), variant: "outline", href: contactLink },
        ]}
        imageSrc="/products/feritte-transformers.png"
        imageAlt="Ferrite Transformers"
        imageClassName="max-w-lg"
      />

      {/* Row 4 - Saclı Trafolar / Laminated Transformers */}
      <Box
        backgroundColor="bg-white"
        title={t("home.hero4.title")}
        subtitle={t("home.hero4.subtitle")}
        description={t("home.hero4.description")}
        buttons={[
          { text: t("buttons.viewProducts"), variant: "default", href: productsLink("Saclı Trafo") },
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
          backgroundColor="bg-gray-100"
          height="h-[600px]"
          title={t("home.grid.inductors.title")}
          subtitle={t("home.grid.inductors.subtitle")}
          description={t("home.grid.inductors.description")}
          buttons={[
            { text: t("buttons.learnMore"), variant: "default", href: productsLink("İndüktör") },
            { text: t("buttons.buy"), variant: "outline", href: contactLink },
          ]}
          imageSrc="/products/inductors.png"
          imageAlt="Inductors"
          imageClassName="max-w-xs"
        />

        {/* 6. Güç İndüktörleri - Power Inductors */}
        <Box
          backgroundColor="bg-black"
          height="h-[600px]"
          title={t("home.grid.powerInductors.title")}
          subtitle={t("home.grid.powerInductors.subtitle")}
          description={t("home.grid.powerInductors.description")}
          buttons={[
            { text: t("buttons.learnMore"), variant: "default", href: productsLink("Güç İndüktörü") },
            { text: t("buttons.buy"), variant: "outline", href: contactLink },
          ]}
          imageSrc="/products/power-inductors.png"
          imageAlt="Power Inductors"
          imageClassName="max-w-xs"
        />

        {/* 7. EMI/EMC Filtreler - EMC Filters */}
        <Box
          backgroundColor="bg-blue-100"
          height="h-[600px]"
          title={t("home.grid.emcFilters.title")}
          subtitle={t("home.grid.emcFilters.subtitle")}
          description={t("home.grid.emcFilters.description")}
          buttons={[
            { text: t("buttons.learnMore"), variant: "default", href: productsLink("EMC Filtre") },
            { text: t("buttons.buy"), variant: "outline", href: contactLink },
          ]}
          imageSrc="/products/emc-filters.png"
          imageAlt="EMC Filters"
          imageClassName="max-w-xs"
        />

        {/* 8. Hava Nüveli Bobinler - Air Core Coils */}
        <Box
          backgroundColor="bg-gray-200"
          height="h-[600px]"
          title={t("home.grid.airCoreCoils.title")}
          subtitle={t("home.grid.airCoreCoils.subtitle")}
          description={t("home.grid.airCoreCoils.description")}
          buttons={[
            { text: t("buttons.learnMore"), variant: "default", href: productsLink("Hava Nüveli Bobin") },
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
