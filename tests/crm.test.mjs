import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "ysp-crm-test-"));
process.env.YSP_DB_PATH = path.join(temp, "test.sqlite");
const data = await import("../src/lib/db.ts");
const { chrisAndersonContacts } = await import("../src/data/chris-anderson-contacts.ts");

test("Chris Anderson contact batch appears on the right club pages without duplicating Andy Chan", () => {
  const raw = new DatabaseSync(process.env.YSP_DB_PATH);
  const counts = raw.prepare("SELECT COUNT(*) AS contacts,COUNT(DISTINCT organization_id) AS clubs FROM crm_contacts").get();
  assert.equal(counts.contacts, 75);
  assert.equal(counts.clubs, 45);
  for (const [orgId, , email] of chrisAndersonContacts) {
    assert.ok(data.listCrmPrimaryContacts(orgId).some(contact => contact.email === email), `${email} belongs to ${orgId}`);
    assert.equal(data.getCrmClub(orgId).assigned_rep_name, "Chris Anderson");
  }
  assert.equal(data.listCrmPrimaryContacts("hlsc").length, 3);
  assert.equal(data.listCrmPrimaryContacts("chronis-elite").length, 3);
  assert.equal(data.listCrmPrimaryContacts("soccer-shots").length, 3);
  assert.equal(data.listCrmPrimaryContacts("06-united-new-york").length, 1);
  assert.equal(data.listCrmPrimaryContacts("06-united-new-york")[0].name, "Andy Chan");
  assert.equal(data.listCrmPrimaryContacts("hlsc")[0].ticketing_id, null);
  raw.close();
});

