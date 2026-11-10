import { and, desc, eq, gte, lt, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../db";
import { activityLog, auditLog, lokasyon, product, stockDocument, stockMovement, user } from "../db/schema";
import { requirePermission } from "./guard";
import { displayQuantity, movementTypeLabels, type ActivityEntity } from "./labels";
import { can, type Actor } from "./permissions";
import { formatQuantity, unitLabels } from "./quantity";

// The İşlem geçmişi: who did what and when, in the whole system. Faturalar, Müşteriler, Adaylar, Ürünler and Fiyatlar
// write a row to activity_log; stock and users already keep their own record, so those are read from it, not copied.

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type Activity = Omit<typeof activityLog.$inferInsert, "id" | "createdAt">;

export async function logActivity(tx: Tx | typeof db, row: Activity | Activity[]) {
  const rows = Array.isArray(row) ? row : [row];
  if (rows.length) await tx.insert(activityLog).values(rows);
}

export type ActivityAction = (typeof activityLog.$inferSelect)["action"] | "hareket" | "kullanici";
export type ActivityEntry = {
  id: string;
  entity: ActivityEntity;
  entityId: string;
  label: string;
  action: ActivityAction;
  actionLabel: string;
  detail: string | null;
  who: string;
  at: Date;
  notable: boolean; // worth a line in the weekly report: something removed, undone or corrected
};

const actionLabels: Record<(typeof activityLog.$inferSelect)["action"], string> = {
  eklendi: "Eklendi",
  duzenlendi: "Değişti",
  arsivlendi: "Arşivlendi",
  geri_alindi: "Geri alındı",
  musteri_oldu: "Müşteri oldu",
  onaylandi: "Onaylandı",
  silindi: "Silindi",
};
const userActions: Record<string, string> = {
  "user.invite": "Davet edildi",
  "user.access": "Yetkisi değişti",
  "user.panels": "Panel izni değişti",
  "user.deactivate": "Pasif yapıldı",
  "user.reactivate": "Yeniden açıldı",
};
const notableMovements = new Set(["fire", "sayim_duzeltmesi", "transfer_kaybi"]);

// Prices, invoices and Giderler only for the Finans paneli, customers and Adaylar only for the Müşteri paneli.
export type ActivityAccess = { finance: boolean; crm: boolean };
export const mayShow = (entity: ActivityEntity, access: ActivityAccess) =>
  entity === "fatura" || entity === "fiyat" || entity === "gider" ? access.finance : entity === "musteri" || entity === "aday" ? access.crm : true;

const between = (column: Parameters<typeof gte>[0], range: { from?: Date; to?: Date }): SQL | undefined =>
  and(range.from ? gte(column, range.from) : undefined, range.to ? lt(column, range.to) : undefined);

// Newest first. Unchecked: for callers that already worked out what the reader may see.
export async function loadActivity(access: ActivityAccess, range: { from?: Date; to?: Date } = {}, limit = 2000): Promise<ActivityEntry[]> {
  const target = alias(user, "target");
  const [logged, movements, users] = await Promise.all([
    db
      .select({ log: activityLog, author: user.name })
      .from(activityLog)
      .leftJoin(user, eq(user.id, activityLog.userId))
      .where(between(activityLog.createdAt, range))
      .orderBy(desc(activityLog.createdAt))
      .limit(limit),
    db
      .select({ m: stockMovement, code: product.code, name: product.name, place: lokasyon.name, who: user.name, reference: stockDocument.reference, supplier: stockDocument.supplier })
      .from(stockMovement)
      .innerJoin(product, eq(product.id, stockMovement.productId))
      .innerJoin(user, eq(user.id, stockMovement.userId))
      .innerJoin(stockDocument, eq(stockDocument.id, stockMovement.documentId))
      .leftJoin(lokasyon, eq(lokasyon.id, stockMovement.lokasyonId))
      .where(between(stockMovement.createdAt, range))
      .orderBy(desc(stockMovement.createdAt))
      .limit(limit),
    db
      .select({ a: auditLog, who: user.name, target: target.name })
      .from(auditLog)
      .innerJoin(target, eq(target.id, auditLog.targetUserId))
      .leftJoin(user, eq(user.id, auditLog.actorId))
      .where(between(auditLog.createdAt, range))
      .orderBy(desc(auditLog.createdAt))
      .limit(limit),
  ]);

  const entries: ActivityEntry[] = [
    ...logged.map(({ log, author }): ActivityEntry => ({
      id: log.id,
      entity: log.entity,
      entityId: log.entityId,
      label: log.label,
      action: log.action,
      actionLabel: actionLabels[log.action],
      detail: log.detail,
      who: author ?? (log.via === "rutin" ? "Rutin" : log.via === "fatura" ? "Fatura" : "Sistem"),
      at: log.createdAt,
      notable: log.action === "arsivlendi" || log.action === "geri_alindi" || log.action === "silindi",
    })),
    ...movements.map(({ m, code, name, place, who, reference, supplier }): ActivityEntry => {
      const quantity = Number(m.quantity);
      const amount = `${place ?? "Yolda"}: ${quantity > 0 ? "+" : ""}${displayQuantity(formatQuantity(m.quantity))} ${unitLabels[m.unit]}`;
      return {
        id: m.id,
        entity: "stok",
        entityId: m.productId,
        label: `${code} ${name}`,
        action: "hareket",
        actionLabel: m.reversesId ? "Ters kayıt" : movementTypeLabels[m.type],
        detail: [amount, m.reason, reference, supplier].filter(Boolean).join(" · "),
        who,
        at: m.createdAt,
        notable: Boolean(m.reversesId) || notableMovements.has(m.type),
      };
    }),
    ...users.map(({ a, who, target: name }): ActivityEntry => ({
      id: a.id,
      entity: "kullanici",
      entityId: a.targetUserId,
      label: name,
      action: "kullanici",
      actionLabel: userActions[a.action] ?? "Değişti",
      detail: null,
      who: who ?? "Sistem",
      at: a.createdAt,
      notable: true,
    })),
  ];
  return entries
    .filter((e) => mayShow(e.entity, access))
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, limit);
}

export const activityAccess = (actor: Actor): ActivityAccess => ({ finance: can(actor, "finance.view"), crm: can(actor, "crm.view") });

export async function listActivity(headers: Headers, range: { from?: Date; to?: Date } = {}, limit = 2000) {
  const actor = await requirePermission(headers, "activity.view");
  return loadActivity(activityAccess(actor), range, limit);
}
