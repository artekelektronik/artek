"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
export default function ErrorPage({reset}:{error:Error; reset:()=>void}) {
  const t = useTranslations("products");
  return <main role="alert" className="mx-auto max-w-6xl px-6 py-32"><h1 className="text-3xl font-bold">{t("error")}</h1><p className="my-6">{t("errorOccurred")}</p><div className="flex gap-6"><button onClick={reset} className="underline py-3">{t("retry")}</button><Link href="/contact" className="underline py-3">{t("contact")}</Link></div></main>;
}