test("CRM keeps current YSPs, imports distinct workbook clubs without contacts, and resolves installed logos", () => {
  const clubs = data.listCrmClubs();
  assert.equal(clubs.length, 643);
  assert.equal(clubs.filter(club => club.segment === "current_ysp").length, 70);
  assert.equal(clubs.filter(club => club.segment === "directory").length, 573);
  assert.equal(new Set(clubs.map(club => club.id)).size, clubs.length);
  for (const name of ["06 United", "AAFNY", "Alliance Athletics", "Alta FC", "SC GJOA", "Y4YFC", "Brooklyn Hares Football Club", "Soccer Kids NYC", "SYSL", "Little Neck Douglaston"]) {
    assert.ok(clubs.some(club => club.name === name), `${name} is in the directory`);
  }
  assert.ok(!clubs.some(club => club.id === "academy-argentina"));
  assert.equal(data.getCrmClub("epsc").assigned_rep_name, "Chris Anderson");
  assert.equal(data.getCrmClub("brooklyn-hares-football-club").segment, "current_ysp");
  assert.equal(data.getCrmClub("imperio-new-york").segment, "current_ysp");
  assert.equal(data.getCrmClub("imperio-new-york").name, "Imperio Morelia New York");
  for (const id of ["corona-soccer-kids-fc", "guerreros-fc", "new-york-talentos", "soccer-friends-usa", "soccer-kids-nyc"]) {
    assert.equal(data.getCrmClub(id).segment, "directory");
    assert.ok(data.getCrmClub(id).logo_path);
  }
  assert.equal(data.getCrmClub("directory-albion-sc-brooklyn").area, "Brooklyn");
  assert.equal(data.getCrmClub("directory-albion-sc-brooklyn").area_basis, "Club name (provisional)");
  assert.match(data.getCrmClub("directory-albion-sc-brooklyn").sources, /CJSL/);
  assert.equal(data.getCrmClub("asteras").segment, "current_ysp");
  assert.match(data.getCrmClub("asteras").sources, /EDP North Atlantic/);
  assert.ok(data.getCrmClub("directory-griffin-united-soccer-club"));
  assert.equal(clubs.filter(club => club.name.toLowerCase() === "griffin united soccer club").length, 1);
  assert.ok(data.getCrmClub("peruvian-soccer-academy"));
  assert.deepEqual(data.listCrmPrimaryContacts("06-united-new-york").map(contact => ({ ...contact })), [{
    id: "06-united-andy-chan", name: "Andy Chan", email: "andy.chan@06united.com", phone: "(718) 760-0280", ticketing_id: "1540097"
  }]);
  assert.equal(data.getCrmClub("aafny").logo_path, "/club-logos/academy-argentina.webp");
  for (const [id, file] of [
    ["alliance-athletics", "alliance-athletics.png"],
    ["asteras", "asteras.png"],
    ["bayshore-soccer", "bayshore-soccer.webp"],
    ["bethpage-pal", "bethpage-pal.png"],
    ["byram-hills-sc", "byram-hills-sc.png"],
    ["cement-football", "cement-football.jpg"],
    ["chronis-elite", "chronis-elite.png"],
    ["cjsl", "cjsl.png"],
    ["commack-soccer", "commack-soccer.png"],
    ["community-sc", "community-sc.png"],
    ["croton-ayso", "croton-ayso.webp"],
    ["dkay-henry-soccer-training", "dkay-henry-soccer-training.webp"],
    ["eastern-fc", "eastern-fc.webp"],
    ["epsc", "eleftheria-pancyprian.webp"],
    ["eysa", "eysa.png"],
    ["fc-la-isla", "fc-la-isla.png"],
    ["fox-soccer", "fox-soccer.png"],
    ["hlsc", "hlsc.webp"],
    ["jigs-soccer", "jigs-soccer.png"],
    ["joga-bonito", "joga-bonito.png"],
    ["levittown-soccer-club", "levittown-soccer-club.webp"],
    ["liitle-neck-douglaston", "little-neck-douglaston.png"],
    ["lindenhurst-soccer-club", "lindenhurst-soccer-club.png"],
    ["portchester", "portchester.png"],
    ["nj-santos", "nj-santos.png"],
    ["no-limits", "no-limits.png"],
    ["ocsc", "ocsc.png"],
    ["mt-pleasant-ayso", "mt-pleasant-ayso.png"],
    ["new-hyde-park-wildcats-soccer-club", "new-hyde-park-wildcats-soccer-club.png"],
    ["ossining-ayso", "ossining-ayso.png"],
    ["peruvian-soccer-academy", "peruvian-american-soccer-nyc.webp"],
    ["riverside-park", "riverside-park.png"],
    ["rivertowns-ayso", "rivertowns-ayso.png"],
    ["sachem-soccer", "sachem-soccer.webp"],
    ["saints-fc", "saints-fc.webp"],
    ["sharpened-athlete", "sharpened-athlete.png"],
    ["soccer-institute-wolves-nyc", "soccer-institute-wolves-nyc.webp"],
    ["soccer-kids-nyc", "soccer-kids-nyc.webp"],
    ["soccer-friends-usa", "soccer-friends-usa.webp"],
    ["soccer-legion", "soccer-legion.webp"],
    ["soccer-performance-lab", "soccer-performance-lab.webp"],
    ["soccer-shots", "soccer-shots.png"],
    ["soccer-stars", "soccer-stars.png"],
    ["somers-ayso", "somers-ayso.png"],
    ["sysl", "stamford-youth-soccer.webp"],
    ["sterling-house", "sterling-house.png"],
    ["tbg", "tbg.webp"],
    ["tibet-fc", "tibet-fc.png"],
    ["tru-tekkers", "tru-tekkers.webp"],
    ["trumbull-ayso", "trumbull-ayso.png"],
    ["united-fc", "united-fc.png"],
    ["ust", "ust.png"],
    ["vybz-futbol", "vybz-futbol.png"],
    ["westbury-soccer", "westbury-soccer.png"],
    ["westchester-elite", "westchester-elite.png"],
    ["williamsburg-soccer", "williamsburg-soccer.webp"],
    ["y4yfc", "y4yfc.png"],
  ]) assert.equal(data.getCrmClub(id).logo_path, `/club-logos/${file}`);
  const publicDir = fileURLToPath(new URL("../public/", import.meta.url));
  assert.equal(clubs.filter(club => club.logo_path).length, 74);
  for (const club of clubs) {
    if (club.logo_path) {
      assert.match(club.logo_path, /^\/club-logos\/[a-z0-9-]+\.(jpg|png|webp)$/);
      assert.ok(fs.existsSync(path.join(publicDir, club.logo_path.slice(1))), `${club.name} logo file exists`);
    }
  }
  assert.equal(data.getPartner("cyclones").organization.name, "Coney Island Cyclones Soccer Club");
  assert.equal(data.getCrmClub("cyclones"), undefined);
  const raw = new DatabaseSync(process.env.YSP_DB_PATH);
  assert.equal(raw.prepare("SELECT COUNT(*) AS n FROM contacts").get().n, 1);
  raw.close();
});

