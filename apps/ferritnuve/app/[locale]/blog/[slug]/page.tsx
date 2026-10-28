import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getBlogPosts, getBlogPost, blogStructuredData, relatedProducts } from "@/lib/blog";
import { getProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
import { getSiteUrl } from "@/lib/seo";
import styles from "../prose.module.css";

type Props = {params: Promise<{locale: string; slug: string}>};
export function generateStaticParams() {
  return ["tr", "en"].flatMap(locale => getBlogPosts(locale).map(post => ({locale, slug: post.slug})));
}
export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale, slug} = await params;
  const post = getBlogPost(slug, locale);
  if (!post) return {title: "Yazı bulunamadı", robots: {index: false, follow: true}};
  const site = await getSiteUrl();
  const prefix = locale === "en" ? "/en" : "";
  const url = `${site}${prefix}/blog/${post.slug}`;
  const title = `${post.title} | Artek Elektronik`;
  return {title, description: post.description, alternates: {canonical: url, languages: {tr: `${site}/blog/${post.translations.tr}`, en: `${site}/en/blog/${post.translations.en}`, "x-default": `${site}/blog/${post.translations.tr}`}},
    openGraph: {title, description: post.description, url, type: "article", locale: locale === "en" ? "en_US" : "tr_TR", publishedTime: post.publishedAt, modifiedTime: post.modifiedAt, images: [{url: site + post.image, alt: post.alt}]},
    twitter: {card: "summary_large_image", title, description: post.description, images: [site + post.image]}};
}
export default async function BlogPostPage({params}: Props) {
  const {locale, slug} = await params;
  const post = getBlogPost(slug, locale);
  if (!post) notFound();
  setRequestLocale(locale);
  const site = await getSiteUrl();
  const tr = locale === "tr";
  const blogPosts = getBlogPosts(locale);
  const related = relatedProducts(await getProducts(), post.translations.tr);
  const published = new Date(post.publishedAt).toLocaleDateString(tr ? "tr-TR" : "en-GB", {day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Istanbul"});
  return <main className="mx-auto max-w-6xl px-6 pb-24 pt-24">
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(blogStructuredData(post, site)).replace(/</g, "\\u003c")}} />
    <nav aria-label={tr ? "İçerik yolu" : "Breadcrumb"} className="mb-9 flex flex-wrap gap-2 text-sm text-slate-600"><Link href="/">{tr ? "Ana sayfa" : "Home"}</Link><span aria-hidden>/</span><Link href="/blog">Blog</Link></nav>
    <header className="grid items-center gap-8 border-b border-slate-200 pb-10 lg:grid-cols-[1.4fr_0.8fr]">
      <div><p className="text-xs font-bold uppercase tracking-wider text-artek-violet">{post.category}</p><h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">{post.title}</h1><p className="mt-6 text-base leading-8 text-slate-600">{post.lead}</p><p className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600"><Link href="/about" className="underline">Artek Elektronik</Link><time dateTime={post.publishedAt}>{published}</time><span>{post.minutes} {tr ? "dk okuma" : "min read"}</span></p></div>
      <figure><div className="relative aspect-[4/3]"><Image src={post.image} alt={post.alt} fill sizes="(max-width: 1024px) 100vw, 35vw" priority className="object-contain p-4" /></div><figcaption className="mt-3 text-center text-xs leading-5 text-slate-500">{tr ? "Görsel ürün grubunu temsil eder; belirli model önerisi değildir." : "Image represents the product group; it is not a specific model recommendation."}</figcaption></figure>
    </header>
    <div className="mt-10 grid gap-10 lg:grid-cols-[230px_minmax(0,1fr)]">
      <aside className="self-start rounded-xl bg-slate-100 p-5 lg:sticky lg:top-24"><h2 className="mb-4 text-xs font-bold uppercase tracking-wider">{tr ? "Bu yazıda" : "In this guide"}</h2><nav aria-label={tr ? "Yazı içindekiler" : "Table of contents"}><ol className="space-y-3 text-sm leading-6 text-slate-600">{post.headings.map(heading => <li key={heading.id}><a href={`#${heading.id}`} className="hover:text-artek-violet">{heading.title}</a></li>)}</ol></nav></aside>
      <div className="min-w-0"><article className={styles.prose} dangerouslySetInnerHTML={{__html: post.html}} />
        {related.products.length > 0 && <section className="mt-12 border-t border-slate-200 pt-9" aria-labelledby="related-products"><h2 id="related-products" className="text-2xl font-semibold">{tr ? "İlgili ürünler" : "Related products"}</h2><div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">{related.products.map(product => <ProductCard key={product.id} product={product} />)}</div><Link href={related.catalogHref} className="mt-5 inline-block py-2 font-medium underline underline-offset-4">{tr ? "Tüm ilgili ürünleri katalogda görün" : "See all related products in the catalog"} →</Link></section>}
        <section className="mt-12 border-t border-slate-200 pt-9" aria-labelledby="related-posts"><h2 id="related-posts" className="text-2xl font-semibold">{tr ? "İlgili teknik rehberler" : "Related technical guides"}</h2><ul className="mt-5 space-y-4">{blogPosts.filter(other => other.slug !== post.slug).map(other => <li key={other.slug}><Link href={`/blog/${other.slug}`} className="inline-block py-2 font-medium underline underline-offset-4">{other.title} →</Link></li>)}</ul></section>
      </div>
    </div>
  </main>;
}
