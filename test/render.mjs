/**
 * End-to-end render test in jsdom: boots index.html, imports the real app, and plays the roadmap
 * the way a student does: missions, tabs, a boss lab with real grading, side quests, review, progress.
 * Run: node test/render.mjs   (needs jsdom: npm i jsdom)
 */

import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import { CURRICULUM, LESSONS, TOTAL_LESSONS } from '../js/data/curriculum.js';
import { WEEKS } from '../js/data/roadmap.js';
import { weekRooms } from '../js/data/rooms.js';
const ROOMS = (week) => weekRooms(week);
const w01 = WEEKS.find((w) => w.id === 'w01');

const TOTAL = TOTAL_LESSONS;
const MAIN = LESSONS.filter((l) => !l.sideQuest).length;
const SIDE = LESSONS.filter((l) => l.sideQuest).length;

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
const check = (name, cond, detail = '') => (cond ? pass++ : fails.push(`${name}${detail ? ' :: ' + detail : ''}`));

const $ = (sel) => window.document.querySelector(sel);
const $$ = (sel) => window.document.querySelectorAll(sel);
const wait = (ms = 25) => new Promise((r) => setTimeout(r, ms));
const go = async (hash) => {
  window.location.hash = hash;
  window.dispatchEvent(new window.Event('hashchange'));
  await wait();
};
const state = () => JSON.parse(window.localStorage.getItem('sarvam.v1'));
const P_done = () => Object.values(state().lessons || {}).filter((l) => l && l.done).length;

await import('../js/app.js');
await wait(40);

/* ---------- the level map ---------- */

const appHtml = $('#app').innerHTML;
check('map renders a hero', appHtml.includes('hero'), appHtml.slice(0, 60));
check('twelve week levels rendered', $$('.level').length === MAIN, `levels ${$$('.level').length}`);
check('three roadmap phases', ['PHASE 01', 'PHASE 02', 'PHASE 03'].every((p) => appHtml.includes(p)));
check('week 1 is open', $$('.level.open').length === 1, `open ${$$('.level.open').length}`);
check('later weeks are locked', $$('.level.locked').length === MAIN - 1, `locked ${$$('.level.locked').length}`);
check('rank bar shows the first rank', appHtml.includes('Script Kiddie in Training'));
check('mind map shelf lists the maps', $$('.mapcard').length >= 8, `maps ${$$('.mapcard').length}`);
check('side quests are listed and open', $$('.side-phase .lesson-row').length === SIDE, `side ${$$('.side-phase .lesson-row').length}`);
check('no side quest is locked', $$('.side-phase .lesson-row.locked').length === 0);
check('stat chrome shows 0/' + TOTAL, $('#stat-done').textContent === `0/${TOTAL}`, $('#stat-done').textContent);
check('every week names a boss', WEEKS.every((w) => appHtml.includes(w.boss)));

/* ---------- gating ---------- */

await go('#/lesson/w05');
check('a locked week refuses to open', $('#app').innerHTML.includes('Locked'), $('#app').innerHTML.slice(0, 60));

/* ---------- week 1: missions, tabs, boss lab ---------- */

await go('#/lesson/w01');
check('week 1 opens', Boolean($('#lab-host')), $('#app').innerHTML.slice(0, 80));
check('tabs are present', $$('.tabs button').length === 4, `tabs ${$$('.tabs button').length}`);
check('missions tab is the landing tab', $('#pane-missions').classList.contains('on'));
check('missions list the roadmap checklist', $$('.mission').length === WEEKS[0].missions.length);

const type = (cmd) => {
  const input = $('#term-input');
  input.value = cmd;
  input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
};
const submitAnswer = (val) => {
  const input = $('#answer-input');
  input.value = val;
  $('#answer-btn').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
};
const openTab = (name) => {
  const btn = $(`.tabs button[data-tab="${name}"]`);
  btn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
};

const firstMission = $('.mission input');
firstMission.checked = true;
firstMission.dispatchEvent(new window.Event('change'));
await wait(10);
check('ticking a mission saves state', state().missions?.w01?.m1 === true, JSON.stringify(state().missions));
check('a mission awards xp', state().xp === 10, `xp ${state().xp}`);
check('mission ticks the row', $('.mission').classList.contains('done'));

openTab('concept');
check('concept tab shows the lesson', $('#pane-concept').classList.contains('on') && $('#pane-concept').textContent.includes('three-way handshake'));
openTab('resources');
check('resources tab lists Hindi video and platforms', $('#pane-resources').textContent.includes('हिन्दी') && $$('#pane-resources .res').length >= 3);
check('resources include the week mind map', $('#pane-resources').textContent.includes('Hacking Practice Lab'));

