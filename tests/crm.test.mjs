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

test("CRM includes the starter directory, keeps earlier clubs, and resolves installed logos", () => {
  const clubs = data.listCrmClubs();
  assert.equal(clubs.length, 74);
  assert.equal(new Set(clubs.map(club => club.id)).size, clubs.length);
  for (const name of ["06 United", "AAFNY", "Alliance Athletics", "Alta FC", "SC GJOA", "Y4YFC", "Brooklyn Hares Football Club"]) {
    assert.ok(clubs.some(club => club.name === name), `${name} is in the directory`);
  }
  assert.ok(!clubs.some(club => club.id === "academy-argentina"));
  assert.equal(data.getCrmClub("aafny").logo_path, "/club-logos/academy-argentina.webp");
  const publicDir = fileURLToPath(new URL("../public/", import.meta.url));
  assert.equal(clubs.filter(club => club.logo_path).length, 19);
  for (const club of clubs) {
    if (club.logo_path) {
      assert.match(club.logo_path, /^\/club-logos\/[a-z0-9-]+\.(png|webp)$/);
      assert.ok(fs.existsSync(path.join(publicDir, club.logo_path.slice(1))), `${club.name} logo file exists`);
    }
  }
  assert.equal(data.getPartner("cyclones").organization.name, "Coney Island Cyclones Soccer Club");
  assert.equal(data.getCrmClub("cyclones"), undefined);
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
  assert.equal(merged.listCrmClubs().length, 74);
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
  assert.equal(mergedAgain.listCrmClubs().length, 74);
});
