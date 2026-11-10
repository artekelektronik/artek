"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ToggleGroup, ToggleGroupItem } from "@artek/ui/components/toggle-group";

// TL or USD for the page's amounts, as ?para=usd (read on the server); the other URL filters stay.
export function CurrencyToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("para") === "usd" ? "usd" : "tl";
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={current}
      aria-label="Para birimi"
      onValueChange={(v) => {
        if (!v || v === current) return;
        const next = new URLSearchParams(searchParams);
        if (v === "usd") next.set("para", "usd");
        else next.delete("para");
        router.push(next.size ? `${pathname}?${next}` : pathname, { scroll: false });
      }}
    >
      <ToggleGroupItem value="tl" className="px-3">
        TL
      </ToggleGroupItem>
      <ToggleGroupItem value="usd" className="px-3">
        USD
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
