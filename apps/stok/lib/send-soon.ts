import { after } from "next/server";
import { processOutbox } from "./outbox";

// After a stock change commits, send any warning it queued once the response is out.
// A failure here only leaves the email in the outbox for the next run.
export function sendNotificationsSoon() {
  after(() => processOutbox().catch((error) => console.error("Bildirim gönderilemedi", error)));
}
