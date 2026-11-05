import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { currentYspIds } from "../data/current-ysp-ids.ts";
import { workbookClubs2026 } from "../data/workbook-clubs-2026.ts";
import { chrisAndersonClubIds, chrisAndersonAdditionalClubIds } from "../data/chris-anderson-club-ids.ts";
import { sebastianMaymiClubIds } from "../data/sebastian-maymi-club-ids.ts";
import { jasonOrtegaClubIds } from "../data/jason-ortega-club-ids.ts";
import { jordanDeBernardoClubIds } from "../data/jordan-debernardo-club-ids.ts";
import { chrisAndersonContacts } from "../data/chris-anderson-contacts.ts";
import logoBatch01 from "../data/logo-batch-01.json" with { type: "json" };
import { logoAssignments02to06 } from "../data/logo-batches-02-06.ts";
import { logoAssignments07to08 } from "../data/logo-batches-07-08.ts";
import { logoAssignments09to11 } from "../data/logo-batches-09-11.ts";
import { logoAssignments12to13 } from "../data/logo-batches-12-13.ts";
import logoBatches14to17 from "../data/logo-batches-14-17.json" with { type: "json" };
import logoBatches18to19 from "../data/logo-batches-18-19.json" with { type: "json" };
import { logoBackgroundCleanups } from "../data/logo-background-cleanups.ts";

const dbPath = path.resolve(process.env.YSP_DB_PATH || ".data/ysp.sqlite");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath, { timeout: 5000 });
db.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");

db.exec(`
CREATE TABLE IF NOT EXISTS organizations (id TEXT PRIMARY KEY, name TEXT NOT NULL, kind TEXT NOT NULL, website TEXT, instagram TEXT, facebook TEXT, logo_path TEXT);
CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL, organization_id TEXT REFERENCES organizations(id));
CREATE TABLE IF NOT EXISTS contacts (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id), name TEXT NOT NULL, title TEXT, email TEXT);
CREATE TABLE IF NOT EXISTS partnerships (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id), season TEXT NOT NULL, status TEXT NOT NULL, stage TEXT NOT NULL, assigned_rep_id TEXT REFERENCES users(id), draft_status TEXT NOT NULL, match_id TEXT REFERENCES matches(id));
CREATE TABLE IF NOT EXISTS matches (id TEXT PRIMARY KEY, season TEXT NOT NULL, date TEXT, venue TEXT, opponent TEXT);
CREATE TABLE IF NOT EXISTS experiences (id TEXT PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS experience_assignments (id TEXT PRIMARY KEY, partnership_id TEXT NOT NULL REFERENCES partnerships(id), experience_id TEXT NOT NULL REFERENCES experiences(id), match_id TEXT REFERENCES matches(id), status TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS requirements (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id), partnership_id TEXT NOT NULL REFERENCES partnerships(id), title TEXT NOT NULL, due_at TEXT, completed_at TEXT, partner_visible INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id), partnership_id TEXT REFERENCES partnerships(id), title TEXT NOT NULL, due_at TEXT, status TEXT NOT NULL, internal_only INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS communications (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id), partnership_id TEXT NOT NULL REFERENCES partnerships(id), author TEXT NOT NULL, body TEXT NOT NULL, visibility TEXT NOT NULL, delivery_status TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS files (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id), partnership_id TEXT NOT NULL REFERENCES partnerships(id), original_name TEXT NOT NULL, stored_name TEXT NOT NULL, mime_type TEXT NOT NULL, size INTEGER NOT NULL, visibility TEXT NOT NULL, uploaded_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS portal_access (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), organization_id TEXT NOT NULL REFERENCES organizations(id), role TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS crm_activities (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id), rep_id TEXT REFERENCES users(id), note TEXT NOT NULL, next_action TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS crm_records (organization_id TEXT PRIMARY KEY REFERENCES organizations(id), next_action TEXT, updated_at TEXT);
CREATE TABLE IF NOT EXISTS crm_assignments (organization_id TEXT PRIMARY KEY REFERENCES organizations(id), rep_id TEXT NOT NULL REFERENCES users(id));
CREATE TABLE IF NOT EXISTS crm_seed_state (key TEXT PRIMARY KEY);
CREATE TABLE IF NOT EXISTS crm_classification (organization_id TEXT PRIMARY KEY REFERENCES organizations(id), segment TEXT NOT NULL, area TEXT NOT NULL, area_basis TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS crm_locations (organization_id TEXT NOT NULL REFERENCES organizations(id), area TEXT NOT NULL, basis TEXT NOT NULL DEFAULT 'Imported area', PRIMARY KEY(organization_id,area));
CREATE TABLE IF NOT EXISTS crm_sources (organization_id TEXT NOT NULL REFERENCES organizations(id), source TEXT NOT NULL, PRIMARY KEY (organization_id,source));
CREATE TABLE IF NOT EXISTS crm_aliases (organization_id TEXT NOT NULL REFERENCES organizations(id), alias TEXT NOT NULL, PRIMARY KEY (organization_id,alias));
CREATE TABLE IF NOT EXISTS crm_contacts (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id), name TEXT NOT NULL, email TEXT, phone TEXT, ticketing_id TEXT, is_primary INTEGER NOT NULL DEFAULT 1, sort_order INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS crm_contact_emails (contact_id TEXT NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE, email TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(contact_id,email));
CREATE TABLE IF NOT EXISTS crm_contact_affiliations (contact_id TEXT NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE, role TEXT NOT NULL DEFAULT '', team TEXT NOT NULL DEFAULT '', PRIMARY KEY(contact_id,role,team));
CREATE TABLE IF NOT EXISTS crm_contact_sources (contact_id TEXT NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE, workbook_version TEXT NOT NULL, tab TEXT NOT NULL, row_number INTEGER NOT NULL, decision TEXT NOT NULL, visibility_status TEXT NOT NULL DEFAULT 'unverified', original_values TEXT NOT NULL, PRIMARY KEY(contact_id,workbook_version,tab,row_number));
CREATE INDEX IF NOT EXISTS idx_requirements_org ON requirements(organization_id);
CREATE INDEX IF NOT EXISTS idx_files_org ON files(organization_id);
CREATE INDEX IF NOT EXISTS idx_communications_org ON communications(organization_id);
`);
const contactSourceColumns = db.prepare("PRAGMA table_info(crm_contact_sources)").all() as { name: string }[];
if (!contactSourceColumns.some(column => column.name === "visibility_status")) {
  db.exec("ALTER TABLE crm_contact_sources ADD COLUMN visibility_status TEXT NOT NULL DEFAULT 'unverified'");
}

