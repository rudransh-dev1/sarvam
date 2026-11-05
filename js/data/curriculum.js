import { ADVANCED_PHASES } from './advanced.js';

/**
 * Sarvam curriculum.
 * Everything the app renders comes from here. Add a lesson object and it appears in the map,
 * gets gated automatically by order, and its cards join the review queue.
 *
 * Lesson shape:
 *  id, title, sub, minutes, labType: 'terminal' | 'web' | 'quiz'
 *  concept: HTML string
 *  quiz:   { questions: [{ q, options: [], answer: <index>, explain }] }   (labType 'quiz')
 *  lab:    { startCwd, intro, fs, net, tasks: [{ id, prompt, hint, answer }] }  (labType 'terminal')
 *  lab:    { intro, app: {...}, tasks: [...] }                                   (labType 'web')
 *  cards:  [{ front, back }]   -> three per lesson is the house rule
 */

const d = (mode, children) => ({ type: 'dir', mode, owner: 'root', children });
const f = (mode, content, owner = 'root') => ({ type: 'file', mode, owner, content });

const AUTHLOG = [
  'Nov  4 02:14:07 web01 sshd[2211]: Failed password for invalid user admin from 203.0.113.44 port 51884 ssh2',
  'Nov  4 02:14:09 web01 sshd[2213]: Failed password for invalid user oracle from 203.0.113.44 port 51902 ssh2',
  'Nov  4 02:14:11 web01 sshd[2215]: Failed password for invalid user test from 203.0.113.44 port 51930 ssh2',
  'Nov  4 02:14:14 web01 sshd[2217]: Failed password for invalid user pi from 203.0.113.44 port 51961 ssh2',
  'Nov  4 02:14:17 web01 sshd[2219]: Failed password for invalid user ubuntu from 203.0.113.44 port 51988 ssh2',
  'Nov  4 02:14:21 web01 sshd[2221]: Accepted password for svc-backup from 203.0.113.44 port 52014 ssh2',
  'Nov  4 02:14:22 web01 sshd[2221]: pam_unix(sshd:session): session opened for user svc-backup by (uid=0)',
  'Nov  4 02:14:23 web01 sudo: svc-backup : TTY=pts/1 ; PWD=/home/svc-backup ; USER=root ; COMMAND=/bin/bash',
  'Nov  4 02:14:31 web01 sshd[2221]: Received disconnect from 203.0.113.44 port 52014:11: disconnected by user',
  'Nov  4 09:02:11 web01 sshd[3310]: Accepted publickey for deploy from 198.51.100.9 port 44210 ssh2',
  'Nov  4 09:40:55 web01 sshd[3488]: Failed password for root from 198.51.100.9 port 44990 ssh2',
  'Nov  4 11:15:02 web01 sshd[4021]: Accepted publickey for deploy from 198.51.100.9 port 50122 ssh2',
  'Nov  4 13:22:44 web01 CRON[4550]: pam_unix(cron:session): session opened for user root by (uid=0)',
  'Nov  4 14:03:18 web01 sshd[5122]: Failed password for invalid user ftp from 45.155.205.233 port 60122 ssh2',
  'Nov  4 14:03:25 web01 sshd[5124]: Failed password for invalid user ftp from 45.155.205.233 port 60124 ssh2',
  'Nov  4 14:03:29 web01 sshd[5126]: Connection closed by 45.155.205.233 port 60126 [preauth]',
  'Nov  4 16:44:02 web01 sshd[6001]: Accepted publickey for deploy from 198.51.100.9 port 52011 ssh2',
  'Nov  4 18:09:19 web01 backup-agent: rotation complete, 3 archives written to /var/backups',
  'Nov  4 18:09:20 web01 audit: untracked login window recorded SARVAM{one_lazy_password}',
  'Nov  4 23:58:41 web01 sshd[6402]: Connection closed by 45.155.205.233 port 61120 [preauth]'
].join('\n');

