export default function Login() {
  return <div className="login-page">
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <header className="login-header"><div className="site-identity"><span className="site-roundel" aria-hidden="true">YSP</span><span className="site-wordmark"><strong>NYCFC</strong><small>YOUTH SOCCER PORTAL</small></span></div></header>
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
    </main>
    <footer className="site-footer"><div><strong>NYCFC <span>YSP</span></strong><small>Spring 2027 prototype</small></div><span>Youth Soccer Portal</span></footer>
  </div>;
}
