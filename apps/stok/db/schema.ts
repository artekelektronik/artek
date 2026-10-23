import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  integer,
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
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    // Public details the Vitrin shows.
    productType: text("product_type"),
    subCategory: text("sub_category"),
    manufacturer: text("manufacturer"),
    manufacturerCode: text("manufacturer_code"),
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
