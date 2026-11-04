/**
 * A small simulated shell over a plain-object filesystem, with pipes.
 * Deliberately not a full POSIX shell: it supports what the labs teach, enforces permissions,
 * and answers everything else with "command not found".
 */

const USER = 'student';
const HOST = 'web01';

const HELP = `Commands in this lab:
  pwd  ls [-l] [-a] [path]  cd <path>  cat <file>  head|tail [-n N] <file>
  grep [-i] [-r] [-c] [-n] <pattern> [path]
  find <path> [-name P] [-type f|d] [-perm -4000]
  wc -l [file]  file <file>  chmod <mode> <file>  chown <user> <file>
  cut -d <char> -f <n>  sort [-n] [-r]  uniq [-c]
  id  whoami  ps  sudo [-l|<cmd>]  echo  clear  man <cmd>  exit

Pipes work: grep 'Failed password' auth.log | cut -d' ' -f11 | sort | uniq -c
Anything else: command not found. This box is intentionally limited.`;

const MAN = {
  ls: 'ls [-l] [-a] [path]: list contents. -l shows modes, owner and size.',
  cd: 'cd <path>: change directory. .. up, ~ home, / root.',
  cat: 'cat <file>: print a file, or pass stdin through.',
  grep: 'grep [-i] [-r] [-c] [-n] <pattern> [path]: search contents; reads stdin if no path.',
  find: 'find <path> [-name P] [-type f|d] [-perm -4000]: walk the tree.',
  chmod: 'chmod <octal> <file>: change permissions. 4 read, 2 write, 1 execute.',
  sudo: 'sudo <cmd>: root if /etc/sudoers allows. sudo -l lists your rights.',
  cut: "cut -d' ' -f11: pull one field out of each line.",
  sort: 'sort [-n] [-r]: sort lines, numerically or reversed.',
  uniq: 'uniq -c: collapse repeats and count them.',
  ps: 'ps: running processes.',
  id: 'id: your uid, gid and groups.',
  wc: 'wc -l: count lines.',
  file: 'file <file>: guess a file type.',
  head: 'head [-n N] <file>: first N lines.',
  tail: 'tail [-n N] <file>: last N lines.'
};

const PROCS = [
  '  PID TTY          TIME CMD',
  '    1 ?        00:00:01 systemd',
  '  412 ?        00:00:00 sshd',
  '  418 ?        00:00:00 cron',
  '  631 ?        00:00:04 backup-agent',
  '  902 pts/0    00:00:00 bash'
].join('\n');

function clone(node) {
  if (node.type === 'file') return { ...node };
  const children = {};
  for (const k of Object.keys(node.children)) children[k] = clone(node.children[k]);
  return { ...node, children };
}

function modeBits(mode) {
  const m = String(mode).padStart(4, '0');
  const special = m[0];
  const digits = m.slice(-3).split('').map(Number);
  const triple = (n, isSpecial, ch) => {
    const s = [n & 4 ? 'r' : '-', n & 2 ? 'w' : '-'];
    if (isSpecial && ch) s.push(n & 1 ? ch : ch.toUpperCase());
    else s.push(n & 1 ? 'x' : '-');
    return s.join('');
  };
  return triple(digits[0], special === '4', 's') + triple(digits[1], special === '2', 's') + triple(digits[2], false, null);
}

function normalizePath(p) {
  const parts = [];
  for (const seg of p.split('/')) {
    if (!seg || seg === '.') continue;
    if (seg === '..') parts.pop();
    else parts.push(seg);
  }
  return '/' + parts.join('/');
}

