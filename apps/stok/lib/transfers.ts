import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";
import { db } from "../db";
import { lokasyon, lossReason, product, transfer, transferLine, user } from "../db/schema";
import { UserError } from "./errors";
import { loadActor, requirePermission } from "./guard";
import { postDocument, visibleLokasyonIds, type MovementLine } from "./ledger";
import { can } from "./permissions";
import { formatQuantity, parseQuantity, parseQuantityOrZero, subtractQuantity, unitLabels } from "./quantity";

export type LossReason = (typeof lossReason.enumValues)[number];
export const lossReasonLabels: Record<LossReason, string> = { kayip: "Kayıp", hasarli: "Hasarlı" };

const productLines = z
  .array(z.object({ productId: z.string(), quantity: z.string() }))
  .min(1, { error: "En az bir ürün satırı girin." })
  .refine((rows) => new Set(rows.map((r) => r.productId)).size === rows.length, {
    error: "Aynı ürün iki satırda girilmiş; miktarları tek satırda toplayın.",
  });

const sendInput = z
  .object({
    fromLokasyonId: z.uuid({ error: "Kaynak Lokasyonu seçin." }),
    toLokasyonId: z.uuid({ error: "Hedef Lokasyonu seçin." }),
    note: z.string().trim().nullish(),
    lines: productLines,
    idempotencyKey: z.string().min(1),
  })
  .refine((t) => t.fromLokasyonId !== t.toLokasyonId, { error: "Kaynak ve hedef Lokasyon farklı olmalı." });

export type SendInput = z.input<typeof sendInput>;

// Sevk: the quantity leaves the source and is on the way, at neither Lokasyon.
export async function sendTransfer(headers: Headers, input: SendInput) {
  const parsed = sendInput.safeParse(input);
  if (!parsed.success) throw new UserError(parsed.error.issues[0].message);
  const { fromLokasyonId, toLokasyonId, note, idempotencyKey } = parsed.data;
  const actor = await requirePermission(headers, "stock.transfer", fromLokasyonId);
  // Stock sent to a Lokasyon that hasn't gone live could never be received there.
  const target = await db.query.lokasyon.findFirst({ where: eq(lokasyon.id, toLokasyonId) });
  if (!target) throw new UserError("Hedef Lokasyon bulunamadı.");
  if (!target.openedAt) throw new UserError(`${target.name} için açılış sayımı onaylanmadı; oraya transfer gönderilemez.`);
  const transferId = crypto.randomUUID();

  const result = await postDocument(
    { kind: "transfer_sevk", lokasyonId: fromLokasyonId, reason: note || null, userId: actor.userId, idempotencyKey },
    async (tx, documentId) => {
      await tx.insert(transfer).values({
        id: transferId,
        fromLokasyonId,
        toLokasyonId,
        note: note || null,
        sendDocumentId: documentId,
        sentBy: actor.userId,
      });
      const products = await tx
        .select({ id: product.id, code: product.code, unit: product.unit })
        .from(product)
        .where(inArray(product.id, parsed.data.lines.map((l) => l.productId).filter((id) => z.uuid().safeParse(id).success)));
      const rows = parsed.data.lines.map((line) => {
        const found = products.find((p) => p.id === line.productId);
        if (!found) throw new UserError("Ürün bulunamadı; listeden bir ürün seçin.");
        const quantity = parseQuantity(line.quantity, found.unit);
        if (!quantity.ok) throw new UserError(`${found.code}: ${quantity.error}`);
        return { transferId, productId: line.productId, sent: quantity.value };
      });
      await tx.insert(transferLine).values(rows);

      return rows.flatMap((row): MovementLine[] => [
        { productId: row.productId, lokasyonId: fromLokasyonId, direction: "out", quantity: row.sent, type: "transfer_sevk", transferId },
        { productId: row.productId, lokasyonId: null, direction: "in", quantity: row.sent, type: "transfer_sevk", transferId },
      ]);
    },
  );
  // A retried request returns the transfer its first attempt created.
  const sent = await db.query.transfer.findFirst({ where: eq(transfer.sendDocumentId, result.documentId) });
  return { ...result, transferId: sent!.id };
}

const receiveInput = z.object({
  lines: z.array(
    z.object({ productId: z.string(), received: z.string(), lossReason: z.enum(lossReason.enumValues).nullish() }),
  ),
  idempotencyKey: z.string().min(1),
});

export type ReceiveInput = z.input<typeof receiveInput>;

