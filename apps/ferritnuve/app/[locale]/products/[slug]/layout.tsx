import type { Metadata } from "next";
import { getProductBySlug } from "@/lib/local-products";
import { productContent } from "@/lib/product-content";
import { generateProductSlug } from "@/lib/utils";
import { getLanguageAlternates, getLocalizedPath, getSiteUrl } from "@/lib/seo";
export async function generateMetadata({params}: {params:Promise<{locale:string; slug:string}>}):Promise<Metadata> {
  const {locale,slug} = await params;
  const product = getProductBySlug(slug);
  if (!product) return {title:locale === "en" ? "Product not found" : "Ürün bulunamadı", robots:{index:false,follow:true}};
  const {name,description} = productContent(product,locale);
  const path = `/products/${generateProductSlug(product.fields["Product Name"],product.id)}`;
  const site = await getSiteUrl();
  return {title:`${name} | Artek Elektronik`,description:description?.slice(0,160) ?? name,
    alternates:{canonical:site+getLocalizedPath(locale,path),languages:getLanguageAlternates(site,path)},
    openGraph:{title:name,description:description?.slice(0,160) ?? name,url:site+getLocalizedPath(locale,path),images:product.fields.Photo?.map(p=>({url:p.url,alt:name})) ?? []}};
}
export default function Layout({children}:{children:React.ReactNode}) {return children;}
