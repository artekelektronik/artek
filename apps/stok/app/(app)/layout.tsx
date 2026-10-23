import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@artek/ui/components/badge";
import { Button } from "@artek/ui/components/button";
import { Separator } from "@artek/ui/components/separator";
import { auth } from "@/lib/auth";
import { signOut } from "./actions";

// Phase 1 screens; each gets an href when its ticket lands.
const screens: { label: string; href?: string }[] = [
  { label: "Stok durumu", href: "/stok-durumu" },
  { label: "Ürünler", href: "/urunler" },
  { label: "Stok hareketleri", href: "/hareketler" },
  { label: "Mal kabul", href: "/mal-kabul" },
  { label: "Stok çıkışı", href: "/stok-cikisi" },
  { label: "Transfer", href: "/transfer" },
  { label: "Sayım", href: "/sayim" },
  { label: "Açılış sayımı", href: "/acilis-sayimi" },
];

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/giris");

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <aside className="bg-muted/40 border-b md:w-64 md:shrink-0 md:border-r md:border-b-0 print:hidden">
        <div className="px-4 py-5">
          <p className="text-lg font-semibold">Artek Stok</p>
        </div>
        <Separator />
        <nav aria-label="Ana menü" className="p-2">
          <ul className="flex flex-col gap-1">
            {screens.map(({ label, href }) => (
              <li key={label}>
                {href ? (
                  <Button variant="ghost" asChild className="w-full justify-start">
                    <Link href={href}>{label}</Link>
                  </Button>
                ) : (
                  <Button variant="ghost" disabled className="w-full justify-between">
                    {label}
                    <Badge variant="outline">Yakında</Badge>
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <Separator />
        <form action={signOut} className="flex items-center justify-between gap-2 p-4">
          <span className="truncate text-sm">{session.user.name}</span>
          <Button type="submit" variant="outline" size="sm">
            Çıkış yap
          </Button>
        </form>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