// Teslim alma: what arrived enters the target; any shortfall is closed now as a loss with its reason.
export async function receiveTransfer(headers: Headers, transferId: string, input: ReceiveInput) {
  const parsed = receiveInput.safeParse(input);
  if (!parsed.success) throw new UserError(parsed.error.issues[0].message);
  const found = z.uuid().safeParse(transferId).success
    ? await db.query.transfer.findFirst({ where: eq(transfer.id, transferId) })
    : undefined;
  if (!found) throw new UserError("Transfer bulunamadı.");
  const actor = await requirePermission(headers, "stock.transfer", found.toLokasyonId);

  return postDocument(
    { kind: "transfer_teslim", lokasyonId: found.toLokasyonId, userId: actor.userId, idempotencyKey: parsed.data.idempotencyKey },
    async (tx, documentId) => {
      // Locked so two different receipts can't both go through.
      const [current] = await tx.select().from(transfer).where(eq(transfer.id, transferId)).for("update");
      if (current.status !== "yolda") throw new UserError("Bu transfer zaten teslim alındı.");

      const sentLines = await tx
        .select({ productId: transferLine.productId, sent: transferLine.sent, code: product.code, unit: product.unit })
        .from(transferLine)
        .innerJoin(product, eq(product.id, transferLine.productId))
        .where(eq(transferLine.transferId, transferId));

      const movements: MovementLine[] = [];
      for (const line of sentLines) {
        const entry = parsed.data.lines.find((l) => l.productId === line.productId);
        if (!entry) throw new UserError(`${line.code} için gelen miktarı girin.`);
        const parsedReceived = parseQuantityOrZero(entry.received, line.unit);
        if (!parsedReceived.ok) throw new UserError(`${line.code}: ${parsedReceived.error}`);
        const received = parsedReceived.value;
        const lost = subtractQuantity(line.sent, received);
        if (lost.startsWith("-")) throw new UserError(`${line.code}: gönderilenden fazla teslim alınamaz.`);
        if (lost !== "0" && !entry.lossReason) {
          throw new UserError(`${line.code}: eksik ${lost.replace(".", ",")} ${unitLabels[line.unit]} için neden seçin (kayıp / hasarlı).`);
        }

        await tx
          .update(transferLine)
          .set({ received, lost, lossReason: lost !== "0" ? entry.lossReason : null })
          .where(and(eq(transferLine.transferId, transferId), eq(transferLine.productId, line.productId)));
        if (received !== "0") {
          movements.push(
            { productId: line.productId, lokasyonId: null, direction: "out", quantity: received, type: "transfer_teslim", transferId },
            { productId: line.productId, lokasyonId: current.toLokasyonId, direction: "in", quantity: received, type: "transfer_teslim", transferId },
          );
        }
        if (lost !== "0") {
          movements.push({
            productId: line.productId,
            lokasyonId: null,
            direction: "out",
            quantity: lost,
            type: "transfer_kaybi",
            reason: lossReasonLabels[entry.lossReason!],
            transferId,
          });
        }
      }

      await tx
        .update(transfer)
        .set({ status: "teslim_alindi", receiveDocumentId: documentId, receivedBy: actor.userId, receivedAt: new Date() })
        .where(eq(transfer.id, transferId));
      return movements;
    },
  );
}

// Quantity on the way in open transfers, for one product. Counts at neither Lokasyon.
// With lokasyonIds, only transfers that start or end at one of them (as in the overview).
export async function inTransit(productId: string, lokasyonIds?: string[]) {
  const [row] = await db
    .select({ total: sql<string>`coalesce(sum(${transferLine.sent}), 0)` })
    .from(transferLine)
    .innerJoin(transfer, eq(transfer.id, transferLine.transferId))
    .where(
      and(
        eq(transfer.status, "yolda"),
        eq(transferLine.productId, productId),
        lokasyonIds
          ? or(inArray(transfer.fromLokasyonId, lokasyonIds), inArray(transfer.toLokasyonId, lokasyonIds))
          : undefined,
      ),
    );
  return formatQuantity(row.total);
}

const fromLokasyon = alias(lokasyon, "from_lokasyon");
const toLokasyon = alias(lokasyon, "to_lokasyon");
const sender = alias(user, "sender");
const receiver = alias(user, "receiver");

function transferQuery() {
  return db
    .select({
      id: transfer.id,
      status: transfer.status,
      note: transfer.note,
      fromLokasyonId: transfer.fromLokasyonId,
      fromName: fromLokasyon.name,
      toLokasyonId: transfer.toLokasyonId,
      toName: toLokasyon.name,
      sentAt: transfer.sentAt,
      sentBy: sender.name,
      receivedAt: transfer.receivedAt,
      receivedBy: receiver.name,
    })
    .from(transfer)
    .innerJoin(fromLokasyon, eq(fromLokasyon.id, transfer.fromLokasyonId))
    .innerJoin(toLokasyon, eq(toLokasyon.id, transfer.toLokasyonId))
    .innerJoin(sender, eq(sender.id, transfer.sentBy))
    .leftJoin(receiver, eq(receiver.id, transfer.receivedBy));
}

// Transfers that start or end at a Lokasyon the user can see; open ones first.
export async function listTransfers(headers: Headers) {
  const visible = await visibleLokasyonIds(await loadActor(headers));
  return transferQuery()
    .where(visible ? or(inArray(transfer.fromLokasyonId, visible), inArray(transfer.toLokasyonId, visible)) : undefined)
    .orderBy(sql`${transfer.status} = 'teslim_alindi'`, desc(transfer.sentAt))
    .limit(200);
}

export async function getTransfer(headers: Headers, id: string) {
  if (!z.uuid().safeParse(id).success) return undefined;
  const actor = await loadActor(headers);
  const [found] = await transferQuery().where(eq(transfer.id, id));
  if (!found || !(can(actor, "stock.view", found.fromLokasyonId) || can(actor, "stock.view", found.toLokasyonId))) {
    return undefined;
  }
  const lines = await db
    .select({
      productId: transferLine.productId,
      code: product.code,
      name: product.name,
      unit: product.unit,
      sent: transferLine.sent,
      received: transferLine.received,
      lost: transferLine.lost,
      lossReason: transferLine.lossReason,
    })
    .from(transferLine)
    .innerJoin(product, eq(product.id, transferLine.productId))
    .where(eq(transferLine.transferId, id));
  return {
    ...found,
    lines: lines.map((l) => ({
      ...l,
      sent: formatQuantity(l.sent),
      received: l.received === null ? null : formatQuantity(l.received),
      lost: l.lost === null ? null : formatQuantity(l.lost),
    })),
  };
}
