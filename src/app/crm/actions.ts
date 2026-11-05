"use server";

import { getSession } from "@/lib/auth";
import { addCrmContact, addCrmNote, getCrmClub, removeCrmContact, setCrmNextAction, setCrmClassification, setCrmRep, updateCrmContact } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function requireCrmRep(form: FormData) {
  const session = await getSession();
  const orgId = String(form.get("orgId") || "");
  if (session?.role !== "rep" || session.userId !== "phineas" || !getCrmClub(orgId)) throw new Error("Forbidden");
  return { orgId, repId: session.userId };
}

export async function saveCrmNote(form: FormData) {
  const { orgId, repId } = await requireCrmRep(form);
  const note = String(form.get("note") || "").trim();
  if (!note || note.length > 2000) throw new Error("Enter a note of up to 2,000 characters");
  addCrmNote(orgId, repId, note);
  revalidatePath(`/crm/${orgId}`);
}

export async function saveCrmNextAction(form: FormData) {
  const { orgId } = await requireCrmRep(form);
  const nextAction = String(form.get("nextAction") || "").trim();
  if (nextAction.length > 500) throw new Error("Next action is too long");
  setCrmNextAction(orgId, nextAction || null);
  revalidatePath("/crm");
  revalidatePath(`/crm/${orgId}`);
}

export async function saveCrmClassification(form: FormData) {
  const { orgId } = await requireCrmRep(form);
  if (!setCrmClassification(orgId, String(form.get("segment") || ""), String(form.get("area") || ""))) throw new Error("Invalid club grouping");
  revalidatePath("/crm");
  revalidatePath(`/crm/${orgId}`);
}

export async function saveCrmRep(form: FormData) {
  const { orgId } = await requireCrmRep(form);
  const repId = String(form.get("repId") || "");
  if (!setCrmRep(orgId, repId || null)) throw new Error("Invalid rep assignment");
  revalidatePath("/crm");
  revalidatePath(`/crm/${orgId}`);
  revalidatePath("/rep");
}

function contactFields(form: FormData) {
  const name = String(form.get("name") || "").trim();
  const email = String(form.get("email") || "").trim();
  const phone = String(form.get("phone") || "").trim();
  const ticketingId = String(form.get("ticketingId") || "").trim();
  if (!name || name.length > 120) throw new Error("Enter a contact name of up to 120 characters");
  if (email.length > 254 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) throw new Error("Enter a valid email address");
  if (phone.length > 40 || ticketingId.length > 80) throw new Error("Contact detail is too long");
  return { name, email: email || null, phone: phone || null, ticketingId: ticketingId || null };
}

export async function createCrmContact(form: FormData) {
  const { orgId } = await requireCrmRep(form);
  const { name, email, phone, ticketingId } = contactFields(form);
  if (!addCrmContact(orgId, name, email, phone, ticketingId)) throw new Error("Club not found");
  revalidatePath(`/crm/${orgId}`);
}

export async function saveCrmContact(form: FormData) {
  const { orgId } = await requireCrmRep(form);
  const contactId = String(form.get("contactId") || "");
  const { name, email, phone, ticketingId } = contactFields(form);
  if (!updateCrmContact(orgId, contactId, name, email, phone, ticketingId)) throw new Error("Contact not found on this club");
  revalidatePath(`/crm/${orgId}`);
}

export async function deleteCrmContact(form: FormData) {
  const { orgId } = await requireCrmRep(form);
  const contactId = String(form.get("contactId") || "");
  if (!removeCrmContact(orgId, contactId)) throw new Error("Contact not found on this club");
  revalidatePath(`/crm/${orgId}`);
}
