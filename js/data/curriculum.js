/**
 * Sarvam curriculum.
 * Everything the app renders comes from here. Add a lesson object and it appears in the map,
 * gets gated automatically by order, and its cards join the review queue.
 *
 * Lesson shape:
 *  id, title, sub, minutes, labType: 'terminal' | 'quiz'
 *  concept: HTML string
 *  quiz:   { questions: [{ q, options: [], answer: <index>, explain }] }   (labType 'quiz')
 *  lab:    { startCwd, intro, fs, tasks: [{ id, prompt, hint, answer }] }  (labType 'terminal')
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

export const CURRICULUM = [
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
        labType: 'quiz',
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
        quiz: {
          questions: [
            {
              q: 'What is binary 10110100 in decimal?',
              options: ['164', '180', '148', '196'],
              answer: 1,
              explain: '128+32+16+4 = 180. The 64 and 8 and 2 and 1 bits are off.'
            },
            {
              q: 'What is decimal 173 in hex?',
              options: ['0xAD', '0xAC', '0xBD', '0xA3'],
              answer: 0,
              explain: '173 = 1010 1101 = 0xAD. 160+13, and 13 is D.'
            },
            {
              q: 'chmod 640 gives which permissions?',
              options: ['rw-r-----', 'rwxr-----', 'rw-r--r--', 'r-xr--r--'],
              answer: 0,
              explain: '6 = rw-, 4 = r--, 0 = ---. Owner read+write, group read, others nothing.'
            },
            {
              q: 'Why does hex show up so often in security tooling?',
              options: [
                'Because it is more precise than decimal',
                'Because two hex digits map cleanly onto one byte',
                'Because it compresses data',
                'Because hardware requires it'
              ],
              answer: 1,
              explain: 'One hex digit per nibble, two per byte. It is binary in readable clothing.'
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
        labType: 'quiz',
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
        quiz: {
          questions: [
            {
              q: 'How many usable hosts in a /26?',
              options: ['62', '64', '30', '126'],
              answer: 0,
              explain: '/26 = 64 addresses, minus network and broadcast = 62 usable.'
            },
            {
              q: '192.168.4.37/24 sits on which network address?',
              options: ['192.168.4.0', '192.168.4.32', '192.168.0.0', '192.168.4.37'],
              answer: 0,
              explain: '/24 fixes the first three bytes, so the network is 192.168.4.0.'
            },
            {
              q: 'Which of these is NOT a private address?',
              options: ['10.44.2.9', '172.20.1.5', '192.168.0.12', '172.40.1.5'],
              answer: 3,
              explain: 'Private 172 space is only 172.16.0.0 to 172.31.255.255. 172.40 is public.'
            },
            {
              q: 'A host shows 169.254.11.20. What happened?',
              options: ['It is on a VPN', 'DHCP did not answer, so it self-assigned', 'It is a loopback', 'The mask is wrong'],
              answer: 1,
              explain: 'APIPA/link-local means no DHCP lease was obtained. Often a cable, VLAN or DHCP issue.'
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
        labType: 'quiz',
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
        quiz: {
          questions: [
            {
              q: 'For 10.0.0.130/26, what is the network address?',
              options: ['10.0.0.128', '10.0.0.96', '10.0.0.0', '10.0.0.192'],
              answer: 0,
              explain: 'Block size 64: blocks are .0 .64 .128 .192. 130 falls in .128, so network is 10.0.0.128.'
            },
            {
              q: 'What is the broadcast address of 172.16.5.70/28?',
              options: ['172.16.5.79', '172.16.5.71', '172.16.5.64', '172.16.5.80'],
              answer: 0,
              explain: 'Block size 16, blocks .64 and .80. Network .64, usable .65-.78, broadcast .79.'
            },
            {
              q: 'How many usable hosts does a /30 provide?',
              options: ['2', '4', '6', '14'],
              answer: 0,
              explain: '4 addresses minus network and broadcast = 2 usable. Ideal for point-to-point links.'
            },
            {
              q: 'Two subnets must each hold 60 hosts. Which mask?',
              options: ['/26', '/27', '/28', '/25'],
              answer: 0,
              explain: '/26 gives 62 usable, which is the smallest mask that fits 60 hosts.'
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
        labType: 'quiz',
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
        quiz: {
          questions: [
            {
              q: 'Correct order of a TCP connection opening?',
              options: ['SYN, SYN-ACK, ACK', 'SYN, ACK, SYN-ACK', 'ACK, SYN, ACK', 'SYN, SYN, ACK'],
              answer: 0,
              explain: 'Client SYN, server SYN-ACK, client ACK. Three packets, hence three-way.'
            },
            {
              q: 'Which service usually listens on 445?',
              options: ['SMB', 'SSH', 'RDP', 'MySQL'],
              answer: 0,
              explain: '445 is SMB, one of the most attacked services in Windows environments.'
            },
            {
              q: 'A port scan gets no response at all from a port. What is most likely?',
              options: ['Port is closed', 'A firewall is dropping packets', 'Service is running', 'The host is up but busy'],
              answer: 1,
              explain: 'Closed ports answer with RST. Silence usually means a filter drops the probe.'
            },
            {
              q: 'Why is UDP preferred for DNS queries?',
              options: ['It is encrypted', 'It has no handshake overhead for tiny request/response pairs', 'It guarantees delivery', 'It is more secure by design'],
              answer: 1,
              explain: 'One small question and answer does not justify a handshake. DNS falls back to TCP for large answers.'
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
        labType: 'quiz',
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
        quiz: {
          questions: [
            {
              q: "You change ?id=42 to ?id=43 in a URL and see another account's data. What is this?",
              options: ['SQL injection', 'IDOR / broken access control', 'XSS', 'CSRF'],
              answer: 1,
              explain: 'The app trusts a client-supplied identifier without an ownership check. That is broken access control, and it is OWASP number one.'
            },
            {
              q: 'What does a Set-Cookie flag of HttpOnly prevent?',
              options: ['Cookie theft by JavaScript (and therefore many XSS session thefts)', 'Cookie theft over the network', 'Cross-site requests', 'Cookie expiry'],
              answer: 0,
              explain: 'HttpOnly hides the cookie from document.cookie, so script injected into a page cannot read it.'
            },
            {
              q: 'Which status code means you are authenticated but not permitted?',
              options: ['401', '403', '404', '302'],
              answer: 1,
              explain: '401 is a missing or bad credential. 403 means the server knows who you are and refuses.'
            },
            {
              q: 'A 500 error on a crafted input is useful to an attacker because:',
              options: ['It proves the site is down', 'It often leaks stack traces and confirms the input reached unsafe code', 'It means authentication is off', 'It caches the response'],
              answer: 1,
              explain: 'Errors reveal paths, versions and query fragments, and confirm the input is being processed unsafely.'
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
