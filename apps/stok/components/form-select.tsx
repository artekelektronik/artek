"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@artek/ui/components/select";
import { cn } from "@artek/ui/lib/utils";

// Radix Select can't hold "", so the `empty` option uses a stand-in and the hidden input submits "".
const none = "__none";

export function FormSelect({
  name,
  options,
  defaultValue,
  empty,
  className,
  onValueChange,
  ...props
}: {
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
  empty?: string;
  className?: string;
  onValueChange?: (value: string) => void;
  "aria-label"?: string;
}) {
  const [value, setValue] = useState(defaultValue || (empty ? none : (options[0]?.value ?? "")));
  return (
    <>
      <Select
        value={value}
        onValueChange={(v) => {
          setValue(v);
          onValueChange?.(v === none ? "" : v);
        }}
      >
        <SelectTrigger className={cn("font-normal", className)} aria-label={props["aria-label"]}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {empty && <SelectItem value={none}>{empty}</SelectItem>}
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <input type="hidden" name={name} value={value === none ? "" : value} />
    </>
  );
}
