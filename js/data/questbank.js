/**
 * The practice bank: 200+ auto-graded hacking and networking drills.
 * Everything here is generated from real data (ports, subnets, encodings, log lines, md5 pairs),
 * so every question has one correct answer that the app can check by itself.
 */

const seedRand = (seed) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const pick = (rnd, arr) => arr[Math.floor(rnd() * arr.length) % arr.length];

const PORTS = [
  ['ssh', 22], ['telnet', 23], ['smtp', 25], ['dns', 53], ['http', 80], ['pop3', 110],
  ['imap', 143], ['https', 443], ['smb', 445], ['mysql', 3306], ['rdp', 3389], ['ftp', 21],
  ['ntp', 123], ['snmp', 161], ['ldap', 389], ['ldaps', 636], ['mssql', 1433], ['redis', 6379],
  ['postgres', 5432], ['mongodb', 27017], ['smtps', 465], ['imaps', 993], ['pop3s', 995],
  ['http-alt', 8080], ['https-alt', 8443], ['dns-over-tls', 853], ['kerberos', 88], ['docker', 2375]
];

/* ---------------- ports ---------------- */

function portQuests() {
  const out = [];
  PORTS.forEach(([svc, port], i) => {
    out.push({
      id: 'qb-port-a-' + i,
      kind: 'hack',
      topic: 'networking',
      title: 'Port raid: ' + svc.toUpperCase(),
      prompt: 'Which port does ' + svc + ' listen on by default? Number only.',
      answer: String(port),
      hint: 'grep ' + svc + ' /etc/services',
      explain: svc + ' uses TCP/UDP ' + port + '. Learn it as a layer-4 landmark, not trivia.'
    });
    out.push({
      id: 'qb-port-b-' + i,
      kind: 'trace',
      topic: 'networking',
      title: 'What is on ' + port + '?',
      prompt: 'A scan shows port ' + port + ' open. Which service is that, usually? One word.',
      answer: svc.replace(/-alt$/, '').replace(/-over-tls$/, ''),
      alt: [svc],
      hint: 'grep ' + port + ' /etc/services',
      explain: 'Port ' + port + ' is ' + svc + '. Naming the service from a port is the first half of enumeration.'
    });
  });
  return out;
}

/* ---------------- subnets ---------------- */

const ipToInt = (ip) => ip.split('.').reduce((a, o) => ((a << 8) + Number(o)) >>> 0, 0);
const intToIp = (n) => [24, 16, 8, 0].map((s) => (n >>> s) & 255).join('.');

function subnetQuests() {
  const rnd = seedRand(20261106);
  const out = [];
  for (let i = 0; i < 40; i++) {
    const prefix = pick(rnd, [24, 25, 26, 27, 28, 29, 30]);
    const ip = [10, (rnd() * 12 + 1) | 0, (rnd() * 200 + 1) | 0, (rnd() * 200 + 1) | 0].join('.');
    const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
    const net = (ipToInt(ip) & mask) >>> 0;
    const size = Math.pow(2, 32 - prefix);
    const usable = prefix >= 31 ? 2 : size - 2;
    const tap = i % 3;
    if (tap === 0) {
      out.push({
        id: 'qb-sub-net-' + i, kind: 'puzzle', topic: 'networking', title: 'Subnet sniper',
        prompt: 'What is the network address of ' + ip + '/' + prefix + '?',
        answer: intToIp(net), hint: 'ipcalc ' + ip + '/' + prefix, explain: 'Mask it: ' + ip + ' AND /' + prefix + ' = ' + intToIp(net) + '.'
      });
    } else if (tap === 1) {
      out.push({
        id: 'qb-sub-usable-' + i, kind: 'puzzle', topic: 'networking', title: 'How many hosts?',
        prompt: 'How many usable host addresses does ' + ip + '/' + prefix + ' have? Number only.',
        answer: String(usable), hint: 'ipcalc ' + ip + '/' + prefix, explain: '2^(32-' + prefix + ') - 2 = ' + usable + ' usable addresses.'
      });
    } else {
      out.push({
        id: 'qb-sub-bcast-' + i, kind: 'puzzle', topic: 'networking', title: 'Find the broadcast',
        prompt: 'What is the broadcast address of ' + ip + '/' + prefix + '?',
        answer: intToIp((net + size - 1) >>> 0), hint: 'ipcalc ' + ip + '/' + prefix, explain: 'Last address before the next network: ' + intToIp((net + size - 1) >>> 0) + '.'
      });
    }
  }
  return out;
}

