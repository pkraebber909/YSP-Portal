import { ClubLogo } from "@/components/ClubLogo";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { listPartnersForRep } from "@/lib/db";
import { Shell } from "@/components/Shell";
import { redirect } from "next/navigation";

export default async function RepHome() {
  const session = await getSession();
  if (session?.role !== "rep") redirect("/login");
  const partners = listPartnersForRep(session.userId);
  return <Shell kind="rep" name={session.name}><main className="content" id="main-content"><div className="page-head"><div><p className="eyebrow">PARTNER SERVICING / SPRING 2027</p><h1>Assigned partners<span className="heading-dot">.</span></h1><p className="subtitle">A clear view of what each club needs next.</p></div><div className="head-meta"><span className="number">{partners.length.toString().padStart(2, "0")}</span><span>PARTNERS<br />ASSIGNED</span></div></div><section className="summary-strip"><div><span className="summary-number">{partners.length}</span><span>Active partners</span></div><div><span className="summary-number">{partners.filter(p => p.open_count > 0).length}</span><span>Need attention</span></div><div><span className="summary-number">{partners.reduce((n, p) => n + p.open_count, 0)}</span><span>Open requirements</span></div></section><div className="section-head"><div><p className="eyebrow">YOUR PORTFOLIO</p><h2>Clubs to service</h2></div><span className="small muted">Showing assigned clubs</span></div><div className="partner-list">{partners.map(p => <Link className="partner-row" href={`/rep/partners/${p.id}`} key={p.id}><ClubLogo variant="tile" /><span className="partner-main"><strong>{p.name}</strong><small>{p.season} <b>·</b> {p.stage}</small></span><span className="partner-next"><small>NEXT ACTION</small><strong>{p.next_action || "All current requirements complete"}</strong></span><span className="row-badge">{p.open_count} open</span><span className="row-arrow">↗</span></Link>)}</div><p className="footnote">Match assignment and experience selection remain unconfirmed until the January 2027 draft.</p></main></Shell>;
}
