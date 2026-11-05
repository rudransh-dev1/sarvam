import { CURRICULUM, LESSONS, lessonById, lessonIndex, TOTAL_LESSONS } from './data/curriculum.js';
import { WEEKS } from './data/roadmap.js';
import { todayView, drillsView, remainingView } from './questsview.js';
import { RES, MINDMAPS } from './data/roadmap.js';
import * as P from './progress.js';
import { createShell } from './terminal.js';
import { buildApp } from './weblab.js';

const app = document.getElementById('app');
const LAB_KEY = 'sarvam.labs.v1';

/* ---------------- helpers ---------------- */

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function toast(msg) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  requestAnimationFrame(() => el.classList.add('show'));
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2600);
}

function labCache() {
  try {
    return JSON.parse(sessionStorage.getItem(LAB_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveLabCache(obj) {
  try {
    sessionStorage.setItem(LAB_KEY, JSON.stringify(obj));
  } catch {
    /* ignore */
  }
}

function updateChrome() {
  const s = P.getState();
  document.getElementById('stat-xp').textContent = s.xp;
  document.getElementById('stat-streak').textContent = s.streak || 0;
  document.getElementById('stat-done').textContent = P.doneCount() + '/' + TOTAL_LESSONS;
  const due = P.cardStats().due;
  const pill = document.getElementById('due-pill');
  pill.textContent = due;
  pill.classList.toggle('zero', due === 0);
  document.querySelectorAll('.topnav a').forEach((a) => a.classList.remove('active'));
  const hash = location.hash || '#/';
  const key = hash.startsWith('#/review') ? 'review' : hash.startsWith('#/progress') ? 'progress' : hash.startsWith('#/lesson') ? '' : 'path';
  const link = document.querySelector(`.topnav a[data-nav="${key}"]`);
  if (link) link.classList.add('active');
}

/* ---------------- curriculum map ---------------- */

function levelNode(lesson) {
  const status = P.lessonStatus(lesson);
  const mc = P.missionCount(lesson);
  const href = status === 'locked' ? '#' : '#/lesson/' + lesson.id;
  const icon = status === 'done' ? '✓' : status === 'locked' ? '🔒' : String(lesson.week);
  const mm = lesson.map && MINDMAPS[lesson.map] ? MINDMAPS[lesson.map].name : '';
  return `
    <a class="level ${status}" href="${href}">
      <span class="level-orb">${icon}</span>
      <span class="level-body">
        <span class="level-week">WEEK ${lesson.week}</span>
        <span class="level-title">${esc(lesson.title.replace(/^Week \d+: /, ''))}</span>
        <span class="level-sub">${esc(lesson.sub)}</span>
        <span class="level-boss">Boss: ${esc(lesson.boss)}</span>
        <span class="level-bar"><i style="width:${mc.total ? Math.round((mc.done / mc.total) * 100) : 0}%"></i></span>
        <span class="level-meta">${mc.done}/${mc.total} missions${mm ? ' · map: ' + esc(mm) : ''}</span>
      </span>
      <span class="level-state">${status === 'done' ? 'cleared' : status === 'open' ? 'play' : 'locked'}</span>
    </a>`;
}

function sideRow(lesson) {
  const status = P.lessonStatus(lesson);
  const tag = lesson.labType === 'web' ? 'web lab' : lesson.labType === 'os' ? 'virtual box' : 'terminal lab';
  return `
    <a class="lesson-row" href="#/lesson/${lesson.id}">
      <span class="status-dot ${status}">${status === 'done' ? '✓' : '▸'}</span>
      <span class="lesson-body">
        <span class="lesson-title">${esc(lesson.title)}</span>
        <span class="lesson-sub">${esc(lesson.sub)}</span>
        <span class="lesson-tags"><span class="tag lab">${tag}</span><span class="tag">${lesson.minutes} min</span></span>
      </span>
      <span class="lesson-meta">${status === 'done' ? 'cleared' : 'optional'}</span>
    </a>`;
}

function renderPath() {
  const main = CURRICULUM.filter((p) => p.roadmap);
  const side = CURRICULUM.filter((p) => p.sideQuest);
  const next = P.nextLessonId();
  const pct = P.pctDone();
  const rank = P.rankFor();
  const st = P.getState();
  const mainTotal = P.mainLessons().length;

  const levels = main
    .map(
      (phase) => `
      <section class="phase">
        <div class="phase-head">
          <span class="phase-num">PHASE ${phase.num}</span>
          <h2>${esc(phase.title)}</h2>
          <span class="phase-meta">${esc(phase.meta)}${phase.lessons.every((l) => P.isDone(l.id)) ? ' · complete' : ''}</span>
        </div>
        <div class="levels">${phase.lessons.map(levelNode).join('')}</div>
      </section>`
    )
    .join('');

  const maps = Object.entries(MINDMAPS)
    .map(([key, m]) => {
      const unlockedBy = P.mainLessons().find((l) => l.map === key);
      const open = !unlockedBy || P.isUnlocked(LESSONS.indexOf(unlockedBy));
      return `<a class="mapcard ${open ? '' : 'locked'}" ${open ? `href="${m.url}" target="_blank" rel="noopener"` : 'href="#"'}>
        <span class="mapcard-name">${esc(m.name)}</span>
        <span class="mapcard-why">${esc(m.why)}</span>
        <span class="mapcard-when">${open ? 'open · Aman Hardikar' : 'unlocks in week ' + unlockedBy.week}</span>
      </a>`;
    })
    .join('');

  const sideBlocks = side
    .map(
      (ph) => `
      <div class="side-phase">
        <div class="side-head">${esc(ph.title)}</div>
        ${ph.lessons.map(sideRow).join('')}
      </div>`
    )
    .join('');

  app.innerHTML = `
    <section class="hero">
      <div class="hero-inner">
        <span class="hero-kicker"><span class="hero-dot"></span>${pct === 0 ? 'zero to intern-ready · 12 weeks' : pct === 100 ? 'roadmap complete' : 'level ' + (P.doneCount() + 1) + ' of ' + mainTotal}</span>
        <h1>${pct === 0 ? 'Twelve weeks. <em>One level at a time.</em>' : pct === 100 ? 'Every boss beaten. <em>Go get the internship.</em>' : 'Keep the streak. <em>Beat the next boss.</em>'}</h1>
        <p>Your roadmap, as a game. Daily missions, Hindi videos, a boss lab each week, and the proof-of-work deliverable the interviewers actually look for. Typing beats watching, so every level ends in a real terminal.</p>
        <div class="hero-actions">
          ${next ? `<a class="hero-cta" href="#/lesson/${next}"><button class="primary">${pct === 0 ? 'Start Week 1' : 'Continue: ' + esc(lessonById(next).title)}</button></a>` : ''}
          <a href="#/review"><button class="ghost">Review cards (${P.cardStats().due})</button></a>
        </div>
      </div>
      <img class="hero-crest" src="assets/img/crest.jpg" alt="" />
    </section>

    <section class="rankbar">
      <div class="rank-name"><small>current rank</small><strong>${esc(rank.cur.name)}</strong></div>
      <div class="rank-track"><i style="width:${rank.pct}%"></i></div>
      <div class="rank-next">${rank.next ? esc(rank.next.name) + ' at ' + rank.next.at + ' XP' : 'max rank'}</div>
    </section>

    <div class="grid-cards">
      <div class="metric"><div class="num">${pct}%</div><div class="lbl">roadmap cleared</div></div>
      <div class="metric"><div class="num">${P.doneCount()}/${mainTotal}</div><div class="lbl">boss labs beaten</div></div>
      <div class="metric"><div class="num">${P.cardStats().due}</div><div class="lbl">cards due now</div></div>
      <div class="metric"><div class="num">${st.xp}</div><div class="lbl">total xp</div></div>
    </div>

    ${levels}

    <section class="phase">
      <div class="phase-head">
        <span class="phase-num">TOOLKIT</span>
        <h2>Aman Hardikar's mind maps</h2>
        <span class="phase-meta">28 free maps · these ${Object.keys(MINDMAPS).length} match your roadmap</span>
      </div>
      <div class="mapgrid">${maps}</div>
    </section>

    <section class="phase">
      <div class="phase-head">
        <span class="phase-num">SIDE QUESTS</span>
        <h2>Optional deep dives</h2>
        <span class="phase-meta">${P.sideDoneCount()} cleared · always open · extra XP</span>
      </div>
      ${sideBlocks}
    </section>
  `;
  updateChrome();
}

/* ---------------- labs: terminal, network, web ---------------- */

function labLabel(labType) {
  if (labType === 'web') return 'Lab · vulnerable web app';
  if (labType === 'os') return 'Lab · your own box (terminal + browser)';
  if (labType === 'terminal') return 'Lab · simulated shell';
  return 'Check';
}


/** Verifies the student's actual work in the simulated filesystem. Returns '' when satisfied, else a hint. */
let activeShell = null;
function gradeCheck(check) {
  const sh = activeShell;
  if (!sh) return 'no shell is running';
  if (check.fileRuns) {
    const src = sh.peek(check.fileRuns);
    if (src === null) return `${check.fileRuns} does not exist yet. Create it with echo "..." > ${check.fileRuns}`;
    const res = sh.runFile(check.fileRuns);
    if (res.err) return `${check.fileRuns} crashed:\n${res.out}`;
    if (check.outputIncludes && !res.out.includes(check.outputIncludes)) return `running ${check.fileRuns} did not print "${check.outputIncludes}". Run it and read the output.`;
    if (check.outputLines && res.out.split('\n').filter(Boolean).length !== check.outputLines) return `${check.fileRuns} should print ${check.outputLines} lines but printed ${res.out.split('\n').filter(Boolean).length}.`;
  }
  if (check.fileHas) {
    const [file, needles] = check.fileHas;
    const text = sh.peek(file);
    if (text === null) return `${file} does not exist yet.`;
    const miss = needles.filter((n) => !text.includes(n));
    if (miss.length) return `${file} is missing: ${miss.join(', ')}`;
  }
  if (check.gitCommit && sh.gitCommits().length === 0) return 'no commit yet. Run git init, git add ., git commit -m "message".';
  return '';
}

function mountLab(host, lesson, onPass) {
  const lab = lesson.lab || {};
  const cache = labCache();
  const done = new Set(cache[lesson.id] || []);
  let writer = () => {};
  let shell = null;

  host.innerHTML = `
    <div class="card">
      <div class="card-head">
        <h3>${esc(labLabel(lesson.labType))}</h3>
        <span class="spacer"></span>
        <button class="ghost" data-act="reset">reset</button>
      </div>
      <div id="stage"></div>
      <div class="tasks" id="tasks"></div>
      <div class="flagbar">
        <input id="answer-input" placeholder="${lesson.labType === 'web' ? 'flag you found in the app, e.g. SARVAM{...}' : 'answer or flag, e.g. SARVAM{...}'}" autocomplete="off" />
        <button class="primary" id="answer-btn">submit</button>
      </div>
    </div>`;

  const stage = host.querySelector('#stage');
  const tasksBox = host.querySelector('#tasks');

  const renderTasks = () => {
    tasksBox.innerHTML = (lab.tasks || [])
      .map(
        (t) => `
        <div class="task ${done.has(t.id) ? 'done' : ''}">
          <span class="tick">✓</span>
          <span class="task-text">${esc(t.prompt)}<span class="task-hint">${esc(t.hint)}</span></span>
        </div>`
      )
      .join('');
  };

  const persist = () => {
    cache[lesson.id] = [...done];
    saveLabCache(cache);
  };

  const finishIfDone = () => {
    persist();
    if (done.size === (lab.tasks || []).length) onPass();
  };

  /* --- terminal lab --- */

  function wireTerminal(container, compact) {
    container.innerHTML = `
      <div class="term ${compact ? 'term-sm' : ''}" id="term"></div>
      <div class="term-input-row">
        <span class="prompt" id="prompt"></span>
        <input id="term-input" autocomplete="off" spellcheck="false" aria-label="terminal input" />
      </div>`;
    shell = createShell(lab.fs, lab.startCwd || '/home/student', { net: lab.net, dirb: lab.dirb });
    activeShell = shell;
    const term = container.querySelector('#term');
    const input = container.querySelector('#term-input');
    const promptEl = container.querySelector('#prompt');

    const write = (text, cls = '') => {
      const div = document.createElement('div');
      if (cls) div.className = cls;
      div.textContent = text;
      term.appendChild(div);
      term.scrollTop = term.scrollHeight;
    };

    write(lab.intro || 'Lab ready. Type help.', 't-dim');
    write('');
    promptEl.textContent = shell.prompt();

    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const cmd = input.value;
      input.value = '';
      write(shell.prompt() + ' ' + cmd, 't-cmd');
      const res = shell.run(cmd);
      if (res.clear) term.innerHTML = '';
      else if (res.out) write(res.out, res.err ? 't-err' : '');
      promptEl.textContent = shell.prompt();
      term.scrollTop = term.scrollHeight;
    });

    input.focus();
    return write;
  }

  function paintTerminal() {
    const wrap = document.createElement('div');
    stage.appendChild(wrap);
    return wireTerminal(wrap, false);
  }

  /* --- web lab --- */

  function paintWeb() {
    const spec = lab.app || {};
    stage.innerHTML = `
      <div class="browser">
        <div class="browser-bar">
          <span class="browser-dots"><i></i><i></i><i></i></span>
          <span class="browser-url">${esc(spec.baseUrl || 'http://notes.lab:8080')}</span>
          <span class="browser-tag">sandbox</span>
        </div>
        <iframe id="webframe" title="lab web application" sandbox="allow-scripts" srcdoc="${esc(buildApp(spec))}"></iframe>
      </div>
      <p class="lab-note">${lab.intro || ''}</p>`;
    return () => {};
  }

  function paintOS() {
    const spec = lab.app || {};
    stage.innerHTML = `
      <div class="osdesk">
        <div class="window">
          <div class="win-bar">
            <span class="win-name">Terminal</span>
            <span class="win-btns"><i></i><i></i><i></i></span>
          </div>
          <div class="win-body" id="osterm"></div>
        </div>
        <div class="window">
          <div class="win-bar">
            <span class="win-name">Firefox</span>
            <span class="win-url">${esc(spec.baseUrl || 'http://fakebank.lab')}</span>
            <span class="win-btns"><i></i><i></i><i></i></span>
          </div>
          <div class="win-body win-frame">
            <iframe id="webframe" title="lab web application" sandbox="allow-scripts" srcdoc="${esc(buildApp(spec))}"></iframe>
          </div>
        </div>
      </div>
      <p class="lab-note">${lab.intro || ''}</p>`;
    return wireTerminal(stage.querySelector('#osterm'), true);
  }

  function paint() {
    if (lesson.labType === 'web') writer = paintWeb();
    else if (lesson.labType === 'os') writer = paintOS();
    else writer = paintTerminal();
  }

  renderTasks();
  paint();

  host.querySelector('[data-act="reset"]').addEventListener('click', () => {
    done.clear();
    stage.innerHTML = '';
    persist();
    renderTasks();
    paint();
    toast('Lab reset');
  });

  const answerInput = host.querySelector('#answer-input');
  const submit = () => {
    const raw = answerInput.value.trim();
    if (!raw) return;
    const norm = (v) => String(v).trim().toLowerCase().replace(/\s+/g, ' ');
    const matches = (t) => t.answer === '*' || norm(t.answer) === norm(raw) || (t.accept || []).some((a) => norm(a) === norm(raw));
    const hit = (lab.tasks || []).find((t) => !done.has(t.id) && matches(t));
    if (hit && hit.check) {
      const why = gradeCheck(hit.check);
      if (why) {
        writer('✗ right idea, but the work is not there yet: ' + why, 't-err');
        answerInput.select();
        return;
      }
      if (hit.answer === '*') {
        const commits = shell ? shell.gitCommits() : [];
        if (norm(raw) !== norm(commits[commits.length - 1]?.id || '')) {
          writer('✗ submit the commit id that git printed, e.g. [main 1a2b3c4].', 't-err');
          answerInput.select();
          return;
        }
      }
    }
    if (hit) {
      done.add(hit.id);
      answerInput.value = '';
      writer('✓ accepted: ' + hit.prompt, 't-flag');
      renderTasks();
      toast(done.size === (lab.tasks || []).length ? 'All tasks complete. Lab passed.' : 'Task cleared.');
      finishIfDone();
    } else {
      writer('✗ "' + raw + '" is not it. Read the output again, or open the hint.', 't-err');
      answerInput.select();
    }
  };
  host.querySelector('#answer-btn').addEventListener('click', submit);
  answerInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submit();
  });
}

