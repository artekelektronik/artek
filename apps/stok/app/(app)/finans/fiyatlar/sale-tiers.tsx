import { cn } from "@artek/ui/lib/utils";

// Satış fiyatı per müşteri sınıfı. markup is only a starting suggestion over the alış fiyatı, never saved by itself.
export const tiers = [
  {
    key: "A",
    field: "satisA",
    name: "Toptan",
    hint: "Çok ve düzenli alan firmalar. En düşük fiyat.",
    markup: 0.3,
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200",
  },
  {
    key: "B",
    field: "satis",
    name: "Normal",
    hint: "Standart müşteri. Ana sayfadaki stok değeri bununla hesaplanır.",
    markup: 0.5,
    badge: "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200",
  },
  {
    key: "C",
    field: "satisC",
    name: "Perakende",
    hint: "Az alan ya da ilk kez alan. En yüksek fiyat.",
    markup: 0.8,
    badge: "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200",
  },
] as const;

export type Tier = (typeof tiers)[number];

export function TierBadge({ tier, className }: { tier: Tier; className?: string }) {
  return (
    <span title={`${tier.key} · ${tier.name}`} className={cn("inline-flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold", tier.badge, className)}>
      {tier.key}
    </span>
  );
}

// "12,5" or "1.250,5" → 1250.5, the way parsePrice reads it; NaN when it isn't a price.
function toNumber(raw: string) {
  const typed = raw.trim();
  const text = typed.includes(",") ? typed.replaceAll(".", "").replace(",", ".") : typed;
  return /^\d+(\.\d+)?$/.test(text) ? Number(text) : NaN;
}

// The suggested sale price as the field would show it, or "" when there is no usable alış fiyatı.
export function suggest(purchase: string, tier: Tier) {
  const value = toNumber(purchase);
  if (!(value > 0)) return "";
  const price = value * (1 + tier.markup);
  return price.toLocaleString("tr-TR", { useGrouping: false, maximumFractionDigits: price < 1 ? 4 : 2 });
}

export function TierLegend() {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {tiers.map((tier) => (
        <div key={tier.key} className="flex items-start gap-2.5 rounded-lg border px-3 py-2">
          <TierBadge tier={tier} className="size-7 text-sm" />
          <div className="flex min-w-0 flex-col text-sm">
            <span className="font-medium">
              {tier.key} · {tier.name}
            </span>
            <span className="text-muted-foreground text-xs">{tier.hint}</span>
            <span className="text-muted-foreground text-xs">Öneri: alış +%{Math.round(tier.markup * 100)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
