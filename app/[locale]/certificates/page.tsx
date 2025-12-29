import { setRequestLocale } from "next-intl/server";
import { Certificates } from "@/components/certificates";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <Certificates />;
}
