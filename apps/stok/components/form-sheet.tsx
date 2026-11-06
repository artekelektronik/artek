"use client";

import { createContext, useContext, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@artek/ui/components/sheet";

const CloseSheet = createContext<(() => void) | null>(null);

// null outside a FormSheet.
export const useCloseSheet = () => useContext(CloseSheet);

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
      <SheetContent className="w-full gap-0 sm:w-1/2 sm:max-w-none">
        <SheetHeader className="border-b">
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4">
          <CloseSheet.Provider value={() => setOpen(false)}>{children}</CloseSheet.Provider>
        </div>
      </SheetContent>
    </Sheet>
  );
}
