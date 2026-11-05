import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { crmAreas, getCrmClub, listCrmContacts, listCrmNotes, listSalesReps, type CrmClub, type CrmContactDisplay } from "@/lib/db";
import { Shell } from "@/components/Shell";
import { CrmLogo } from "@/components/CrmLogo";
import { YspPartnerMark } from "@/components/YspPartnerMark";
import { createCrmContact, deleteCrmContact, saveCrmContact, saveCrmLocations, saveCrmNextAction, saveCrmNote, saveCrmRep, saveCrmSegment } from "@/app/crm/actions";

function ClubHero({ club }: { club: CrmClub }) {
  return <div className="detail-hero"><CrmLogo name={club.name} path={club.logo_path} large /><div className="hero-copy"><p className="eyebrow">YOUTH SOCCER CLUB CRM / CLUB RECORD</p><h1>{club.name}</h1><div className="hero-tags"><span className="tag blue">{club.segment === "current_ysp" ? "Current Youth Partner" : "Other club"}</span>{club.locations.length ? club.locations.map(area => <span className="tag outlined" key={area}>{area}</span>) : <span className="tag outlined">Location to confirm</span>}</div></div>{club.segment === "current_ysp" && <YspPartnerMark />}</div>;
}

function RepOwnership({ club, reps }: { club: CrmClub; reps: { id: string; name: string }[] }) {
  return <section className="crm-ownership" aria-labelledby="rep-ownership-title">
    <div><p className="eyebrow">CRM ASSIGNMENT</p><h2 id="rep-ownership-title">Rep ownership</h2><p className="small muted">Current owner: <strong>{club.assigned_rep_name || "Unassigned"}</strong>. Assigning a rep adds this club to their book; partner status stays separate.</p></div>
    <form action={saveCrmRep}><input type="hidden" name="orgId" value={club.id} /><label htmlFor="crm-rep-owner">Assign to<select id="crm-rep-owner" name="repId" defaultValue={club.assigned_rep_id || ""}><option value="">Unassigned</option>{reps.map(rep => <option key={rep.id} value={rep.id}>{rep.name}</option>)}</select></label><button className="button primary" type="submit">Save ownership</button></form>
  </section>;
}

function PrimaryContacts({ contacts, orgId }: { contacts: CrmContactDisplay[]; orgId: string }) {
  return <section className="panel" aria-labelledby="primary-contacts-title">
    <div className="panel-title"><div><p className="eyebrow">01 / CONTACTS</p><h2 id="primary-contacts-title">Primary contact(s)</h2></div></div>
    {contacts.length === 0 && <p className="empty-state">No contacts added yet.</p>}
    <div className="crm-primary-contacts">{contacts.map(contact => <article className="crm-primary-contact" key={contact.id}>
      <h3>{contact.name}</h3>
      {contact.roles.length > 0 && <p className="small muted">{contact.roles.join(" · ")}</p>}
      {contact.teams.length > 0 && <p className="small muted">Team{contact.teams.length === 1 ? "" : "s"}: {contact.teams.join(" · ")}</p>}
      <div className="crm-contact-details">
        {contact.emails.length > 0 && <div><small>EMAIL</small>{contact.emails.map(email => <a className="crm-contact-email" href={`mailto:${email}`} key={email}>{email}</a>)}</div>}
        {contact.phone && <div><small>PHONE</small><a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}>{contact.phone}</a></div>}
        {contact.ticketing_id && <div><small>PRIMARY TICKETING ID</small><strong>{contact.ticketing_id}</strong></div>}
      </div>
      <details className="crm-contact-editor"><summary>Edit contact</summary>
        <form action={saveCrmContact} className="crm-contact-form"><input type="hidden" name="orgId" value={orgId} /><input type="hidden" name="contactId" value={contact.id} />
          <label>Name<input name="name" defaultValue={contact.name} maxLength={120} required /></label><label>Email<input name="email" type="email" defaultValue={contact.email || ""} maxLength={254} /></label><label>Phone<input name="phone" type="tel" defaultValue={contact.phone || ""} maxLength={40} /></label><label>Primary Ticketing ID<input name="ticketingId" defaultValue={contact.ticketing_id || ""} maxLength={80} /></label>
          <button className="button primary" type="submit">Save contact</button>
        </form>
        <form action={deleteCrmContact} className="crm-contact-remove"><input type="hidden" name="orgId" value={orgId} /><input type="hidden" name="contactId" value={contact.id} /><button className="button" type="submit">Remove contact</button></form>
      </details>
    </article>)}</div>
    <details className="crm-contact-editor crm-add-contact"><summary>Add contact</summary>
      <form action={createCrmContact} className="crm-contact-form"><input type="hidden" name="orgId" value={orgId} />
        <label>Name<input name="name" maxLength={120} required /></label><label>Email<input name="email" type="email" maxLength={254} /></label><label>Phone<input name="phone" type="tel" maxLength={40} /></label><label>Primary Ticketing ID<input name="ticketingId" maxLength={80} /></label>
        <button className="button primary" type="submit">Save contact</button>
      </form>
    </details>
  </section>;
}

