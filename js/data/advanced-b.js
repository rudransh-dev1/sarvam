/**
 * Phases 05 and 06: the applied security core, then detection work.
 */
const d = (mode, children) => ({ type: 'dir', mode, owner: 'root', children });
const f = (mode, content, owner = 'root') => ({ type: 'file', mode, owner, content });

export const PHASE_05 = {
  id: 'phase-05',
  num: '05',
  title: 'Applied security core',
  meta: 'enumeration, exploitation, escalation',
  lessons: [
    {
      id: 'p5-recon',
      title: 'Enumeration before exploitation',
      sub: 'nmap, dirb, and the panel nobody linked to',
      minutes: 22,
      labType: 'terminal',
      concept: `
<h2>You cannot exploit what you have not found</h2>
<p>Enumeration is the slow, boring, decisive part of every real assessment. The workflow rarely changes:</p>
<pre><code>nmap -sn 10.10.14.0/24        who is alive
nmap -sV 10.10.14.50          what is listening, and which version
dirb http://10.10.14.50       what pages exist that nobody linked
curl http://10.10.14.50:8080/ read the ones that matter</code></pre>

<h3>Read the version, not just the port</h3>
<p>A port number tells you a service exists. A version string tells you whether it is a year out of date,
and that difference is usually the whole finding. Write versions down: they are evidence.</p>

<h3>Content discovery finds the forgotten things</h3>
<p>The exposed thing is almost never the homepage. It is <code>/backup</code>, <code>/admin</code>,
<code>/.git</code>, an old <code>/v1</code> API, a debug route. Tools like dirb or ffuf just try a wordlist
and report the responses that are not 404, which is why "nothing to see here" pages are worth a second look
when the status code is 200.</p>
<div class="callout">Method: host discovery, then service versions, then content, then read. Only after that
does an exploit make sense.</div>
`,
      lab: {
        startCwd: '/home/student',
        intro: 'One target on this network, one forgotten management panel. Enumerate it properly.',
        fs: d('755', {
          home: d('755', {
            student: d('755', { 'scope.txt': f('644', 'Authorised target: 10.10.14.0/24. No DoS, no brute force.\n') })
          })
        }),
        net: {
          myIp: '10.10.14.23',
          prefix: 24,
          gateway: '10.10.14.1',
          dns: '10.10.14.2',
          hosts: [
            {
              ip: '10.10.14.50',
              name: 'shop.lab',
              ports: [
                { port: 22, state: 'open', svc: 'ssh', version: 'OpenSSH 8.9p1 Ubuntu' },
                {
                  port: 80,
                  state: 'open',
                  svc: 'http',
                  version: 'nginx 1.18.0',
                  web: {
                    '/': 'Shop front. Nothing interesting. Cart, login, categories.',
                    '/robots.txt': 'User-agent: *\nDisallow: /backup\nDisallow: /admin'
                  }
                },
                {
                  port: 8080,
                  state: 'open',
                  svc: 'http',
                  version: 'Apache Tomcat 9.0.31',
                  web: {
                    '/': 'Tomcat manager application. Sign in to deploy a WAR.',
                    '/backup': 'Nightly database dump. FLAG: SARVAM{unlinked_backup_panel}'
                  }
                }
              ]
            },
            { ip: '10.10.14.51', name: 'printer.lab', ports: [{ port: 631, state: 'open', svc: 'ipp', version: 'CUPS 2.4' }] }
          ]
        },
        dirb: {
          host: '10.10.14.50',
          paths: [
            { path: '/robots.txt', code: 200, size: 74 },
            { path: '/backup', code: 301, size: 0 },
            { path: '/admin', code: 403, size: 289 }
          ]
        },
        tasks: [
          {
            id: 't1',
            prompt: 'Which port on 10.10.14.50 runs the management interface? Give the number.',
            hint: 'nmap -sV 10.10.14.50',
            answer: '8080'
          },
          {
            id: 't2',
            prompt: 'robots.txt points at a directory the site never links. What is that path?',
            hint: 'curl http://shop.lab/robots.txt',
            answer: '/backup'
          },
          {
            id: 't3',
            prompt: 'Read that panel and submit the flag it hands you.',
            hint: 'curl http://shop.lab:8080/backup',
            answer: 'SARVAM{unlinked_backup_panel}'
          }
        ]
      },
      cards: [
        { front: 'What does nmap -sV add over a plain port scan?', back: 'It fingerprints the service and version behind each open port, which tells you whether it is outdated or known-vulnerable.' },
        { front: 'Why is robots.txt worth reading in enumeration?', back: 'It often names exactly the paths the owner wanted hidden, which is a shortcut to backups and admin panels.' },
        { front: 'Why check the status code when a page returns something odd?', back: 'A 200 on an unexpected path usually means content exists. 403 means it exists but is protected, which is still a finding.' }
      ]
    },
    {
      id: 'p5-privesc',
      title: 'Privilege escalation on Linux',
      sub: 'sudo rules, cron jobs and setuid binaries',
      minutes: 24,
      labType: 'terminal',
      concept: `
<h2>You are in. Nobody cares yet.</h2>
<p>A normal user shell on a well-configured box is not a breach. Escalation is what turns access into
impact, and on Linux it comes from a short list of mistakes:</p>
<pre><code>sudo -l                 what may I run as root, and without a password?
find / -perm -4000      setuid binaries, run as their owner
crontab -l; ls -l /etc/cron.d    scheduled jobs that run as root
cat /etc/passwd | grep -v nologin who is even here
ls -la /opt /srv        anything world-writable?</code></pre>

<h3>The pattern behind almost every escalation</h3>
<p>Root runs something, and you can influence that something. A root cron job that executes a script in a
directory you can write to. A sudo rule that lets you run an editor as root (then <code>:!sh</code> inside
it). A setuid binary that reads a config file you own. The exploit is rarely clever; it is the configuration
being generous.</p>

<h3>Defensively</h3>
<ul>
  <li>No NOPASSWD entries unless the command cannot spawn a shell or write a file.</li>
  <li>Cron scripts and their directories owned by root, not group-writable.</li>
  <li>Audit setuid binaries, and remove the ones the distro did not ship.</li>
  <li>Keep a baseline of <code>find / -perm -4000</code> so a new one is obvious.</li>
</ul>
<div class="callout warn">On a real engagement you document the vector, escalate once, and stop. Do not
leave the box in a state the client has to clean up.</div>
`,
      lab: {
        startCwd: '/home/student',
        intro: 'Three escalation paths exist on this host. Identify all three and collect the flag from the weakest one.',
        fs: d('755', {
          usr: d('755', {
            bin: d('755', {
              'sysinfo': f('4755', '#!/bin/sh\n# setuid helper, reads its config as root\ncat /etc/sysinfo.conf\n'),
              ls: f('755', 'binary'),
              cat: f('755', 'binary'),
              vim: f('755', 'binary')
            })
          }),
          etc: d('755', {
            sudoers: f('440', 'root ALL=(ALL:ALL) ALL\nstudent ALL=(root) NOPASSWD: /usr/bin/vim\n'),
            'sysinfo.conf': f('664', 'kernel=6.2.0\nFLAG=SARVAM{writable_config_escalation}\n', 'student'),
            cron: d('755', {
              d: d('755', {
                backup: f('666', '#!/bin/sh\n# runs as root every 5 minutes\n/usr/local/bin/backup.sh --all\n', 'student')
              })
            })
          }),
          opt: d('755', {
            backup: d('777', {
              'backup.sh': f('777', '#!/bin/sh\ntar czf /var/backups/home.tgz /home\n', 'student')
            })
          }),
          root: d('700', {
            'flag.txt': f('600', 'root only. you should not be reading this yet.\nSARVAM{root_tier}\n')
          }),
          home: d('755', {
            student: d('755', {
              'notes.txt': f('644', 'checked sudo -l already\ncron.d looked odd\n')
            })
          })
        }),
        tasks: [
          {
            id: 't1',
            prompt: 'Your sudo rule allows one program as root with no password. Which binary?',
            hint: 'sudo -l',
            answer: 'vim'
          },
          {
            id: 't2',
            prompt: 'A root cron job runs a script stored in a directory students can write to. Give the script path.',
            hint: 'ls -l /etc/cron.d and /opt/backup',
            answer: '/opt/backup/backup.sh'
          },
          {
            id: 't3',
            prompt: 'The setuid helper reads a config you can edit. Submit the flag inside that config.',
            hint: '/usr/bin/sysinfo reads /etc/sysinfo.conf',
            answer: 'SARVAM{writable_config_escalation}'
          }
        ]
      },
      cards: [
        { front: 'What does sudo -l tell you?', back: 'Which commands your user may run as another user, and whether a NOPASSWD rule removes the password prompt.' },
        { front: 'Why is a world-writable script run by root cron an escalation?', back: 'Root executes the file on a schedule, so whatever you write into it runs as root without any exploit.' },
        { front: 'How does a setuid binary become an escalation vector?', back: 'It runs with its owner rights (often root). If it reads or executes something you control, you control that root context.' }
      ]
    },
    {
      id: 'p5-web',
      title: 'Injection and broken access control',
      sub: 'SQL injection, IDOR and path traversal from the command line',
      minutes: 25,
      labType: 'terminal',
      concept: `
<h2>Three bugs that still pay bounties in 2026</h2>
<h3>1. SQL injection</h3>
<p>Input becomes code. A quote in a parameter either breaks the query or, worse, extends it:</p>
<pre><code>curl "http://shop.lab/products.php?id=1'"
curl "http://shop.lab/products.php?id=1 UNION SELECT username,password FROM users"</code></pre>
<p>Fix: parameterised queries. Every language has them, and string concatenation is the bug.</p>

<h3>2. IDOR, broken object level authorisation</h3>
<p>The endpoint authenticates you but never checks that the object is yours:
<code>/invoice?id=1002</code> returns someone else's invoice because the code only does
<code>SELECT ... WHERE id = ?</code>. Fix: check ownership on every object read, server side.</p>

<h3>3. Path traversal</h3>
<p><code>/download?file=../../etc/passwd</code> lets the input escape the intended directory. Fix: resolve
the path, then verify it is still inside the base directory, and better, never pass user input to a file
path at all.</p>
<div class="callout">All three are the same underlying mistake: trusting input, or trusting that the caller
is allowed to do what they asked. Test them by hand before you reach for a scanner.</div>
`,
        lab: {
          startCwd: '/home/student',
          intro: 'A small shop is running on this network. Break it three ways, by hand, with curl.',
          fs: d('755', { home: d('755', { student: d('755', {}) }) }),
          net: {
            myIp: '10.10.14.23',
            prefix: 24,
            gateway: '10.10.14.1',
            dns: '10.10.14.2',
            hosts: [
              {
                ip: '10.10.14.60',
                name: 'shop.lab',
                ports: [
                  {
                    port: 80,
                    state: 'open',
                    svc: 'http',
                    version: 'nginx 1.18.0',
                    web: {
                      '/': 'Corner Shop. Products, one invoice endpoint, one download endpoint.',
                      '/products.php?id=1': 'Product 1: coffee, 4.50',
                      "/products.php?id=1'": 'You have an error in your SQL syntax near \'1\'\' at line 1. FLAG: SARVAM{quote_breaks_the_query}',
                      '/products.php?id=*': 'Product result. Query executed, rows returned.',
                      '/invoice?id=1001': 'Invoice 1001. Customer: you. Total 4.50',
                      '/invoice?id=1002': 'Invoice 1002. Customer: A. Silva. Total 399.00. FLAG: SARVAM{idor_other_customer}',
                      '/invoice?id=*': 'Invoice not found.',
                      '/download?file=terms.txt': 'Terms and conditions.',
                      '/download?file=../../etc/passwd': 'root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nFLAG: SARVAM{traversal_reaches_etc}'
                    }
                  }
                ]
              }
            ]
          },
          tasks: [
            {
              id: 't1',
              prompt: 'Break the product query with a single quote and submit the flag from the error.',
              hint: 'curl "http://shop.lab/products.php?id=1\'"',
              answer: 'SARVAM{quote_breaks_the_query}'
            },
            {
              id: 't2',
              prompt: 'Read the invoice that belongs to another customer. Submit its flag.',
              hint: '/invoice?id=1001 is yours. Try 1002.',
              answer: 'SARVAM{idor_other_customer}'
            },
            {
              id: 't3',
              prompt: 'Use the download endpoint to escape its directory and read /etc/passwd. Submit that flag.',
              hint: 'file=../../etc/passwd',
              answer: 'SARVAM{traversal_reaches_etc}'
            }
          ]
        },
        cards: [
          { front: 'What is the fix for SQL injection?', back: 'Parameterised queries, so input is data and never part of the SQL text. Escaping alone is fragile.' },
          { front: 'What makes an IDOR possible?', back: 'The endpoint checks that you are logged in but not that the requested object belongs to you, so changing an id returns someone else\'s data.' },
          { front: 'How do you prevent path traversal?', back: 'Resolve the requested path against a fixed base directory and reject anything that escapes it. Better still, never build file paths from user input.' }
        ]
      }
  ]
};

