import { randomBytes } from "node:crypto";
import { and, asc, desc, eq, isNull, like, ne, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";
import { db, type Tx } from "../db";
import { account, auditLog, panel, role, session, user, userLokasyon, userPanel, userRole, verification } from "../db/schema";
import { auth } from "./auth";
import { parseInput, UserError } from "./errors";
import { requirePermission } from "./guard";
import { resendSender, type EmailSender } from "./email";
import { passwordEmail } from "./password-email";
import { createUser, writeAccess } from "./users";
import type { Panel, PanelLevel, Role } from "./permissions";

// Nobody, admins included, sees a password: users set their own from an emailed link.

type Access = { roles: Role[]; lokasyonIds: string[]; active: boolean };

const accessInput = z.object({
  roles: z.array(z.enum(role.enumValues)).min(1, { error: "En az bir rol seçin." }),
  lokasyonIds: z.array(z.uuid()),
});

const inviteInput = accessInput.extend({
  email: z.string().trim().toLowerCase().pipe(z.email({ error: "Geçerli bir e-posta girin." })),
  name: z.string().trim().min(1, { error: "Ad soyad gerekli." }),
});

type InviteInput = z.input<typeof inviteInput>;
type AccessInput = z.input<typeof accessInput>;


const inviteLinkLifetimeMs = 7 * 24 * 60 * 60_000;
const resetLinkLifetimeMs = 60 * 60_000;

export async function listUsers(headers: Headers) {
  await requirePermission(headers, "users.manage");
  const [users, roles, lokasyon, panels, credentials] = await Promise.all([
    db.select().from(user).orderBy(asc(user.name)),
    db.select().from(userRole),
    db.select().from(userLokasyon),
    db.select().from(userPanel),
    db.select({ userId: account.userId }).from(account).where(eq(account.providerId, "credential")),
  ]);
  const hasPassword = new Set(credentials.map((c) => c.userId));
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    active: !u.deactivatedAt,
    // Invited but hasn't set a password yet.
    invited: !hasPassword.has(u.id),
    roles: roles.filter((r) => r.userId === u.id).map((r) => r.role),
    lokasyonIds: lokasyon.filter((l) => l.userId === u.id).map((l) => l.lokasyonId),
    panels: Object.fromEntries(panels.filter((p) => p.userId === u.id).map((p) => [p.panel, p.level])) as Panels,
  }));
}

export async function getUserDetail(headers: Headers, id: string) {
  await requirePermission(headers, "users.manage");
  const [target] = await db.select().from(user).where(eq(user.id, id));
  if (!target) return undefined;
  const actor = alias(user, "actor");
  const [access, credential, history] = await Promise.all([
    readAccess(db, id),
    db.select({ id: account.id }).from(account).where(and(eq(account.userId, id), eq(account.providerId, "credential"))),
    db
      .select({
        id: auditLog.id,
        action: auditLog.action,
        before: auditLog.before,
        after: auditLog.after,
        createdAt: auditLog.createdAt,
        actorName: actor.name,
      })
      .from(auditLog)
      .leftJoin(actor, eq(actor.id, auditLog.actorId))
      .where(eq(auditLog.targetUserId, id))
      .orderBy(desc(auditLog.createdAt)),
  ]);
  return { id: target.id, name: target.name, email: target.email, ...access, panels: await readPanels(db, id), invited: credential.length === 0, history };
}

export async function inviteUser(headers: Headers, input: InviteInput, send: EmailSender = resendSender) {
  const actor = await requirePermission(headers, "users.manage");
  const { email, name, roles, lokasyonIds } = parseInput(inviteInput, input);
  const ctx = await auth.$context;
  if (await ctx.internalAdapter.findUserByEmail(email)) throw new UserError("Bu e-posta ile bir kullanıcı zaten var.");

  const created = await createUser({ email, name, roles, lokasyonIds }, (tx, id) =>
    audit(tx, actor.userId, id, "user.invite", null, { email, name, ...sorted({ roles, lokasyonIds }), active: true }),
  );

  try {
    await sendPasswordLink(created, "invite", send);
  } catch (error) {
    throw new UserError(
      `Kullanıcı oluşturuldu ama davet e-postası gönderilemedi (${errorMessage(error)}). Kullanıcının sayfasından yeniden gönderin.`,
    );
  }
  await auditNow(actor.userId, created.id, "user.password_link", null, { kind: "invite" });
  return created;
}

