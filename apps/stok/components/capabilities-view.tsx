import Link from "next/link";
import { cn } from "@artek/ui/lib/utils";
import type { Capability, Grant } from "@/lib/capabilities";

export function GrantPill({ grant }: { grant: Grant }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2 py-0.5 text-xs whitespace-nowrap",
        grant.kind === "all" && "bg-green-600/15 font-medium text-green-700 dark:text-green-400",
        grant.kind === "some" && "bg-sky-600/15 font-medium text-sky-700 dark:text-sky-400",
        grant.kind === "none" && "text-muted-foreground/60",
      )}
    >
      {grant.text}
    </span>
  );
}

export function GrantLegend() {
  return (
    <p className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      <span className="flex items-center gap-1">
        <GrantPill grant={{ kind: "all", text: "Tümü / Düzenler" }} /> her yerde veya tam yetki
      </span>
      <span className="flex items-center gap-1">
        <GrantPill grant={{ kind: "some", text: "Karaköy / Görür" }} /> yalnızca o Lokasyon’da veya sadece görür
      </span>
      <span className="flex items-center gap-1">
        <GrantPill grant={{ kind: "none", text: "—" }} /> yetkisi yok
      </span>
    </p>
  );
}

type Person = {
  id: string;
  name: string;
  email: string;
  roleText: string;
  statusText: string;
  active: boolean;
  capabilities: Capability[];
  action?: React.ReactNode; // the row's ⋯ editor
};

// One row per person, one column per capability, grouped under Stok, Katalog, Satış and Yönetim.
export function CapabilityMatrix({ people }: { people: Person[] }) {
  const columns = people[0]?.capabilities ?? [];
  const groups = columns.reduce<{ group: string; span: number }[]>((acc, c) => {
    const last = acc.at(-1);
    if (last?.group === c.group) last.span++;
    else acc.push({ group: c.group, span: 1 });
    return acc;
  }, []);
  return (
    <div className="bg-card overflow-x-auto rounded-xl border">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">Kullanıcıların yetkileri</caption>
        <thead>
          <tr className="text-muted-foreground border-b text-xs">
            <th rowSpan={2} className="bg-card sticky left-0 z-10 min-w-48 px-4 py-2 text-left align-bottom font-medium">
              Kişi
            </th>
            {groups.map((g) => (
              <th key={g.group} colSpan={g.span} className="border-l px-2 pt-2 pb-1 text-center font-medium tracking-wide uppercase">
                {g.group}
              </th>
            ))}
            <th rowSpan={2} className="bg-card sticky right-0 z-10 w-12 border-l px-2 py-2 align-bottom">
              <span className="sr-only">Düzenle</span>
            </th>
          </tr>
          <tr className="border-b text-xs">
            {columns.map((c, i) => (
              <th
                key={c.key}
                title={c.hint}
                className={cn("min-w-[4.75rem] px-1.5 pb-2 text-center leading-tight font-medium", i === 0 || columns[i - 1].group !== c.group ? "border-l" : "")}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {people.map((p) => (
            <tr key={p.id} className={cn("hover:bg-muted/40 border-b last:border-0", !p.active && "opacity-60")}>
              <td className="bg-card sticky left-0 z-10 px-4 py-2.5">
                <Link href={`/kullanicilar/${p.id}`} className="font-medium underline-offset-4 hover:underline">
                  {p.name}
                </Link>
                <div className="text-muted-foreground text-xs">{p.email}</div>
                <div className="mt-1 flex flex-wrap gap-1 text-xs">
                  <span className="bg-muted rounded px-1.5 py-0.5">{p.roleText || "Rol yok"}</span>
                  <span className={cn("rounded px-1.5 py-0.5", p.active ? "text-muted-foreground" : "bg-destructive/10 text-destructive")}>
                    {p.statusText}
                  </span>
                </div>
              </td>
              {p.capabilities.map((c, i) => (
                <td
                  key={c.key}
                  className={cn("px-1.5 py-2.5 text-center", i === 0 || p.capabilities[i - 1].group !== c.group ? "border-l" : "")}
                >
                  <GrantPill grant={c.grant} />
                </td>
              ))}
              <td className="bg-card sticky right-0 z-10 border-l px-1 py-2.5 text-center">{p.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// The same picture for one person, as a list grouped the same way.
export function CapabilitySummary({ capabilities, compact }: { capabilities: Capability[]; compact?: boolean }) {
  const groups = [...new Set(capabilities.map((c) => c.group))];
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", !compact && "xl:grid-cols-4")}>
      {groups.map((g) => (
        <div key={g} className="bg-card flex flex-col gap-2 rounded-xl border p-4">
          <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{g}</h3>
          <ul className="flex flex-col gap-2">
            {capabilities
              .filter((c) => c.group === g)
              .map((c) => (
                <li key={c.key} className="flex items-start justify-between gap-3">
                  <span className="flex flex-col">
                    <span className="text-sm">{c.label}</span>
                    <span className="text-muted-foreground text-xs">{c.hint}</span>
                  </span>
                  <GrantPill grant={c.grant} />
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
