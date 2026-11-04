import "./db.ts";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";

const db = new DatabaseSync(path.resolve(process.env.YSP_DB_PATH || ".data/ysp.sqlite"), { timeout: 5000 });
db.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
db.exec(`
CREATE TABLE IF NOT EXISTS sprint_matches (
  id TEXT PRIMARY KEY, match_date TEXT NOT NULL, kickoff_et TEXT NOT NULL,
  opponent TEXT NOT NULL, opponent_code TEXT NOT NULL, venue TEXT NOT NULL,
  venue_confirmed INTEGER NOT NULL DEFAULT 1, status TEXT NOT NULL DEFAULT 'scheduled',
  operational_note TEXT NOT NULL DEFAULT '', updated_at TEXT
);
CREATE TABLE IF NOT EXISTS experience_catalog (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
  eligibility_draft TEXT NOT NULL DEFAULT '', ticket_rule_draft TEXT NOT NULL DEFAULT '',
  review_status TEXT NOT NULL DEFAULT 'draft'
);
CREATE TABLE IF NOT EXISTS match_offerings (
  id TEXT PRIMARY KEY, match_id TEXT NOT NULL REFERENCES sprint_matches(id),
  catalog_id TEXT NOT NULL REFERENCES experience_catalog(id),
  location TEXT NOT NULL DEFAULT '', capacity_participants INTEGER NOT NULL DEFAULT 0,
  capacity_chaperones INTEGER NOT NULL DEFAULT 0, eligibility TEXT NOT NULL DEFAULT '',
  ticket_rule TEXT NOT NULL DEFAULT '', logistics TEXT NOT NULL DEFAULT '',
  rules_approved INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'pending_confirmation',
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS experience_groups (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, organization_id TEXT REFERENCES organizations(id),
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS experience_reservations (
  id TEXT PRIMARY KEY, offering_id TEXT NOT NULL REFERENCES match_offerings(id),
  group_id TEXT NOT NULL REFERENCES experience_groups(id), rep_id TEXT REFERENCES users(id),
  participants INTEGER NOT NULL DEFAULT 0, chaperones INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'hold', hold_expires_et TEXT,
  roster_status TEXT NOT NULL DEFAULT 'not_started',
  instruction_status TEXT NOT NULL DEFAULT 'not_started',
  waiver_status TEXT NOT NULL DEFAULT 'not_started',
  next_action TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS experience_audit (
  id TEXT PRIMARY KEY, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL,
  actor_id TEXT NOT NULL, action TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_offerings_match ON match_offerings(match_id);
CREATE INDEX IF NOT EXISTS idx_reservations_offering ON experience_reservations(offering_id);
`);

const schedule = [
  ["2027-03-03", "19:00", "Inter Miami CF", "MIA", "Yankee Stadium", 1],
  ["2027-03-06", "15:00", "Philadelphia Union", "PHI", "Yankee Stadium", 1],
  ["2027-03-13", "19:00", "Toronto FC", "TOR", "Yankee Stadium", 1],
  ["2027-03-27", "19:00", "D.C. United", "DC", "Venue TBD", 0],
  ["2027-04-03", "19:00", "Columbus Crew", "CLB", "Yankee Stadium", 1],
  ["2027-04-24", "19:00", "Charlotte FC", "CLT", "Yankee Stadium", 1],
  ["2027-05-08", "17:00", "New York Red Bulls", "RBNY", "Yankee Stadium", 1],
] as const;
const catalogSeed = [
  ["home-player-mascots", "Player mascots — home"],
  ["away-player-mascots", "Player mascots — away"],
  ["ball-kids", "Ball kids"],
  ["nycfc-flag", "NYCFC flag"],
  ["jersey-banner", "On-field jersey banner"],
  ["high-five-tunnel", "High 5 Tunnel"],
  ["prematch-photo", "Pre-match photo"],
  ["halftime-photo", "Halftime photo"],
  ["warmup-watchers", "Warm-up watchers"],
  ["postmatch-kick", "Post-match kick"],
  ["player-appearance", "Player appearance (venue dependent)"],
] as const;
db.exec("BEGIN IMMEDIATE");
try {
  const insertMatch = db.prepare("INSERT OR IGNORE INTO sprint_matches (id,match_date,kickoff_et,opponent,opponent_code,venue,venue_confirmed) VALUES (?,?,?,?,?,?,?)");
  for (const [date, time, opponent, code, venue, confirmed] of schedule) insertMatch.run(`sprint-${date}`, date, time, opponent, code, venue, confirmed);
  const insertType = db.prepare("INSERT OR IGNORE INTO experience_catalog (id,name) VALUES (?,?)");
  for (const [id, name] of catalogSeed) insertType.run(id, name);
  db.exec("COMMIT");
} catch (error) { db.exec("ROLLBACK"); throw error; }

