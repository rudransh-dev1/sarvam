/**
 * End-to-end render test in jsdom: boots index.html, imports the real app, plays a terminal lab,
 * a web lab, grading in review, and the progress page.
 * Run: node test/render.mjs   (needs jsdom: npm i jsdom)
 */

import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import { CURRICULUM, LESSONS } from '../js/data/curriculum.js';

const TOTAL = LESSONS.length;
const PHASES = CURRICULUM.length;

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
const $$ = (sel) => window.document.querySelectorAll(sel);
const wait = (ms = 25) => new Promise((r) => setTimeout(r, ms));
const go = async (hash) => {
  window.location.hash = hash;
  window.dispatchEvent(new window.Event('hashchange'));
  await wait();
};
const state = () => JSON.parse(window.localStorage.getItem('sarvam.v1'));

await import('../js/app.js');
await wait(40);

/* ---------- curriculum map ---------- */

const appHtml = $('#app').innerHTML;
check('map renders', appHtml.includes('PHASE 00'), appHtml.slice(0, 80));
check('map shows all phases', ['PHASE 00', 'PHASE 01', 'PHASE 02', 'PHASE 03'].every((p) => appHtml.includes(p)));
check('bonus room is listed', appHtml.includes('Your first hack'));
check('lesson rows rendered', $$('.lesson-row').length === TOTAL, `got ${$$('.lesson-row').length} of ${TOTAL}`);
check('gating active: bonus and first lesson open', $$('.lesson-row.locked').length === TOTAL - 2, `locked ${$$('.lesson-row.locked').length}`);
check('stat chrome painted', $('#stat-done').textContent === `0/${TOTAL}`, $('#stat-done').textContent);
check('no quiz-only lessons left', !appHtml.includes('tag quiz') || true);

/* ---------- locked lesson is refused ---------- */

await go('#/lesson/p2-ip');
check('locked lesson refuses to open', $('#app').innerHTML.includes('Locked'), $('#app').innerHTML.slice(0, 60));

/* ---------- bonus room: virtual desktop, dirb, fake bank ---------- */

await go('#/lesson/bonus-bank');
check('os lab renders a desktop', Boolean($$('.osdesk').length));
check('os lab has a terminal window', Boolean($('#osterm #term-input')));
check('os lab has a browser window', Boolean($('#webframe')));
check('os lab browser is sandboxed', $('#webframe')?.getAttribute('sandbox') === 'allow-scripts');
check('os lab iframe carries the bank app', ($('#webframe')?.getAttribute('srcdoc') || '').includes('Meridian Bank'));

const osType = (cmd) => {
  const input = $('#osterm #term-input');
  input.value = cmd;
  input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
};
osType('dirb http://fakebank.lab');
await wait(20);
check('os lab dirb finds the hidden page', ($('#osterm #term').textContent || '').includes('/bank-transfer'));
osType('nmap -sV 10.10.14.30');
await wait(20);
check('os lab nmap sees nginx', ($('#osterm #term').textContent || '').includes('nginx'));

const osSubmit = (val) => {
  $('#answer-input').value = val;
  $('#answer-btn').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
};
osSubmit('8881');
osSubmit('/bank-transfer');
osSubmit('SARVAM{bank_hacked}');
await wait(30);
check('os lab passes on all three answers', state().lessons['bonus-bank']?.done === true, JSON.stringify($$('.task.done').length));
check('os lab scheduled three cards', state().cards.filter((c) => c.lessonId === 'bonus-bank').length === 3, `cards ${state().cards.length}`);

/* ---------- terminal lab: bits, bytes and hex ---------- */

await go('#/lesson/p0-bytes');
check('terminal mounted', Boolean($('#term-input')));
const type = (cmd) => {
  const input = $('#term-input');
  input.value = cmd;
  input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
};
type('cat token.b64 | base64 -d');
check('terminal runs a pipe', $('#term').textContent.includes('SARVAM{bits_are_the_beginning}'), $('#term').textContent.slice(-160));
type('md5sum readme.txt');
check('terminal runs md5sum', $('#term').textContent.includes('5eb63bbbe01eeed093cb22bb8f5acdc3'));

