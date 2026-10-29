"use client";

import { ArchiveControl } from "@/components/archive-control";
import { archiveCustomerAction, restoreCustomerAction } from "./actions";

const dayText = (iso: string) => new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Istanbul" });

// Archived Müşteriler, out of the list above; "Geri al" brings one back.
export function ArchivedCustomers({ rows, canEdit }: { rows: { id: string; name: string; reason: string | null; at: string }[]; canEdit: boolean }) {
  return (
    <details className="text-sm">
      <summary className="text-muted-foreground cursor-pointer">Arşivdeki müşteriler ({rows.length})</summary>
      <ul className="bg-card mt-2 divide-y rounded-xl border">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-2">
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="font-medium">{r.name}</span>
              <span className="text-muted-foreground text-xs">
                {dayText(r.at)}
                {r.reason && ` · ${r.reason}`}
              </span>
            </span>
            {canEdit && <ArchiveControl archived onArchive={(reason) => archiveCustomerAction(r.id, reason)} onRestore={() => restoreCustomerAction(r.id)} />}
          </li>
        ))}
      </ul>
    </details>
  );
}
