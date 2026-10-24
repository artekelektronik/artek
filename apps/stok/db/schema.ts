import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  uniqueIndex,
  integer,
  numeric,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Better Auth core tables (user, session, account, verification).

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  // Set by an admin; a deactivated user can't sign in. Users are never deleted, so their history keeps their name.
  deactivatedAt: timestamp("deactivated_at", { withTimezone: true }),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Login attempts per client, shared by every serverless instance.
export const rateLimit = pgTable("rate_limit", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});

// Roles are fixed in code; which users hold them, and where they may act, is data.

export const role = pgEnum("role", ["admin", "muhendis", "magaza_sorumlusu", "depo_sorumlusu"]);

export const lokasyon = pgTable("lokasyon", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  // Set when the Açılış sayımı is approved; before that no other movement is recorded here.
  openedAt: timestamp("opened_at", { withTimezone: true }),
});

export const userRole = pgTable(
  "user_role",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: role("role").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.role] })],
);

export const userLokasyon = pgTable(
  "user_lokasyon",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lokasyonId: uuid("lokasyon_id")
      .notNull()
      .references(() => lokasyon.id),
  },
  (t) => [primaryKey({ columns: [t.userId, t.lokasyonId] })],
);

// Products. One unit per product, no conversions.

export const unit = pgEnum("unit", ["adet", "takim", "rulo", "kg", "metre"]);

export type Datasheet = { label: string; url: string };

export const product = pgTable(
  "product",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    isTradeGoods: boolean("is_trade_goods").notNull(), // Ticari mal
    isMaterial: boolean("is_material").notNull(), // Malzeme
    unit: unit("unit").notNull(),
    showOnSite: boolean("show_on_site").notNull(),
    // Kritik seviye: the company total below which admin and mühendis are warned. Never blocks anything.
    minLevel: numeric("min_level", { precision: 14, scale: 3 }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    // Public details the Vitrin shows.
    productType: text("product_type"),
    subCategory: text("sub_category"),
    manufacturer: text("manufacturer"),
    manufacturerCode: text("manufacturer_code"),
    supplier: text("supplier"),
    supplierCountry: text("supplier_country"),
    description: text("description"),
    images: text("images").array().notNull().default(sql`'{}'::text[]`),
    datasheets: jsonb("datasheets").$type<Datasheet[]>().notNull().default([]),
    // The site JSON record this product was imported from, so the import can run again safely.
    importKey: text("import_key").unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check("product_has_type", sql`${t.isTradeGoods} OR ${t.isMaterial}`)],
);

// Raf kodu: where a product sits inside a Lokasyon. Helps finding and counting; stock is never per shelf.
export const productShelf = pgTable(
  "product_shelf",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id),
    lokasyonId: uuid("lokasyon_id")
      .notNull()
      .references(() => lokasyon.id),
    rafKodu: text("raf_kodu").notNull(),
  },
  (t) => [primaryKey({ columns: [t.productId, t.lokasyonId] })],
);

// Stock ledger. Balances change only through movements; movements are never edited or deleted.

const quantity = (name: string) => numeric(name, { precision: 14, scale: 3 });

export const documentKind = pgEnum("document_kind", [
  "mal_kabul",
  "stok_cikisi",
  "transfer_sevk",
  "transfer_teslim",
  "sayim",
  "acilis",
  "ters_kayit",
]);

export const movementType = pgEnum("movement_type", [
  "acilis",
  "mal_kabul",
  "transfer_sevk",
  "transfer_teslim",
  "transfer_kaybi",
  "satis_teslimati",
  "uretim_tuketimi",
  "fire",
  "sayim_duzeltmesi",
]);

// One user action that produced movements: a mal kabul, a stock-out, a transfer step, an approved count.
export const stockDocument = pgTable("stock_document", {
  id: uuid("id").primaryKey().defaultRandom(),
  kind: documentKind("kind").notNull(),
  lokasyonId: uuid("lokasyon_id").references(() => lokasyon.id),
  supplier: text("supplier"),
  reference: text("reference"),
  reason: text("reason"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  // Sent with the form; a retry or double click with the same key records nothing new.
  idempotencyKey: text("idempotency_key").notNull().unique(),
});

export const stockMovement = pgTable(
  "stock_movement",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => stockDocument.id),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id),
    // Null while the quantity is on the way in a Transfer: it belongs to neither Lokasyon.
    lokasyonId: uuid("lokasyon_id").references(() => lokasyon.id),
    transferId: uuid("transfer_id"),
    type: movementType("type").notNull(),
    quantity: quantity("quantity").notNull(), // signed: in > 0, out < 0
    unit: unit("unit").notNull(),
    reason: text("reason"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    reversesId: uuid("reverses_id").unique(),
  },
  (t) => [
    check("movement_not_zero", sql`${t.quantity} <> 0`),
    index("movement_product_idx").on(t.productId, t.createdAt),
    index("movement_lokasyon_idx").on(t.lokasyonId, t.createdAt),
  ],
);

