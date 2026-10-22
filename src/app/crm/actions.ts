"use server";

import { getSession } from "@/lib/auth";
import { addCrmNote, getCrmClub, setCrmNextAction } from "@/lib/db";
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
