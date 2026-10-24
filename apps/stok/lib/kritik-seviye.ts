import { and, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { db, type Tx } from "../db";
import { notification, notificationSetting, product, stockMovement, user, userRole } from "../db/schema";
import { displayQuantity } from "./labels";
import type { Role } from "./permissions";
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
    // NO KEY UPDATE serializes two documents for the same product but, unlike FOR UPDATE, doesn't
    // conflict with the key-share locks their movement inserts already hold, so it can't deadlock.
    .for("no key update");

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
    const recipients = await recipientEmails(tx);
    await tx.insert(notification).values({
      // With nobody in the chosen roles there is no one to send to; show that instead of retrying.
      ...(recipients.length === 0 && { status: "failed" as const, lastError: "Alıcı yok: seçili rollerde kullanıcı bulunmuyor." }),
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
      recipients,
    });
  }
}

export const defaultRecipientRoles: Role[] = ["admin", "muhendis"];

export async function recipientRoles(tx: Tx | typeof db): Promise<Role[]> {
  const setting = await tx.query.notificationSetting.findFirst({ where: eq(notificationSetting.key, "kritik_seviye") });
  return setting?.roles ?? defaultRecipientRoles;
}

export async function recipientEmails(tx: Tx) {
  const roles = await recipientRoles(tx);
  const rows = await tx
    .selectDistinct({ email: user.email })
    .from(user)
    .innerJoin(userRole, eq(userRole.userId, user.id))
    .where(inArray(userRole.role, roles));
  return rows.map((r) => r.email).sort();
}
