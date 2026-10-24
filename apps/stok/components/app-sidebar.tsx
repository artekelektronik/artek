"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  Bell,
  Boxes,
  ClipboardCheck,
  ClipboardList,
  Package,
  PackageMinus,
  PackagePlus,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@artek/ui/components/sidebar";
import { NavUser } from "./nav-user";

// Screens by group, adapted from shadcn's sidebar-07 block. Screens that `requires` a permission show only when
// the layout says the user may use them; the server still checks every action.
export const screens: { group: string; label: string; href: string; icon: LucideIcon; requires?: "notifications" | "users" }[] = [
  { group: "Stok", label: "Stok durumu", href: "/stok-durumu", icon: Boxes },
  { group: "Stok", label: "Stok hareketleri", href: "/hareketler", icon: ArrowLeftRight },
  { group: "İşlemler", label: "Mal kabul", href: "/mal-kabul", icon: PackagePlus },
  { group: "İşlemler", label: "Stok çıkışı", href: "/stok-cikisi", icon: PackageMinus },
  { group: "İşlemler", label: "Transfer", href: "/transfer", icon: Truck },
  { group: "İşlemler", label: "Sayım", href: "/sayim", icon: ClipboardList },
  { group: "İşlemler", label: "Açılış sayımı", href: "/acilis-sayimi", icon: ClipboardCheck },
  { group: "Katalog", label: "Ürünler", href: "/urunler", icon: Package },
  { group: "Yönetim", label: "Bildirimler", href: "/bildirimler", icon: Bell, requires: "notifications" },
  { group: "Yönetim", label: "Kullanıcılar", href: "/kullanicilar", icon: Users, requires: "users" },
];

export function AppSidebar({
  user,
  allowed,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: { name: string; email: string };
  allowed: { notifications: boolean; users: boolean };
}) {
  const pathname = usePathname();
  const visible = screens.filter((s) => !s.requires || allowed[s.requires]);
  const groups = [...new Set(visible.map((s) => s.group))];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Boxes className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Artek Stok</span>
                  <span className="truncate text-xs">Stok takibi</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group}>
            <SidebarGroupLabel>{group}</SidebarGroupLabel>
            <SidebarMenu>
              {visible
                .filter((s) => s.group === group)
                .map((s) => (
                  <SidebarMenuItem key={s.href}>
                    <SidebarMenuButton asChild tooltip={s.label} isActive={pathname === s.href || pathname.startsWith(`${s.href}/`)}>
                      <Link href={s.href}>
                        <s.icon />
                        <span>{s.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

// The current screen's name for the header.
export function useScreenTitle() {
  const pathname = usePathname();
  return screens.find((s) => pathname === s.href || pathname.startsWith(`${s.href}/`))?.label ?? "Ana sayfa";
}
