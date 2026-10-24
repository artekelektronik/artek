import { z } from "zod";

// A refusal whose message is written for the user (in Turkish) and can be shown as-is.
export class UserError extends Error {}

// Parses input or throws the first problem as a UserError.
export function parseInput<T>(schema: z.ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) throw new UserError(parsed.error.issues[0].message);
  return parsed.data;
}

export const isUuid = (value: unknown): value is string => z.uuid().safeParse(value).success;

// Postgres unique-violation, e.g. a duplicate product code.
export function isUniqueViolation(error: unknown, constraint: string) {
  type PgError = { code?: string; constraint?: string; cause?: PgError };
  const pg = (error as PgError)?.cause ?? (error as PgError);
  return pg?.code === "23505" && pg.constraint === constraint;
}
