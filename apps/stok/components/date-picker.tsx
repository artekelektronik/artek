"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { tr } from "react-day-picker/locale";
import { Button } from "@artek/ui/components/button";
import { Calendar } from "@artek/ui/components/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@artek/ui/components/popover";

const toDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const fromDay = (day: string | undefined) => (day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? new Date(`${day}T00:00:00`) : undefined);

// Submits the picked day as yyyy-mm-dd under `name`, like <input type="date">; `onChange` gets the same day ("" when cleared).
export function DatePicker({ name, defaultValue, id, onChange }: { name: string; defaultValue?: string; id?: string; onChange?: (day: string) => void }) {
  const [date, setDate] = useState(() => fromDay(defaultValue));
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button id={id} type="button" variant="outline" className="w-40 justify-start font-normal">
          <CalendarIcon />
          {date ? date.toLocaleDateString("tr-TR") : <span className="text-muted-foreground">Tarih seçin</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={tr}
          selected={date}
          defaultMonth={date}
          onSelect={(picked) => {
            setDate(picked);
            setOpen(false);
            onChange?.(picked ? toDay(picked) : "");
          }}
        />
      </PopoverContent>
      <input type="hidden" name={name} value={date ? toDay(date) : ""} />
    </Popover>
  );
}
