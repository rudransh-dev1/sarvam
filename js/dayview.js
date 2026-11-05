/**
 * Today: 24 steps, six concepts, each running read -> question -> build -> game.
 * Optional everywhere, and anything unsolved rolls into Remaining.
 */
import * as P from './progress.js';
import { daySteps, dayMeta, STEPS_PER_DAY, dayClock } from './data/dayroom.js';
import { checkPractice, PER_PAGE } from './data/questbank.js';

const esc = (s) =>
  String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const STEP_LABEL = { concept: 'read', question: 'question', build: 'build', game: 'game' };

export function todayCursor() {
  const c = dayClock(P.getState().created);
  const weekNo = Math.min(c.weekIndex + 1, 12);
  return { weekNo, dayInWeek: c.dayInWeek, elapsed: c.elapsed };
}

/** Graded steps from every day that has already passed and is still unsolved. */
export function carriedSteps() {
  const { weekNo, dayInWeek } = todayCursor();
  const out = [];
  for (let w = 1; w <= weekNo; w++) {
    const last = w < weekNo ? 6 : dayInWeek - 1;
    for (let d = 1; d <= last; d++) {
      daySteps(w, d).forEach((s) => {
        if (s.graded && !P.questDone(s.id)) out.push({ ...s, week: w, day: d });
      });
    }
  }
  return out;
}

function stepRow(s, tag) {
  const on = P.questDone(s.id);
  const label = STEP_LABEL[s.kind] || s.kind;
  if (s.kind === 'concept') {
    return `<div class="step step-concept ${on ? 'done' : ''}" data-step="${s.id}" data-xp="${s.xp}">
      <div class="step-head"><span class="step-kind k-${label}">${label}</span><span class="step-title">${esc(s.title)}</span></div>
      <p class="step-text">${esc(s.text)}</p>
      <button class="ghost step-read" data-act="read-step">${on ? 'read ✓' : 'mark as read'}</button>
    </div>`;
  }
  if (on) {
    return `<div class="step step-${s.kind} done" data-step="${s.id}">
      <div class="step-head"><span class="step-kind k-${label}">${label}</span><span class="step-ok">solved</span></div>
      <p class="step-prompt">${esc(s.prompt)}</p>
      <p class="step-explain">${esc(s.explain || '')}</p>
    </div>`;
  }
  return `<div class="step step-${s.kind}" data-step="${s.id}" data-answer="${esc(s.answer)}" data-xp="${s.xp}" data-explain="${esc(s.explain || '')}">
    <div class="step-head">
      <span class="step-kind k-${label}">${label}</span>
      ${s.lab ? `<a class="step-lab" href="#/lesson/${s.lab}">open ${s.lab} lab</a>` : ''}
    </div>
    <p class="step-prompt">${esc(s.prompt)}</p>
    <form class="step-form" data-step-form="${s.id}">
      <input name="answer" autocomplete="off" placeholder="${s.kind === 'build' ? 'the command, exactly' : 'your answer'}" />
      <button class="primary" type="submit">submit</button>
    </form>
    <div class="step-fb" data-fb="${s.id}"></div>
  </div>`;
}

function wireSteps(root, rerender) {
  root.querySelectorAll('[data-step-form]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = form.getAttribute('data-step-form');
      const card = root.querySelector(`[data-step="${id}"]`);
      const xp = Number(card.getAttribute('data-xp')) || 15;
      const quest = { answer: card.getAttribute('data-answer'), alt: [] };
      const fb = root.querySelector(`[data-fb="${id}"]`);
      if (checkPractice(quest, form.querySelector('input').value)) {
        P.toggleQuest(id, xp);
        card.classList.add('done');
        if (fb) fb.innerHTML = `<span class="good">correct, +${xp} xp</span>`;
        setTimeout(() => rerender && rerender(), 450);
      } else if (fb) {
        fb.innerHTML = '<span class="bad">not yet. wrong field, wrong flag, or a typo.</span>';
      }
    });
  });
  root.querySelectorAll('[data-act="read-step"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const card = btn.closest('[data-step]');
      P.toggleQuest(card.getAttribute('data-step'), Number(card.getAttribute('data-xp')) || 5);
      rerender && rerender();
    });
  });
}

export function todayView(host, pickDay) {
  const c = todayCursor();
  const day = Math.max(1, Math.min(pickDay || c.dayInWeek, 6));
  const steps = daySteps(c.weekNo, day);
  const meta = dayMeta(c.weekNo, day);
  const done = steps.filter((s) => P.questDone(s.id)).length;
  const carried = carriedSteps().length;
  const rerender = () => todayView(host, day);

  const blocks = [];
  for (let b = 1; b <= 6; b++) {
    const list = steps.filter((s) => s.block === b);
    const got = list.filter((s) => P.questDone(s.id)).length;
    blocks.push(`<section class="block ${got === list.length ? 'done' : ''}">
      <div class="block-head">
        <span class="block-no">Concept ${b}</span>
        <span class="block-name">${esc(list[0].title)}</span>
        <span class="block-count">${got}/4</span>
      </div>
      ${list.map((s) => stepRow(s)).join('')}
    </section>`);
  }

  host.innerHTML = `
    <div class="page-head">
      <h1>Today · Day ${day} of 6</h1>
      <p>Week ${c.weekNo}: ${esc(meta.title)}. Twenty-four steps: six concepts, each read, question, build, game. Nothing gates a week, and whatever you skip waits in Remaining.</p>
    </div>
    <div class="day-top">
      <div class="board-bar"><div style="width:${Math.round((done / STEPS_PER_DAY) * 100)}%"></div></div>
      <div class="day-count"><b>${done}/${STEPS_PER_DAY}</b> today · <a href="#/remaining/1">Remaining ${carried}</a></div>
    </div>
    <div class="day-blocks">${blocks.join('')}</div>
    <div class="board-foot">
      <a class="ghost" href="#/today/${day === 6 ? 1 : day + 1}">See another day →</a>
      <a class="ghost" href="#/lesson/${meta.id}">Open the week lab →</a>
    </div>`;
  wireSteps(host, rerender);
}

export function remainingView(host, page) {
  const all = carriedSteps();
  const per = PER_PAGE;
  const pages = Math.max(1, Math.ceil(all.length / per));
  const p = Math.max(1, Math.min(page || 1, pages));
  const slice = all.slice((p - 1) * per, p * per);
  const rerender = () => remainingView(host, p);
  const body = slice.length
    ? slice.map((s) => `<div class="rem-row"><span class="rem-day">w${s.week} d${s.day}</span>${stepRow(s)}</div>`).join('')
    : '<p class="muted">Nothing waiting. Every step so far is solved.</p>';

  host.innerHTML = `
    <div class="page-head">
      <h1>Remaining</h1>
      <p>Steps from earlier days that you never answered. They never expire, so clear them whenever you have ten minutes.</p>
    </div>
    <div class="board-head">
      <div class="board-sub">${all.length} waiting · ${slice.length ? `${(p - 1) * per + 1}-${(p - 1) * per + slice.length} of ${all.length}` : 'all clear'}</div>
    </div>
    <div class="rem-list">${body}</div>
    <div class="pager">
      ${p > 1 ? `<a class="ghost" href="#/remaining/${p - 1}">← previous ${per}</a>` : '<span></span>'}
      <span class="muted">page ${p} of ${pages}</span>
      ${p < pages ? `<a class="ghost" href="#/remaining/${p + 1}">next ${per} →</a>` : '<span></span>'}
    </div>`;
  wireSteps(host, rerender);
}
