import Link from "next/link";
import Image from "next/image";

type ShellProps = {
  kind: "rep" | "partner";
  name: string;
  children: React.ReactNode;
  active?: "partners" | "club" | "crm" | "overview";
};

export function Shell({ kind, name, children, active = kind === "rep" ? "partners" : "overview" }: ShellProps) {
  const isRep = kind === "rep";

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <header className="site-header">
      <Link href={isRep ? "/rep" : "/partner"} className="site-identity" aria-label="Youth Soccer Partnership home">
        {isRep
          ? <Image className="site-crest" src="/nycfc-crest.png" alt="" width={54} height={54} priority />
          : <span className="site-roundel" aria-hidden="true">YSP</span>}
        <span className="site-wordmark"><strong>NYCFC</strong><small>YOUTH SOCCER PARTNERSHIP</small></span>
      </Link>
      <span className="site-header-label">{active === "crm" ? "YSP Internal CRM" : isRep ? "Rep workspace" : "Partner workspace"}</span>
      <div className="site-account"><span className="account-name">{name}</span><form action="/api/logout" method="post"><button className="sign-out" type="submit">Sign out</button></form></div>
    </header>
    <div className="sky-band"><span>SPRING 2027</span><span>YOUTH SOCCER PARTNERSHIPS</span></div>
    <div className="page-masthead"><div className="masthead-inner"><span className="masthead-kicker">NEW YORK CITY FC</span><p>{active === "crm" ? "YSP Internal CRM" : isRep ? "Rep Workspace" : "Partner Workspace"}</p></div></div>
    <nav className="workspace-nav" aria-label="Workspace navigation"><div className="workspace-nav-inner">
      {isRep ? <>
        <Link href="/rep" aria-current={active === "partners" ? "page" : undefined}>Partners</Link>
        <Link href="/rep/partners/cyclones" aria-current={active === "club" ? "page" : undefined}>Cyclones record</Link>
        <Link href="/crm" aria-current={active === "crm" ? "page" : undefined}>CRM</Link>
      </> : <>
        <Link href="/partner" aria-current="page">Overview</Link>
        <a href="#checklist">Checklist</a>
        <a href="#messages">Messages</a>
        <a href="#resources">Resources</a>
      </>}
    </div></nav>
    {children}
    <footer className="site-footer"><div><strong>NYCFC <span>YSP</span></strong><small>Spring 2027 prototype</small></div><span>Youth Soccer Partnership</span></footer>
  </div>;
}
