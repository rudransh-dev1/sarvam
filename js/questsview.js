/**
 * Practice quest views: today's four, the full drill list (10 a page), and the Remaining tray.
 * Quests are optional everywhere: nothing here gates a week.
 */
import * as P from './progress.js';
import { WEEKS } from './data/roadmap.js';
import { PRACTICE, dayPractice, pageOf, checkPractice } from './data/questbank.js';

const esc = (s) =>
  String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const clock = () => P.questClock();
const weekFor = (index) => WEEKS[Math.min(index, WEEKS.length - 1)];

/** Every quest of every day that has already passed and is still unsolved. */
export function carriedQuests() {
  const { weekIndex, dayInWeek } = clock();
  const out = [];
  for (let w = 0; w <= Math.min(weekIndex, WEEKS.length - 1); w++) {
    const lastDay = w < weekIndex ? 6 : dayInWeek - 1;
    for (let d = 1; d <= lastDay; d++) {
      dayPractice(w + 1, d).forEach((q, i) => {
        const id = 'd' + (w + 1) + '-' + d + '-q' + (i + 1) + '-' + q.id;
        if (!P.questDone(id)) out.push({ ...q, dailyId: id, week: w + 1, day: d });
      });
    }
  }
  return out;
}

function questCard(q, id, xp, tag) {
  const on = P.questDone(id);
  return `<div class="quest ${on ? 'done' : ''}" data-quest="${id}" data-answer="${esc(q.answer)}" data-explain="${esc(q.explain || '')}" data-xp="${xp}">
    <div class="quest-top">
      <span class="quest-kind k-${q.kind}">${tag || q.kind}</span>
      <span class="quest-topic">${esc(q.topic || 'practice')}</span>
      ${on ? '<span class="quest-ok">solved</span>' : ''}
    </div>
    <div class="quest-title">${esc(q.title)}</div>
    <div class="quest-prompt ${q.pre ? 'pre' : ''}">${esc(q.prompt)}</div>
    ${on
      ? `<div class="quest-explain">${esc(q.explain || '')}</div>`
      : `<form class="quest-form" data-quest-form="${id}">
          <input name="answer" autocomplete="off" placeholder="type your answer" />
          <button class="primary" type="submit">submit</button>
        </form>
        <div class="quest-feedback" data-fb="${id}"></div>
        ${q.hint ? `<details class="quest-hint"><summary>hint</summary><code>${esc(q.hint)}</code></details>` : ''}`}
  </div>`;
}

function wireQuests(root) {
  root.querySelectorAll('[data-quest-form]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = form.getAttribute('data-quest-form');
      const card = root.querySelector(`[data-quest="${id}"]`);
      const input = form.querySelector('input');
      const value = input.value;
      const quest = { answer: card.getAttribute('data-answer'), alt: [] };
      const ok = checkPractice(quest, value);
      const fb = root.querySelector(`[data-fb="${id}"]`);
      if (ok) {
        P.toggleQuest(id, Number(card.getAttribute('data-xp')) || 10);
        card.classList.add('done');
        if (fb) fb.innerHTML = '<span class="good">correct, +' + (card.getAttribute('data-xp') || 10) + ' xp</span>';
        setTimeout(() => {
          card.querySelector('.quest-form')?.remove();
          card.querySelector('.quest-hint')?.remove();
          const ok2 = document.createElement('span');
          ok2.className = 'quest-ok';
          ok2.textContent = 'solved';
          card.querySelector('.quest-top').appendChild(ok2);
          const note = card.getAttribute('data-explain');
          if (note) {
            const ex = document.createElement('div');
            ex.className = 'quest-explain';
            ex.textContent = note;
            card.appendChild(ex);
          }
        }, 700);
      } else if (fb) {
        fb.innerHTML = '<span class="bad">not it. rewrite the command, or check the hint.</span>';
      }
    });
  });
  // quests already solved in another tab still read as done
  root.querySelectorAll('.quest').forEach((card) => {
    if (P.questDone(card.getAttribute('data-quest'))) card.classList.add('done');
  });
}

/* ---------------- today ---------------- */

