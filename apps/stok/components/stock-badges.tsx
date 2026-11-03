import type { MovementType } from "@/lib/ledger";
import { movementTypeLabels } from "@/lib/labels";
import { cn } from "@artek/ui/lib/utils";

const tones = {
  blue: { badge: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200", dot: "bg-blue-500" },
  orange: { badge: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200", dot: "bg-orange-500" },
  green: { badge: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200", dot: "bg-green-500" },
  violet: { badge: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200", dot: "bg-violet-500" },
  rose: { badge: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200", dot: "bg-rose-500" },
  teal: { badge: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200", dot: "bg-teal-500" },
  amber: { badge: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200", dot: "bg-amber-500" },
  slate: { badge: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200", dot: "bg-slate-500" },
} as const;

// Blue and orange belong to Ferrit and Karkas alone, so these two are never confused.
const otherCategories = [tones.green, tones.violet, tones.rose, tones.teal, tones.slate];

function categoryTone(category: string) {
  const name = category.toLocaleLowerCase("tr");
  if (name.startsWith("ferrit")) return tones.blue;
  if (name.startsWith("karkas")) return tones.orange;
  let hash = 0;
  for (const letter of name) hash = (hash * 31 + letter.charCodeAt(0)) >>> 0;
  return otherCategories[hash % otherCategories.length];
}

const typeTones: Record<MovementType, string> = {
  acilis: tones.slate.badge,
  mal_kabul: tones.green.badge,
  transfer_sevk: tones.teal.badge,
  transfer_teslim: tones.teal.badge,
  transfer_kaybi: tones.rose.badge,
  satis_teslimati: tones.green.badge,
  uretim_tuketimi: tones.violet.badge,
  fire: tones.rose.badge,
  sayim_duzeltmesi: tones.amber.badge,
};

const pill = "inline-block rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap";

export function CategoryBadge({ category }: { category: string }) {
  return <span className={cn(pill, categoryTone(category).badge)}>{category}</span>;
}

export function CategoryDot({ category }: { category: string }) {
  return <span aria-hidden className={cn("size-2 shrink-0 rounded-full", categoryTone(category).dot)} />;
}

export function MovementTypeBadge({ type }: { type: MovementType }) {
  return <span className={cn(pill, typeTones[type])}>{movementTypeLabels[type]}</span>;
}