test("notes and next actions persist per CRM club", () => {
  const first = "06-united-new-york";
  const second = "aafny";
  assert.equal(data.addCrmNote(first, "phineas", "Call completed"), true);
  assert.equal(data.setCrmNextAction(first, "Schedule follow-up"), 1);
  assert.equal(data.getCrmClub(second).next_action, null);
  assert.deepEqual(data.listCrmNotes(second), []);
  const reopened = new DatabaseSync(process.env.YSP_DB_PATH);
  assert.equal(reopened.prepare("SELECT next_action FROM crm_records WHERE organization_id=?").get(first).next_action, "Schedule follow-up");
  assert.equal(reopened.prepare("SELECT note FROM crm_activities WHERE organization_id=?").get(first).note, "Call completed");
  reopened.close();
  assert.equal(data.setCrmNextAction(first, null), 1);
  assert.equal(data.getCrmClub(first).next_action, null);
  assert.equal(data.addCrmNote("cyclones", "phineas", "Should not save"), false);
});

test("merging an existing Academia Argentina record preserves its notes and next action", async () => {
  const legacy = new DatabaseSync(process.env.YSP_DB_PATH);
  legacy.prepare("INSERT INTO organizations (id,name,kind,logo_path) VALUES (?,?,?,?)").run("academy-argentina", "Academia Argentina De Futbol En New York", "crm_club", "/club-logos/academy-argentina.webp");
  legacy.prepare("INSERT INTO crm_records (organization_id,next_action,updated_at) VALUES (?,?,?)").run("academy-argentina", "Call club director", "2026-10-01T00:00:00.000Z");
  legacy.prepare("INSERT INTO crm_activities (id,organization_id,rep_id,note,created_at) VALUES (?,?,?,?,?)").run("legacy-note", "academy-argentina", "phineas", "Intro call completed", "2026-10-01T00:00:00.000Z");
  legacy.close();

  const merged = await import("../src/lib/db.ts?merge-legacy-action");
  assert.equal(merged.listCrmClubs().length, 643);
  assert.equal(merged.getCrmClub("academy-argentina"), undefined);
  assert.equal(merged.getCrmClub("aafny").next_action, "Call club director");
  assert.ok(merged.listCrmNotes("aafny").some(note => note.note === "Intro call completed"));

  const conflict = new DatabaseSync(process.env.YSP_DB_PATH);
  conflict.prepare("UPDATE crm_records SET next_action=? WHERE organization_id=?").run("Send proposal", "aafny");
  conflict.prepare("INSERT INTO organizations (id,name,kind) VALUES (?,?,?)").run("academy-argentina", "Academia Argentina De Futbol En New York", "crm_club");
  conflict.prepare("INSERT INTO crm_records (organization_id,next_action,updated_at) VALUES (?,?,?)").run("academy-argentina", "Schedule meeting", "2026-10-02T00:00:00.000Z");
  conflict.close();

  const mergedAgain = await import("../src/lib/db.ts?merge-conflicting-actions");
  assert.equal(mergedAgain.getCrmClub("aafny").next_action, "Send proposal");
  assert.ok(mergedAgain.listCrmNotes("aafny").some(note => note.note === "Previous Academia Argentina next action: Schedule meeting"));
  assert.equal(mergedAgain.listCrmClubs().length, 643);
});

