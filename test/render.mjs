/**
 * End-to-end render test in jsdom: boots index.html, imports the real app,
 * plays the first quiz lesson and the first terminal lesson, then checks the review queue.
 * Run: node test/render.mjs
 */

import { JSDOM } from 'jsdom';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const dom = new JSDOM(html, { url: 'https://sarvam.test/#/', pretendToBeVisual: true });
const { window } = dom;

global.window = window;
global.document = window.document;
global.localStorage = window.localStorage;
global.sessionStorage = window.sessionStorage;
global.location = window.location;
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
global.confirm = () => true;

let pass = 0;
const fails = [];
const check = (name, cond, detail = '') => {
  if (cond) pass++;
  else fails.push(`${name}${detail ? ' :: ' + detail : ''}`);
};

const $ = (sel) => window.document.querySelector(sel);
const go = async (hash) => {
  window.location.hash = hash;
  window.dispatchEvent(new window.Event('hashchange'));
  await new Promise((r) => setTimeout(r, 20));
};

await import('../js/app.js');
await new Promise((r) => setTimeout(r, 30));

/* ---------- curriculum map ---------- */

const appHtml = $('#app').innerHTML;
check('map renders', appHtml.includes('PHASE 00'), appHtml.slice(0, 80));
check('map shows all phases', ['PHASE 00', 'PHASE 01', 'PHASE 02', 'PHASE 03'].every((p) => appHtml.includes(p)));
const rows = window.document.querySelectorAll('.lesson-row');
check('lesson rows rendered', rows.length === 8, `got ${rows.length}`);
const locked = window.document.querySelectorAll('.lesson-row.locked');
check('gating active: all but first locked', locked.length === 7, `locked ${locked.length}`);
check('stats chrome painted', $('#stat-done').textContent === '0/8', $('#stat-done').textContent);

/* ---------- locked lesson is refused ---------- */

await go('#/lesson/p1-nav');
check('locked lesson refuses to open', $('#app').innerHTML.includes('Locked'), $('#app').innerHTML.slice(0, 60));

/* ---------- quiz lesson ---------- */

await go('#/lesson/p0-bytes');
check('quiz lab mounted', Boolean($('#quiz-check')));
const inputs = window.document.querySelectorAll('#quiz-body .q');
check('quiz has 4 questions', inputs.length === 4, `got ${inputs.length}`);

// answer everything correctly from the imported data
const { lessonById } = await import('../js/data/curriculum.js');
const q = lessonById('p0-bytes').quiz.questions;
q.forEach((question, i) => {
  const radio = window.document.querySelector(`input[name="q${i}"][value="${question.answer}"]`);
  radio.checked = true;
  radio.closest('.opt').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  radio.checked = true;
});
$('#quiz-check').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
await new Promise((r) => setTimeout(r, 20));

const state = JSON.parse(window.localStorage.getItem('sarvam.v1'));
check('quiz pass marks lesson done', state.lessons['p0-bytes']?.done === true);
check('quiz pass schedules 3 cards', state.cards.length === 3, `got ${state.cards.length}`);
check('xp awarded', state.xp >= 60, `xp ${state.xp}`);
check('next lesson unlocked after pass', $('#stat-done').textContent === '1/8', $('#stat-done').textContent);

/* ---------- terminal lesson ---------- */

await go('#/lesson/p1-nav');
check('terminal mounted', Boolean($('#term-input')));
const termInput = $('#term-input');
const type = (cmd) => {
  termInput.value = cmd;
  termInput.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
};
type('cat /etc/motd');
type('ls');
const termText = $('#term').textContent;
check('terminal echoes output', termText.includes('ops@example.test'), termText.slice(-120));
check('terminal shows prompt', $('#prompt').textContent.includes('/home/student$'), $('#prompt').textContent);

const answerInput = $('#answer-input');
const submit = (val) => {
  answerInput.value = val;
  $('#answer-btn').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
};
submit('ops@example.test');
check('task 1 accepted', $('#tasks').textContent.includes('✓') && window.document.querySelectorAll('.task.done').length === 1);
submit('3');
submit('SARVAM{directories_all_the_way_down}');
submit('.bash_history');
await new Promise((r) => setTimeout(r, 20));

const state2 = JSON.parse(window.localStorage.getItem('sarvam.v1'));
check('terminal lesson done', state2.lessons['p1-nav']?.done === true);
check('cards now 6', state2.cards.length === 6, `got ${state2.cards.length}`);
check('done counter 2/8', $('#stat-done').textContent === '2/8', $('#stat-done').textContent);
check('next lesson link offered', $('#lesson-foot').innerHTML.includes('next:') || $('#lesson-foot').innerHTML.includes('next unlocks'), $('#lesson-foot').innerHTML.slice(0, 100));

/* ---------- review ---------- */

await go('#/review');
check('review shows cards', Boolean($('.flashcard')), $('#app').innerHTML.slice(0, 80));
const reveal = $('#reveal');
check('review offers reveal', Boolean(reveal));
reveal.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
await new Promise((r) => setTimeout(r, 10));
check('review reveals answer', window.document.querySelectorAll('.grade-row [data-g]').length === 4);
window.document.querySelector('.grade-row [data-g="2"]').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
await new Promise((r) => setTimeout(r, 10));
const state3 = JSON.parse(window.localStorage.getItem('sarvam.v1'));
check('grading reschedules a card', state3.cards.some((c) => c.reps > 0), JSON.stringify(state3.cards.map((c) => c.reps)));

/* ---------- progress page ---------- */

await go('#/progress');
check('progress page renders table', window.document.querySelectorAll('table tbody tr').length === 8);
check('progress bars render', window.document.querySelectorAll('.bar').length === 4, String(window.document.querySelectorAll('.bar').length));

/* ---------- report ---------- */

console.log(`\n${pass} render checks passed, ${fails.length} failed`);
if (fails.length) {
  console.log('\nfailures:');
  fails.forEach((f) => console.log('  ✗ ' + f));
  process.exit(1);
}
console.log('render ok');