/* ---------------- encodings ---------------- */

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Base64 without Buffer, so the bank loads in a plain browser. */
const toBase64 = (str) => {
  const bytes = [...str].map((c) => c.charCodeAt(0));
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i];
    const b2 = bytes[i + 1];
    const b3 = bytes[i + 2];
    out += B64[b1 >> 2];
    out += B64[((b1 & 3) << 4) | ((b2 || 0) >> 4)];
    out += b2 === undefined ? '=' : B64[((b2 & 15) << 2) | ((b3 || 0) >> 6)];
    out += b3 === undefined ? '=' : B64[b3 & 63];
  }
  return out;
};

const rot13 = (s) => s.replace(/[a-z]/gi, (c) => String.fromCharCode((c <= 'Z' ? 90 : 122) >= c.charCodeAt(0) + 13 ? c.charCodeAt(0) + 13 : c.charCodeAt(0) - 13));

function encodeQuests() {
  const rnd = seedRand(99117);
  const words = ['gateway', 'payload', 'kernel', 'shatter', 'lockpick', 'beacon', 'cipher', 'rootkit', 'shellcode', 'handshake', 'subnet', 'privkey'];
  const out = [];
  for (let i = 0; i < 40; i++) {
    const w = pick(rnd, words) + (i % 7 === 0 ? i : '');
    const mode = i % 4;
    if (mode === 0) {
      const enc = toBase64(w);
      out.push({ id: 'qb-enc-b64-' + i, kind: 'decode', topic: 'crypto', title: 'Base64 picklock', prompt: 'Decode this and submit the word: ' + enc, answer: w, hint: 'echo ' + enc + ' | base64 -d', explain: 'Base64 is encoding, not encryption. It only hides text from a quick glance.' });
    } else if (mode === 1) {
      const enc = [...w].map((c) => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
      out.push({ id: 'qb-enc-hex-' + i, kind: 'decode', topic: 'crypto', title: 'Hex reversal', prompt: 'This hex decodes to a word. Submit it: ' + enc, answer: w, hint: 'echo ' + enc + ' | xxd -r -p', explain: 'Hex is the friendliest view of binary. Two characters per byte, always.' });
    } else if (mode === 2) {
      const enc = rot13(w);
      out.push({ id: 'qb-enc-rot-' + i, kind: 'decode', topic: 'crypto', title: 'Caesar shift', prompt: 'ROT13 hides this word. Submit the plain word: ' + enc, answer: w, hint: 'shift every letter 13 places', explain: 'ROT13 is symmetric: the same operation encodes and decodes. Never used for real secrets.' });
    } else {
      const enc = encodeURIComponent(w + '?id=1');
      out.push({ id: 'qb-enc-url-' + i, kind: 'decode', topic: 'web', title: 'URL unescape', prompt: 'What plain text does this URL encoding represent? Drop the ?id=1 part: ' + enc, answer: w, hint: 'decodeURIComponent', explain: 'Percent encoding is how browsers carry characters that would otherwise break a URL. Injection lives here.' });
    }
  }
  return out;
}

const HASHES = [
  ['admin', '21232f297a57a5a743894a0e4a801fc3'],
  ['letmein', '0d107d09f5bbe40cade3de5c71e9e9b7'],
  ['password', '5f4dcc3b5aa765d61d8327deb882cf99'],
  ['welcome', '40be4e59b9a2a2b5dffb918c0e86b3d7'],
  ['monkey', 'd0763edaa9d9bd2a9516280e9044d885'],
  ['dragon', '8621ffdbc5698829397d97767ac13db3'],
  ['qwerty', 'd8578edf8458ce06fbc5bb76a58c5ca4'],
  ['hunter2', '2ab96390c7dbe3439de74d0c9b0b1767'],
  ['summer2026', '2e49d77248f05d5b9c0fa6467dc50fea'],
  ['iloveyou', 'f25a2fc72690b780b2a14e140ef6a9e0'],
  ['football', '37b4e2d82900d5e94b8da524fbeb33c0'],
  ['trustno1', '5fcfd41e547a12215b173ff47fdd3739'],
  ['shadow', '3bf1114a986ba87ed28fc1b5884fc2f8'],
  ['master', 'eb0a191797624dd3a48fa681d3061212'],
  ['superman', '84d961568a65073a3bcf0eb216b2a576'],
  ['batman', 'ec0e2603172c73a8b644bb9456c1ff6e'],
  ['ninja', '3899dcbab79f92af727c2190bbd8abc5'],
  ['sunshine', '0571749e2ac330a7455809c6b0e7af90'],
  ['princess', '8afa847f50a716e64932d995c8e7435a'],
  ['freedom', 'd5aa1729c8c253e5d917a5264855eab8'],
  ['whatever', '008c5926ca861023c1d2a36653fd88e2'],
  ['azerty', 'ab4f63f9ac65152575886860dde480a1'],
  ['solo', '5653c6b1f51852a6351ec69c8452abc6'],
  ['starwars', '5badcaf789d3d1d09794d8f021f40f0e'],
  ['hello123', 'f30aa7a662c728b7407c54ae6bfd27d1'],
  ['root', '63a9f0ea7bb98050796b649e85481845'],
  ['toor', '7b24afc8bc80e548d66c4e7ff72171c5'],
  ['changeme', '4cb9c8a8048fd02294477fcb1a41191a'],
  ['secret', '5ebe2294ecd0e0f08eab7690d2a6ee69'],
  ['pass123', '32250170a0dca92d53ec9624f336ca24']
];

/* ---------------- cracking hashes ---------------- */

function hashQuests() {
  const rnd = seedRand(4242);
  const out = [];
  for (let i = 0; i < 30; i++) {
    const target = pick(rnd, HASHES);
    const others = HASHES.filter((h) => h[0] !== target[0]).sort(() => rnd() - 0.5).slice(0, 3);
    const options = [target, ...others].sort(() => rnd() - 0.5);
    out.push({
      id: 'qb-hash-' + i,
      kind: 'decode',
      topic: 'crypto',
      title: 'Crack the hash',
      prompt: 'This md5 is from a weak password list. Which one of these words produces it: ' + options.map((o) => o[0]).join(', ') + '?  Hash: ' + target[1],
      answer: target[0],
      hint: 'echo -n <word> | md5sum and compare',
      explain: 'Unsalted md5 of a dictionary word is instant to crack. That is why password storage uses bcrypt, scrypt or argon2 with a salt.',
      choices: options.map((o) => o[0])
    });
  }
  return out;
}

/* ---------------- log triage ---------------- */

function logQuests() {
  const rnd = seedRand(778899);
  const out = [];
  for (let i = 0; i < 30; i++) {
    const attacker = '203.0.113.' + (20 + i);
    const fails = 3 + (i % 6);
    const lines = [];
    let sec = 10;
    for (let f = 0; f < fails; f++) {
      lines.push('Nov  5 03:' + String(sec).padStart(2, '0') + ':0' + (f % 9) + ' web01 sshd[' + (2200 + f) + ']: Failed password for invalid user ' + pick(rnd, ['admin', 'root', 'test', 'oracle', 'pi']) + ' from ' + attacker + ' port 5' + (1000 + f) + ' ssh2');
      sec += 2;
    }
    lines.push('Nov  5 03:' + String(sec + 2).padStart(2, '0') + ':11 web01 sshd[2299]: Accepted password for deploy from 198.51.100.7 port 52022 ssh2');
    const ask = i % 2 === 0;
    out.push({
      id: 'qb-log-' + i,
      kind: 'trace',
      topic: 'blue team',
      title: ask ? 'Who is knocking?' : 'How many tries?',
      prompt: (ask ? 'From which IP did the failed logins come? ' : 'How many failed password attempts are in this snippet? Number only. ') + '\n' + lines.join('\n'),
      answer: ask ? attacker : String(fails),
      hint: ask ? "grep 'Failed password' auth.log | cut -d' ' -f13 | sort | uniq -c" : "grep -c 'Failed password' auth.log",
      explain: 'Password spraying looks exactly like this: many usernames, one source, seconds apart. Fail2ban or a rate limit breaks the pattern.',
      pre: true
    });
  }
  return out;
}

/* ---------------- commands you must know cold ---------------- */

const CMD_QUESTS = [
  ['Which command prints the permissions of every file in the current directory, long form?', 'ls -l', 'ls -la'],
  ['Which command shows what your own user id and group memberships are?', 'id'],
  ['Which command finds every setuid binary on the box?', 'find / -perm -4000'],
  ['Which command lists the sudo rights for your user?', 'sudo -l'],
  ['Which command follows a log file live as it grows?', 'tail -f'],
  ['Which command shows the last 20 lines of a file?', 'tail -n 20', 'tail -20'],
  ['Which command searches a file for a pattern ignoring case?', 'grep -i'],
  ['Which command counts matching lines instead of printing them?', 'grep -c'],
  ['Which command counts the words, lines and bytes of a file?', 'wc'],
  ['Which command shows your routing table?', 'ip route', 'route -n'],
  ['Which command shows open listening ports with the process that owns them?', 'ss -tulpn', 'netstat -tulpn'],
  ['Which command resolves a hostname to an address?', 'dig', 'nslookup'],
  ['Which command fetches a URL and prints only the response headers?', 'curl -I', 'curl -i'],
  ['Which command downloads a file and saves it under its remote name?', 'wget'],
  ['Which command decodes base64?', 'base64 -d'],
  ['Which command computes a sha256 checksum of a file?', 'sha256sum'],
  ['Which command prints the printable strings inside a binary?', 'strings'],
  ['Which command dumps a file as hex and ascii?', 'xxd'],
  ['Which command changes a file to mode 600?', 'chmod 600'],
  ['Which command makes a script executable by everyone?', 'chmod 755', 'chmod +x'],
  ['Which command shows the current working directory?', 'pwd'],
  ['Which command shows the kernel version?', 'uname -a', 'uname -r'],
  ['Which command lists running processes for every user?', 'ps aux'],
  ['Which command shows real-time processes sorted by cpu?', 'top'],
  ['Which command finds files by name anywhere under /?', 'find / -name'],
  ['Which command counts unique lines after sorting?', 'uniq -c'],
  ['Which command extracts the 3rd colon-separated field?', "cut -d: -f3", "cut -d ':' -f3"],
  ['Which command replaces every occurrence of a string in a pipeline?', 'sed s///g', 'sed'],
  ['Which command prints the first 5 lines of a file?', 'head -n 5', 'head -5'],
  ['Which command creates an empty git repository?', 'git init'],
  ['Which command stages every change in the repo?', 'git add .'],
  ['Which command shows the commit history one line each?', 'git log --oneline'],
  ['Which command connects to a remote host over ssh as user bob?', 'ssh bob@'],
  ['Which command runs a single command as root?', 'sudo'],
  ['Which command shows disk usage per directory, human readable?', 'du -sh'],
  ['Which command shows mounted filesystems and free space?', 'df -h'],
  ['Which command prints your environment variables?', 'env', 'printenv'],
  ['Which command shows the manual page for nmap?', 'man nmap'],
  ['Which command scans a subnet for live hosts only?', 'nmap -sn'],
  ['Which command lists the services mapped to ports on this system?', '/etc/services', 'cat /etc/services']
];

const cmdQuests = () =>
  CMD_QUESTS.map(([prompt, ...answers], i) => ({
    id: 'qb-cmd-' + i,
    kind: 'command',
    topic: 'linux',
    title: 'Tool drill ' + (i + 1),
    prompt,
    answer: answers[0],
    alt: answers.slice(0),
    hint: answers[0].split(' ')[0] + ' — check the lab shell if you are unsure',
    explain: 'Answer: ' + answers[0] + '. Muscle memory on these is what makes a box feel slow instead of hard.'
  }));

/* ---------------- assembly ---------------- */

export const PRACTICE = [...portQuests(), ...subnetQuests(), ...encodeQuests(), ...hashQuests(), ...logQuests(), ...cmdQuests()];

/** Which week's theme a topic belongs to, so daily quests match what you are studying. */
const TOPIC_WEEK = { networking: [1, 2], linux: [2, 3], crypto: [8], web: [5, 6], 'blue team': [8, 10] };

export function practiceForWeek(weekNumber) {
  const themed = PRACTICE.filter((q) => (TOPIC_WEEK[q.topic] || []).includes(weekNumber));
  return themed.length >= 24 ? themed : PRACTICE;
}

/** Four quests for one day: deterministic by week and day, so the board is stable all day. */
export function dayPractice(weekNumber, dayNumber) {
  // Two quests from this week's topic, two from anywhere else, so every day spans at least two skills.
  const themed = practiceForWeek(weekNumber);
  const others = PRACTICE.filter((q) => !themed.includes(q));
  const offset = (weekNumber - 1) * 6 + (dayNumber - 1);
  const span = Math.max(1, 4);
  const pickAt = (list, i) => list[(offset * 4 + i * 7) % list.length];
  const a = pickAt(themed, 0);
  const b = pickAt(themed, 1);
  const c = pickAt(others, 2);
  const d = pickAt(others, 3);
  return [a, b, c, d];
}

/** Ten per page, the way the side quest list is browsed. */
export const PER_PAGE = 10;

export function pageOf(list, pageNumber, perPage = PER_PAGE) {
  const pages = Math.max(1, Math.ceil(list.length / perPage));
  const page = Math.min(Math.max(1, pageNumber || 1), pages);
  const start = (page - 1) * perPage;
  return { items: list.slice(start, start + perPage), page, pages, start, total: list.length };
}

export function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[“”"'`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function checkPractice(quest, value) {
  const v = normalize(value);
  if (!v) return false;
  const answers = [quest.answer, ...(quest.alt || [])].map(normalize);
  return answers.some((a) => a === v || (a.length > 3 && v === a.replace(/[.,]$/, '')));
}
