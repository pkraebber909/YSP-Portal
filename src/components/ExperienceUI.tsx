import { availability, effectiveReservationStatus, type Offering, type Reservation, type SprintMatch } from "@/lib/experiences";

export function matchDate(date: string, options: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" }) {
  return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "America/New_York" }).format(new Date(`${date}T12:00:00Z`));
}
export function kickoff(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"} ET`;
}
export function label(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase()); }
export function matchRollup(match: SprintMatch, offerings: Offering[], reservations: Reservation[]) {
  const attached = offerings.filter(o => o.match_id === match.id && o.status !== "cancelled");
  let available = 0, held = 0, confirmed = 0;
  for (const offer of attached) {
    const counts = availability(offer, reservations);
    if (offer.status === "available") available += counts.availableParticipants + counts.availableChaperones;
    held += counts.heldParticipants + counts.heldChaperones;
    confirmed += counts.confirmedParticipants + counts.confirmedChaperones;
  }
  const needsAction = !match.venue_confirmed || attached.length === 0 || attached.some(o => o.status === "pending_confirmation") || reservations.some(r => attached.some(o => o.id === r.offering_id) && (effectiveReservationStatus(r) === "expired" || r.next_action || (r.status === "confirmed" && (r.roster_status !== "received" || r.instruction_status !== "sent" || r.waiver_status !== "complete"))));
  return { available, held, confirmed, offerings: attached.length, needsAction };
}
export function MatchCounts({ match, offerings, reservations }: { match: SprintMatch; offerings: Offering[]; reservations: Reservation[] }) {
  const totals = matchRollup(match, offerings, reservations);
  return <span className="experience-counts"><span>{totals.offerings} offerings</span><span>{totals.available} available</span><span>{totals.held} held</span><span>{totals.confirmed} confirmed</span></span>;
}
