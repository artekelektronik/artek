export type Email = { to: string[]; subject: string; text: string; idempotencyKey: string };
export type EmailSender = (email: Email) => Promise<void>;

// Resend drops repeats with the same Idempotency-Key, so a retry never sends twice.
export const resendSender: EmailSender = async (email) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) throw new Error("RESEND_API_KEY veya RESEND_FROM tanımlı değil.");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
      "idempotency-key": email.idempotencyKey,
    },
    body: JSON.stringify({ from, to: email.to, subject: email.subject, text: email.text }),
    // The outbox row stays locked while this runs, so a hung request must not hold it.
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Resend ${response.status}: ${(await response.text()).slice(0, 300)}`);
};
