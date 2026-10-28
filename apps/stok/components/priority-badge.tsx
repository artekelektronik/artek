import { priorities, type Priority } from "@/lib/finance-calc";

const tone = {
  1: "bg-destructive/10 text-destructive",
  2: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  3: "bg-green-600/15 text-green-700 dark:text-green-400",
  4: "bg-muted text-foreground",
  5: "bg-muted text-muted-foreground",
} as const;

export function PriorityBadge({ no }: { no: Priority }) {
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${tone[no]}`}>{priorities[no - 1].label}</span>;
}