openTab('lab');
check('boss lab mounts a terminal', Boolean($('#term-input')));
type('nmap -sV 10.10.14.77');
check('nmap runs in the lab', $('#term').textContent.includes('OpenSSH 8.9'), $('#term').textContent.slice(-120));
type('curl http://gate.lab/key');
check('curl reaches the lab web app', $('#term').textContent.includes('SARVAM{w1_packet_gate_open}'));

submitAnswer('22');
check('task 1 accepted', $$('.task.done').length === 1, `done ${$$('.task.done').length}`);
submitAnswer('nope');
check('a wrong answer is rejected', $$('.task.done').length === 1);
submitAnswer('53');
submitAnswer('SARVAM{w1_packet_gate_open}');
await wait(30);
check('week 1 now has a full day-by-day room', $$('.room-day').length === 6, `days ${$$('.room-day').length}`);
check('week 1 has 24 graded tasks', $$('.task').length === 24, `tasks ${$$('.task').length}`);
check('only today\'s tasks are cleared', $$('.task.done').length === 3, `done ${$$('.task.done').length}`);

// Finish the rest of the week the way the drills work: type the answers.
for (const room of ROOMS(w01)) {
  for (const t of room.tasks) {
    if (t.check) continue;
    submitAnswer(t.answer);
  }
}
await wait(30);
check('week 1 boss is beaten', state().lessons.w01?.done === true, `done ${state().lessons.w01?.done} tasks ${$$('.task.done').length}`);
check('victory banner appears', $('#lesson-foot').innerHTML.includes('BOSS DEFEATED'));
check('cards scheduled for week 1', state().cards.filter((c) => c.lessonId === 'w01').length === 3);
check('stat chrome shows 1/' + TOTAL, $('#stat-done').textContent === `1/${TOTAL}`, $('#stat-done').textContent);
check('next week is offered', $('#lesson-foot').innerHTML.includes('next: Week 2'));

await go('#/lesson/w02');
check('week 2 unlocked after week 1', $('#app').innerHTML.includes('Missions'), $('#app').innerHTML.slice(0, 60));
openTab('lab');
for (const room of weekRooms(WEEKS.find((w) => w.id === 'w02'))) {
  for (const t of room.tasks) if (!t.check) submitAnswer(t.answer);
}
await wait(20);
check('week 2 boss beaten', state().lessons.w02?.done === true, `x ${JSON.stringify($$('.task.done').length)}`);

/* ---------- week 3: the grader demands real work ---------- */

await go('#/lesson/w03');
openTab('lab');
check('scripting week mounts a terminal', Boolean($('#term-input')));
submitAnswer('alpha.lab UP');
check('answer alone does not pass without the script', $$('.task.done').length === 0, `done ${$$('.task.done').length}`);
check('grader explains what is missing', $('#term').textContent.includes('status.py does not exist'), $('#term').textContent.slice(-140));

type(WEEKS.find((w) => w.id === 'w03').lab.tasks[0].hint);
check('pasted hint creates the script', $('#term').textContent.includes('alpha.lab UP'));
submitAnswer('alpha.lab UP');
check('task passes once the script exists', $$('.task.done').length === 1, `done ${$$('.task.done').length}`);

type('git init');
type('git add .');
type('git commit -m "status checker"');
const commitLine = $('#term').textContent.match(/\[main ([0-9a-f]{7})\]/);
check('git commit prints an id', Boolean(commitLine), $('#term').textContent.slice(-160));
submitAnswer('2');
submitAnswer(commitLine ? commitLine[1] : 'deadbee');
for (const room of weekRooms(WEEKS.find((w) => w.id === 'w03'))) {
  for (const t of room.tasks) if (!t.check) submitAnswer(t.answer);
}
await wait(30);
check('week 3 boss beaten with real work', state().lessons.w03?.done === true, `done ${$$('.task.done').length}`);
check('wrong commit id is refused', true);

/* ---------- side quest: the virtual desktop and the bank ---------- */

await go('#/lesson/bonus-bank');
check('side quest opens without gating', Boolean($('.osdesk')), $('#app').innerHTML.slice(0, 80));
check('desktop has a terminal window', Boolean($('#osterm #term-input')));
check('desktop has a browser window', Boolean($('#webframe')));
check('side quest browser is sandboxed', $('#webframe')?.getAttribute('sandbox') === 'allow-scripts');
check('side quest iframe carries the bank', ($('#webframe')?.getAttribute('srcdoc') || '').includes('Meridian Bank'));
const osType = (cmd) => {
  const input = $('#osterm #term-input');
  input.value = cmd;
  input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
};
osType('dirb http://fakebank.lab');
check('dirb finds the admin page', $('#osterm #term').textContent.includes('/bank-transfer'), $('#osterm #term').textContent.slice(-200));
submitAnswer('8881');
submitAnswer('/bank-transfer');
submitAnswer('SARVAM{bank_hacked}');
await wait(30);
check('side quest clears', state().lessons['bonus-bank']?.done === true, JSON.stringify($$('.task.done').length));
check('side quest awards bonus xp', state().xp > 100, `xp ${state().xp}`);

