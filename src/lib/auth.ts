import { cookies } from "next/headers";
import { randomBytes, createHash, scryptSync, timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const dbPath = path.resolve(process.env.YSP_DB_PATH || ".data/ysp.sqlite");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const authDb = new Database(dbPath);
authDb.exec(`CREATE TABLE IF NOT EXISTS demo_credentials (user_id TEXT PRIMARY KEY, salt TEXT NOT NULL, password_hash TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at INTEGER NOT NULL);`);

const credentialPath = path.join(path.dirname(dbPath), "demo-credentials.txt");
authDb.transaction(() => {
  if (authDb.prepare("SELECT 1 FROM demo_credentials LIMIT 1").get()) return;
  const lines = ["YSP local prototype credentials (keep this file private):"];
  for (const [userId, label] of [["phineas", "Rep"], ["cyclones-admin", "Partner admin"]]) {
    const password = randomBytes(18).toString("base64url");
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(password, salt, 64).toString("hex");
    authDb.prepare("INSERT INTO demo_credentials (user_id,salt,password_hash) VALUES (?,?,?)").run(userId, salt, hash);
    lines.push(`${label} (${userId}): ${password}`);
  }
  fs.writeFileSync(credentialPath, lines.join("\n") + "\n", { mode: 0o600, flag: "wx" });
}).immediate();

export type Session = { userId: string; role: "rep" | "partner_admin"; organizationId: string | null; name: string };
export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get("ysp_session")?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const hash = createHash("sha256").update(token).digest("hex");
  return authDb.prepare(`SELECT u.id AS userId,u.role,u.organization_id AS organizationId,u.name FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?`).get(hash, Date.now()) as Session | null;
}

export function verifyLogin(userId: string, password: string) {
  const row = authDb.prepare("SELECT salt,password_hash FROM demo_credentials WHERE user_id=?").get(userId) as { salt: string; password_hash: string } | undefined;
  if (!row) return false;
  const supplied = scryptSync(password, row.salt, 64);
  return timingSafeEqual(supplied, Buffer.from(row.password_hash, "hex"));
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