db.exec("BEGIN IMMEDIATE;");
try {
  if (!db.prepare("SELECT 1 FROM organizations WHERE id = ?").get("cyclones")) {
    db.prepare("INSERT INTO organizations (id,name,kind) VALUES (?,?,?)").run("cyclones", "Coney Island Cyclones Soccer Club", "youth_club");
    db.prepare("INSERT INTO users (id,name,role,organization_id) VALUES (?,?,?,?)").run("phineas", "Phineas Kraebber", "rep", null);
    db.prepare("INSERT INTO users (id,name,role,organization_id) VALUES (?,?,?,?)").run("cyclones-admin", "Cyclones partner admin (demo)", "partner_admin", "cyclones");
    db.prepare("INSERT INTO contacts (id,organization_id,name) VALUES (?,?,?)").run("vlad", "cyclones", "Vlad");
    db.prepare("INSERT INTO partnerships (id,organization_id,season,status,stage,assigned_rep_id,draft_status) VALUES (?,?,?,?,?,?,?)").run("cyclones-spring-2027", "cyclones", "Spring 2027", "Active partner", "Onboarding", "phineas", "Not started");
    const insert = db.prepare("INSERT INTO requirements (id,organization_id,partnership_id,title) VALUES (?,?,?,?)");
    for (const [id, title] of [["contact", "Confirm club contact details"], ["participants", "Submit estimated participant count"], ["instructions", "Review on-field experience instructions"]]) {
      insert.run(id, "cyclones", "cyclones-spring-2027", title);
    }
    db.prepare("INSERT INTO portal_access (id,user_id,organization_id,role) VALUES (?,?,?,?)").run("cyclones-access", "cyclones-admin", "cyclones", "admin");
  }
  const insertRep = db.prepare("INSERT OR IGNORE INTO users (id,name,role,organization_id) VALUES (?,?,'rep',NULL)");
  for (const [id, name] of [["chris-anderson", "Chris Anderson"], ["jason-ortega", "Jason Ortega"], ["sebastian-maymi", "Sebastian Maymi"], ["jordan-debernardo", "Jordan DeBernardo"]]) insertRep.run(id, name);
  const insertClub = db.prepare("INSERT OR IGNORE INTO organizations (id,name,kind,logo_path) VALUES (?,?,?,?)");
  const fillLogo = db.prepare("UPDATE organizations SET logo_path=? WHERE id=? AND kind='crm_club' AND logo_path IS NULL");
  const insertRecord = db.prepare("INSERT OR IGNORE INTO crm_records (organization_id) VALUES (?)");
  for (const [id, name, logo] of [
    ["06-united-new-york", "06 United New York", "06-united-new-york.webp"],
    ["aafny", "AAFNY", "academy-argentina.webp"],
    ["alliance-athletics", "Alliance Athletics", "alliance-athletics.png"],
    ["alta-football-club", "Alta Football Club", "alta-football-club.png"],
    ["asteras", "Asteras", "asteras.png"],
    ["bayshore-soccer", "Bayshore Soccer", "bayshore-soccer.webp"],
    ["bethpage-pal", "Bethpage PAL", "bethpage-pal.png"],
    ["brooklyn-hares-football-club", "Brooklyn Hares Football Club", "brooklyn-hares-football-club.png"],
    ["byram-hills-sc", "Byram Hills SC", "byram-hills-sc.png"],
    ["cement-football", "Cement Football", "cement-football.jpg"],
    ["chronis-elite", "Chronis Elite", "chronis-elite.png"],
    ["cjsl", "CJSL", "cjsl.png"],
    ["commack-soccer", "Commack Soccer", "commack-soccer.png"],
    ["community-sc", "Community SC", "community-sc--4054a636411f.webp"],
    ["corona-soccer-kids-fc", "Corona Soccer Kids FC", "corona-soccer-kids-fc.webp"],
    ["croton-ayso", "Croton AYSO", "croton-ayso.webp"],
    ["dkay-henry-soccer-training", "DKAY Henry Soccer Training", "dkay-henry-soccer-training.webp"],
    ["eleftheria-pancyprian", "Eleftheria-Pancyprian", "eleftheria-pancyprian.webp"],
    ["eastern-fc", "Eastern FC", "eastern-fc.webp"],
    ["eysa", "EYSA", "eysa.png"],
    ["fc-la-isla", "FC La Isla", "fc-la-isla.png"],
    ["fox-soccer", "Fox Soccer", "fox-soccer.png"],
    ["futbol-rebels", "Futbol Rebels", "futbol-rebels.webp"],
    ["guerreros-fc", "Guerreros FC", "guerreros-fc.webp"],
    ["gw-ysl", "GW YSL", "gw-ysl.webp"],
    ["hlsc", "HLSC", "hlsc.webp"],
    ["imperio-new-york", "Imperio Morelia New York", "imperio-new-york.webp"],
    ["jigs-soccer", "Jigs Soccer", "jigs-soccer.png"],
    ["joga-bonito", "Joga Bonito", "joga-bonito.png"],
    ["levittown-soccer-club", "Levittown Soccer Club", "levittown-soccer-club.webp"],
    ["liga-16-de-septiembre", "Liga 16 de Septiembre", "liga-16-de-septiembre.webp"],
    ["liitle-neck-douglaston", "Little Neck Douglaston", "little-neck-douglaston.png"],
    ["lindenhurst-soccer-club", "Lindenhurst Soccer Club", "lindenhurst-soccer-club.png"],
    ["morelia-soccer-academy-ny", "Morelia Soccer Academy NY", "morelia-soccer-academy-ny.webp"],
    ["mt-pleasant-ayso", "MT Pleasant AYSO", "mt-pleasant-ayso.png"],
    ["new-hyde-park-wildcats-soccer-club", "New Hyde Park Wildcats Soccer Club", "new-hyde-park-wildcats-soccer-club.png"],
    ["new-york-kids-soccer-club", "New York Kids Soccer Club", "new-york-kids-soccer-club.webp"],
    ["new-york-talentos", "New York Talentos", "new-york-talentos.webp"],
    ["nj-santos", "NJ Santos", "nj-santos.png"],
    ["no-limits", "No Limits", "no-limits.png"],
    ["ocsc", "OCSC", "ocsc.png"],
    ["ossining-ayso", "Ossining AYSO", "ossining-ayso.png"],
    ["peruvian-american-soccer-nyc", "Peruvian American Soccer NYC", "peruvian-american-soccer-nyc.webp"],
    ["peruvian-soccer-academy", "Peruvian Soccer Academy", "peruvian-american-soccer-nyc.webp"],
    ["portchester", "Portchester", "port-chester-sc--c8582426f9a2.png"],
    ["reato-soccer-academy", "Reato Soccer Academy", "reato-soccer-academy.webp"],
    ["riverside-park", "Riverside Park", "riverside-park.png"],
    ["rivertowns-ayso", "Rivertowns AYSO", "rivertowns-ayso.png"],
    ["sachem-soccer", "Sachem Soccer", "sachem-soccer.webp"],
    ["saints-fc", "Saints FC", "saints-fc.webp"],
    ["sc-gjoa", "SC Gjøa", "sc-gjoa--a282e8405581.jpg"],
    ["sharpened-athlete", "Sharpened Athlete", "sharpened-athlete.png"],
    ["soccer-friends-usa", "Soccer Friends USA", "soccer-friends-usa.webp"],
    ["soccer-institute-wolves-nyc", "Soccer Institute Wolves NYC", "soccer-institute-wolves-nyc.webp"],
    ["soccer-kids-nyc", "Soccer Kids NYC", "soccer-kids-nyc.webp"],
    ["soccer-legion", "Soccer Legion", "soccer-legion.webp"],
    ["soccer-performance-lab", "Soccer Performance Lab", "soccer-performance-lab.webp"],
    ["soccer-shots", "Soccer Shots", "soccer-shots.png"],
    ["soccer-stars", "Soccer Stars", "soccer-stars.png"],
    ["somers-ayso", "Somers AYSO", "somers-ayso.png"],
    ["sterling-house", "Sterling House", "sterling-house.png"],
    ["sysl", "SYSL", "stamford-youth-soccer.webp"],
    ["tbg", "TBG", "tbg.webp"],
    ["tibet-fc", "Tibet FC", "tibet-fc.png"],
    ["tru-tekkers", "Tru Tekkers", "tru-tekkers.webp"],
    ["trumbull-ayso", "Trumbull AYSO", "trumbull-ayso.png"],
    ["united-fc", "United FC", "united-fc.png"],
    ["ust", "UST", "ust.png"],
    ["vybz-futbol", "Vybz Futbol", "vybz-futbol.png"],
    ["westbury-soccer", "Westbury Soccer", "westbury-soccer.png"],
    ["westchester-elite", "Westchester Elite", "westchester-elite.png"],
    ["williamsburg-soccer", "Williamsburg Soccer", "williamsburg-soccer.webp"],
    ["y4yfc", "Y4YFC", "y4yfc.png"],
  ]) {
    const logoPath = logo ? `/club-logos/${logo}` : null;
    insertClub.run(id, name, "crm_club", logoPath);
    if (logoPath) fillLogo.run(logoPath, id);
    insertRecord.run(id);
  }
  // Starter directory supplied by the program owner. Existing records keep their
  // IDs, logos, notes, and next actions when a name also appears here.
  for (const [id, name] of [
    ["06-united-new-york", "06 United"],
    ["alliance-athletics", "Alliance Athletics"],
    ["alta-football-club", "Alta FC"],
    ["asteras", "Asteras"],
    ["bayshore-soccer", "Bayshore Soccer"],
    ["bethpage-pal", "Bethpage PAL"],
    ["byram-hills-sc", "Byram Hills SC"],
    ["cement-football", "Cement Football"],
    ["chronis-elite", "Chronis Elite"],
    ["cjsl", "CJSL"],
    ["commack-soccer", "Commack Soccer"],
    ["community-sc", "Community SC"],
    ["croton-ayso", "Croton AYSO"],
    ["eastern-fc", "Eastern FC"],
    ["eysa", "EYSA"],
    ["fc-la-isla", "FC La Isla"],
    ["fox-soccer", "Fox Soccer"],
    ["futbol-rebels", "Futbol Rebels"],
    ["gw-ysl", "GWYSL"],
    ["hlsc", "HLSC"],
    ["jigs-soccer", "Jigs Soccer"],
    ["joga-bonito", "Joga Bonito"],
    ["levittown-soccer-club", "Levittown Soccer Club"],
    ["liga-16-de-septiembre", "Liga Diesiseis De Septiembre"],
    ["liitle-neck-douglaston", "Little Neck Douglaston"],
    ["lindenhurst-soccer-club", "Lindenhurst Soccer Club"],
    ["morelia-soccer-academy-ny", "Morelia Soccer Academy"],
    ["mt-pleasant-ayso", "MT Pleasant AYSO"],
    ["ncs-soccer-academy", "NCS Soccer Academy"],
    ["new-hyde-park-wildcats-soccer-club", "New Hyde Park Wildcats Soccer Club"],
    ["new-york-kids-soccer-club", "New York Kids SC"],
    ["nj-santos", "NJ Santos"],
    ["no-limits", "No Limits"],
    ["ocsc", "OCSC"],
    ["ossining-ayso", "Ossining AYSO"],
    ["peruvian-soccer-academy", "Peruvian Soccer Academy"],
    ["portchester", "Portchester"],
    ["reato-soccer-academy", "Reato Soccer"],
    ["riverside-park", "Riverside Park"],
    ["rivertowns-ayso", "Rivertowns AYSO"],
    ["sachem-soccer", "Sachem Soccer"],
    ["saints-fc", "Saints FC"],
    ["sc-gjoa", "SC GJOA"],
    ["sharpened-athlete", "Sharpened Athlete"],
    ["soccer-institute-wolves-nyc", "Soccer Institute Wolves NYC"],
    ["soccer-legion", "Soccer Legion"],
    ["soccer-performance-lab", "Soccer Performance Lab"],
    ["soccer-shots", "Soccer Shots"],
    ["soccer-stars", "Soccer Stars"],
    ["somers-ayso", "Somers AYSO"],
    ["sterling-house", "Sterling House"],
    ["sysl", "SYSL"],
    ["tbg", "TBG"],
    ["tibet-fc", "Tibet FC"],
    ["tru-tekkers", "Tru Tekkers"],
    ["trumbull-ayso", "Trumbull AYSO"],
    ["united-fc", "United FC"],
    ["ust", "UST"],
    ["vybz-futbol", "Vybz Futbol"],
    ["westbury-soccer", "Westbury Soccer"],
    ["westchester-elite", "Westchester Elite"],
    ["williamsburg-soccer", "Williamsburg Soccer"],
    ["y4yfc", "Y4YFC"],
  ]) {
    insertClub.run(id, name, "crm_club", null);
    insertRecord.run(id);
  }
  const renameClub = db.prepare("UPDATE organizations SET name=? WHERE id=? AND kind='crm_club' AND name=?");
  for (const [id, oldName, newName] of [
    ["06-united-new-york", "06 United New York", "06 United"],
    ["alta-football-club", "Alta Football Club", "Alta FC"],
    ["gw-ysl", "GW YSL", "GWYSL"],
    ["imperio-new-york", "Imperio New York", "Imperio Morelia New York"],
    ["liga-16-de-septiembre", "Liga 16 de Septiembre", "Liga Diesiseis De Septiembre"],
    ["liitle-neck-douglaston", "Liitle Neck Douglaston", "Little Neck Douglaston"],
    ["morelia-soccer-academy-ny", "Morelia Soccer Academy NY", "Morelia Soccer Academy"],
    ["new-york-kids-soccer-club", "New York Kids Soccer Club", "New York Kids SC"],
    ["reato-soccer-academy", "Reato Soccer Academy", "Reato Soccer"],
    ["sc-gjoa", "SC Gjøa", "SC GJOA"],
  ]) renameClub.run(newName, id, oldName);
  // EPSC is back in the active CRM at the program owner's request. Reuse an
  // archived row so any earlier notes and next action remain attached.
  db.prepare("UPDATE organizations SET kind='crm_club' WHERE id='epsc' AND kind='crm_archived'").run();
  insertClub.run("epsc", "EPSC", "crm_club", null);
  insertRecord.run("epsc");
  // The supplied Eleftheria-Pancyprian crest is also used for EPSC.
  fillLogo.run("/club-logos/eleftheria-pancyprian.webp", "epsc");
  // Merge the earlier Academia Argentina entry into AAFNY without dropping
  // notes or an action saved against either record in an existing database.
  const legacyAcademy = db.prepare("SELECT next_action,updated_at FROM crm_records WHERE organization_id=?").get("academy-argentina") as { next_action: string | null; updated_at: string | null } | undefined;
  if (legacyAcademy) {
    const aafny = db.prepare("SELECT next_action FROM crm_records WHERE organization_id=?").get("aafny") as { next_action: string | null };
    db.prepare("UPDATE crm_activities SET organization_id=? WHERE organization_id=?").run("aafny", "academy-argentina");
    if (legacyAcademy.next_action && !aafny.next_action) {
      db.prepare("UPDATE crm_records SET next_action=?,updated_at=? WHERE organization_id=?").run(legacyAcademy.next_action, legacyAcademy.updated_at, "aafny");
    } else if (legacyAcademy.next_action && legacyAcademy.next_action !== aafny.next_action) {
      db.prepare("INSERT INTO crm_activities (id,organization_id,rep_id,note,created_at) VALUES (?,?,?,?,?)").run(
        crypto.randomUUID(), "aafny", null, `Previous Academia Argentina next action: ${legacyAcademy.next_action}`, legacyAcademy.updated_at || new Date().toISOString()
      );
    }
    db.prepare("DELETE FROM crm_records WHERE organization_id=?").run("academy-argentina");
    db.prepare("DELETE FROM organizations WHERE id=? AND kind='crm_club'").run("academy-argentina");
  }
  const insertClassification = db.prepare("INSERT OR IGNORE INTO crm_classification (organization_id,segment,area,area_basis) VALUES (?,?,?,?)");
  const fillArea = db.prepare("UPDATE crm_classification SET area=?,area_basis=? WHERE organization_id=? AND area_basis='Unverified'");
  const insertSource = db.prepare("INSERT OR IGNORE INTO crm_sources (organization_id,source) VALUES (?,?)");
  for (const id of currentYspIds) insertClassification.run(id, "current_ysp", "Area to confirm", "Unverified");
  // The workbook contains club directory rows and contact columns. Only club
  // names and source sheet labels are copied into this seed; contacts stay out.
  for (const club of workbookClubs2026) {
    insertClub.run(club.id, club.name, "crm_club", null);
    insertRecord.run(club.id);
    insertClassification.run(club.id, "directory", club.area, club.area_basis);
    if (club.area !== "Area to confirm") fillArea.run(club.area, club.area_basis, club.id);
    for (const source of club.sources) insertSource.run(club.id, source);
  }
  // Eastchester Soccer Club is EYSA. Keep the existing partner record as the
  // canonical ID and migrate an older directory row before deleting it.
  const legacyEastchesterId = "directory-eastchester";
  const eysaId = "eysa";
  const legacyEastchester = db.prepare("SELECT * FROM organizations WHERE id=? AND kind='crm_club'").get(legacyEastchesterId) as Organization | undefined;
  if (legacyEastchester) {
    const eysa = db.prepare("SELECT * FROM organizations WHERE id=? AND kind='crm_club'").get(eysaId) as Organization | undefined;
    if (!eysa) throw new Error("EYSA canonical record missing during Eastchester merge");
    const preservedNotes: string[] = [];
    for (const field of ["website", "instagram", "facebook", "logo_path"] as const) {
      const oldValue = legacyEastchester[field];
      const canonicalValue = eysa[field];
      if (!oldValue) continue;
      if (!canonicalValue) db.prepare(`UPDATE organizations SET ${field}=? WHERE id=?`).run(oldValue, eysaId);
      else if (canonicalValue !== oldValue) preservedNotes.push(`Former Eastchester ${field}: ${oldValue}`);
    }
    const oldClass = db.prepare("SELECT segment,area,area_basis FROM crm_classification WHERE organization_id=?").get(legacyEastchesterId) as { segment: string; area: string; area_basis: string } | undefined;
    const eysaClass = db.prepare("SELECT segment,area,area_basis FROM crm_classification WHERE organization_id=?").get(eysaId) as { segment: string; area: string; area_basis: string } | undefined;
    if (oldClass?.area && oldClass.area !== "Area to confirm") {
      if (!eysaClass || eysaClass.area === "Area to confirm" || eysaClass.area_basis === "Unverified") {
        db.prepare("UPDATE crm_classification SET area=?,area_basis=? WHERE organization_id=?").run(oldClass.area, oldClass.area_basis, eysaId);
      } else if (eysaClass.area !== oldClass.area) {
        preservedNotes.push(`Former Eastchester area: ${oldClass.area} (${oldClass.area_basis})`);
      }
    }
    db.prepare("INSERT OR IGNORE INTO crm_sources (organization_id,source) SELECT ?,source FROM crm_sources WHERE organization_id=?").run(eysaId, legacyEastchesterId);
    db.prepare("INSERT OR IGNORE INTO crm_aliases (organization_id,alias) SELECT ?,alias FROM crm_aliases WHERE organization_id=?").run(eysaId, legacyEastchesterId);
    const oldRecord = db.prepare("SELECT next_action,updated_at FROM crm_records WHERE organization_id=?").get(legacyEastchesterId) as { next_action: string | null; updated_at: string | null } | undefined;
    const eysaRecord = db.prepare("SELECT next_action FROM crm_records WHERE organization_id=?").get(eysaId) as { next_action: string | null } | undefined;
    if (oldRecord?.next_action) {
      if (!eysaRecord?.next_action) db.prepare("UPDATE crm_records SET next_action=?,updated_at=? WHERE organization_id=?").run(oldRecord.next_action, oldRecord.updated_at, eysaId);
      else if (eysaRecord.next_action !== oldRecord.next_action) preservedNotes.push(`Former Eastchester next action: ${oldRecord.next_action}`);
    }
    const oldAssignment = db.prepare("SELECT rep_id FROM crm_assignments WHERE organization_id=?").get(legacyEastchesterId) as { rep_id: string } | undefined;
    const eysaAssignment = db.prepare("SELECT rep_id FROM crm_assignments WHERE organization_id=?").get(eysaId) as { rep_id: string } | undefined;
    if (oldAssignment) {
      if (!eysaAssignment) db.prepare("INSERT INTO crm_assignments (organization_id,rep_id) VALUES (?,?)").run(eysaId, oldAssignment.rep_id);
      else if (oldAssignment.rep_id !== eysaAssignment.rep_id) preservedNotes.push(`Former Eastchester rep assignment: ${oldAssignment.rep_id}`);
    }
    for (const table of ["users", "contacts", "partnerships", "requirements", "tasks", "communications", "files", "portal_access", "crm_activities", "crm_contacts", "experience_groups"] as const) {
      if (db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(table)) {
        db.prepare(`UPDATE ${table} SET organization_id=? WHERE organization_id=?`).run(eysaId, legacyEastchesterId);
      }
    }
    for (const note of preservedNotes) db.prepare("INSERT INTO crm_activities (id,organization_id,rep_id,note,created_at) VALUES (?,?,?,?,?)").run(crypto.randomUUID(), eysaId, null, note, new Date().toISOString());
    for (const table of ["crm_sources", "crm_aliases", "crm_records", "crm_classification", "crm_assignments"] as const) db.prepare(`DELETE FROM ${table} WHERE organization_id=?`).run(legacyEastchesterId);
    db.prepare("DELETE FROM organizations WHERE id=?").run(legacyEastchesterId);
  }
  const insertAlias = db.prepare("INSERT OR IGNORE INTO crm_aliases (organization_id,alias) VALUES (?,?)");
  for (const alias of ["Eastchester", "Eastchester Soccer Club", "Eastchester Youth Soccer Association"]) insertAlias.run(eysaId, alias);
  // Apply reviewed logo matches only to clubs that still have a placeholder.
  // The batch mapping retains the source, stable ID, and held decisions.
  for (const logo of logoBatch01.logos) {
    if (logo.decision === "add_to_placeholder" && logo.portal_club_id && logo.portal_logo_path) {
      fillLogo.run(logo.portal_logo_path, logo.portal_club_id);
    }
  }
  // Additional confirmed batches use stable CRM IDs. Existing staff-selected
  // logos are never overwritten by a later seed.
  for (const [clubId, logoPath] of logoAssignments02to06) fillLogo.run(logoPath, clubId);
  for (const [clubId, logoPath] of logoAssignments07to08) fillLogo.run(logoPath, clubId);
  for (const [clubId, logoPath] of logoAssignments09to11) fillLogo.run(logoPath, clubId);
  for (const [clubId, logoPath] of logoAssignments12to13) fillLogo.run(logoPath, clubId);
  for (const logo of logoBatches14to17.logos) {
    if (logo.decision === "add_to_placeholder" && logo.portal_logo_path) fillLogo.run(logo.portal_logo_path, logo.portal_club_id);
  }
  for (const logo of logoBatches18to19.logos) {
    if (logo.decision === "add_to_placeholder" && logo.portal_logo_path) fillLogo.run(logo.portal_logo_path, logo.portal_club_id);
  }
  // Replace only these known seed paths. A later staff-selected crest wins.
  db.prepare("UPDATE organizations SET logo_path=? WHERE id='portchester' AND kind='crm_club' AND logo_path=?")
    .run("/club-logos/port-chester-sc--c8582426f9a2.png", "/club-logos/portchester.png");
  db.prepare("UPDATE organizations SET logo_path=? WHERE id='sc-gjoa' AND kind='crm_club' AND logo_path=?")
    .run("/club-logos/sc-gjoa--a282e8405581.jpg", "/club-logos/sc-gjoa.webp");
  // The newer official Community SC crest is the same five-star shield in a
  // clearer source image. Only replace the known old seed asset so any staff
  // selection made later is preserved.
  db.prepare("UPDATE organizations SET logo_path=? WHERE id='community-sc' AND kind='crm_club' AND logo_path=?")
    .run("/club-logos/community-sc--4054a636411f.webp", "/club-logos/community-sc.png");
  const replaceKnownLogo = db.prepare("UPDATE organizations SET logo_path=? WHERE id=? AND kind='crm_club' AND logo_path=?");
  for (const [id, source, display] of logoBackgroundCleanups) {
    replaceKnownLogo.run(`/club-logos/${display}`, id, `/club-logos/${source}`);
  }
  const seedState = db.prepare("INSERT OR IGNORE INTO crm_seed_state (key) VALUES (?)");
  if (seedState.run("06-united-andy-chan-contact-2026-11-05").changes) {
    db.prepare("INSERT OR IGNORE INTO crm_contacts (id,organization_id,name,email,phone,ticketing_id) VALUES (?,?,?,?,?,?)").run(
      "06-united-andy-chan", "06-united-new-york", "Andy Chan", "andy.chan@06united.com", "(718) 760-0280", "1540097"
    );
  }
  // Apply each owner-supplied book once. Subsequent staff edits, including
  // unassigning a club, must survive server restarts.
  // Jason's Sprint 2027 update removes these five from the partner group.
  // Keep their CRM records, logos, notes, and any rep assignments intact.
  if (seedState.run("jason-2027-sprint-partner-status-2026-11-04").changes) {
    const markDirectory = db.prepare("UPDATE crm_classification SET segment='directory' WHERE organization_id=? AND segment='current_ysp'");
    for (const id of ["corona-soccer-kids-fc", "guerreros-fc", "new-york-talentos", "soccer-friends-usa", "soccer-kids-nyc"]) markDirectory.run(id);
  }
  const assignClub = db.prepare("INSERT INTO crm_assignments (organization_id,rep_id) VALUES (?,?) ON CONFLICT(organization_id) DO UPDATE SET rep_id=excluded.rep_id");
  const clubExists = db.prepare("SELECT 1 FROM organizations WHERE id=? AND kind='crm_club'");
  for (const [key, repId, clubIds] of [
    ["chris-anderson-initial-clubs-2026-11-04", "chris-anderson", chrisAndersonClubIds],
    ["sebastian-maymi-initial-clubs-2026-11-04", "sebastian-maymi", sebastianMaymiClubIds],
    ["jason-ortega-initial-clubs-2026-11-04", "jason-ortega", jasonOrtegaClubIds],
    ["jordan-debernardo-initial-clubs-2026-11-04", "jordan-debernardo", jordanDeBernardoClubIds],
    ["chris-anderson-followup-clubs-2026-11-04", "chris-anderson", chrisAndersonAdditionalClubIds],
  ] as const) {
    if (seedState.run(key).changes) {
      for (const id of clubIds) {
        if (!clubExists.get(id)) throw new Error(`Rep book club missing from CRM: ${id}`);
        assignClub.run(id, repId);
      }
    }
  }
  if (seedState.run("chris-anderson-contacts-2026-11-04").changes) {
    const insertContact = db.prepare(`INSERT INTO crm_contacts (id,organization_id,name,email,sort_order)
      SELECT ?,?,?,?,? WHERE NOT EXISTS
      (SELECT 1 FROM crm_contacts WHERE organization_id=? AND lower(email)=lower(?))`);
    for (const [order, [orgId, name, email]] of chrisAndersonContacts.entries()) {
      if (!clubExists.get(orgId)) throw new Error(`Contact club missing from CRM: ${orgId}`);
      insertContact.run(`${orgId}:${email}`, orgId, name, email, order, orgId, email);
    }
  }
  // Hide owner-identified duplicate/non-club directory entries without deleting
  // their notes, sources, contacts, or history. Keep the active rep records.
  const archiveDirectoryClub = db.prepare("UPDATE organizations SET kind='crm_archived' WHERE id=? AND kind='crm_club'");
  for (const id of [
    "eleftheria-pancyprian", "peruvian-american-soccer-nyc",
    "directory-manhattan-kickers", "directory-green-warriors-sa",
    "directory-hartford-athletic", "directory-hartford-athletic-youth-academy",
    "directory-nycfc", "directory-new-york-city-fc-girls", "directory-new-york-city-fc-select",
  ]) archiveDirectoryClub.run(id);
  // This record stays searchable, but its crest is intentionally removed.
  db.prepare("UPDATE organizations SET logo_path=NULL WHERE id='directory-westchester-sc' AND kind='crm_club' AND logo_path=?")
    .run("/club-logos/westchester-sc--90b797a456ab.png");
  if (seedState.run("crm-locations-from-existing-area-2026-11-05").changes) {
    db.exec("INSERT OR IGNORE INTO crm_locations(organization_id,area,basis) SELECT organization_id,area,area_basis FROM crm_classification WHERE area<>'Area to confirm'");
  }
  // Staff confirmed 5 Star Soccer Academy serves Queens. Preserve any later staff edits.
  if (seedState.run("crm-5-star-queens-2026-11-05").changes) {
    const clubId = "directory-5-star-soccer-academy";
    const hasLocations = db.prepare("SELECT 1 FROM crm_locations WHERE organization_id=? LIMIT 1").get(clubId);
    const updated = !hasLocations && db.prepare("UPDATE crm_classification SET area='Queens',area_basis='Staff set' WHERE organization_id=? AND area_basis='Unverified'").run(clubId).changes;
    if (updated) db.prepare("INSERT INTO crm_locations(organization_id,area,basis) VALUES (?,'Queens','Staff set')").run(clubId);
  }
  db.exec("COMMIT;");
} catch (error) {
  db.exec("ROLLBACK;");
  throw error;
}