export const PHASE_06 = {
  id: 'phase-06',
  num: '06',
  title: 'Detection: read the wreckage',
  meta: 'the defensive half nobody skips for long',
  lessons: [
    {
      id: 'p6-detect',
      title: 'Find the intruder in the logs',
      sub: 'Turn noise into a timeline with grep, cut and sort',
      minutes: 22,
      labType: 'terminal',
      concept: `
<h2>Logs are a database with no schema</h2>
<p>An analyst answers three questions: who, how, and what did they take. On a Linux web server that means
correlating two files.</p>
<pre><code>grep 'Union' access.log
grep -c 'Failed password' auth.log
awk-style counting with cut | sort | uniq -c</code></pre>
<p>This shell gives you <code>grep</code>, <code>cut</code>, <code>sort</code> and <code>uniq -c</code>
instead of awk, which is enough:</p>
<pre><code>grep 'Failed password' auth.log | cut -d' ' -f11 | sort | uniq -c | sort -nr</code></pre>

<h3>Signals that survive a real investigation</h3>
<ul>
  <li>A single IP producing many 4xx or 500 responses, then one 200.</li>
  <li>A user agent that is a tool, not a browser: <code>sqlmap</code>, <code>curl</code>, <code>nikto</code>.</li>
  <li>A successful login from an address that never logged in before, followed by <code>sudo</code>.</li>
  <li>A new file in an upload directory, then requests to it with a <code>cmd=</code> parameter.</li>
</ul>
<div class="callout warn">Always answer with evidence: a timestamp, a line, and what it means. "Suspicious
traffic" is not a finding.</div>
`,
      lab: {
        startCwd: '/home/student',
        intro: 'web01 was compromised yesterday. Two logs are on this box. Build the story and grab the flags.',
        fs: d('755', {
          var: d('755', {
            log: d('755', {
              'nginx/access.log': f('644', [
                '10.10.14.31 - - [04/Nov/2026:21:02:11 +0000] "GET / HTTP/1.1" 200 512 "-" "Mozilla/5.0"',
                '10.10.14.44 - - [04/Nov/2026:21:03:00 +0000] "GET / HTTP/1.1" 200 512 "-" "Mozilla/5.0"',
                "10.10.14.31 - - [04/Nov/2026:21:03:41 +0000] \"GET /products.php?id=1+UNION+SELECT+username,password+FROM+users HTTP/1.1\" 200 904 \"-\" \"sqlmap/1.7\"",
                '10.10.14.31 - - [04/Nov/2026:21:05:55 +0000] "POST /admin/upload.php HTTP/1.1" 200 88 "-" "Mozilla/5.0"',
                '10.10.14.31 - - [04/Nov/2026:21:07:02 +0000] "GET /uploads/shell.php?cmd=id HTTP/1.1" 200 118 "-" "curl/7.81.0"',
                '10.10.14.31 - - [04/Nov/2026:21:09:44 +0000] "GET /uploads/shell.php?cmd=cat+/etc/shadow HTTP/1.1" 200 745 "-" "curl/7.81.0"',
                '10.10.14.44 - - [04/Nov/2026:22:14:40 +0000] "GET /products.php?id=2 HTTP/1.1" 200 790 "-" "Mozilla/5.0"'
              ].join('\n')),
              'auth.log': f('644', [
                'Nov  4 21:07:30 web01 sshd[8140]: Accepted password for www-data from 10.10.14.31 port 44210 ssh2',
                'Nov  4 21:08:02 web01 sudo: www-data : TTY=pts/2 ; PWD=/var/www ; USER=root ; COMMAND=/bin/bash',
                'Nov  4 21:12:44 web01 sshd[8210]: Failed password for root from 10.10.14.44 port 51500 ssh2',
                'Nov  4 21:12:47 web01 sshd[8210]: Connection closed by 10.10.14.44 port 51500 [preauth]'
              ].join('\n'))
            })
          }),
          tmp: d('1777', {
            'iocs.txt': f('666', 'analyst scratchpad\n\nfirst seen 21:03 — SARVAM{timeline_matters}\n', 'student')
          })
        }),
        tasks: [
          {
            id: 't1',
            prompt: 'Which IP address carried out the web attack? One address.',
            hint: 'Look for the tool user agent, then the 500 followed by 200s.',
            answer: '10.10.14.31'
          },
          {
            id: 't2',
            prompt: 'Which account was compromised and then escalated to root?',
            hint: 'grep sudo /var/log/auth.log',
            answer: 'www-data'
          },
          {
            id: 't3',
            prompt: 'The attacker left a web shell. Give its path as it appears in the log.',
            hint: 'grep shell /var/log/nginx/access.log',
            answer: '/uploads/shell.php'
          },
          {
            id: 't4',
            prompt: 'Read the scratchpad and submit the flag.',
            hint: 'cat /tmp/iocs.txt',
            answer: 'SARVAM{timeline_matters}'
          }
        ]
      },
      cards: [
        { front: 'What is the first pivot when investigating a web compromise?', back: 'The access log: find the scanning tool user agent, then the requests that changed status from error to success.' },
        { front: 'Why correlate access.log with auth.log?', back: 'The web log shows the entry point, the auth log shows which account was used and whether it escalated, giving you the timeline.' },
        { front: 'What makes an IOC actionable?', back: 'A specific value (IP, path, account) tied to a timestamp and its meaning, so someone else can hunt for it.' }
      ]
    }
  ]
};
