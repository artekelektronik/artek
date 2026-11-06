import { asc } from "drizzle-orm";
import { cache } from "react";
import { db } from "../db";
import { lokasyon } from "../db/schema";

// Once per request: several loaders on one page ask for it.
export const listLokasyon = cache(async () => db.select().from(lokasyon).orderBy(asc(lokasyon.name)));
