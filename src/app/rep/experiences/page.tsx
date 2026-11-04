import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listCatalog, listOfferings, listReservations, listSprintMatches } from "@/lib/experiences";
import { matchDate, kickoff, matchRollup, MatchCounts } from "@/components/ExperienceUI";
import { Shell } from "@/components/Shell";

type Filters = { view?: string; date?: string; opponent?: string; venue?: string; type?: string; availability?: string; rep?: string; action?: string };

export default async function ExperiencesHome({ searchParams }: { searchParams: Promise<Filters> }) {
  const session = await getSession();
  if (session?.role !== "rep") redirect("/login");
  const params = await searchParams;
  const matches = listSprintMatches(), offerings = listOfferings(), reservations = listReservations(), catalog = listCatalog();
  const selected = matches.filter(match => {
    const matchOffers = offerings.filter(o => o.match_id === match.id);
    const matchReservations = reservations.filter(r => matchOffers.some(o => o.id === r.offering_id));
    const totals = matchRollup(match, offerings, reservations);
    return (!params.date || match.match_date === params.date)
      && (!params.opponent || match.opponent_code === params.opponent)
      && (!params.venue || match.venue === params.venue)
      && (!params.type || matchOffers.some(o => o.catalog_id === params.type && o.status !== "cancelled"))
      && (!params.availability || (params.availability === "available" ? totals.available > 0 : params.availability === "held" ? totals.held > 0 : params.availability === "confirmed" ? totals.confirmed > 0 : params.availability === "pending" ? matchOffers.some(o => o.status === "pending_confirmation") : params.availability === "not_offered" ? totals.offerings === 0 : true))
      && (!params.rep || matchReservations.some(r => r.rep_id === params.rep))
      && (params.action !== "yes" || totals.needsAction);
  });
  const view = params.view === "list" ? "list" : "calendar";
  const base = new URLSearchParams(Object.entries(params).filter(([key, value]) => key !== "view" && value).map(([key, value]) => [key, value!]));
  const viewHref = (next: string) => `/rep/experiences?${new URLSearchParams([...base.entries(), ["view", next]])}`;
  const reps = [...new Map(reservations.filter(r => r.rep_id).map(r => [r.rep_id!, { id: r.rep_id!, name: r.rep_name || r.rep_id! }])).values()];
  const months = [...new Set(matches.map(match => match.match_date.slice(0, 7)))].sort();
  return <Shell kind="rep" name={session.name} active="experiences"><main className="content" id="main-content">
    <div className="page-head"><div><p className="eyebrow">2027 SPRINT SEASON / STAFF TRACKER</p><h1>Experiences<span className="heading-dot">.</span></h1><p className="subtitle">Match inventory, group holds, and confirmed reservations.</p></div><div className="head-meta"><span className="number">07</span><span>HOME<br />MATCHES</span></div></div>
    <div className="crm-notice">Schedule times are Eastern and subject to change. Experience types are draft references; no 2027 offering is confirmed by the catalog alone.</div>
    <div className="experience-toolbar"><div className="experience-view-switch"><Link href={viewHref("calendar")} aria-current={view === "calendar" ? "page" : undefined}>Calendar</Link><Link href={viewHref("list")} aria-current={view === "list" ? "page" : undefined}>Match list</Link></div><Link className="button ghost small-button" href="/rep/experiences/catalog">Review experience catalog →</Link></div>
    <form className="experience-filters" method="get"><input type="hidden" name="view" value={view} />
      <label>Date<select name="date" defaultValue={params.date || ""}><option value="">All dates</option>{matches.map(m => <option key={m.id} value={m.match_date}>{matchDate(m.match_date)}</option>)}</select></label>
      <label>Opponent<select name="opponent" defaultValue={params.opponent || ""}><option value="">All opponents</option>{matches.map(m => <option key={m.id} value={m.opponent_code}>{m.opponent}</option>)}</select></label>
      <label>Venue<select name="venue" defaultValue={params.venue || ""}><option value="">All venues</option>{[...new Set(matches.map(m => m.venue))].map(venue => <option key={venue} value={venue}>{venue}</option>)}</select></label>
      <label>Experience type<select name="type" defaultValue={params.type || ""}><option value="">All types</option>{catalog.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}</select></label>
      <label>Availability<select name="availability" defaultValue={params.availability || ""}><option value="">Any status</option><option value="available">Spots available</option><option value="held">Spots held</option><option value="confirmed">Spots confirmed</option><option value="pending">Pending confirmation</option><option value="not_offered">No offerings</option></select></label>
      <label>Assigned rep<select name="rep" defaultValue={params.rep || ""}><option value="">All reps</option>{reps.map(rep => <option key={rep.id} value={rep.id}>{rep.name}</option>)}</select></label>
      <label>Follow-up<select name="action" defaultValue={params.action || ""}><option value="">All matches</option><option value="yes">Needs action</option></select></label>
      <button className="button primary" type="submit">Apply filters</button><Link className="text-button" href="/rep/experiences">Clear</Link>
    </form>
    <div className="section-head"><div><p className="eyebrow">MATCH SCHEDULE</p><h2>{selected.length} of {matches.length} matches</h2></div><span className="small muted">Select a match to manage its experiences</span></div>
    {view === "list" ? <div className="partner-list">{selected.map(match => <Link className="partner-row" href={`/rep/experiences/${match.id}`} key={match.id}><span className="experience-date-tile"><strong>{matchDate(match.match_date, { day: "2-digit" })}</strong><small>{matchDate(match.match_date, { month: "short" })}</small></span><span className="partner-main"><strong>{match.opponent}</strong><small>{kickoff(match.kickoff_et)} · {match.venue_confirmed ? match.venue : "Venue TBD"}</small></span><MatchCounts match={match} offerings={offerings} reservations={reservations} /><span className="row-arrow">↗</span></Link>)}</div> : <div className="experience-calendar">{months.map(month => {
      const [year, monthNumber] = month.split("-").map(Number);
      const first = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay();
      const days = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
      const title = matchDate(`${month}-01`, { month: "long", year: "numeric" });
      return <section className="experience-month" key={month}><h3>{title}</h3><div className="experience-weekdays">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => <span key={day}>{day}</span>)}</div><div className="experience-days">{Array.from({ length: first }, (_, i) => <span className="experience-day empty" key={`blank-${i}`} />)}{Array.from({ length: days }, (_, i) => { const day = i + 1, date = `${month}-${String(day).padStart(2, "0")}`; const dayMatches = selected.filter(item => item.match_date === date); return <div className={`experience-day${dayMatches.length ? " has-match" : ""}`} key={date}><span className="day-number">{day}</span>{dayMatches.map(match => { const totals = matchRollup(match, offerings, reservations); return <Link href={`/rep/experiences/${match.id}`} className="calendar-match" key={match.id}><strong>{match.opponent_code}</strong><small>{kickoff(match.kickoff_et)}</small><small>{match.venue_confirmed ? match.venue : "Venue TBD"}</small><span>{totals.offerings} offerings · {totals.available} open · {totals.held} held · {totals.confirmed} confirmed</span></Link>; })}</div>; })}</div></section>;
    })}</div>}
    {selected.length === 0 && <p className="empty-state">No matches match these filters.</p>}
  </main></Shell>;
}
