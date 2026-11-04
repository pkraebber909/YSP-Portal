"use client";

import { useState } from "react";
import Link from "next/link";
import type { CrmClub } from "@/lib/db";
import { CrmLogo } from "@/components/CrmLogo";

const areaOrder = ["Brooklyn", "Bronx", "Queens", "Manhattan", "Staten Island", "Long Island", "Westchester", "Hudson Valley", "Capital District", "Connecticut", "Area to confirm"];

function ClubRows({ clubs }: { clubs: CrmClub[] }) {
  return <div className="partner-list">{clubs.map(club => <Link className="partner-row" href={`/crm/${club.id}`} key={club.id}><CrmLogo name={club.name} path={club.logo_path} /><span className="partner-main"><strong>{club.name}</strong><small>{club.area}{club.assigned_rep_name ? ` · ${club.assigned_rep_name}` : ""}{club.sources ? ` · ${club.sources}` : ""}</small></span><span className="partner-next"><small>NEXT ACTION</small><strong>{club.next_action || "No next action yet"}</strong></span><span className="row-arrow" aria-hidden="true">↗</span></Link>)}</div>;
}

export function CrmDirectory({ clubs, reps }: { clubs: CrmClub[]; reps: { id: string; name: string }[] }) {
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState("");
  const [area, setArea] = useState("");
  const [source, setSource] = useState("");
  const [owner, setOwner] = useState("");
  const sources = [...new Set(clubs.flatMap(club => club.sources ? club.sources.split(" · ") : []))].sort();
  const visible = clubs.filter(club =>
    club.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
    && (!segment || club.segment === segment)
    && (!area || club.area === area)
    && (!source || club.sources.split(" · ").includes(source))
    && (!owner || (owner === "unassigned" ? !club.assigned_rep_id : club.assigned_rep_id === owner))
  );
  const current = visible.filter(club => club.segment === "current_ysp");
  const directory = visible.filter(club => club.segment !== "current_ysp");
  const activeFilter = Boolean(query || area || source || segment || owner);
  const filterKey = `${query}|${segment}|${area}|${source}|${owner}`;
  return <>
    <div className="crm-directory-filters">
      <label htmlFor="crm-search">Find a club<input id="crm-search" type="search" placeholder="Search club names" value={query} onChange={event => setQuery(event.target.value)} /></label>
      <label htmlFor="crm-segment-filter">Directory group<select id="crm-segment-filter" value={segment} onChange={event => setSegment(event.target.value)}><option value="">All clubs</option><option value="current_ysp">Current Youth Partners</option><option value="directory">Other directory clubs</option></select></label>
      <label htmlFor="crm-area-filter">Area or borough<select id="crm-area-filter" value={area} onChange={event => setArea(event.target.value)}><option value="">All areas</option>{areaOrder.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <label htmlFor="crm-source-filter">Workbook source<select id="crm-source-filter" value={source} onChange={event => setSource(event.target.value)}><option value="">All sources</option>{sources.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <label htmlFor="crm-owner-filter">Rep ownership<select id="crm-owner-filter" value={owner} onChange={event => setOwner(event.target.value)}><option value="">All clubs</option><option value="unassigned">Unassigned</option>{reps.map(rep => <option key={rep.id} value={rep.id}>{rep.name}</option>)}</select></label>
      <span className="small muted">Showing {visible.length} of {clubs.length}</span>
    </div>
    <div className="crm-directory-groups">
      {current.length > 0 && <details key={`current-${filterKey}`} open><summary><strong>Current Youth Partners (YSPs)</strong><span>{current.length} clubs</span></summary><ClubRows clubs={current} /></details>}
      {areaOrder.map(group => { const members = directory.filter(club => club.area === group); return members.length > 0 && <details key={`${group}-${filterKey}`} open={activeFilter}><summary><strong>{group}</strong><span>{members.length} clubs</span></summary><ClubRows clubs={members} /></details>; })}
      {visible.length === 0 && <p className="empty-state">No clubs match these filters.</p>}
    </div>
  </>;
}
