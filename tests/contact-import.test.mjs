import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "ysp-contact-pilot-"));
process.env.YSP_DB_PATH = path.join(temp, "pilot.sqlite");
const data = await import("../src/lib/db.ts");
const prep = await import("../src/lib/contact-import.ts");

test("matching excludes current partners and holds ambiguous or missing clubs", () => {
  const clubs = [
    { id: "06-united-new-york", name: "06 United", aliases: [], segment: "current_ysp" },
    { id: "directory-bellport", name: "Bellport", aliases: ["Bellport Soccer Club"], segment: "directory" },
    { id: "directory-carmel-united", name: "Carmel United", aliases: [], segment: "directory" },
    { id: "active-partner", name: "Active Partner FC", aliases: [], segment: "directory", activePartnership: true },
    { id: "directory-other", name: "Other", aliases: ["Shared Club"], segment: "directory" },
    { id: "directory-second", name: "Second", aliases: ["Shared Club"], segment: "directory" },
  ];
  assert.deepEqual(prep.matchImportClub("  06   United ", clubs), { decision: "excluded_partner", clubId: "06-united-new-york" });
  assert.deepEqual(prep.matchImportClub("Bellport Soccer Club", clubs), { decision: "eligible", clubId: "directory-bellport" });
  assert.equal(prep.matchImportClub("Active Partner FC", clubs).decision, "excluded_partner");
  assert.equal(prep.matchImportClub("Shared Club", clubs).decision, "review_ambiguous");
  assert.equal(prep.matchImportClub("Bellport; Carmel United", clubs).decision, "review_ambiguous");
  assert.equal(prep.matchImportClub("-", clubs).decision, "review_missing_club");
  assert.equal(prep.matchImportClub("Unknown FC", clubs).decision, "review_unmatched");
});

test("comparison normalizes repeat rows without merging shared mailboxes or cross-club people", () => {
  assert.deepEqual(prep.splitContactEmails(" OFFICE@EXAMPLE.COM; coach@example.com\noffice@example.com"), ["office@example.com", "coach@example.com"]);
  assert.equal(prep.normalizeContactPhone("1 (555) 123-4567"), "(555) 123-4567");
  assert.equal(prep.normalizeContactText(" - "), "");
  const shared = ["office@example.com"];
  const first = prep.contactIdentityKey("directory-bellport", "Pilot Person A", shared, "");
  assert.equal(first, prep.contactIdentityKey("directory-bellport", " Pilot  Person A ", shared, "5551234567"));
  assert.notEqual(first, prep.contactIdentityKey("directory-bellport", "Pilot Person B", shared, ""));
  assert.notEqual(first, prep.contactIdentityKey("directory-carmel-united", "Pilot Person A", shared, ""));
  assert.equal(prep.contactIdentityKey("directory-bellport", "Pilot Person C", [], ""), null);
});

test("synthetic pilot keeps secondary contacts, affiliations, extra emails, and row provenance", () => {
  const raw = new DatabaseSync(process.env.YSP_DB_PATH);
  const contact = raw.prepare("INSERT INTO crm_contacts(id,organization_id,name,email,is_primary) VALUES (?,?,?,?,0)");
  contact.run("pilot-repeat", "directory-bellport", "Pilot Person A", "pilot.a@example.com");
  contact.run("pilot-office", "directory-bellport", "Club office", "office@example.com");
  contact.run("pilot-multi-a", "directory-bellport", "Pilot Person B", "pilot.b@example.com");
  contact.run("pilot-multi-b", "directory-carmel-united", "Pilot Person B", "pilot.b@example.com");
  raw.prepare("INSERT INTO crm_contact_emails(contact_id,email) VALUES (?,?)").run("pilot-repeat", "pilot.alt@example.com");
  raw.prepare("INSERT INTO crm_contact_affiliations(contact_id,role,team) VALUES (?,?,?)").run("pilot-repeat", "Coach", "2014 Boys");
  const source = raw.prepare("INSERT INTO crm_contact_sources(contact_id,workbook_version,tab,row_number,decision,original_values) VALUES (?,?,?,?,?,?)");
  source.run("pilot-repeat", "SYNTHETIC-PILOT", "Sample", 2, "new_secondary", "{}");
  source.run("pilot-repeat", "SYNTHETIC-PILOT", "Sample", 3, "repeat_same_person", "{}");
  assert.equal(raw.prepare("SELECT COUNT(*) AS n FROM crm_contact_sources WHERE contact_id='pilot-repeat'").get().n, 2);
  assert.equal(raw.prepare("SELECT visibility_status FROM crm_contact_sources WHERE contact_id='pilot-repeat' LIMIT 1").get().visibility_status, "unverified");
  const bellport = data.listCrmContacts("directory-bellport");
  assert.equal(bellport.length, 3);
  assert.ok(bellport.every(contact => !contact.is_primary));
  assert.deepEqual(bellport.find(contact => contact.id === "pilot-repeat").emails, ["pilot.a@example.com", "pilot.alt@example.com"]);
  assert.deepEqual(bellport.find(contact => contact.id === "pilot-repeat").roles, ["Coach"]);
  assert.deepEqual(bellport.find(contact => contact.id === "pilot-repeat").teams, ["2014 Boys"]);
  assert.equal(data.listCrmContacts("directory-carmel-united").length, 1);
  assert.equal(data.listCrmContacts("06-united-new-york").length, 1);
  raw.close();
});