function OtherContacts({ contacts, orgId }: { contacts: CrmContactDisplay[]; orgId: string }) {
  if (!contacts.length) return null;
  return <section className="panel" aria-labelledby="other-contacts-title">
    <div className="panel-title"><div><p className="eyebrow">CONTACT DIRECTORY</p><h2 id="other-contacts-title">Other contacts</h2></div><span className="text-badge">{contacts.length} listed</span></div>
    <div className="crm-primary-contacts">{contacts.map((contact, index) => <details className="crm-primary-contact crm-other-contact" key={contact.id} open={index < 3}>
      <summary>{contact.name}{contact.roles.length > 0 && <span className="small muted">{contact.roles.join(" · ")}</span>}</summary>
      {contact.teams.length > 0 && <p className="small muted">Team{contact.teams.length === 1 ? "" : "s"}: {contact.teams.join(" · ")}</p>}
      <div className="crm-contact-details">
        {contact.emails.length > 0 && <div><small>EMAIL</small>{contact.emails.map(email => <a className="crm-contact-email" href={`mailto:${email}`} key={email}>{email}</a>)}</div>}
        {contact.phone && <div><small>PHONE</small><a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}>{contact.phone}</a></div>}
        {contact.ticketing_id && <div><small>PRIMARY TICKETING ID</small><strong>{contact.ticketing_id}</strong></div>}
      </div>
      <details className="crm-contact-editor"><summary>Edit contact</summary>
        <form action={saveCrmContact} className="crm-contact-form"><input type="hidden" name="orgId" value={orgId} /><input type="hidden" name="contactId" value={contact.id} />
          <label>Name<input name="name" defaultValue={contact.name} maxLength={120} required /></label><label>Email<input name="email" type="email" defaultValue={contact.email || ""} maxLength={254} /></label><label>Phone<input name="phone" type="tel" defaultValue={contact.phone || ""} maxLength={40} /></label><label>Primary Ticketing ID<input name="ticketingId" defaultValue={contact.ticketing_id || ""} maxLength={80} /></label>
          <button className="button primary" type="submit">Save contact</button>
        </form>
        <form action={deleteCrmContact} className="crm-contact-remove"><input type="hidden" name="orgId" value={orgId} /><input type="hidden" name="contactId" value={contact.id} /><button className="button" type="submit">Remove contact</button></form>
      </details>
    </details>)}</div>
  </section>;
}