/* ---------------- quiz lab ---------------- */

function mountQuizLab(host, lesson, onPass) {
  const quiz = lesson.quiz;
  const passAt = Math.ceil(quiz.questions.length * 0.7);

  host.innerHTML = `
    <div class="card">
      <div class="card-head">
        <h3>Check · ${quiz.questions.length} questions</h3>
        <span class="spacer"></span>
        <span class="tag quiz">pass ${passAt}/${quiz.questions.length}</span>
      </div>
      <div class="card-body">
        <div id="quiz-body"></div>
        <div style="display:flex;gap:10px;align-items:center;margin-top:6px">
          <button class="primary" id="quiz-check">check answers</button>
          <button class="ghost" id="quiz-retry">retry</button>
          <span id="quiz-result" style="margin-left:auto;font-size:13px;color:var(--muted)"></span>
        </div>
      </div>
    </div>`;

  const body = host.querySelector('#quiz-body');

  const build = () => {
    body.innerHTML = quiz.questions
      .map(
        (q, qi) => `
      <div class="q" data-q="${qi}">
        <div class="q-title">${qi + 1}. ${esc(q.q)}</div>
        ${q.options
          .map(
            (opt, oi) => `
          <label class="opt" data-opt="${oi}">
            <input type="radio" name="q${qi}" value="${oi}" />
            <span>${esc(opt)}</span>
          </label>`
          )
          .join('')}
        <div class="q-explain">${esc(q.explain)}</div>
      </div>`
      )
      .join('');

    body.querySelectorAll('.opt').forEach((label) => {
      label.addEventListener('click', () => {
        const name = label.querySelector('input').name;
        body.querySelectorAll(`input[name="${name}"]`).forEach((i) => i.closest('.opt').classList.remove('sel'));
        label.classList.add('sel');
      });
    });
  };

  build();

  host.querySelector('#quiz-check').addEventListener('click', () => {
    let correct = 0;
    quiz.questions.forEach((q, qi) => {
      const picked = body.querySelector(`input[name="q${qi}"]:checked`);
      const qEl = body.querySelector(`.q[data-q="${qi}"]`);
      qEl.querySelectorAll('.opt').forEach((o) => o.classList.remove('right', 'wrong'));
      const chosen = picked ? Number(picked.value) : -1;
      qEl.querySelector(`.opt[data-opt="${q.answer}"]`).classList.add('right');
      if (chosen === q.answer) correct++;
      else if (chosen >= 0) qEl.querySelector(`.opt[data-opt="${chosen}"]`).classList.add('wrong');
      qEl.querySelector('.q-explain').classList.add('show');
    });
    const result = host.querySelector('#quiz-result');
    result.textContent = `${correct}/${quiz.questions.length} correct`;
    if (correct >= passAt) {
      onPass();
    } else {
      toast('Not yet. Read the explanations, then retry.');
      result.style.color = 'var(--amber)';
    }
  });

  host.querySelector('#quiz-retry').addEventListener('click', () => {
    build();
    host.querySelector('#quiz-result').textContent = '';
  });
}

