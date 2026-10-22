import { setRequestLocale } from "next-intl/server";
import { getMessages } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages({ locale });
  const allMetadata = messages.metadata as Record<
    string,
    { title: string; description: string }
  >;
  const metadata = allMetadata.ferritNuve;
  const siteUrl = await getSiteUrl();
  const localizedPath = getLocalizedPath(locale, "/ferrit-nuve");

  return {
    title: metadata.title,
    description: metadata.description,
    alternates: {
      canonical: `${siteUrl}${localizedPath}`,
      languages: getLanguageAlternates(siteUrl, "/ferrit-nuve"),
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
          alt: "Artek Elektronik - Ferrit Nüve / Ferrite Cores",
        },
      ],
    },
  };
}

export default async function FerritNuvePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "ferritNuve" });

  const types = [
    { name: t("type1Name"), desc: t("type1Desc") },
    { name: t("type2Name"), desc: t("type2Desc") },
    { name: t("type3Name"), desc: t("type3Desc") },
    { name: t("type4Name"), desc: t("type4Desc") },
    { name: t("type5Name"), desc: t("type5Desc") },
    { name: t("type6Name"), desc: t("type6Desc") },
  ];

  const why = [
    { title: t("why1Title"), text: t("why1Text") },
    { title: t("why2Title"), text: t("why2Text") },
    { title: t("why3Title"), text: t("why3Text") },
    { title: t("why4Title"), text: t("why4Text") },
  ];

  const apps = [
    t("app1"),
    t("app2"),
    t("app3"),
    t("app4"),
    t("app5"),
    t("app6"),
  ];

  return (
    <main className="max-w-5xl mx-auto px-6 py-16 space-y-20">
      {/* Hero */}
      <section className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">{t("heroTitle")}</h1>
        <p className="text-xl text-muted-foreground font-medium">
          {t("heroSubtitle")}
        </p>
        <p className="text-base text-muted-foreground max-w-3xl">
          {t("heroDescription")}
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href={productCatalogPaths.ferrit}
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {t("ctaProducts")}
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-5 py-2.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            {t("ctaContact")}
          </Link>
        </div>
      </section>

      {/* What is */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">{t("whatIsTitle")}</h2>
        <p className="text-muted-foreground leading-relaxed">{t("whatIsText")}</p>
      </section>

      {/* Why Artek */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">{t("whyTitle")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {why.map((item) => (
            <div
              key={item.title}
              className="rounded-lg border bg-card p-5 space-y-2"
            >
              <h3 className="font-semibold text-base">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Types */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">{t("typesTitle")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {types.map((type) => (
            <div
              key={type.name}
              className="rounded-lg border bg-muted/50 p-5 space-y-2"
            >
              <h3 className="font-semibold">{type.name}</h3>
              <p className="text-sm text-muted-foreground">{type.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Applications */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">{t("applicationsTitle")}</h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {apps.map((app) => (
            <li key={app} className="flex items-start gap-2 text-muted-foreground text-sm">
              <span className="mt-0.5 text-primary font-bold">&#10003;</span>
              {app}
            </li>
          ))}
        </ul>
      </section>

      {/* CTA */}
      <section className="rounded-xl bg-muted p-8 space-y-4">
        <h2 className="text-2xl font-bold">{t("ctaTitle")}</h2>
        <p className="text-muted-foreground">{t("ctaText")}</p>
        <div className="flex flex-wrap gap-3">
          <Link
            href={productCatalogPaths.ferrit}
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {t("ctaProducts")}
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-5 py-2.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            {t("ctaContact")}
          </Link>
        </div>
      </section>
    </main>
  );
}
