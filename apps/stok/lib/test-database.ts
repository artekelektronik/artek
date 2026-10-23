import path from "node:path";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { Role } from "./permissions";

// Integration tests run against TEST_DATABASE_URL and are skipped, with this reason, without it.
export const skipWithoutDatabase = process.env.TEST_DATABASE_URL ? false : "TEST_DATABASE_URL is not set";

// Points the app's db module at the test database and brings its schema up to date.
// Call before importing anything that imports db.
export async function openTestDatabase() {
  const url = process.env.TEST_DATABASE_URL!;
  // Tests delete data; refuse anything that isn't plainly a test database.
  if (!new URL(url).pathname.includes("test")) throw new Error(`TEST_DATABASE_URL must name a test database: ${new URL(url).pathname}`);
  process.env.DATABASE_URL = url;
  const { db } = await import("../db");
  await migrate(db, { migrationsFolder: path.join(__dirname, "../drizzle") });
  return db;
}

// Empties every table except the seeded Lokasyon, so each suite starts from a known state.
export async function resetTestDatabase() {
  const { db } = await import("../db");
  const { rows } = await db.execute<{ tablename: string }>(
    sql`select tablename from pg_tables where schemaname = 'public' and tablename <> 'lokasyon'`,
  );
  if (rows.length) {
    await db.execute(sql.raw(`truncate ${rows.map((r) => `"${r.tablename}"`).join(", ")} cascade`));
  }
}

export async function lokasyonIdsByName() {
  const { db } = await import("../db");
  const { lokasyon } = await import("../db/schema");
  const rows = await db.select().from(lokasyon);
  return Object.fromEntries(rows.map((row) => [row.name, row.id])) as Record<
    "Çekmeköy İmalathane" | "Karaköy Mağaza",
    string
  >;
}

// Creates a user with these roles and Lokasyon, signs them in through the real auth API,
// and returns request headers carrying that session.
export async function signedInAs(roles: Role[], lokasyonIds: string[] = []) {
  const { createUser } = await import("./users");
  const { auth } = await import("./auth");
  const email = `${roles.join("-") || "rolsuz"}-${crypto.randomUUID()}@example.com`;
  const user = await createUser({ email, name: `Test ${roles.join(", ")}`, password: "a-long-password", roles, lokasyonIds });
  const { headers } = await auth.api.signInEmail({ body: { email, password: "a-long-password" }, returnHeaders: true });
  const cookie = headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
  return { user, headers: new Headers({ cookie }) };
}