/* ---------------- lesson view ---------------- */

function missionsPanel(lesson) {
  const list = lesson.missions || [];
  if (!list.length) return '';
  const mc = P.missionCount(lesson);
  return `
    <div class="card missions">
      <div class="card-head"><h3>Daily missions</h3><span class="spacer"></span><span class="tag lab">${mc.done}/${mc.total} · +10 xp each</span></div>
      <div class="card-body">
        ${list
          .map(
            (m) => `
          <label class="mission ${P.missionDone(lesson.id, m.id) ? 'done' : ''}" data-m="${m.id}">
            <input type="checkbox" ${P.missionDone(lesson.id, m.id) ? 'checked' : ''} />
            <span class="mission-kind ${m.kind}">${m.kind === 'learn' ? 'LEARN' : 'BUILD'}</span>
            <span class="mission-text">${esc(m.text)}</span>
          </label>`
          )
          .join('')}
        ${lesson.deliverable ? `<div class="deliverable"><small>deliverable</small><strong>${esc(lesson.deliverable)}</strong></div>` : ''}
        ${lesson.ai ? `<div class="aibox"><small>how AI fits this week</small>${esc(lesson.ai)}</div>` : ''}
      </div>
    </div>`;
}

function resourcesPanel(lesson) {
  const ids = lesson.resources || [];
  if (!ids.length) return '<div class="card"><div class="card-body">No external resources for this one. The lab is the lesson.</div></div>';
  const group = (kind, label) => {
    const items = ids.map((id) => RES[id]).filter((r) => r && r.kind === kind);
    if (!items.length) return '';
    return `<h4 class="res-h">${label}</h4>` + items
      .map((r) => `<a class="res" href="${esc(r.url)}" target="_blank" rel="noopener">
          <span class="res-badge ${r.kind}">${r.kind === 'hindi' ? 'हिन्दी' : r.kind === 'english' ? 'EN' : 'LAB'}</span>
          <span class="res-body"><strong>${esc(r.title)}</strong><small>${esc(r.note)}</small></span>
          <span class="res-go">open ↗</span>
        </a>`)
      .join('');
  };
  const mm = lesson.map && MINDMAPS[lesson.map] ? MINDMAPS[lesson.map] : null;
  return `
    <div class="card">
      <div class="card-head"><h3>Resources for this week</h3></div>
      <div class="card-body">
        ${group('hindi', 'Watch in Hindi')}
        ${group('platform', 'Practise on the platforms (English)')}
        ${group('english', 'Optional English')}
        ${mm ? `<h4 class="res-h">Mind map for this level</h4>
          <a class="res" href="${esc(mm.url)}" target="_blank" rel="noopener">
            <span class="res-badge map">MAP</span>
            <span class="res-body"><strong>${esc(mm.name)}</strong><small>${esc(mm.why)}</small></span>
            <span class="res-go">open ↗</span>
          </a>` : ''}
      </div>
    </div>`;
}

