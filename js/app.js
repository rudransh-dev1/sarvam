import { CURRICULUM, LESSONS, lessonById, lessonIndex, TOTAL_LESSONS } from './data/curriculum.js';
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

function renderPath() {
  const cards = CURRICULUM.map((phase) => {
    const rows = phase.lessons
      .map((lesson) => {
        const status = P.lessonStatus(lesson);
        const index = lessonIndex(lesson.id);
        const labTag =
          lesson.labType === 'web'
            ? '<span class="tag lab">web lab</span>'
            : lesson.labType === 'os'
              ? '<span class="tag lab">virtual box</span>'
              : lesson.labType === 'terminal'
                ? '<span class="tag lab">terminal lab</span>'
                : '<span class="tag quiz">check</span>';
        const dot = status === 'done' ? '✓' : status === 'open' ? '▸' : '🔒';
        const href = status === 'locked' ? '#' : '#/lesson/' + lesson.id;
        const clickable = status === 'locked' ? 'locked' : '';
        return `
          <a class="lesson-row ${clickable}" href="${href}">
            <span class="status-dot ${status}">${dot}</span>
            <span class="lesson-body">
              <span class="lesson-title">${esc(lesson.title)}</span>
              <span class="lesson-sub">${esc(lesson.sub)}</span>
              <span class="lesson-tags">${labTag}<span class="tag">${lesson.minutes} min</span><span class="tag">${(lesson.cards || []).length} cards</span>${
                status === 'locked' ? '<span class="tag">locked</span>' : ''
              }</span>
            </span>
            <span class="lesson-meta">${status === 'done' ? 'passed' : status === 'open' ? 'next up' : 'locked'}</span>
          </a>`;
      })
      .join('');

    const phaseStatus = phase.lessons.every((l) => P.isDone(l.id)) ? 'complete' : '';
    return `
      <section class="phase">
        <div class="phase-head">
          <span class="phase-num">PHASE ${phase.num}</span>
          <h2>${esc(phase.title)}</h2>
          <span class="phase-meta">${esc(phase.meta)}${phaseStatus ? ' · complete' : ''}</span>
        </div>
        ${rows}
      </section>`;
  }).join('');

  const next = P.nextLessonId();
  const pct = P.pctDone();

  app.innerHTML = `
    <section class="hero">
      <div class="hero-inner">
        <span class="hero-kicker"><span class="hero-dot"></span>${pct === 0 ? 'zero to cyber, in your browser' : pct === 100 ? 'curriculum complete' : 'in progress · ' + pct + '%'}</span>
        <h1>${pct === 0 ? 'Learn the machine <em>before</em> you break it.' : pct === 100 ? 'Every lab passed. <em>Keep it warm.</em>' : 'One lab at a time. <em>No skipping.</em>'}</h1>
        <p>Concept on the left, live lab on the right, a flag box that decides whether you actually understood it.
        Foundations first: shell, permissions, packets, code. Then the offensive and defensive work.</p>
        <div class="hero-actions">
          ${next ? `<a class="hero-cta" href="#/lesson/${next}"><button class="primary">${pct === 0 ? 'Start your first hack' : 'Continue: ' + esc(lessonById(next).title)}</button></a>` : ''}
          <a href="#/review"><button class="ghost">Review cards (${P.cardStats().due})</button></a>
        </div>
      </div>
      <img class="hero-crest" src="assets/img/crest.jpg" alt="" />
    </section>

    <div class="grid-cards">
      <div class="metric"><div class="num">${pct}%</div><div class="lbl">curriculum passed</div></div>
      <div class="metric"><div class="num">${P.doneCount()}/${TOTAL_LESSONS}</div><div class="lbl">labs passed</div></div>
      <div class="metric"><div class="num">${P.cardStats().due}</div><div class="lbl">cards due now</div></div>
      <div class="metric"><div class="num">${P.getState().xp}</div><div class="lbl">total xp</div></div>
    </div>

    ${next ? `<div class="callout">Next up: <a href="#/lesson/${next}">${esc(lessonById(next).title)}</a></div>` : '<div class="callout">Curriculum complete. Switch to Review and keep the cards warm.</div>'}

    ${cards}
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
    const hit = (lab.tasks || []).find((t) => !done.has(t.id) && (norm(t.answer) === norm(raw) || (t.accept || []).some((a) => norm(a) === norm(raw))));
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

function renderLesson(id) {
  const lesson = lessonById(id);
  if (!lesson) {
    location.hash = '#/';
    return;
  }
  const index = lessonIndex(id);
  if (!P.isUnlocked(index)) {
    app.innerHTML = `
      <div class="page-head"><h1>Locked</h1><p>Pass the lesson before this one first. That is the design.</p></div>
      <a href="#/">← back to the curriculum</a>`;
    updateChrome();
    return;
  }

  const done = P.isDone(id);
  const next = LESSONS[index + 1] || null;

  app.innerHTML = `
    <div class="page-head">
      <a href="#/" style="font-size:13px">← curriculum</a>
      <h1 style="margin-top:8px">${esc(lesson.title)}</h1>
      <p>Phase ${lesson.phaseNum} · ${esc(lesson.phaseTitle)} · ${lesson.minutes} min · ${done ? 'already passed, replaying is good' : 'pass the lab to unlock the next lesson'}</p>
    </div>

    <div class="lesson-wrap">
      <article class="card concept">
        <div class="card-head"><h3>Concept</h3></div>
        <div class="card-body">${lesson.concept}</div>
      </article>
      <div id="lab-host"></div>
    </div>

    <div id="lesson-foot" style="margin-top:18px"></div>
  `;

  const host = document.getElementById('lab-host');
  const foot = document.getElementById('lesson-foot');

  const paintFoot = (justPassed = false) => {
    const passed = P.isDone(id);
    foot.innerHTML = `
      ${justPassed ? '<div class="callout" style="margin-bottom:12px">Passed. ' + (lesson.cards || []).length + ' review cards scheduled. They come back in 1, 3 and 7 days.</div>' : ''}
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        ${next && passed ? `<a href="#/lesson/${next.id}"><button class="primary">next: ${esc(next.title)}</button></a>` : ''}
        ${next && !passed ? `<button disabled>next unlocks when this lab passes</button>` : ''}
        ${passed ? '<a href="#/review"><button>go review</button></a>' : ''}
        <a href="#/"><button class="ghost">back to curriculum</button></a>
      </div>`;
  };

  const onPass = () => {
    const res = P.completeLesson(lesson);
    paintFoot(true);
    toast(res.already ? 'Passed again, nice.' : 'Lab passed. Next lesson unlocked.');
    updateChrome();
  };

  if (lesson.labType === 'terminal' || lesson.labType === 'web' || lesson.labType === 'os') mountLab(host, lesson, onPass);
  else mountQuizLab(host, lesson, onPass);

  paintFoot(false);
  updateChrome();
}

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
  if (m) renderLesson(m[1]);
  else if (hash.startsWith('#/review')) renderReview();
  else if (hash.startsWith('#/progress')) renderProgress();
  else if (hash.startsWith('#/about')) renderAbout();
  else renderPath();
  updateChrome();
}

window.addEventListener('hashchange', route);
window.addEventListener('DOMContentLoaded', route);
route();
