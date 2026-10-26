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

test("CRM seeds all 20 clubs with matching image files and leaves Cyclones available", () => {
  assert.deepEqual(data.listCrmClubs().map(club => club.name), [
    "06 United New York", "AAFNY", "Academy Argentina", "Alta Football Club", "Brooklyn Hares Football Club", "Corona Soccer Kids FC", "DKAY Henry Soccer Training",
    "Eleftheria-Pancyprian", "Futbol Rebels", "Guerreros FC", "GW YSL", "Imperio New York", "Liga 16 de Septiembre", "Morelia Soccer Academy NY", "New York Kids Soccer Club", "New York Talentos", "Peruvian American Soccer NYC", "Reato Soccer Academy", "SC Gjøa", "Soccer Friends USA",
  ]);
  const publicDir = fileURLToPath(new URL("../public/", import.meta.url));
  for (const club of data.listCrmClubs()) {
    if (club.id === "aafny") assert.equal(club.logo_path, null);
    else {
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