function renderLesson(id, tab) {
  const lesson = lessonById(id);
  if (!lesson) {
    location.hash = '#/';
    return;
  }
  const index = lessonIndex(id);
  if (!P.isUnlocked(index)) {
    const prev = LESSONS.filter((l) => !l.sideQuest)[LESSONS.filter((l) => !l.sideQuest).findIndex((l) => l.id === id) - 1];
    app.innerHTML = `
      <div class="page-head"><h1>Locked</h1><p>Beat ${prev ? 'the boss of ' + esc(prev.title) : 'the previous level'} first. That is the design: the roadmap only works in order.</p></div>
      <a href="#/">← back to the map</a>`;
    updateChrome();
    return;
  }

  const roadmap = !lesson.sideQuest;
  const chain = LESSONS.filter((l) => !l.sideQuest);
  const next = roadmap ? chain[chain.findIndex((l) => l.id === id) + 1] || null : null;
  const hasMissions = (lesson.missions || []).length > 0;
  const startTab = tab || (hasMissions && !P.isDone(id) ? 'missions' : 'lab');
  const done = P.isDone(id);

  app.innerHTML = `
    <div class="page-head">
      <a href="#/" style="font-size:13px">← ${roadmap ? 'level map' : 'side quests'}</a>
      <h1 style="margin-top:8px">${esc(lesson.title)}</h1>
      <p>${roadmap ? 'Phase ' + lesson.phaseNum + ' · ' + esc(lesson.phaseTitle) : 'Side quest · ' + esc(lesson.phaseTitle)} · about ${lesson.minutes} min · ${done ? 'boss beaten, replay is good' : roadmap ? 'beat the boss lab to unlock the next week' : 'optional, earns XP'}</p>
    </div>

    ${hasMissions ? `
    <div class="tabs" role="tablist">
      <button data-tab="missions">1 · Missions</button>
      <button data-tab="concept">2 · Concept</button>
      <button data-tab="lab">3 · Boss lab${lesson.boss ? ': ' + esc(lesson.boss) : ''}</button>
      <button data-tab="resources">4 · Resources</button>
    </div>` : ''}

    <div id="pane-missions" class="pane">${hasMissions ? missionsPanel(lesson) : ''}</div>
    <div id="pane-concept" class="pane">
      <article class="card concept"><div class="card-head"><h3>Concept</h3></div><div class="card-body">${lesson.concept}</div></article>
    </div>
    <div id="pane-resources" class="pane">${hasMissions ? resourcesPanel(lesson) : ''}</div>
    <div id="pane-lab" class="pane">
      <div class="lesson-wrap ${lesson.labType === 'os' ? 'os' : ''} ${hasMissions ? 'single' : ''}">
        ${hasMissions ? '' : `<article class="card concept"><div class="card-head"><h3>Concept</h3></div><div class="card-body">${lesson.concept}</div></article>`}
        <div id="lab-host"></div>
      </div>
    </div>

    <div id="lesson-foot" style="margin-top:18px"></div>
  `;

  const showTab = (name) => {
    app.querySelectorAll('.pane').forEach((p) => p.classList.toggle('on', p.id === 'pane-' + name));
    app.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === name));
  };
  if (hasMissions) {
    app.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));
    showTab(startTab);
    app.querySelectorAll('.mission input').forEach((box) =>
      box.addEventListener('change', () => {
        const row = box.closest('.mission');
        const on = P.toggleMission(lesson.id, row.dataset.m);
        row.classList.toggle('done', on);
        const mc = P.missionCount(lesson);
        app.querySelector('.missions .tag').textContent = `${mc.done}/${mc.total} · +10 xp each`;
        if (on && mc.done === mc.total) toast('All missions ticked. Now beat the boss lab.');
        updateChrome();
      })
    );
  } else {
    app.querySelector('#pane-lab').classList.add('on');
    app.querySelector('#pane-concept').style.display = 'none';
  }

  const host = document.getElementById('lab-host');
  const foot = document.getElementById('lesson-foot');

  const paintFoot = (justPassed = false) => {
    const passed = P.isDone(id);
    foot.innerHTML = `
      ${justPassed ? `<div class="victory"><div class="victory-title">BOSS DEFEATED${lesson.boss ? ': ' + esc(lesson.boss) : ''}</div><div>${(lesson.cards || []).length} review cards scheduled (1, 3 and 7 days). ${lesson.deliverable ? 'Now ship the deliverable: <strong>' + esc(lesson.deliverable) + '</strong>.' : ''}</div></div>` : ''}
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        ${next && passed ? `<a href="#/lesson/${next.id}"><button class="primary">next: ${esc(next.title)}</button></a>` : ''}
        ${next && !passed ? `<button disabled>next week unlocks when the boss falls</button>` : ''}
        ${!next && passed && roadmap ? '<div class="callout">Roadmap complete. Apply, apply, apply.</div>' : ''}
        ${passed ? '<a href="#/review"><button>go review</button></a>' : ''}
        <a href="#/"><button class="ghost">back to the map</button></a>
      </div>`;
  };

  const onPass = () => {
    const res = P.completeLesson(lesson);
    if (!res.already && lesson.sideQuest) P.getState().xp += 20;
    P.save();
    paintFoot(true);
    toast(res.already ? 'Passed again, nice.' : roadmap ? 'Boss defeated. Next week unlocked.' : 'Side quest cleared.');
    updateChrome();
  };

  if (lesson.labType === 'terminal' || lesson.labType === 'web' || lesson.labType === 'os') mountLab(host, lesson, onPass);
  else mountQuizLab(host, lesson, onPass);

  paintFoot(false);
  updateChrome();
}

