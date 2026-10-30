"use client";

import { Separator } from "@artek/ui/components/separator";
import { SidebarTrigger } from "@artek/ui/components/sidebar";
import { useScreenTitle } from "./app-sidebar";

export function AppHeader() {
  const title = useScreenTitle();
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 print:hidden">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
      <span className="text-sm font-medium">{title}</span>
    </header>
  );
}
