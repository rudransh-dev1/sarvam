/**
 * Each week becomes six day-rooms, the way a real room works: a short brief that names the
 * concept and the tool and says why it exists, then graded tasks, then a game.
 * Around 24 tasks a week, so a week is real practice instead of three clicks.
 */
import { WEEKS } from './roadmap.js';
import { practiceForWeek, PRACTICE } from './questbank.js';

/** One line per day: what you learn, and the tool that makes it concrete. */
export const WEEK_ROOMS = {
  w01: { tips: ['nmap: find open doors', 'nmap -sV: name the service', 'dig/host: ask DNS who owns a name', 'curl: talk HTTP by hand', 'ss/netstat: who is listening', 'traceroute: count the hops'], days: [
    'Ports are doors. Scan one host and read which doors are open.',
    'Banners are honesty. Ask a service what it is and version.',
    'DNS is the phone book. Resolve names, read the records.',
    'HTTP is just text. Fetch a page raw and read the headers.',
    'Sockets are local. See what your own box is listening on.',
    'Paths are maps. Count the hops between you and a host.'
  ] },
  w02: { tips: ['ls -la: hidden files', 'find: search by name', 'grep: search inside', 'chmod: permissions', 'sudo -l: your rights', 'awk/cut: fields'], days: [
    'Everything is a file. Move around the tree without a mouse.',
    'Hidden files are not secret, just unnamed.',
    'grep finds needles. Learn to search what you cannot read fully.',
    'Permissions decide who wins. Read the mode bits.',
    'Privilege is the goal. Enumerate what your user may run.',
    'Logs are text. Cut the fields that matter.'
  ] },
  w03: { tips: ['python3 file.py', 'for loops over lines', 'f-strings', 'dicts count things', 'sys.argv arguments', 'if/elif rules'], days: [
    'Automate the boring part: loop over lines instead of retyping.',
    'Count what you see. A dict is a tally sheet.',
    'Arguments make a script reusable.',
    'Decisions in code: if, elif, else.',
    'Read files safely and skip the blanks.',
    'Ship it as a file you can run any day.'
  ] },
  w04: { tips: ['split fields', 'sort and count', 'functions', 'error handling', 'string parsing', 'printing reports'], days: [
    'Parse once, reuse forever: split the line into fields.',
    'Sort and count to find the loudest attacker.',
    'Wrap repeated work in a function.',
    'Handle the empty line or the script dies in the field.',
    'Turn raw text into a table your eyes can scan.',
    'Print a report someone else can act on.'
  ] },
  w05: { tips: ['Burp proxy', 'DevTools network tab', 'cookies vs sessions', 'IDOR', 'input validation', 'robots.txt and headers'], days: [
    'A proxy shows the traffic your browser hides.',
    'Cookies are claims. Sessions are receipts.',
    'Broken access control: change an id and see what opens.',
    'Injection starts with a quote and a shrug.',
    'Read what the server tells you for free: headers, robots.',
    'Map the app before you touch it.'
  ] },
  w06: { tips: ['PortSwigger labs', 'Burp Repeater', 'payload lists', 'Burp Intruder', 'evidence screenshots', 'write the steps down'], days: [
    'Repeat a request by hand until it behaves.',
    'Fuzz a parameter and watch status codes.',
    'Learn from a lab, then rebuild it from memory.',
    'Capture evidence as you go, not after.',
    'Write the exploit as steps a stranger could follow.',
    'Review your own write-up and cut the fluff.'
  ] },
  w07: { tips: ['socket connect scan', 'threads', 'timeouts', 'argparse', 'banners', 'output to file'], days: [
    'A port scan is just connect() in a loop.',
    'Slow scans get noticed. Add threads and timeouts.',
    'Banners turn an open port into a named service.',
    'Make it a tool: arguments, help text, output file.',
    'Handle refused and filtered differently.',
    'Scan a range and summarise the result.'
  ] },
  w08: { tips: ['sha256sum', 'base64 -d', 'md5 weak', 'xxd', 'git log', 'write-up structure'], days: [
    'Hashing is a fingerprint, not encryption.',
    'Encoding is not secrecy. Decode with one command.',
    'Weak hashes fall to a wordlist, fast.',
    'Binary tells you what text hides.',
    'Commit history is a portfolio.',
    'A write-up proves you understand it.'
  ] },
  w09: { tips: ['parse a log', 'score findings', 'template a report', 'severity', 'evidence', 'ship it'], days: [
    'Ingest: read a log file without choking on it.',
    'Detect: pattern match the things that matter.',
    'Score: rank by impact, not by how fun it was.',
    'Explain: write the finding in plain language.',
    'Assemble the report programmatically.',
    'Test it on a second log and fix what breaks.'
  ] },
  w10: { tips: ['README', 'requirements.txt', 'git remote', 'screenshots', 'license', 'commit hygiene'], days: [
    'A README is the front door of your project.',
    'Dependencies listed means it runs on another machine.',
    'Push properly: remote, branch, history.',
    'Screenshots beat adjectives.',
    'License and scope keep it honest.',
    'Clean commits read like a diary of competence.'
  ] },
  w11: { tips: ['one-page CV', 'cold email', 'application tracker', 'internship boards', 'portfolio links', 'follow up'], days: [
    'The CV is a filter, not an autobiography.',
    'A cold email is three sentences and one link.',
    'Track every application: date, role, reply.',
    'Apply where the jobs actually are.',
    'Point every claim at a repo or a write-up.',
    'Follow up once, politely, then move on.'
  ] },
  w12: { tips: ['explain out loud', 'whiteboard a scan', 'answer under pressure', 'ask good questions', 'salary basics', 'close the loop'], days: [
    'Say the answer out loud until it is boring.',
    'Draw the attack path, not the tool list.',
    'Rehearse the weak spots: TLS, permissions, IDOR.',
    'Interviewers remember good questions.',
    'Know your number and your range.',
    'Close the loop: thank, summarise, follow up.'
  ] }
};