/* ---------------- quest boards ---------------- */

const renderToday = (pickDay) => todayView(app, pickDay);
const renderDrills = (page) => drillsView(app, page);
const renderRemaining = (page) => remainingView(app, page);

/* ---------------- review ---------------- */

function renderReview() {
  P.touchDay();
  const stats = P.cardStats();
  const queue = P.dueCards().slice(0, 40);

  if (queue.length === 0) {
    app.innerHTML = `
      <div class="page-head">
        <h1>Review</h1>
        <p>${stats.total === 0 ? 'Pass a lab and its cards land here, spaced across days so the concept survives the week.' : 'Nothing due right now. Come back tomorrow, or replay a lab you rushed.'}</p>
      </div>
      <div class="grid-cards">
        <div class="metric"><div class="num">${stats.total}</div><div class="lbl">total cards</div></div>
        <div class="metric"><div class="num">${stats.learned}</div><div class="lbl">in long-term memory</div></div>
        <div class="metric"><div class="num">0</div><div class="lbl">due now</div></div>
      </div>
      ${stats.total === 0 ? '<a href="#/"><button class="primary">start the first lesson</button></a>' : '<a href="#/"><button>back to curriculum</button></a>'}`;
    updateChrome();
    return;
  }

  let i = 0;
  let revealed = false;

  const paint = () => {
    const card = queue[i];
    const lesson = lessonById(card.lessonId);
    app.innerHTML = `
      <div class="page-head">
        <h1>Review</h1>
        <p>Card ${i + 1} of ${queue.length} · from <a href="#/lesson/${card.lessonId}">${esc(lesson ? lesson.title : card.lessonId)}</a></p>
      </div>
      <div class="flashcard">
        <div>
          <div>${esc(card.front)}</div>
          ${revealed ? `<div class="back">${esc(card.back)}</div>` : ''}
        </div>
      </div>
      <div class="grade-row">
        ${revealed
          ? `<button data-g="0">again</button><button data-g="1">hard</button><button data-g="2" class="primary">good</button><button data-g="3">easy</button>`
          : `<button class="primary" id="reveal">show answer</button>`}
      </div>
      <p style="color:var(--muted);font-size:13px;margin-top:14px">Grade honestly. "Again" costs 10 minutes, "easy" buys weeks.</p>
    `;
    const revealBtn = document.getElementById('reveal');
    if (revealBtn) revealBtn.addEventListener('click', () => { revealed = true; paint(); });
    document.querySelectorAll('.grade-row [data-g]').forEach((b) => {
      b.addEventListener('click', () => {
        P.gradeCard(card.id, Number(b.dataset.g));
        i++;
        revealed = false;
        if (i >= queue.length) {
          toast('Review done for today.');
          renderReview();
        } else {
          paint();
        }
        updateChrome();
      });
    });
  };

  paint();
  updateChrome();
}

