export default function Login() {
  return <div className="login-page">
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <header className="login-header"><div className="site-identity"><span className="site-roundel" aria-hidden="true">YSP</span><span className="site-wordmark"><strong>NYCFC</strong><small>YOUTH SOCCER PARTNERSHIP</small></span></div></header>
    <div className="login-band" />
    <div className="login-masthead"><p>Youth Soccer Partnership</p></div>
    <main className="login-content" id="main-content">
      <div className="login-panel">
        <p className="eyebrow">Spring 2027 prototype</p>
        <h1>Choose a workspace</h1>
        <p className="muted">Explore the Cyclones prototype without a password.</p>
        <div className="demo-workspaces">
          <form action="/api/login" method="post">
            <input type="hidden" name="userId" value="phineas" />
            <button className="button primary" type="submit">Enter rep workspace <span>→</span></button>
          </form>
          <form action="/api/login" method="post">
            <input type="hidden" name="userId" value="cyclones-admin" />
            <button className="button ghost" type="submit">Enter partner workspace <span>→</span></button>
          </form>
        </div>
        <p className="small muted">Demo access is open to anyone who can reach this preview. Use test information only.</p>
      </div>
      <aside className="login-aside"><p className="eyebrow">One club. One clear plan.</p><h2>Every matchday starts with better preparation.</h2><p>A shared place for partnership details, tasks, messages and materials.</p></aside>
    </main>
    <footer className="site-footer"><div><strong>NYCFC <span>YSP</span></strong><small>Spring 2027 prototype</small></div><span>Youth Soccer Partnership</span></footer>
  </div>;
}