// One pile per product per Lokasyon (ADR-0003). Available = physical − reserved, never below zero.
export const stock = pgTable(
  "stock",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id),
    lokasyonId: uuid("lokasyon_id")
      .notNull()
      .references(() => lokasyon.id),
    physical: quantity("physical").notNull().default("0"),
    reserved: quantity("reserved").notNull().default("0"),
  },
  (t) => [
    primaryKey({ columns: [t.productId, t.lokasyonId] }),
    check("stock_available_not_negative", sql`${t.physical} >= ${t.reserved} AND ${t.reserved} >= 0`),
  ],
);

// Transfer between Lokasyon: sevk takes stock out of the source, teslim alma puts what arrived into
// the target and closes any shortfall as a loss right there. No long-lived partial state.

export const transferStatus = pgEnum("transfer_status", ["yolda", "teslim_alindi"]);
export const lossReason = pgEnum("loss_reason", ["kayip", "hasarli"]);

export const transfer = pgTable(
  "transfer",
  {
    id: uuid("id").primaryKey(),
    fromLokasyonId: uuid("from_lokasyon_id")
      .notNull()
      .references(() => lokasyon.id),
    toLokasyonId: uuid("to_lokasyon_id")
      .notNull()
      .references(() => lokasyon.id),
    status: transferStatus("status").notNull().default("yolda"),
    note: text("note"),
    sendDocumentId: uuid("send_document_id")
      .notNull()
      .references(() => stockDocument.id),
    sentBy: text("sent_by")
      .notNull()
      .references(() => user.id),
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
    receiveDocumentId: uuid("receive_document_id").references(() => stockDocument.id),
    receivedBy: text("received_by").references(() => user.id),
    receivedAt: timestamp("received_at", { withTimezone: true }),
  },
  (t) => [check("transfer_between_two_lokasyon", sql`${t.fromLokasyonId} <> ${t.toLokasyonId}`)],
);

export const transferLine = pgTable(
  "transfer_line",
  {
    transferId: uuid("transfer_id")
      .notNull()
      .references(() => transfer.id),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id),
    sent: quantity("sent").notNull(),
    received: quantity("received"),
    lost: quantity("lost"),
    lossReason: lossReason("loss_reason"),
  },
  (t) => [primaryKey({ columns: [t.transferId, t.productId] })],
);

// Sayım without locks: each line stores what was counted, when, and the balance at that moment,
// so movements after the count don't distort the difference. Approval applies it once.

export const countKind = pgEnum("count_kind", ["sayim", "acilis"]);
export const countStatus = pgEnum("count_status", ["taslak", "onaylandi", "iptal"]);

export const stockCount = pgTable(
  "stock_count",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    lokasyonId: uuid("lokasyon_id")
      .notNull()
      .references(() => lokasyon.id),
    kind: countKind("kind").notNull(),
    status: countStatus("status").notNull().default("taslak"),
    category: text("category"), // null: every active product
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    approvedBy: text("approved_by").references(() => user.id),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    approveDocumentId: uuid("approve_document_id").references(() => stockDocument.id),
    cancelledBy: text("cancelled_by").references(() => user.id),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  },
  // Each Lokasyon has exactly one approved Açılış sayımı.
  (t) => [
    uniqueIndex("one_opening_per_lokasyon")
      .on(t.lokasyonId)
      .where(sql`${t.kind} = 'acilis' AND ${t.status} = 'onaylandi'`),
  ],
);

export const stockCountLine = pgTable(
  "stock_count_line",
  {
    countId: uuid("count_id")
      .notNull()
      .references(() => stockCount.id),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id),
    rafKodu: text("raf_kodu"), // copied when the session opens, to sort the sheet
    counted: quantity("counted"),
    balanceAtCount: quantity("balance_at_count"),
    countedAt: timestamp("counted_at", { withTimezone: true }),
    countedBy: text("counted_by").references(() => user.id),
  },
  (t) => [primaryKey({ columns: [t.countId, t.productId] })],
);

// Email outbox: written in the same transaction as the movement that caused it, sent afterwards.
// A Resend failure never undoes a movement, and the notification id is Resend's idempotency key.

export const notificationStatus = pgEnum("notification_status", ["pending", "sent", "failed"]);

export const notification = pgTable(
  "notification",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: text("kind").notNull(), // "kritik_seviye"
    productId: uuid("product_id").references(() => product.id),
    documentId: uuid("document_id").references(() => stockDocument.id),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    recipients: text("recipients").array().notNull(),
    status: notificationStatus("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    lastError: text("last_error"),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
  },
  (t) => [index("notification_due_idx").on(t.status, t.nextAttemptAt)],
);

// Which roles receive Kritik seviye warnings; changed by an admin.
export const notificationSetting = pgTable("notification_setting", {
  key: text("key").primaryKey(),
  roles: role("roles").array().notNull(),
});

// Every change to a user, their roles or their Lokasyon: who, when, and the state before and after.
export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: text("actor_id").references(() => user.id), // null for the first-admin script
    targetUserId: text("target_user_id")
      .notNull()
      .references(() => user.id),
    action: text("action").notNull(), // e.g. "user.invite", "user.access", "user.deactivate"
    before: jsonb("before"),
    after: jsonb("after"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_log_target_idx").on(t.targetUserId, t.createdAt)],
);