export type Organization = { id: string; name: string; website: string | null; instagram: string | null; facebook: string | null; logo_path: string | null };
export type Partnership = { id: string; organization_id: string; season: string; status: string; stage: string; draft_status: string; match_id: string | null; rep_name: string };
export type Requirement = { id: string; title: string; due_at: string | null; completed_at: string | null; partner_visible: number };
export type Communication = { id: string; author: string; body: string; visibility: string; delivery_status: string; created_at: string };
export type StoredFile = { id: string; original_name: string; mime_type: string; size: number; visibility: string; uploaded_at: string };
export type CrmClub = { id: string; name: string; logo_path: string | null; next_action: string | null; updated_at: string | null; segment: string; area: string; area_basis: string; locations: string[]; sources: string; aliases: string; assigned_rep_id: string | null; assigned_rep_name: string | null };
export type CrmNote = { id: string; note: string; author: string; created_at: string };
export type CrmContact = { id: string; name: string; email: string | null; phone: string | null; ticketing_id: string | null };
export type CrmContactDisplay = CrmContact & { is_primary: boolean; emails: string[]; roles: string[]; teams: string[] };

const crmSelect = `SELECT o.id,o.name,o.logo_path,r.next_action,r.updated_at,
  COALESCE(c.segment,'directory') AS segment,COALESCE(c.area,'Area to confirm') AS area,
  COALESCE(c.area_basis,'Unverified') AS area_basis,
  COALESCE((SELECT GROUP_CONCAT(area,'|') FROM (SELECT area FROM crm_locations l WHERE l.organization_id=o.id ORDER BY area)),'') AS locations_csv,
  a.rep_id AS assigned_rep_id,u.name AS assigned_rep_name,
  COALESCE((SELECT GROUP_CONCAT(source, ' · ') FROM (SELECT source FROM crm_sources s WHERE s.organization_id=o.id ORDER BY source)),'') AS sources,
  COALESCE((SELECT GROUP_CONCAT(alias, ' · ') FROM (SELECT alias FROM crm_aliases a WHERE a.organization_id=o.id ORDER BY alias)),'') AS aliases
  FROM crm_records r JOIN organizations o ON o.id=r.organization_id
  LEFT JOIN crm_classification c ON c.organization_id=o.id
  LEFT JOIN crm_assignments a ON a.organization_id=o.id
  LEFT JOIN users u ON u.id=a.rep_id WHERE o.kind='crm_club'`;
