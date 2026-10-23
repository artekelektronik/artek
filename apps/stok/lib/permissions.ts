import type { role } from "../db/schema";

export type Role = (typeof role.enumValues)[number];

export type Action =
  | "users.manage"
  | "products.manage" // Ürün and Kritik seviye
  | "products.view"
  | "stock.receive" // Mal kabul
  | "stock.transfer"
  | "stock.out" // satış teslimatı, üretim tüketimi, fire
  | "count.perform" // Sayım
  | "count.approve";

export type Actor = { roles: Role[]; lokasyonIds: string[] };

// "any": in every Lokasyon. "own": only in a Lokasyon the user is assigned to.
type Scope = "any" | "own";

// The roles table from docs/artek-stok-crm-plan-ve-prompt.md §4.
const rules: Record<Action, Partial<Record<Role, Scope>>> = {
  "users.manage": { admin: "any" },
  "products.manage": { admin: "any", muhendis: "any" },
  "products.view": { admin: "any", muhendis: "any", magaza_sorumlusu: "any", depo_sorumlusu: "any" },
  "stock.receive": { admin: "any", muhendis: "any", magaza_sorumlusu: "own", depo_sorumlusu: "own" },
  "stock.transfer": { admin: "any", muhendis: "any", magaza_sorumlusu: "own", depo_sorumlusu: "own" },
  "stock.out": { admin: "any", muhendis: "any", magaza_sorumlusu: "own", depo_sorumlusu: "own" },
  "count.perform": { admin: "any", muhendis: "any", magaza_sorumlusu: "own", depo_sorumlusu: "own" },
  "count.approve": { admin: "any", muhendis: "any" },
};

export function can(actor: Actor, action: Action, lokasyonId?: string): boolean {
  return actor.roles.some((role) => {
    const scope = rules[action][role];
    if (scope === "any") return true;
    if (scope === "own") return lokasyonId !== undefined && actor.lokasyonIds.includes(lokasyonId);
    return false;
  });
}
