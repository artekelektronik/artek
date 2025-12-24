import { setRequestLocale } from "next-intl/server";
import { Contact20 } from "@/components/contact";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <Contact20 />;
}
