"use client";

import { useState } from "react";
import Link from "next/link";
import type { CrmClub } from "@/lib/db";
import { CrmLogo } from "@/components/CrmLogo";

export function CrmDirectory({ clubs }: { clubs: CrmClub[] }) {
  const [query, setQuery] = useState("");
  const visible = clubs.filter(club => club.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  return <>
    <div className="crm-search"><label htmlFor="crm-search">Find a club</label><input id="crm-search" type="search" placeholder="Search club names" value={query} onChange={event => setQuery(event.target.value)} /><span className="small muted">Showing {visible.length} of {clubs.length}</span></div>
    <div className="partner-list">{visible.map(club => <Link className="partner-row" href={`/crm/${club.id}`} key={club.id}><CrmLogo name={club.name} path={club.logo_path} /><span className="partner-main"><strong>{club.name}</strong><small>Internal CRM record</small></span><span className="partner-next"><small>NEXT ACTION</small><strong>{club.next_action || "No next action yet"}</strong></span><span className="row-arrow" aria-hidden="true">↗</span></Link>)}{visible.length === 0 && <p className="empty-state">No clubs match that search.</p>}</div>
  </>;
}
