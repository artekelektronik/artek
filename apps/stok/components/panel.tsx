import Link from "next/link";
import { cn } from "@artek/ui/lib/utils";

// The look of the Müşteri and Finans panels: one header, tabs per permission, tiles, bars and cards.

const tabs = [
  { key: "ozet", label: "Finansal özet", href: "/finans", needs: "finance" },
  { key: "bugun", label: "Bugün", href: "/musteriler/bugun", needs: "crm" },
  { key: "crm", label: "Müşteriler (CRM)", href: "/musteriler", needs: "crm" },
  { key: "adaylar", label: "Adaylar", href: "/musteriler/adaylar", needs: "crm" },
  { key: "gecmis", label: "İşlem geçmişi", href: "/musteriler/gecmis", needs: "crm" },
  { key: "urun", label: "Ürünler", href: "/finans/urunler", needs: "finance" },
  { key: "fatura", label: "Faturalar", href: "/faturalar", needs: "finance" },
] as const;

export function PanelShell({
  active,
  allowed,
  lede,
  warning,
  children,
}: {
  active: (typeof tabs)[number]["key"];
  allowed: { finance: boolean; crm: boolean };
  lede: React.ReactNode;
  warning?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl font-normal tracking-tight text-balance">Artek Müşteri Paneli</h1>
        <p className="max-w-3xl text-sm leading-relaxed [&_b]:font-semibold [&_b]:tabular-nums">{lede}</p>
        {warning && <p className="text-muted-foreground max-w-3xl text-xs [&_strong]:font-medium [&_strong]:text-amber-700 dark:[&_strong]:text-amber-400">{warning}</p>}
      </header>
      <nav aria-label="Bölümler" className="flex flex-wrap gap-1 border-b">
        {tabs
          .filter((t) => allowed[t.needs])
          .map((t) => (
            <Link
              key={t.key}
              href={t.href}
              aria-current={t.key === active ? "page" : undefined}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-sm",
                t.key === active ? "border-foreground text-foreground font-medium" : "text-muted-foreground hover:text-foreground border-transparent",
              )}
            >
              {t.label}
            </Link>
          ))}
      </nav>
      {children}
    </div>
  );
}

export function PanelCard({ title, note, className, children }: { title: string; note?: string; className?: string; children: React.ReactNode }) {
  return (
    <section className={cn("bg-card flex min-w-0 flex-col gap-3 rounded-xl border p-5", className)}>
      <h2 className="text-base font-medium">{title}</h2>
      {note && <p className="text-muted-foreground -mt-2 text-xs">{note}</p>}
      {children}
    </section>
  );
}

export function StatTile({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="bg-card flex min-w-0 flex-col gap-1 rounded-xl border px-5 py-4">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="font-serif text-2xl leading-tight font-normal whitespace-nowrap tabular-nums xl:text-3xl">{value}</span>
      <span className="text-muted-foreground text-xs">{note}</span>
    </div>
  );
}

export const chartColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--chart-1)"];

// Horizontal bars on one scale: label, bar, value. `color` per row; muted by default.
export function HBars({ rows }: { rows: { key: string; label: string; value: number; display: string; color?: string; href?: string }[] }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="flex flex-col gap-1.5">
      {rows.map((r) => {
        const label = r.href ? (
          <Link href={r.href} className="truncate underline-offset-4 hover:underline">
            {r.label}
          </Link>
        ) : (
          <span className="truncate">{r.label}</span>
        );
        return (
          <li key={r.key} className="grid grid-cols-[minmax(0,10rem)_1fr] items-center gap-3 text-xs sm:grid-cols-[minmax(0,13rem)_1fr]">
            <span className="flex justify-end text-right">{label}</span>
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-4 shrink-0 rounded-sm"
                style={{ width: `${Math.max(1, (r.value / max) * 78)}%`, background: r.color ?? "color-mix(in oklab, var(--muted-foreground) 35%, transparent)" }}
              />
              <span className="text-muted-foreground whitespace-nowrap tabular-nums">{r.display}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function Insight({ children, todo }: { children: React.ReactNode; todo: string }) {
  return (
    <li className="flex flex-col gap-0.5 border-l-2 pl-3">
      <span className="text-sm [&_b]:font-semibold [&_b]:tabular-nums">{children}</span>
      <span className="text-muted-foreground text-xs">
        <strong className="text-foreground font-medium">Ne yapmalı:</strong> {todo}
      </span>
    </li>
  );
}

type Gap = { series: string; from: number; to: number; after: string; before: string };

export function panelLede(s: { firstOn: string; asOf: string; total: number; repeatShare: number; repeatCount: number }, showMoney: boolean) {
  const range = `${dayText(s.firstOn)} – ${dayText(s.asOf)}`;
  return showMoney ? (
    <>
      <b>{range}</b> arasında <b>{moneyText(s.total)}</b> satış yapıldı (KDV hariç). Cironun <b>%{Math.round(s.repeatShare * 100)}</b>’i, birden
      fazla kez alan <b>{s.repeatCount}</b> müşteriden geliyor. En büyük fırsat, bir kez alıp geri gelmeyen müşterileri yeniden kazanmak.
    </>
  ) : (
    <>
      <b>{range}</b> arasında fatura kesilen müşteriler. En büyük fırsat, bir kez alıp geri gelmeyen müşterileri yeniden kazanmak.
    </>
  );
}

export function panelWarning(gaps: Gap[], asOf: string) {
  const big = gaps.filter((g) => g.to - g.from + 1 >= 5).sort((a, b) => b.to - b.from - (a.to - a.from));
  const missing = big.reduce((n, g) => n + g.to - g.from + 1, 0);
  return (
    <>
      {missing > 0 && (
        <>
          <strong>Eksik veri:</strong> numara sırasında {missing} fatura yok (en büyüğü {big[0].series} no {big[0].from}–{big[0].to},{" "}
          {dayText(big[0].after)} – {dayText(big[0].before)}). Bu faturalar yüklenince rakamlar güncellenir.{" "}
        </>
      )}
      Son alım süreleri, en son fatura tarihine ({dayText(asOf)}) göre hesaplanır.
    </>
  );
}

const dayText = (iso: string) => (iso ? `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}` : "");
const moneyText = (v: number) => `${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(v)} TL`;
