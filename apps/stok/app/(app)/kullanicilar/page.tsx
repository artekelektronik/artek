import { headers } from "next/headers";
import Link from "next/link";
import { Button } from "@artek/ui/components/button";
import { CapabilityMatrix, GrantLegend } from "@/components/capabilities-view";
import { NoAccess } from "@/components/no-access";
import { capabilitiesOf } from "@/lib/capabilities";
import { loadActor } from "@/lib/guard";
import { roleLabels, userStatus, userStatusLabels } from "@/lib/labels";
import { listLokasyon } from "@/lib/lokasyon";
import { can } from "@/lib/permissions";
import { listUsers } from "@/lib/user-admin";
import { PermissionsSheet } from "./permissions-sheet";

export const metadata = { title: "Kullanıcılar | Artek Stok" };

export default async function UsersPage() {
  const requestHeaders = await headers();
  if (!can(await loadActor(requestHeaders), "users.manage")) return <NoAccess />;
  const [users, lokasyon] = await Promise.all([listUsers(requestHeaders), listLokasyon()]);
  // Active people first, then by name; deactivated ones stay listed so their history is reachable.
  const people = [...users]
    .sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name, "tr"))
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      roleText: u.roles.map((r) => roleLabels[r]).join(", "),
      statusText: userStatusLabels[userStatus(u)],
      active: u.active,
      capabilities: capabilitiesOf(u, lokasyon),
      action: (
        <PermissionsSheet
          user={{ id: u.id, name: u.name, email: u.email, active: u.active, roles: u.roles, lokasyonIds: u.lokasyonIds, panels: u.panels }}
          lokasyon={lokasyon.map((l) => ({ id: l.id, name: l.name }))}
        />
      ),
    }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Kullanıcılar</h1>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Kim neyi görüyor ve neye müdahale edebiliyor. Bir kişinin yetkisini artırmak veya kısıtlamak için satırın sonundaki ⋯ düğmesine
            tıklayın.
          </p>
        </div>
        <Button asChild>
          <Link href="/kullanicilar/yeni">Kullanıcı davet et</Link>
        </Button>
      </div>
      <GrantLegend />
      <CapabilityMatrix people={people} />
      <p className="text-muted-foreground text-xs">Sütun başlığının üzerine gelince o yetkinin ne demek olduğu yazar. Devre dışı kullanıcılar soluk görünür ve hiçbir şey yapamaz.</p>
    </div>
  );
}
