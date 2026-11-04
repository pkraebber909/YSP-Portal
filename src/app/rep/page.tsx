import { ClubLogo } from "@/components/ClubLogo";
import { CrmLogo } from "@/components/CrmLogo";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { listCrmClubsForRep, listPartnersForRep, listSalesReps } from "@/lib/db";
import { Shell } from "@/components/Shell";
import { redirect } from "next/navigation";

export default async function RepHome({ searchParams }: { searchParams: Promise<{ rep?: string }> }) {
  const session = await getSession();
  if (session?.role !== "rep") redirect("/login");
  const reps = listSalesReps();
  const requested = (await searchParams).rep;
  const selected = reps.find(rep => rep.id === requested) || reps.find(rep => rep.id === session.userId) || reps[0];
  const partners = listPartnersForRep(selected.id);
  const crmClubs = listCrmClubsForRep(selected.id);
  const clubCount = partners.length + crmClubs.length;
  const needsAttention = partners.filter(partner => partner.open_count > 0).length + crmClubs.filter(club => club.next_action).length;

  return <Shell kind="rep" name={session.name}><main className="content" id="main-content">
    <div className="page-head"><div><p className="eyebrow">PARTNER SERVICING / SPRING 2027</p><h1>Sales rep books<span className="heading-dot">.</span></h1><p className="subtitle">See each rep's assigned clubs and what needs attention.</p></div><div className="head-meta"><span className="number">{reps.length.toString().padStart(2, "0")}</span><span>SALES<br />REPS</span></div></div>

    <section aria-labelledby="rep-team-title" className="rep-team-section"><div className="section-head"><div><p className="eyebrow">TEAM COVERAGE</p><h2 id="rep-team-title">Choose a rep</h2></div><span className="small muted">Club assignments are added as they are confirmed</span></div><div className="rep-book-grid">{reps.map(rep => <Link key={rep.id} href={`/rep?rep=${rep.id}`} className={`rep-book-card${rep.id === selected.id ? " selected" : ""}`} aria-current={rep.id === selected.id ? "true" : undefined}><span className="rep-card-top"><span className="eyebrow">{rep.id === session.userId ? "YOUR BOOK" : "REP BOOK"}</span><span aria-hidden="true">↗</span></span><strong>{rep.name}</strong><span className="rep-card-count"><b>{rep.partner_count + rep.crm_count}</b> {rep.partner_count + rep.crm_count === 1 ? "club" : "clubs"}</span></Link>)}</div></section>

    <div className="section-head rep-selected-head"><div><p className="eyebrow">SELECTED PORTFOLIO</p><h2>{selected.name}'s book</h2></div><span className="small muted">{clubCount} assigned {clubCount === 1 ? "club" : "clubs"}</span></div>
    <section className="summary-strip"><div><span className="summary-number">{clubCount}</span><span>Assigned clubs</span></div><div><span className="summary-number">{needsAttention}</span><span>With a next step</span></div><div><span className="summary-number">{partners.reduce((n, partner) => n + partner.open_count, 0)}</span><span>Open requirements</span></div></section>

    <section aria-labelledby="rep-partners-title"><div className="section-head"><div><p className="eyebrow">ACTIVE PARTNERSHIPS</p><h2 id="rep-partners-title">Partner workspace</h2></div><span className="small muted">{partners.length} {partners.length === 1 ? "club" : "clubs"}</span></div>{partners.length ? <div className="partner-list">{partners.map(partner => <Link className="partner-row" href={`/rep/partners/${partner.id}`} key={partner.id}><ClubLogo variant="tile" /><span className="partner-main"><strong>{partner.name}</strong><small>{partner.season} <b>·</b> {partner.stage}</small></span><span className="partner-next"><small>NEXT ACTION</small><strong>{partner.next_action || "All current requirements complete"}</strong></span><span className="row-badge">{partner.open_count} open</span><span className="row-arrow" aria-hidden="true">↗</span></Link>)}</div> : <p className="rep-empty">No active partnership records assigned yet.</p>}</section>

    <section aria-labelledby="rep-crm-title" className="rep-crm-section"><div className="section-head"><div><p className="eyebrow">CRM ASSIGNMENTS</p><h2 id="rep-crm-title">Club directory</h2></div><span className="small muted">{crmClubs.length} {crmClubs.length === 1 ? "club" : "clubs"}</span></div>{crmClubs.length ? <div className="partner-list">{crmClubs.map(club => <Link className="partner-row" href={`/crm/${club.id}`} key={club.id}><CrmLogo name={club.name} path={club.logo_path} /><span className="partner-main"><strong>{club.name}</strong><small>{club.segment === "current_ysp" ? "Current Youth Partner" : "Directory club"} <b>·</b> {club.area}</small></span><span className="partner-next"><small>NEXT ACTION</small><strong>{club.next_action || "No next action yet"}</strong></span><span className="row-arrow" aria-hidden="true">↗</span></Link>)}</div> : <p className="rep-empty">No CRM clubs assigned yet. Assign a sales rep on a <Link href="/crm">CRM club page</Link> when its book is confirmed.</p>}</section>
    <p className="footnote">Cyclones stays assigned to Phineas. Other club books will fill as CRM assignments are added. Match assignment and experience selection remain unconfirmed until the January 2027 draft.</p>
  </main></Shell>;
}
