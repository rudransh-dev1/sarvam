/**
 * A mock web application that runs inside a sandboxed iframe.
 * The page itself is real HTML and runs real JavaScript, so any injection a learner sends
 * actually executes inside that frame. It is isolated from the parent page (unique origin),
 * has no network access, and cannot touch localStorage of the site.
 *
 * Three classic bugs live in it, one per task:
 *   /note?id=N          broken object level authorisation (IDOR)
 *   /download?file=...  path traversal
 *   /feedback           reflected XSS through innerHTML
 */

export function buildApp(spec) {
  const data = JSON.stringify({
    title: spec.appTitle || 'Nimbus',
    notes: spec.notes || [],
    files: spec.files || {},
    privateFile: spec.privateFile || '',
    session: spec.session || {},
    host: spec.host || 'notes.lab:8080',
    bank: spec.bank || null
  }).replace(/</g, '\\u003c');

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Nimbus</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 14px/1.5 ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif; background: #f6f7f9; color: #17202a; }
  .bar { display: flex; gap: 6px; padding: 7px 8px; background: #e8ebef; border-bottom: 1px solid #cfd6de; position: sticky; top: 0; }
  .bar input { flex: 1; font: 12px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; padding: 6px 8px; border: 1px solid #b9c2cc; border-radius: 6px; background: #fff; }
  .bar button { font: 12px/1 ui-sans-serif, system-ui; padding: 7px 11px; border: 1px solid #1f5541; background: #0f2b23; color: #d8f5e8; border-radius: 6px; cursor: pointer; }
  header { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 1px solid #e0e5ea; background: #fff; }
  header b { font-size: 15px; letter-spacing: -.01em; }
  header nav { margin-left: auto; display: flex; gap: 12px; font-size: 13px; }
  main { padding: 18px 16px 28px; max-width: 720px; }
  h1 { font-size: 19px; margin: 0 0 10px; letter-spacing: -.01em; }
  p { margin: 0 0 10px; }
  a { color: #0b6b4f; }
  .card { background: #fff; border: 1px solid #e0e5ea; border-radius: 10px; padding: 12px 14px; margin: 10px 0; }
  .muted { color: #5c6b7a; font-size: 12px; }
  pre { background: #0f1a17; color: #cfe9de; padding: 10px 12px; border-radius: 8px; overflow: auto; font-size: 12px; }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  input[type=text] { width: 100%; padding: 8px 10px; border: 1px solid #b9c2cc; border-radius: 7px; font: inherit; }
  button.primary { margin-top: 8px; padding: 8px 14px; border: 0; border-radius: 7px; background: #0f2b23; color: #d8f5e8; font: 600 13px/1 ui-sans-serif, system-ui; cursor: pointer; }
  .err { color: #a3231b; }
  .reflected { margin-top: 14px; padding: 10px 12px; border-left: 3px solid #cfd6de; background: #fff; }
  .bank-head { background: #064e3b; color: #d1fae5; border-radius: 10px; padding: 14px 16px; margin-bottom: 12px; }
  .bank-head h1 { margin: 0; font-size: 20px; letter-spacing: .04em; color: #ecfdf5; }
  .bank-head p { margin: 4px 0 0; font-size: 12px; opacity: .85; }
  .acct { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
  .acct .num { font-family: ui-monospace, monospace; color: #057a55; }
  .bal.neg { color: #b91c1c; }
  .bal.pos { color: #047857; }
  .win { border: 1px solid #cfd8e3; border-radius: 10px; padding: 16px; margin-bottom: 12px; background: #fff; }
  .win h2 { margin: 0 0 10px; font-size: 15px; }
  .modal-back { position: fixed; inset: 0; background: rgba(8,15,26,.55); display: flex; align-items: center; justify-content: center; z-index: 9; }
  .modal { background: #fff; border-radius: 12px; padding: 18px; width: min(360px, 88vw); box-shadow: 0 18px 50px rgba(0,0,0,.3); }
  .modal h3 { margin: 0 0 8px; font-size: 16px; color: #047857; }
  .modal .ref { font-family: ui-monospace, monospace; font-size: 12px; color: #334155; }
  .flagbox { background: #022c22; color: #6ee7a8; border: 1px solid #10b981; border-radius: 10px; padding: 14px; margin-top: 12px; }
  .flagbox .k { font-family: ui-monospace, monospace; font-size: 16px; word-break: break-all; color: #a7f3d0; }
</style></head>
<body>
  <div class="bar"><input id="urlbox" spellcheck="false" aria-label="address bar" /><button id="gobtn">go</button></div>
  <header><b id="brand">Nimbus</b><nav id="nav"></nav></header>
  <main id="view"></main>
<script>
  const DATA = ${data};
  window.__adminSession = DATA.session;
  DATA.profile = { balance: DATA.bank ? DATA.bank.balance : 0 };
  const view = document.getElementById('view');
  const urlbox = document.getElementById('urlbox');
  document.getElementById('brand').textContent = DATA.title;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function nav() {
    document.getElementById('nav').innerHTML =
      '<a href="#/">home</a><a href="#/note?id=1">my notes</a><a href="#/feedback">feedback</a><a href="#/about">about</a>';
  }

  function go(path) {
    const clean = path.startsWith('/') ? path : '/' + path;
    location.hash = '#' + clean;
  }

  function setUrl(path) { urlbox.value = path; }

  function parse() {
    const raw = decodeURIComponent((location.hash || '#/').slice(1)) || '/';
    const i = raw.indexOf('?');
    const path = i < 0 ? raw : raw.slice(0, i);
    const params = new URLSearchParams(i < 0 ? '' : raw.slice(i + 1));
    return { raw, path, params };
  }

  const pages = {
    '/': ({ raw }) => {
      setUrl(raw);
      if (DATA.bank) return bankHome();
      view.innerHTML =
        '<h1>Nimbus, notes that stay put</h1>' +
        '<p class="muted">Logged in as <b>' + esc(DATA.session.user || 'guest') + '</b> · plan: ' + esc(DATA.session.plan || 'free') + '</p>' +
        '<div class="card"><b>Your workspace</b><p>Open your notes, or check the API that the mobile app uses.</p>' +
        '<p><a href="#/note?id=1">open note 1</a> · <a href="#/api/note?id=1">api/note?id=1</a> · <a href="#/download?file=readme.txt">download readme.txt</a></p></div>' +
        '<div class="card"><b>Status</b><p class="muted">All systems normal. Admin backups run nightly.</p></div>';
    },
    '/bank-transfer': ({ raw }) => {
      setUrl(raw);
      if (DATA.bank) return bankTransfer();
      view.innerHTML = '<h1 class="err">404</h1><p>No route /bank-transfer on this app.</p>';
    },
    '/images': ({ raw }) => {
      setUrl(raw);
      view.innerHTML = '<h1>Index of /images</h1><p class="muted">logo.svg · hero.png</p>';
    },
    '/about': ({ raw }) => {
      setUrl(raw);
      view.innerHTML = '<h1>About Nimbus</h1><p class="muted">Nimbus is a demo notes service used to practise web security. Everything here is simulated.</p>';
    },
    '/note': ({ raw, params }) => {
      setUrl(raw);
      const id = params.get('id');
      const note = DATA.notes.find((n) => String(n.id) === String(id));
      if (!note) {
        view.innerHTML = '<h1 class="err">404</h1><p>No note with id ' + esc(id) + '.</p>';
        return;
      }
      view.innerHTML =
        '<h1>' + esc(note.title) + '</h1>' +
        '<p class="muted">id ' + esc(note.id) + ' · author ' + esc(note.author) + ' · visibility ' + esc(note.visibility) + '</p>' +
        '<div class="card">' + esc(note.body) + '</div>' +
        '<p class="muted"><a href="#/api/note?id=' + esc(note.id) + '">view as json</a></p>';
    },
    '/api/note': ({ raw, params }) => {
      setUrl(raw);
      const id = params.get('id');
      const note = DATA.notes.find((n) => String(n.id) === String(id));
      view.innerHTML = note
        ? '<h1>api response</h1><pre>' + esc(JSON.stringify(note, null, 2)) + '</pre>'
        : '<h1 class="err">404</h1><pre>{ "error": "not found" }</pre>';
    },
    '/download': ({ raw, params }) => {
      setUrl(raw);
      const file = params.get('file') || '';
      if (file.includes('..') || file.startsWith('/')) {
        view.innerHTML = '<h1>file served</h1><pre>' + esc(DATA.privateFile) + '</pre>';
        return;
      }
      const content = DATA.files[file];
      view.innerHTML = content === undefined
        ? '<h1 class="err">404</h1><p>No such file: ' + esc(file) + '</p>'
        : '<h1>file served</h1><pre>' + esc(content) + '</pre>';
    },
    '/feedback': ({ raw }) => {
      setUrl(raw);
      view.innerHTML =
        '<h1>Feedback</h1><p class="muted">Tell us what to improve. Your message shows up on this page so you can check it.</p>' +
        '<form id="fb"><input type="text" id="msg" placeholder="your message" autocomplete="off" /><button class="primary" type="submit">send feedback</button></form>' +
        '<div class="reflected" id="out"></div>';
      document.getElementById('fb').addEventListener('submit', (e) => {
        e.preventDefault();
        const out = document.getElementById('out');
        out.innerHTML = '<b>You wrote:</b><br>' + document.getElementById('msg').value;
      });
    }
  };

  function bankHome() {
    const b = DATA.bank;
    const pos = DATA.profile.balance >= 0;
    view.innerHTML =
      '<div class="bank-head"><h1>' + esc(b.name).toUpperCase() + '</h1><p>Safe &amp; secure internet banking</p></div>' +
      '<div class="win"><h2>Bank Account Number: <span style="color:#047857">' + esc(b.own) + '</span></h2>' +
      '<p class="muted">' + esc(b.customer || 'Account holder') + '</p>' +
      '<div class="acct"><span>Current Account · ' + esc(b.own) + '</span>' +
      '<span class="bal ' + (pos ? 'pos' : 'neg') + '">' + (pos ? '+' : '-') + '$' + Math.abs(DATA.profile.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</span></div></div>' +
      (pos
        ? '<div class="flagbox"><div style="font-size:12px;letter-spacing:.08em">CONGRATULATIONS — YOU HACKED THE BANK</div>' +
          '<div class="k">' + esc(b.flag) + '</div></div>'
        : '<div class="win"><h2>Staff area</h2><p class="muted">Cash deposits are registered by staff at ' +
          '<a href="#/bank-transfer">/bank-transfer</a>. Customers cannot use it, in theory.</p></div>');
  }

  function bankTransfer() {
    const b = DATA.bank;
    view.innerHTML =
      '<div class="bank-head"><h1>' + esc(b.name).toUpperCase() + '</h1><p>Staff account · register cash deposits</p></div>' +
      '<div class="win"><h2>Admin portal</h2>' +
      '<label class="muted" for="acct">Deposit to account</label>' +
      '<select id="acct">' + b.accounts.map((a) => '<option value="' + esc(a.number) + '">Acc ' + esc(a.number) + ' · ' + esc(a.name) + '</option>').join('') + '</select>' +
      '<label class="muted" for="amt">Amount (USD)</label>' +
      '<input id="amt" type="number" value="2000" min="1" step="100" />' +
      '<p><button class="primary" id="dep">register deposit</button></p>' +
      '<p class="muted" style="font-size:11px">This form is meant for staff. There is no login check on it.</p></div>';
    document.getElementById('dep').addEventListener('click', () => {
      const acct = document.getElementById('acct').value;
      const amt = Number(document.getElementById('amt').value) || 0;
      const mine = acct === b.own;
      if (mine) DATA.profile.balance += amt;
      const ref = String(Math.floor(Math.random() * 9000000) + 1000000) + '-' + Math.floor(Math.random() * 900 + 100);
      const box = document.createElement('div');
      box.className = 'modal-back';
      box.innerHTML =
        '<div class="modal"><h3>Success! Deposit completed</h3>' +
        '<p class="ref">DEPOSIT REFERENCE: ' + ref + '<br>ACCOUNT: ' + esc(acct) + '<br>AMOUNT: $' + amt.toFixed(2) + '</p>' +
        '<p><button class="primary" id="back">Return to bank page</button></p></div>';
      document.body.appendChild(box);
      box.querySelector('#back').addEventListener('click', () => {
        box.remove();
        go('/');
      });
    });
  }

  function route() {
    const ctx = parse();
    const page = pages[ctx.path] || null;
    if (!page) {
      setUrl(ctx.raw);
      view.innerHTML = '<h1 class="err">404</h1><p>No route ' + esc(ctx.raw) + '</p><p><a href="#/">back home</a></p>';
      return;
    }
    page(ctx);
    nav();
  }

  document.getElementById('gobtn').addEventListener('click', () => go(urlbox.value.trim() || '/'));
  urlbox.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); go(urlbox.value.trim() || '/'); } });
  window.addEventListener('hashchange', route);
  nav();
  route();
</script>
</body></html>`;
}
