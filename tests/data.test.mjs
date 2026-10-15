import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "ysp-data-test-"));
process.env.YSP_DB_PATH = path.join(temp, "test.sqlite");
const data = await import("../src/lib/db.ts");

test("seed contains only confirmed Cyclones details and pending assignments", () => {
  const partner = data.getPartner("cyclones");
  assert.equal(partner.organization.name, "Coney Island Cyclones Soccer Club");
  assert.equal(partner.contact.name, "Vlad");
  assert.equal(partner.partnership.rep_name, "Phineas Kraebber");
  assert.equal(partner.partnership.match_id, null);
  assert.equal(partner.partnership.draft_status, "Not started");
  assert.equal(data.listPartnersForRep("phineas").length, 1);
  assert.equal(data.listPartnersForRep("other-rep").length, 0);
});

test("partner projection excludes internal communications and files", () => {
  data.addCommunication("cyclones", "Rep", "Share with club", "partner");
  data.addCommunication("cyclones", "Rep", "Private servicing note", "internal");
  const sharedId = data.addFile("cyclones", "instructions.pdf", "shared-stored", "application/pdf", 3, "partner");
  const privateId = data.addFile("cyclones", "internal.pdf", "private-stored", "application/pdf", 3, "internal");
  const rep = data.getPartner("cyclones");
  const partner = data.getPartner("cyclones", true);
  assert.equal(rep.communications.length, 2);
  assert.equal(rep.files.length, 2);
  assert.deepEqual(partner.communications.map(c => c.body), ["Share with club"]);
  assert.deepEqual(partner.files.map(f => f.id), [sharedId]);
  data.setFileVisibility("cyclones", privateId, "partner");
  assert.equal(data.getPartner("cyclones", true).files.length, 2);
});

test("requirement updates stay within the requested organization", () => {
  assert.equal(data.setRequirement("another-club", "contact", true), 0);
  assert.equal(data.getPartner("cyclones").requirements[0].completed_at, null);
  assert.equal(data.setRequirement("cyclones", "contact", true), 1);
  assert.ok(data.getPartner("cyclones", true).requirements[0].completed_at);
});
