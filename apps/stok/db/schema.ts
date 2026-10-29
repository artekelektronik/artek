import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  date,
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
  // Deactivated users can't sign in; users are never deleted, so history keeps their name.
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

// One unit per product, no conversions.

export const unit = pgEnum("unit", ["adet", "takim", "rulo", "kg", "metre"]);

type Datasheet = { label: string; url: string };

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
    // Kritik seviye: company total below which an email warns; never blocks anything.
    minLevel: numeric("min_level", { precision: 14, scale: 3 }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    // Descriptive details; the Vitrin gets a subset (packages/catalog), never the supplier.
    productType: text("product_type"),
    subCategory: text("sub_category"),
    manufacturer: text("manufacturer"),
    manufacturerCode: text("manufacturer_code"),
    supplier: text("supplier"),
    supplierCountry: text("supplier_country"),
    description: text("description"),
    images: text("images").array().notNull().default(sql`'{}'::text[]`),
    datasheets: jsonb("datasheets").$type<Datasheet[]>().notNull().default([]),
    // The site record this was imported from, so the import can run again.
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

// Sevk takes stock out of the source; teslim alma books what arrived and closes any shortfall as a loss.

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

// Sayım lines keep the balance at count time, so later movements don't skew the difference.

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

// Outbox written in the movement's transaction; a send failure never undoes stock, and the id is the idempotency key.

export const notificationStatus = pgEnum("notification_status", ["pending", "sent", "failed"]);

export const notification = pgTable(
  "notification",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: text("kind").notNull(), // "kritik_seviye", "fatura_hatirlatma", "crm_takip"
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

// Sales invoices read from QNB Dijital Köprü PDFs. Artek issues invoices there; this app only reads them,
// for the Finans and Müşteri panels. Only admins given a panel permission (user_panel) see either.

// The owner's private panels. An admin role alone opens neither; each is granted per user.
export const panel = pgEnum("panel", ["musteri", "finans"]);
export const panelLevel = pgEnum("panel_level", ["gorur", "duzenler"]);

export const userPanel = pgTable(
  "user_panel",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    panel: panel("panel").notNull(),
    level: panelLevel("level").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.panel] })],
);

// Where a CRM follow-up stands; set by hand on the customer card.
export const customerStatus = pgEnum("customer_status", [
  "aranacak",
  "arandi",
  "ulasilamadi",
  "teklif_verildi",
  "siparis_geldi",
  "ilgilenmiyor",
  "kapandi", // the business closed; never suggested again
]);

// How the next follow-up is made; the morning assistant suggests a call or drafts an email accordingly.
export const followUpChannel = pgEnum("follow_up_channel", ["telefon", "eposta"]);

// One row per buyer, keyed by the VKN / TCKN on its invoices.
export const customer = pgTable("customer", {
  id: uuid("id").primaryKey().defaultRandom(),
  taxId: text("tax_id").notNull().unique(),
  taxIdType: text("tax_id_type").notNull(), // "VKN" (company) or "TCKN" (şahıs)
  name: text("name").notNull(),
  city: text("city").notNull().default(""),
  district: text("district").notNull().default(""),
  // Business contact routes from the company's own site or an official directory; never guessed.
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  about: text("about"),
  contactSource: text("contact_source"),
  status: customerStatus("status").notNull().default("aranacak"),
  nextFollowUpOn: date("next_follow_up_on", { mode: "string" }),
  followUpChannel: followUpChannel("follow_up_channel").notNull().default("telefon"),
  // Asked not to get emails ("istemiyorum"); the assistant never drafts one for them again.
  emailOptOutAt: timestamp("email_opt_out_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const customerNote = pgTable(
  "customer_note",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customer.id),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("customer_note_customer_idx").on(t.customerId, t.createdAt)],
);

// The ETTN is unique per invoice in GİB, so uploading the same invoice twice adds nothing.
export const invoice = pgTable(
  "invoice",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ettn: uuid("ettn").notNull().unique(),
    number: text("number").notNull(), // e-Fatura and e-Arşiv number in separate series
    issuedOn: date("issued_on", { mode: "string" }).notNull(),
    scenario: text("scenario").notNull(), // TEMELFATURA (e-Fatura) or EARSIVFATURA (e-Arşiv)
    type: text("type").notNull(), // SATIS, IADE, ISTISNA …; IADE is left out of sales
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customer.id),
    netAmount: numeric("net_amount", { precision: 14, scale: 2 }).notNull(), // KDV hariç
    totalAmount: numeric("total_amount", { precision: 14, scale: 2 }).notNull(),
    fileName: text("file_name").notNull(),
    fileSha256: text("file_sha256").notNull(),
    // The PDF's text, so a better parser can re-read it; the PDF itself is not kept.
    rawText: text("raw_text").notNull(),
    uploadedBy: text("uploaded_by")
      .notNull()
      .references(() => user.id),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("invoice_issued_idx").on(t.issuedOn), index("invoice_customer_idx").on(t.customerId)],
);

