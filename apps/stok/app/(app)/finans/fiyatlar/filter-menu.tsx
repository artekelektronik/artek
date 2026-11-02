"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "@artek/ui/components/button";
import { Checkbox } from "@artek/ui/components/checkbox";
import { Label } from "@artek/ui/components/label";
import { Popover, PopoverContent, PopoverTrigger } from "@artek/ui/components/popover";

type Option = { value: string; label: string };

function Menu({ label, summary, active, children }: { label: string; summary: string; active: boolean; children: React.ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant={active ? "secondary" : "outline"} size="sm" className="font-normal">
          <span className="text-muted-foreground">{label}:</span> <span className="font-medium">{summary}</span> <ChevronDown className="size-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="flex max-h-72 w-56 flex-col gap-0.5 overflow-auto p-1">
        {children}
      </PopoverContent>
    </Popover>
  );
}

// One choice, e.g. Fiyat: Eksik. The first option means no filter.
export function ChoiceFilter({ label, options, value, onChange }: { label: string; options: Option[]; value: string; onChange: (value: string) => void }) {
  return (
    <Menu label={label} summary={options.find((o) => o.value === value)?.label ?? ""} active={value !== options[0].value}>
      {options.map((o) => (
        <Button key={o.value} type="button" variant={o.value === value ? "secondary" : "ghost"} size="sm" className="justify-start font-normal" onClick={() => onChange(o.value)}>
          {o.label}
        </Button>
      ))}
    </Menu>
  );
}

// Several choices, e.g. Kategori: Karkas, Ferrit. None picked means no filter.
export function MultiFilter({ label, options, value, onChange }: { label: string; options: Option[]; value: string[]; onChange: (value: string[]) => void }) {
  const picked = options.filter((o) => value.includes(o.value)).map((o) => o.label);
  return (
    <Menu label={label} summary={picked.length ? (picked.length > 2 ? `${picked.length} seçili` : picked.join(", ")) : "Tümü"} active={picked.length > 0}>
      {options.map((o) => (
        <Label key={o.value} className="hover:bg-accent flex items-center gap-2 rounded-sm px-2 py-1.5 font-normal">
          <Checkbox checked={value.includes(o.value)} onCheckedChange={(on) => onChange(on === true ? [...value, o.value] : value.filter((v) => v !== o.value))} />
          {o.label}
        </Label>
      ))}
    </Menu>
  );
}
