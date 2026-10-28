// Pure: how the assistant may reach a customer. No database import, so tests can load it directly.

export type Candidate = {
  id: string;
  phone: string | null;
  email: string | null;
  emailOptOutAt: Date | null;
  followUpChannel: "telefon" | "eposta";
};

// Email only where there is an address and no opt-out; otherwise a call, and nothing when there is no way to reach them.
export function channelFor(c: Candidate, wanted: "telefon" | "eposta"): "arama" | "eposta" | null {
  const canEmail = Boolean(c.email) && !c.emailOptOutAt;
  if (wanted === "eposta" && canEmail) return "eposta";
  if (c.phone) return "arama";
  return canEmail ? "eposta" : null;
}
