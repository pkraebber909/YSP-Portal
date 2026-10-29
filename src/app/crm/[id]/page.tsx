import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getCrmClub, listCrmNotes } from "@/lib/db";
import { Shell } from "@/components/Shell";
import { CrmLogo } from "@/components/CrmLogo";
import { saveCrmNextAction, saveCrmNote } from "@/app/crm/actions";

export default async function CrmClubPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session?.role !== "rep" || session.userId !== "phineas") redirect("/login");
  const { id } = await params;
  if (id === "academy-argentina") redirect("/crm/aafny");
  const club = getCrmClub(id);
  if (!club) notFound();
  const notes = listCrmNotes(id);
  return <Shell kind="rep" name={session.name} active="crm"><main className="content detail-content" id="main-content">
    <Link className="back-link" href="/crm">← All CRM clubs</Link>
    <div className="detail-hero"><CrmLogo name={club.name} path={club.logo_path} large /><div className="hero-copy"><p className="eyebrow">YSP INTERNAL CRM / CLUB RECORD</p><h1>{club.name}</h1><div className="hero-tags"><span className="tag blue">Internal only</span><span className="tag outlined">Local portal record</span></div></div></div>
    <div className="crm-notice">This record is visible to the rep demo workspace. It does not sync with Salesforce.</div>
    <div className="crm-sections"><section className="panel" aria-labelledby="next-action-title"><div className="panel-title"><div><p className="eyebrow">01 / FOLLOW UP</p><h2 id="next-action-title">Next action</h2></div></div><form action={saveCrmNextAction} className="crm-form"><input type="hidden" name="orgId" value={id} /><label htmlFor="crm-next-action">What should happen next?</label><textarea id="crm-next-action" name="nextAction" rows={3} maxLength={500} defaultValue={club.next_action || ""} placeholder="Add a next action for this club…" /><div className="crm-form-footer"><span className="small muted">Leave blank and save to clear the action.</span><button className="button primary" type="submit">Save next action</button></div></form></section>
      <section className="panel" aria-labelledby="notes-title"><div className="panel-title"><div><p className="eyebrow">02 / RELATIONSHIP HISTORY</p><h2 id="notes-title">Internal notes</h2></div><span className="text-badge">{notes.length} logged</span></div><form action={saveCrmNote} className="crm-form"><input type="hidden" name="orgId" value={id} /><label htmlFor="crm-note">Add a note</label><textarea id="crm-note" name="note" rows={4} maxLength={2000} placeholder="Record a conversation or useful context…" required /><div className="crm-form-footer"><span className="small muted">Notes stay inside the internal CRM.</span><button className="button primary" type="submit">Save note</button></div></form><div className="activity-list">{notes.length === 0 ? <p className="empty-state">No internal notes yet.</p> : notes.map(entry => <article className="activity-item" key={entry.id}><span className="activity-symbol" aria-hidden="true">✎</span><div><div className="activity-meta"><strong>{entry.author}</strong><time dateTime={entry.created_at}>{new Date(entry.created_at).toLocaleDateString("en-US")}</time></div><p>{entry.note}</p></div></article>)}</div></section></div>
  </main></Shell>;
}
