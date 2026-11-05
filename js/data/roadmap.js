/**
 * The 12-week "Zero to Intern-Ready" roadmap, turned into a game.
 * Each week is a LEVEL. A level has:
 *   missions  : the daily checklist (learn / build), tick to earn XP
 *   resources : Hindi videos + practice platforms from the roadmap PDF
 *   map       : the Aman Hardikar mind map that unlocks with it
 *   lab       : an in-browser boss fight. Passing it clears the level.
 *   deliverable: the proof-of-work artifact the roadmap asks for
 */

export const MINDMAPS = {
  practice: { name: 'Hacking Practice Lab', url: 'https://amanhardikar.com/mindmaps/Practice.html', why: 'Every legal place to practise hacking: CTFs, labs, vulnerable VMs.' },
  webapp: { name: 'Web Application Testing', url: 'https://amanhardikar.com/mindmaps.html', why: 'OWASP-aligned methodology, mirrors the PortSwigger structure.' },
  vms: { name: 'VMs and LiveCDs', url: 'https://amanhardikar.com/mindmaps/VMsandLiveCDs.html', why: 'Build your own lab with VirtualBox and Kali.' },
  crypto: { name: 'Cryptography', url: 'https://amanhardikar.com/mindmaps/Cryptography.html', why: 'Ciphers, hashes, signatures.' },
  plugins: { name: 'Useful Browser Plugins', url: 'https://amanhardikar.com/mindmaps.html', why: 'A tester\'s browser toolkit.' },
  infra: { name: 'Infrastructure Testing', url: 'https://amanhardikar.com/mindmaps.html', why: 'External and internal pentest methodology and interview vocabulary.' },
  tests: { name: 'Security Tests', url: 'https://amanhardikar.com/mindmaps.html', why: 'Test taxonomy: how security teams think.' },
  code: { name: 'Code Review', url: 'https://amanhardikar.com/mindmaps/CodeReview.html', why: 'Static review checklist; ties into your AI report tool story.' }
};

const yt = (path) => 'https://www.youtube.com/' + path;

export const RES = {
  ccna: { kind: 'hindi', title: 'CCNA Complete Course in Hindi', note: 'devices, TCP/IP model, IP addressing, DNS', url: yt('playlist?list=PLOM-D22SZwwo') },
  netDay: { kind: 'hindi', title: 'Computer Networking, Beginner to Expert', note: 'day-by-day CCNA series', url: yt('playlist?list=PL06c-CGnZxJF5X9yS-3K7KqrajLNCmg81') },
  netShort: { kind: 'hindi', title: 'Networking Tutorial for Beginners', note: 'short concept videos, good for revision', url: yt('playlist?list=PLGNEe5-WlIvBGZypQrAN22OjJnzZCqufX') },
  linuxCmds: { kind: 'hindi', title: 'All basic Linux commands (Hindi)', note: 'the commands you will type every day', url: yt('watch?v=IePI7jhzMbE') },
  thmHindi: { kind: 'hindi', title: 'TryHackMe in Hindi, room walkthroughs', note: 'TryHackMe Cyber Training by SAJID', url: yt('playlist?list=PLEHNxcSZPBiqPpRMrBBzh4nD4U64rYdsM') },
  powercert: { kind: 'english', title: 'PowerCert Animated Videos', note: 'optional: animations make concepts land', url: yt('@PowerCert') },
  pyApna: { kind: 'hindi', title: 'Apna College: Python Full Course', note: 'pick ONE Python course, not all', url: yt('watch?v=Kfmj0DR-PB0') },
  pyZero: { kind: 'hindi', title: 'Python Zero to Hero in 4h 30m', note: 'alternative Python course', url: yt('watch?v=NCIeAaP4r4A') },
  pyHarry: { kind: 'hindi', title: 'CodeWithHarry: Python for Beginners', note: 'alternative, comes with notes', url: yt('watch?v=FStwWUkW5RQ') },
  git: { kind: 'hindi', title: 'Git and GitHub Complete Course (68 min)', note: 'push every script the day you finish it', url: yt('watch?v=dWocvuN7Kz8') },
  owaspList: { kind: 'hindi', title: 'OWASP Top 10 Course [HINDI]', note: 'one video per vulnerability', url: yt('playlist?list=PLHOJoqBk02jTGXTPQJzSG8W5QxbojC2Ai') },
  owaspOne: { kind: 'hindi', title: 'OWASP Top 10 in one video', note: 'good first overview', url: yt('watch?v=HE244moNuXE') },
  burpList: { kind: 'hindi', title: 'Burp Suite Full Course 2025 [Hindi]', note: 'from install through the Proxy tab', url: yt('playlist?list=PLl00VsGSqbtw_nJJhDt70BbkTN3B1gYIo') },
  burpSetup: { kind: 'hindi', title: 'Burp Suite setup and configuration', note: 'proxy and browser certificate', url: yt('watch?v=_JohLt1XSl4') },
  bounty: { kind: 'hindi', title: 'Bug Bounty Course (Hindi)', note: 'blind SQLi, XXE, Burp Suite', url: yt('playlist?list=PLh6v0AqEGX006-43_XWKSLFHExmz9dNe7') },
  hackFull: { kind: 'hindi', title: 'Cybersecurity / Hacking Course, Beginner to Advance', note: 'theory plus practical', url: yt('playlist?list=PLIysJy4MPCAZLdOfbWN7OtUjoz1YTG_nQ') },
  ethical: { kind: 'hindi', title: 'Ethical Hacking Full Course (Python + networking)', note: 'watch only the scanning and Python parts', url: yt('playlist?list=PLUuC5nj43wrIAhfr7D8xH4h_N_WLtLpQI') },
  cryptoHindi: { kind: 'hindi', title: 'Cryptography Simply Explained in Hindi', note: 'hashing vs encryption', url: yt('watch?v=guL8OeYIz0U') },
  thmPre: { kind: 'platform', title: 'TryHackMe: Pre Security path', note: 'free, complete the networking modules', url: 'https://tryhackme.com/path/outline/presecurity' },
  thmLinux: { kind: 'platform', title: 'TryHackMe: Linux Fundamentals 1 to 3', note: 'free', url: 'https://tryhackme.com/room/linuxfundamentalspart1' },
  bandit: { kind: 'platform', title: 'OverTheWire: Bandit (levels 0 to 15)', note: 'a command-line game that teaches Linux', url: 'https://overthewire.org/wargames/bandit/' },
  thmOwasp: { kind: 'platform', title: 'TryHackMe: OWASP Top 10 room', note: 'free', url: 'https://tryhackme.com/room/owasptop10' },
  portswigger: { kind: 'platform', title: 'PortSwigger Web Security Academy', note: 'free, English only, do the apprentice labs', url: 'https://portswigger.net/web-security' },
  psSqli: { kind: 'platform', title: 'PortSwigger: SQL injection labs', note: 'apprentice level', url: 'https://portswigger.net/web-security/sql-injection' },
  psXss: { kind: 'platform', title: 'PortSwigger: Cross-site scripting labs', note: 'apprentice level', url: 'https://portswigger.net/web-security/cross-site-scripting' },
  owaspRef: { kind: 'platform', title: 'OWASP Top Ten (official)', note: 'the reference', url: 'https://owasp.org/www-project-top-ten/' },
  groq: { kind: 'platform', title: 'Groq console (free API tier)', note: 'for the Security Report Assistant', url: 'https://console.groq.com' },
  overleaf: { kind: 'platform', title: 'Overleaf resume templates', note: 'or Canva', url: 'https://www.overleaf.com/latex/templates' },
  internshala: { kind: 'platform', title: 'Internshala: cyber security internships', note: 'highest volume for Indian students', url: 'https://internshala.com/internships/cybersecurity-internship/' },
  encryptedge: { kind: 'platform', title: 'EncryptEdge Labs', note: '8-week structured remote internships', url: 'https://internships.encryptedge.com' },
  prosple: { kind: 'platform', title: 'Prosple India: cyber security internships', note: 'many remote', url: 'https://in.prosple.com/cyber-security-internships-india' },
  wellfound: { kind: 'platform', title: 'Wellfound', note: 'early-stage security startups', url: 'https://wellfound.com' }
};

