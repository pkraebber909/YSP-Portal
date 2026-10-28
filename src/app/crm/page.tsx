import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listCrmClubs } from "@/lib/db";
import { Shell } from "@/components/Shell";
import { CrmDirectory } from "@/components/CrmDirectory";

export default async function CrmHome() {
  const session = await getSession();
  if (session?.role !== "rep" || session.userId !== "phineas") redirect("/login");
  const clubs = listCrmClubs().map(club => ({
    id: club.id,
    name: club.name,
    logo_path: club.logo_path,
    next_action: club.next_action,
    updated_at: club.updated_at,
  }));
  return <Shell kind="rep" name={session.name} active="crm"><main className="content" id="main-content">
    <div className="page-head"><div><p className="eyebrow">INTERNAL CLUB RECORDS</p><h1>YSP Internal CRM<span className="heading-dot">.</span></h1><p className="subtitle">Notes and next actions for partner clubs.</p></div><div className="head-meta"><span className="number">{clubs.length.toString().padStart(2, "0")}</span><span>CLUBS</span></div></div>
    <div className="crm-notice">Internal working records. Changes are saved in this portal only; Salesforce is not connected.</div>
    <section aria-labelledby="crm-clubs-title"><div className="section-head"><div><p className="eyebrow">CLUB DIRECTORY</p><h2 id="crm-clubs-title">Partner clubs</h2></div><span className="small muted">Select a club to edit its record</span></div>
      <CrmDirectory clubs={clubs} />
    </section>{clubs.some(club => !club.logo_path) && <p className="footnote">Clubs without a supplied logo show initials until an image is available.</p>}
  </main></Shell>;
}
