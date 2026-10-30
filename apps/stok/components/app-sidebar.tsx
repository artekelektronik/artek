"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  Bell,
  Boxes,
  CalendarCheck,
  ClipboardCheck,
  ClipboardList,
  Contact,
  FileText,
  History,
  LineChart,
  LayoutDashboard,
  Package,
  PackageMinus,
  PackagePlus,
  Sparkles,
  ShoppingBag,
  Truck,
  UserPlus,
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

// shadcn sidebar-07; `requires` only hides links, the server checks every action.
type Need = "notifications" | "users" | "finance" | "crm";
const screens: { group: string; label: string; href: string; icon: LucideIcon; requires?: Need }[] = [
  { group: "Genel", label: "Ana sayfa", href: "/", icon: LayoutDashboard },
  { group: "Stok", label: "Stok durumu", href: "/stok-durumu", icon: Boxes },
  { group: "Stok", label: "Stok hareketleri", href: "/hareketler", icon: ArrowLeftRight },
  { group: "İşlemler", label: "Mal kabul", href: "/mal-kabul", icon: PackagePlus },
  { group: "İşlemler", label: "Stok çıkışı", href: "/stok-cikisi", icon: PackageMinus },
  { group: "İşlemler", label: "Transfer", href: "/transfer", icon: Truck },
  { group: "İşlemler", label: "Sayım", href: "/sayim", icon: ClipboardList },
  { group: "İşlemler", label: "Açılış sayımı", href: "/acilis-sayimi", icon: ClipboardCheck },
  { group: "Katalog", label: "Ürünler", href: "/urunler", icon: Package },
  { group: "Satış", label: "Bugün", href: "/bugun", icon: Sparkles, requires: "crm" },
  { group: "Satış", label: "Takipler", href: "/musteriler/bugun", icon: CalendarCheck, requires: "crm" },
  { group: "Satış", label: "Müşteriler", href: "/musteriler", icon: Contact, requires: "crm" },
  { group: "Satış", label: "Adaylar", href: "/musteriler/adaylar", icon: UserPlus, requires: "crm" },
  { group: "Finans", label: "Finansal özet", href: "/finans", icon: LineChart, requires: "finance" },
  { group: "Finans", label: "Ürün satışları", href: "/finans/urunler", icon: ShoppingBag, requires: "finance" },
  { group: "Finans", label: "Faturalar", href: "/faturalar", icon: FileText, requires: "finance" },
  { group: "Yönetim", label: "İşlem geçmişi", href: "/musteriler/gecmis", icon: History, requires: "crm" },
  { group: "Yönetim", label: "Bildirimler", href: "/bildirimler", icon: Bell, requires: "notifications" },
  { group: "Yönetim", label: "Kullanıcılar", href: "/kullanicilar", icon: Users, requires: "users" },
];

// Each group's icons in its own colour, as in Apple's sidebars, so a section is found by colour before it is read.
const groupColors: Record<string, string> = {
  Genel: "text-slate-500",
  Stok: "text-blue-600 dark:text-blue-400",
  İşlemler: "text-orange-600 dark:text-orange-400",
  Katalog: "text-violet-600 dark:text-violet-400",
  Satış: "text-green-600 dark:text-green-400",
  Finans: "text-teal-600 dark:text-teal-400",
  Yönetim: "text-slate-500",
};

export function AppSidebar({
  user,
  allowed,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: { name: string; email: string };
  allowed: Record<Need, boolean>;
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
                  <span className="truncate font-medium">Artek</span>
                  <span className="truncate text-xs">Stok, satış ve finans</span>
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
                    <SidebarMenuButton asChild tooltip={s.label} isActive={s === current(pathname)}>
                      <Link href={s.href}>
                        <s.icon className={groupColors[s.group]} />
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

export function useScreenTitle() {
  const pathname = usePathname();
  return current(pathname)?.label ?? "Artek";
}

// The longest matching link wins, so /musteriler/bugun marks Takipler and not Müşteriler.
function current(pathname: string) {
  // Yapılamadı sebepleri is opened from Takipler and belongs to it.
  if (pathname.startsWith("/musteriler/sebepler")) return screens.find((s) => s.href === "/musteriler/bugun");
  return screens
    .filter((s) => (s.href === "/" ? pathname === "/" : pathname === s.href || pathname.startsWith(`${s.href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0];
}
