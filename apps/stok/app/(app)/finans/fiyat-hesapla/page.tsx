import { headers } from "next/headers";
import { connection } from "next/server";
import { NoAccess } from "@/components/no-access";
import { PanelShell } from "@/components/panel";
import { loadActor } from "@/lib/guard";
import { can } from "@/lib/permissions";
import { quoteOptions } from "@/lib/quote";
import { QuoteForm } from "./quote-form";

export const metadata = { title: "Fiyat hesapla | Artek" };

export default async function QuotePage({ searchParams }: { searchParams: Promise<{ calisma?: string }> }) {
  await connection();
  const requestHeaders = await headers();
  const actor = await loadActor(requestHeaders);
  if (!can(actor, "finance.view")) return <NoAccess />;
  const [options, { calisma }] = await Promise.all([quoteOptions(requestHeaders), searchParams]);
  const open = options.quotes.find((q) => q.id === calisma) ?? null;

  return (
    <PanelShell
      title="Fiyat hesapla"
      lede="Her iş farklıdır: malzemeleri ve süreyi o işe göre girin, kâr oranıyla oynayın, kaydedin. Kayıtlı çalışma sonradan açılıp değiştirilir ya da benzer bir iş için kopyalanır. Maliyet bugünkü alış fiyatı, TCMB kuru ve saat ücretiyle hesaplanır, KDV hariç. Hiçbir şey stoktan düşmez."
    >
      <QuoteForm key={open?.id ?? "yeni"} {...options} open={open} canEdit={can(actor, "finance.edit")} />
    </PanelShell>
  );
}