type CrmClubRow = Omit<CrmClub, "locations"> & { locations_csv: string };
function projectCrmClub(row: CrmClubRow): CrmClub {
  const { locations_csv, ...club } = row;
  return { ...club, locations: locations_csv ? locations_csv.split("|") : [] };
}
export function listCrmClubs() {
  return (db.prepare(`${crmSelect} ORDER BY o.name COLLATE NOCASE`).all() as CrmClubRow[]).map(projectCrmClub);
}
export function getCrmClub(orgId: string) {
  const row = db.prepare(`${crmSelect} AND o.id=?`).get(orgId) as CrmClubRow | undefined;
  return row ? projectCrmClub(row) : undefined;
}
export function listCrmClubsForRep(repId: string) {
  return (db.prepare(`${crmSelect} AND a.rep_id=? ORDER BY o.name COLLATE NOCASE`).all(repId) as CrmClubRow[]).map(projectCrmClub);
}
export function listSalesReps() {
  return db.prepare(`SELECT u.id,u.name,
    (SELECT COUNT(DISTINCT p.organization_id) FROM partnerships p WHERE p.assigned_rep_id=u.id) AS partner_count,
    (SELECT COUNT(*) FROM crm_assignments a WHERE a.rep_id=u.id) AS crm_count
    FROM users u WHERE u.role='rep' ORDER BY CASE u.id
      WHEN 'chris-anderson' THEN 0
      WHEN 'jason-ortega' THEN 1
      WHEN 'sebastian-maymi' THEN 2
      WHEN 'jordan-debernardo' THEN 3
      WHEN 'phineas' THEN 4
      ELSE 5 END,u.name`).all() as { id: string; name: string; partner_count: number; crm_count: number }[];
}
export function setCrmRep(orgId: string, repId: string | null) {
  if (!getCrmClub(orgId)) return false;
  if (repId === null) {
    db.prepare("DELETE FROM crm_assignments WHERE organization_id=?").run(orgId);
    return true;
  }
  if (!db.prepare("SELECT 1 FROM users WHERE id=? AND role='rep'").get(repId)) return false;
  db.prepare("INSERT INTO crm_assignments (organization_id,rep_id) VALUES (?,?) ON CONFLICT(organization_id) DO UPDATE SET rep_id=excluded.rep_id").run(orgId, repId);
  return true;
}
export const crmAreas = ["Area to confirm", "Brooklyn", "Bronx", "Queens", "Manhattan", "Staten Island", "Long Island", "Westchester", "Hudson Valley", "Capital District", "Connecticut"] as const;
export function setCrmSegment(orgId: string, segment: string) {
  if (!getCrmClub(orgId) || !["current_ysp", "directory"].includes(segment)) return false;
  db.prepare("UPDATE crm_classification SET segment=? WHERE organization_id=?").run(segment, orgId);
  return true;
}
export function setCrmLocations(orgId: string, areas: string[]) {
  if (!getCrmClub(orgId) || areas.some(area => area === "Area to confirm" || !crmAreas.includes(area as typeof crmAreas[number]))) return false;
  const unique = [...new Set(areas)];
  db.exec("SAVEPOINT crm_location_edit");
  try {
    db.prepare("DELETE FROM crm_locations WHERE organization_id=?").run(orgId);
    const insert = db.prepare("INSERT INTO crm_locations(organization_id,area,basis) VALUES (?,?,'Staff set')");
    for (const area of unique) insert.run(orgId, area);
    db.prepare("UPDATE crm_classification SET area=?,area_basis='Staff set' WHERE organization_id=?").run(unique[0] || "Area to confirm", orgId);
    db.exec("RELEASE crm_location_edit");
    return true;
  } catch (error) {
    db.exec("ROLLBACK TO crm_location_edit");
    db.exec("RELEASE crm_location_edit");
    throw error;
  }
}
export function setCrmClassification(orgId: string, segment: string, area: string) {
  if (!getCrmClub(orgId) || !["current_ysp", "directory"].includes(segment) || !crmAreas.includes(area as typeof crmAreas[number])) return false;
  db.prepare("INSERT INTO crm_classification (organization_id,segment,area,area_basis) VALUES (?,?,?,'Staff set') ON CONFLICT(organization_id) DO UPDATE SET segment=excluded.segment,area=excluded.area,area_basis='Staff set'").run(orgId, segment, area);
  // Keep the original single-area API in sync with location tags for older callers.
  if (area === "Area to confirm") db.prepare("DELETE FROM crm_locations WHERE organization_id=?").run(orgId);
  else db.prepare("INSERT OR IGNORE INTO crm_locations(organization_id,area,basis) VALUES (?,?,'Staff set')").run(orgId, area);
  return true;
}
export function listCrmNotes(orgId: string) {
  return db.prepare("SELECT a.id,a.note,COALESCE(u.name,'Rep') AS author,a.created_at FROM crm_activities a LEFT JOIN users u ON u.id=a.rep_id WHERE a.organization_id=? ORDER BY a.created_at DESC, a.rowid DESC").all(orgId) as CrmNote[];
}
export function listCrmPrimaryContacts(orgId: string) {
  return db.prepare("SELECT id,name,email,phone,ticketing_id FROM crm_contacts WHERE organization_id=? AND is_primary=1 ORDER BY sort_order,name COLLATE NOCASE").all(orgId) as CrmContact[];
}
export function listCrmContacts(orgId: string): CrmContactDisplay[] {
  const contacts = db.prepare("SELECT id,name,email,phone,ticketing_id,is_primary FROM crm_contacts WHERE organization_id=? ORDER BY is_primary DESC,sort_order,name COLLATE NOCASE").all(orgId) as (CrmContact & { is_primary: number })[];
  const extraEmails = db.prepare("SELECT email FROM crm_contact_emails WHERE contact_id=? ORDER BY sort_order,email");
  const affiliations = db.prepare("SELECT role,team FROM crm_contact_affiliations WHERE contact_id=? ORDER BY role,team");
  return contacts.map(contact => {
    const emails = [...(contact.email ? [contact.email] : []), ...(extraEmails.all(contact.id) as { email: string }[]).map(item => item.email)]
      .filter((email, index, all) => all.findIndex(value => value.toLowerCase() === email.toLowerCase()) === index);
    const details = affiliations.all(contact.id) as { role: string; team: string }[];
    return { ...contact, is_primary: !!contact.is_primary, emails, roles: [...new Set(details.map(item => item.role).filter(Boolean))], teams: [...new Set(details.map(item => item.team).filter(Boolean))] };
  });
}
export function addCrmContact(orgId: string, name: string, email: string | null, phone: string | null, ticketingId: string | null) {
  if (!getCrmClub(orgId)) return false;
  db.prepare(`INSERT INTO crm_contacts (id,organization_id,name,email,phone,ticketing_id,sort_order)
    VALUES (?,?,?,?,?,?,COALESCE((SELECT MAX(sort_order)+1 FROM crm_contacts WHERE organization_id=?),0))`)
    .run(crypto.randomUUID(), orgId, name, email, phone, ticketingId, orgId);
  return true;
}
export function updateCrmContact(orgId: string, contactId: string, name: string, email: string | null, phone: string | null, ticketingId: string | null) {
  if (!getCrmClub(orgId)) return false;
  return db.prepare("UPDATE crm_contacts SET name=?,email=?,phone=?,ticketing_id=? WHERE id=? AND organization_id=?")
    .run(name, email, phone, ticketingId, contactId, orgId).changes > 0;
}
export function removeCrmContact(orgId: string, contactId: string) {
  if (!getCrmClub(orgId)) return false;
  return db.prepare("DELETE FROM crm_contacts WHERE id=? AND organization_id=?").run(contactId, orgId).changes > 0;
}
export function addCrmNote(orgId: string, repId: string, note: string) {
  if (!getCrmClub(orgId)) return false;
  db.prepare("INSERT INTO crm_activities (id,organization_id,rep_id,note,created_at) VALUES (?,?,?,?,?)").run(crypto.randomUUID(), orgId, repId, note, new Date().toISOString());
  return true;
}
export function setCrmNextAction(orgId: string, nextAction: string | null) {
  return Number(db.prepare("UPDATE crm_records SET next_action=?,updated_at=? WHERE organization_id=?").run(nextAction, new Date().toISOString(), orgId).changes);
}

