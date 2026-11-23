// Receives the site's quote form and forwards it to Artek Stok, which saves it and emails the company inbox.
// TALEPLER_TOKEN must match the one set in the stok project; STOK_URL is only overridden for local runs.
export async function POST(request: Request) {
  const form = await request.formData();
  // Bots fill every field; people never see this one. Answer as if it worked.
  if (form.get("website")) return Response.json({ ok: true });
  form.delete("website");

  const token = process.env.TALEPLER_TOKEN?.trim();
  if (!token) return Response.json({ error: "unavailable" }, { status: 503 });
  const stok = (process.env.STOK_URL || "https://stok.ferritnuve.com").replace(/\/+$/, "");
  try {
    const response = await fetch(`${stok}/api/talepler`, { method: "POST", body: form, headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(20_000) });
    if (response.ok) return Response.json({ ok: true });
    // 400 carries a reason the visitor can fix (a missing field, a wrong file type).
    if (response.status === 400) return Response.json({ error: (await response.json()).error }, { status: 400 });
    console.error("Talep iletilemedi", response.status);
  } catch (error) {
    console.error("Talep iletilemedi", error);
  }
  return Response.json({ error: "unavailable" }, { status: 502 });
}
