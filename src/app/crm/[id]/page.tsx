import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { crmAreas, getCrmClub, listCrmNotes, listSalesReps } from "@/lib/db";
import { Shell } from "@/components/Shell";
import { CrmLogo } from "@/components/CrmLogo";
import { saveCrmClassification, saveCrmNextAction, saveCrmNote, saveCrmRep } from "@/app/crm/actions";

export default async function CrmClubPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session?.role !== "rep" || session.userId !== "phineas") redirect("/login");
  const { id } = await params;
  if (id === "academy-argentina") redirect("/crm/aafny");
  const club = getCrmClub(id);
  if (!club) notFound();
  // Use 06 United as the first clean club-page layout while the rep view is designed.
  if (id === "06-united-new-york") return <Shell kind="rep" name={session.name} active="crm"><main className="content detail-content" id="main-content">
    <Link className="back-link" href={club.assigned_rep_id ? `/rep?rep=${club.assigned_rep_id}` : "/crm"}>← {club.assigned_rep_name ? `${club.assigned_rep_name}'s book` : "All CRM clubs"}</Link>
    <div className="detail-hero"><CrmLogo name={club.name} path={club.logo_path} large /><div className="hero-copy"><p className="eyebrow">YSP INTERNAL CRM / CLUB RECORD</p><h1>{club.name}</h1><div className="hero-tags"><span className="tag blue">{club.segment === "current_ysp" ? "Current Youth Partner" : "2026 directory club"}</span><span className="tag outlined">{club.area}</span></div></div></div>
  </main></Shell>;
  const notes = listCrmNotes(id);
  const reps = listSalesReps();
  return <Shell kind="rep" name={session.name} active="crm"><main className="content detail-content" id="main-content">
    <Link className="back-link" href="/crm">← All CRM clubs</Link>
    <div className="detail-hero"><CrmLogo name={club.name} path={club.logo_path} large /><div className="hero-copy"><p className="eyebrow">YSP INTERNAL CRM / CLUB RECORD</p><h1>{club.name}</h1><div className="hero-tags"><span className="tag blue">{club.segment === "current_ysp" ? "Current Youth Partner" : "2026 directory club"}</span><span className="tag outlined">{club.area}</span></div></div></div>
    <div className="crm-notice">This record is visible to the rep demo workspace. It does not sync with Salesforce.</div>
    <div className="crm-sections"><section className="panel" aria-labelledby="next-action-title"><div className="panel-title"><div><p className="eyebrow">01 / FOLLOW UP</p><h2 id="next-action-title">Next action</h2></div></div><form action={saveCrmNextAction} className="crm-form"><input type="hidden" name="orgId" value={id} /><label htmlFor="crm-next-action">What should happen next?</label><textarea id="crm-next-action" name="nextAction" rows={3} maxLength={500} defaultValue={club.next_action || ""} placeholder="Add a next action for this club…" /><div className="crm-form-footer"><span className="small muted">Leave blank and save to clear the action.</span><button className="button primary" type="submit">Save next action</button></div></form></section>
      <section className="panel" aria-labelledby="notes-title"><div className="panel-title"><div><p className="eyebrow">02 / RELATIONSHIP HISTORY</p><h2 id="notes-title">Internal notes</h2></div><span className="text-badge">{notes.length} logged</span></div><form action={saveCrmNote} className="crm-form"><input type="hidden" name="orgId" value={id} /><label htmlFor="crm-note">Add a note</label><textarea id="crm-note" name="note" rows={4} maxLength={2000} placeholder="Record a conversation or useful context…" required /><div className="crm-form-footer"><span className="small muted">Notes stay inside the internal CRM.</span><button className="button primary" type="submit">Save note</button></div></form><div className="activity-list">{notes.length === 0 ? <p className="empty-state">No internal notes yet.</p> : notes.map(entry => <article className="activity-item" key={entry.id}><span className="activity-symbol" aria-hidden="true">✎</span><div><div className="activity-meta"><strong>{entry.author}</strong><time dateTime={entry.created_at}>{new Date(entry.created_at).toLocaleDateString("en-US")}</time></div><p>{entry.note}</p></div></article>)}</div></section>
      <section className="panel" aria-labelledby="grouping-title"><div className="panel-title"><div><p className="eyebrow">03 / DIRECTORY</p><h2 id="grouping-title">Club grouping</h2></div></div><p className="small muted">{club.sources ? `Workbook sheets: ${club.sources}. ` : "No workbook match recorded. "}{club.area_basis !== "Staff set" && club.area !== "Area to confirm" ? `Area is provisional (${club.area_basis.toLowerCase()}).` : club.area_basis === "Staff set" ? "Area set by staff." : "Area awaits confirmation."}</p><form action={saveCrmClassification} className="crm-form crm-classification-form"><input type="hidden" name="orgId" value={id} /><div><label htmlFor="crm-segment">Directory group</label><select id="crm-segment" name="segment" defaultValue={club.segment}><option value="current_ysp">Current Youth Partners (YSPs)</option><option value="directory">Other directory clubs</option></select></div><div><label htmlFor="crm-area">Area or borough</label><select id="crm-area" name="area" defaultValue={club.area}>{crmAreas.map(area => <option key={area} value={area}>{area}</option>)}</select></div><button className="button primary" type="submit">Save grouping</button></form><form action={saveCrmRep} className="crm-form crm-rep-form"><input type="hidden" name="orgId" value={id} /><label htmlFor="crm-rep">Assigned sales rep</label><div><select id="crm-rep" name="repId" defaultValue={club.assigned_rep_id || ""}><option value="">Unassigned</option>{reps.map(rep => <option key={rep.id} value={rep.id}>{rep.name}</option>)}</select><button className="button primary" type="submit">Save rep</button></div><p className="small muted">Assigned CRM clubs appear in the rep's book. Cyclones keeps its existing partnership assignment.</p></form></section></div>
  </main></Shell>;
}
