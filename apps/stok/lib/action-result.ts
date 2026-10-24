import { UserError } from "./errors";
import { Forbidden, NotSignedIn } from "./guard";

export type ActionState = { error?: string; saved?: boolean } | undefined;

// Turns the refusals a user can act on into a message for the form; anything else is a real error.
export async function runAction(work: () => Promise<void>): Promise<ActionState> {
  try {
    await work();
    return undefined;
  } catch (error) {
    if (error instanceof UserError || error instanceof Forbidden || error instanceof NotSignedIn) {
      return { error: error.message };
    }
    throw error;
  }
}
