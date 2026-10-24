import { headers } from "next/headers";
import Link from "next/link";
import { Button } from "@artek/ui/components/button";
import { NoAccess } from "@/components/no-access";
import { loadActor } from "@/lib/guard";
import { listLokasyon } from "@/lib/lokasyon";
import { can } from "@/lib/permissions";
import { listUsers } from "@/lib/user-admin";
import { UsersTable } from "./users-table";

export const metadata = { title: "Kullanıcılar | Artek Stok" };

export default async function UsersPage() {
  const requestHeaders = await headers();
  if (!can(await loadActor(requestHeaders), "users.manage")) return <NoAccess />;
  const [users, lokasyon] = await Promise.all([listUsers(requestHeaders), listLokasyon()]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Kullanıcılar</h1>
        <Button asChild>
          <Link href="/kullanicilar/yeni">Kullanıcı davet et</Link>
        </Button>
      </div>
      <UsersTable users={users} lokasyon={lokasyon} />
    </div>
  );
}
