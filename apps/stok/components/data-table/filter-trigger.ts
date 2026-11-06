export function filterTriggerClass(active: boolean) {
  return active
    ? "border-primary/40 bg-primary/10 text-foreground hover:bg-primary/15 dark:border-primary/50 dark:bg-primary/15"
    : "text-muted-foreground border-dashed";
}