export const invoiceLine = pgTable(
  "invoice_line",
  {
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoice.id),
    seq: integer("seq").notNull(),
    description: text("description").notNull(), // as typed on the invoice
    productName: text("product_name").notNull(), // spelling-normalized, for grouping
    productGroup: text("product_group").notNull(),
    quantity: numeric("quantity", { precision: 14, scale: 3 }).notNull(),
    unit: text("unit").notNull(),
    unitPrice: numeric("unit_price", { precision: 14, scale: 4 }).notNull(),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.invoiceId, t.seq] })],
);

// The morning assistant's suggestions: call this customer and ask this, or send this email. Nothing goes out
// until a person approves it on the Bugün screen.
export const suggestionKind = pgEnum("suggestion_kind", ["arama", "eposta"]);

// What closing a suggestion with a reason does to the Müşteri: never again (closed down / not interested),
// suggest again after `days`, or just a note.
export const closeEffect = pgEnum("close_effect", ["kapandi", "ilgilenmiyor", "tekrar", "not"]);

// Why a suggestion couldn't be done; people edit the list. Removed ones are archived, so old suggestions keep their label.
export const closeReason = pgTable(
  "close_reason",
  {
    id: text("id").primaryKey(), // the starting reasons have readable ids ("kapandi"); new ones a uuid
    label: text("label").notNull(),
    effect: closeEffect("effect").notNull(),
    days: integer("days"),
    sortOrder: integer("sort_order").notNull().default(0),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (t) => [check("close_reason_days_check", sql`(${t.effect} = 'tekrar') = (${t.days} is not null) and (${t.days} is null or ${t.days} between 1 and 365)`)],
);

// What the assistant read in a free note, for a person to apply or reject.
export type NoteProposal = { effect: "kapandi" | "ilgilenmiyor" | "tekrar" | "not"; days: number | null; newName: string | null; explanation: string };
// "atlandi" is only on suggestions closed before every close needed a reason.
export const suggestionStatus = pgEnum("suggestion_status", [
  "bekliyor",
  "gonderildi",
  "yapildi",
  "atlandi",
  "basarisiz",
  "yapilamadi",
  "ertelendi",
  "onay_bekliyor",
]);

type Finding = { title: string; url: string; summary: string };

export const assistantSuggestion = pgTable(
  "assistant_suggestion",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customer.id),
    forDay: date("for_day", { mode: "string" }).notNull(), // Istanbul day it was prepared for
    kind: suggestionKind("kind").notNull(),
    reason: text("reason").notNull(), // why this customer today, in one sentence
    talkingPoints: text("talking_points").array().notNull().default(sql`'{}'::text[]`), // what to ask on the call
    subject: text("subject"),
    body: text("body"),
    findings: jsonb("findings").$type<Finding[]>().notNull().default([]), // what it found online, with links
    status: suggestionStatus("status").notNull().default("bekliyor"),
    scheduled: boolean("scheduled").notNull().default(false), // a person set this Takip date; otherwise the assistant picked it
    doneOn: date("done_on", { mode: "string" }), // when the email went or the call was made
    closeReason: text("close_reason").references(() => closeReason.id), // why it couldn't be done
    closeNote: text("close_note"),
    proposal: jsonb("proposal").$type<NoteProposal>(), // what the assistant made of closeNote
    proposalDecidedAt: timestamp("proposal_decided_at", { withTimezone: true }),
    waitingFor: text("waiting_for"), // onay_bekliyor: what we wait for
    askAgainOn: date("ask_again_on", { mode: "string" }), // onay_bekliyor: when Bugün asks "Onaylandı mı?" again
    error: text("error"),
    model: text("model"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    decidedBy: text("decided_by").references(() => user.id),
  },
  (t) => [uniqueIndex("assistant_suggestion_customer_day_idx").on(t.customerId, t.forDay), index("assistant_suggestion_day_idx").on(t.forDay)],
);
