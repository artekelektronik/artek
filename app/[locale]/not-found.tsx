import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
export default async function NotFound() {
  const t = await getTranslations("productDetail");
  return <main className="mx-auto max-w-6xl px-6 py-32"><h1 className="text-3xl font-bold">{t("notFound")}</h1><p className="my-6">{t("notFoundDescription")}</p><Link href="/products" className="underline py-3">{t("backButton")}</Link></main>;
}