/* ---------------- progress ---------------- */

function renderProgress() {
  const s = P.getState();
  const stats = P.cardStats();
  const byLesson = LESSONS.map((l) => {
    const entry = s.lessons[l.id];
    return `<tr>
      <td>${esc(l.title)}</td>
      <td class="mono">${l.phaseNum}</td>
      <td class="mono">${entry?.done ? '✓ passed' : P.lessonStatus(l) === 'open' ? 'open' : 'locked'}</td>
      <td class="mono">${entry?.attempts || 0}</td>
    </tr>`;
  }).join('');

  const phaseBars = CURRICULUM.map((phase) => {
    const total = phase.lessons.length;
    const done = phase.lessons.filter((l) => P.isDone(l.id)).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    return `<div style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px">
        <span>Phase ${phase.num} · ${esc(phase.title)}</span><span class="mono">${done}/${total}</span>
      </div>
      <div class="bar"><div style="width:${pct}%"></div></div>
    </div>`;
  }).join('');

  app.innerHTML = `
    <div class="page-head">
      <h1>Progress</h1>
      <p>Stored on this device only. No account, nothing leaves the browser.</p>
    </div>
    <div class="grid-cards">
      <div class="metric"><div class="num">${s.xp}</div><div class="lbl">xp</div></div>
      <div class="metric"><div class="num">${s.streak || 0}</div><div class="lbl">day streak</div></div>
      <div class="metric"><div class="num">${P.doneCount()}/${TOTAL_LESSONS}</div><div class="lbl">labs passed</div></div>
      <div class="metric"><div class="num">${stats.learned}/${stats.total}</div><div class="lbl">cards in memory</div></div>
    </div>

    <div class="card" style="margin-bottom:18px">
      <div class="card-head"><h3>Phase completion</h3></div>
      <div class="card-body">${phaseBars}</div>
    </div>

    <div class="card">
      <div class="card-head"><h3>Lesson log</h3></div>
      <div class="card-body" style="padding:0">
        <table>
          <thead><tr><th>Lesson</th><th>Phase</th><th>Status</th><th>Attempts</th></tr></thead>
          <tbody>${byLesson}</tbody>
        </table>
      </div>
    </div>

    <div style="margin-top:18px;display:flex;gap:10px;flex-wrap:wrap">
      <button id="export">export progress data</button>
      <button class="ghost" id="reset">reset everything</button>
    </div>
    <pre id="dump" class="hidden" style="background:#070e14;border:1px solid var(--line);border-radius:9px;padding:12px;font-size:12px;overflow:auto;max-height:240px"></pre>
  `;

  document.getElementById('export').addEventListener('click', () => {
    const dump = document.getElementById('dump');
    dump.textContent = P.exportData();
    dump.classList.remove('hidden');
    toast('Copy that if you want a backup.');
  });
  document.getElementById('reset').addEventListener('click', () => {
    if (confirm('Delete all local progress, cards and streak?')) {
      P.resetAll();
      sessionStorage.removeItem(LAB_KEY);
      renderProgress();
      updateChrome();
    }
  });
  updateChrome();
}

