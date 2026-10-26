import type { Metadata } from "next";
import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getBlogPosts } from "@/lib/blog";
import { getLanguageAlternates, getLocalizedPath, getOgImageUrl, getSiteUrl } from "@/lib/seo";

type Props = {params: Promise<{locale: string}>};
export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale} = await params;
  const site = await getSiteUrl();
  const title = locale === "tr" ? "Teknik Blog | Ferrit Nüve ve EMI Filtre Rehberleri | Artek" : "Technical Blog | Ferrite Core and EMI Filter Guides | Artek";
  const description = locale === "tr" ? "Kablo ferriti, ETD nüve, demir tozu toroid ve EMI filtre seçimi için Artek teknik rehberleri. Uygulamanız için doğru sorularla başlayın." : "Explore Artek's technical guides to cable ferrites, ETD cores, iron-powder toroids and EMI filters.";
  const url = site + getLocalizedPath(locale, "/blog");
  return {title, description, alternates: {canonical: url, languages: getLanguageAlternates(site, "/blog")},
    openGraph: {title, description, url, type: "website", images: [getOgImageUrl(site, locale)]},
    twitter: {card: "summary_large_image", title, description, images: [getOgImageUrl(site, locale)]}};
}
export default async function BlogPage({params}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);
  const tr = locale === "tr";
  const blogPosts = getBlogPosts(locale);
  return <main className="mx-auto max-w-6xl px-6 pb-24 pt-28">
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-artek-violet">{tr ? "ARTEK / TEKNİK BLOG" : "ARTEK / TECHNICAL BLOG"}</p>
    <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-artek-ink sm:text-6xl">{tr ? "Doğru seçime rehber olalım." : "Practical guidance for component selection."}</h1>
    <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">{tr ? "Ferrit nüveler ve EMI filtreler için seçim adımları, teknik kavramlar ve teklif hazırlama rehberleri." : "Selection steps, technical concepts and enquiry guidance for ferrite cores and EMI filters."}</p>
    <div className="mt-12 grid gap-7 md:grid-cols-2">
      {blogPosts.map(post => <article key={post.slug} lang={locale} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <Link href={`/blog/${post.slug}`} locale={locale} className="group block h-full">
          <div className="relative aspect-[16/9] bg-slate-100"><Image src={post.image} alt={post.alt} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-contain p-8 transition group-hover:scale-105" /></div>
          <div className="p-7"><p className="text-xs font-semibold uppercase tracking-wider text-artek-violet">{post.category}</p><h2 className="mt-3 text-2xl font-semibold leading-snug tracking-tight">{post.title}</h2><p className="mt-4 text-sm leading-7 text-slate-600">{post.description}</p><p className="mt-6 flex justify-between border-t border-slate-100 pt-5 text-sm"><span>{post.minutes} {tr ? "dk okuma" : "min read"}</span><span className="font-semibold">{tr ? "Yazıyı oku →" : "Read guide →"}</span></p></div>
        </Link>
      </article>)}
    </div>
  </main>;
}