test("restoring archived EPSC preserves existing notes and actions", async () => {
  const existing = new DatabaseSync(process.env.YSP_DB_PATH);
  existing.prepare("UPDATE organizations SET kind='crm_archived' WHERE id='epsc'").run();
  existing.prepare("UPDATE crm_records SET next_action=? WHERE organization_id='epsc'").run("Follow up");
  existing.prepare("INSERT INTO crm_activities (id,organization_id,rep_id,note,created_at) VALUES (?,?,?,?,?)").run("epsc-note", "epsc", "phineas", "Prior conversation", "2026-10-01T00:00:00.000Z");
  existing.close();

  const updated = await import("../src/lib/db.ts?restore-epsc");
  assert.equal(updated.getCrmClub("epsc").segment, "current_ysp");
  assert.equal(updated.getCrmClub("epsc").assigned_rep_id, "chris-anderson");
  assert.equal(updated.listCrmClubs().length, 643);
  const preserved = new DatabaseSync(process.env.YSP_DB_PATH);
  assert.deepEqual({ ...preserved.prepare("SELECT o.kind,r.next_action FROM organizations o JOIN crm_records r ON r.organization_id=o.id WHERE o.id='epsc'").get() }, { kind: "crm_club", next_action: "Follow up" });
  assert.equal(preserved.prepare("SELECT note FROM crm_activities WHERE organization_id='epsc'").get().note, "Prior conversation");
  preserved.close();
});

test("staff can correct a club's grouping without losing its notes or next action", async () => {
  const id = "directory-albion-sc-brooklyn";
  assert.equal(data.addCrmNote(id, "phineas", "Reviewed club"), true);
  assert.equal(data.setCrmNextAction(id, "Follow up"), 1);
  assert.equal(data.setCrmClassification(id, "current_ysp", "Queens"), true);
  const reopened = await import("../src/lib/db.ts?reseed-classification");
  assert.equal(reopened.getCrmClub(id).segment, "current_ysp");
  assert.equal(reopened.getCrmClub(id).area, "Queens");
  assert.equal(reopened.getCrmClub(id).area_basis, "Staff set");
  assert.equal(reopened.getCrmClub(id).next_action, "Follow up");
  assert.equal(reopened.listCrmNotes(id)[0].note, "Reviewed club");
});

test("Jason's partner corrections migrate existing CRM records without deleting them", async () => {
  const formerPartners = ["corona-soccer-kids-fc", "guerreros-fc", "new-york-talentos", "soccer-friends-usa", "soccer-kids-nyc"];
  const old = new DatabaseSync(process.env.YSP_DB_PATH);
  for (const id of formerPartners) old.prepare("UPDATE crm_classification SET segment='current_ysp' WHERE organization_id=?").run(id);
  // Some starter clubs have no classification row in a new database; simulate
  // the earlier version of the portal, which classified all five as YSPs.
  for (const id of formerPartners) old.prepare("INSERT OR IGNORE INTO crm_classification (organization_id,segment,area,area_basis) VALUES (?,'current_ysp','Area to confirm','Unverified')").run(id);
  old.prepare("UPDATE organizations SET name='Imperio New York' WHERE id='imperio-new-york'").run();
  old.prepare("UPDATE crm_records SET next_action='Keep for future outreach' WHERE organization_id='corona-soccer-kids-fc'").run();
  old.prepare("DELETE FROM crm_seed_state WHERE key='jason-2027-sprint-partner-status-2026-11-04'").run();
  old.close();

  const updated = await import("../src/lib/db.ts?jason-partner-correction");
  for (const id of formerPartners) {
    assert.equal(updated.getCrmClub(id).segment, "directory");
    assert.ok(updated.getCrmClub(id).logo_path);
  }
  assert.equal(updated.getCrmClub("corona-soccer-kids-fc").next_action, "Keep for future outreach");
  assert.equal(updated.getCrmClub("brooklyn-hares-football-club").segment, "current_ysp");
  assert.equal(updated.getCrmClub("imperio-new-york").segment, "current_ysp");
  assert.equal(updated.getCrmClub("imperio-new-york").name, "Imperio Morelia New York");
});
