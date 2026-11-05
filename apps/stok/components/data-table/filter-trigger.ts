import { cn } from "@artek/ui/lib/utils";

// One look for every filter button: dashed and quiet until it filters, then filled so it reads as "on".
export function filterTriggerClass(active: boolean) {
  return cn(
    active
      ? "border-primary/40 bg-primary/10 text-foreground hover:bg-primary/15 dark:border-primary/50 dark:bg-primary/15"
      : "text-muted-foreground border-dashed",
  );
}