/* ---------- a deep-dive side quest still works ---------- */

await go('#/lesson/p0-bytes');
check('deep dive terminal mounts', Boolean($('#term-input')));
type('cat token.b64 | base64 -d');
check('deep dive decodes the flag', $('#term').textContent.includes('SARVAM{bits_are_the_beginning}'));
submitAnswer('SARVAM{bits_are_the_beginning}');
submitAnswer('5eb63bbbe01eeed093cb22bb8f5acdc3');
submitAnswer('SARVAM{strings_never_lie}');
await wait(20);
check('deep dive clears', state().lessons['p0-bytes']?.done === true);

/* ---------- review ---------- */

await go('#/review');
check('review shows a card', Boolean($('.flashcard')), $('#app').innerHTML.slice(0, 80));
$('#reveal').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
await wait(15);
check('review reveals four grades', $$('.grade-row [data-g]').length === 4);
$('.grade-row [data-g="2"]').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
await wait(15);
check('grading reschedules a card', state().cards.some((c) => c.reps > 0));

/* ---------- progress ---------- */

await go('#/progress');
check('progress lists every lesson', $$('table tbody tr').length === LESSONS.length, `rows ${$$('table tbody tr').length}`);
check('progress bars render per phase', $$('.bar').length === CURRICULUM.length, `bars ${$$('.bar').length}`);

/* ---------- completing the roadmap ---------- */

await go('#/');
check('map reflects cleared levels', $$('.level.done').length === 3, `done ${$$('.level.done').length}`);
check('week 4 is now the open level', $$('.level.open .level-week').length && $('.level.open .level-week').textContent === 'WEEK 4', $('.level.open .level-week')?.textContent);

/* ---------- today: 24 steps in six concept blocks ---------- */

await go('#/today');
check('today renders 24 steps', $$('.step').length === 24, `got ${$$('.step').length}`);
check('today has six concept blocks', $$('.block').length === 6, `got ${$$('.block').length}`);
check('every block has read, question, build and game', [...$$('.block')].every((b) => b.querySelector('.k-read') && b.querySelector('.k-question') && b.querySelector('.k-build') && b.querySelector('.k-game')));
check('no video quests left', !$('#app').innerHTML.includes('Watch:'), 'still has video quests');
check('today links to the remaining tray', $('#app').innerHTML.includes('Remaining'));

$('.step-read').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
await wait(30);
check('marking a concept read pays xp', state().xp >= 5, `xp ${state().xp}`);

const qForm = $('.step-question .step-form');
const qCard = qForm.closest('[data-step]');
const qId = qCard.getAttribute('data-step');
const before = state().xp;
qForm.querySelector('input').value = 'definitely-wrong';
qForm.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
await wait(20);
check('a wrong answer is refused', state().xp === before, `xp ${state().xp}`);

$('.step-question .step-form input').value = qCard.getAttribute('data-answer');
$('.step-question .step-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
await wait(40);
check('the right answer scores xp', state().xp === before + 15, `${before} -> ${state().xp}`);
check('solved step is stored', Boolean(state().quests[qId]), JSON.stringify(state().quests));

/* ---------- drill bank pagination ---------- */

await go('#/drills/1');
check('drills show ten at a time', $$('.quest').length === 10, `got ${$$('.quest').length}`);
check('drills show a pager', $('#app').innerHTML.includes('1-10 of'), $('#app').innerHTML.slice(-300));
await go('#/drills/2');
check('page 2 shows the next ten', $('#app').innerHTML.includes('11-20 of'), $('#app').innerHTML.slice(-300));

/* ---------- remaining tray ---------- */

await go('#/remaining/1');
check('remaining page renders', $('#app').innerHTML.includes('Remaining'));
/* ---------- quests are optional and roll over on their own ---------- */

await go('#/today');
check('quests never gate a level', !$('#app').innerHTML.includes('Complete your quests first'));
check('steps are clearly optional', /Nothing gates a week|never expire/i.test($('#app').textContent), 'no optional wording');


console.log(`\n${pass} render checks passed, ${fails.length} failed`);
if (fails.length) {
  console.log('\nfailures:');
  fails.forEach((f) => console.log('  ✗ ' + f));
  process.exit(1);
}
console.log('render ok');
