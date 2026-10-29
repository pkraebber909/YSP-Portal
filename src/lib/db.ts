import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

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
CREATE INDEX IF NOT EXISTS idx_requirements_org ON requirements(organization_id);
CREATE INDEX IF NOT EXISTS idx_files_org ON files(organization_id);
CREATE INDEX IF NOT EXISTS idx_communications_org ON communications(organization_id);
`);

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
  const insertClub = db.prepare("INSERT OR IGNORE INTO organizations (id,name,kind,logo_path) VALUES (?,?,?,?)");
  const fillLogo = db.prepare("UPDATE organizations SET logo_path=? WHERE id=? AND kind='crm_club' AND logo_path IS NULL");
  const insertRecord = db.prepare("INSERT OR IGNORE INTO crm_records (organization_id) VALUES (?)");
  for (const [id, name, logo] of [
    ["06-united-new-york", "06 United New York", "06-united-new-york.webp"],
    ["aafny", "AAFNY", "academy-argentina.webp"],
    ["alliance-athletics", "Alliance Athletics", "alliance-athletics.png"],
    ["alta-football-club", "Alta Football Club", "alta-football-club.png"],
    ["brooklyn-hares-football-club", "Brooklyn Hares Football Club", "brooklyn-hares-football-club.png"],
    ["corona-soccer-kids-fc", "Corona Soccer Kids FC", "corona-soccer-kids-fc.webp"],
    ["dkay-henry-soccer-training", "DKAY Henry Soccer Training", "dkay-henry-soccer-training.webp"],
    ["eleftheria-pancyprian", "Eleftheria-Pancyprian", "eleftheria-pancyprian.webp"],
    ["futbol-rebels", "Futbol Rebels", "futbol-rebels.webp"],
    ["guerreros-fc", "Guerreros FC", "guerreros-fc.webp"],
    ["gw-ysl", "GW YSL", "gw-ysl.webp"],
    ["imperio-new-york", "Imperio New York", "imperio-new-york.webp"],
    ["liga-16-de-septiembre", "Liga 16 de Septiembre", "liga-16-de-septiembre.webp"],
    ["morelia-soccer-academy-ny", "Morelia Soccer Academy NY", "morelia-soccer-academy-ny.webp"],
    ["new-york-kids-soccer-club", "New York Kids Soccer Club", "new-york-kids-soccer-club.webp"],
    ["new-york-talentos", "New York Talentos", "new-york-talentos.webp"],
    ["peruvian-american-soccer-nyc", "Peruvian American Soccer NYC", "peruvian-american-soccer-nyc.webp"],
    ["reato-soccer-academy", "Reato Soccer Academy", "reato-soccer-academy.webp"],
    ["sc-gjoa", "SC Gjøa", "sc-gjoa.webp"],
    ["soccer-friends-usa", "Soccer Friends USA", "soccer-friends-usa.webp"],
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
    ["epsc", "EPSC"],
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
    ["liitle-neck-douglaston", "Liitle Neck Douglaston"],
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
    ["liga-16-de-septiembre", "Liga 16 de Septiembre", "Liga Diesiseis De Septiembre"],
    ["morelia-soccer-academy-ny", "Morelia Soccer Academy NY", "Morelia Soccer Academy"],
    ["new-york-kids-soccer-club", "New York Kids Soccer Club", "New York Kids SC"],
    ["reato-soccer-academy", "Reato Soccer Academy", "Reato Soccer"],
    ["sc-gjoa", "SC Gjøa", "SC GJOA"],
  ]) renameClub.run(newName, id, oldName);
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
export type CrmClub = { id: string; name: string; logo_path: string | null; next_action: string | null; updated_at: string | null };
export type CrmNote = { id: string; note: string; author: string; created_at: string };

export function listCrmClubs() {
  return db.prepare("SELECT o.id,o.name,o.logo_path,r.next_action,r.updated_at FROM crm_records r JOIN organizations o ON o.id=r.organization_id WHERE o.kind='crm_club' ORDER BY o.name COLLATE NOCASE").all() as CrmClub[];
}
export function getCrmClub(orgId: string) {
  return db.prepare("SELECT o.id,o.name,o.logo_path,r.next_action,r.updated_at FROM crm_records r JOIN organizations o ON o.id=r.organization_id WHERE o.kind='crm_club' AND o.id=?").get(orgId) as CrmClub | undefined;
}
export function listCrmNotes(orgId: string) {
  return db.prepare("SELECT a.id,a.note,COALESCE(u.name,'Rep') AS author,a.created_at FROM crm_activities a LEFT JOIN users u ON u.id=a.rep_id WHERE a.organization_id=? ORDER BY a.created_at DESC, a.rowid DESC").all(orgId) as CrmNote[];
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
