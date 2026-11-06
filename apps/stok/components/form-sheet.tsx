"use client";

import { createContext, useContext, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@artek/ui/components/sheet";

const CloseSheet = createContext<(() => void) | null>(null);

// null outside a FormSheet.
export const useCloseSheet = () => useContext(CloseSheet);

// Half the screen with a scrolling body. Without a trigger, pass open/onOpenChange.
export function FormSheet({
  trigger,
  open: controlledOpen,
  onOpenChange,
  title,
  description,
  children,
}: {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [ownOpen, setOwnOpen] = useState(false);
  const open = controlledOpen ?? ownOpen;
  const setOpen = onOpenChange ?? setOwnOpen;
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
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

// A form's buttons, pinned to the bottom of the FormSheet body.
export function SheetActions({ children }: { children: React.ReactNode }) {
  return <div className="bg-background sticky bottom-0 -mx-4 -mb-4 mt-auto flex justify-end gap-2 border-t px-4 py-3">{children}</div>;
}
