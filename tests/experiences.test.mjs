import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "ysp-experiences-test-"));
process.env.YSP_DB_PATH = path.join(temp, "test.sqlite");
const data = await import("../src/lib/experiences.ts");

test("seven Sprint matches are seeded with Eastern schedule and draft catalog only", () => {
  const matches = data.listSprintMatches();
  assert.deepEqual(matches.map(m => [m.match_date, m.opponent_code, m.kickoff_et, m.venue]), [
    ["2027-03-03", "MIA", "19:00", "Yankee Stadium"],
    ["2027-03-06", "PHI", "15:00", "Yankee Stadium"],
    ["2027-03-13", "TOR", "19:00", "Yankee Stadium"],
    ["2027-03-27", "DC", "19:00", "Venue TBD"],
    ["2027-04-03", "CLB", "19:00", "Yankee Stadium"],
    ["2027-04-24", "CLT", "19:00", "Yankee Stadium"],
    ["2027-05-08", "RBNY", "17:00", "Yankee Stadium"],
  ]);
  assert.equal(data.getSprintMatch("sprint-2027-03-27").venue_confirmed, 0);
  assert.equal(data.listOfferings().length, 0);
  assert.equal(data.listCatalog().length, 11);
  assert.ok(data.listCatalog().every(type => type.review_status === "draft" && !type.ticket_rule_draft && !type.eligibility_draft));
});

test("separate groups share capacity, expired holds free spots, and schedule edits flag instructions", () => {
  const matchId = "sprint-2027-03-03";
  const offeringId = data.createOffering(matchId, "ball-kids", "phineas");
  assert.equal(data.getOffering(offeringId).status, "pending_confirmation");
  const groupA = data.createGroup("Test group A", null, "phineas");
  const groupB = data.createGroup("Test group B", null, "phineas");
  assert.throws(() => data.createReservation(offeringId, { groupId: groupA, repId: "phineas", participants: 1, chaperones: 0, status: "confirmed", holdExpiresEt: "", nextAction: "", notes: "" }, "phineas"), /approved and available/);
  data.saveCatalogType("ball-kids", { description: "Test definition", eligibility: "Test only", ticketRule: "Test only", reviewStatus: "approved" }, "phineas");
  data.saveOffering(offeringId, { location: "Staff review location", participants: 10, chaperones: 2, eligibility: "", ticketRule: "", logistics: "", rulesApproved: true, status: "available" }, "phineas");
  const firstId = data.createReservation(offeringId, { groupId: groupA, repId: "phineas", participants: 4, chaperones: 1, status: "confirmed", holdExpiresEt: "", nextAction: "Get roster", notes: "Test only" }, "phineas");
  const secondId = data.createReservation(offeringId, { groupId: groupB, repId: "phineas", participants: 3, chaperones: 1, status: "hold", holdExpiresEt: "2099-12-31T23:00", nextAction: "Confirm hold", notes: "Test only" }, "phineas");
  assert.deepEqual(data.availability(data.getOffering(offeringId), data.listReservations(offeringId)), {
    heldParticipants: 3, heldChaperones: 1, confirmedParticipants: 4, confirmedChaperones: 1, availableParticipants: 3, availableChaperones: 0,
  });
  assert.throws(() => data.createReservation(offeringId, { groupId: groupA, repId: "phineas", participants: 4, chaperones: 0, status: "confirmed", holdExpiresEt: "", nextAction: "", notes: "" }, "phineas"), /Not enough spots/);
  const raw = new DatabaseSync(process.env.YSP_DB_PATH);
  raw.prepare("UPDATE experience_reservations SET hold_expires_et='2020-01-01T00:00' WHERE id=?").run(secondId);
  raw.close();
  assert.equal(data.effectiveReservationStatus(data.getReservation(secondId)), "expired");
  assert.equal(data.availability(data.getOffering(offeringId), data.listReservations(offeringId)).availableParticipants, 6);
  assert.equal(data.availability(data.getOffering(offeringId), data.listReservations(offeringId)).availableChaperones, 1);
  data.saveReservation(firstId, { groupId: groupA, repId: "phineas", participants: 4, chaperones: 1, status: "confirmed", holdExpiresEt: "", rosterStatus: "received", instructionStatus: "sent", waiverStatus: "in_progress", nextAction: "Collect waivers", notes: "Test only" }, "phineas");
  data.saveMatch(matchId, { date: "2027-03-03", kickoff: "20:00", opponent: "Inter Miami CF", code: "MIA", venue: "Yankee Stadium", venueConfirmed: true, status: "rescheduled", note: "Test kickoff changed" }, "phineas");
  assert.equal(data.getReservation(firstId).instruction_status, "needs_review");
  assert.equal(data.getReservation(firstId).waiver_status, "in_progress");
  assert.ok(data.listExperienceAudit("match", matchId).some(entry => entry.action === "updated match facts"));
});

test("Venue TBD blocks instruction approval and active offerings cannot be cancelled below bookings", () => {
  const matchId = "sprint-2027-03-27";
  const offeringId = data.createOffering(matchId, "prematch-photo", "phineas");
  data.saveCatalogType("prematch-photo", { description: "Test definition", eligibility: "Test only", ticketRule: "Test only", reviewStatus: "approved" }, "phineas");
  data.saveOffering(offeringId, { location: "", participants: 5, chaperones: 0, eligibility: "", ticketRule: "", logistics: "", rulesApproved: true, status: "available" }, "phineas");
  const groupId = data.createGroup("Test group C", null, "phineas");
  const id = data.createReservation(offeringId, { groupId, repId: "phineas", participants: 1, chaperones: 0, status: "confirmed", holdExpiresEt: "", nextAction: "", notes: "" }, "phineas");
  assert.throws(() => data.saveReservation(id, { groupId, repId: "phineas", participants: 1, chaperones: 0, status: "confirmed", holdExpiresEt: "", rosterStatus: "received", instructionStatus: "sent", waiverStatus: "complete", nextAction: "", notes: "" }, "phineas"), /Confirm the venue/);
  assert.throws(() => data.removeOffering(offeringId, "phineas"), /Release active reservations/);
  data.saveReservation(id, { groupId, repId: "phineas", participants: 1, chaperones: 0, status: "released", holdExpiresEt: "", rosterStatus: "not_started", instructionStatus: "not_started", waiverStatus: "not_started", nextAction: "", notes: "" }, "phineas");
  data.removeOffering(offeringId, "phineas");
  assert.equal(data.getOffering(offeringId).status, "cancelled");
});
