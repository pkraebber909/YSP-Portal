// Workbook preparation only. This module does not write contact data.
export type ImportClub = { id: string; name: string; aliases: string[]; segment: string; activePartnership?: boolean; area?: string };
export type ClubMatch = { decision: "eligible" | "excluded_partner" | "review_ambiguous" | "review_unmatched" | "review_missing_club"; clubId?: string };

export function normalizeContactText(value: unknown): string {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text === "-" ? "" : text;
}

export function splitContactEmails(value: unknown): string[] {
  const text = String(value ?? "");
  return [...new Set(text.split(/[;,\n]+/).map(part => part.trim().toLowerCase()).filter(part => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(part)))];
}

export function normalizeContactPhone(value: unknown): string {
  const text = normalizeContactText(value);
  const digits = text.replace(/\D/g, "");
  const ten = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  return ten.length === 10 ? `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}` : text;
}

export function matchImportClub(rawName: unknown, clubs: ImportClub[]): ClubMatch {
  const name = normalizeContactText(rawName).toLocaleLowerCase("en-US");
  if (!name) return { decision: "review_missing_club" };
  if (name.includes(";")) return { decision: "review_ambiguous" };
  const matches = clubs.filter(club => [club.name, ...club.aliases].some(value => normalizeContactText(value).toLocaleLowerCase("en-US") === name));
  if (matches.length === 0) return { decision: "review_unmatched" };
  if (matches.length > 1) return { decision: "review_ambiguous" };
  const club = matches[0];
  return { decision: club.segment === "current_ysp" || club.activePartnership ? "excluded_partner" : "eligible", clubId: club.id };
}

export function contactIdentityKey(clubId: string, name: unknown, emails: string[], phone: unknown): string | null {
  const person = normalizeContactText(name).toLocaleLowerCase("en-US");
  const normalizedPhone = normalizeContactPhone(phone).replace(/\D/g, "");
  if (!person || (!emails.length && !normalizedPhone)) return null;
  // A shared mailbox does not identify a person; the name and club are required.
  return [clubId, person, emails.length ? emails.map(email => email.toLowerCase()).sort().join(";") : normalizedPhone].join("|");
}
