import { after } from "next/server";
import { processOutbox } from "./outbox";

// Sends queued warnings after the response; a failure stays queued for the cron run.
export function sendNotificationsSoon() {
  after(() => processOutbox().catch((error) => console.error("Bildirim gönderilemedi", error)));
}
