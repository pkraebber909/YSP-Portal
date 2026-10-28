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
  assert.equal(clubs.length, 75);
  assert.equal(new Set(clubs.map(club => club.id)).size, clubs.length);
  for (const name of ["06 United", "Academia Argentina De Futbol En New York", "Alliance Athletics", "Alta FC", "SC GJOA", "Y4YFC", "Brooklyn Hares Football Club", "AAFNY"]) {
    assert.ok(clubs.some(club => club.name === name), `${name} is in the directory`);
  }
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