const BASE_PHASES = [
  {
    id: 'bonus',
    num: '00',
    title: 'Your first hack',
    meta: '25 minutes · always open, no prerequisites',
    bonus: true,
    lessons: [
      {
        id: 'bonus-bank',
        bonus: true,
        title: 'Hack the fake bank',
        sub: 'dirb, a hidden admin page, and a green flag',
        minutes: 25,
        labType: 'os',
        concept: `
<h2>What you are about to do</h2>
<p>You get a small Linux box with a bank application in the browser. The bank has a staff page that
registers deposits. Nobody linked to it, which is exactly why it is still there. Your job is to find
it by brute-forcing common file and directory names, then use it.</p>

<h3>The tool: content discovery</h3>
<p><code>dirb</code> (or gobuster, feroxbuster) takes a URL and a wordlist and asks the server for
thousands of likely paths. Anything that answers with a real status code is a page that exists.
Lines starting with <code>+</code> are hits.</p>
<pre><code>dirb http://fakebank.lab</code></pre>
<p>The output shows <code>CODE:200</code> for a normal page, <code>301</code> for a redirect to a
directory, <code>403</code> for "exists but forbidden". All three tell you something is there.</p>

<h3>Why this is a real bug class, not a game</h3>
<p>Hidden pages are a broken access control problem: the developer assumed nobody would guess the
URL, so the page has no authentication. In the OWASP Top 10 this sits at number one. Real
engagements still find admin panels at <code>/admin</code>, backups at <code>/backup.zip</code>,
and monitoring at <code>/server-status</code>.</p>

<h3>Your moves</h3>
<ol>
  <li>In the terminal, scan the bank: <code>dirb http://fakebank.lab</code></li>
  <li>In the browser, open the page the scan found.</li>
  <li>That page lets anyone deposit money. Send $2000 to account 8881, which is you.</li>
  <li>The bank home page then shows a green flag. Paste it below.</li>
</ol>
<p class="muted">Legal note: only ever do this against systems you own or have written permission to
test. This lab is simulated, so nothing here touches a real bank.</p>`,
        lab: {
          kind: 'os',
          intro: 'Two windows: a terminal and a browser. Start with dirb against http://fakebank.lab',
          startCwd: '/home/student',
          fs: d('755', {
            home: d('755', {
              student: d(
                '755',
                {
                  'notes.txt': f('644', 'target: http://fakebank.lab\nwordlist: /usr/share/dirb/wordlists/common.txt\n', 'student')
                },
                'student'
              )
            })
          }),
          net: {
            myIp: '10.10.14.23',
            prefix: 24,
            gateway: '10.10.14.1',
            hosts: [
              {
                ip: '10.10.14.30',
                name: 'fakebank.lab',
                ports: [
                  {
                    port: 80,
                    state: 'open',
                    svc: 'http',
                    version: 'nginx 1.18.0',
                    web: {
                      '/': 'Meridian Bank home. Your account is 8881.',
                      '/bank-transfer': 'Admin portal: register cash deposits. No login check.',
                      '/images': 'index of /images'
                    }
                  }
                ]
              }
            ]
          },
          dirb: {
            host: 'fakebank.lab',
            paths: [
              { path: '/bank-transfer', code: 200, size: 4663 },
              { path: '/images', code: 301, size: 179 }
            ]
          },
          app: {
            baseUrl: 'http://fakebank.lab',
            bank: {
              name: 'Meridian Bank',
              customer: 'Mrs G. Benjamin',
              own: '8881',
              balance: -1232.32,
              accounts: [
                { number: '8881', name: 'Mrs G. Benjamin' },
                { number: '1234', name: 'J. Okafor' },
                { number: '2863', name: 'A. Silva' }
              ],
              flag: 'SARVAM{bank_hacked}'
            }
          },
          tasks: [
            {
              id: 'b-t1',
              prompt: 'What is the account number on the bank home page?',
              hint: 'Look at the browser panel before you break anything.',
              answer: '8881'
            },
            {
              id: 'b-t2',
              prompt: 'Scan the bank and find the hidden page that registers staff deposits. Type its path.',
              hint: 'dirb http://fakebank.lab',
              answer: '/bank-transfer',
              accept: ['bank-transfer', 'http://fakebank.lab/bank-transfer']
            },
            {
              id: 'b-t3',
              prompt: 'Deposit $2000 into account 8881, then open the bank home page. Paste the green flag.',
              hint: 'The deposit form has no login check. Add the money to your own account.',
              answer: 'SARVAM{bank_hacked}'
            }
          ]
        },
        cards: [
          {
            front: 'What does dirb (or gobuster) do?',
            back: 'Content discovery: requests thousands of likely paths from a wordlist and reports the ones that answer. + lines are hits; 200, 301 and 403 all mean "exists".'
          },
          {
            front: 'Why is a hidden admin page a security bug?',
            back: 'The developer relies on nobody guessing the URL instead of checking authorisation. Broken access control, OWASP Top 10 number one.'
          },
          {
            front: 'What does (CODE:200|SIZE:4663) tell you in dirb output?',
            back: 'The page returned HTTP 200 (OK) and 4663 bytes of content, so it exists and is readable without authentication.'
          }
        ]
      }
    ]
  },
  {
    id: 'p0',
    num: '00',
    title: 'Computer and OS fundamentals',
    meta: 'about 2 weeks',
    lessons: [
      {
        id: 'p0-bytes',
        title: 'Bits, bytes and hex',
        sub: 'Why every address, permission and hash looks like that',
        minutes: 12,
        labType: 'terminal',
        concept: `
<h2>Everything is a number underneath</h2>
<p>A computer stores bits. A byte is 8 bits. That is the whole foundation, and the reason a permission
looks like <code>755</code>, an address looks like <code>192.168.1.10</code>, and a hash looks like
<code>a3f5c9...</code>.</p>

<h3>Counting in base 2</h3>
<p>Each bit doubles in value left to right: <code>128 64 32 16 8 4 2 1</code>. So
<code>10101100</code> = 128+32+8+4 = <strong>172</strong>. Practise until you can do it in your head:
this is exactly how you will read subnets later.</p>

<h3>Hex is just a shorter binary</h3>
<p>One hex digit covers 4 bits, so two hex digits make a byte. That is why hex is everywhere: it is
binary with 4x fewer characters.</p>
<pre><code>binary  1010 1100
hex        A    C    -> 0xAC -> 172</code></pre>

<h3>Where you will meet this on day one</h3>
<ul>
  <li><strong>Permissions:</strong> <code>chmod 755</code> is three octal digits, each 3 bits
  (read=4, write=2, execute=1). 7 = rwx, 5 = r-x.</li>
  <li><strong>Colours and file magic:</strong> file signatures like <code>%PDF</code> or
  <code>89 50 4E 47</code> (PNG) begin every file of that type.</li>
  <li><strong>Hashes:</strong> fixed-length hex output, which is how you compare two files.</li>
</ul>
<div class="callout">Do not memorise the tables. Memorise the trick: hex to binary is 4 bits per digit,
then add the place values.</div>
`,
        lab: {
          startCwd: '/home/student',
          intro: 'A dumped directory. Decode, hash and inspect your way through it. Type help if you need the command list.',
          fs: d('755', {
            home: d('755', {
              student: d('755', {
                'readme.txt': f('644', 'hello world\n', 'student'),
                'token.b64': f('644', 'U0FSVkFNe2JpdHNfYXJlX3RoZV9iZWdpbm5pbmd9\n', 'student'),
                'firmware.bin': f(
                  '644',
                  '\u0000\u0001ELF\u0002\u0000\u0000\u0000PK\u0003\u0004debug: SARVAM{strings_never_lie}\u0000\u0000\u0007\u0008',
                  'student'
                ),
                'checksums.txt': f(
                  '644',
                  '5eb63bbbe01eeed093cb22bb8f5acdc3  readme.txt\n9b9d6c1a2e2c5c5c8b6c1a2e2c5c5c8b  token.b64\n',
                  'student'
                )
              })
            })
          }),
          tasks: [
            {
              id: 't1',
              prompt: 'Decode token.b64 and submit the flag inside it.',
              hint: 'cat token.b64 | base64 -d',
              answer: 'SARVAM{bits_are_the_beginning}'
            },
            {
              id: 't2',
              prompt: 'Submit the md5 of readme.txt, exactly as md5sum prints it.',
              hint: 'md5sum readme.txt. The same hash sits in checksums.txt, which is how you prove a file was not tampered with.',
              answer: '5eb63bbbe01eeed093cb22bb8f5acdc3'
            },
            {
              id: 't3',
              prompt: 'firmware.bin is mostly junk bytes. Pull the readable flag out of it.',
              hint: 'strings firmware.bin. xxd firmware.bin shows the bytes underneath.',
              answer: 'SARVAM{strings_never_lie}'
            }
          ]
        },
        cards: [
          { front: 'What is one hex digit worth in bits?', back: '4 bits (a nibble). Two hex digits = one byte.' },
          { front: 'In chmod octal digits, what do 4, 2 and 1 mean?', back: '4 = read, 2 = write, 1 = execute. 7 = rwx.' },
          { front: 'Convert 0xC0 to binary and decimal', back: '1100 0000 binary, 192 decimal.' }
        ]
      }
    ]
  },
  {
    id: 'p1',
    num: '01',
    title: 'Linux, the shell and Bash',
    meta: 'about 6 weeks',
    lessons: [
      {
        id: 'p1-nav',
        title: 'Filesystem hierarchy and navigation',
        sub: 'Find anything on a Linux box without guessing',
        minutes: 15,
        labType: 'terminal',
        concept: `
<h2>Linux is one tree</h2>
<p>There are no drive letters. Everything hangs off <code>/</code>, and the layout is predictable,
which is exactly why an investigator can find evidence in seconds.</p>
<ul>
  <li><code>/etc</code>: configuration. Passwords, services, sshd, sudoers.</li>
  <li><code>/var/log</code>: logs. This is where incidents leave footprints.</li>
  <li><code>/home</code>: users. Home directories and their secrets.</li>
  <li><code>/tmp</code>: world-writable. Attackers love it, so do you.</li>
  <li><code>/proc</code>: the kernel talking about running processes as if it were a folder.</li>
</ul>

<h3>The four commands you will type forever</h3>
<pre><code>pwd              where am I
ls -la           what is here, including hidden files and permissions
cd /var/log      move
cat notes.txt    read a whole small file</code></pre>
<p>Then the two search tools that replace guessing:</p>
<pre><code>find /home -name '*.txt'      find by name, type or time
grep -rin 'password' /home    find by content, case-insensitive, recursive</code></pre>

<div class="callout">Habit worth building now: when you land on a strange machine, run
<code>whoami; id; pwd; ls -la</code> before anything else. Orientation first, heroics later.</div>
`,
        lab: {
          startCwd: '/home/student',
          intro: 'Welcome. Type <span class="t-dim">help</span> for commands. Your first flag is somewhere under /home/student/projects.',
          fs: d('755', {
            etc: d('755', {
              motd: f('644', 'Sarvam training box\nowner: ops@example.test\n'),
              passwd: f('644', 'root:x:0:0:root:/root:/bin/bash\nstudent:x:1001:1001::/home/student:/bin/bash\nsvc-backup:x:1002:1002::/home/svc-backup:/usr/sbin/nologin\n'),
              shadow: f('640', 'root:$6$REDACTED:19000:0:99999:7:::\n')
            }),
            home: d('755', {
              student: d('755', {
                'notes.txt': f('644', 'todo:\n- read the auth log\n- rotate the backup key\n- delete old screenshots\n'),
                projects: d('755', {
                  'readme.md': f('644', 'Project omega: internal tool. Nothing to see here.\n'),
                  'scan.sh': f('755', '#!/bin/bash\necho "scanning..."\n'),
                  archive: d('755', {
                    'flag.txt': f('644', 'SARVAM{directories_all_the_way_down}\n')
                  })
                }),
                '.bash_history': f('600', 'ls -la\ncd projects\nfind /home -name flag.txt\n', 'student')
              }),
              'svc-backup': d('700', {})
            }),
            var: d('755', {
              log: d('755', { 'syslog': f('640', 'Nov  4 02:14:07 web01 cron: job started\n') }),
              backups: d('755', {})
            }),
            tmp: d('1777', {})
          }),
          tasks: [
            {
              id: 't1',
              prompt: 'Read /etc/motd and tell me who owns this training box.',
              hint: 'cat /etc/motd',
              answer: 'ops@example.test'
            },
            {
              id: 't2',
              prompt: 'How many entries are in /home/student/projects (files and folders, not counting hidden ones)?',
              hint: 'ls /home/student/projects',
              answer: '3'
            },
            {
              id: 't3',
              prompt: 'What is the flag hiding in the archive folder?',
              hint: 'find /home/student -name "flag.txt" then cat it',
              answer: 'SARVAM{directories_all_the_way_down}'
            },
            {
              id: 't4',
              prompt: 'Which file in /home/student is readable only by its owner? Give the filename.',
              hint: 'ls -la /home/student shows modes; 600 is owner-only',
              answer: '.bash_history'
            }
          ]
        },
        cards: [
          { front: 'Where do Linux logs live?', back: '/var/log, for example /var/log/auth.log and /var/log/syslog.' },
          { front: 'Difference between find and grep?', back: 'find searches the filesystem by name, type, time or permissions. grep searches inside file contents.' },
          { front: 'What does ls -la show that ls does not?', back: 'Hidden files, permissions, owner, group, size and timestamps.' }
        ]
      },
      {
        id: 'p1-perms',
        title: 'Permissions, ownership and privilege',
        sub: 'The most security-relevant thing on any Linux box',
        minutes: 18,
        labType: 'terminal',
        concept: `
<h2>Every file has an owner, a group and three bits of permission</h2>
<p><code>rwx</code> for the user, the group and everyone else. That is it, and it decides who can read
your secrets and who can become root.</p>
<pre><code>ls -l
-rw-r--r--  1 student student  512 Nov  4 10:00 notes.txt
drwx------  2 svc-backup svc-backup 4096 Nov  4 09:00 /home/svc-backup</code></pre>
<p>The first character is the type (<code>-</code> file, <code>d</code> directory). Then three triples.</p>

<h3>chmod in octal</h3>
<pre><code>chmod 600 secret.txt    rw-------   only the owner reads it
chmod 644 page.html     rw-r--r--   public read, owner write
chmod 755 run.sh        rwxr-xr-x   executable by everyone
chmod 777 anything      never. that is a finding in every audit</code></pre>

<h3>The two special bits that cause privilege escalation</h3>
<ul>
  <li><strong>setuid (4xxx):</strong> the program runs as its owner, usually root. A setuid binary you can
  abuse is a straight path to root, which is why <code>find / -perm -4000</code> is one of the first
  commands on any engagement.</li>
  <li><strong>setgid (2xxx):</strong> runs with the group's rights. On directories, files inherit the group.</li>
</ul>
<p><code>sudo</code> is not magic: it reads <code>/etc/sudoers</code> and checks whether your user may run
that command as another user. Misconfigured sudo (a passwordless NOPASSWD entry, or an allowed command
that can spawn a shell) is another classic escalation.</p>
<div class="callout warn">Permissions are not decoration. "Everyone can write here" is how persistence
gets installed, and "this binary is setuid root" is how an attacker stops being a normal user.</div>
`,
        lab: {
          startCwd: '/home/student',
          intro: 'Two files are setuid. One sudo rule is too generous. Find both problems and grab the flags.',
          fs: d('755', {
            usr: d('755', {
              bin: d('755', {
                'health-check': f('4755', '#!/bin/sh\n# runs as root, reads a config we control\ncat /home/student/conf/health.conf\n'),
                'backup-runner': f('755', '#!/bin/sh\necho "backup ok"\n'),
                ls: f('755', 'binary'),
                cat: f('755', 'binary')
              })
            }),
            etc: d('755', {
              sudoers: f('440', 'root ALL=(ALL:ALL) ALL\nstudent ALL=(root) NOPASSWD: /usr/bin/health-check\n'),
              'health.conf': f('644', 'target=/var/backups\n')
            }),
            home: d('755', {
              student: d('755', {
                conf: d('755', {
                  'health.conf': f('666', 'target=/var/backups\nFLAG=SARVAM{world_writable_config}\n', 'student')
                }),
                secrets: d('700', {
                  'root-note.txt': f('600', 'only root should read this\nSARVAM{not_so_secret_after_all}\n', 'root')
                }),
                'todo.md': f('644', '- audit setuid binaries\n- check sudo -l output\n')
              })
            }),
            var: d('755', { backups: d('755', {}) })
          }),
          tasks: [
            {
              id: 't1',
              prompt: 'List the setuid binaries in /usr/bin and name the one a student could abuse.',
              hint: 'find /usr/bin -perm -4000',
              answer: 'health-check'
            },
            {
              id: 't2',
              prompt: 'Read the file that health-check uses as its config. What is the flag?',
              hint: 'cat /home/student/conf/health.conf',
              answer: 'SARVAM{world_writable_config}'
            },
            {
              id: 't3',
              prompt: 'What permission mode should that config file have so only the owner can write it? Answer the three digits.',
              hint: 'owner read+write, group read, others read -> 6 4 4',
              answer: '644'
            },
            {
              id: 't4',
              prompt: 'Try reading /home/student/secrets/root-note.txt. It fails. What is the octal mode of that secrets folder? (decode rwx------ )',
              hint: 'ls -la /home/student shows the folder mode',
              answer: '700'
            }
          ]
        },
        cards: [
          { front: 'What does a setuid root binary mean?', back: 'It executes with root privileges regardless of who runs it, so any bug or misconfiguration in it can become full privilege escalation.' },
          { front: 'Command to find setuid binaries?', back: 'find / -perm -4000 -type f 2>/dev/null' },
          { front: 'Why is chmod 777 dangerous?', back: 'Any local user can modify or replace the file, which allows tampering, persistence and code injection.' }
        ]
      },
      {
        id: 'p1-grep',
        title: 'Reading logs like an analyst',
        sub: 'Turn 20 messy lines into one clear story',
        minutes: 15,
        labType: 'terminal',
        concept: `
<h2>An incident is a story with timestamps</h2>
<p>Before any tool, there is a text file and a question. Here is a real sshd log pattern:</p>
<pre><code>Failed password for invalid user admin from 203.0.113.44
Failed password for invalid user pi    from 203.0.113.44
Accepted password for svc-backup from 203.0.113.44</code></pre>
<p>Many failures from one address, then a success, is a successful brute force. That single pattern is
worth more than most tools.</p>

<h3>The three commands that do the work</h3>
<pre><code>grep -c 'Failed password' /var/log/auth.log     count them
grep '203.0.113.44' /var/log/auth.log           everything from one source
awk '{print $11}' /var/log/auth.log | sort | uniq -c | sort -rn | head</code></pre>
<p>The last one is the analyst's reflex: pull a field, count it, sort it. You will use that shape on
IPs, usernames, user agents and URLs forever.</p>

<h3>What to look for</h3>
<ul>
  <li>Volume: 40 failures from one IP is not a typo, it is automation.</li>
  <li>Sequence: failure then success from the same IP means assume compromise.</li>
  <li>Time gaps: logins at 03:00 for an account that works 09:00 to 18:00.</li>
  <li>Absence: a gap in logs is itself evidence.</li>
</ul>
<div class="callout">Write the timeline in your notes as you go: time, source, action, result. That is
half of the report you will eventually hand a client.</div>
`,
        lab: {
          startCwd: '/var/log',
          intro: 'This is a real-shaped auth.log. Find the brute force, find what it got, and find the flag left in the audit line.',
          fs: d('755', {
            var: d('755', {
              log: d('755', { 'auth.log': f('644', AUTHLOG) })
            }),
            home: d('755', { student: d('755', {}) }),
            etc: d('755', { hostname: f('644', 'web01\n') })
          }),
          tasks: [
            {
              id: 't1',
              prompt: 'How many failed password attempts came from 203.0.113.44?',
              hint: "grep '203.0.113.44' auth.log | grep -c 'Failed password'",
              answer: '5'
            },
            {
              id: 't2',
              prompt: 'Which account did the attacker successfully log in as?',
              hint: 'look for Accepted in the same minute as the failures',
              answer: 'svc-backup'
            },
            {
              id: 't3',
              prompt: 'What is the flag recorded in the audit line?',
              hint: "grep -i audit auth.log",
              answer: 'SARVAM{one_lazy_password}'
            },
            {
              id: 't4',
              prompt: 'Which IP looks like a legitimate deploy source (it keeps using keys)?',
              hint: 'grep Accepted auth.log',
              answer: '198.51.100.9'
            },
            {
              id: 't5',
              prompt: 'How long, in seconds, between the first failure and the successful login from that attacker? Give the number.',
              hint: '02:14:07 to 02:14:21',
              answer: '14'
            }
          ]
        },
        cards: [
          { front: 'Fastest way to count failures per source IP in a log?', back: "grep 'Failed password' auth.log | awk '{print $11}' | sort | uniq -c | sort -rn" },
          { front: 'Many failed logins followed by one success from the same IP means what?', back: 'A successful brute force. Treat the account as compromised.' },
          { front: 'Why is a gap in logs suspicious?', back: 'Attackers clear or disable logging after gaining access, so missing entries can be evidence of tampering.' }
        ]
      }
    ]
  },
  {
    id: 'p2',
    num: '02',
    title: 'Networking, packet by packet',
    meta: 'about 6 weeks',
    lessons: [
      {
        id: 'p2-ip',
        title: 'IP addresses, masks and CIDR',
        sub: 'The notation that shows up in every scan, rule and firewall',
        minutes: 16,
        labType: 'terminal',
        concept: `
<h2>An address is a location, a mask is the neighbourhood</h2>
<p><code>192.168.1.10/24</code>: the address is 192.168.1.10 and the <code>/24</code> says the first 24 bits
are the network. 24 bits is three bytes, so the network is <code>192.168.1.0</code> and the last byte
identifies hosts.</p>
<pre><code>/24  -> 255.255.255.0    -> 256 addresses, 254 usable
/25  -> 255.255.255.128  -> 128 addresses, 126 usable
/16  -> 255.255.0.0      -> 65,536 addresses
/30  -> 255.255.255.252  -> 4 addresses, 2 usable (point to point)</code></pre>

<h3>The two addresses you cannot use</h3>
<p>In every subnet, the first address is the network and the last is the broadcast. So a /24 has 254
usable hosts. This one sentence answers a third of all networking interview questions.</p>

<h3>Private ranges</h3>
<ul>
  <li><code>10.0.0.0/8</code></li>
  <li><code>172.16.0.0/12</code> (172.16 to 172.31)</li>
  <li><code>192.168.0.0/16</code></li>
  <li><code>127.0.0.0/8</code> is loopback, and <code>169.254.0.0/16</code> means DHCP failed.</li>
</ul>
<div class="callout">Security relevance: your firewall rules, your scan scope and your "is this
internal?" question are all this arithmetic. Getting a scope wrong is how people scan the wrong network
and end up in trouble.</div>
`,
        lab: {
          startCwd: '/home/student',
          intro: 'You are on a lab network with no notes. Recon it with ip, ping and nmap.',
          fs: d('755', {
            home: d('755', { student: d('755', {}, 'student') })
          }),
          net: {
            myIp: '10.10.14.23',
            prefix: 24,
            gateway: '10.10.14.1',
            dns: '10.10.14.2',
            hosts: [
              { ip: '10.10.14.1', name: 'gw.lab', ports: [{ port: 22, state: 'open', svc: 'ssh', version: 'OpenSSH 8.2p1' }] },
              {
                ip: '10.10.14.5',
                name: 'files.lab',
                ports: [
                  { port: 22, state: 'open', svc: 'ssh', version: 'OpenSSH 8.2p1 Ubuntu' },
                  { port: 8080, state: 'open', svc: 'http', version: 'nginx 1.18.0' }
                ]
              },
              { ip: '10.10.14.9', name: 'db.lab', ports: [{ port: 3306, state: 'open', svc: 'mysql', version: 'MySQL 8.0.35' }] }
            ]
          },
          tasks: [
            {
              id: 't1',
              prompt: 'What is your own IPv4 address on this network?',
              hint: 'ip a',
              answer: '10.10.14.23'
            },
            {
              id: 't2',
              prompt: 'How many hosts answer on 10.10.14.0/24? Submit the number.',
              hint: 'nmap -sn 10.10.14.0/24 counts live hosts without touching ports.',
              answer: '3'
            },
            {
              id: 't3',
              prompt: 'Submit the network address of your own subnet.',
              hint: 'ipcalc 10.10.14.23/24',
              answer: '10.10.14.0'
            }
          ]
        },
        cards: [
          { front: 'How many usable hosts in a /24 and why?', back: '254. 256 addresses minus the network address and the broadcast address.' },
          { front: 'What does /24 mean in 10.1.2.3/24?', back: 'The first 24 bits (three bytes) are the network, so the network is 10.1.2.0 and .3 is a host.' },
          { front: 'What does an address in 169.254.0.0/16 indicate?', back: 'A link-local self-assigned address, meaning DHCP failed.' }
        ]
      },
      {
        id: 'p2-subnet',
        title: 'Subnetting that you can do in your head',
        sub: 'Block sizes, ranges and why /30 exists',
        minutes: 18,
        labType: 'terminal',
        concept: `
<h2>Count in blocks, not in bits</h2>
<p>The mask decides the block size. For any mask, block size = 256 minus the last mask octet.</p>
<pre><code>/25 -> 256-128 = 128   blocks: .0, .128
/26 -> 256-192 = 64     blocks: .0, .64, .128, .192
/28 -> 256-240 = 16     blocks: .0, .16, .32 ...
/30 -> 256-252 = 4      blocks: .0, .4, .8 ...</code></pre>
<p>So <code>192.168.1.90/26</code> sits in the block that starts at 64: network 192.168.1.64, usable
.65 to .126, broadcast .127.</p>

<h3>Sanity check that saves you</h3>
<p>The network address is always a multiple of the block size, and the broadcast is one less than the
next block. If your answer breaks either rule, redo it.</p>

<h3>Why /30 and /31 exist</h3>
<p>A /30 gives exactly two usable addresses, which is what a point-to-point link needs. A /31 is a
modern two-host link with no broadcast, and a /32 is a single host, used in firewall rules and
loopback interfaces.</p>

<h3>Where this bites in security</h3>
<ul>
  <li>Scope: <code>/24</code> versus <code>/23</code> changes who you are allowed to scan.</li>
  <li>Firewalls: rules match networks, not hostnames.</li>
  <li>Segmentation: flat /16 internal networks are why one compromised laptop reaches the database.</li>
</ul>
`,
        lab: {
          startCwd: '/home/student',
          intro: 'ipcalc is installed here. Use it instead of guessing: ipcalc <address>/<prefix>.',
          fs: d('755', {
            home: d('755', { student: d('755', {}, 'student') })
          }),
          net: { myIp: '10.10.14.23', prefix: 24, gateway: '10.10.14.1', dns: '10.10.14.2', hosts: [] },
          tasks: [
            {
              id: 't1',
              prompt: 'Submit the network address of 192.168.4.37/26.',
              hint: 'ipcalc 192.168.4.37/26',
              answer: '192.168.4.0'
            },
            {
              id: 't2',
              prompt: 'How many usable hosts does a /26 give you?',
              hint: 'ipcalc prints total and usable. The two you cannot assign are network and broadcast.',
              answer: '62'
            },
            {
              id: 't3',
              prompt: 'The host 10.10.14.200/27 sits on which network address?',
              hint: 'ipcalc 10.10.14.200/27. A /27 is 32 addresses, so the boundaries are 0, 32, 64 ... 192, 224.',
              answer: '10.10.14.192'
            },
            {
              id: 't4',
              prompt: 'Submit the broadcast address of 172.16.5.130/25.',
              hint: 'ipcalc 172.16.5.130/25',
              answer: '172.16.5.255'
            }
          ]
        },
        cards: [
          { front: 'Block size formula from a mask?', back: '256 minus the last octet of the mask. For /26 (255.255.255.192) that is 64.' },
          { front: 'Smallest subnet that fits 60 hosts?', back: 'A /26, which gives 62 usable addresses.' },
          { front: 'What is a /30 used for?', back: 'Point-to-point links: 4 addresses, 2 usable, no space wasted.' }
        ]
      },
      {
        id: 'p2-tcp',
        title: 'TCP, UDP, ports and the handshake',
        sub: 'What actually happens when two machines talk',
        minutes: 16,
        labType: 'terminal',
        concept: `
<h2>Two transports, two personalities</h2>
<p>TCP is ordered, acknowledged, connection-based. UDP is fire-and-forget. Almost every attack you will
learn starts with knowing which one the service speaks.</p>

<h3>The handshake you must be able to draw</h3>
<pre><code>client            server
  SYN      ->
           <-  SYN,ACK
  ACK      ->        connection established</code></pre>
<p>Then data. Then <code>FIN</code> or <code>RST</code> to close, or nothing at all if someone wants
to leave a quiet socket open.</p>

<h3>Why an attacker cares</h3>
<ul>
  <li>A <strong>SYN scan</strong> never completes the handshake, so old firewalls miss it and it is fast.</li>
  <li>A full connect scan completes it, so it shows in application logs.</li>
  <li><strong>RST</strong> responses reveal a closed port, silence reveals a filtered one. Reading that
  difference is half of enumeration.</li>
</ul>

<h3>Ports worth knowing cold</h3>
<pre><code>21 ftp     22 ssh     23 telnet    25 smtp
53 dns     80 http    110 pop3     139/445 smb
143 imap   443 https  1433 mssql   3306 mysql
3389 rdp   5432 postgres          8080 http-alt</code></pre>
<p>Mnemonic that works: learn one service per port and the exploit history follows.</p>
<div class="callout">UDP matters more than beginners expect: DNS on 53, SNMP on 161 (often with default
community strings), DHCP on 67/68, and VPNs. A TCP-only scan leaves blind spots.</div>
`,
        lab: {
          startCwd: '/home/student',
          intro: 'A small lab network, a scanner and curl. Map the service before you touch it.',
          fs: d('755', {
            home: d('755', { student: d('755', {}, 'student') })
          }),
          net: {
            myIp: '10.10.14.23',
            prefix: 24,
            gateway: '10.10.14.1',
            dns: '10.10.14.2',
            hosts: [
              {
                ip: '10.10.14.5',
                name: 'files.lab',
                ports: [
                  { port: 22, state: 'open', svc: 'ssh', version: 'OpenSSH 8.2p1 Ubuntu' },
                  {
                    port: 8080,
                    state: 'open',
                    svc: 'http',
                    version: 'nginx 1.18.0',
                    web: {
                      '/': '<h1>files.lab</h1><p>internal file drop</p><!-- build 41, deploy-key SARVAM{comments_ship_to_production} -->',
                      '/robots.txt': 'User-agent: *\nDisallow: /backup\n',
                      '/backup': '<h1>index of /backup</h1><a href="db-2026-11-04.sql">db-2026-11-04.sql</a>\n<!-- SARVAM{robots_is_a_map} -->'
                    }
                  }
                ]
              },
              { ip: '10.10.14.9', name: 'db.lab', ports: [{ port: 3306, state: 'open', svc: 'mysql', version: 'MySQL 8.0.35' }] }
            ]
          },
          tasks: [
            {
              id: 't1',
              prompt: 'Which server and version answers on port 8080 of 10.10.14.5? Submit the version string only.',
              hint: 'nmap -sV 10.10.14.5',
              answer: 'nginx 1.18.0'
            },
            {
              id: 't2',
              prompt: 'The homepage leaks a deploy key in a comment. Submit it.',
              hint: 'curl http://10.10.14.5:8080/ then look at the HTML comment.',
              answer: 'SARVAM{comments_ship_to_production}'
            },
            {
              id: 't3',
              prompt: 'robots.txt points somewhere. Fetch that path and submit the flag it exposes.',
              hint: 'curl http://10.10.14.5:8080/robots.txt, then curl the path it disallows.',
              answer: 'SARVAM{robots_is_a_map}'
            }
          ]
        },
        cards: [
          { front: 'Draw the TCP three-way handshake', back: 'SYN (client), SYN-ACK (server), ACK (client).' },
          { front: 'Ports 22, 80, 443, 445, 3389?', back: 'SSH, HTTP, HTTPS, SMB, RDP.' },
          { front: 'Closed port versus filtered port in a scan?', back: 'Closed replies with RST. Filtered stays silent because a firewall dropped the probe.' }
        ]
      }
    ]
  },
  {
    id: 'p3',
    num: '03',
    title: 'Web, code and how apps break',
    meta: 'about 6 weeks',
    lessons: [
      {
        id: 'p3-http',
        title: 'HTTP, cookies and DevTools',
        sub: 'Where most real-world attacks actually live',
        minutes: 15,
        labType: 'web',
        concept: `
<h2>HTTP is a request and a response, in plain text</h2>
<pre><code>GET /account?id=42 HTTP/1.1
Host: shop.example.test
Cookie: session=8f2a1c</code></pre>
<pre><code>HTTP/1.1 200 OK
Content-Type: text/html
Set-Cookie: session=8f2a1c; HttpOnly; Secure</code></pre>
<p>That is the whole protocol. Every web vulnerability is one of these parts being trusted too much.</p>

<h3>Status codes worth recognising instantly</h3>
<ul>
  <li><code>200</code> ok, <code>301/302</code> redirect, <code>304</code> cached</li>
  <li><code>401</code> not authenticated, <code>403</code> authenticated but not allowed</li>
  <li><code>404</code> missing, <code>500</code> the app crashed (often the interesting one)</li>
</ul>

<h3>Where state hides</h3>
<p>HTTP has no memory, so state lives in <code>Cookie</code>, in a token header, or in the URL. If the
server trusts an ID in any of those without checking ownership, you have IDOR: change
<code>?id=42</code> to <code>?id=43</code> and read someone else's account.</p>

<h3>DevTools is your first security tool</h3>
<p>Open the Network tab, then: read every request, edit and resend (right-click, Copy as fetch), look at
Set-Cookie flags, and check what the page does with user input. Most of web security is this plus a
proxy later.</p>
<div class="callout warn">Cookie flags matter: <code>HttpOnly</code> stops JavaScript from reading a
cookie, <code>Secure</code> keeps it off plain HTTP, <code>SameSite</code> limits cross-site sending.
Missing flags are real findings, not trivia.</div>
`,
        lab: {
          startCwd: '/home/student',
          intro: 'Nimbus is running in the panel above. Three bugs, three flags. The address bar inside the app is real.',
          app: {
            appTitle: 'Nimbus',
            baseUrl: 'http://notes.lab:8080',
            host: 'notes.lab:8080',
            session: { user: 'lowell', plan: 'free', key: 'SARVAM{xss_runs_in_my_browser}' },
            notes: [
              { id: 1, title: 'Shopping', author: 'lowell', visibility: 'private', body: 'oat milk, coffee, a new keyboard' },
              { id: 2, title: 'Sprint notes', author: 'maya', visibility: 'private', body: 'move uploads to the new bucket, rotate the api token' },
              {
                id: 9,
                title: 'Admin backup codes',
                author: 'admin',
                visibility: 'private',
                body: 'one-time codes for the console: SARVAM{idor_is_not_a_feature}'
              }
            ],
            files: {
              'readme.txt': 'Nimbus file store. Only exported files live in this directory.',
              'app.txt': 'version 4.1.2'
            },
            privateFile: 'backup-2026-11-04.txt\nDB_PASSWORD=not-for-you\nSARVAM{traversal_reads_anything}'
          },
          tasks: [
            {
              id: 't1',
              prompt: 'Your note is id 1. The admin has one too. Read it and submit the code inside.',
              hint: 'The page trusts the id in the URL: /note?id=9, or /api/note?id=9 for the raw JSON. That trust is the bug.',
              answer: 'SARVAM{idor_is_not_a_feature}'
            },
            {
              id: 't2',
              prompt: 'The download endpoint serves readme.txt. Make it serve the private backup file and submit its flag.',
              hint: 'The file parameter is joined to a directory without cleaning the path: /download?file=../private/backup-2026-11-04.txt',
              answer: 'SARVAM{traversal_reads_anything}'
            },
            {
              id: 't3',
              prompt: 'Feedback reflects your input. Get JavaScript to run and submit the session key it can reach.',
              hint: 'Script tags written with innerHTML never execute, event handlers do. Try: <img src=x onerror="document.body.innerText=window.__adminSession.key">',
              answer: 'SARVAM{xss_runs_in_my_browser}'
            }
          ]
        },
        cards: [
          { front: 'Difference between 401 and 403?', back: '401 means not authenticated. 403 means authenticated but not allowed.' },
          { front: 'What is IDOR?', back: 'Insecure Direct Object Reference: the app trusts an ID from the client without checking that you own that object.' },
          { front: 'What do HttpOnly, Secure and SameSite do?', back: 'HttpOnly hides the cookie from JavaScript, Secure sends it only over HTTPS, SameSite limits cross-site sending.' }
        ]
      }
    ]
  }
];

export const CURRICULUM = [...BASE_PHASES, ...ADVANCED_PHASES];

/** Flat, ordered list: gating and "next lesson" logic depend on this order. */
export const LESSONS = CURRICULUM.flatMap((phase) =>
  phase.lessons.map((l) => ({ ...l, phaseId: phase.id, phaseTitle: phase.title, phaseNum: phase.num }))
);

export const TOTAL_LESSONS = LESSONS.length;

export function lessonIndex(id) {
  return LESSONS.findIndex((l) => l.id === id);
}

export function lessonById(id) {
  return LESSONS.find((l) => l.id === id) || null;
}
