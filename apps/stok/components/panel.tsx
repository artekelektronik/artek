import Link from "next/link";
import { cn } from "@artek/ui/lib/utils";

// The look of the Müşteri and Finans screens: one header, tiles, bars and cards. The sidebar is the only navigation.

// `actions`: the screen's own buttons, top right, the primary one last.
export function PanelShell({
  title,
  lede,
  warning,
  actions,
  children,
}: {
  title: string;
  lede?: React.ReactNode;
  warning?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-semibold">{title}</h1>
          {lede && <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed [&_b]:text-foreground [&_b]:font-semibold [&_b]:tabular-nums">{lede}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-start gap-2">{actions}</div>}
      </header>
      {warning && (
        <p
          role="status"
          className="max-w-3xl rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100 [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-4"
        >
          {warning}
        </p>
      )}
      {children}
    </div>
  );
}

export function PanelCard({ id, title, note, className, children }: { id?: string; title: string; note?: string; className?: string; children: React.ReactNode }) {
  return (
    <section id={id} className={cn("bg-card flex min-w-0 scroll-mt-6 flex-col gap-3 rounded-xl border p-5", className)}>
      <h2 className="text-base font-medium">{title}</h2>
      {note && <p className="text-muted-foreground -mt-2 text-xs">{note}</p>}
      {children}
    </section>
  );
}

// `large`: the one figure the screen is about; it takes two columns.
export function StatTile({ label, value, note, large }: { label: string; value: string; note: string; large?: boolean }) {
  return (
    <div className={cn("bg-card flex min-w-0 flex-col gap-1 rounded-xl border px-5 py-4", large && "col-span-2 justify-center")}>
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className={cn("leading-tight font-semibold tracking-tight whitespace-nowrap tabular-nums", large ? "text-4xl" : "text-2xl")}>{value}</span>
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

export function Insight({ children, todo, href, action, color }: { children: React.ReactNode; todo: string; href?: string; action?: string; color?: string }) {
  return (
    <li className="flex flex-col gap-0.5 border-l-[3px] pl-3" style={color ? { borderColor: color } : undefined}>
      <span className="text-sm [&_b]:font-semibold [&_b]:tabular-nums">{children}</span>
      <span className="text-muted-foreground text-xs">
        <strong className="text-foreground font-medium">Ne yapmalı:</strong> {todo}
        {href && (
          <>
            {" "}
            <Link href={href} className="text-foreground font-medium whitespace-nowrap underline-offset-4 hover:underline">
              {action} →
            </Link>
          </>
        )}
      </span>
    </li>
  );
}

type Gap = { series: string; from: number; to: number; after: string; before: string };

// The figures themselves are in the tiles; the lede only says what they are computed from.
export function panelLede(s: { firstOn: string; asOf: string }) {
  return (
    <>
      <b>
        {dayText(s.firstOn)} – {dayText(s.asOf)}
      </b>{" "}
      arası satış faturalarından, KDV hariç. Son alım süreleri en son fatura tarihine göre hesaplanır.
    </>
  );
}

export function panelWarning(gaps: Gap[]) {
  const big = gaps.filter((g) => g.to - g.from + 1 >= 5).sort((a, b) => b.to - b.from - (a.to - a.from));
  const missing = big.reduce((n, g) => n + g.to - g.from + 1, 0);
  if (!missing) return undefined;
  return (
    <>
      <b>{missing} fatura eksik</b> (en büyük boşluk {big[0].series} no {big[0].from}–{big[0].to}, {dayText(big[0].after)} – {dayText(big[0].before)}).
      Yüklenince rakamlar güncellenir. <Link href="/faturalar">Eksik faturaları gör</Link>
    </>
  );
}

const dayText = (iso: string) => (iso ? `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}` : "");
