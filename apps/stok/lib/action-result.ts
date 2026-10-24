import { revalidatePath } from "next/cache";
import { UserError } from "./errors";
import { Forbidden, NotSignedIn } from "./guard";
import { sendNotificationsSoon } from "./send-soon";

export type ActionState = { error?: string; saved?: boolean } | undefined;

// Refusals a user can act on become a form message; anything else is a real error.
export async function runAction(work: () => Promise<unknown>): Promise<{ error?: string; saved?: boolean }> {
  try {
    await work();
    return { saved: true };
  } catch (error) {
    if (error instanceof UserError || error instanceof Forbidden || error instanceof NotSignedIn) {
      return { error: error.message };
    }
    throw error;
  }
}

// A stock change touches every screen; also sends any Kritik seviye warning it queued.
export async function runStockAction(work: () => Promise<unknown>) {
  const state = await runAction(work);
  if (state.saved) {
    revalidatePath("/", "layout");
    sendNotificationsSoon();
  }
  return state;
}