function stripQuotes(s) {
  return s.replace(/^['"]|['"]$/g, '');
}

export function createShell(srcFs, startCwd = '/home/student') {
  let fs = clone(srcFs);
  let cwd = normalizePath(startCwd);
  const history = [];

  const walk = (path) => {
    if (path === '/') return fs;
    let node = fs;
    for (const part of path.split('/').filter(Boolean)) {
      if (!node || node.type !== 'dir') return null;
      node = node.children[part];
    }
    return node || null;
  };

  const abs = (p) => normalizePath(p === '~' ? '/home/' + USER : p.startsWith('/') ? p : cwd + '/' + p);

  const can = (node, what) => {
    const mode = String(node.mode).padStart(3, '0');
    const owner = node.owner || 'root';
    const ownerBits = Number(mode.slice(-3, -2));
    const otherBits = Number(mode.slice(-1));
    const bits = owner === USER ? ownerBits : otherBits;
    if (what === 'r') return bits >= 4;
    if (what === 'w') return (bits & 2) === 2;
    return (bits & 1) === 1;
  };

  const ok = (out = '') => ({ out, err: false });
  const fail = (out = '') => ({ out, err: true });

  function listDir(path, showAll, long) {
    const node = walk(path);
    if (!node) return fail(`ls: cannot access '${path}': No such file or directory`);
    if (node.type === 'file') return ok(path.split('/').pop());
    if (!can(node, 'r')) return fail(`ls: cannot open directory '${path}': Permission denied`);
    let names = Object.keys(node.children).sort();
    if (!showAll) names = names.filter((n) => !n.startsWith('.'));
    if (!names.length) return ok('');
    if (!long) return ok(names.join('  '));
    return ok(
      names
        .map((n) => {
          const child = node.children[n];
          const size = child.type === 'dir' ? 4096 : (child.content || '').length;
          const typeChar = child.type === 'dir' ? 'd' : '-';
          return `${typeChar}${modeBits(child.mode)} 1 ${child.owner || 'root'} ${child.owner || 'root'} ${String(size).padStart(5)} Nov  4 09:00 ${n}`;
        })
        .join('\n')
    );
  }

  function readFile(path) {
    const node = walk(abs(path));
    if (!node) return { error: `cat: ${path}: No such file or directory` };
    if (node.type === 'dir') return { error: `cat: ${path}: Is a directory` };
    if (!can(node, 'r')) return { error: `cat: ${path}: Permission denied` };
    return { text: node.content || '' };
  }

  /** Gather lines from either a file argument or stdin. */
  function linesFrom(target, stdin) {
    if (target) {
      const res = readFile(target);
      if (res.error) return { error: res.error };
      return { lines: res.text.split('\n'), name: target };
    }
    if (stdin != null) return { lines: String(stdin).split('\n'), name: null };
    return { error: 'missing input: give a file or pipe something in' };
  }

  const commands = {
    help: () => ok(HELP),
    clear: () => ({ out: '', err: false, clear: true }),
    pwd: () => ok(cwd),
    whoami: () => ok(USER),
    id: () => ok('uid=1001(student) gid=1001(student) groups=1001(student),27(sudo)'),
    date: () => ok(new Date().toString()),
    ps: () => ok(PROCS),
    echo: (args) => ok(args.join(' ')),
    man: (args) => ok(MAN[args[0]] || `No manual entry for ${args[0]}`),
    exit: () => ok('Leaving the lab. Refresh to start over.'),

    cd(args) {
      const target = args[0] || '/home/' + USER;
      const path = abs(target);
      const node = walk(path);
      if (!node) return fail(`cd: ${target}: No such file or directory`);
      if (node.type !== 'dir') return fail(`cd: ${target}: Not a directory`);
      if (!can(node, 'x')) return fail(`cd: ${target}: Permission denied`);
      cwd = path;
      return ok('');
    },

    ls(args) {
      let showAll = false, long = false;
      const paths = [];
      for (const a of args) {
        if (a.startsWith('-')) {
          if (a.includes('a')) showAll = true;
          if (a.includes('l')) long = true;
        } else paths.push(a);
      }
      const targets = paths.length ? paths : ['.'];
      const results = targets.map((p) => listDir(abs(p), showAll, long));
      const bad = results.find((r) => r.err);
      if (bad) return bad;
      return ok(results.map((r) => r.out).filter(Boolean).join('\n'));
    },

    cat(args, stdin) {
      const files = args.filter((a) => !a.startsWith('-'));
      if (!files.length) return stdin != null ? ok(String(stdin)) : fail('usage: cat <file>');
      const outs = [];
      for (const f of files) {
        const res = readFile(f);
        if (res.error) return fail(res.error);
        outs.push(res.text);
      }
      return ok(outs.join('\n'));
    },

    head(args, stdin) {
      return headTail(args, stdin, false);
    },

    tail(args, stdin) {
      return headTail(args, stdin, true);
    },

    grep(args, stdin) {
      let ignoreCase = false, recursive = false, count = false, lineNo = false;
      const words = [];
      for (const a of args) {
        if (a.startsWith('-') && a.length > 1 && !/^-\d/.test(a)) {
          if (a.includes('i')) ignoreCase = true;
          if (a.includes('r') || a.includes('R')) recursive = true;
          if (a.includes('c')) count = true;
          if (a.includes('n')) lineNo = true;
        } else words.push(stripQuotes(a));
      }
      if (!words.length) return fail('usage: grep [-i] [-r] [-c] [-n] <pattern> [path]');
      const pattern = words[0];
      const target = words[1];
      let re;
      try {
        re = new RegExp(pattern, ignoreCase ? 'i' : '');
      } catch {
        return fail('grep: invalid pattern');
      }

      if (!target) {
        if (stdin == null) return fail('usage: grep <pattern> <file>');
        const lines = String(stdin).split('\n');
        const hits = [];
        lines.forEach((line, i) => {
          if (re.test(line)) hits.push((lineNo ? i + 1 + ':' : '') + line);
        });
        if (count) return ok(String(hits.length));
        return ok(hits.join('\n'));
      }

      const node = walk(abs(target));
      if (!node) return fail(`grep: ${target}: No such file or directory`);
      const files = [];
      const collect = (n, p) => {
        if (n.type === 'file') files.push([p, n]);
        else if (recursive) for (const k of Object.keys(n.children)) collect(n.children[k], p.replace(/\/$/, '') + '/' + k);
      };
      if (node.type === 'dir' && !recursive) return fail(`grep: ${target}: Is a directory`);
      collect(node, target);

      const out = [];
      for (const [p, fileNode] of files) {
        if (!can(fileNode, 'r')) continue;
        let hits = 0;
        (fileNode.content || '').split('\n').forEach((line, i) => {
          if (re.test(line)) {
            hits++;
            if (!count) out.push((files.length > 1 ? p + ':' : '') + (lineNo ? i + 1 + ':' : '') + line);
          }
        });
        if (count && hits) out.push(files.length > 1 ? `${p}:${hits}` : String(hits));
      }
      return ok(out.join('\n'));
    },

    find(args) {
      let start = '.', name = null, type = null, perm = null;
      const rest = [];
      for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if (a === '-name') { name = stripQuotes(args[++i]); continue; }
        if (a === '-type') { type = args[++i]; continue; }
        if (a === '-perm') { perm = args[++i]; continue; }
        rest.push(a);
      }
      if (rest.length) start = rest[0];
      const rootPath = abs(start);
      const rootNode = walk(rootPath);
      if (!rootNode) return fail(`find: '${start}': No such file or directory`);

      const results = [];
      const visit = (node, path) => {
        const base = node === rootNode ? path.replace(/\/$/, '') : path;
        let nameOk = true;
        if (name) {
          const pattern = name.replace(/[.]/g, '\\.').replace(/\*/g, '.*');
          nameOk = new RegExp('^' + pattern + '$').test(path.split('/').pop() || '/');
        }
        const typeOk = !type || (type === 'f' ? node.type === 'file' : node.type === 'dir');
        let permOk = true;
        if (perm) {
          const want = parseInt(String(perm).replace(/^-/, ''), 8);
          permOk = (parseInt(String(node.mode).padStart(4, '0'), 8) & want) === want;
        }
        if (nameOk && typeOk && permOk) results.push(path || '/');
        if (node.type === 'dir' && can(node, 'r')) {
          for (const k of Object.keys(node.children)) visit(node.children[k], (base === '/' ? '' : base) + '/' + k);
        }
      };
      visit(rootNode, rootPath);
      return ok(results.join('\n'));
    },

    wc(args, stdin) {
      const file = args.filter((a) => !a.startsWith('-'))[0];
      const src = linesFrom(file, stdin);
      if (src.error) return fail(src.error);
      const n = src.lines.filter((l, i, arr) => !(i === arr.length - 1 && l === '')).length;
      return ok(file ? `${n} ${file}` : String(n));
    },

    sort(args, stdin) {
      const numeric = args.includes('-n');
      const reverse = args.includes('-r');
      const file = args.filter((a) => !a.startsWith('-'))[0];
      const src = linesFrom(file, stdin);
      if (src.error) return fail(src.error);
      const lines = src.lines.filter((l) => l !== '');
      lines.sort((a, b) => (numeric ? parseFloat(a) - parseFloat(b) : a.localeCompare(b)));
      if (reverse) lines.reverse();
      return ok(lines.join('\n'));
    },

    uniq(args, stdin) {
      const withCount = args.includes('-c');
      const file = args.filter((a) => !a.startsWith('-'))[0];
      const src = linesFrom(file, stdin);
      if (src.error) return fail(src.error);
      const lines = src.lines.filter((l) => l !== '');
      const out = [];
      let prev = null, n = 0;
      for (const line of lines) {
        if (line === prev) n++;
        else {
          if (prev !== null) out.push(withCount ? `${String(n).padStart(7)} ${prev}` : prev);
          prev = line;
          n = 1;
        }
      }
      if (prev !== null) out.push(withCount ? `${String(n).padStart(7)} ${prev}` : prev);
      return ok(out.join('\n'));
    },

    cut(args, stdin) {
      let delim = '\t', field = 1;
      const rest = [];
      for (let i = 0; i < args.length; i++) {
        if (args[i] === '-d') { delim = stripQuotes(args[++i]); continue; }
        if (args[i] === '-f') { field = Number(args[++i]) || 1; continue; }
        if (args[i].startsWith('-d') && args[i].length > 2) { delim = stripQuotes(args[i].slice(2)); continue; }
        if (args[i].startsWith('-f') && args[i].length > 2) { field = Number(args[i].slice(2)) || 1; continue; }
        rest.push(args[i]);
      }
      const src = linesFrom(rest[0], stdin);
      if (src.error) return fail(src.error);
      const out = src.lines.map((line) => {
        if (delim === ' ') {
          const parts = line.trim().split(/\s+/);
          return parts[field - 1] || '';
        }
        const parts = line.split(delim);
        return parts[field - 1] || '';
      });
      return ok(out.filter((l) => l !== '').join('\n'));
    },

    file(args) {
      const file = args[0];
      if (!file) return fail('usage: file <file>');
      const node = walk(abs(file));
      if (!node) return fail(`file: ${file}: cannot open`);
      if (node.type === 'dir') return ok(`${file}: directory`);
      const c = (node.content || '').slice(0, 40);
      let kind = 'ASCII text';
      if (c.startsWith('#!')) kind = 'POSIX shell script, executable';
      else if (/[\x00-\x08]/.test(c)) kind = 'data';
      if (String(node.mode) === '755' && !c.startsWith('#!')) kind += ', executable';
      return ok(`${file}: ${kind}`);
    },

    chmod(args) {
      if (args.length < 2) return fail('usage: chmod <mode> <file>');
      const [spec, file] = args;
      const node = walk(abs(file));
      if (!node) return fail(`chmod: cannot access '${file}': No such file or directory`);
      if ((node.owner || 'root') !== USER) return fail(`chmod: changing permissions of '${file}': Operation not permitted`);
      let mode;
      if (/^[0-7]{3,4}$/.test(spec)) mode = spec;
      else {
        const m = spec.match(/^([ugoa]*)([+-=])([rwx]+)$/);
        if (!m) return fail(`chmod: invalid mode: '${spec}'`);
        const digits = String(node.mode).padStart(3, '0').slice(-3).split('').map(Number);
        const add = m[3].split('').reduce((s, ch) => s + ({ r: 4, w: 2, x: 1 }[ch] || 0), 0);
        const who = m[1] || 'a';
        const apply = (i) => {
          if (m[2] === '+') digits[i] |= add;
          else if (m[2] === '-') digits[i] &= ~add;
          else digits[i] = add;
        };
        if (who.includes('a') || who.includes('u')) apply(0);
        if (who.includes('a') || who.includes('g')) apply(1);
        if (who.includes('a') || who.includes('o')) apply(2);
        mode = digits.join('');
      }
      node.mode = mode;
      return ok('');
    },

    chown: () => fail('chown: Operation not permitted (you are not root)'),

    su: () => fail('su: Authentication failure'),

    sudo(args) {
      if (!args.length) return fail('usage: sudo <command> | sudo -l');
      if (args[0] === '-l') {
        return ok(
          'Matching Defaults entries for student on web01:\n    env_reset, mail_badpass\n\nUser student may run the following commands on web01:\n    (root) NOPASSWD: /usr/bin/health-check\n'
        );
      }
      return fail(`Sorry, user student is not allowed to execute '${args.join(' ')}' as root on ${HOST}.`);
    }
  };

  function headTail(args, stdin, fromEnd) {
    let n = 10;
    const files = [];
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-n') n = Number(args[++i]) || 10;
      else if (!args[i].startsWith('-')) files.push(args[i]);
    }
    const src = linesFrom(files[0], stdin);
    if (src.error) return fail(src.error);
    return ok((fromEnd ? src.lines.slice(-n) : src.lines.slice(0, n)).join('\n'));
  }

  /** Split a command line into tokens, keeping quoted strings whole and treating | as a token. */
  function tokenize(line) {
    const tokens = [];
    let cur = '';
    let quote = null;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (quote) {
        if (ch === quote) quote = null;
        else cur += ch;
        continue;
      }
      if (ch === "'" || ch === '"') { quote = ch; continue; }
      if (ch === '|') {
        if (cur.trim()) tokens.push(cur.trim());
        cur = '';
        tokens.push('|');
        continue;
      }
      if (/\s/.test(ch)) {
        if (cur.trim()) tokens.push(cur.trim());
        cur = '';
        continue;
      }
      cur += ch;
    }
    if (cur.trim()) tokens.push(cur.trim());
    return tokens;
  }

  /** Run one pipeline segment, optionally consuming stdin text. */
  function runSegment(parts, stdin) {
    if (!parts.length) return { out: '', err: false };
    const cmd = parts[0];
    const args = parts.slice(1);
    const fn = commands[cmd];
    if (!fn) return fail(`${cmd}: command not found. Type help for what this lab supports.`);
    try {
      return fn(args, stdin);
    } catch (e) {
      return fail(`${cmd}: ${e.message}`);
    }
  }

  function run(raw) {
    const line = raw.trim();
    if (!line) return { out: '', err: false };
    history.push(line);
    const tokens = tokenize(line);
    const segments = [[]];
    for (const t of tokens) {
      if (t === '|') segments.push([]);
      else segments[segments.length - 1].push(t);
    }
    let out = '';
    let err = false;
    let clear = false;
    let stdin = null;
    for (const segment of segments) {
      const res = runSegment(segment, stdin);
      out = res.out;
      err = res.err;
      clear = Boolean(res.clear);
      if (err) break;
      stdin = res.out;
    }
    return { out, err, clear };
  }

  return {
    run,
    prompt: () => `${USER}@${HOST}:${cwd}$`,
    cwd: () => cwd,
    history: () => history.slice(),
    reset() {
      fs = clone(srcFs);
      cwd = normalizePath(startCwd);
      history.length = 0;
    }
  };
}