export function todayView(host, pickDay) {
  const { weekIndex, dayInWeek } = clock();
  const week = weekFor(weekIndex);
  const day = Math.max(1, Math.min(pickDay || dayInWeek, 6));
  const quests = dayPractice(week.week || weekIndex + 1, day);
  const ids = quests.map((q, i) => 'd' + (week.week || weekIndex + 1) + '-' + day + '-q' + (i + 1) + '-' + q.id);
  const solved = ids.filter((id) => P.questDone(id)).length;
  const carried = carriedQuests();

  host.innerHTML = `
    <div class="page-head">
      <h1>Today</h1>
      <p>Four practice quests. Answer them, run the command, or leave them: they change tomorrow on their own and anything you skip waits in Remaining.</p>
    </div>
    <div class="today-grid">
      <div>
        <div class="board-head">
          <div>
            <div class="board-week">Day ${day} of 6 · Week ${week.week} · ${esc(week.title)}</div>
            <div class="board-sub">${solved}/${quests.length} solved · ${solved * 10} xp earned today</div>
          </div>
          <div class="board-bar"><div style="width:${Math.round((solved / quests.length) * 100)}%"></div></div>
        </div>
        <div class="quest-list">${quests.map((q, i) => questCard(q, ids[i], 10)).join('')}</div>
        <div class="board-foot">
          <a class="ghost" href="#/today/${day === 6 ? 1 : day + 1}">See tomorrow's four →</a>
          <a class="ghost" href="#/lesson/${week.id}">Open week ${week.week} lab →</a>
        </div>
      </div>
      <aside class="today-side">
        <div class="side-card">
          <h3>Remaining</h3>
          <p class="muted small">${carried.length ? carried.length + ' quests you skipped still count. Nothing expires.' : 'Nothing waiting. Clean slate.'}</p>
          ${carried.length ? '<a class="primary block" href="#/remaining/1">Finish them →</a>' : ''}
        </div>
        <div class="side-card">
          <h3>This week</h3>
          <div class="day-grid">
            ${[1, 2, 3, 4, 5, 6]
              .map((d) => {
                const qs = dayPractice(week.week || weekIndex + 1, d);
                const done = qs.filter((q, i) => P.questDone('d' + (week.week || weekIndex + 1) + '-' + d + '-q' + (i + 1) + '-' + q.id)).length;
                return `<a class="day-tab ${d === day ? 'on' : ''}" href="#/today/${d}">Day ${d}<span>${done}/4</span></a>`;
              })
              .join('')}
          </div>
        </div>
        <div class="side-card">
          <h3>All drills</h3>
          <p class="muted small">${PRACTICE.length} practice quests, ten a page. Ports, subnets, decoding, hashes, log triage, tool drills.</p>
          <a class="ghost block" href="#/drills/1">Browse the bank →</a>
        </div>
      </aside>
    </div>`;
  wireQuests(host);
}

/* ---------------- paginated lists ---------------- */

function pager(base, page, pages, total, perPage) {
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  return `<div class="pager">
    <a class="ghost ${page === 1 ? 'off' : ''}" href="${page === 1 ? '#/' : base + (page - 1)}">← previous 10</a>
    <span class="mono">${from}-${to} of ${total}</span>
    <a class="ghost ${page === pages ? 'off' : ''}" href="${page === pages ? '#' : base + (page + 1)}">next 10 →</a>
  </div>`;
}

export function drillsView(host, pageNumber) {
  const { items, page, pages, total } = pageOf(PRACTICE, pageNumber);
  const solved = PRACTICE.filter((q) => P.questDone('bank-' + q.id)).length;
  host.innerHTML = `
    <div class="page-head">
      <h1>Drills</h1>
      <p>${total} practice quests, ${pages} pages, ${solved} solved. Each one is checkable on its own, so they work as a warm-up before a lab or a filler on a bad day.</p>
    </div>
    <div class="quest-list">${items.map((q) => questCard(q, 'bank-' + q.id, 10)).join('')}</div>
    ${pager('#/drills/', page, pages, total, 10)}`;
  wireQuests(host);
}

export function remainingView(host, pageNumber) {
  const list = carriedQuests();
  const { items, page, pages, total } = pageOf(list, pageNumber);
  host.innerHTML = `
    <div class="page-head">
      <h1>Remaining</h1>
      <p>${total ? total + ' quests from days you skipped. They never expire, so finish them when you have a spare ten minutes.' : 'Nothing waiting. Every quest so far is solved.'}</p>
    </div>
    ${total
      ? `<div class="quest-list">${items.map((q) => questCard(q, q.dailyId, 10, 'day ' + q.day)).join('')}</div>${pager('#/remaining/', page, pages, total, 10)}`
      : '<p class="muted">Come back tomorrow, or browse the <a href="#/drills/1">drill bank</a>.</div>'}
    `;
  wireQuests(host);
}