export async function sendPasswordLinkTo(headers: Headers, id: string, send: EmailSender = resendSender) {
  const actor = await requirePermission(headers, "users.manage");
  const [target] = await db.select().from(user).where(eq(user.id, id));
  if (!target) throw new UserError("Kullanıcı bulunamadı.");
  if (target.deactivatedAt) throw new UserError("Etkin olmayan bir kullanıcıya bağlantı gönderilemez.");
  const ctx = await auth.$context;
  const kind = (await ctx.internalAdapter.findCredentialAccount(id)) ? "reset" : "invite";
  try {
    await sendPasswordLink(target, kind, send);
  } catch (error) {
    throw new UserError(`E-posta gönderilemedi: ${errorMessage(error)}`);
  }
  await auditNow(actor.userId, id, "user.password_link", null, { kind });
}

export async function updateAccess(headers: Headers, id: string, input: AccessInput) {
  const actor = await requirePermission(headers, "users.manage");
  const next = sorted(parseInput(accessInput, input));
  await db.transaction(async (tx) => {
    await lockAdmins(tx);
    const before = await readAccess(tx, id);
    const after = { ...before, ...next };
    if (JSON.stringify(before) === JSON.stringify(after)) return;
    if (isActiveAdmin(before) && !isActiveAdmin(after)) await assertAnotherActiveAdmin(tx, id);
    await tx.delete(userRole).where(eq(userRole.userId, id));
    await tx.delete(userLokasyon).where(eq(userLokasyon.userId, id));
    await writeAccess(tx, id, next);
    await audit(tx, actor.userId, id, "user.access", before, after);
  });
}

type Panels = Partial<Record<Panel, PanelLevel>>;
const panelChoice = z.enum(["yok", "gorur", "duzenler"], { error: "İzin seçin." });
const panelsInput = z.object({ musteri: panelChoice, finans: panelChoice });

async function readPanels(tx: Tx | typeof db, id: string): Promise<Panels> {
  const rows = await tx.select({ panel: userPanel.panel, level: userPanel.level }).from(userPanel).where(eq(userPanel.userId, id));
  return Object.fromEntries(panel.enumValues.flatMap((p) => rows.filter((r) => r.panel === p).map((r) => [p, r.level])));
}

// The Müşteri and Finans panels are given to each admin by name; the admin role alone opens neither.
export async function updatePanels(headers: Headers, id: string, input: z.input<typeof panelsInput>) {
  const actor = await requirePermission(headers, "users.manage");
  const choice = parseInput(panelsInput, input);
  const after: Panels = Object.fromEntries(
    panel.enumValues.filter((p) => choice[p] !== "yok").map((p) => [p, choice[p] as PanelLevel]),
  );
  await db.transaction(async (tx) => {
    const access = await readAccess(tx, id);
    if (Object.keys(after).length && !(access.active && access.roles.includes("admin"))) {
      throw new UserError("Panel izni yalnızca etkin yöneticilere verilebilir. Önce yönetici rolünü verin.");
    }
    const before = await readPanels(tx, id);
    if (JSON.stringify(before) === JSON.stringify(after)) return;
    await tx.delete(userPanel).where(eq(userPanel.userId, id));
    const grants = Object.entries(after) as [Panel, PanelLevel][];
    if (grants.length) await tx.insert(userPanel).values(grants.map(([p, level]) => ({ userId: id, panel: p, level })));
    await audit(tx, actor.userId, id, "user.panels", { panels: before }, { panels: after });
  });
}

