import { and, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { db, type Tx } from "../db";
import { notification, notificationSetting, product, stockMovement, user, userRole } from "../db/schema";
import { displayQuantity } from "./labels";
import type { Role } from "./permissions";
import { formatQuantity, subtractQuantity, unitLabels } from "./quantity";

export const below = (value: string, level: string) => subtractQuantity(value, level).startsWith("-");

// Company total over every movement; "product"."id" is spelled out because Drizzle leaves it bare in a select.
export const companyTotal = sql<string>`coalesce((select sum(m.quantity) from stock_movement m where m.product_id = "product"."id"), 0)`;

export const belowMinimumLevel = sql`${product.minLevel} is not null and ${companyTotal} < ${product.minLevel}`;

// In the posting transaction: one outbox email per product this document took below its Kritik seviye.
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
    // NO KEY UPDATE serializes per product without clashing with the inserts' key-share locks (no deadlock).
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
      // No recipients: mark failed so Bildirimler shows it instead of retrying.
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

const defaultRecipientRoles: Role[] = ["admin", "muhendis"];

export async function recipientRoles(tx: Tx | typeof db): Promise<Role[]> {
  const setting = await tx.query.notificationSetting.findFirst({ where: eq(notificationSetting.key, "kritik_seviye") });
  return setting?.roles ?? defaultRecipientRoles;
}

async function recipientEmails(tx: Tx) {
  const roles = await recipientRoles(tx);
  const rows = await tx
    .selectDistinct({ email: user.email })
    .from(user)
    .innerJoin(userRole, eq(userRole.userId, user.id))
    .where(inArray(userRole.role, roles));
  return rows.map((r) => r.email).sort();
}