export default async function CrmClubPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session?.role !== "rep" || session.userId !== "phineas") redirect("/login");
  const { id } = await params;
  if (id === "academy-argentina") redirect("/crm/aafny");
  if (id === "directory-eastchester") redirect("/crm/eysa");
  const club = getCrmClub(id);
  if (!club) notFound();
  const allContacts = listCrmContacts(id);
  const contacts = allContacts.filter(contact => contact.is_primary);
  const otherContacts = allContacts.filter(contact => !contact.is_primary);
  const reps = listSalesReps();
  // These club pages use the streamlined contact-focused layout.
  if (id === "06-united-new-york" || id === "directory-5-star-soccer-academy") {
    return <Shell kind="rep" name={session.name} active="crm"><main className="content detail-content" id="main-content">
    <Link className="back-link" href={club.assigned_rep_id ? `/rep?rep=${club.assigned_rep_id}` : "/crm"}>← {club.assigned_rep_name ? `${club.assigned_rep_name}'s book` : "All CRM clubs"}</Link>
    <ClubHero club={club} />
    <RepOwnership club={club} reps={reps} />
    <div className="crm-sections"><PrimaryContacts contacts={contacts} orgId={id} /><OtherContacts contacts={otherContacts} orgId={id} /></div>
  </main></Shell>;
  }
  const notes = listCrmNotes(id);
  return <Shell kind="rep" name={session.name} active="crm"><main className="content detail-content" id="main-content">
    <Link className="back-link" href="/crm">← All CRM clubs</Link>
    <ClubHero club={club} />
    <RepOwnership club={club} reps={reps} />
    <div className="crm-notice">This record is visible to the rep demo workspace. It does not sync with Salesforce.</div>
    <div className="crm-sections"><PrimaryContacts contacts={contacts} orgId={id} /><OtherContacts contacts={otherContacts} orgId={id} />
      <section className="panel" aria-labelledby="next-action-title"><div className="panel-title"><div><p className="eyebrow">02 / FOLLOW UP</p><h2 id="next-action-title">Next action</h2></div></div><form action={saveCrmNextAction} className="crm-form"><input type="hidden" name="orgId" value={id} /><label htmlFor="crm-next-action">What should happen next?</label><textarea id="crm-next-action" name="nextAction" rows={3} maxLength={500} defaultValue={club.next_action || ""} placeholder="Add a next action for this club…" /><div className="crm-form-footer"><span className="small muted">Leave blank and save to clear the action.</span><button className="button primary" type="submit">Save next action</button></div></form></section>
      <section className="panel" aria-labelledby="notes-title"><div className="panel-title"><div><p className="eyebrow">03 / RELATIONSHIP HISTORY</p><h2 id="notes-title">Internal notes</h2></div><span className="text-badge">{notes.length} logged</span></div><form action={saveCrmNote} className="crm-form"><input type="hidden" name="orgId" value={id} /><label htmlFor="crm-note">Add a note</label><textarea id="crm-note" name="note" rows={4} maxLength={2000} placeholder="Record a conversation or useful context…" required /><div className="crm-form-footer"><span className="small muted">Notes stay inside the internal CRM.</span><button className="button primary" type="submit">Save note</button></div></form><div className="activity-list">{notes.length === 0 ? <p className="empty-state">No internal notes yet.</p> : notes.map(entry => <article className="activity-item" key={entry.id}><span className="activity-symbol" aria-hidden="true">✎</span><div><div className="activity-meta"><strong>{entry.author}</strong><time dateTime={entry.created_at}>{new Date(entry.created_at).toLocaleDateString("en-US")}</time></div><p>{entry.note}</p></div></article>)}</div></section>
      <section className="panel" aria-labelledby="grouping-title">
        <div className="panel-title"><div><p className="eyebrow">04 / DIRECTORY</p><h2 id="grouping-title">Club grouping</h2></div></div>
        <p className="small muted">{club.sources ? `Workbook sheets: ${club.sources}. ` : "No workbook match recorded. "}{club.area_basis !== "Staff set" && club.locations.length ? "Location tags are provisional until confirmed by staff." : "Location tags are staff managed."}</p>
        <form action={saveCrmSegment} className="crm-form crm-classification-form">
          <input type="hidden" name="orgId" value={id} />
          <div><label htmlFor="crm-segment">Club status</label><select id="crm-segment" name="segment" defaultValue={club.segment}><option value="current_ysp">Current Youth Partners (YSPs)</option><option value="directory">Other directory clubs</option></select></div>
          <button className="button primary" type="submit">Save status</button>
        </form>
        <form action={saveCrmLocations} className="crm-form crm-location-form">
          <input type="hidden" name="orgId" value={id} />
          <fieldset><legend>Locations served</legend><p className="small muted">Select every area where this club has a program. Leave all unchecked if the location is still to confirm.</p>
            <div className="crm-location-options">{crmAreas.filter(area => area !== "Area to confirm").map(area => <label key={area}><input type="checkbox" name="areas" value={area} defaultChecked={club.locations.includes(area)} />{area}</label>)}</div>
          </fieldset>
          <button className="button primary" type="submit">Save locations</button>
        </form>
      </section></div>
  </main></Shell>;
}
