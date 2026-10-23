import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Badge } from "@artek/ui/components/badge";
import { Button } from "@artek/ui/components/button";
import { Separator } from "@artek/ui/components/separator";
import { auth } from "@/lib/auth";
import { signOut } from "./actions";

// Phase 1 screens; each becomes a link when its ticket lands.
const screens = [
  "Stok durumu",
  "Ürünler",
  "Stok hareketleri",
  "Mal kabul",
  "Stok çıkışı",
  "Transfer",
  "Sayım",
  "Açılış sayımı",
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
      <aside className="bg-muted/40 border-b md:w-64 md:shrink-0 md:border-r md:border-b-0">
        <div className="px-4 py-5">
          <p className="text-lg font-semibold">Artek Stok</p>
        </div>
        <Separator />
        <nav aria-label="Ana menü" className="p-2">
          <ul className="flex flex-col gap-1">
            {screens.map((screen) => (
              <li key={screen}>
                <Button variant="ghost" disabled className="w-full justify-between">
                  {screen}
                  <Badge variant="outline">Yakında</Badge>
                </Button>
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
