"use server";

import { getSession } from "@/lib/auth";
import { addCommunication, addFile, getPartner, setFileVisibility, setRequirement, updateLinks } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

async function requireRep(orgId: string) {
  const session = await getSession();
  if (session?.role !== "rep" || session.userId !== "phineas" || !getPartner(orgId)) throw new Error("Forbidden");
  return session;
}
function refresh(orgId: string) {
  revalidatePath("/rep");
  revalidatePath(`/rep/partners/${orgId}`);
  revalidatePath("/partner");
}
function requiredString(form: FormData, field: string, limit: number) {
  const value = String(form.get(field) || "").trim();
  if (!value || value.length > limit) throw new Error(`Invalid ${field}`);
  return value;
}

export async function toggleRequirement(form: FormData) {
  const orgId = requiredString(form, "orgId", 100);
  await requireRep(orgId);
  setRequirement(orgId, requiredString(form, "requirementId", 100), form.get("complete") === "1");
  refresh(orgId);
}
export async function saveLinks(form: FormData) {
  const orgId = requiredString(form, "orgId", 100);
  await requireRep(orgId);
  const link = (field: string) => {
    const value = String(form.get(field) || "").trim();
    if (!value) return null;
    if (value.length > 300) throw new Error("Link is too long");
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only web links are allowed");
    return url.toString();
  };
  updateLinks(orgId, link("website"), link("instagram"), link("facebook"));
  refresh(orgId);
}
export async function logMessage(form: FormData) {
  const orgId = requiredString(form, "orgId", 100);
  const session = await requireRep(orgId);
  const visibility = form.get("visibility") === "partner" ? "partner" : "internal";
  addCommunication(orgId, session.name, requiredString(form, "body", 2000), visibility);
  refresh(orgId);
}
export async function uploadFile(form: FormData) {
  const orgId = requiredString(form, "orgId", 100);
  await requireRep(orgId);
  const file = form.get("file");
  if (!(file instanceof File) || !file.size || file.size > 10 * 1024 * 1024) throw new Error("Choose a file up to 10 MB");
  const allowed = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp", "text/plain"]);
  if (!allowed.has(file.type)) throw new Error("Unsupported file type");
  const uploadDir = path.resolve(process.env.YSP_UPLOAD_DIR || ".data/uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  const storedName = randomUUID();
  await fs.writeFile(path.join(uploadDir, storedName), Buffer.from(await file.arrayBuffer()), { flag: "wx", mode: 0o600 });
  addFile(orgId, file.name.slice(0, 200), storedName, file.type, file.size, form.get("visibility") === "partner" ? "partner" : "internal");
  refresh(orgId);
}
export async function changeFileVisibility(form: FormData) {
  const orgId = requiredString(form, "orgId", 100);
  await requireRep(orgId);
  setFileVisibility(orgId, requiredString(form, "fileId", 100), form.get("visibility") === "partner" ? "partner" : "internal");
  refresh(orgId);
}
export async function goToPartnerPreview() {
  const session = await getSession();
  if (session?.role !== "rep") throw new Error("Forbidden");
  redirect("/partner?preview=cyclones");
}
