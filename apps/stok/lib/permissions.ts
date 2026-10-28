import type { panel, panelLevel, role } from "../db/schema";

export type Role = (typeof role.enumValues)[number];
export type Panel = (typeof panel.enumValues)[number];
export type PanelLevel = (typeof panelLevel.enumValues)[number];

export type Action =
  | "users.manage"
  | "products.manage" // Ürün and Kritik seviye
  | "products.view"
  | "stock.view" // balances and movement history
  | "stock.reverse" // ters kayıt of a confirmed movement
  | "stock.receive" // Mal kabul
  | "stock.transfer"
  | "stock.out" // satış teslimatı, üretim tüketimi, fire
  | "count.perform" // Sayım
  | "count.approve"
  | "notifications.manage"; // Kritik seviye recipients and the email outbox

// The owner's private panels: each needs the admin role and a permission given to that user by name.
export type PanelAction =
  | "finance.view" // Finans paneli and the invoice list
  | "finance.edit" // uploading invoices
  | "crm.view" // Müşteri paneli
  | "crm.edit"; // customer cards: contacts, status, follow-up, notes

export type Actor = { roles: Role[]; lokasyonIds: string[]; panels?: Partial<Record<Panel, PanelLevel>> };

// "any": in every Lokasyon. "own": only in a Lokasyon the user is assigned to.
type Scope = "any" | "own";

// The roles table from docs/artek-stok-crm-plan-ve-prompt.md §4.
const rules: Record<Action, Partial<Record<Role, Scope>>> = {
  "users.manage": { admin: "any" },
  "products.manage": { admin: "any", muhendis: "any" },
  "products.view": { admin: "any", muhendis: "any", magaza_sorumlusu: "any", depo_sorumlusu: "any" },
  "stock.view": { admin: "any", muhendis: "any", magaza_sorumlusu: "own", depo_sorumlusu: "own" },
  "stock.reverse": { admin: "any", muhendis: "any" },
  "stock.receive": { admin: "any", muhendis: "any", magaza_sorumlusu: "own", depo_sorumlusu: "own" },
  "stock.transfer": { admin: "any", muhendis: "any", magaza_sorumlusu: "own", depo_sorumlusu: "own" },
  "stock.out": { admin: "any", muhendis: "any", magaza_sorumlusu: "own", depo_sorumlusu: "own" },
  "count.perform": { admin: "any", muhendis: "any", magaza_sorumlusu: "own", depo_sorumlusu: "own" },
  "count.approve": { admin: "any", muhendis: "any" },
  "notifications.manage": { admin: "any" },
};

const panelRules: Record<PanelAction, { panel: Panel; levels: PanelLevel[] }> = {
  "finance.view": { panel: "finans", levels: ["gorur", "duzenler"] },
  "finance.edit": { panel: "finans", levels: ["duzenler"] },
  "crm.view": { panel: "musteri", levels: ["gorur", "duzenler"] },
  "crm.edit": { panel: "musteri", levels: ["duzenler"] },
};

const isPanelAction = (action: Action | PanelAction): action is PanelAction => action in panelRules;

export function can(actor: Actor, action: Action | PanelAction, lokasyonId?: string): boolean {
  if (isPanelAction(action)) {
    const level = actor.panels?.[panelRules[action].panel];
    return actor.roles.includes("admin") && level !== undefined && panelRules[action].levels.includes(level);
  }
  return actor.roles.some((role) => {
    const scope = rules[action][role];
    if (scope === "any") return true;
    if (scope === "own") return lokasyonId !== undefined && actor.lokasyonIds.includes(lokasyonId);
    return false;
  });
}
