import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { blogPosts, getBlogPost, blogStructuredData } from "@/lib/blog";
import { getSiteUrl } from "@/lib/seo";
import styles from "../prose.module.css";

type Props = {params: Promise<{locale: string; slug: string}>};
export function generateStaticParams() {
  return blogPosts.map(post => ({locale: "tr", slug: post.slug}));
}
export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale, slug} = await params;
  const post = getBlogPost(slug);
  if (locale !== "tr" || !post) return {title: "Yazı bulunamadı", robots: {index: false, follow: true}};
  const site = await getSiteUrl();
  const url = `${site}/blog/${post.slug}`;
  const title = `${post.title} | Artek Elektronik`;
  return {title, description: post.description, alternates: {canonical: url, languages: {tr: url}},
    openGraph: {title, description: post.description, url, type: "article", locale: "tr_TR", publishedTime: post.publishedAt, modifiedTime: post.modifiedAt, images: [{url: site + post.image, alt: post.alt}]},
    twitter: {card: "summary_large_image", title, description: post.description, images: [site + post.image]}};
}
export default async function BlogPostPage({params}: Props) {
  const {locale, slug} = await params;
  const post = getBlogPost(slug);
  if (locale !== "tr" || !post) notFound();
  setRequestLocale(locale);
  const site = await getSiteUrl();
  const published = new Date(post.publishedAt).toLocaleDateString("tr-TR", {day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Istanbul"});
  return <main className="mx-auto max-w-6xl px-6 pb-24 pt-24">
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(blogStructuredData(post, site)).replace(/</g, "\\u003c")}} />
    <nav aria-label="İçerik yolu" className="mb-9 flex flex-wrap gap-2 text-sm text-slate-600"><Link href="/">Ana sayfa</Link><span aria-hidden>/</span><Link href="/blog">Blog</Link></nav>
    <header className="grid items-center gap-8 border-b border-slate-200 pb-10 lg:grid-cols-[1.4fr_0.8fr]">
      <div><p className="text-xs font-bold uppercase tracking-wider text-artek-violet">{post.category}</p><h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">{post.title}</h1><p className="mt-6 text-base leading-8 text-slate-600">{post.lead}</p><p className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600"><Link href="/about" className="underline">Artek Elektronik</Link><time dateTime={post.publishedAt}>{published}</time><span>{post.minutes} dk okuma</span></p></div>
      <figure><div className="relative aspect-[4/3]"><Image src={post.image} alt={post.alt} fill sizes="(max-width: 1024px) 100vw, 35vw" priority className="object-contain p-4" /></div><figcaption className="mt-3 text-center text-xs leading-5 text-slate-500">Görsel ürün grubunu temsil eder; belirli model önerisi değildir.</figcaption></figure>
    </header>
    <div className="mt-10 grid gap-10 lg:grid-cols-[230px_minmax(0,1fr)]">
      <aside className="self-start rounded-xl bg-slate-100 p-5 lg:sticky lg:top-24"><h2 className="mb-4 text-xs font-bold uppercase tracking-wider">Bu yazıda</h2><nav aria-label="Yazı içindekiler"><ol className="space-y-3 text-sm leading-6 text-slate-600">{post.headings.map(heading => <li key={heading.id}><a href={`#${heading.id}`} className="hover:text-artek-violet">{heading.title}</a></li>)}</ol></nav></aside>
      <div className="min-w-0"><article className={styles.prose} dangerouslySetInnerHTML={{__html: post.html}} />
        <section className="mt-12 border-t border-slate-200 pt-9" aria-labelledby="related-posts"><h2 id="related-posts" className="text-2xl font-semibold">İlgili teknik rehberler</h2><ul className="mt-5 space-y-4">{blogPosts.filter(other => other.slug !== post.slug).map(other => <li key={other.slug}><Link href={`/blog/${other.slug}`} className="inline-block py-2 font-medium underline underline-offset-4">{other.title} →</Link></li>)}</ul></section>
      </div>
    </div>
  </main>;
}
