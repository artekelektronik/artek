import assert from "node:assert/strict";
import { test } from "node:test";
import { can } from "./permissions";

const karakoy = "karakoy-id";
const cekmekoy = "cekmekoy-id";

test("admin and mühendis act in every Lokasyon without being assigned to it", () => {
  for (const role of ["admin", "muhendis"] as const) {
    const actor = { roles: [role], lokasyonIds: [] };
    assert.equal(can(actor, "stock.receive", cekmekoy), true, role);
    assert.equal(can(actor, "count.approve", karakoy), true, role);
    assert.equal(can(actor, "products.manage"), true, role);
  }
});

test("only admin manages users", () => {
  assert.equal(can({ roles: ["admin"], lokasyonIds: [] }, "users.manage"), true);
  for (const role of ["muhendis", "magaza_sorumlusu", "depo_sorumlusu"] as const) {
    assert.equal(can({ roles: [role], lokasyonIds: [karakoy] }, "users.manage"), false, role);
  }
});

test("the Müşteri and Finans panels need the admin role and a permission given by name", () => {
  const admin = { roles: ["admin" as const], lokasyonIds: [] };
  assert.equal(can(admin, "crm.view"), false, "admin role alone opens nothing");
  assert.equal(can(admin, "finance.view"), false);

  const viewer = { ...admin, panels: { musteri: "gorur" as const } };
  assert.equal(can(viewer, "crm.view"), true);
  assert.equal(can(viewer, "crm.edit"), false);
  assert.equal(can(viewer, "finance.view"), false, "one panel doesn't open the other");

  const editor = { ...admin, panels: { finans: "duzenler" as const } };
  assert.equal(can(editor, "finance.view"), true);
  assert.equal(can(editor, "finance.edit"), true);

  // A permission left behind after the admin role is taken away opens nothing.
  assert.equal(can({ roles: ["muhendis"], lokasyonIds: [], panels: { musteri: "duzenler", finans: "duzenler" } }, "crm.view"), false);
});

test("mağaza and depo sorumlusu act only in their own Lokasyon", () => {
  for (const role of ["magaza_sorumlusu", "depo_sorumlusu"] as const) {
    const actor = { roles: [role], lokasyonIds: [karakoy] };
    for (const action of ["stock.view", "stock.receive", "stock.transfer", "stock.out", "count.perform"] as const) {
      assert.equal(can(actor, action, karakoy), true, `${role} ${action} own`);
      assert.equal(can(actor, action, cekmekoy), false, `${role} ${action} other`);
      assert.equal(can(actor, action), false, `${role} ${action} without Lokasyon`);
    }
    assert.equal(can(actor, "products.view"), true, role);
    assert.equal(can(actor, "products.manage"), false, role);
    assert.equal(can(actor, "count.approve", karakoy), false, role);
    assert.equal(can(actor, "stock.reverse", karakoy), false, role);
  }
});

test("a user with no roles can do nothing", () => {
  assert.equal(can({ roles: [], lokasyonIds: [karakoy] }, "products.view"), false);
  assert.equal(can({ roles: [], lokasyonIds: [karakoy] }, "stock.receive", karakoy), false);
});
