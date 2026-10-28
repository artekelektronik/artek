"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Input } from "@artek/ui/components/input";
import { cn } from "@artek/ui/lib/utils";
import { PriorityBadge } from "@/components/priority-badge";
import { customerStatusLabels, day, priorities, tl, tlShort, type CustomerStatus, type Priority } from "@/lib/finance-calc";

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
};

type SortKey = "no" | "short" | "city" | "sales" | "orderDays" | "lastOn";

function CopyButton({ value }: { value: string }) {
  const [label, setLabel] = useState("Kopyala");
  return (
    <button
      type="button"
      className="text-muted-foreground hover:text-foreground ml-2 rounded border px-1.5 text-xs"
      onClick={() => {
        navigator.clipboard.writeText(value).then(
          () => {
            setLabel("Kopyalandı");
            setTimeout(() => setLabel("Kopyala"), 1500);
          },
          () => setLabel("Seçip kopyalayın"),
        );
      }}
    >
      {label}
    </button>
  );
}

function Fact({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5", wide && "sm:col-span-2 lg:col-span-3")}>
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-sm [overflow-wrap:anywhere]">{children || "—"}</span>
    </div>
  );
}

export function CrmBoard({ rows, canEdit, initialSelected }: { rows: CrmRow[]; canEdit: boolean; initialSelected?: string }) {
  const [picked, setPicked] = useState<Priority | null>(null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "no", dir: 1 });
  const [selectedId, setSelectedId] = useState(initialSelected ?? rows.find((r) => r.no === 1)?.id ?? rows[0]?.id);

  const visible = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase("tr");
    return rows
      .filter((r) => !picked || r.no === picked)
      .filter(
        (r) =>
          !needle ||
          [r.name, r.city, r.district, r.phone, r.email, r.groups.join(" "), r.topProduct, r.about].join(" ").toLocaleLowerCase("tr").includes(needle),
      )
      .sort((a, b) => {
        const x = a[sort.key];
        const y = b[sort.key];
        const c = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "tr");
        return c !== 0 ? c * sort.dir : b.sales - a.sales;
      });
  }, [rows, picked, q, sort]);
  const selected = rows.find((r) => r.id === selectedId);

  const header = (key: SortKey, label: string, numeric = false) => (
    <th aria-sort={sort.key === key ? (sort.dir === 1 ? "ascending" : "descending") : undefined} className={cn("px-2 py-1.5 font-medium", numeric && "text-right")}>
      <button
        type="button"
        className="hover:text-foreground"
        onClick={() =>
          setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: ["sales", "orderDays", "lastOn"].includes(key) ? -1 : 1 }))
        }
      >
        {label}
      </button>
    </th>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {priorities.map((p) => {
          const group = rows.filter((r) => r.no === p.no);
          const on = picked === p.no;
          return (
            <button
              key={p.no}
              type="button"
              aria-pressed={on}
              onClick={() => setPicked(on ? null : p.no)}
              className={cn(
                "bg-card flex flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left",
                on ? "border-foreground ring-foreground ring-1" : "hover:bg-muted/40",
              )}
            >
              <PriorityBadge no={p.no} />
              <span className="font-serif text-3xl leading-none tabular-nums">{group.length}</span>
              <span className="text-muted-foreground text-xs">{tlShort(group.reduce((t, r) => t + r.sales, 0))} satış</span>
              <span className="text-muted-foreground text-xs">{p.hint}</span>
            </button>
          );
        })}
      </div>
      <p className="text-muted-foreground text-xs">
        Bir gruba tıklayın, tablo o gruba göre süzülür. Öncelikler son alım tarihine ve sipariş sıklığına göre hesaplanır. Aramadan önce yeni sipariş
        gelip gelmediğine bakın.
      </p>

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
          <button
            type="button"
            className="rounded-md border px-2.5 py-1.5 text-xs"
            onClick={() => {
              setPicked(null);
              setQ("");
            }}
          >
            Filtreyi temizle
          </button>
          <span className="text-muted-foreground text-xs tabular-nums">
            {visible.length} müşteri{picked ? ` · ${priorities[picked - 1].label}` : ""}
          </span>
        </div>
        <div className="max-h-[34rem] overflow-auto">
          <table className="w-full border-collapse text-xs tabular-nums">
            <thead className="bg-card text-muted-foreground sticky top-0 z-10 text-left">
              <tr className="border-b">
                {header("no", "Öncelik")}
                {header("short", "Müşteri")}
                {header("city", "İl")}
                {header("sales", "Satış", true)}
                {header("orderDays", "Sipariş", true)}
                {header("lastOn", "Son alım")}
                <th className="px-2 py-1.5 font-medium">Telefon</th>
                <th className="px-2 py-1.5 font-medium">E-posta</th>
                <th className="px-2 py-1.5 font-medium">Ne konuşulur</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={cn("hover:bg-muted/40 cursor-pointer border-b align-top", r.id === selectedId && "bg-muted/70")}
                >
                  <td className="px-2 py-1.5">
                    <PriorityBadge no={r.no} />
                  </td>
                  <td className="min-w-44 px-2 py-1.5 font-medium">
                    <button type="button" className="text-left" onClick={() => setSelectedId(r.id)}>
                      {r.short}
                    </button>
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap">{r.city}</td>
                  <td className="px-2 py-1.5 text-right whitespace-nowrap">{tl(r.sales)}</td>
                  <td className="px-2 py-1.5 text-right">{r.orderDays}</td>
                  <td className="px-2 py-1.5 whitespace-nowrap">{day(r.lastOn)}</td>
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    {r.phone ?? <span className="text-muted-foreground">{r.isPerson ? "Şahıs: kendi kaydınız" : ""}</span>}
                  </td>
                  <td className="px-2 py-1.5">{r.email}</td>
                  <td className="text-muted-foreground max-w-[26rem] min-w-64 px-2 py-1.5">{r.talk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-card flex flex-col gap-3 rounded-xl border p-5" aria-live="polite">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-medium">Seçili müşteri</h2>
          {selected && (
            <Link href={`/musteriler/${selected.id}`} className="rounded-md border px-2.5 py-1 text-xs hover:bg-muted/40">
              {canEdit ? "Kartı aç: not, durum ve takip" : "Kartı aç"}
            </Link>
          )}
        </div>
        {!selected ? (
          <p className="text-muted-foreground text-xs">Tablodan bir satıra tıklayın.</p>
        ) : (
          <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            <Fact label="Firma" wide>
              {selected.name}
            </Fact>
            <Fact label="Öncelik">
              <PriorityBadge no={selected.no} />
            </Fact>
            <Fact label="Durum">
              {customerStatusLabels[selected.status]}
              {selected.nextFollowUpOn ? ` · takip ${day(selected.nextFollowUpOn)}` : ""}
            </Fact>
            <Fact label="Konum">{[selected.district, selected.city].filter(Boolean).join(" / ")}</Fact>
            <Fact label="Ne konuşulur" wide>
              {selected.talk}
            </Fact>
            <Fact label="Telefon">
              {selected.phone ? (
                <>
                  {selected.phone}
                  <CopyButton value={selected.phone} />
                </>
              ) : selected.isPerson ? (
                "Şahıs firması: kendi kayıtlarınızdan"
              ) : (
                "Bulunamadı"
              )}
            </Fact>
            <Fact label="E-posta">
              {selected.email ? (
                <>
                  {selected.email}
                  <CopyButton value={selected.email} />
                </>
              ) : (
                "Bulunamadı"
              )}
            </Fact>
            <Fact label="Web">
              {selected.website && (
                <a
                  href={/^https?:/.test(selected.website) ? selected.website : `https://${selected.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4"
                >
                  {selected.website}
                </a>
              )}
            </Fact>
            <Fact label="Ne yapıyor">{selected.about}</Fact>
            <Fact label="Satış (KDV hariç)">{tl(selected.sales)}</Fact>
            <Fact label="Fatura · sipariş günü">
              {selected.invoices} fatura · {selected.orderDays} gün
            </Fact>
            <Fact label="İlk ve son alım">
              {day(selected.firstOn)} – {day(selected.lastOn)}
            </Fact>
            <Fact label="Aldığı gruplar">{selected.groups.join(", ")}</Fact>
            <Fact label="En çok aldığı ürün">{selected.topProduct}</Fact>
            <Fact label="İletişim kaynağı" wide>
              {selected.contactSource}
            </Fact>
          </div>
        )}
      </section>
    </div>
  );
}
