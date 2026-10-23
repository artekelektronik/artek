"use client";

import { Button } from "@artek/ui/components/button";

export function PrintButton() {
  return (
    <Button type="button" variant="outline" className="print:hidden" onClick={() => window.print()}>
      Yazdır
    </Button>
  );
}
