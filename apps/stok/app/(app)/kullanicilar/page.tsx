import { headers } from "next/headers";
import Link from "next/link";
import { Button } from "@artek/ui/components/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@artek/ui/components/table";
import { NoAccess } from "@/components/no-access";
import { loadActor } from "@/lib/guard";
import { roleLabels } from "@/lib/labels";
import { listLokasyon } from "@/lib/lokasyon";
import { can } from "@/lib/permissions";
import { listUsers } from "@/lib/user-admin";
import { UserStatus } from "./access-fields";

export const metadata = { title: "Kullanıcılar | Artek Stok" };

export default async function UsersPage() {
  const requestHeaders = await headers();
  if (!can(await loadActor(requestHeaders), "users.manage")) return <NoAccess />;
  const [users, lokasyon] = await Promise.all([listUsers(requestHeaders), listLokasyon()]);
  const lokasyonName = Object.fromEntries(lokasyon.map((l) => [l.id, l.name]));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Kullanıcılar</h1>
        <Button asChild>
          <Link href="/kullanicilar/yeni">Kullanıcı davet et</Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ad soyad</TableHead>
            <TableHead>E-posta</TableHead>
            <TableHead>Roller</TableHead>
            <TableHead>Lokasyon</TableHead>
            <TableHead>Durum</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell>
                <Link href={`/kullanicilar/${u.id}`} className="underline-offset-4 hover:underline">
                  {u.name}
                </Link>
              </TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>{u.roles.map((r) => roleLabels[r]).join(", ")}</TableCell>
              <TableCell>{u.lokasyonIds.map((id) => lokasyonName[id]).join(", ") || "—"}</TableCell>
              <TableCell>
                <UserStatus active={u.active} invited={u.invited} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
