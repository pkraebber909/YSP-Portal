import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "ysp-data-test-"));
process.env.YSP_DB_PATH = path.join(temp, "test.sqlite");
const data = await import("../src/lib/db.ts");
const { chrisAndersonClubIds, chrisAndersonAdditionalClubIds } = await import("../src/data/chris-anderson-club-ids.ts");
const { sebastianMaymiClubIds } = await import("../src/data/sebastian-maymi-club-ids.ts");
const { jasonOrtegaClubIds } = await import("../src/data/jason-ortega-club-ids.ts");
const { jordanDeBernardoClubIds } = await import("../src/data/jordan-debernardo-club-ids.ts");

test("seed contains only confirmed Cyclones details and pending assignments", () => {
  const partner = data.getPartner("cyclones");
  assert.equal(partner.organization.name, "Coney Island Cyclones Soccer Club");
  assert.equal(partner.contact.name, "Vlad");
  assert.equal(partner.partnership.rep_name, "Phineas Kraebber");
  assert.equal(partner.partnership.match_id, null);
  assert.equal(partner.partnership.draft_status, "Not started");
  assert.equal(data.listPartnersForRep("phineas").length, 1);
  assert.equal(data.listPartnersForRep("other-rep").length, 0);
  assert.deepEqual(data.listSalesReps().map(rep => [rep.name, rep.partner_count, rep.crm_count]), [
    ["Chris Anderson", 0, 48],
    ["Jason Ortega", 0, 9],
    ["Sebastian Maymi", 0, 3],
    ["Jordan DeBernardo", 0, 3],
    ["Phineas Kraebber", 1, 0],
  ]);
  assert.deepEqual(new Set(data.listCrmClubsForRep("sebastian-maymi").map(club => club.id)), new Set(sebastianMaymiClubIds));
  assert.equal(data.listCrmClubsForRep("sebastian-maymi").length, 3);
  assert.deepEqual(new Set(data.listCrmClubsForRep("jason-ortega").map(club => club.id)), new Set(jasonOrtegaClubIds));
  assert.equal(data.listCrmClubsForRep("jason-ortega").length, 9);
  assert.deepEqual(new Set(data.listCrmClubsForRep("jordan-debernardo").map(club => club.id)), new Set(jordanDeBernardoClubIds));
  assert.equal(data.listCrmClubsForRep("jordan-debernardo").length, 3);
});

test("CRM club assignments appear in the chosen rep's book and persist", async () => {
  assert.equal(chrisAndersonClubIds.length, 45);
  assert.equal(new Set(chrisAndersonClubIds).size, 45);
  assert.deepEqual(new Set(data.listCrmClubsForRep("chris-anderson").map(club => club.id)), new Set([...chrisAndersonClubIds, ...chrisAndersonAdditionalClubIds]));
  assert.equal(data.setCrmRep("directory-albion-sc-brooklyn", "chris-anderson"), true);
  assert.equal(data.setCrmRep("directory-albion-sc-brooklyn", "unknown-rep"), false);
  assert.equal(data.setCrmRep("cyclones", "chris-anderson"), false);
  assert.equal(data.listCrmClubsForRep("chris-anderson").length, 49);
  assert.equal(data.listSalesReps().find(rep => rep.id === "chris-anderson").crm_count, 49);
  assert.equal(data.listPartnersForRep("phineas")[0].name, "Coney Island Cyclones Soccer Club");
  const reopened = await import("../src/lib/db.ts?rep-assignment-reseed");
  assert.equal(reopened.getCrmClub("directory-albion-sc-brooklyn").assigned_rep_name, "Chris Anderson");
  assert.equal(reopened.setCrmRep("06-united-new-york", null), true);
  const reopenedAgain = await import("../src/lib/db.ts?rep-unassignment-reseed");
  assert.equal(reopenedAgain.getCrmClub("06-united-new-york").assigned_rep_id, null);
  assert.equal(reopenedAgain.listCrmClubsForRep("chris-anderson").length, 48);
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
