import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

// The pool connects lazily, so importing this during `next build` needs no database.
export const db = drizzle(process.env.DATABASE_URL!, { schema });
