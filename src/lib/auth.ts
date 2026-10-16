import { cookies } from "next/headers";
import { randomBytes, createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const dbPath = path.resolve(process.env.YSP_DB_PATH || ".data/ysp.sqlite");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const authDb = new Database(dbPath);
authDb.exec("CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at INTEGER NOT NULL);");

export type Session = { userId: string; role: "rep" | "partner_admin"; organizationId: string | null; name: string };
export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get("ysp_session")?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const hash = createHash("sha256").update(token).digest("hex");
  return authDb.prepare(`SELECT u.id AS userId,u.role,u.organization_id AS organizationId,u.name FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?`).get(hash, Date.now()) as Session | null;
}

export function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const hash = createHash("sha256").update(token).digest("hex");
  authDb.prepare("INSERT INTO sessions (token_hash,user_id,expires_at) VALUES (?,?,?)").run(hash, userId, Date.now() + 7 * 24 * 60 * 60 * 1000);
  return token;
}
export function deleteSession(token: string) {
  authDb.prepare("DELETE FROM sessions WHERE token_hash=?").run(createHash("sha256").update(token).digest("hex"));
}
