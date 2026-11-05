"use client";

import { useState } from "react";
import Link from "next/link";
import type { CrmClub } from "@/lib/db";
import { CrmLogo } from "@/components/CrmLogo";
import { YspPartnerMark } from "@/components/YspPartnerMark";

const areaOrder = ["Brooklyn", "Bronx", "Queens", "Manhattan", "Staten Island", "Long Island", "Westchester", "Hudson Valley", "Capital District", "Connecticut", "Area to confirm"];

function ClubRows({ clubs }: { clubs: CrmClub[] }) {
  return <div className="partner-list">{clubs.map(club => <Link className="partner-row" href={`/crm/${club.id}`} key={club.id}><CrmLogo name={club.name} path={club.logo_path} /><span className="partner-main"><strong>{club.name}</strong><span className="crm-row-tags"><span className="tag tiny blue">{club.segment === "current_ysp" ? "Current YSP" : "Other club"}</span>{club.locations.length ? club.locations.map(area => <span className="tag tiny outlined" key={area}>{area}</span>) : <span className="tag tiny outlined">Location to confirm</span>}</span><small>{club.assigned_rep_name || "Unassigned"}{club.sources ? ` · ${club.sources}` : ""}</small></span><span className={`partner-next${club.segment === "current_ysp" ? " has-ysp-mark" : ""}`}><small>NEXT ACTION</small><strong>{club.next_action || "No next action yet"}</strong>{club.segment === "current_ysp" && <span className="crm-row-partner-mark"><YspPartnerMark /></span>}</span><span className="row-arrow" aria-hidden="true">↗</span></Link>)}</div>;
}

export function CrmDirectory({ clubs, reps }: { clubs: CrmClub[]; reps: { id: string; name: string }[] }) {
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState("");
  const [area, setArea] = useState("");
  const [source, setSource] = useState("");
  const [owner, setOwner] = useState("");
  const [view, setView] = useState<"alphabetical" | "location" | "status">("alphabetical");
  const sources = [...new Set(clubs.flatMap(club => club.sources ? club.sources.split(" · ") : []))].sort();
  const visible = clubs.filter(club =>
    (club.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()) || club.aliases.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
    && (!segment || club.segment === segment)
    && (!area || (area === "Area to confirm" ? club.locations.length === 0 : club.locations.includes(area)))
    && (!source || club.sources.split(" · ").includes(source))
    && (!owner || (owner === "unassigned" ? !club.assigned_rep_id : club.assigned_rep_id === owner))
  ).sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
  const current = visible.filter(club => club.segment === "current_ysp");
  const directory = visible.filter(club => club.segment !== "current_ysp");
  const filterKey = `${query}|${segment}|${area}|${source}|${owner}|${view}`;
  return <>
    <div className="crm-directory-filters">
      <label htmlFor="crm-search">Find a club<input id="crm-search" type="search" placeholder="Search club names" value={query} onChange={event => setQuery(event.target.value)} /></label>
      <label htmlFor="crm-view">View<select id="crm-view" value={view} onChange={event => setView(event.target.value as typeof view)}><option value="alphabetical">Alphabetical (A–Z)</option><option value="location">By location</option><option value="status">By YSP status</option></select></label>
      <label htmlFor="crm-segment-filter">Directory group<select id="crm-segment-filter" value={segment} onChange={event => setSegment(event.target.value)}><option value="">All clubs</option><option value="current_ysp">Current Youth Partners</option><option value="directory">Other directory clubs</option></select></label>
      <label htmlFor="crm-area-filter">Location<select id="crm-area-filter" value={area} onChange={event => setArea(event.target.value)}><option value="">All locations</option>{areaOrder.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <label htmlFor="crm-source-filter">Workbook source<select id="crm-source-filter" value={source} onChange={event => setSource(event.target.value)}><option value="">All sources</option>{sources.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <label htmlFor="crm-owner-filter">Rep ownership<select id="crm-owner-filter" value={owner} onChange={event => setOwner(event.target.value)}><option value="">All clubs</option><option value="unassigned">Unassigned</option>{reps.map(rep => <option key={rep.id} value={rep.id}>{rep.name}</option>)}</select></label>
      <span className="small muted">Showing {visible.length} of {clubs.length}</span>
    </div>
    <div className={`crm-directory-groups${view === "alphabetical" ? " alphabetical" : ""}`}>
      {view === "alphabetical" && visible.length > 0 && <ClubRows clubs={visible} />}
      {view === "status" && current.length > 0 && <details key={`current-${filterKey}`} open><summary><strong>Current Youth Partners (YSPs)</strong><span>{current.length} clubs</span></summary><ClubRows clubs={current} /></details>}
      {view === "status" && directory.length > 0 && <details key={`directory-${filterKey}`} open><summary><strong>Other clubs</strong><span>{directory.length} clubs</span></summary><ClubRows clubs={directory} /></details>}
      {view === "location" && areaOrder.map(group => { const members = visible.filter(club => group === "Area to confirm" ? club.locations.length === 0 : club.locations.includes(group)); return members.length > 0 && <details key={`${group}-${filterKey}`} open><summary><strong>{group}</strong><span>{members.length} clubs</span></summary><ClubRows clubs={members} /></details>; })}
      {visible.length === 0 && <p className="empty-state">No clubs match these filters.</p>}
    </div>
  </>;
}
