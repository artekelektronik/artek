import { can, type Action, type Actor, type PanelAction } from "./permissions";

// What a user can do, worked out from the same rules every action checks (lib/permissions.ts), so the
// Kullanıcılar page can never claim more or less than the app actually allows.

export type Grant =
  | { kind: "all"; text: string } // everywhere / full
  | { kind: "some"; text: string } // only some Lokasyon, or view-only
  | { kind: "none"; text: string };

export type Capability = { key: string; group: string; label: string; hint: string; grant: Grant };

type Lokasyon = { id: string; name: string };
const shortPlace = (name: string) => name.split(" ")[0];

// "Tümü" when allowed in every Lokasyon, else the Lokasyon it is allowed in.
function where(actor: Actor, action: Action, lokasyon: Lokasyon[]): Grant {
  const allowed = lokasyon.filter((l) => can(actor, action, l.id));
  if (lokasyon.length && allowed.length === lokasyon.length) return { kind: "all", text: "Tümü" };
  if (allowed.length) return { kind: "some", text: allowed.map((l) => shortPlace(l.name)).join(", ") };
  return { kind: "none", text: "—" };
}

function level(actor: Actor, edit: Action | PanelAction, view: Action | PanelAction): Grant {
  if (can(actor, edit)) return { kind: "all", text: "Düzenler" };
  if (can(actor, view)) return { kind: "some", text: "Görür" };
  return { kind: "none", text: "—" };
}

const yes = (ok: boolean): Grant => (ok ? { kind: "all", text: "Evet" } : { kind: "none", text: "—" });

export function capabilitiesOf(actor: Actor & { active: boolean }, lokasyon: Lokasyon[]): Capability[] {
  // A deactivated user can't sign in, so they can do nothing whatever their roles say.
  const a: Actor = actor.active ? actor : { roles: [], lokasyonIds: [] };
  return [
    { key: "stokGor", group: "Stok", label: "Stok durumu", hint: "Bakiyeleri ve stok hareketlerini görür", grant: where(a, "stock.view", lokasyon) },
    {
      key: "stokIslem",
      group: "Stok",
      label: "Stok işlemleri",
      hint: "Mal kabul, stok çıkışı ve transfer yapar",
      grant: where(a, "stock.receive", lokasyon),
    },
    { key: "sayim", group: "Stok", label: "Sayım", hint: "Sayım yapar", grant: where(a, "count.perform", lokasyon) },
    { key: "sayimOnay", group: "Stok", label: "Sayım onayı", hint: "Sayım farklarını onaylar", grant: where(a, "count.approve", lokasyon) },
    { key: "ters", group: "Stok", label: "Ters kayıt", hint: "Onaylı bir stok hareketini geri alır", grant: where(a, "stock.reverse", lokasyon) },
    { key: "urun", group: "Katalog", label: "Ürünler", hint: "Ürün kartları ve kritik seviye", grant: level(a, "products.manage", "products.view") },
    { key: "musteri", group: "Satış", label: "Müşteri paneli", hint: "Müşteriler, notlar ve takip", grant: level(a, "crm.edit", "crm.view") },
    { key: "finans", group: "Satış", label: "Finans paneli", hint: "Satış rakamları ve fatura yükleme", grant: level(a, "finance.edit", "finance.view") },
    { key: "kullanici", group: "Yönetim", label: "Kullanıcılar", hint: "Davet eder, yetki ve panel izni verir", grant: yes(can(a, "users.manage")) },
    { key: "bildirim", group: "Yönetim", label: "Bildirimler", hint: "E-posta alıcılarını ve gönderimleri yönetir", grant: yes(can(a, "notifications.manage")) },
  ];
}
