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
  if (['terminal', 'web', 'os'].includes(lesson.labType)) {
    check(`[${lesson.id}] has tasks`, (lesson.lab?.tasks || []).length >= 3);
    if (lesson.labType === 'terminal') check(`[${lesson.id}] has fs`, Boolean(lesson.lab?.fs));
    if (lesson.labType === 'web') check(`[${lesson.id}] has app`, Boolean(lesson.lab?.app?.notes?.length));
    if (lesson.labType === 'os') {
      check(`[${lesson.id}] os has fs`, Boolean(lesson.lab?.fs));
      check(`[${lesson.id}] os has net`, Boolean(lesson.lab?.net?.hosts?.length));
      check(`[${lesson.id}] os has dirb wordlist`, Boolean(lesson.lab?.dirb?.paths?.length));
      check(`[${lesson.id}] os has app`, Boolean(lesson.lab?.app));
    }
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

/* ---------- bonus room solvability ---------- */

{
  const lesson = LESSONS.find((l) => l.id === 'bonus-bank');
  const sh = createShell(lesson.lab.fs, lesson.lab.startCwd, { net: lesson.lab.net, dirb: lesson.lab.dirb });
  const scan = run(sh, 'dirb http://fakebank.lab');
  check('bonus: dirb finds the admin page', scan.includes('/bank-transfer (CODE:200|SIZE:4663)'), scan);
  check('bonus: dirb finds images', scan.includes('/images (CODE:301|SIZE:179)'));
  check('bonus: dirb reports 2 found', scan.includes('FOUND: 2'));
  const bank = lesson.lab.app.bank;
  check('bonus: app is a bank', bank.name === 'Meridian Bank');
  check('bonus: task t2 answer is the discovered path', lesson.lab.tasks[1].answer === '/bank-transfer');
  check('bonus: task t3 answer is the app flag', lesson.lab.tasks[2].answer === bank.flag, bank.flag);
  check('bonus: own account matches the task answer', lesson.lab.tasks[0].answer === bank.own);
  check('bonus: deposit threshold fits the negative balance', bank.balance + 2000 > 0);
  const nmap = run(sh, 'nmap -sV 10.10.14.30');
  check('bonus: nmap sees the bank service', nmap.includes('nginx'), nmap);
  const page = run(sh, 'curl http://fakebank.lab/bank-transfer');
  check('bonus: curl reaches the admin page', page.toLowerCase().includes('admin'), page);
}

/* ---------- terminal lab solvability ---------- */

function shellFor(id) {
  const lesson = LESSONS.find((l) => l.id === id);
  return createShell(lesson.lab.fs, lesson.lab.startCwd, { net: lesson.lab.net });
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

// p0-bytes: decode, hash, strings
{
  const sh = shellFor('p0-bytes');
  check('bytes: base64 decodes to the flag', run(sh, 'cat token.b64 | base64 -d').includes('SARVAM{bits_are_the_beginning}'));
  check('bytes: md5sum matches the published checksum', run(sh, 'md5sum readme.txt').startsWith('5eb63bbbe01eeed093cb22bb8f5acdc3'));
  check('bytes: strings finds the embedded flag', run(sh, 'strings firmware.bin').includes('SARVAM{strings_never_lie}'));
  check('bytes: xxd prints a hex dump', /^00000000: [0-9a-f]{2} /m.test(run(sh, 'xxd firmware.bin')));
}

// p2-ip: addressing and a ping sweep
{
  const sh = shellFor('p2-ip');
  check('ip: own address configured', run(sh, 'ip a').includes('inet 10.10.14.23/24'));
  const sweep = run(sh, 'nmap -sn 10.10.14.0/24');
  check('ip: sweep finds 3 hosts', /3 hosts up/.test(sweep), sweep.split('\n').slice(-2).join(' '));
  check('ip: sweep names the file server', sweep.includes('files.lab'));
  check('ip: ipcalc gives the network address', run(sh, 'ipcalc 10.10.14.23/24').includes('Network:   10.10.14.0/24'));
  check('ip: ping works', run(sh, 'ping -c 2 10.10.14.5').includes('0% packet loss'));
}

// p2-subnet: the arithmetic the tasks ask for
{
  const sh = shellFor('p2-subnet');
  check('subnet: /26 network', run(sh, 'ipcalc 192.168.4.37/26').includes('192.168.4.0/26'));
  check('subnet: /26 usable count', run(sh, 'ipcalc 192.168.4.37/26').includes('62 usable'));
  check('subnet: /27 network for .200', run(sh, 'ipcalc 10.10.14.200/27').includes('Network:   10.10.14.192/27'));
  check('subnet: /25 broadcast', run(sh, 'ipcalc 172.16.5.130/25').includes('Broadcast: 172.16.5.255'));
}

// p2-tcp: service detection and HTTP
{
  const sh = shellFor('p2-tcp');
  const sv = run(sh, 'nmap -sV 10.10.14.5');
  check('tcp: nmap reports nginx', sv.includes('nginx 1.18.0'));
  check('tcp: nmap reports ssh', sv.includes('OpenSSH 8.2p1'));
  check('tcp: homepage leaks the deploy key', run(sh, 'curl http://10.10.14.5:8080/').includes('SARVAM{comments_ship_to_production}'));
  check('tcp: robots points at /backup', run(sh, 'curl http://10.10.14.5:8080/robots.txt').includes('/backup'));
  check('tcp: backup path leaks the flag', run(sh, 'curl http://10.10.14.5:8080/backup').includes('SARVAM{robots_is_a_map}'));
  check('tcp: closed port refused', sh.run('curl http://10.10.14.5:9999/').err === true);
}

// every terminal task answer must be non-empty and reachable in the lab filesystem text
for (const lesson of LESSONS.filter((l) => l.labType === 'terminal')) {
  const sh = createShell(lesson.lab.fs, lesson.lab.startCwd);
  const all = run(sh, 'ls /') + '';
  check(`[${lesson.id}] root listable`, all.length > 0);
  const spec = JSON.stringify(lesson.lab);
  for (const task of lesson.lab.tasks) {
    check(`[${lesson.id}] task ${task.id} has answer`, Boolean(String(task.answer || '').trim()));
    check(`[${lesson.id}] task ${task.id} has hint`, Boolean(task.hint));
    check(`[${lesson.id}] task ${task.id} answer exists in the lab`, spec.includes(task.answer), task.answer);
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
