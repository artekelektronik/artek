"use client";

import { createContext, useContext, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@artek/ui/components/sheet";

const CloseSheet = createContext<(() => void) | null>(null);

// Closes the sheet a form sits in, if it sits in one (StockForm calls it after a save).
export const useCloseSheet = () => useContext(CloseSheet);

// A form opened from a button into a side sheet, so it doesn't push the page content around.
export function FormSheet({
  trigger,
  title,
  description,
  children,
}: {
  trigger: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="px-4 pb-6">
          <CloseSheet.Provider value={() => setOpen(false)}>{children}</CloseSheet.Provider>
        </div>
      </SheetContent>
    </Sheet>
  );
}
