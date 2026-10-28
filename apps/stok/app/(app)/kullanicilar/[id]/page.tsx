import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@artek/ui/components/table";
import { CapabilitySummary, GrantLegend } from "@/components/capabilities-view";
import { NoAccess } from "@/components/no-access";
import { capabilitiesOf } from "@/lib/capabilities";
import { loadActor } from "@/lib/guard";
import { auditActionLabels, formatDateTime, panelLabels, panelLevelLabels, roleLabels } from "@/lib/labels";
import { listLokasyon } from "@/lib/lokasyon";
import { can, type Role } from "@/lib/permissions";
import { getUserDetail } from "@/lib/user-admin";
import { AccessFields, UserStatus } from "../access-fields";
import {
  deactivateUserAction,
  endSessionsAction,
  reactivateUserAction,
  sendPasswordLinkAction,
  updateAccessAction,
  updatePanelsAction,
} from "../actions";
import { FormSelect } from "@/components/form-select";
import { Label } from "@artek/ui/components/label";
import type { Panel, PanelLevel } from "@/lib/permissions";
import { AccessForm, PanelsForm, UserActionButton } from "../user-forms";

export const metadata = { title: "Kullanıcı | Artek Stok" };

export default async function UserPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ davet?: string }>;
}) {
  const [{ id }, { davet }] = await Promise.all([params, searchParams]);
  const requestHeaders = await headers();
  if (!can(await loadActor(requestHeaders), "users.manage")) return <NoAccess />;
  const [target, lokasyon] = await Promise.all([getUserDetail(requestHeaders, id), listLokasyon()]);
  if (!target) notFound();
  const lokasyonName = Object.fromEntries(lokasyon.map((l) => [l.id, l.name]));

  // An audit snapshot in words.
  function describe(value: unknown) {
    if (!value || typeof value !== "object") return "—";
    const v = value as {
      roles?: Role[];
      lokasyonIds?: string[];
      active?: boolean;
      kind?: string;
      sessions?: number;
      panels?: Partial<Record<Panel, PanelLevel>>;
    };
    if (v.panels) {
      const granted = (Object.keys(panelLabels) as Panel[]).filter((p) => v.panels![p]);
      return granted.length ? granted.map((p) => `${panelLabels[p]}: ${panelLevelLabels[v.panels![p]!]}`).join(" · ") : "Panel izni yok";
    }
    if (v.kind) return v.kind === "invite" ? "Davet bağlantısı" : "Şifre sıfırlama bağlantısı";
    if (v.sessions !== undefined) return `${v.sessions} oturum kapatıldı`;
    return [
      v.roles?.map((r) => roleLabels[r]).join(", "),
      v.lokasyonIds?.length ? v.lokasyonIds.map((l) => lokasyonName[l] ?? l).join(", ") : undefined,
      v.active === false ? "Devre dışı" : undefined,
    ]
      .filter(Boolean)
      .join(" · ");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/kullanicilar" className="text-muted-foreground text-sm underline-offset-4 hover:underline">
          ← Kullanıcılar
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{target.name}</h1>
          <UserStatus active={target.active} invited={target.invited} />
        </div>
        <p className="text-muted-foreground">{target.email}</p>
        {davet && <p className="text-sm text-green-700 dark:text-green-400">Davet e-postası gönderildi.</p>}
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Neleri görüyor, neleri yapabiliyor</h2>
        <GrantLegend />
        <CapabilitySummary capabilities={capabilitiesOf(target, lokasyon)} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Yetkiler</h2>
        <AccessForm action={updateAccessAction.bind(null, target.id)}>
          <AccessFields roles={target.roles} lokasyonIds={target.lokasyonIds} lokasyon={lokasyon} />
        </AccessForm>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Panel izinleri</h2>
        <p className="text-muted-foreground max-w-xl text-sm">
          Müşteri ve finans panelleri yalnızca burada izin verilen yöneticilere açılır. Yönetici rolü tek başına bu panelleri göstermez;
          yöneticilik kaldırılırsa izinler de geçersiz olur.
        </p>
        {target.roles.includes("admin") ? (
          <PanelsForm action={updatePanelsAction.bind(null, target.id)}>
            <div className="grid gap-4 sm:grid-cols-2">
              {(Object.keys(panelLabels) as Panel[]).map((p) => (
                <Label key={p} className="flex-col items-stretch gap-1">
                  {panelLabels[p]}
                  <FormSelect
                    name={p}
                    defaultValue={target.panels[p] ?? "yok"}
                    options={Object.entries(panelLevelLabels).map(([value, label]) => ({ value, label }))}
                    className="w-full"
                  />
                </Label>
              ))}
            </div>
          </PanelsForm>
        ) : (
          <p className="text-sm">Bu kullanıcı yönetici olmadığı için panel izni verilemez.</p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Hesap</h2>
        <div className="flex flex-wrap items-start gap-3">
          {target.active && (
            <UserActionButton
              action={sendPasswordLinkAction.bind(null, target.id)}
              label={target.invited ? "Daveti yeniden gönder" : "Şifre sıfırlama bağlantısı gönder"}
              done="E-posta gönderildi."
            />
          )}
          <UserActionButton action={endSessionsAction.bind(null, target.id)} label="Oturumları kapat" done="Oturumlar kapatıldı." />
          {target.active ? (
            <UserActionButton
              key="deactivate"
              action={deactivateUserAction.bind(null, target.id)}
              label="Devre dışı bırak"
              done="Kullanıcı devre dışı."
              variant="destructive"
            />
          ) : (
            <UserActionButton
              key="reactivate"
              action={reactivateUserAction.bind(null, target.id)}
              label="Yeniden etkinleştir"
              done="Kullanıcı etkin."
            />
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Değişiklik geçmişi</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Zaman</TableHead>
              <TableHead>Kim</TableHead>
              <TableHead>İşlem</TableHead>
              <TableHead>Önce</TableHead>
              <TableHead>Sonra</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {target.history.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="whitespace-nowrap">{formatDateTime(entry.createdAt)}</TableCell>
                <TableCell>{entry.actorName ?? "Sistem"}</TableCell>
                <TableCell>{auditActionLabels[entry.action] ?? entry.action}</TableCell>
                <TableCell className="text-sm">{describe(entry.before)}</TableCell>
                <TableCell className="text-sm">{describe(entry.after)}</TableCell>
              </TableRow>
            ))}
            {target.history.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground text-center">
                  Kayıt yok.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
