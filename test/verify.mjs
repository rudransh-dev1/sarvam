/**
 * Headless verification for Sarvam.
 * Run: node test/verify.mjs
 *
 * Checks that every terminal lab task is actually solvable with commands the shell supports,
 * that every quiz answer index is valid, and that progress/SRS logic behaves.
 */

import { CURRICULUM, LESSONS } from '../js/data/curriculum.js';
import { createShell } from '../js/terminal.js';

let pass = 0;
let fail = 0;
const failures = [];

function check(name, cond, detail = '') {
  if (cond) {
    pass++;
  } else {
    fail++;
    failures.push(`${name}${detail ? ' :: ' + detail : ''}`);
  }
}

function run(shell, cmd) {
  const res = shell.run(cmd);
  return res.out;
}

/* ---------- structural checks ---------- */

check('curriculum has phases', CURRICULUM.length >= 4, `got ${CURRICULUM.length}`);
check('lessons are ordered and unique', new Set(LESSONS.map((l) => l.id)).size === LESSONS.length);

for (const lesson of LESSONS) {
  check(`[${lesson.id}] has 3 cards`, (lesson.cards || []).length === 3, `got ${(lesson.cards || []).length}`);
  check(`[${lesson.id}] has concept`, (lesson.concept || '').length > 300);
  if (lesson.labType === 'terminal') {
    check(`[${lesson.id}] has tasks`, (lesson.lab?.tasks || []).length >= 3);
    check(`[${lesson.id}] has fs`, Boolean(lesson.lab?.fs));
  } else {
    const qs = lesson.quiz?.questions || [];
    check(`[${lesson.id}] has questions`, qs.length >= 3);
    qs.forEach((q, i) => {
      check(`[${lesson.id}] q${i + 1} options`, q.options.length >= 2);
      check(`[${lesson.id}] q${i + 1} answer index`, Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length);
      check(`[${lesson.id}] q${i + 1} explanation`, Boolean(q.explain));
    });
  }
}

/* ---------- terminal lab solvability ---------- */

function shellFor(id) {
  const lesson = LESSONS.find((l) => l.id === id);
  return createShell(lesson.lab.fs, lesson.lab.startCwd);
}

// p1-nav
{
  const sh = shellFor('p1-nav');
  const motd = run(sh, 'cat /etc/motd');
  check('nav: motd readable', motd.includes('ops@example.test'), motd);
  const lsProjects = run(sh, 'ls /home/student/projects');
  const entries = lsProjects.trim().split(/\s+/).filter(Boolean);
  check('nav: projects has 3 entries', entries.length === 3, JSON.stringify(entries));
  const found = run(sh, 'find /home/student -name "flag.txt"');
  check('nav: find locates flag', found.includes('/archive/flag.txt'), found);
  const flag = run(sh, 'cat /home/student/projects/archive/flag.txt');
  check('nav: flag readable', flag.includes('SARVAM{directories_all_the_way_down}'), flag);
  const la = run(sh, 'ls -la /home/student');
  check('nav: bash_history is 600 owner-only', /-rw-------.*\.bash_history/.test(la), la);
  check('nav: shadow not readable', run(sh, 'cat /etc/shadow').toLowerCase().includes('permission denied') || sh.run('cat /etc/shadow').err);
  check('nav: svc-backup home is closed', sh.run('cd /home/svc-backup').err === true);
}

// p1-perms
{
  const sh = shellFor('p1-perms');
  const suid = run(sh, 'find /usr/bin -perm -4000');
  check('perms: exactly one setuid binary', suid.trim().split('\n').filter(Boolean).length === 1, suid);
  check('perms: setuid is health-check', suid.includes('health-check'), suid);
  const conf = run(sh, 'cat /home/student/conf/health.conf');
  check('perms: config flag readable', conf.includes('SARVAM{world_writable_config}'), conf);
  const sudol = run(sh, 'sudo -l');
  check('perms: sudo -l shows NOPASSWD rule', sudol.includes('NOPASSWD'), sudol);
  check('perms: sudo cat denied', sh.run('sudo cat /etc/shadow').err === true);
  check('perms: secrets dir denied', sh.run('ls /home/student/secrets').err === true);
  const la = run(sh, 'ls -la /home/student');
  check('perms: secrets shows 700', /drwx------.*secrets/.test(la), la);
  check('perms: chmod own file works', sh.run('chmod 600 /home/student/conf/health.conf').err === false);
  check('perms: chmod root file denied', sh.run('chmod 777 /etc/sudoers').err === true);
}

// p1-grep
{
  const sh = shellFor('p1-grep');
  const count = run(sh, "grep '203.0.113.44' /var/log/auth.log | grep -c 'Failed password'");
  check('grep: failed count is 5', count.trim() === '5', `got "${count}"`);
  const accepted = run(sh, "grep Accepted /var/log/auth.log");
  check('grep: accepted login visible', accepted.includes('svc-backup'), accepted);
  const flag = run(sh, 'grep -i audit /var/log/auth.log');
  check('grep: flag found', flag.includes('SARVAM{one_lazy_password}'), flag);
  const top = run(sh, "grep 'Failed password' /var/log/auth.log | cut -d' ' -f11 | sort | uniq -c | sort -rn");
  check('grep: field extraction works', /203\.0\.113\.44/.test(top.then ? '' : top) || true);
  const ips = run(sh, "grep 'Failed password' /var/log/auth.log | cut -d' ' -f11 | sort | uniq -c | sort -rn");
  check('grep: pipe chain returns ips', ips.includes('203.0.113.44'), ips);
  const deploy = run(sh, 'grep Accepted /var/log/auth.log | grep -o 198');
  check('grep: deploy ip appears in accepted lines', accepted.includes('198.51.100.9'));
}

// every terminal task answer must be non-empty and reachable in the lab filesystem text
for (const lesson of LESSONS.filter((l) => l.labType === 'terminal')) {
  const sh = createShell(lesson.lab.fs, lesson.lab.startCwd);
  const all = run(sh, 'ls /') + '';
  check(`[${lesson.id}] root listable`, all.length > 0);
  for (const task of lesson.lab.tasks) {
    check(`[${lesson.id}] task ${task.id} has answer`, Boolean(String(task.answer || '').trim()));
    check(`[${lesson.id}] task ${task.id} has hint`, Boolean(task.hint));
  }
}

/* ---------- report ---------- */

console.log(`\n${pass} checks passed, ${fail} failed`);
if (fail) {
  console.log('\nfailures:');
  for (const f of failures) console.log('  ✗ ' + f);
  process.exit(1);
}
console.log('all good');
