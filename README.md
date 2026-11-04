# Sarvam

A gated zero-to-cyber curriculum with hands-on labs in the browser. Learn a concept, prove it in the
lab, and the concept comes back on a spaced-review schedule so it survives the exam.

No framework, no build step, no server, no account. Plain HTML, CSS and ES modules. Progress lives in
`localStorage`.

Live: https://rudransh-dev1.github.io/sarvam/ (after your first push and Pages is switched on)

---

## Run it locally

```bash
cd sarvam
python3 -m http.server 8080
# open http://localhost:8080
```

Any static server works. Opening `index.html` directly with `file://` will not work, because ES modules
need HTTP.

## How it works

| File | Job |
|---|---|
| `index.html` | shell, header, stats, mount point |
| `js/app.js` | router and every view (map, lesson, review, progress, about) |
| `js/data/curriculum.js` | **all content**: phases, lessons, concept HTML, lab filesystems, quiz questions, cards |
| `js/terminal.js` | simulated shell: fake filesystem, permissions, pipes, 20+ commands |
| `js/progress.js` | unlocking, XP, streak, SM-2 style spaced repetition in `localStorage` |
| `test/verify.mjs` | headless check that every lab is solvable with the shell it ships |
| `test/render.mjs` | jsdom end-to-end: boots the app, plays two lessons, checks gating and the review queue |

The loop is enforced in code: `isUnlocked(index)` only returns true when the previous lesson is passed,
so a learner cannot reach SQL injection without passing permissions and logs first.

## Add a lesson

Everything comes from one array. Append to a phase in `js/data/curriculum.js`:

```js
{
  id: 'p1-find',
  title: 'Finding things with find',
  sub: 'Name, type, time, permissions',
  minutes: 12,
  labType: 'terminal',            // or 'quiz'
  concept: `<h2>...</h2><p>...</p>`,
  lab: {
    startCwd: '/home/student',
    intro: 'Find the three files...',
    fs: d('755', { home: d('755', { student: d('755', {}) }) }),
    tasks: [{ id: 't1', prompt: '...', hint: '...', answer: '42' }]
  },
  cards: [
    { front: 'question', back: 'answer' },
    { front: 'question', back: 'answer' },
    { front: 'question', back: 'answer' }
  ]
}
```

Filesystem helpers `d(mode, children)` and `f(mode, content, owner)` are defined at the top of that
file. Modes are the usual octal strings, and `4755` marks a setuid binary.

For a quiz lesson, use `labType: 'quiz'` and a `quiz: { questions: [{ q, options, answer, explain }] }`
block instead of `lab`. The pass mark is 70%.

## Tests

```bash
node test/verify.mjs     # content and lab solvability, no dependencies
npm i jsdom              # once, only needed for the render test
node test/render.mjs     # full UI flow
```

`verify.mjs` is the important one: it runs the real shell against every task in every terminal lab and
fails if an answer is not actually reachable. Add a lesson and it is checked automatically.

## Deploy to GitHub Pages

```bash
git init
git add .
git commit -m "sarvam: gated curriculum with labs"
git branch -M main
git remote add origin https://github.com/rudransh-dev1/sarvam.git
git push -u origin main
```

Then on GitHub: Settings → Pages → Source: Deploy from a branch → `main` / `/ (root)` → Save.
The site appears at `https://rudransh-dev1.github.io/sarvam/` in about a minute. `.nojekyll` is already
there so files starting with an underscore are served.

Alternative with a drag and drop: Cloudflare Pages → Create project → Direct upload → drop the folder.
Same free tier, better bandwidth.

## What is simulated and what is not

- Simulated: the shell, the filesystem, permissions, sudo rules, log files, packet data in the quizzes.
  That is deliberate. It is instant, offline, costs nothing, and cannot be abused.
- Real: the commands you type, the octal arithmetic, the log-reading technique, the review schedule.
- Not included yet: a real Linux VM in a tab (planned: WebAssembly Linux for the few lessons that need
  real coreutils), a pcap viewer, an intentionally vulnerable mock web app for XSS and IDOR labs.

## Content ethics

Everything here is defensive learning on self-contained simulated systems. Nothing in this repo can be
pointed at a system you do not own. Keep it that way: real practice belongs on your own VM or a platform
that authorised it.