export function getPartner(orgId: string, partnerView = false) {
  const organization = db.prepare("SELECT id,name,website,instagram,facebook,logo_path FROM organizations WHERE id = ?").get(orgId) as Organization | undefined;
  if (!organization) return null;
  const partnership = db.prepare(`SELECT p.id,p.organization_id,p.season,p.status,p.stage,p.draft_status,p.match_id,u.name AS rep_name FROM partnerships p JOIN users u ON u.id = p.assigned_rep_id WHERE p.organization_id = ? ORDER BY p.season DESC LIMIT 1`).get(orgId) as Partnership;
  const contact = db.prepare("SELECT name FROM contacts WHERE organization_id = ? ORDER BY id LIMIT 1").get(orgId) as { name: string };
  const requirements = db.prepare(`SELECT id,title,due_at,completed_at,partner_visible FROM requirements WHERE organization_id = ? AND partnership_id = ? ${partnerView ? "AND partner_visible = 1" : ""} ORDER BY rowid`).all(orgId, partnership.id) as Requirement[];
  const communications = db.prepare(`SELECT id,author,body,visibility,delivery_status,created_at FROM communications WHERE organization_id = ? AND partnership_id = ? ${partnerView ? "AND visibility = 'partner'" : ""} ORDER BY created_at DESC`).all(orgId, partnership.id) as Communication[];
  const files = db.prepare(`SELECT id,original_name,mime_type,size,visibility,uploaded_at FROM files WHERE organization_id = ? AND partnership_id = ? ${partnerView ? "AND visibility = 'partner'" : ""} ORDER BY uploaded_at DESC`).all(orgId, partnership.id) as StoredFile[];
  return { organization, partnership, contact, requirements, communications, files };
}

