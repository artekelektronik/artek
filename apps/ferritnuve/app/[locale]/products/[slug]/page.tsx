import { productGuideSlug, getBlogPost } from "@/lib/blog";
import { notFound, permanentRedirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Package } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getProductBySlug } from "@/lib/catalog";
import { productContent } from "@/lib/product-content";
import { catalogLabel } from "@/lib/product-taxonomy";
import { getLocalizedPath, getSiteUrl } from "@/lib/seo";
import { generateProductSlug } from "@/lib/utils";
import { inquiryLinks } from "@/lib/inquiry";
import { ProductShare } from "@/components/product-share";

export default async function ProductPage({params}: {params: Promise<{locale: string; slug: string}>}) {
  const {locale, slug} = await params;
  setRequestLocale(locale);
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const canonicalSlug = generateProductSlug(product.fields["Product Name"], product.id);
  if (slug !== canonicalSlug) permanentRedirect(getLocalizedPath(locale, `/products/${canonicalSlug}`));
  const t = await getTranslations({locale, namespace:"productDetail"});
  const {name, description, reviewRequired} = productContent(product, locale);
  const f = product.fields;
  const guideSlug = productGuideSlug(f.Category, f["Ürün Tipi"]);
  const guide = locale === "tr" && guideSlug ? getBlogPost(guideSlug) : undefined;
  const url = `${await getSiteUrl()}${getLocalizedPath(locale, `/products/${canonicalSlug}`)}`;
  const links = inquiryLinks(name, f["Product Code"], url, locale);
  const details = [
    [t("brand"), f.Manufacturer?.join(", ")],
    [t("category"), f.Category && catalogLabel(f.Category, locale)],
    [t("altCategories"), f["Alt Kategori"]?.map(v => catalogLabel(v,locale)).join(", ")],
    [t("productTypes"), f["Ürün Tipi"]?.map(v => catalogLabel(v,locale)).join(", ")],
  ].filter(([,value]) => value);
  return <main className="mx-auto max-w-6xl px-6 pb-20 pt-24">
    <Link href="/products" className="inline-flex py-3 mb-6 underline">{t("backButton")}</Link>
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
      <div className="aspect-square bg-muted rounded-lg overflow-hidden relative">
        {f.Photo?.[0] ? <img src={f.Photo[0].url} alt={name} width={640} height={640} className="w-full h-full object-contain" /> : <div className="flex h-full items-center justify-center"><Package className="size-24 text-muted-foreground" aria-hidden /></div>}
      </div>
      <div className="space-y-6 min-w-0">
        <h1 className="text-3xl lg:text-4xl font-bold break-words">{name}</h1>
        {f["Product Code"] && <p>{t("code")} <strong>{f["Product Code"]}</strong></p>}
        <dl className="divide-y rounded-lg border px-4">{details.map(([label,value]) => <div key={label} className="grid sm:grid-cols-[1fr_2fr] gap-2 py-3"><dt className="text-muted-foreground">{label}</dt><dd className="break-words">{value}</dd></div>)}</dl>
        <Link href={{pathname:"/contact", query:{product:product.id}}} className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary text-primary-foreground px-5 py-3 font-semibold">{t("enquire")}</Link>
        <div className="flex flex-wrap gap-4"><a href={links.whatsapp} target="_blank" rel="noopener noreferrer" className="underline py-2">{t("chatNow")}</a><a href={links.email} className="underline py-2">{t("email")}</a></div>
        {description && <section><h2 className="font-semibold mb-3">{t("description")}</h2><ul className="space-y-2 text-muted-foreground">{description.split(/\n+/).filter(Boolean).map((line,i) => <li key={i} className="break-words">{line}</li>)}</ul></section>}
        {reviewRequired && <p className="text-sm text-muted-foreground">{t("reviewNote")}</p>}
        {guide && <section className="rounded-lg border border-slate-200 bg-white p-5"><h2 className="mb-2 font-semibold">Seçim rehberi</h2><Link href={`/blog/${guide.slug}`} className="inline-block py-2 leading-7 underline underline-offset-4">{guide.title} →</Link></section>}
        <ProductShare name={name} />
      </div>
    </div>
  </main>;
}
