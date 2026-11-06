"use client";

import { ArrowUpDown, Plus, X } from "lucide-react";
import { Button } from "@artek/ui/components/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@artek/ui/components/dropdown-menu";
import type { Sort } from "@/lib/sorting";

export type SortKind = "text" | "number" | "date";
export type SortField = { id: string; label: string; kind: SortKind };

const directions: Record<SortKind, { asc: string; desc: string }> = {
  text: { asc: "A→Z, 1→9", desc: "Z→A, 9→1" },
  number: { asc: "azdan çoğa", desc: "çoktan aza" },
  date: { asc: "eskiden yeniye", desc: "yeniden eskiye" },
};

// Like Notion's sort: add as many levels as needed, click one to flip it. The first level decides, the next breaks ties.
export function SortBar({ fields, sorts, onChange }: { fields: SortField[]; sorts: Sort[]; onChange: (next: Sort[]) => void }) {
  const unused = fields.filter((f) => !sorts.some((s) => s.id === f.id));
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {sorts.map((sort, index) => {
        const field = fields.find((f) => f.id === sort.id);
        if (!field) return null;
        const text = directions[field.kind][sort.desc ? "desc" : "asc"];
        return (
          <span key={sort.id} className="bg-secondary inline-flex h-9 items-center rounded-md text-xs">
            <button
              type="button"
              className="flex h-full items-center gap-1.5 rounded-l-md pr-1 pl-2.5 hover:underline"
              aria-label={`${field.label} sıralamasını çevir, şu an ${text}`}
              onClick={() => onChange(sorts.map((s) => (s.id === sort.id ? { ...s, desc: !s.desc } : s)))}
            >
              <ArrowUpDown className="size-3" />
              {sorts.length > 1 && <span className="text-muted-foreground tabular-nums">{index + 1}.</span>}
              <span className="font-medium">{field.label}:</span> {text}
            </button>
            <button type="button" className="flex h-full items-center rounded-r-md px-1.5 hover:opacity-60" aria-label={`${field.label} sıralamasını kaldır`} onClick={() => onChange(sorts.filter((s) => s.id !== sort.id))}>
              <X className="size-3" />
            </button>
          </span>
        );
      })}
      {unused.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline">
              {sorts.length ? <Plus /> : <ArrowUpDown />} {sorts.length ? "Sıralama ekle" : "Sırala"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {unused.map((f) => (
              <DropdownMenuItem key={f.id} onSelect={() => onChange([...sorts, { id: f.id, desc: f.kind !== "text" }])}>
                {f.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
