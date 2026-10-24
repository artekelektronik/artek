import { and, eq, inArray, isNotNull, sql } from "drizzle-orm";
import type { Tx } from "../db";
import { notification, notificationSetting, product, stockMovement, user, userRole } from "../db/schema";
import { displayQuantity } from "./labels";
import { formatQuantity, subtractQuantity, unitLabels } from "./quantity";

// Compares a quantity string with a level: true when value < level.
const below = (value: string, level: string) => subtractQuantity(value, level).startsWith("-");

// Called inside the posting transaction after a document's movements are written. A product whose
// company total went from at-or-above its Kritik seviye to below it gets one email in the outbox.
// Product rows are locked in a fixed order, so concurrent documents see each other's movements.
export async function queueMinimumLevelWarnings(tx: Tx, documentId: string) {
  const changes = await tx
    .select({ productId: stockMovement.productId, delta: sql<string>`sum(${stockMovement.quantity})` })
    .from(stockMovement)
    .where(eq(stockMovement.documentId, documentId))
    .groupBy(stockMovement.productId);
  if (changes.length === 0) return;

  const watched = await tx
    .select({ id: product.id, code: product.code, name: product.name, unit: product.unit, minLevel: product.minLevel })
    .from(product)
    .where(and(inArray(product.id, changes.map((c) => c.productId)), isNotNull(product.minLevel)))
    .orderBy(product.id)
    .for("update");

  for (const p of watched) {
    // Every movement counts, including stock on the way, so a transfer never triggers a warning.
    const [{ total }] = await tx
      .select({ total: sql<string>`coalesce(sum(${stockMovement.quantity}), 0)` })
      .from(stockMovement)
      .where(eq(stockMovement.productId, p.id));
    const delta = changes.find((c) => c.productId === p.id)!.delta;
    const before = subtractQuantity(total, delta);
    if (below(before, p.minLevel!) || !below(total, p.minLevel!)) continue;

    const unit = unitLabels[p.unit];
    await tx.insert(notification).values({
      kind: "kritik_seviye",
      productId: p.id,
      documentId,
      subject: `Kritik seviyenin altında: ${p.code} ${p.name}`,
      body: [
        `${p.code} ${p.name} şirket toplamı kritik seviyenin altına indi.`,
        "",
        `Toplam: ${displayQuantity(formatQuantity(total))} ${unit}`,
        `Kritik seviye: ${displayQuantity(formatQuantity(p.minLevel!))} ${unit}`,
      ].join("\n"),
      recipients: await recipientEmails(tx),
    });
  }
}

export async function recipientEmails(tx: Tx) {
  const setting = await tx.query.notificationSetting.findFirst({ where: eq(notificationSetting.key, "kritik_seviye") });
  const roles = setting?.roles ?? ["admin", "muhendis"];
  const rows = await tx
    .selectDistinct({ email: user.email })
    .from(user)
    .innerJoin(userRole, eq(userRole.userId, user.id))
    .where(inArray(userRole.role, roles));
  return rows.map((r) => r.email).sort();
}
