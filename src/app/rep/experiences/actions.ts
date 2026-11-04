"use server";

import { getSession } from "@/lib/auth";
import { createCatalogType, createGroup, createOffering, createReservation, getOffering, getReservation, getSprintMatch, removeOffering, saveCatalogType, saveMatch, saveOffering, saveReservation } from "@/lib/experiences";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function staffId() {
  const session = await getSession();
  if (session?.role !== "rep") throw new Error("Forbidden");
  return session.userId;
}
const field = (form: FormData, key: string) => String(form.get(key) || "");
const number = (form: FormData, key: string) => Number(field(form, key));
const checked = (form: FormData, key: string) => form.get(key) === "on";
function back(matchId: string, error?: string) {
  revalidatePath("/rep/experiences");
  revalidatePath(`/rep/experiences/${matchId}`);
  redirect(`/rep/experiences/${matchId}${error ? `?error=${encodeURIComponent(error)}` : "?saved=1"}`);
}
function fail(error: unknown) { return error instanceof Error ? error.message : "Could not save changes"; }

export async function saveMatchAction(form: FormData) {
  const actor = await staffId(), id = field(form, "matchId");
  try { saveMatch(id, { date: field(form, "date"), kickoff: field(form, "kickoff"), opponent: field(form, "opponent"), code: field(form, "code"), venue: field(form, "venue"), venueConfirmed: checked(form, "venueConfirmed"), status: field(form, "status"), note: field(form, "note") }, actor); }
  catch (error) { back(id, fail(error)); }
  back(id);
}
export async function createCatalogAction(form: FormData) {
  const actor = await staffId();
  try { createCatalogType(field(form, "name"), actor); }
  catch (error) { redirect(`/rep/experiences/catalog?error=${encodeURIComponent(fail(error))}`); }
  revalidatePath("/rep/experiences/catalog");
  redirect("/rep/experiences/catalog?saved=1");
}
export async function saveCatalogAction(form: FormData) {
  const actor = await staffId();
  try { saveCatalogType(field(form, "catalogId"), { description: field(form, "description"), eligibility: field(form, "eligibility"), ticketRule: field(form, "ticketRule"), reviewStatus: field(form, "reviewStatus") }, actor); }
  catch (error) { redirect(`/rep/experiences/catalog?error=${encodeURIComponent(fail(error))}`); }
  revalidatePath("/rep/experiences/catalog");
  redirect("/rep/experiences/catalog?saved=1");
}
export async function addOfferingAction(form: FormData) {
  const actor = await staffId(), matchId = field(form, "matchId");
  try { createOffering(matchId, field(form, "catalogId"), actor); }
  catch (error) { back(matchId, fail(error)); }
  back(matchId);
}
export async function saveOfferingAction(form: FormData) {
  const actor = await staffId(), offering = getOffering(field(form, "offeringId"));
  if (!offering) throw new Error("Offering not found");
  try { saveOffering(offering.id, { location: field(form, "location"), participants: number(form, "participants"), chaperones: number(form, "chaperones"), eligibility: field(form, "eligibility"), ticketRule: field(form, "ticketRule"), logistics: field(form, "logistics"), rulesApproved: checked(form, "rulesApproved"), status: field(form, "status") }, actor); }
  catch (error) { back(offering.match_id, fail(error)); }
  back(offering.match_id);
}
export async function removeOfferingAction(form: FormData) {
  const actor = await staffId(), offering = getOffering(field(form, "offeringId"));
  if (!offering) throw new Error("Offering not found");
  try { removeOffering(offering.id, actor); }
  catch (error) { back(offering.match_id, fail(error)); }
  back(offering.match_id);
}
export async function createGroupAction(form: FormData) {
  const actor = await staffId(), matchId = field(form, "matchId");
  if (!getSprintMatch(matchId)) throw new Error("Match not found");
  try { createGroup(field(form, "name"), field(form, "organizationId") || null, actor); }
  catch (error) { back(matchId, fail(error)); }
  back(matchId);
}
export async function createReservationAction(form: FormData) {
  const actor = await staffId(), offering = getOffering(field(form, "offeringId"));
  if (!offering) throw new Error("Offering not found");
  try { createReservation(offering.id, { groupId: field(form, "groupId"), repId: field(form, "repId"), participants: number(form, "participants"), chaperones: number(form, "chaperones"), status: field(form, "status"), holdExpiresEt: field(form, "holdExpiresEt"), nextAction: field(form, "nextAction"), notes: field(form, "notes") }, actor); }
  catch (error) { back(offering.match_id, fail(error)); }
  back(offering.match_id);
}
export async function saveReservationAction(form: FormData) {
  const actor = await staffId(), reservation = getReservation(field(form, "reservationId"));
  if (!reservation) throw new Error("Reservation not found");
  const offering = getOffering(reservation.offering_id)!;
  try { saveReservation(reservation.id, { groupId: field(form, "groupId"), repId: field(form, "repId"), participants: number(form, "participants"), chaperones: number(form, "chaperones"), status: field(form, "status"), holdExpiresEt: field(form, "holdExpiresEt"), nextAction: field(form, "nextAction"), notes: field(form, "notes"), rosterStatus: field(form, "rosterStatus"), instructionStatus: field(form, "instructionStatus"), waiverStatus: field(form, "waiverStatus") }, actor); }
  catch (error) { back(offering.match_id, fail(error)); }
  back(offering.match_id);
}
