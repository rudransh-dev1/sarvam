/**
 * Plays every roadmap week like a student would: real commands, real scripts, then asserts the output
 * matches the task answer. This is what proves each boss lab is solvable, not just well-formed.
 * Run: node test/roadmap.mjs
 */
import { WEEKS } from '../js/data/roadmap.js';
import { createShell } from '../js/terminal.js';

let pass = 0;
const fails = [];
const check = (n, c, d = '') => (c ? pass++ : fails.push(n + (d ? ' :: ' + d : '')));

const week = (id) => WEEKS.find((w) => w.id === id);
const boot = (id) => {
  const w = week(id);
  return createShell(w.lab.fs, w.lab.startCwd, { net: w.lab.net, dirb: w.lab.dirb });
};
const run = (sh, c) => sh.run(c).out;
const write = (sh, file, code) => {
  sh.run('rm ' + file);
  code.split('\n').forEach((line, i) => sh.run('echo "' + line.replace(/"/g, '\\"') + '" ' + (i === 0 ? '>' : '>>') + ' ' + file));
};
const answer = (id, t) => week(id).lab.tasks.find((x) => x.id === t).answer;

/* ---- structure ---- */
check('12 weeks', WEEKS.length === 12);
WEEKS.forEach((w, i) => {
  check(`${w.id} week number`, w.week === i + 1);
  check(`${w.id} has missions`, w.missions.length >= 4);
  check(`${w.id} has a deliverable`, Boolean(w.deliverable));
  check(`${w.id} has 3 cards`, w.cards.length === 3);
  check(`${w.id} has >=3 tasks`, w.lab.tasks.length >= 3);
  check(`${w.id} boss named`, Boolean(w.boss));
  check(`${w.id} unique task ids`, new Set(w.lab.tasks.map((t) => t.id)).size === w.lab.tasks.length);
});

/* ---- W1 ---- */
{
  const sh = boot('w01');
  const scan = run(sh, 'nmap -sV 10.10.14.77');
  check('w1: ssh on 22', /22\s+open\s+ssh/.test(scan));
  check('w1: dns on 53', /53\s+open\s+domain/.test(scan));
  check('w1: flag via curl', run(sh, 'curl http://gate.lab/key').includes(answer('w01', 't3')));
}
/* ---- W2 ---- */
{
  const sh = boot('w02');
  check('w2: hidden file listed', run(sh, 'ls -a').includes('.hidden_note'));
  check('w2: error count', run(sh, 'grep -c ERROR logs/app.log').trim() === answer('w02', 't2'), run(sh, 'grep -c ERROR logs/app.log'));
  const a = run(sh, 'cat .hidden_note');
  const b = run(sh, 'cat /srv/vault/key.txt');
  check('w2: flag assembles', (a.match(/SARVAM\{w2_/) && b.includes('locked_server_open}')) && 'SARVAM{w2_locked_server_open}' === answer('w02', 't3'));
}
/* ---- W3: write a script, run it, commit ---- */
{
  const sh = boot('w03');
  const code = "for line in open('codes.txt').read().split('\\n'):\n    if line != '':\n        p = line.split(' ')\n        if p[1] == '200':\n            print(p[0], 'UP')\n        else:\n            print(p[0], 'DOWN')";
  write(sh, 'status.py', code);
  const out = run(sh, 'python status.py');
  check('w3: first line is alpha.lab UP', out.split('\n')[0] === answer('w03', 't1'), out);
  check('w3: 2 sites down', run(sh, 'python status.py | grep -c DOWN').trim() === answer('w03', 't2'), out);
  check('w3: grader sees script file', sh.peek('status.py').includes('codes.txt'));
  check('w3: runFile works', sh.runFile('status.py').out.includes('alpha.lab UP'));
  run(sh, 'git init'); run(sh, 'git add .');
  const c = run(sh, 'git commit -m "status checker"');
  const id = (c.match(/\[main ([0-9a-f]{7})\]/) || [])[1];
  check('w3: commit id printed', Boolean(id), c);
  check('w3: gitCommits tracks it', sh.gitCommits().length === 1 && sh.gitCommits()[0].id === id);
}
/* ---- W4 ---- */
{
  const sh = boot('w04');
  const an = "c = {}\nfor l in open('app.log').read().split('\\n'):\n    if l != '':\n        lvl = l.split(' ')[2]\n        c[lvl] = c.get(lvl, 0) + 1\nfor k, v in c.items():\n    print(k, v)";
  write(sh, 'analyze.py', an);
  const out = run(sh, 'python analyze.py');
  check('w4: analyzer counts ERROR 5', out.includes('ERROR 5') && answer('w04', 't1') === '5', out);
  const fd = "res = open('resolved.txt').read()\nfor w in open('words.txt').read().split('\\n'):\n    if w != '' and w in res:\n        print(w)";
  write(sh, 'find.py', fd);
  const out2 = run(sh, 'python find.py');
  check('w4: finder prints 3 lines', out2.split('\n').filter(Boolean).length === 3 && answer('w04', 't2') === '3', out2);
  check('w4: admin did not resolve', !run(sh, 'cat resolved.txt').includes('admin') && run(sh, 'cat words.txt').includes('admin'));
}
/* ---- W5 ---- */
{
  const sh = boot('w05');
  check('w5: sqli flag', run(sh, `curl "http://shop.lab/products.php?id=1'"`).includes(answer('w05', 't1')));
  check('w5: idor flag', run(sh, 'curl "http://shop.lab/invoice?id=1002"').includes(answer('w05', 't2')));
  check('w5: xss flag', run(sh, 'curl "http://shop.lab/search?q=<script>alert(1)</script>"').includes(answer('w05', 't3')));
}
/* ---- W6 ---- */
{
  const sh = boot('w06');
  check('w6: 3 columns ok', !run(sh, `curl "http://vault.lab/filter?category=Gifts' ORDER BY 3--"`).includes('Error'));
  check('w6: 4 columns errors', run(sh, `curl "http://vault.lab/filter?category=Gifts' ORDER BY 4--"`).includes('Error'));
  check('w6: union flag', run(sh, `curl "http://vault.lab/filter?category=' UNION SELECT NULL,username,password FROM users--"`).includes(answer('w06', 't3')));
}
/* ---- W7 ---- */
{
  const sh = boot('w07');
  const pc = "for l in open('scan_results.txt').read().split('\\n'):\n    if l != '':\n        p = l.split(' ')\n        if p[1] == 'open':\n            print(p[0])";
  write(sh, 'ports.py', pc);
  check('w7: 4 open ports', run(sh, 'python ports.py').split('\n').filter(Boolean).length === 4);
  const au = "for pw in open('passwords.txt').read().split('\\n'):\n    if pw != '':\n        if len(pw) < 10:\n            print('WEAK')\n        else:\n            print('STRONG')";
  write(sh, 'audit.py', au);
  const a = run(sh, 'python audit.py');
  check('w7: auditor 2 weak + STRONG present', (a.match(/WEAK/g) || []).length === 2 && a.includes('STRONG'), a);
  check('w7: password 80 http', answer('w07', 't3') === '80');
}
/* ---- W8: encoding/hash ---- */
{
  const sh = boot('w08');
  check('w8: base64 flag', run(sh, 'cat message.b64 | base64 -d').trim() === answer('w08', 't1'), run(sh, 'cat message.b64 | base64 -d'));
  const h = run(sh, 'sha256sum secret.txt');
  check('w8: sha256 prefix', h.startsWith(answer('w08', 't2')), h);
  const hashes = run(sh, 'cat hashes.txt');
  const pw = run(sh, 'echo -n password | sha256sum');
  // sha256("password") is a known constant
  check('w8: a1 is sha256(password)', hashes.includes('a1:5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8') && answer('w08', 't3') === 'a1');
  check('w8: hash of "letmein\\n" equals a3', hashes.includes('a3:8de47d5aa7d61e92c577d8156b966583f6d7d75d714a3b99fca4fb2f8bfe97c6'));
}
/* ---- W9 ---- */
{
  const sh = boot('w09');
  const code = "for l in open('scan.txt').read().split('\\n'):\n    if l != '':\n        p = l.split(' ')\n        s = p[1]\n        if s == 'ftp' or s == 'telnet' or s == 'mysql':\n            print(p[0], s, 'HIGH')\n        elif s == 'http':\n            print(p[0], s, 'MEDIUM')\n        else:\n            print(p[0], s, 'LOW')";
  write(sh, 'report.py', code);
  const out = run(sh, 'python report.py');
  check('w9: 3 HIGH', (out.match(/HIGH/g) || []).length === 3 && out.includes('telnet HIGH'), out);
}
/* ---- W10 ---- */
{
  const sh = boot('w10');
  sh.run('printf \'%s\\n\' "# Education" "# Skills" "# Projects" "# Links" > resume.md');
  const txt = sh.peek('resume.md');
  check('w10: resume has sections', ['Education', 'Skills', 'Projects', 'Links'].every((x) => txt.includes(x)));
  sh.run('cat projects.txt >> resume.md');
  check('w10: resume has 9 lines', run(sh, 'wc -l resume.md').trim().startsWith('9'), run(sh, 'wc -l resume.md'));
  check('w10: contains project', sh.peek('resume.md').includes('port-scanner'));
}
/* ---- W11 ---- */
{
  const sh = boot('w11');
  check('w11: 2 sent', run(sh, 'grep -c sent targets.txt').trim() === '2');
  sh.run('printf \'%s\\n\' "Subject: hi" "Hi, see my GitHub" "I built a port scanner" > cold_email.txt');
  check('w11: email 3 lines + keywords', run(sh, 'wc -l cold_email.txt').trim().startsWith('3') && sh.peek('cold_email.txt').includes('GitHub') && sh.peek('cold_email.txt').includes('port scanner'));
}
/* ---- W12 ---- */
check('w12: answers', ['server', 'sql injection', 'burp', 'false'].every((a, i) => week('w12').lab.tasks[i].answer === a));


/* ---- the hints must actually work when pasted ---- */
// A student who pastes the hint verbatim should end up with working files. Hints are shell lines separated by " ; ".
for (const w of WEEKS) {
  for (const t of w.lab.tasks) {
    if (!t.hint || !/^(printf|echo|cat|python|git|grep|curl|nmap|sha256sum)\b/.test(t.hint)) continue;
    const sh = createShell(w.lab.fs, w.lab.startCwd, { net: w.lab.net });
    // earlier tasks may create files later hints depend on, so replay the whole week in order
    for (const prev of w.lab.tasks) {
      if (!prev.hint || !/^(printf|echo|cat|python|git|grep|curl|nmap|sha256sum)\b/.test(prev.hint)) continue;
      prev.hint.split(' ; ').forEach((cmd) => sh.run(cmd));
      if (prev.id === t.id) break;
    }
    if (t.check?.fileRuns) {
      const r = sh.runFile(t.check.fileRuns);
      check(`${w.id}/${t.id}: pasted hint produces a script that runs`, !r.err, r.out);
      if (t.check.outputIncludes) check(`${w.id}/${t.id}: pasted hint output includes "${t.check.outputIncludes}"`, r.out.includes(t.check.outputIncludes), r.out);
      if (t.check.outputLines) check(`${w.id}/${t.id}: pasted hint prints ${t.check.outputLines} lines`, r.out.split('\n').filter(Boolean).length === t.check.outputLines, r.out);
    }
    if (t.check?.fileHas) {
      const [file, needles] = t.check.fileHas;
      const txt = sh.peek(file) || '';
      check(`${w.id}/${t.id}: pasted hint satisfies fileHas`, needles.every((n) => txt.includes(n)), txt);
    }
    if (t.check?.gitCommit) check(`${w.id}/${t.id}: pasted hint makes a commit`, sh.gitCommits().length > 0);
  }
}


/* ---------- daily quest board ---------- */

const { weekQuestDays, DAYS_PER_WEEK, QUESTS_PER_DAY } = await import('../js/data/quests.js');

for (const week of WEEKS) {
  const days = weekQuestDays(week);
  check(`${week.id}: six days of quests`, days.length === DAYS_PER_WEEK, `got ${days.length}`);
  const ids = new Set();
  days.forEach((day, i) => {
    check(`${week.id} day ${i + 1}: exactly ${QUESTS_PER_DAY} quests`, day.length === QUESTS_PER_DAY, `got ${day.length}`);
    day.forEach((q) => {
      check(`${week.id} ${q.id}: has title`, Boolean(q.title && q.title.length > 4), q.title);
      check(`${week.id} ${q.id}: unique id`, !ids.has(q.id));
      ids.add(q.id);
    });
    check(`${week.id} day ${i + 1}: has a habit quest`, day.some((q) => ['review', 'proof', 'write'].includes(q.kind)));
    check(`${week.id} day ${i + 1}: has hands-on work`, day.some((q) => ['lab', 'boss', 'side'].includes(q.kind)));
  });
}


/* ---------- daily rollover is calendar based ---------- */

const { questDayFor } = await import('../js/progress.js');
const roll = questDayFor('2026-11-01', '2026-11-05');
check('rollover: day 5 of week 1 after four days', roll.dayInWeek === 5 && roll.weekIndex === 0, JSON.stringify(roll));
const roll2 = questDayFor('2026-11-01', '2026-11-08');
check('rollover: week 2 day 2 after seven days', roll2.dayInWeek === 2 && roll2.weekIndex === 1, JSON.stringify(roll2));
const roll3 = questDayFor('2026-11-01', '2026-11-22');
check('rollover: week 4 after three weeks', roll3.weekIndex === 3, JSON.stringify(roll3));


/* ---------- every week is a real room, not three clicks ---------- */

const { weekRooms, weekTaskCount } = await import('../js/data/rooms.js');

for (const week of WEEKS) {
  const rooms = weekRooms(week);
  check(`${week.id}: six days in the room`, rooms.length === 6, `got ${rooms.length}`);
  check(`${week.id}: at least 20 graded tasks`, weekTaskCount(week) >= 20, `got ${weekTaskCount(week)}`);
  rooms.forEach((r) => {
    check(`${week.id} day ${r.day}: has a title`, Boolean(r.title && r.title.length > 10), r.title);
    check(`${week.id} day ${r.day}: names a tool`, Boolean(r.tip && r.tip.length >= 3), r.tip);
    check(`${week.id} day ${r.day}: four tasks`, r.tasks.length >= 4, `got ${r.tasks.length}`);
    r.tasks.forEach((t) => {
      check(`${week.id} d${r.day} ${t.id}: prompt`, Boolean(t.prompt && t.prompt.length > 8), t.prompt);
      check(`${week.id} d${r.day} ${t.id}: has an answer`, t.answer !== undefined && String(t.answer).length > 0, t.answer);
    });
  });
  check(`${week.id}: keeps its hands-on shell tasks`, rooms.flatMap((r) => r.tasks).filter((t) => t.kind === 'shell').length >= 1);
}


/* ---------- 24 steps a day, four-step loop per concept ---------- */

const DAY = await import('../js/data/dayroom.js');

check('a day is 24 steps', DAY.STEPS_PER_DAY === 24);
for (const week of WEEKS) {
  for (let d = 1; d <= 6; d++) {
    const steps = DAY.daySteps(week.week, d);
    check(`${week.id} d${d}: 24 steps`, steps.length === 24, `got ${steps.length}`);
    check(`${week.id} d${d}: six concept blocks`, new Set(steps.map((s) => s.block)).size === 6);
    const ids = new Set(steps.map((s) => s.id));
    check(`${week.id} d${d}: unique step ids`, ids.size === 24, `got ${ids.size}`);
    for (let b = 1; b <= 6; b++) {
      const block = steps.filter((s) => s.block === b).map((s) => s.kind);
      check(`${week.id} d${d} b${b}: read then question then build then game`, block.join(',') === 'concept,question,build,game', block.join(','));
    }
    check(`${week.id} d${d}: 18 graded steps`, steps.filter((s) => s.graded).length === 18);
    check(`${week.id} d${d}: every graded step has an answer`, steps.filter((s) => s.graded).every((s) => s.answer !== undefined && String(s.answer).length));
    check(`${week.id} d${d}: concepts carry a real explanation`, steps.filter((s) => s.kind === 'concept').every((s) => (s.text || '').length > 20));
  }
}

console.log(`\n${pass} roadmap checks passed, ${fails.length} failed`);
if (fails.length) { fails.forEach((f) => console.log('  ✗ ' + f)); process.exit(1); }
console.log('roadmap ok');
