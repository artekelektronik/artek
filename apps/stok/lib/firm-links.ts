import { and, desc, eq, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";
import { db } from "../db";
import { customer, customerChange, firmLink, linkType, user, type LinkType } from "../db/schema";
import { linkLabels } from "./customer-fields";
import { parseInput, UserError } from "./errors";
import { requirePermission } from "./guard";

// Links between firms: two-way on the cards, stored from → to. Adding and removing one is written to both
// firms' change history (directly, since customer-changes imports this file).

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
const symmetric: LinkType[] = ["birlikte_calisiyor", "ayni_sahip", "diger"];

export async function linksFor(customerId: string) {
  const from = alias(customer, "from_customer");
  const to = alias(customer, "to_customer");
  const rows = await db
    .select({ link: firmLink, fromName: from.name, toName: to.name, author: user.name })
    .from(firmLink)
    .innerJoin(from, eq(from.id, firmLink.fromId))
    .innerJoin(to, eq(to.id, firmLink.toId))
    .leftJoin(user, eq(user.id, firmLink.createdBy))
    .where(or(eq(firmLink.fromId, customerId), eq(firmLink.toId, customerId)))
    .orderBy(desc(firmLink.createdAt));
  return rows.map(({ link, fromName, toName, author }) => {
    const outgoing = link.fromId === customerId;
    return {
      id: link.id,
      type: link.type,
      label: linkLabels[link.type][outgoing ? "from" : "to"],
      other: outgoing ? { id: link.toId, name: toName } : { id: link.fromId, name: fromName },
      note: link.note,
      author,
      createdAt: link.createdAt,
    };
  });
}

async function names(tx: Tx, ids: string[]) {
  const rows = await tx.select({ id: customer.id, name: customer.name }).from(customer).where(or(...ids.map((id) => eq(customer.id, id))));
  return new Map(rows.map((r) => [r.id, r.name]));
}

async function recordLink(
  tx: Tx,
  link: { fromId: string; toId: string; type: LinkType },
  change: "added" | "removed",
  by: { source: "not" | "elle"; userId: string; noteId?: string | null },
) {
  const name = await names(tx, [link.fromId, link.toId]);
  const text = (side: "from" | "to") => `${linkLabels[link.type][side]}: ${name.get(side === "from" ? link.toId : link.fromId)}`;
  await tx.insert(customerChange).values(
    (["from", "to"] as const).map((side) => ({
      customerId: side === "from" ? link.fromId : link.toId,
      field: "link" as const,
      oldValue: change === "removed" ? text(side) : null,
      newValue: change === "added" ? text(side) : null,
      source: by.source,
      userId: by.userId,
      noteId: by.noteId ?? null,
    })),
  );
}

// Adds the link unless it (or, for a two-way type, its mirror) is already there. Returns whether it was added.
export async function createLink(
  tx: Tx,
  link: { fromId: string; toId: string; type: LinkType; note?: string | null },
  by: { source: "not" | "elle"; userId: string; noteId?: string | null },
) {
  if (link.fromId === link.toId) throw new UserError("Bir firma kendisine bağlanamaz.");
  const same = and(eq(firmLink.fromId, link.fromId), eq(firmLink.toId, link.toId), eq(firmLink.type, link.type));
  const mirror = and(eq(firmLink.fromId, link.toId), eq(firmLink.toId, link.fromId), eq(firmLink.type, link.type));
  const [existing] = await tx
    .select({ id: firmLink.id })
    .from(firmLink)
    .where(symmetric.includes(link.type) ? or(same, mirror) : same);
  if (existing) return false;
  await tx.insert(firmLink).values({ ...link, note: link.note || null, createdBy: by.userId });
  await recordLink(tx, link, "added", by);
  return true;
}

const linkInput = z.object({
  fromId: z.uuid(),
  toId: z.uuid({ error: "Bağlanacak firmayı seçin." }),
  type: z.enum(linkType.enumValues, { error: "Bağlantı türünü seçin." }),
  note: z.string().trim().max(500).default(""),
});

export async function addLink(headers: Headers, input: z.input<typeof linkInput>) {
  const actor = await requirePermission(headers, "crm.edit");
  const data = parseInput(linkInput, input);
  const added = await db.transaction((tx) => createLink(tx, data, { source: "elle", userId: actor.userId }));
  if (!added) throw new UserError("Bu bağlantı zaten var.");
}

export async function removeLink(headers: Headers, id: string) {
  const actor = await requirePermission(headers, "crm.edit");
  await db.transaction(async (tx) => {
    const [link] = await tx.delete(firmLink).where(eq(firmLink.id, id)).returning();
    if (!link) throw new UserError("Bağlantı bulunamadı.");
    await recordLink(tx, link, "removed", { source: "elle", userId: actor.userId });
  });
}

// For the morning assistant: who this firm is linked to, by name and relation only.
export async function linkFacts(customerId: string) {
  return (await linksFor(customerId)).map((l) => ({ firma: l.other.name, iliski: l.label, ...(l.note && { not: l.note }) }));
}
