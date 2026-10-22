import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import ProductsCatalog from "@/components/products-catalog";
type Props = {params:Promise<{locale:string}>; searchParams:Promise<Record<string,string|string[]|undefined>>};
export async function generateMetadata({searchParams}:Props):Promise<Metadata> {
  const query = await searchParams;
  const filtered = Object.values(query).some(value => value !== undefined && value !== "");
  return {robots:{index:!filtered,follow:true,googleBot:{index:!filtered,follow:true}}};
}
export default async function ProductsPage({params}:Props) {
  const {locale} = await params; setRequestLocale(locale);
  return <ProductsCatalog />;
}
