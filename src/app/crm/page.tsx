import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listCrmClubs } from "@/lib/db";
import { Shell } from "@/components/Shell";

export default async function CrmHome() {
  const session = await getSession();
  if (session?.role !== "rep" || session.userId !== "phineas") redirect("/login");
  const clubs = listCrmClubs();
  return <Shell kind="rep" name={session.name} active="crm"><main className="content" id="main-content">
    <div className="page-head"><div><p className="eyebrow">INTERNAL CLUB RECORDS</p><h1>YSP Internal CRM<span className="heading-dot">.</span></h1><p className="subtitle">Notes and next actions for partner clubs.</p></div><div className="head-meta"><span className="number">{clubs.length.toString().padStart(2, "0")}</span><span>CLUBS</span></div></div>
    <div className="crm-notice">Internal working records. Changes are saved in this portal only; Salesforce is not connected.</div>
    <section aria-labelledby="crm-clubs-title"><div className="section-head"><div><p className="eyebrow">CLUB DIRECTORY</p><h2 id="crm-clubs-title">Partner clubs</h2></div><span className="small muted">Select a club to edit its record</span></div>
      <div className="partner-list">{clubs.map(club => <Link className="partner-row" href={`/crm/${club.id}`} key={club.id}><span className="crm-logo" aria-hidden="true">{club.name.split(" ").map(word => word[0]).slice(0, 2).join("")}</span><span className="partner-main"><strong>{club.name}</strong><small>Internal CRM record</small></span><span className="partner-next"><small>NEXT ACTION</small><strong>{club.next_action || "No next action yet"}</strong></span><span className="row-arrow" aria-hidden="true">↗</span></Link>)}</div>
    </section><p className="footnote">Club logo placeholders can be replaced when approved image files are available.</p>
  </main></Shell>;
}
