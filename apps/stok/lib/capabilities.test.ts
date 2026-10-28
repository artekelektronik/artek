import assert from "node:assert/strict";
import { test } from "node:test";
import { capabilitiesOf } from "./capabilities";

const lokasyon = [
  { id: "k", name: "Karaköy Mağaza" },
  { id: "c", name: "Çekmeköy İmalathane" },
];
const grant = (caps: ReturnType<typeof capabilitiesOf>, key: string) => caps.find((c) => c.key === key)!.grant;

test("a mağaza sorumlusu works only in their own Lokasyon and sees no panel", () => {
  const caps = capabilitiesOf({ roles: ["magaza_sorumlusu"], lokasyonIds: ["k"], active: true }, lokasyon);
  assert.deepEqual(grant(caps, "stokIslem"), { kind: "some", text: "Karaköy" });
  assert.equal(grant(caps, "sayimOnay").kind, "none");
  assert.deepEqual(grant(caps, "urun"), { kind: "some", text: "Görür" });
  assert.equal(grant(caps, "musteri").kind, "none");
});

test("an admin sees the panels only when given them", () => {
  const plain = capabilitiesOf({ roles: ["admin"], lokasyonIds: [], active: true }, lokasyon);
  assert.equal(grant(plain, "stokIslem").text, "Tümü");
  assert.equal(grant(plain, "finans").kind, "none");
  const granted = capabilitiesOf({ roles: ["admin"], lokasyonIds: [], panels: { finans: "gorur", musteri: "duzenler" }, active: true }, lokasyon);
  assert.equal(grant(granted, "finans").text, "Görür");
  assert.equal(grant(granted, "musteri").text, "Düzenler");
});

test("a deactivated user can do nothing", () => {
  const caps = capabilitiesOf({ roles: ["admin"], lokasyonIds: [], panels: { finans: "duzenler" }, active: false }, lokasyon);
  assert.ok(caps.every((c) => c.grant.kind === "none"));
});
