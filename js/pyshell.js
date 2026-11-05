/**
 * A tiny, safe Python-subset interpreter for the scripting labs (weeks 3-4).
 * Supports: assignment, print, f-strings, ints/floats/strings/lists/dicts/bools/None,
 * arithmetic + comparison + and/or/not, in, if/elif/else, for x in ..., while,
 * def/return, open().read()/readlines()/write(), len, range, str, int, sorted, sum, min, max,
 * .split/.strip/.lower/.upper/.startswith/.endswith/.append/.items/.keys/.values/.get/.count/.join.
 * Nothing touches the real machine: files live in the simulated filesystem.
 */

export function runPython(source, io) {
  const out = [];
  const lines = source.replace(/\t/g, '    ').split('\n');
  const tokensCache = new Map();

  class Ret { constructor(v) { this.v = v; } }
  class Brk {}
  class Cnt {}
  const fail = (m) => { throw new Error(m); };

  /* ---------- expression tokenizer + parser ---------- */
  function tokenize(src) {
    if (tokensCache.has(src)) return tokensCache.get(src);
    const toks = [];
    let i = 0;
    const re = {
      ws: /^\s+/,
      num: /^\d+(\.\d+)?/,
      fstr: /^f(?:"([^"]*)"|'([^']*)')/,
      str: /^(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')/,
      name: /^[A-Za-z_][A-Za-z0-9_]*/,
      op: /^(==|!=|<=|>=|\/\/|\*\*|\+=|-=|\*=|[-+*/%<>=()[\]{},.:])/
    };
    while (i < src.length) {
      const rest = src.slice(i);
      let m;
      if ((m = rest.match(re.ws))) { i += m[0].length; continue; }
      if ((m = rest.match(re.fstr))) { toks.push({ t: 'fstr', v: m[1] ?? m[2] }); i += m[0].length; continue; }
      if ((m = rest.match(re.num))) { toks.push({ t: 'num', v: Number(m[0]) }); i += m[0].length; continue; }
      if ((m = rest.match(re.str))) {
        const raw = m[1] ?? m[2] ?? '';
        toks.push({ t: 'str', v: raw.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\(["'\\])/g, '$1') });
        i += m[0].length; continue;
      }
      if ((m = rest.match(re.name))) { toks.push({ t: 'name', v: m[0] }); i += m[0].length; continue; }
      if ((m = rest.match(re.op))) { toks.push({ t: 'op', v: m[0] }); i += m[0].length; continue; }
      fail(`SyntaxError: unexpected character '${rest[0]}'`);
    }
    tokensCache.set(src, toks);
    return toks;
  }

  function parseExpr(src) {
    const toks = tokenize(src);
    let p = 0;
    const peek = () => toks[p];
    const eat = (v) => { const t = toks[p]; if (v && (!t || t.v !== v)) fail(`SyntaxError: expected '${v}'`); p++; return t; };
    const isOp = (v) => toks[p] && toks[p].t === 'op' && toks[p].v === v;
    const isName = (v) => toks[p] && toks[p].t === 'name' && toks[p].v === v;

    function orExpr() { let l = andExpr(); while (isName('or')) { p++; const r = andExpr(); const a = l; l = (e) => a(e) || r(e); } return l; }
    function andExpr() { let l = notExpr(); while (isName('and')) { p++; const r = notExpr(); const a = l; l = (e) => a(e) && r(e); } return l; }
    function notExpr() { if (isName('not')) { p++; const x = notExpr(); return (e) => !x(e); } return cmp(); }
    function cmp() {
      let l = add();
      for (;;) {
        const t = peek();
        if (!t) break;
        let op = null;
        if (t.t === 'op' && ['==', '!=', '<', '>', '<=', '>='].includes(t.v)) { op = t.v; p++; }
        else if (t.t === 'name' && t.v === 'in') { op = 'in'; p++; }
        else if (t.t === 'name' && t.v === 'not' && toks[p + 1]?.v === 'in') { op = 'not in'; p += 2; }
        else break;
        const r = add(); const a = l;
        l = (e) => {
          const x = a(e), y = r(e);
          switch (op) {
            case '==': return x === y; case '!=': return x !== y;
            case '<': return x < y; case '>': return x > y; case '<=': return x <= y; case '>=': return x >= y;
            case 'in': return contains(y, x); default: return !contains(y, x);
          }
        };
      }
      return l;
    }
    function add() {
      let l = mul();
      while (isOp('+') || isOp('-')) {
        const op = eat().v; const r = mul(); const a = l;
        l = (e) => { const x = a(e), y = r(e); if (op === '+') return (Array.isArray(x) && Array.isArray(y)) ? x.concat(y) : x + y; return x - y; };
      }
      return l;
    }
    function mul() {
      let l = unary();
      while (isOp('*') || isOp('/') || isOp('//') || isOp('%')) {
        const op = eat().v; const r = unary(); const a = l;
        l = (e) => { const x = a(e), y = r(e); if (op === '*') return typeof x === 'string' ? x.repeat(y) : x * y; if (op === '/') return x / y; if (op === '//') return Math.floor(x / y); return x % y; };
      }
      return l;
    }
    function unary() { if (isOp('-')) { p++; const x = unary(); return (e) => -x(e); } return power(); }
    function power() { let l = postfix(); if (isOp('**')) { p++; const r = unary(); const a = l; l = (e) => Math.pow(a(e), r(e)); } return l; }
    function postfix() {
      let l = atom();
      for (;;) {
        if (isOp('.')) {
          p++; const name = eat().v;
          if (isOp('(')) {
            p++; const args = [];
            while (!isOp(')')) { args.push(orExpr()); if (isOp(',')) p++; }
            eat(')'); const a = l;
            l = (e) => callMethod(a(e), name, args.map((f) => f(e)));
          } else { const a = l; l = (e) => a(e)[name]; }
        } else if (isOp('[')) {
          p++; let lo = null, hi = null, slice = false;
          if (!isOp(':')) lo = orExpr();
          if (isOp(':')) { p++; slice = true; if (!isOp(']')) hi = orExpr(); }
          eat(']'); const a = l;
          l = (e) => {
            const o = a(e);
            if (slice) return typeof o === 'string' ? o.slice(lo ? lo(e) : 0, hi ? hi(e) : undefined) : o.slice(lo ? lo(e) : 0, hi ? hi(e) : undefined);
            const k = lo(e);
            if (Array.isArray(o) || typeof o === 'string') { const idx = k < 0 ? o.length + k : k; if (idx >= o.length || idx < 0) fail('IndexError: index out of range'); return o[idx]; }
            if (!(k in o)) fail(`KeyError: '${k}'`);
            return o[k];
          };
        } else if (isOp('(')) {
          p++; const args = [];
          while (!isOp(')')) { args.push(orExpr()); if (isOp(',')) p++; }
          eat(')'); const a = l;
          l = (e) => callFn(a, args, e);
        } else break;
      }
      return l;
    }
    function atom() {
      const t = eat();
      if (!t) fail('SyntaxError: unexpected end');
      if (t.t === 'num') return () => t.v;
      if (t.t === 'str') { let v = t.v; while (peek() && peek().t === 'str') v += eat().v; return () => v; }
      if (t.t === 'fstr') return (e) => t.v.replace(/\{([^}]*)\}/g, (_, ex) => fmt(parseExpr(ex.split(':')[0].trim())(e)));
      if (t.t === 'name') {
        if (t.v === 'True') return () => true;
        if (t.v === 'False') return () => false;
        if (t.v === 'None') return () => null;
        const nm = t.v; const fn = (e) => { if (!(nm in e) && !(nm in builtins)) fail(`NameError: name '${nm}' is not defined`); return nm in e ? e[nm] : builtins[nm]; };
        fn.fname = nm; return fn;
      }
      if (t.v === '(') { const x = orExpr(); eat(')'); return x; }
      if (t.v === '[') { const items = []; while (!isOp(']')) { items.push(orExpr()); if (isOp(',')) p++; } eat(']'); return (e) => items.map((f) => f(e)); }
      if (t.v === '{') { const kv = []; while (!isOp('}')) { const k = orExpr(); eat(':'); const v = orExpr(); kv.push([k, v]); if (isOp(',')) p++; } eat('}'); return (e) => Object.fromEntries(kv.map(([k, v]) => [k(e), v(e)])); }
      fail(`SyntaxError: invalid syntax near '${t.v}'`);
    }
    const f = orExpr();
    if (p < toks.length) fail(`SyntaxError: invalid syntax near '${toks[p].v}'`);
    return f;
  }

  /* ---------- runtime ---------- */
  const fmt = (v) => {
    if (v === null || v === undefined) return 'None';
    if (v === true) return 'True';
    if (v === false) return 'False';
    if (Array.isArray(v)) return '[' + v.map(repr).join(', ') + ']';
    if (typeof v === 'object') return '{' + Object.entries(v).map(([k, x]) => `${repr(k)}: ${repr(x)}`).join(', ') + '}';
    return String(v);
  };
  const repr = (v) => (typeof v === 'string' ? `'${v}'` : fmt(v));
  const contains = (c, x) => (Array.isArray(c) || typeof c === 'string' ? c.includes(x) : x in c);

  const builtins = {
    len: (x) => (typeof x === 'object' && !Array.isArray(x) ? Object.keys(x).length : x.length),
    str: (x) => fmt(x),
    int: (x) => { const n = parseInt(x, 10); if (Number.isNaN(n)) fail(`ValueError: invalid literal for int(): '${x}'`); return n; },
    float: (x) => Number(x),
    range: (a, b, c) => { const lo = b === undefined ? 0 : a, hi = b === undefined ? a : b, st = c || 1; const r = []; for (let i = lo; st > 0 ? i < hi : i > hi; i += st) r.push(i); return r; },
    sorted: (x, rev) => [...x].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
    sum: (x) => x.reduce((s, v) => s + v, 0),
    min: (...a) => Math.min(...(a.length === 1 ? a[0] : a)),
    max: (...a) => Math.max(...(a.length === 1 ? a[0] : a)),
    abs: Math.abs,
    list: (x) => (typeof x === 'object' && !Array.isArray(x) ? Object.keys(x) : [...x]),
    set: (x) => [...new Set(x)],
    enumerate: (x) => x.map((v, i) => [i, v]),
    open: (name, mode = 'r') => io.open(name, mode),
    input: () => ''
  };

  function callFn(fnExpr, argExprs, env) {
    const name = fnExpr.fname;
    const args = argExprs.map((f) => f(env));
    if (name === 'print') { out.push(args.map(fmt).join(' ')); return null; }
    if (name && userFns[name]) return runFn(userFns[name], args);
    const f = fnExpr(env);
    if (typeof f !== 'function') fail('TypeError: object is not callable');
    return f(...args);
  }

  function callMethod(obj, name, a) {
    if (obj && obj.__file) {
      if (name === 'read') return obj.read();
      if (name === 'readlines') return obj.read().split('\n').map((l) => l + '\n');
      if (name === 'write') { obj.write(a[0]); return null; }
      if (name === 'close') return null;
    }
    if (typeof obj === 'string') {
      switch (name) {
        case 'split': return a.length ? obj.split(a[0]) : obj.split(/\s+/).filter(Boolean);
        case 'strip': return obj.trim(); case 'lower': return obj.toLowerCase(); case 'upper': return obj.toUpperCase();
        case 'startswith': return obj.startsWith(a[0]); case 'endswith': return obj.endsWith(a[0]);
        case 'replace': return obj.split(a[0]).join(a[1]); case 'count': return obj.split(a[0]).length - 1;
        case 'splitlines': return obj.split('\n'); case 'find': return obj.indexOf(a[0]);
        case 'join': return a[0].join(obj); case 'format': return obj.replace(/\{\}/g, () => fmt(a.shift()));
      }
    }
    if (Array.isArray(obj)) {
      if (name === 'append') { obj.push(a[0]); return null; }
      if (name === 'sort') { obj.sort(); return null; }
      if (name === 'count') return obj.filter((x) => x === a[0]).length;
      if (name === 'index') return obj.indexOf(a[0]);
    }
    if (obj && typeof obj === 'object') {
      if (name === 'items') return Object.entries(obj);
      if (name === 'keys') return Object.keys(obj);
      if (name === 'values') return Object.values(obj);
      if (name === 'get') return a[0] in obj ? obj[a[0]] : a.length > 1 ? a[1] : null;
    }
    fail(`AttributeError: object has no attribute '${name}'`);
  }

  /* ---------- statements ---------- */
  const userFns = {};
  const indentOf = (l) => l.match(/^ */)[0].length;
  const clean = (l) => l.replace(/\s+#.*$/, '').replace(/^\s*#.*$/, '');

  function block(start, indent) {
    const stmts = [];
    let i = start;
    while (i < lines.length) {
      const raw = clean(lines[i]);
      if (!raw.trim()) { i++; continue; }
      const ind = indentOf(raw);
      if (ind < indent) break;
      if (ind > indent) fail('IndentationError: unexpected indent');
      const text = raw.trim();
      if (/:$/.test(text) && /^(if|elif|else|for|while|def|try|except|with)\b/.test(text)) {
        const bodyIndent = (() => { let j = i + 1; while (j < lines.length && !clean(lines[j]).trim()) j++; return j < lines.length ? indentOf(clean(lines[j])) : indent + 4; })();
        const sub = block(i + 1, bodyIndent);
        stmts.push({ text, body: sub.stmts });
        i = sub.next;
      } else { stmts.push({ text }); i++; }
    }
    return { stmts, next: i };
  }

  function runFn(fn, args) {
    const env = Object.create(null);
    fn.params.forEach((p, i) => { env[p] = args[i]; });
    try { exec(fn.body, env); } catch (e) { if (e instanceof Ret) return e.v; throw e; }
    return null;
  }

  function exec(stmts, env) {
    for (let i = 0; i < stmts.length; i++) {
      const s = stmts[i];
      const t = s.text;
      let m;
      if ((m = t.match(/^def\s+(\w+)\((.*)\):$/))) { userFns[m[1]] = { params: m[2].split(',').map((x) => x.trim()).filter(Boolean), body: s.body }; continue; }
      if (/^if\b/.test(t)) {
        let done = false;
        let cur = s; let j = i;
        for (;;) {
          const c = cur.text;
          let cond;
          if (/^else:$/.test(c)) cond = true;
          else cond = !!parseExpr(c.replace(/^(el)?if\s+/, '').replace(/:$/, ''))(env);
          if (!done && cond) { done = true; exec(cur.body, env); }
          const nxt = stmts[j + 1];
          if (nxt && (/^elif\b/.test(nxt.text) || /^else:$/.test(nxt.text))) { j++; cur = nxt; } else break;
        }
        i = j; continue;
      }
      if ((m = t.match(/^for\s+(.+?)\s+in\s+(.+):$/))) {
        const names = m[1].split(',').map((x) => x.trim());
        let it = parseExpr(m[2])(env);
        if (!Array.isArray(it)) it = typeof it === 'string' ? [...it] : Object.keys(it);
        let guard = 0;
        for (const v of it) {
          if (++guard > 5000) fail('RuntimeError: loop limit reached in the lab sandbox');
          if (names.length === 1) env[names[0]] = v; else names.forEach((n, k) => { env[n] = v[k]; });
          try { exec(s.body, env); } catch (e) { if (e instanceof Brk) break; if (e instanceof Cnt) continue; throw e; }
        }
        continue;
      }
      if ((m = t.match(/^while\s+(.+):$/))) {
        let guard = 0;
        while (parseExpr(m[1])(env)) {
          if (++guard > 5000) fail('RuntimeError: loop limit reached in the lab sandbox');
          try { exec(s.body, env); } catch (e) { if (e instanceof Brk) break; if (e instanceof Cnt) continue; throw e; }
        }
        continue;
      }
      if ((m = t.match(/^with\s+(.+)\s+as\s+(\w+):$/))) { env[m[2]] = parseExpr(m[1])(env); exec(s.body, env); continue; }
      if (t === 'try:' || /^except\b/.test(t)) {
        if (t === 'try:') { try { exec(s.body, env); } catch (e) { if (e instanceof Ret || e instanceof Brk || e instanceof Cnt) throw e; const nxt = stmts[i + 1]; if (nxt && /^except\b/.test(nxt.text)) exec(nxt.body, env); else throw e; } }
        continue;
      }
      if (t === 'pass') continue;
      if (t === 'break') throw new Brk();
      if (t === 'continue') throw new Cnt();
      if ((m = t.match(/^return(?:\s+(.*))?$/))) throw new Ret(m[1] ? parseExpr(m[1])(env) : null);
      if (/^import\s|^from\s/.test(t)) continue;
      if ((m = t.match(/^(\w+)\[(.+)\]\s*(\+=|-=|=)(?!=)\s*(.+)$/))) {
        const o = env[m[1]]; const k = parseExpr(m[2])(env); const v = parseExpr(m[4])(env);
        if (m[3] === '=') o[k] = v; else if (m[3] === '+=') o[k] = (o[k] ?? 0) + v; else o[k] -= v;
        continue;
      }
      if ((m = t.match(/^(\w+(?:\s*,\s*\w+)*)\s*(\+=|-=|\*=|=)(?!=)\s*(.+)$/))) {
        const val = parseExpr(m[3])(env);
        const targets = m[1].split(',').map((x) => x.trim());
        if (targets.length > 1) targets.forEach((n, k) => { env[n] = val[k]; });
        else if (m[2] === '=') env[targets[0]] = val;
        else if (m[2] === '+=') env[targets[0]] = Array.isArray(env[targets[0]]) ? env[targets[0]].concat(val) : env[targets[0]] + val;
        else if (m[2] === '-=') env[targets[0]] -= val; else env[targets[0]] *= val;
        continue;
      }
      parseExpr(t)(env);
    }
  }

  try {
    const { stmts } = block(0, 0);
    exec(stmts, Object.create(null));
  } catch (e) {
    if (e instanceof Ret || e instanceof Brk || e instanceof Cnt) return { out: out.join('\n'), err: false };
    out.push('Traceback (most recent call last):\n  File "script.py"\n' + e.message);
    return { out: out.join('\n'), err: true };
  }
  return { out: out.join('\n'), err: false };
}