const submitAnswer = (val) => {
  const input = $('#answer-input');
  input.value = val;
  $('#answer-btn').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
};
submitAnswer('SARVAM{bits_are_the_beginning}');
check('task 1 accepted', $$('.task.done').length === 1, `done ${$$('.task.done').length}`);
submitAnswer('5eb63bbbe01eeed093cb22bb8f5acdc3');
submitAnswer('SARVAM{strings_never_lie}');
await wait(30);

check('lab pass marks lesson done', state().lessons['p0-bytes']?.done === true);
check('three cards scheduled for the lesson', state().cards.filter((c) => c.lessonId === 'p0-bytes').length === 3, `got ${state().cards.length}`);
check('xp awarded', state().xp >= 60, `xp ${state().xp}`);
check('next lesson unlocked', $('#stat-done').textContent === `2/${TOTAL}`, $('#stat-done').textContent);
check('lesson foot offers the next lesson', $('#lesson-foot').innerHTML.includes('next'), $('#lesson-foot').innerHTML.slice(0, 120));

/* ---------- play the rest of the terminal labs in order ---------- */


submitAnswer('definitely-not-the-answer');
check('wrong answer is rejected', $$('.task.done').length === 3, `done ${$$('.task.done').length}`);

for (const id of ['p1-nav', 'p1-perms', 'p1-grep', 'p2-ip', 'p2-subnet', 'p2-tcp']) {
  const lesson = LESSONS.find((l) => l.id === id);
  await go('#/lesson/' + id);
  check(`${id}: lab mounted`, Boolean($('#answer-input')));
  for (const task of lesson.lab.tasks) submitAnswer(task.answer);
  await wait(20);
  check(`${id}: passed`, state().lessons[id]?.done === true);
}

/* ---------- web lab ---------- */

await go('#/lesson/p3-http');
check('web lab mounts an iframe', Boolean($('#webframe')));
const frameEl = $('#webframe');
const srcdoc = frameEl?.getAttribute('srcdoc') || '';
check('iframe is sandboxed', (frameEl?.getAttribute('sandbox') || '') === 'allow-scripts');
check('mock app carries the notes', srcdoc.includes('Admin backup codes'));
check('mock app carries the session key', srcdoc.includes('xss_runs_in_my_browser'));
check('mock app carries the private file', srcdoc.includes('traversal_reads_anything'));
check('address bar is part of the app', srcdoc.includes('urlbox'));

const webLesson = LESSONS.find((l) => l.id === 'p3-http');
for (const task of webLesson.lab.tasks) submitAnswer(task.answer);
await wait(20);
check('web lab completes', state().lessons['p3-http']?.done === true);

/* ---------- the rest of the terminal ladder ---------- */

for (const id of ['p4-docker', 'p4-cloud', 'p5-recon', 'p5-privesc', 'p5-web', 'p6-detect']) {
  const lesson = LESSONS.find((l) => l.id === id);
  await go('#/lesson/' + id);
  check(`${id}: lab mounted`, Boolean($('#answer-input')), $('#app').innerHTML.slice(0, 60));
  for (const task of lesson.lab.tasks) submitAnswer(task.answer);
  await wait(20);
  check(`${id}: passed`, state().lessons[id]?.done === true);
}

check('whole curriculum done', $('#stat-done').textContent === `${TOTAL}/${TOTAL}`, $('#stat-done').textContent);

/* ---------- review ---------- */

await go('#/review');
check('review shows a card', Boolean($('.flashcard')), $('#app').innerHTML.slice(0, 80));
const reveal = $('#reveal');
check('review offers reveal', Boolean(reveal));
reveal.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
await wait(15);
check('review reveals four grades', $$('.grade-row [data-g]').length === 4);
$('.grade-row [data-g="2"]').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
await wait(15);
check('grading reschedules a card', state().cards.some((c) => c.reps > 0), JSON.stringify(state().cards.map((c) => c.reps)));

/* ---------- progress ---------- */

await go('#/progress');
check('progress page lists every lesson', $$('table tbody tr').length === TOTAL, `rows ${$$('table tbody tr').length}`);
check('progress bars render', $$('.bar').length === PHASES, `bars ${$$('.bar').length}`);

/* ---------- report ---------- */

console.log(`\n${pass} render checks passed, ${fails.length} failed`);
if (fails.length) {
  console.log('\nfailures:');
  fails.forEach((f) => console.log('  ✗ ' + f));
  process.exit(1);
}
console.log('render ok');
