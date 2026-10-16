export default function Login() {
  return <main className="login-page">
    <div className="login-panel">
      <div className="brand-mark">YSP<span>•</span></div>
      <p className="eyebrow">Youth Soccer Partnership / Spring 2027</p>
      <h1>Choose a workspace.</h1>
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
    <div className="login-aside"><div className="mosaic" aria-hidden="true"><span /><span /><span /><span /></div><p className="eyebrow">One club. One clear plan.</p><h2>Every matchday starts with better preparation.</h2><p>A shared place for partnership details, tasks, messages and materials.</p></div>
  </main>;
}
