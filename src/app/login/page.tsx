import Image from "next/image";
import { listSprintMatches } from "@/lib/experiences";

export const dynamic = "force-dynamic";

export default function Login() {
  const matches = listSprintMatches();
  return <div className="login-page">
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <header className="login-header"><div className="site-identity"><Image className="site-crest" src="/nycfc-crest.png" alt="New York City FC crest" width={54} height={54} priority /><span className="site-wordmark"><strong>NYCFC</strong><small>YOUTH SOCCER PORTAL</small></span></div></header>
    <div className="login-band" />
    <div className="login-masthead"><p>Youth Soccer Portal</p></div>
    <main className="login-content" id="main-content">
      <div className="login-panel">
        <p className="eyebrow">Spring 2027 prototype</p>
        <h1>Choose a workspace</h1>
        <div className="demo-workspaces">
          <form action="/api/login" method="post">
            <input type="hidden" name="userId" value="phineas" />
            <button className="button primary" type="submit">Enter rep workspace <span>→</span></button>
          </form>
          <form action="/api/login" method="post">
            <input type="hidden" name="userId" value="cyclones-admin" />
            <button className="button ghost" type="submit">Enter partner workspace <span>→</span></button>
          </form>
          <form action="/api/login" method="post">
            <input type="hidden" name="userId" value="phineas" />
            <input type="hidden" name="destination" value="crm" />
            <button className="button ghost" type="submit">Enter YSP Internal CRM <span>→</span></button>
          </form>
        </div>
        <p className="small muted">Demo access is open to anyone who can reach this preview. Use test information only.</p>
      </div>
      <aside className="login-calendar-panel" aria-labelledby="login-calendar-title">
        <div className="login-calendar-head"><p className="eyebrow">2027 SPRINT SEASON</p><h2 id="login-calendar-title">Experience calendar</h2><p>Match dates, offerings, and group reservations in one staff tracker.</p></div>
        <div className="login-calendar-schedule"><div className="login-calendar-schedule-head"><strong>Match calendar</strong><span>{matches.length} home matches</span></div>{matches.slice(0, 4).map(match => <div className="login-calendar-match" key={match.id}><time dateTime={match.match_date}><span>{new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(new Date(`${match.match_date}T12:00:00Z`))}</span><strong>{Number(match.match_date.slice(8))}</strong></time><div><strong>{match.opponent}</strong><small>{match.venue_confirmed ? match.venue : "Venue TBD"}</small></div></div>)}</div>
        <form action="/api/login" method="post"><input type="hidden" name="userId" value="phineas" /><input type="hidden" name="destination" value="experiences" /><button className="button primary" type="submit">Enter 2027 Sprint calendar <span>→</span></button></form>
      </aside>
    </main>
    <footer className="site-footer"><div><strong>NYCFC <span>YSP</span></strong><small>Spring 2027 prototype</small></div><span>Youth Soccer Portal</span></footer>
  </div>;
}