/**
 * Build the six day-rooms for a week.
 * Day 1-3: one shell task from the week's own boss lab plus three drills on the week's topic.
 * Day 4-5: four drills each, secondary topics so the week is not one-note.
 * Day 6: recap game, three mixed drills, then the deliverable reminder.
 */
export function weekRooms(week) {
  const meta = WEEK_ROOMS[week.id] || { tips: [], days: [] };
  const probing = practiceForWeek(week.week);
  const rest = PRACTICE.filter((q) => !probing.includes(q));
  const secondary = rest.length >= 8 ? rest : PRACTICE;
  const shell = (week.lab?.tasks || []).map((t) => ({ ...t, kind: 'shell' }));
  const offset = (week.week - 1) * 5;

  const from = (list, n, seed) => {
    const out = [];
    for (let i = 0; i < n; i++) out.push(wrap(list[(seed * 3 + i * 5) % list.length]));
    return out;
  };
  const wrap = (q) => ({ id: q.id, prompt: q.prompt, answer: q.answer, kind: q.kind, explain: q.explain, topic: q.topic, drill: true });

  const days = [];
  for (let day = 1; day <= 6; day++) {
    let tasks = [];
    if (day <= 3 && shell[day - 1]) tasks.push(shell[day - 1]);
    const want = day <= 3 ? 3 : 4;
    const main = day <= 3 ? from(probing, want, offset + day) : from(secondary, want, offset + day * 2);
    tasks = tasks.concat(main);
    days.push({
      day,
      title: meta.days[day - 1] || `Day ${day}`,
      tip: meta.tips[day - 1] || '',
      tasks
    });
  }
  return days;
}

/** Flat task list for a week, with ids unique inside the week. */
export function roomTasks(week) {
  const seen = new Set();
  const out = [];
  weekRooms(week).forEach((room) => {
    room.tasks.forEach((t) => {
      const id = seen.has(t.id) ? t.id + '-d' + room.day : t.id;
      seen.add(id);
      out.push({ ...t, id, day: room.day });
    });
  });
  return out;
}

export function weekTaskCount(week) {
  return roomTasks(week).length;
}
