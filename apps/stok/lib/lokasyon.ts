import { asc } from "drizzle-orm";
import { db } from "../db";
import { lokasyon } from "../db/schema";

export function listLokasyon() {
  return db.select().from(lokasyon).orderBy(asc(lokasyon.name));
}