/* ---------------- about ---------------- */

function renderAbout() {
  app.innerHTML = `
    <div class="page-head">
      <h1>How Sarvam works</h1>
      <p>Built for one student who got tired of watching videos and remembering nothing.</p>
    </div>
    <div class="card" style="max-width:760px">
      <div class="card-body concept">
        <h3>The loop</h3>
        <ol>
          <li><strong>Concept.</strong> Short, no filler, written to be reread in 60 seconds.</li>
          <li><strong>Lab.</strong> You prove it, in the browser, immediately. Terminal labs simulate a real box with real commands and real permission errors.</li>
          <li><strong>Gating.</strong> The next lesson stays locked until this lab passes. No skipping the permissions lesson and then wondering why the exploit guide makes no sense.</li>
          <li><strong>Spaced review.</strong> Passing a lab schedules its three cards for review at 1, 3, 7 and then longer intervals. This is the part that gets you through exams.</li>
        </ol>
        <h3>What is local and what is not</h3>
        <p>Progress, cards and streak live in <code>localStorage</code> on this device. There is no server, no account, no tracking. Export from the Progress page if you want a backup.</p>
        <h3>Adding lessons</h3>
        <p>All content is in <code>js/data/curriculum.js</code>. Add an object to a phase's <code>lessons</code> array and it appears in the map, gated in order, with its cards joining the review queue. Terminal labs take a filesystem object and a list of tasks. Quiz labs take questions.</p>
        <h3>Honest limits</h3>
        <p>This box is simulated: it teaches commands, permissions and log reading, not kernel exploits. When a topic needs a real machine, use the roadmap's handoff: your own VM or a free lab, then bring the flag back here.</p>
      </div>
    </div>
    <p style="margin-top:18px;color:var(--muted);font-size:13px">
      Content follows the Sarvam roadmap: fundamentals before security, always.
    </p>`;
  updateChrome();
}

/* ---------------- router ---------------- */

function route() {
  P.touchDay();
  const hash = location.hash || '#/';
  const m = hash.match(/^#\/lesson\/([\w-]+)/);
  const t = hash.match(/^#\/today(?:\/(\d+))?/);
  let dr, rm;
  if (m) renderLesson(m[1]);
  else if (t) renderToday(t[1] ? Number(t[1]) : null);
  else if ((dr = hash.match(/^#\/drills(?:\/(\d+))?/))) renderDrills(dr[1] ? Number(dr[1]) : 1);
  else if ((rm = hash.match(/^#\/remaining(?:\/(\d+))?/))) renderRemaining(rm[1] ? Number(rm[1]) : 1);
  else if (hash.startsWith('#/review')) renderReview();
  else if (hash.startsWith('#/progress')) renderProgress();
  else if (hash.startsWith('#/about')) renderAbout();
  else renderPath();
  updateChrome();
}

window.addEventListener('hashchange', route);
window.addEventListener('DOMContentLoaded', route);
route();