// Blocks sign-in, ends every session and voids unused password links. History keeps the user's name.
export async function deactivateUser(headers: Headers, id: string) {
  const actor = await requirePermission(headers, "users.manage");
  await db.transaction(async (tx) => {
    await lockAdmins(tx);
    const before = await readAccess(tx, id);
    if (!before.active) return;
    if (isActiveAdmin(before)) await assertAnotherActiveAdmin(tx, id);
    await tx.update(user).set({ deactivatedAt: new Date() }).where(eq(user.id, id));
    await tx.delete(session).where(eq(session.userId, id));
    await tx
      .delete(verification)
      .where(and(eq(verification.value, id), like(verification.identifier, "reset-password:%")));
    await audit(tx, actor.userId, id, "user.deactivate", before, { ...before, active: false });
  });
}

export async function reactivateUser(headers: Headers, id: string) {
  const actor = await requirePermission(headers, "users.manage");
  await db.transaction(async (tx) => {
    const before = await readAccess(tx, id);
    if (before.active) return;
    await tx.update(user).set({ deactivatedAt: null }).where(eq(user.id, id));
    await audit(tx, actor.userId, id, "user.reactivate", before, { ...before, active: true });
  });
}

export async function endSessions(headers: Headers, id: string) {
  const actor = await requirePermission(headers, "users.manage");
  await db.transaction(async (tx) => {
    const ended = await tx.delete(session).where(eq(session.userId, id)).returning({ id: session.id });
    await audit(tx, actor.userId, id, "user.sessions_ended", null, { sessions: ended.length });
  });
}

// Written for the first admin (no actor) and when a user sets their own password.
export async function auditNow(actorId: string | null, targetUserId: string, action: string, before: unknown, after: unknown) {
  await audit(db, actorId, targetUserId, action, before, after);
}

async function sendPasswordLink(target: { id: string; email: string; name: string }, kind: "invite" | "reset", send: EmailSender) {
  const ctx = await auth.$context;
  const token = randomBytes(24).toString("base64url");
  // Better Auth's own reset-password token, so /sifre-belirle sets the password through Better Auth.
  await ctx.internalAdapter.createVerificationValue({
    value: target.id,
    identifier: `reset-password:${token}`,
    expiresAt: new Date(Date.now() + (kind === "invite" ? inviteLinkLifetimeMs : resetLinkLifetimeMs)),
  });
  await send(passwordEmail(target, kind, token));
}

async function readAccess(tx: Tx | typeof db, id: string): Promise<Access> {
  const [target] = await tx.select({ deactivatedAt: user.deactivatedAt }).from(user).where(eq(user.id, id));
  if (!target) throw new UserError("Kullanıcı bulunamadı.");
  const [roles, lokasyon] = await Promise.all([
    tx.select({ role: userRole.role }).from(userRole).where(eq(userRole.userId, id)),
    tx.select({ id: userLokasyon.lokasyonId }).from(userLokasyon).where(eq(userLokasyon.userId, id)),
  ]);
  return { ...sorted({ roles: roles.map((r) => r.role), lokasyonIds: lokasyon.map((l) => l.id) }), active: !target.deactivatedAt };
}

function sorted({ roles, lokasyonIds }: { roles: Role[]; lokasyonIds: string[] }) {
  return { roles: [...new Set(roles)].sort(), lokasyonIds: [...new Set(lokasyonIds)].sort() };
}

const isActiveAdmin = (access: Access) => access.active && access.roles.includes("admin");

// Serializes every change that could remove an active admin, so two admins can't remove each other at once.
async function lockAdmins(tx: Tx) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext('artek.active_admins'))`);
}

async function assertAnotherActiveAdmin(tx: Tx, id: string) {
  const others = await tx
    .select({ id: user.id })
    .from(userRole)
    .innerJoin(user, eq(user.id, userRole.userId))
    .where(and(eq(userRole.role, "admin"), isNull(user.deactivatedAt), ne(user.id, id)))
    .limit(1);
  if (others.length === 0) throw new UserError("Son aktif yönetici devre dışı bırakılamaz veya yönetici rolünü kaybedemez.");
}

async function audit(
  tx: Tx | typeof db,
  actorId: string | null,
  targetUserId: string,
  action: string,
  before: unknown,
  after: unknown,
) {
  await tx.insert(auditLog).values({ actorId, targetUserId, action, before, after });
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

