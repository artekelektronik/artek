"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@artek/ui/components/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@artek/ui/components/command";
import { Popover, PopoverContent, PopoverTrigger } from "@artek/ui/components/popover";
import { cn } from "@artek/ui/lib/utils";
import { compact } from "@/lib/product-search";

type Option = { value: string; label: string };

// Every typed word must appear in the label, ignoring case and punctuation ("art222" finds "ART-222").
const contains = (value: string, search: string) => (search.split(/\s+/).every((word) => compact(value).includes(compact(word))) ? 1 : 0);

// A searchable picker; with `allowNew` the typed text can be picked as a new value.
export function Combobox({
  options,
  value,
  onChange,
  placeholder,
  allowNew = false,
  className,
  ...props
}: {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  allowNew?: boolean;
} & Omit<React.ComponentProps<typeof Button>, "value" | "onChange">) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = options.find((o) => o.value === value)?.label ?? value;
  const typed = search.trim();
  const canAdd = allowNew && typed !== "" && !options.some((o) => o.label.toLocaleLowerCase("tr") === typed.toLocaleLowerCase("tr"));
  const pick = (next: string) => {
    onChange(next);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          {...props}
          className={cn("justify-between font-normal", className)}
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>{selected || placeholder}</span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-72 p-0" align="start">
        <Command filter={contains}>
          <CommandInput placeholder={placeholder} value={search} onValueChange={setSearch} />
          <CommandList>
            {!canAdd && <CommandEmpty>Sonuç yok.</CommandEmpty>}
            <CommandGroup>
              {options.map((o) => (
                <CommandItem key={o.value} value={o.label} onSelect={() => pick(o.value)}>
                  <Check className={cn(o.value === value ? "opacity-100" : "opacity-0")} />
                  {o.label}
                </CommandItem>
              ))}
            </CommandGroup>
            {canAdd && (
              <CommandGroup forceMount>
                <CommandItem value={typed} onSelect={() => pick(typed)} forceMount>
                  “{typed}” ekle
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
