import { getSession } from "@/lib/auth";
import { getFile } from "@/lib/db";
import fs from "node:fs/promises";
import path from "node:path";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });
  const orgId = session.role === "partner_admin" ? session.organizationId : "cyclones";
  if (!orgId) return new Response("Forbidden", { status: 403 });
  const file = getFile(orgId, (await context.params).id);
  if (!file || (session.role === "partner_admin" && file.visibility !== "partner")) return new Response("Not found", { status: 404 });
  const uploadDir = path.resolve(process.env.YSP_UPLOAD_DIR || ".data/uploads");
  const data = await fs.readFile(path.join(uploadDir, file.stored_name));
  return new Response(data, { headers: { "Content-Type": file.mime_type, "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.original_name)}`, "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store" } });
}