const d = (mode, children, owner = 'root') => ({ type: 'dir', mode, owner, children });
const f = (mode, content, owner = 'root') => ({ type: 'file', mode, owner, content });
const home = (children) => d('755', { home: d('755', { student: d('755', children, 'student') }) });

const AUTH = [
  'Nov  4 02:14:07 web01 sshd[2211]: Failed password for invalid user admin from 203.0.113.44 port 51884 ssh2',
  'Nov  4 02:14:09 web01 sshd[2213]: Failed password for invalid user oracle from 203.0.113.44 port 51902 ssh2',
  'Nov  4 02:14:11 web01 sshd[2215]: Failed password for invalid user test from 203.0.113.44 port 51930 ssh2',
  'Nov  4 02:14:21 web01 sshd[2221]: Accepted password for svc-backup from 203.0.113.44 port 52014 ssh2',
  'Nov  4 09:02:11 web01 sshd[3310]: Accepted publickey for deploy from 198.51.100.9 port 44210 ssh2',
  'Nov  4 14:03:18 web01 sshd[5122]: Failed password for invalid user ftp from 45.155.205.233 port 60122 ssh2',
  'Nov  4 14:03:25 web01 sshd[5124]: Failed password for invalid user ftp from 45.155.205.233 port 60124 ssh2'
].join('\n');

const APP_LOG = [
  '2026-11-04 10:00:01 INFO  server started',
  '2026-11-04 10:02:13 ERROR database timeout',
  '2026-11-04 10:02:40 WARN  slow query 2.4s',
  '2026-11-04 10:05:09 ERROR database timeout',
  '2026-11-04 10:07:33 ERROR auth failure for user=ravi',
  '2026-11-04 10:09:12 INFO  request ok',
  '2026-11-04 10:11:50 ERROR disk almost full',
  '2026-11-04 10:12:31 ERROR database timeout',
  '2026-11-04 10:14:00 WARN  retrying connection'
].join('\n');

const web = (pairs) => pairs;

