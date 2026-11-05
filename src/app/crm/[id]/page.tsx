import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getCrmClub, listCrmContacts, listSalesReps, type CrmClub, type CrmContactDisplay } from "@/lib/db";
import { Shell } from "@/components/Shell";
import { CrmLogo } from "@/components/CrmLogo";
import { YspPartnerMark } from "@/components/YspPartnerMark";
import { createCrmContact, deleteCrmContact, saveCrmContact, saveCrmRep } from "@/app/crm/actions";

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
    {contacts.length === 0 && <p className="empty-state">No primary contact assigned yet.</p>}
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
  return <Shell kind="rep" name={session.name} active="crm"><main className="content detail-content" id="main-content">
    <Link className="back-link" href={club.assigned_rep_id ? `/rep?rep=${club.assigned_rep_id}` : "/crm"}>← {club.assigned_rep_name ? `${club.assigned_rep_name}'s book` : "All CRM clubs"}</Link>
    <ClubHero club={club} />
    <RepOwnership club={club} reps={reps} />
    <div className="crm-sections"><PrimaryContacts contacts={contacts} orgId={id} /><OtherContacts contacts={otherContacts} orgId={id} /></div>
  </main></Shell>;
}
