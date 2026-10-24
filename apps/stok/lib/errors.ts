// A refusal whose message is written for the user (in Turkish) and can be shown as-is.
export class UserError extends Error {}

// Postgres unique-violation, e.g. a duplicate product code.
export function isUniqueViolation(error: unknown, constraint: string) {
  const cause = (error as { cause?: { code?: string; constraint?: string } })?.cause ?? error;
  const pg = cause as { code?: string; constraint?: string };
  return pg?.code === "23505" && pg.constraint === constraint;
}
