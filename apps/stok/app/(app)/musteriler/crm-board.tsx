"use client";

import { useMemo, useState } from "react";
import { Input } from "@artek/ui/components/input";
import { cn } from "@artek/ui/lib/utils";
import { PriorityBadge } from "@/components/priority-badge";
import {
  customerStatusLabels,
  day,
  followUpChannelLabels,
  priorities,
  tl,
  tlShort,
  type CustomerStatus,
  type FollowUpChannel,
  type Priority,
} from "@/lib/finance-calc";
import { CustomerSheet } from "./customer-sheet";

export type CrmRow = {
  id: string;
  name: string;
  short: string;
  city: string;
  district: string;
  isPerson: boolean;
  sales: number;
  invoices: number;
  orderDays: number;
  firstOn: string;
  lastOn: string;
  groups: string[];
  topProduct: string;
  no: Priority;
  talk: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  about: string | null;
  contactSource: string | null;
  status: CustomerStatus;
  nextFollowUpOn: string | null;
  followUpChannel: FollowUpChannel;
  emailOptOut: boolean;
};

type Filter = "bugun" | Priority | null;
type SortKey = "no" | "short" | "city" | "sales" | "lastOn" | "nextFollowUpOn";
const closed: CustomerStatus[] = ["siparis_geldi", "ilgilenmiyor"];

export function CrmBoard({ rows, canEdit, today, initialSelected }: { rows: CrmRow[]; canEdit: boolean; today: string; initialSelected?: string }) {
  const due = (r: CrmRow) => Boolean(r.nextFollowUpOn && r.nextFollowUpOn <= today && !closed.includes(r.status));
  const dueCount = rows.filter(due).length;
  const [filter, setFilter] = useState<Filter>(dueCount ? "bugun" : null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "no", dir: 1 });
  const [openId, setOpenId] = useState<string | undefined>(initialSelected);

  const visible = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase("tr");
    return rows
      .filter((r) => (filter === "bugun" ? due(r) : filter ? r.no === filter : true))
      .filter((r) => !needle || [r.name, r.city, r.district, r.phone, r.email, r.groups.join(" "), r.topProduct].join(" ").toLocaleLowerCase("tr").includes(needle))
      .sort((a, b) => {
        const x = a[sort.key] ?? "";
        const y = b[sort.key] ?? "";
        const c = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "tr");
        return c !== 0 ? c * sort.dir : b.sales - a.sales;
      });
    // due() reads only today, which never changes while the page is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, filter, q, sort]);

  const header = (key: SortKey, label: string, numeric = false) => (
    <th aria-sort={sort.key === key ? (sort.dir === 1 ? "ascending" : "descending") : undefined} className={cn("px-3 py-2 font-medium", numeric && "text-right")}>
      <button
        type="button"
        className="hover:text-foreground"
        onClick={() => setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === "sales" || key === "lastOn" ? -1 : 1 }))}
      >
        {label}
      </button>
    </th>
  );

  const chip = (value: Filter, top: React.ReactNode, count: number, sub: string, hint?: string) => {
    const on = filter === value;
    return (
      <button
        type="button"
        title={hint}
        aria-pressed={on}
        onClick={() => setFilter(on ? null : value)}
        className={cn(
          "bg-card flex flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left",
          on ? "border-foreground ring-foreground ring-1" : "hover:bg-muted/40",
        )}
      >
        {top}
        <span className="font-serif text-3xl leading-none tabular-nums">{count}</span>
        <span className="text-muted-foreground text-xs">{sub}</span>
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {chip(
          "bugun",
          <span className="bg-foreground text-background rounded-full px-2 py-0.5 text-xs font-medium">Bugün</span>,
          dueCount,
          "Takip günü gelenler",
        )}
        {/* What each group means is in the chip's title; the face stays short. */}
        {priorities.map((p) => {
          const group = rows.filter((r) => r.no === p.no);
          return <span key={p.no} className="contents">{chip(p.no, <PriorityBadge no={p.no} />, group.length, `${tlShort(group.reduce((t, r) => t + r.sales, 0))} satış`, p.hint)}</span>;
        })}
      </div>

      <section className="bg-card flex min-w-0 flex-col gap-3 rounded-xl border p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            id="crm-ara"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Firma, il, ürün veya telefon ara"
            aria-label="Müşteri ara"
            className="max-w-sm flex-1"
          />
          <span className="text-muted-foreground text-xs tabular-nums">
            {visible.length} müşteri
            {filter === "bugun" ? " · bugün takip" : filter ? ` · ${priorities[filter - 1].label}` : ""}
          </span>
          {(filter || q) && (
            <button
              type="button"
              className="text-xs underline underline-offset-4"
              onClick={() => {
                setFilter(null);
                setQ("");
              }}
            >
              Hepsini göster
            </button>
          )}
          <span className="text-muted-foreground ml-auto hidden text-xs sm:inline">Kartı açmak için bir müşteriye tıklayın.</span>
        </div>

        {visible.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            {filter === "bugun" ? "Bugün takip edilecek müşteri yok. Kartlardan takip tarihi verebilirsiniz." : "Aramaya uyan müşteri yok."}
          </p>
        ) : (
          <div className="max-h-[38rem] overflow-auto">
            <table className="w-full border-collapse text-sm tabular-nums">
              <thead className="bg-card text-muted-foreground sticky top-0 z-10 text-left text-xs">
                <tr className="border-b">
                  {header("no", "Öncelik")}
                  {header("short", "Müşteri")}
                  {header("city", "İl")}
                  {header("sales", "Satış", true)}
                  {header("lastOn", "Son alım")}
                  {header("nextFollowUpOn", "Takip")}
                  <th className="px-3 py-2 font-medium">Durum</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setOpenId(r.id)}
                    className={cn("hover:bg-muted/50 cursor-pointer border-b", r.id === openId && "bg-muted/70")}
                  >
                    <td className="px-3 py-2">
                      <PriorityBadge no={r.no} />
                    </td>
                    <td className="px-3 py-2 font-medium">
                      <button type="button" className="text-left hover:underline" onClick={() => setOpenId(r.id)}>
                        {r.short}
                      </button>
                    </td>
                    <td className="text-muted-foreground px-3 py-2 whitespace-nowrap">{r.city}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">{tl(r.sales)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{day(r.lastOn)}</td>
                    <td className={cn("px-3 py-2 whitespace-nowrap", due(r) && "text-destructive font-medium")}>
                      {r.nextFollowUpOn ? `${day(r.nextFollowUpOn)} · ${followUpChannelLabels[r.followUpChannel]}` : ""}
                    </td>
                    <td className="text-muted-foreground px-3 py-2 whitespace-nowrap">{customerStatusLabels[r.status]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <CustomerSheet customer={rows.find((r) => r.id === openId)} canEdit={canEdit} onClose={() => setOpenId(undefined)} />
    </div>
  );
}
