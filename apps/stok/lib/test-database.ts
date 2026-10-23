import path from "node:path";
import { migrate } from "drizzle-orm/node-postgres/migrator";

// Integration tests run against TEST_DATABASE_URL and are skipped, with this reason, without it.
export const skipWithoutDatabase = process.env.TEST_DATABASE_URL ? false : "TEST_DATABASE_URL is not set";

// Points the app's db module at the test database and brings its schema up to date.
// Call before importing anything that imports db.
export async function openTestDatabase() {
  const url = process.env.TEST_DATABASE_URL!;
  // Tests delete users; refuse anything that isn't plainly a test database.
  if (!new URL(url).pathname.includes("test")) throw new Error(`TEST_DATABASE_URL must name a test database: ${new URL(url).pathname}`);
  process.env.DATABASE_URL = url;
  const { db } = await import("../db");
  await migrate(db, { migrationsFolder: path.join(__dirname, "../drizzle") });
  return db;
}
