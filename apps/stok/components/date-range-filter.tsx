"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarIcon, X } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { tr } from "react-day-picker/locale";
import { Button } from "@artek/ui/components/button";
import { Calendar } from "@artek/ui/components/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@artek/ui/components/popover";
import { fromDay, toDay } from "./date-picker";

const shown = (date: Date) => date.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });

// Sets ?baslangic=&bitis= (read on the server) as soon as both days are picked; the other URL filters stay.
export function DateRangeFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const from = fromDay(searchParams.get("baslangic"));
  const to = fromDay(searchParams.get("bitis"));
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>();

  function go(range: { from: Date; to: Date } | null) {
    const next = new URLSearchParams(searchParams);
    next.delete("page");
    if (range) {
      next.set("baslangic", toDay(range.from));
      next.set("bitis", toDay(range.to));
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
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            locale={tr}
            numberOfMonths={2}
            defaultMonth={from ?? new Date(new Date().getFullYear(), new Date().getMonth() - 1)}
            selected={draft}
            onSelect={(range) => {
              // The first click only starts the range; the second one applies it.
              if (!draft || !range?.from || !range.to) return setDraft(range);
              setOpen(false);
              go({ from: range.from, to: range.to });
            }}
          />
        </PopoverContent>
      </Popover>
      {from && to && (
        <Button variant="ghost" size="icon" aria-label="Tarih aralığını temizle" onClick={() => go(null)}>
          <X />
        </Button>
      )}
    </div>
  );
}