export const WEEKS = [
  /* ===================================================================== WEEK 1 */
  {
    id: 'w01',
    week: 1,
    phase: 1,
    phaseName: 'Foundations: Networking, Linux, Python',
    title: 'How the internet really works',
    sub: 'URL to packet, ports and protocols',
    minutes: 90,
    boss: 'The Packet Gate',
    deliverable: 'Cheat sheet v1: common ports and protocols',
    map: 'practice',
    concept: `
<h2>Interview question #1: what happens when you type a URL?</h2>
<p>This single question appears in almost every beginner security interview. Answer it as a chain, each link feeding the next:</p>
<pre><code>1. Browser checks its cache, then asks DNS: "what IP is example.com?"
2. DNS answers with an IP address (say 93.184.216.34)
3. TCP three-way handshake with that IP on port 443
      SYN  ->    SYN-ACK  <-    ACK  ->
4. TLS handshake (for HTTPS) agrees on encryption keys
5. Browser sends an HTTP request:  GET / HTTP/1.1
6. Server replies with a response: 200 OK + HTML
7. Browser renders the page</code></pre>

<h3>Ports and protocols you must know cold</h3>
<table class="mini">
<tr><th>Port</th><th>Protocol</th><th>What it does</th></tr>
<tr><td>20/21</td><td>FTP</td><td>file transfer (cleartext)</td></tr>
<tr><td>22</td><td>SSH</td><td>encrypted remote shell</td></tr>
<tr><td>23</td><td>Telnet</td><td>remote shell, cleartext (never use)</td></tr>
<tr><td>25</td><td>SMTP</td><td>sending email</td></tr>
<tr><td>53</td><td>DNS</td><td>names to IPs (UDP mostly)</td></tr>
<tr><td>80</td><td>HTTP</td><td>web, cleartext</td></tr>
<tr><td>443</td><td>HTTPS</td><td>web, encrypted</td></tr>
<tr><td>3306</td><td>MySQL</td><td>database</td></tr>
</table>

<h3>TCP vs UDP in one breath</h3>
<p><strong>TCP</strong> is reliable and ordered: it does the handshake and resends lost data (web, SSH, email).
<strong>UDP</strong> just sends: fast, no guarantees (DNS, video calls, games).</p>
<div class="callout">Golden rule from the roadmap: never spend a day only watching. Today you type: build the ports cheat sheet in the lab below.</div>
`,
    missions: [
      { id: 'm1', kind: 'learn', text: 'Watch 2 videos of a Hindi networking playlist (CCNA or the beginner series)' },
      { id: 'm2', kind: 'learn', text: 'TryHackMe Pre Security: finish the networking modules' },
      { id: 'm3', kind: 'build', text: 'Write your ports and protocols cheat sheet by hand, not copied' },
      { id: 'm4', kind: 'build', text: 'Explain the TCP handshake out loud three ways (10-year-old, college student, interviewer)' }
    ],
    resources: ['ccna', 'netDay', 'netShort', 'thmPre', 'powercert'],
    ai: 'After every TryHackMe room, paste your notes into ChatGPT or Claude and say: "quiz me hard until I score 10/10."',
    lab: {
      startCwd: '/home/student',
      intro: 'Boss fight: The Packet Gate. The gate opens only for someone who can read the network. Scan, connect, and answer.',
      fs: home({ 'ports.md': f('644', '# my ports cheat sheet\n(write it here)\n', 'student') }),
      net: {
        myIp: '10.10.14.23', prefix: 24, gateway: '10.10.14.1', dns: '10.10.14.2',
        hosts: [
          {
            ip: '10.10.14.77', name: 'gate.lab',
            ports: [
              { port: 22, state: 'open', svc: 'ssh', version: 'OpenSSH 8.9' },
              { port: 53, state: 'open', svc: 'domain', version: 'dnsmasq 2.86' },
              { port: 80, state: 'open', svc: 'http', version: 'nginx 1.18.0', web: { '/': 'Packet Gate. The key is behind the web port.', '/key': 'FLAG: SARVAM{w1_packet_gate_open}' } },
              { port: 3306, state: 'open', svc: 'mysql', version: 'MySQL 8.0' }
            ]
          }
        ]
      },
      tasks: [
        { id: 't1', prompt: 'Which port on gate.lab is the encrypted remote shell service? Number only.', hint: 'nmap -sV 10.10.14.77', answer: '22' },
        { id: 't2', prompt: 'The DNS server listens on which port? Number only.', hint: 'nmap -sV 10.10.14.77', answer: '53' },
        { id: 't3', prompt: 'Use curl on the web port to fetch /key and submit the flag.', hint: 'curl http://gate.lab/key', answer: 'SARVAM{w1_packet_gate_open}' }
      ]
    },
    cards: [
      { front: 'What happens when you type a URL and press Enter?', back: 'DNS resolves the name to an IP, TCP three-way handshake, (TLS for HTTPS), HTTP request, server response, browser renders.' },
      { front: 'What are the three steps of the TCP handshake?', back: 'SYN (client), SYN-ACK (server), ACK (client). After that the connection is established.' },
      { front: 'Port numbers for SSH, HTTP, HTTPS, DNS, FTP?', back: 'SSH 22, HTTP 80, HTTPS 443, DNS 53, FTP 21 (control).' }
    ]
  },

  /* ===================================================================== WEEK 2 */
  {
    id: 'w02',
    week: 2,
    phase: 1,
    phaseName: 'Foundations: Networking, Linux, Python',
    title: 'Linux, from a blank prompt',
    sub: 'cd, ls, cat, grep, chmod, users, processes',
    minutes: 90,
    boss: 'The Locked Server',
    deliverable: 'Linux cheat sheet, rebuilt from memory + Bandit 0 to 15',
    map: 'practice',
    concept: `
<h2>Linux is the language of the job</h2>
<p>Servers, security tools, CTF boxes: all Linux. You do not need to know everything. You need ten commands to be automatic.</p>
<pre><code>pwd                 where am I?
ls -la              what is here, including hidden files and permissions
cd /var/log         move around
cat file.txt        print a file
less file.txt       page through a long file
grep -i error log   find lines containing "error"
chmod 600 secret    owner can read and write, nobody else
whoami / id         who am I and what groups
ps                  what is running
find / -name "*.conf"   search the filesystem</code></pre>

<h3>Permissions in one picture</h3>
<pre><code>-rwxr-xr--   1 student devs   notes.sh
 |\\_/\\_/\\_/
 | |  |  +-- others: r--  (4)
 | |  +----- group:  r-x  (5)
 | +-------- owner:  rwx  (7)    =>  chmod 754 notes.sh
 +---------- type: - file, d directory</code></pre>

<h3>The rebuild test</h3>
<p>At the end of this week, close everything and rebuild your Linux cheat sheet from memory. That rebuild is the actual test. Whatever you cannot write down is what you review.</p>
<div class="callout warn">If you are stuck on a Bandit level for more than 20 minutes, ask AI for a hint, not the answer.</div>
`,
    missions: [
      { id: 'm1', kind: 'learn', text: 'Hindi Linux commands video + Kali basics' },
      { id: 'm2', kind: 'learn', text: 'TryHackMe Linux Fundamentals parts 1, 2, 3' },
      { id: 'm3', kind: 'build', text: 'Bandit levels 0 to 15 on OverTheWire' },
      { id: 'm4', kind: 'build', text: 'Rebuild your one-page Linux cheat sheet from memory' }
    ],
    resources: ['linuxCmds', 'thmLinux', 'bandit', 'thmHindi'],
    ai: 'Stuck on a Bandit level more than 20 minutes? Ask AI for a hint, not the answer.',
    lab: {
      startCwd: '/home/student',
      intro: 'Boss fight: The Locked Server. A passwordless note, a hidden file, and a permission bug stand between you and the flag.',
      fs: d('755', {
        home: d('755', {
          student: d('755', {
            'readme.txt': f('644', 'Welcome. The vault key is not here.\nLook for hidden things.\n', 'student'),
            '.hidden_note': f('644', 'You found a dotfile. The flag is split: SARVAM{w2_ + the rest is in /srv/vault/key.txt\n', 'student'),
            logs: d('755', { 'app.log': f('644', APP_LOG, 'student') }, 'student')
          }, 'student')
        }),
        srv: d('755', { vault: d('755', { 'key.txt': f('600', 'locked_server_open}\n', 'student') }) })
      }),
      tasks: [
        { id: 't1', prompt: 'List ALL files in your home directory including hidden ones. Which hidden file is there?', hint: 'ls -a', answer: '.hidden_note' },
        { id: 't2', prompt: 'How many ERROR lines are in logs/app.log? Number only.', hint: 'grep -c ERROR logs/app.log', answer: '5' },
        { id: 't3', prompt: 'Read the hidden note and /srv/vault/key.txt, then submit the full flag.', hint: 'cat .hidden_note ; cat /srv/vault/key.txt', answer: 'SARVAM{w2_locked_server_open}' }
      ]
    },
    cards: [
      { front: 'What does chmod 600 file do?', back: 'Owner can read and write; group and others get nothing. Right for private keys and secrets.' },
      { front: 'Command to find every line containing "error", ignoring case?', back: 'grep -i error file   (add -r to search a whole directory tree).' },
      { front: 'What does ls -la show that ls does not?', back: 'Hidden files (dotfiles) and the long format with permissions, owner and size.' }
    ]
  },

  /* ===================================================================== WEEK 3 */
  {
    id: 'w03',
    week: 3,
    phase: 1,
    phaseName: 'Foundations: Networking, Linux, Python',
    title: 'Python for automation, part 1',
    sub: 'Script 1: the website status checker',
    minutes: 90,
    boss: 'The Status Checker',
    deliverable: 'GitHub repo #1: website status checker with README',
    map: 'practice',
    concept: `
<h2>Python is the most internship-relevant skill here</h2>
<p>You are not learning Python to become a programmer. You are learning it to <strong>automate boring security work</strong>: checking sites, parsing logs, scanning ports.</p>
<pre><code># variables, lists, dicts, loops, functions
urls = ["a.com", "b.com"]
status = {}
for u in urls:
    status[u] = "UP"

def check(code):
    if code == 200:
        return "UP"
    else:
        return "DOWN"

print(check(200))      # UP</code></pre>

<h3>Script 1 for real: website status checker</h3>
<p>Read URLs from a text file and print UP or DOWN with the response code. With the real <code>requests</code> library it is:</p>
<pre><code>import requests
for line in open("urls.txt").read().split("\\n"):
    if line.strip() != "":
        r = requests.get("https://" + line, timeout=5)
        print(line, r.status_code, "UP" if r.status_code == 200 else "DOWN")</code></pre>
<p>In this lab there is no real internet, so a <code>codes.txt</code> file stands in for the server answers.
The logic you write (loop, file, conditional, print) is exactly the real script.</p>

<h3>Day 1 of this week: create your GitHub account</h3>
<p>Push each script the same day you finish it, with a README that says what it does and how to run it. Practise the commands below in the lab: <code>git init</code>, <code>git add</code>, <code>git commit</code>.</p>
<div class="callout">Use AI as a debugging partner: paste the error and the code and say "guide me without telling me the fix." You must be able to explain every line you commit.</div>
`,
    missions: [
      { id: 'm1', kind: 'learn', text: 'Create your GitHub account (Day 1 of this week)' },
      { id: 'm2', kind: 'learn', text: 'Pick ONE Hindi Python course and start it' },
      { id: 'm3', kind: 'build', text: 'Write Script 1: website status checker (URLs from a file, print UP/DOWN + code)' },
      { id: 'm4', kind: 'build', text: 'Push it to GitHub with a README the same day' }
    ],
    resources: ['pyApna', 'pyZero', 'pyHarry', 'git'],
    ai: 'Debug partner: "here is my error, guide me, do not give the fix." Then ask what a professional would improve.',
    lab: {
      startCwd: '/home/student',
      intro: 'Boss fight: The Status Checker. Write status.py that reads codes.txt (format: site code) and prints UP or DOWN per line. Then commit it. Hint: echo "line1\\nline2" > status.py',
      fs: home({
        'codes.txt': f('644', 'alpha.lab 200\nbeta.lab 500\ngamma.lab 200\ndelta.lab 404\n', 'student'),
        'README.md': f('644', '# status checker\n', 'student')
      }),
      tasks: [
        { id: 't1', prompt: 'Create status.py and run it so it prints "alpha.lab UP" for the first line. Submit the first line of its output.', hint: `printf '%s\\n' "for line in open('codes.txt').read().split('\\n'):" "    if line != '':" "        p = line.split(' ')" "        if p[1] == '200':" "            print(p[0], 'UP')" "        else:" "            print(p[0], 'DOWN')" > status.py ; python status.py`, answer: 'alpha.lab UP', check: { fileRuns: 'status.py', outputIncludes: 'alpha.lab UP' } },
        { id: 't2', prompt: 'How many sites are DOWN according to your script output? Number only.', hint: 'python status.py | grep -c DOWN', answer: '2', check: { fileRuns: 'status.py', outputIncludes: 'beta.lab DOWN' } },
        { id: 't3', prompt: 'Commit your work: git init, git add ., git commit -m "status checker". Submit the 7-character commit id it prints.', hint: 'git init ; git add . ; git commit -m "status checker"', answer: '*', check: { gitCommit: true } }
      ]
    },
    cards: [
      { front: 'What makes a good first security script?', back: 'Small, single-purpose, reads input from a file, prints clear output, and has a README. Status checker, log analyzer and subdomain finder are the classic trio.' },
      { front: 'Why push each script to GitHub the same day?', back: 'Proof of work. Recruiters read GitHub; a visible history shows initiative and consistency.' },
      { front: 'How to ask AI for debugging help without cheating yourself?', back: 'Paste the error and code and say "guide me, do not give the fix". Then ask what a professional would improve.' }
    ]
  },

  /* ===================================================================== WEEK 4 */
  {
    id: 'w04',
    week: 4,
    phase: 1,
    phaseName: 'Foundations: Networking, Linux, Python',
    title: 'Python for automation, part 2',
    sub: 'Scripts 2 and 3: log analyzer and subdomain finder',
    minutes: 90,
    boss: 'The Log Beast',
    deliverable: 'GitHub repos #2 and #3, three scripts total',
    map: 'practice',
    concept: `
<h2>Dictionaries are the security analyst's best friend</h2>
<p>Counting things is 80% of log analysis. A dictionary maps a key to a count:</p>
<pre><code>counts = {}
for line in open("app.log").read().split("\\n"):
    if "ERROR" in line:
        counts["ERROR"] = counts.get("ERROR", 0) + 1
print(counts)</code></pre>

<h3>Script 2: log analyzer</h3>
<p>Read a log, count each level (INFO, WARN, ERROR), print a summary. Real analysts then pivot on the biggest bucket.</p>

<h3>Script 3: subdomain finder</h3>
<p>Take a list of common subdomains (<code>www</code>, <code>mail</code>, <code>dev</code>, <code>admin</code>) and a domain, and report which ones resolve. Real version:</p>
<pre><code>import requests
for sub in ["www", "dev", "admin"]:
    try:
        requests.get("http://" + sub + ".example.com", timeout=2)
        print(sub, "resolves")
    except:
        pass</code></pre>
<p>In the lab, <code>resolved.txt</code> plays the role of the DNS answers.</p>
<div class="callout">Milestone by the end of this week: three working scripts on GitHub, your own two cheat sheets, and the Pre Security networking modules done. You are now ahead of most second-year students.</div>
`,
    missions: [
      { id: 'm1', kind: 'learn', text: 'Python: requests library and file handling' },
      { id: 'm2', kind: 'build', text: 'Script 2: log analyzer (count error types, print a summary)' },
      { id: 'm3', kind: 'build', text: 'Script 3: subdomain finder (check a wordlist, report what resolves)' },
      { id: 'm4', kind: 'build', text: 'Push both with READMEs. That is repos #2 and #3' }
    ],
    resources: ['pyApna', 'git'],
    ai: 'Ask: "what would a professional improve in this script?" That is how you pick up style, error handling and structure.',
    lab: {
      startCwd: '/home/student',
      intro: 'Boss fight: The Log Beast. Write analyze.py to count levels in app.log, and find.py to list subdomains from words.txt that appear in resolved.txt.',
      fs: home({
        'app.log': f('644', APP_LOG, 'student'),
        'words.txt': f('644', 'www\nmail\ndev\nadmin\nstaging\nvpn\n', 'student'),
        'resolved.txt': f('644', 'www\ndev\nvpn\n', 'student')
      }),
      tasks: [
        { id: 't1', prompt: 'Write analyze.py that prints "ERROR 5" style counts. Submit the number of ERROR lines your script reports.', hint: `printf '%s\\n' "c = {}" "for l in open('app.log').read().split('\\n'):" "    if l != '':" "        lvl = l.split(' ')[2]" "        c[lvl] = c.get(lvl, 0) + 1" "for k, v in c.items():" "    print(k, v)" > analyze.py ; python analyze.py`, answer: '5', check: { fileRuns: 'analyze.py', outputIncludes: 'ERROR 5' } },
        { id: 't2', prompt: 'Write find.py that prints each wordlist entry that appears in resolved.txt. Submit how many resolve.', hint: `printf '%s\\n' "res = open('resolved.txt').read()" "for w in open('words.txt').read().split('\\n'):" "    if w != '' and w in res:" "        print(w)" > find.py ; python find.py`, answer: '3', check: { fileRuns: 'find.py', outputLines: 3 } },
        { id: 't3', prompt: 'Which subdomain from the wordlist did NOT resolve and sounds like an internal admin panel? One word.', hint: 'compare words.txt and resolved.txt', answer: 'admin' }
      ]
    },
    cards: [
      { front: 'Why are dictionaries ideal for log analysis?', back: 'You count events per key (level, IP, user) in one pass with counts[key] = counts.get(key, 0) + 1.' },
      { front: 'What does a subdomain finder tell an attacker or defender?', back: 'Forgotten hosts such as dev, staging, admin and vpn that enlarge the attack surface.' },
      { front: 'What goes in a good README for a script?', back: 'What it does, how to run it, an example output, and the limitations or legal note (own targets only).' }
    ]
  },

  /* ===================================================================== WEEK 5 */
  {
    id: 'w05',
    week: 5,
    phase: 2,
    phaseName: 'Web Security and Proof of Work',
    title: 'OWASP Top 10 and your first Burp session',
    sub: 'The most-asked interview topic',
    minutes: 90,
    boss: 'The Shop Breaker',
    deliverable: 'OWASP notes + first Burp Suite proxy session',
    map: 'webapp',
    concept: `
<h2>Explain these four things and you pass most first interviews</h2>
<h3>SQL injection</h3>
<p>User input becomes part of the SQL query. Attack: <code>id=1 UNION SELECT username,password FROM users</code>. Root cause: string concatenation. <strong>Fix: parameterised queries.</strong></p>
<h3>XSS (cross-site scripting)</h3>
<p><strong>Reflected:</strong> the payload is in the URL and bounces back. <strong>Stored:</strong> the payload is saved (a comment) and hits every visitor. <strong>Fix: output encoding</strong> so input is shown as text, never run.</p>
<h3>Broken authentication and access control</h3>
<p>Auth: weak passwords, no lockout, guessable sessions. Access control (IDOR): you are logged in, but change <code>?id=1001</code> to <code>1002</code> and read someone else's invoice. <strong>Fix: check ownership server side on every request.</strong></p>
<h3>Burp Suite</h3>
<p>An intercepting proxy: your browser talks to Burp, Burp talks to the site. You see and edit every request. Set the browser proxy to 127.0.0.1:8080, install Burp's certificate, then use the Proxy tab.</p>
<div class="callout warn">Test only systems you own or are explicitly allowed to test. Labs like TryHackMe and PortSwigger exist for exactly this.</div>
`,
    missions: [
      { id: 'm1', kind: 'learn', text: 'Hindi OWASP Top 10 playlist (one video per vulnerability)' },
      { id: 'm2', kind: 'learn', text: 'TryHackMe OWASP Top 10 room' },
      { id: 'm3', kind: 'build', text: 'First Burp Suite proxy session (Hindi Burp playlist)' },
      { id: 'm4', kind: 'build', text: 'Write your OWASP one-liners cheat sheet' }
    ],
    resources: ['owaspList', 'owaspOne', 'burpList', 'burpSetup', 'thmOwasp', 'owaspRef'],
    ai: 'After each lab ask AI: "make me explain the root cause like an interview answer."',
    lab: {
      startCwd: '/home/student',
      intro: 'Boss fight: The Shop Breaker. One shop, three classic bugs. Break each by hand with curl, then name the fix.',
      fs: home({ 'notes.md': f('644', '# OWASP notes\n', 'student') }),
      net: {
        myIp: '10.10.14.23', prefix: 24, gateway: '10.10.14.1', dns: '10.10.14.2',
        hosts: [
          {
            ip: '10.10.14.60', name: 'shop.lab',
            ports: [{
              port: 80, state: 'open', svc: 'http', version: 'nginx 1.18.0',
              web: {
                '/': 'Corner Shop. /products.php?id=, /invoice?id=, /search?q=',
                '/products.php?id=1': 'Product 1: coffee, 4.50',
                "/products.php?id=1'": "SQL syntax error near '1''. FLAG: SARVAM{w5_quote_breaks_query}",
                '/invoice?id=1001': 'Invoice 1001. Customer: you. Total 4.50',
                '/invoice?id=1002': 'Invoice 1002. Customer: A. Silva. Total 399.00. FLAG: SARVAM{w5_idor_other_invoice}',
                '/search?q=hello': 'Results for: hello',
                '/search?q=<script>alert(1)</script>': 'Results for: <script>alert(1)</script>  [reflected, not encoded] FLAG: SARVAM{w5_reflected_xss}'
              }
            }]
          }
        ]
      },
      tasks: [
        { id: 't1', prompt: 'Break the product query with a single quote and submit the flag.', hint: 'curl "http://shop.lab/products.php?id=1\'"', answer: 'SARVAM{w5_quote_breaks_query}' },
        { id: 't2', prompt: 'Read invoice 1002 (not yours). Submit its flag.', hint: 'curl "http://shop.lab/invoice?id=1002"', answer: 'SARVAM{w5_idor_other_invoice}' },
        { id: 't3', prompt: 'Send <script>alert(1)</script> as the search term and submit the flag.', hint: 'curl "http://shop.lab/search?q=<script>alert(1)</script>"', answer: 'SARVAM{w5_reflected_xss}' }
      ]
    },
    cards: [
      { front: 'SQL injection: root cause and fix?', back: 'Input is concatenated into the query so it becomes code. Fix: parameterised queries (prepared statements).' },
      { front: 'Reflected vs stored XSS?', back: 'Reflected: payload in the request bounces back once. Stored: payload is saved and runs for every visitor. Fix both with output encoding.' },
      { front: 'What is an IDOR?', back: 'Insecure direct object reference: the app trusts the id in the request and does not check the object belongs to the user. Fix: server-side ownership checks.' }
    ]
  },

  /* ===================================================================== WEEK 6 */
  {
    id: 'w06',
    week: 6,
    phase: 2,
    phaseName: 'Web Security and Proof of Work',
    title: 'PortSwigger apprentice labs',
    sub: 'SQL injection and XSS, solved by you',
    minutes: 90,
    boss: 'The Injection Vault',
    deliverable: 'All apprentice SQLi and XSS labs solved',
    map: 'webapp',
    concept: `
<h2>PortSwigger is where the interview answers come from</h2>
<p>Make a free account at the Web Security Academy and complete <strong>every apprentice lab</strong> in SQL injection and cross-site scripting. The interface is English-only and there is no reliable full Hindi walkthrough set, so use the Hindi OWASP and Burp playlists for the <em>concepts</em> and solve the labs yourself.</p>

<h3>The method that works every time</h3>
<ol>
<li>Find every place input enters (URL params, forms, headers, cookies).</li>
<li>Send a single quote <code>'</code>. Does the response change or error?</li>
<li>Work out the query shape: how many columns, which are text.</li>
<li>Use <code>UNION SELECT</code> to pull data you should not see.</li>
</ol>
<pre><code>' OR 1=1--                  login bypass pattern
' UNION SELECT NULL,NULL--  find the number of columns
' UNION SELECT username,password FROM users--</code></pre>
<div class="callout">If a lab takes more than 30 minutes, ask AI <em>which parameter to investigate</em>, not for the solution. That reasoning is what an interviewer probes.</div>
`,
    missions: [
      { id: 'm1', kind: 'learn', text: 'Create a free PortSwigger Web Security Academy account' },
      { id: 'm2', kind: 'build', text: 'Finish all apprentice SQL injection labs' },
      { id: 'm3', kind: 'build', text: 'Finish all apprentice XSS labs' },
      { id: 'm4', kind: 'build', text: 'After each lab, write the root cause as an interview answer' }
    ],
    resources: ['portswigger', 'psSqli', 'psXss', 'owaspList', 'burpList'],
    ai: 'Lab over 30 minutes? Ask which parameter to investigate, not for the solution.',
    lab: {
      startCwd: '/home/student',
      intro: 'Boss fight: The Injection Vault. A login and a product filter, both injectable. Work out the column count, then pull the admin password.',
      fs: home({}),
      net: {
        myIp: '10.10.14.23', prefix: 24, gateway: '10.10.14.1', dns: '10.10.14.2',
        hosts: [{
          ip: '10.10.14.61', name: 'vault.lab',
          ports: [{
            port: 80, state: 'open', svc: 'http', version: 'Apache 2.4',
            web: {
              '/': 'Vault Shop. /filter?category=',
              '/filter?category=Gifts': 'Products in Gifts: Mug, Pen, Bag',
              "/filter?category=Gifts'": 'Internal Server Error: unterminated quoted string',
              "/filter?category=Gifts' ORDER BY 3--": 'Products in Gifts: Mug, Pen, Bag',
              "/filter?category=Gifts' ORDER BY 4--": 'Internal Server Error: ORDER BY position 4 is not in select list',
              "/filter?category=' UNION SELECT NULL,username,password FROM users--": 'administrator | s3cr3t_pw_9f2. FLAG: SARVAM{w6_union_pulls_admin}'
            }
          }]
        }]
      },
      tasks: [
        { id: 't1', prompt: 'How many columns does the query return? Use ORDER BY until it errors. Number only.', hint: "ORDER BY 3 works, ORDER BY 4 errors. curl the /filter URL with category=Gifts' ORDER BY 3--", answer: '3' },
        { id: 't2', prompt: "Which single character broke the query and revealed the injection? Submit the character.", hint: "Look at the Gifts' request that returned Internal Server Error", answer: "'" },
        { id: 't3', prompt: 'Use UNION SELECT to dump the users table and submit the flag.', hint: "category=' UNION SELECT NULL,username,password FROM users--", answer: 'SARVAM{w6_union_pulls_admin}' }
      ]
    },
    cards: [
      { front: 'How do you find the number of columns in a UNION attack?', back: 'ORDER BY n (increase until it errors) or UNION SELECT NULL,NULL,... until the error disappears.' },
      { front: 'Why is a single quote the classic first probe?', back: 'It breaks an unescaped string in the SQL. A changed response or error tells you input reaches the query.' },
      { front: 'How do you stop SQL injection at the code level?', back: 'Parameterised queries / prepared statements, plus least-privilege DB accounts. Escaping alone is fragile.' }
    ]
  },

  /* ===================================================================== WEEK 7 */
  {
    id: 'w07',
    week: 7,
    phase: 2,
    phaseName: 'Web Security and Proof of Work',
    title: 'Build a port scanner',
    sub: 'Turn Script 3 into a real tool',
    minutes: 90,
    boss: 'The Scanner Forge',
    deliverable: 'GitHub repo #4: port scanner (own hosts only)',
    map: 'vms',
    concept: `
<h2>From script to tool</h2>
<p>A port scanner tries to connect to a list of ports and reports which accept. In real Python it uses the <code>socket</code> library:</p>
<pre><code>import socket
for port in [22, 80, 443, 3306]:
    s = socket.socket()
    s.settimeout(1)
    if s.connect_ex(("127.0.0.1", port)) == 0:
        print(port, "open")
    s.close()</code></pre>
<div class="callout warn"><strong>Only scan hosts you own</strong> or have written permission to test. Unauthorised scanning can be illegal. Your own machine, your own VM, or a lab target is the right place.</div>

<h3>Also this week: a basic password-strength auditor</h3>
<p>Score a password on length, character mix, and presence in a common-passwords list. It teaches why <code>Summer2026!</code> is weak even though it "has symbols".</p>
<p>In the lab, <code>open_ports.txt</code> stands in for connection results so your logic is what gets tested.</p>
`,
    missions: [
      { id: 'm1', kind: 'learn', text: 'Hindi Ethical Hacking course: watch only the scanning and Python portions' },
      { id: 'm2', kind: 'build', text: 'Build the port scanner with the socket library (own hosts only)' },
      { id: 'm3', kind: 'build', text: 'Build a basic password-strength auditor' },
      { id: 'm4', kind: 'build', text: 'Push both with proper READMEs. That is repo #4' },
      { id: 'm5', kind: 'build', text: 'Set up VirtualBox + Kali for your own lab (VMs and LiveCDs mind map)' }
    ],
    resources: ['ethical', 'bandit', 'git'],
    ai: 'Ask AI: "review my scanner for error handling and timeouts like a senior engineer."',
    lab: {
      startCwd: '/home/student',
      intro: 'Boss fight: The Scanner Forge. scan_results.txt lists "port state". Write ports.py that prints only open ports with their service name, and audit.py that scores passwords.',
      fs: home({
        'scan_results.txt': f('644', '21 closed\n22 open\n80 open\n443 open\n3306 closed\n8080 open\n', 'student'),
        'passwords.txt': f('644', 'password\nSummer2026!\nx7#Qm92$Lp!vR4\nadmin123\n', 'student')
      }),
      tasks: [
        { id: 't1', prompt: 'Write ports.py that prints each OPEN port from scan_results.txt. Submit how many open ports it prints.', hint: `printf '%s\\n' "for l in open('scan_results.txt').read().split('\\n'):" "    if l != '':" "        p = l.split(' ')" "        if p[1] == 'open':" "            print(p[0])" > ports.py ; python ports.py`, answer: '4', check: { fileRuns: 'ports.py', outputLines: 4 } },
        { id: 't2', prompt: 'Write audit.py that prints WEAK for passwords shorter than 10 characters, STRONG otherwise. How many WEAK?', hint: `printf '%s\\n' "for pw in open('passwords.txt').read().split('\\n'):" "    if pw != '':" "        if len(pw) < 10:" "            print('WEAK')" "        else:" "            print('STRONG')" > audit.py ; python audit.py | grep -c WEAK`, answer: '2', check: { fileRuns: 'audit.py', outputIncludes: 'STRONG' } },
        { id: 't3', prompt: 'Which open port is plain HTTP (cleartext web)? Number only.', hint: 'cat scan_results.txt', answer: '80' }
      ]
    },
    cards: [
      { front: 'How does a TCP connect port scan decide a port is open?', back: 'It completes (or gets accepted on) a TCP handshake to that port. connect_ex returns 0 for open.' },
      { front: 'What legal rule applies to scanning?', back: 'Only scan systems you own or have explicit written permission to test.' },
      { front: 'Why is a long password list check better than a "has symbols" rule?', back: 'Attackers try common patterns first. Length and unpredictability matter more than forced symbols.' }
    ]
  },

  /* ===================================================================== WEEK 8 */
  {
    id: 'w08',
    week: 8,
    phase: 2,
    phaseName: 'Web Security and Proof of Work',
    title: 'Write-ups, notes repo and cryptography',
    sub: 'Turn knowledge into visible proof',
    minutes: 90,
    boss: 'The Hash Cracker',
    deliverable: 'Two public write-ups + cybersec-notes repo (repos #5, #6)',
    map: 'crypto',
    concept: `
<h2>Recruiters genuinely read write-ups</h2>
<p>Write two public write-ups (LinkedIn article or GitHub markdown): <em>"How I solved PortSwigger's X SQL injection lab"</em> with screenshots. Structure: goal, what I tried, the payload, why it worked (root cause), the fix.</p>
<p>Also start a repo called <code>cybersec-notes</code> with your cheat sheets and room notes.</p>

<h3>The cryptography interview question</h3>
<p><strong>What is the difference between hashing and encryption?</strong></p>
<ul>
<li><strong>Encryption</strong> is two-way: with the key you get the original back (AES, RSA).</li>
<li><strong>Hashing</strong> is one-way: same input always gives the same fixed-size fingerprint, and you cannot reverse it (SHA-256, MD5). Used for passwords and integrity.</li>
<li><strong>Encoding</strong> (Base64) is neither: it is just a format, anyone can decode it.</li>
</ul>
<pre><code>echo -n "password" | sha256sum        same input, same hash, always
echo "SGVsbG8=" | base64 -d           encoding, not encryption</code></pre>
<p>Weak/unsalted hashes fall to lookup tables and cracking. That is why passwords need <strong>salted, slow hashes</strong> (bcrypt, argon2).</p>
`,
    missions: [
      { id: 'm1', kind: 'learn', text: 'Hindi Cryptography video: hashing vs encryption vs encoding' },
      { id: 'm2', kind: 'build', text: 'Write public write-up #1 (PortSwigger SQLi lab) with screenshots' },
      { id: 'm3', kind: 'build', text: 'Write public write-up #2 (XSS lab)' },
      { id: 'm4', kind: 'build', text: 'Create the "cybersec-notes" repo with cheat sheets' },
      { id: 'm5', kind: 'build', text: 'Review weak areas from weeks 1 to 7' }
    ],
    resources: ['cryptoHindi', 'portswigger'],
    ai: 'Ask AI to review your write-up: "is the root cause clear? what would a hiring manager skip?"',
    lab: {
      startCwd: '/home/student',
      intro: 'Boss fight: The Hash Cracker. Three artifacts: an encoded message, a SHA-256 you must match, and a hash table. Tell encoding from hashing.',
      fs: home({
        'message.b64': f('644', 'U0FSVkFNe3c4X2VuY29kaW5nX2lzX25vdF9lbmNyeXB0aW9ufQ==\n', 'student'),
        'secret.txt': f('644', 'letmein\n', 'student'),
        'hashes.txt': f('644', 'a1:5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8\na2:ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f\na3:8de47d5aa7d61e92c577d8156b966583f6d7d75d714a3b99fca4fb2f8bfe97c6\n', 'student'),
        'wordlist.txt': f('644', 'password\nletmein\nqwerty\nadmin\n123456\n', 'student')
      }),
      tasks: [
        { id: 't1', prompt: 'Decode message.b64 and submit the flag inside it.', hint: 'cat message.b64 | base64 -d', answer: 'SARVAM{w8_encoding_is_not_encryption}' },
        { id: 't2', prompt: 'Hash secret.txt with sha256sum. Submit the first 8 characters of the hash.', hint: 'sha256sum secret.txt', answer: '8de47d5a' },
        { id: 't3', prompt: 'Which entry in hashes.txt is the SHA-256 of the word "password"? Submit its id (a1, a2 or a3).', hint: 'echo password | sha256sum  then compare its first characters with each line of hashes.txt', answer: 'a1' }
      ]
    },
    cards: [
      { front: 'Hashing vs encryption vs encoding?', back: 'Encryption: reversible with a key. Hashing: one-way fingerprint. Encoding (Base64): reversible by anyone, no secrecy.' },
      { front: 'Why are plain MD5/SHA-256 poor for storing passwords?', back: 'They are fast, so attackers brute-force or use lookup tables. Use salted, slow hashes like bcrypt or argon2.' },
      { front: 'What makes a good public write-up?', back: 'Goal, approach, payload, root cause, fix, screenshots. It shows reasoning, which is what interviewers test.' }
    ]
  },

  /* ===================================================================== WEEK 9 */
  {
    id: 'w09',
    week: 9,
    phase: 3,
    phaseName: 'AI Project, Portfolio, Applications',
    title: 'Flagship: the Security Report Assistant',
    sub: 'Scanner + AI = one-page report',
    minutes: 120,
    boss: 'The Report Engine',
    deliverable: 'Flagship project: AI Security Report Assistant on GitHub',
    map: 'code',
    concept: `
<h2>One project that proves everything</h2>
<p>Python, networking, security concepts, AI integration, automation and documentation, in a weekend. The pipeline:</p>
<pre><code>1. Port scanner + subdomain finder run against a target YOU own
2. Script collects raw results (open ports, services, subdomains)
3. Sends results to an AI API (Groq free tier) with a prompt:
   "Create a professional one-page security report from these scan
    results, with risk levels and recommendations"
4. Output: auto-generated PDF or text report</code></pre>

<h3>What you build in this lab: the middle of the pipeline</h3>
<p>The part that is purely yours is turning raw results into a structured prompt and a risk rating. You will write <code>report.py</code>: read scan results, assign risk (HIGH for telnet/ftp/mysql exposed, MEDIUM for http, LOW for https/ssh) and print a report skeleton. The AI call itself is one <code>requests.post</code> to Groq, which you add on your own machine.</p>

<div class="callout">Design the pipeline yourself and document every design decision in the README. Lean on Copilot for the Groq integration, but be able to explain every line.</div>
<p class="mini-note">Free tier: console.groq.com. The docs are in English; ask AI to explain any part in Hindi.</p>
`,
    missions: [
      { id: 'm1', kind: 'learn', text: 'Read the Groq API docs and practise prompting' },
      { id: 'm2', kind: 'build', text: 'Wire port scanner + subdomain finder into one script' },
      { id: 'm3', kind: 'build', text: 'Send results to the Groq API with a report prompt' },
      { id: 'm4', kind: 'build', text: 'Output a PDF or text report; write the README with design decisions' },
      { id: 'm5', kind: 'build', text: 'Record a 90 second explanation of the project out loud' }
    ],
    resources: ['groq', 'git'],
    ai: 'Now you are building WITH AI. Design the pipeline yourself and document every design decision.',
    lab: {
      startCwd: '/home/student',
      intro: 'Boss fight: The Report Engine. Write report.py that reads scan.txt (port service) and prints "<port> <service> <RISK>" using the rules in the concept. Then commit the project.',
      fs: home({
        'scan.txt': f('644', '21 ftp\n22 ssh\n80 http\n443 https\n3306 mysql\n23 telnet\n', 'student'),
        'README.md': f('644', '# Security Report Assistant\n', 'student')
      }),
      tasks: [
        { id: 't1', prompt: 'Write report.py. Rule: ftp, telnet, mysql = HIGH; http = MEDIUM; everything else = LOW. How many HIGH findings does it print?', hint: `printf '%s\\n' "for l in open('scan.txt').read().split('\\n'):" "    if l != '':" "        p = l.split(' ')" "        s = p[1]" "        if s == 'ftp' or s == 'telnet' or s == 'mysql':" "            print(p[0], s, 'HIGH')" "        elif s == 'http':" "            print(p[0], s, 'MEDIUM')" "        else:" "            print(p[0], s, 'LOW')" > report.py ; python report.py | grep -c HIGH`, answer: '3', check: { fileRuns: 'report.py', outputIncludes: 'telnet HIGH' } },
        { id: 't2', prompt: 'Which single service in the scan is plain-text remote login (never use it)? One word.', hint: 'cat scan.txt', answer: 'telnet' },
        { id: 't3', prompt: 'Commit the project: git init, git add ., git commit -m "report assistant".', hint: 'git init ; git add . ; git commit -m "report assistant"', answer: '*', check: { gitCommit: true } }
      ]
    },
    cards: [
      { front: 'What does the Security Report Assistant pipeline do?', back: 'Scans a target you own, collects ports and subdomains, sends them to an AI API, and generates a one-page risk report.' },
      { front: 'Why document design decisions in the README?', back: 'It proves you understood the build, not just assembled it. Interviewers ask "why did you do it this way".' },
      { front: 'Which services in a scan are immediate red flags?', back: 'Telnet and FTP (cleartext), exposed databases (MySQL), and outdated service versions.' }
    ]
  },

  /* ===================================================================== WEEK 10 */
  {
    id: 'w10',
    week: 10,
    phase: 3,
    phaseName: 'AI Project, Portfolio, Applications',
    title: 'Package yourself',
    sub: 'Resume, GitHub profile, LinkedIn',
    minutes: 90,
    boss: 'The Recruiter Scan',
    deliverable: 'One-page resume, GitHub profile README, LinkedIn updated',
    map: 'tests',
    concept: `
<h2>Make it easy to say yes</h2>
<p>A recruiter spends about 20 seconds. Give them proof, not adjectives.</p>

<h3>One-page student resume, no fluff</h3>
<ul>
<li><strong>Education</strong></li>
<li><strong>Skills:</strong> Python, Linux, Networking, web security basics, Burp Suite, AI APIs</li>
<li><strong>Projects</strong> with GitHub links: the AI report tool first</li>
<li><strong>Links:</strong> GitHub, LinkedIn, notes repo</li>
</ul>
<h3>GitHub profile README</h3>
<p>Pin your best repos, one line each. Create a repo named exactly like your username and add a README.md.</p>
<h3>LinkedIn headline</h3>
<pre><code>Cyber Security Student | Python, Linux, Web Security | Building security automation tools</code></pre>
<p>Post your two write-ups there too.</p>
<div class="callout">In the lab you will write the resume as a Markdown file and a profile README, and the grader checks that they carry the right proof (links, skills, projects).</div>
`,
    missions: [
      { id: 'm1', kind: 'build', text: 'One-page resume (Overleaf or Canva template)' },
      { id: 'm2', kind: 'build', text: 'GitHub profile README with pinned repos' },
      { id: 'm3', kind: 'build', text: 'LinkedIn headline and the two write-ups posted' },
      { id: 'm4', kind: 'learn', text: 'Read 3 sample student resumes and note what they do well' }
    ],
    resources: ['overleaf'],
    ai: 'Ask AI to act as a hiring manager: "what would make you reject this resume in 20 seconds?"',
    lab: {
      startCwd: '/home/student',
      intro: 'Boss fight: The Recruiter Scan. Write resume.md with the sections Education, Skills, Projects, Links. The scanner greps for them.',
      fs: home({
        'projects.txt': f('644', 'port-scanner\nsubdomain-finder\nsecurity-report-assistant\nstatus-checker\n', 'student')
      }),
      tasks: [
        { id: 't1', prompt: 'Create resume.md containing the four section headings (Education, Skills, Projects, Links). Submit how many headings your file has.', hint: `printf '%s\\n' "# Education" "# Skills" "# Projects" "# Links" > resume.md`, answer: '4', check: { fileHas: ['resume.md', ['Education', 'Skills', 'Projects', 'Links']] } },
        { id: 't2', prompt: 'Append your four projects from projects.txt into resume.md (cat projects.txt >> resume.md). How many lines does resume.md have now? Number only.', hint: 'cat projects.txt >> resume.md ; wc -l resume.md', answer: '9', check: { fileHas: ['resume.md', ['port-scanner']] } },
        { id: 't3', prompt: 'Which project should be FIRST on your resume because it proves the most? Answer with its name.', hint: 'the flagship from week 9', answer: 'security-report-assistant' }
      ]
    },
    cards: [
      { front: 'What goes on a one-page cyber student resume?', back: 'Education, Skills (Python, Linux, Networking, web security basics, Burp, AI APIs), Projects with GitHub links, and Links.' },
      { front: 'What is a GitHub profile README?', back: 'A README.md in a repo named exactly like your username. It shows on your profile; pin your best repos with one line each.' },
      { front: 'Which project goes first on the resume?', back: 'The flagship: the AI-powered Security Report Assistant. It proves Python, networking, security and AI.' }
    ]
  },

  /* ===================================================================== WEEK 11 */
  {
    id: 'w11',
    week: 11,
    phase: 3,
    phaseName: 'AI Project, Portfolio, Applications',
    title: 'Apply with a system',
    sub: '10 applications and 2 cold emails',
    minutes: 90,
    boss: 'The Outreach Machine',
    deliverable: '10 applications sent + 2 cold emails',
    map: 'infra',
    concept: `
<h2>10 applications a week, scheduled like a class</h2>
<p>Every evening 6 to 7pm. Search filters: <em>work from home</em>, <em>part time allowed</em>, <em>freshers</em>. Target roles: <strong>security content developer, junior SOC or VMS analyst intern, Python automation intern, web security intern</strong>.</p>
<h3>Where to apply</h3>
<ul>
<li>Internshala (highest volume for Indian students)</li>
<li>EncryptEdge Labs (8-week structured remote internships)</li>
<li>Prosple India (hundreds of listings, many remote)</li>
<li>Wellfound (early-stage security startups)</li>
</ul>
<p class="mini-note">Listings and stipends change. Check each site yourself before applying.</p>
<h3>Custom sentences win</h3>
<p>Give every application two custom sentences that mention your projects: <em>"I built an AI-powered scan-report tool, link in resume."</em></p>
<h3>Cold email template</h3>
<pre><code>Subject: 2nd-year student who can actually help — Python security automation

Hi [Name], I'm a 2nd-year cyber security engineering student. Over the last 3
months I've taught myself Python, Linux, and web security hands-on. My GitHub
has a port scanner, a subdomain finder, and an AI-powered tool that generates
security reports from scan data: [link]. I can commit 10-15 hours a week
remotely and would love to help your team with research, documentation, or
automation. May I send my resume?</code></pre>
`,
    missions: [
      { id: 'm1', kind: 'build', text: 'Send 10 applications (Internshala, EncryptEdge, Prosple, Wellfound)' },
      { id: 'm2', kind: 'build', text: 'Send 2 cold emails or LinkedIn DMs to security startups' },
      { id: 'm3', kind: 'learn', text: 'Interview question drill: URL walkthrough, TCP handshake, SQLi, XSS' },
      { id: 'm4', kind: 'build', text: 'Keep a tracker of every application and follow-up date' }
    ],
    resources: ['internshala', 'encryptedge', 'prosple', 'wellfound'],
    ai: 'Ask AI for a strict interview drill: "one question at a time, grade my answer, then ask a harder follow-up."',
    lab: {
      startCwd: '/home/student',
      intro: 'Boss fight: The Outreach Machine. Track applications in a file and write a cold email that actually mentions your projects. The grader checks the content.',
      fs: home({
        'targets.txt': f('644', 'Internshala,security content developer,sent\nEncryptEdge,web security intern,draft\nWellfound,python automation intern,draft\nProsple,junior SOC intern,sent\n', 'student')
      }),
      tasks: [
        { id: 't1', prompt: 'How many applications in targets.txt are already "sent"? Number only.', hint: 'grep -c sent targets.txt', answer: '2' },
        { id: 't2', prompt: 'Write cold_email.txt that mentions "GitHub" and "port scanner". Submit the word count line from wc -l once it has 3 lines.', hint: `printf '%s\\n' "Subject: 2nd-year student who can help" "Hi, my GitHub has a port scanner and an AI report tool" "May I send my resume?" > cold_email.txt ; wc -l cold_email.txt`, answer: '3', check: { fileHas: ['cold_email.txt', ['GitHub', 'port scanner']] } },
        { id: 't3', prompt: 'How many applications per week does the roadmap target? Number only.', hint: '10 applications a week, scheduled like a class', answer: '10' }
      ]
    },
    cards: [
      { front: 'What are the target internship roles for a beginner?', back: 'Security content developer, junior SOC or VMS analyst intern, Python automation intern, web security intern.' },
      { front: 'What makes an application stand out?', back: 'Two custom sentences that mention your projects, with the link in the resume.' },
      { front: 'What should a cold email to a security startup contain?', back: 'Who you are, proof (GitHub links), hours you can commit, and a clear small ask: "may I send my resume?".' }
    ]
  },

  /* ===================================================================== WEEK 12 */
  {
    id: 'w12',
    week: 12,
    phase: 3,
    phaseName: 'AI Project, Portfolio, Applications',
    title: 'Interview mode',
    sub: 'AI mock interviews and 20 applications',
    minutes: 90,
    boss: 'The Final Interview',
    deliverable: '20 applications total + mock interviews done',
    map: 'tests',
    concept: `
<h2>The questions actually asked</h2>
<ul>
<li>Explain what happens when you type a URL into a browser</li>
<li>The TCP handshake, common ports, DNS, with confidence</li>
<li>Explain SQL injection and XSS with an example and a fix</li>
<li>"Tell me about one of your projects": practise your AI report tool out loud in 90 seconds</li>
<li>"Why cyber security?": your honest story, self-taught, built proof, want real work early</li>
</ul>
<h3>AI mock interview</h3>
<pre><code>"Be a strict internship interviewer, one question at a time.
 Grade my answer out of 10, say what a hiring manager would
 push back on, then ask a harder follow-up."</code></pre>
<p>Practise in English, since most interviews are in English or Hinglish. Keep technical terms in English even when thinking in Hindi.</p>
<div class="callout">This is the final boss. The lab below asks you the real interview questions. Answer from understanding, not memory dumps.</div>
`,
    missions: [
      { id: 'm1', kind: 'learn', text: 'Three AI mock interviews (strict interviewer, one question at a time)' },
      { id: 'm2', kind: 'build', text: '10 more applications and follow-ups (20 total)' },
      { id: 'm3', kind: 'build', text: 'Practise the 90-second project pitch out loud' },
      { id: 'm4', kind: 'learn', text: 'Revisit your weakest week with the review cards' }
    ],
    resources: ['internshala', 'wellfound'],
    ai: 'Mock interview prompt: "be a strict internship interviewer, one question at a time, grade me, then ask a harder follow-up."',
    lab: {
      startCwd: '/home/student',
      intro: 'Final boss: The Final Interview. Four questions, all from the roadmap. Use man pages, your notes and the shell if you need to check a fact.',
      fs: home({
        'interview.md': f('644', '# Final interview\n1. What does SYN-ACK come after?\n2. Which attack puts a quote into a query?\n3. Which tool lets you intercept and edit browser traffic?\n4. Hashing is reversible: true or false?\n', 'student')
      }),
      tasks: [
        { id: 't1', prompt: 'In the TCP handshake, SYN-ACK is sent by who? One word: client or server.', hint: 'client sends SYN, server answers SYN-ACK, client sends ACK', answer: 'server' },
        { id: 't2', prompt: 'Name the attack where a quote in a parameter extends a database query. Two words.', hint: 'week 5', answer: 'sql injection', accept: ['sqli', 'sql-injection'] },
        { id: 't3', prompt: 'Name the intercepting proxy used to edit browser traffic. One word.', hint: 'week 5, the Hindi playlist you watched', answer: 'burp', accept: ['burp suite', 'burpsuite'] },
        { id: 't4', prompt: 'Is hashing reversible? true or false.', hint: 'week 8', answer: 'false' }
      ]
    },
    cards: [
      { front: 'Give a 90-second pitch of your flagship project.', back: 'Problem (reports are slow), pipeline (scan, collect, AI, report), your design choices, what you learned, and the GitHub link.' },
      { front: 'Why cyber security? Give an honest answer.', back: 'Self-taught, built proof (GitHub, write-ups, AI report tool), and want real work early. Specific beats generic.' },
      { front: 'How to use AI for interview prep without cheating yourself?', back: 'Ask it to be a strict interviewer, one question at a time, grade you, and push back. Answer from understanding.' }
    ]
  }
];