export type SprintMatch = { id: string; match_date: string; kickoff_et: string; opponent: string; opponent_code: string; venue: string; venue_confirmed: number; status: string; operational_note: string; updated_at: string | null };
export type CatalogType = { id: string; name: string; description: string; eligibility_draft: string; ticket_rule_draft: string; review_status: string };
export type Offering = { id: string; match_id: string; catalog_id: string; type_name: string; location: string; capacity_participants: number; capacity_chaperones: number; eligibility: string; ticket_rule: string; logistics: string; rules_approved: number; status: string };
export type Group = { id: string; name: string; organization_id: string | null };
export type Reservation = { id: string; offering_id: string; group_id: string; group_name: string; rep_id: string | null; rep_name: string | null; participants: number; chaperones: number; status: string; hold_expires_et: string | null; roster_status: string; instruction_status: string; waiver_status: string; next_action: string; notes: string };

export function nowEastern() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}T${value.hour}:${value.minute}`;
}
export function effectiveReservationStatus(r: Reservation, now = nowEastern()) {
  return r.status === "hold" && (!r.hold_expires_et || r.hold_expires_et <= now) ? "expired" : r.status;
}
export function listSprintMatches() { return db.prepare("SELECT * FROM sprint_matches ORDER BY match_date,kickoff_et").all() as SprintMatch[]; }
export function getSprintMatch(id: string) { return db.prepare("SELECT * FROM sprint_matches WHERE id=?").get(id) as SprintMatch | undefined; }
export function listCatalog() { return db.prepare("SELECT * FROM experience_catalog ORDER BY name").all() as CatalogType[]; }
export function getCatalogType(id: string) { return db.prepare("SELECT * FROM experience_catalog WHERE id=?").get(id) as CatalogType | undefined; }
export function listOfferings(matchId?: string) {
  return db.prepare(`SELECT o.*,c.name AS type_name FROM match_offerings o JOIN experience_catalog c ON c.id=o.catalog_id ${matchId ? "WHERE o.match_id=?" : ""} ORDER BY c.name,o.created_at`).all(...(matchId ? [matchId] : [])) as Offering[];
}
export function getOffering(id: string) { return db.prepare("SELECT o.*,c.name AS type_name FROM match_offerings o JOIN experience_catalog c ON c.id=o.catalog_id WHERE o.id=?").get(id) as Offering | undefined; }
export function listGroups() { return db.prepare("SELECT id,name,organization_id FROM experience_groups ORDER BY name").all() as Group[]; }
export function listStaff() { return db.prepare("SELECT id,name FROM users WHERE role='rep' ORDER BY name").all() as { id: string; name: string }[]; }
export function listReservations(offeringId?: string) {
  return db.prepare(`SELECT r.*,g.name AS group_name,u.name AS rep_name FROM experience_reservations r JOIN experience_groups g ON g.id=r.group_id LEFT JOIN users u ON u.id=r.rep_id ${offeringId ? "WHERE r.offering_id=?" : ""} ORDER BY r.created_at`).all(...(offeringId ? [offeringId] : [])) as Reservation[];
}
export function getReservation(id: string) { return db.prepare("SELECT r.*,g.name AS group_name,u.name AS rep_name FROM experience_reservations r JOIN experience_groups g ON g.id=r.group_id LEFT JOIN users u ON u.id=r.rep_id WHERE r.id=?").get(id) as Reservation | undefined; }
export function availability(offering: Offering, reservations: Reservation[], now = nowEastern()) {
  const active = reservations.filter(r => r.offering_id === offering.id);
  const held = active.filter(r => effectiveReservationStatus(r, now) === "hold");
  const confirmed = active.filter(r => r.status === "confirmed");
  const sum = (rows: Reservation[], key: "participants" | "chaperones") => rows.reduce((total, row) => total + row[key], 0);
  const heldParticipants = sum(held, "participants"), heldChaperones = sum(held, "chaperones");
  const confirmedParticipants = sum(confirmed, "participants"), confirmedChaperones = sum(confirmed, "chaperones");
  return {
    heldParticipants, heldChaperones, confirmedParticipants, confirmedChaperones,
    availableParticipants: Math.max(0, offering.capacity_participants - heldParticipants - confirmedParticipants),
    availableChaperones: Math.max(0, offering.capacity_chaperones - heldChaperones - confirmedChaperones),
  };
}
function audit(entityType: string, entityId: string, actorId: string, action: string) {
  db.prepare("INSERT INTO experience_audit (id,entity_type,entity_id,actor_id,action,created_at) VALUES (?,?,?,?,?,?)").run(crypto.randomUUID(), entityType, entityId, actorId, action, new Date().toISOString());
}
function bounded(value: string, max: number) { const text = value.trim(); if (text.length > max) throw new Error("Text is too long"); return text; }
function nonnegative(value: number) { if (!Number.isInteger(value) || value < 0 || value > 10000) throw new Error("Enter a valid capacity or allocation"); return value; }
const matchStatuses = ["scheduled", "rescheduled", "postponed", "cancelled"];
const offeringStatuses = ["pending_confirmation", "available", "paused", "cancelled"];
const reservationStatuses = ["hold", "confirmed", "released", "cancelled"];
const rosterStatuses = ["not_started", "partial", "received"];
const instructionStatuses = ["not_started", "approved", "sent", "needs_review"];
const waiverStatuses = ["not_started", "in_progress", "complete"];
function oneOf(value: string, values: string[]) { if (!values.includes(value)) throw new Error("Invalid status"); return value; }
function transaction<T>(work: () => T): T { db.exec("BEGIN IMMEDIATE"); try { const result = work(); db.exec("COMMIT"); return result; } catch (error) { db.exec("ROLLBACK"); throw error; } }

export function saveMatch(id: string, input: { date: string; kickoff: string; opponent: string; code: string; venue: string; venueConfirmed: boolean; status: string; note: string }, actorId: string) {
  if (!getSprintMatch(id)) throw new Error("Match not found");
  const parsedDate = new Date(`${input.date}T12:00:00Z`);
  if (!/^2027-\d{2}-\d{2}$/.test(input.date) || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== input.date || !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.kickoff)) throw new Error("Enter a valid 2027 date and Eastern kickoff");
  const opponent = bounded(input.opponent, 120), code = bounded(input.code, 12), venue = bounded(input.venue, 120), note = bounded(input.note, 2000);
  if (!opponent || !code || !venue) throw new Error("Opponent and venue are required");
  if (input.venueConfirmed && /\btbd\b/i.test(venue)) throw new Error("Set a venue before marking it confirmed");
  const status = oneOf(input.status, matchStatuses);
  return transaction(() => {
    const previous = getSprintMatch(id)!;
    db.prepare("UPDATE sprint_matches SET match_date=?,kickoff_et=?,opponent=?,opponent_code=?,venue=?,venue_confirmed=?,status=?,operational_note=?,updated_at=? WHERE id=?")
      .run(input.date, input.kickoff, opponent, code, venue, input.venueConfirmed ? 1 : 0, status, note, new Date().toISOString(), id);
    if (previous.match_date !== input.date || previous.kickoff_et !== input.kickoff || previous.venue !== venue || previous.venue_confirmed !== Number(input.venueConfirmed)) {
      db.prepare("UPDATE experience_reservations SET instruction_status='needs_review' WHERE offering_id IN (SELECT id FROM match_offerings WHERE match_id=?) AND instruction_status IN ('approved','sent')").run(id);
    }
    audit("match", id, actorId, "updated match facts");
  });
}
export function saveCatalogType(id: string, input: { description: string; eligibility: string; ticketRule: string; reviewStatus: string }, actorId: string) {
  if (!getCatalogType(id)) throw new Error("Experience type not found");
  const status = oneOf(input.reviewStatus, ["draft", "approved"]);
  db.prepare("UPDATE experience_catalog SET description=?,eligibility_draft=?,ticket_rule_draft=?,review_status=? WHERE id=?")
    .run(bounded(input.description, 1000), bounded(input.eligibility, 500), bounded(input.ticketRule, 500), status, id);
  audit("catalog", id, actorId, "updated catalog definition");
}
export function createCatalogType(name: string, actorId: string) {
  const cleanName = bounded(name, 120); if (!cleanName) throw new Error("Enter an experience name");
  const id = crypto.randomUUID();
  db.prepare("INSERT INTO experience_catalog (id,name) VALUES (?,?)").run(id, cleanName);
  audit("catalog", id, actorId, "created draft catalog definition");
  return id;
}
export function createOffering(matchId: string, catalogId: string, actorId: string) {
  if (!getSprintMatch(matchId) || !getCatalogType(catalogId)) throw new Error("Match or type not found");
  const id = crypto.randomUUID(), now = new Date().toISOString(), type = getCatalogType(catalogId)!;
  db.prepare("INSERT INTO match_offerings (id,match_id,catalog_id,eligibility,ticket_rule,created_at,updated_at) VALUES (?,?,?,?,?,?,?)")
    .run(id, matchId, catalogId, type.eligibility_draft, type.ticket_rule_draft, now, now);
  audit("offering", id, actorId, "added draft match offering");
  return id;
}
export function saveOffering(id: string, input: { location: string; participants: number; chaperones: number; eligibility: string; ticketRule: string; logistics: string; rulesApproved: boolean; status: string }, actorId: string) {
  const offering = getOffering(id); if (!offering) throw new Error("Offering not found");
  const participants = nonnegative(input.participants), chaperones = nonnegative(input.chaperones);
  const status = oneOf(input.status, offeringStatuses);
  if (status === "available" && (!input.rulesApproved || participants + chaperones === 0)) throw new Error("Approve rules and set capacity before making this available");
  if (status === "available" && getCatalogType(offering.catalog_id)?.review_status !== "approved") throw new Error("Approve the catalog definition before making this available");
  return transaction(() => {
    const current = getOffering(id)!;
    const counts = availability(current, listReservations(id));
    if (participants < counts.heldParticipants + counts.confirmedParticipants || chaperones < counts.heldChaperones + counts.confirmedChaperones) throw new Error("Capacity is below active allocations");
    if (status === "cancelled" && (counts.heldParticipants + counts.heldChaperones + counts.confirmedParticipants + counts.confirmedChaperones) > 0) throw new Error("Release active reservations before cancelling this offering");
    db.prepare("UPDATE match_offerings SET location=?,capacity_participants=?,capacity_chaperones=?,eligibility=?,ticket_rule=?,logistics=?,rules_approved=?,status=?,updated_at=? WHERE id=?")
      .run(bounded(input.location, 150), participants, chaperones, bounded(input.eligibility, 500), bounded(input.ticketRule, 500), bounded(input.logistics, 1000), input.rulesApproved ? 1 : 0, status, new Date().toISOString(), id);
    audit("offering", id, actorId, "updated match offering");
  });
}
export function removeOffering(id: string, actorId: string) {
  const offering = getOffering(id); if (!offering) throw new Error("Offering not found");
  return transaction(() => {
    if (listReservations(id).some(r => ["hold", "confirmed"].includes(effectiveReservationStatus(r)))) throw new Error("Release active reservations before removing this offering");
    db.prepare("UPDATE match_offerings SET status='cancelled',updated_at=? WHERE id=?").run(new Date().toISOString(), id);
    audit("offering", id, actorId, "cancelled match offering");
  });
}
export function createGroup(name: string, organizationId: string | null, actorId: string) {
  const groupName = bounded(name, 120); if (!groupName) throw new Error("Enter a group name");
  if (organizationId && !db.prepare("SELECT 1 FROM organizations WHERE id=? AND kind='crm_club'").get(organizationId)) throw new Error("Club not found");
  const id = crypto.randomUUID();
  db.prepare("INSERT INTO experience_groups (id,name,organization_id,created_at) VALUES (?,?,?,?)").run(id, groupName, organizationId, new Date().toISOString());
  audit("group", id, actorId, "created group");
  return id;
}
export function createReservation(offeringId: string, input: { groupId: string; repId: string; participants: number; chaperones: number; status: string; holdExpiresEt: string; nextAction: string; notes: string }, actorId: string) {
  const id = crypto.randomUUID();
  saveReservationInternal(id, offeringId, input, actorId, true);
  return id;
}
export function saveReservation(id: string, input: { groupId: string; repId: string; participants: number; chaperones: number; status: string; holdExpiresEt: string; nextAction: string; notes: string; rosterStatus: string; instructionStatus: string; waiverStatus: string }, actorId: string) {
  const previous = getReservation(id); if (!previous) throw new Error("Reservation not found");
  saveReservationInternal(id, previous.offering_id, input, actorId, false);
}
function saveReservationInternal(id: string, offeringId: string, input: { groupId: string; repId: string; participants: number; chaperones: number; status: string; holdExpiresEt: string; nextAction: string; notes: string; rosterStatus?: string; instructionStatus?: string; waiverStatus?: string }, actorId: string, creating: boolean) {
  const status = oneOf(input.status, reservationStatuses);
  const participants = nonnegative(input.participants), chaperones = nonnegative(input.chaperones);
  if (participants + chaperones === 0) throw new Error("Allocate at least one spot");
  if (!db.prepare("SELECT 1 FROM experience_groups WHERE id=?").get(input.groupId)) throw new Error("Group not found");
  if (input.repId && !db.prepare("SELECT 1 FROM users WHERE id=? AND role='rep'").get(input.repId)) throw new Error("Rep not found");
  const expires = input.holdExpiresEt.trim();
  if (status === "hold" && (!/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/.test(expires) || expires <= nowEastern())) throw new Error("Active holds need a future Eastern expiration");
  const offering = getOffering(offeringId); if (!offering) throw new Error("Offering not found");
  const match = getSprintMatch(offering.match_id)!;
  if (!match.venue_confirmed && ["approved", "sent"].includes(input.instructionStatus || "")) throw new Error("Confirm the venue before approving or sending instructions");
  return transaction(() => {
    const current = getOffering(offeringId)!;
    if (["hold", "confirmed"].includes(status) && (current.status !== "available" || !current.rules_approved)) throw new Error("Offering must be approved and available before booking");
    if (["hold", "confirmed"].includes(status) && !["scheduled", "rescheduled"].includes(getSprintMatch(current.match_id)!.status)) throw new Error("Match must be scheduled before booking");
    const others = listReservations(offeringId).filter(r => r.id !== id);
    const counts = availability(current, others);
    if (["hold", "confirmed"].includes(status) && (participants > counts.availableParticipants || chaperones > counts.availableChaperones)) throw new Error("Not enough spots remain");
    const now = new Date().toISOString();
    if (creating) {
      db.prepare("INSERT INTO experience_reservations (id,offering_id,group_id,rep_id,participants,chaperones,status,hold_expires_et,next_action,notes,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)")
        .run(id, offeringId, input.groupId, input.repId || null, participants, chaperones, status, status === "hold" ? expires : null, bounded(input.nextAction, 500), bounded(input.notes, 2000), now, now);
    } else {
      db.prepare("UPDATE experience_reservations SET group_id=?,rep_id=?,participants=?,chaperones=?,status=?,hold_expires_et=?,roster_status=?,instruction_status=?,waiver_status=?,next_action=?,notes=?,updated_at=? WHERE id=?")
        .run(input.groupId, input.repId || null, participants, chaperones, status, status === "hold" ? expires : null,
          oneOf(input.rosterStatus || "not_started", rosterStatuses), oneOf(input.instructionStatus || "not_started", instructionStatuses), oneOf(input.waiverStatus || "not_started", waiverStatuses),
          bounded(input.nextAction, 500), bounded(input.notes, 2000), now, id);
    }
    audit("reservation", id, actorId, creating ? "created reservation" : "updated reservation");
  });
}
export function listExperienceAudit(entityType: string, entityId: string) {
  return db.prepare("SELECT a.action,a.created_at,u.name AS actor FROM experience_audit a LEFT JOIN users u ON u.id=a.actor_id WHERE a.entity_type=? AND a.entity_id=? ORDER BY a.created_at DESC").all(entityType, entityId) as { action: string; created_at: string; actor: string | null }[];
}
