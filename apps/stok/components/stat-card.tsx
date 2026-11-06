import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@artek/ui/lib/utils";

export function StatCard({ label, value, note, href, icon: Icon }: { label: string; value: string; note: string; href?: string; icon: LucideIcon }) {
  const body = (
    <>
      <div className="flex min-w-0 flex-1 flex-col gap-1 p-4">
        <span className="text-muted-foreground text-sm">{label}</span>
        <span className="truncate text-3xl font-semibold tracking-tight tabular-nums">
          {value}
        </span>
        <span className="text-muted-foreground truncate text-xs">{note}</span>
      </div>
      <div className="flex items-center border-l px-4">
        <span className="bg-background flex size-12 items-center justify-center rounded-lg border shadow-xs">
          <Icon className="size-5" />
        </span>
      </div>
    </>
  );
  const frame = "bg-card flex overflow-hidden rounded-xl border";
  return href ? (
    <Link href={href} className={cn(frame, "hover:bg-muted/40 transition-colors")}>
      {body}
    </Link>
  ) : (
    <div className={frame}>{body}</div>
  );
}
