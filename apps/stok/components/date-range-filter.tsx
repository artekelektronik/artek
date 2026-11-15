"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarIcon, X } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { tr } from "react-day-picker/locale";
import { Button } from "@artek/ui/components/button";
import { Calendar } from "@artek/ui/components/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@artek/ui/components/popover";
import { periodPresets } from "@/lib/period";
import { istanbulDate } from "@/lib/time";
import { fromDay, toDay } from "./date-picker";

const shown = (date: Date) => date.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });

// Sets ?baslangic=&bitis= (read on the server) as soon as both days are picked; the other URL filters stay.
// `fallback`: the range the page uses when none is picked, shown instead of "Tarih aralığı".
export function DateRangeFilter({ fallback }: { fallback?: { from: string; to: string } }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const picked = Boolean(searchParams.get("baslangic") && searchParams.get("bitis"));
  const from = fromDay(searchParams.get("baslangic") ?? fallback?.from);
  const to = fromDay(searchParams.get("bitis") ?? fallback?.to);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>();

  function go(range: { from: string; to: string } | null) {
    setOpen(false);
    const next = new URLSearchParams(searchParams);
    next.delete("page");
    if (range) {
      next.set("baslangic", range.from);
      next.set("bitis", range.to);
    } else {
      next.delete("baslangic");
      next.delete("bitis");
    }
    router.push(next.size ? `${pathname}?${next}` : pathname, { scroll: false });
  }

  return (
    <div className="flex items-center gap-1">
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          setDraft(undefined);
        }}
      >
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-start font-normal">
            <CalendarIcon />
            {from && to ? `${shown(from)} – ${shown(to)}` : <span className="text-muted-foreground">Tarih aralığı</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="flex w-auto flex-col p-0 sm:flex-row" align="start">
          <div className="flex flex-wrap gap-1 border-b p-2 sm:flex-col sm:border-r sm:border-b-0">
            {periodPresets(istanbulDate(new Date())).map((p) => (
              <Button key={p.label} variant="ghost" size="sm" className="justify-start" onClick={() => go(p)}>
                {p.label}
              </Button>
            ))}
          </div>
          <Calendar
            mode="range"
            locale={tr}
            numberOfMonths={2}
            defaultMonth={from ?? new Date(new Date().getFullYear(), new Date().getMonth() - 1)}
            selected={draft}
            onSelect={(range) => {
              // The first click only starts the range; the second one applies it.
              if (!draft || !range?.from || !range.to) return setDraft(range);
              go({ from: toDay(range.from), to: toDay(range.to) });
            }}
          />
        </PopoverContent>
      </Popover>
      {picked && (
        <Button variant="ghost" size="icon" aria-label="Tarih aralığını temizle" onClick={() => go(null)}>
          <X />
        </Button>
      )}
    </div>
  );
}
