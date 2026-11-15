import { headers } from "next/headers";
import { connection } from "next/server";
import { NoAccess } from "@/components/no-access";
import { PanelShell } from "@/components/panel";
import { loadActor } from "@/lib/guard";
import { can } from "@/lib/permissions";
import { quoteOptions } from "@/lib/quote";
import { QuoteForm } from "./quote-form";

export const metadata = { title: "Fiyat hesapla | Artek" };

export default async function QuotePage() {
  await connection();
  const requestHeaders = await headers();
  const actor = await loadActor(requestHeaders);
  if (!can(actor, "finance.view")) return <NoAccess />;
  const options = await quoteOptions(requestHeaders);

  return (
    <PanelShell
      title="Fiyat hesapla"
      lede="Müşteriye fiyat vermeden önce: trafonun malzemelerini ve işçiliğini girin, kâr oranıyla oynayın, hangi fiyata ne kazanılacağını görün. Maliyet bugünkü alış fiyatı ve TCMB kuruyla hesaplanır, KDV hariç. Hiçbir şey stoktan düşmez."
    >
      <QuoteForm {...options} canEdit={can(actor, "finance.edit")} />
    </PanelShell>
  );
}