export function listPartnersForRep(repId: string) {
  return db.prepare(`SELECT o.id,o.name,p.season,p.status,p.stage,p.draft_status,
    (SELECT COUNT(*) FROM requirements r WHERE r.partnership_id=p.id AND r.completed_at IS NULL) AS open_count,
    (SELECT title FROM requirements r WHERE r.partnership_id=p.id AND r.completed_at IS NULL ORDER BY rowid LIMIT 1) AS next_action
    FROM partnerships p JOIN organizations o ON o.id=p.organization_id WHERE p.assigned_rep_id=? ORDER BY o.name`).all(repId) as { id: string; name: string; season: string; status: string; stage: string; draft_status: string; open_count: number; next_action: string | null }[];
}

export function setRequirement(orgId: string, id: string, complete: boolean) {
  return Number(db.prepare("UPDATE requirements SET completed_at = ? WHERE id = ? AND organization_id = ?").run(complete ? new Date().toISOString() : null, id, orgId).changes);
}
export function addCommunication(orgId: string, author: string, body: string, visibility: "partner" | "internal") {
  const id = crypto.randomUUID();
  const partnership = db.prepare("SELECT id FROM partnerships WHERE organization_id = ? ORDER BY season DESC LIMIT 1").get(orgId) as { id: string };
  db.prepare("INSERT INTO communications (id,organization_id,partnership_id,author,body,visibility,delivery_status,created_at) VALUES (?,?,?,?,?,?,?,?)").run(id, orgId, partnership.id, author, body, visibility, "Logged only", new Date().toISOString());
  return id;
}
export function addFile(orgId: string, originalName: string, storedName: string, mimeType: string, size: number, visibility: "partner" | "internal") {
  const id = crypto.randomUUID();
  const partnership = db.prepare("SELECT id FROM partnerships WHERE organization_id = ? ORDER BY season DESC LIMIT 1").get(orgId) as { id: string };
  db.prepare("INSERT INTO files (id,organization_id,partnership_id,original_name,stored_name,mime_type,size,visibility,uploaded_at) VALUES (?,?,?,?,?,?,?,?,?)").run(id, orgId, partnership.id, originalName, storedName, mimeType, size, visibility, new Date().toISOString());
  return id;
}
export function getFile(orgId: string, id: string) {
  return db.prepare("SELECT * FROM files WHERE organization_id=? AND id=?").get(orgId, id) as (StoredFile & { stored_name: string }) | undefined;
}
export function setFileVisibility(orgId: string, id: string, visibility: "partner" | "internal") {
  return db.prepare("UPDATE files SET visibility=? WHERE organization_id=? AND id=?").run(visibility, orgId, id).changes;
}
export function updateLinks(orgId: string, website: string | null, instagram: string | null, facebook: string | null) {
  db.prepare("UPDATE organizations SET website=?, instagram=?, facebook=? WHERE id=?").run(website, instagram, facebook, orgId);
}
