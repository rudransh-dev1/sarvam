/**
 * Progress, unlocking and spaced repetition.
 * Everything lives in localStorage so Sarvam works with no account and no server.
 */

import { LESSONS, TOTAL_LESSONS } from './data/curriculum.js';

const KEY = 'sarvam.v1';
const DAY = 24 * 60 * 60 * 1000;

function today() {
  return new Date().toISOString().slice(0, 10);
}

function fresh() {
  return {
    version: 1,
    xp: 0,
    created: today(),
    lastActive: null,
    streak: 0,
    lessons: {},
    cards: [],
    history: [],
    missions: {},
    badges: []
  };
}

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const parsed = JSON.parse(raw);
    return { ...fresh(), ...parsed };
  } catch {
    return fresh();
  }
}

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode: keep working in memory */
  }
}

export function getState() {
  return state;
}

export function touchDay() {
  const t = today();
  if (state.lastActive === t) return;
  if (state.lastActive) {
    const prev = new Date(state.lastActive + 'T00:00:00');
    const now = new Date(t + 'T00:00:00');
    const diff = Math.round((now - prev) / DAY);
    state.streak = diff === 1 ? state.streak + 1 : 1;
  } else {
    state.streak = 1;
  }
  state.lastActive = t;
  save();
}

/* ---------- unlocking ---------- */

export function isDone(lessonId) {
  return Boolean(state.lessons[lessonId]?.done);
}

export function isUnlocked(index) {
  const lesson = LESSONS[index];
  if (!lesson) return false;
  if (lesson.bonus) return true;
  // bonus rooms sit outside the ladder, so gate against the core sequence only
  const chain = LESSONS.filter((l) => !l.bonus);
  const pos = chain.findIndex((l) => l.id === lesson.id);
  if (pos <= 0) return true;
  return isDone(chain[pos - 1].id);
}

export function lessonStatus(lesson) {
  const index = LESSONS.findIndex((l) => l.id === lesson.id);
  if (isDone(lesson.id)) return 'done';
  if (isUnlocked(index)) return 'open';
  return 'locked';
}

export function nextLessonId() {
  const chain = LESSONS.filter((l) => !l.sideQuest);
  const found = chain.find((l) => !isDone(l.id));
  return found ? found.id : null;
}

/** The main ladder only: side quests give XP but never count toward the roadmap. */
export function mainLessons() {
  return LESSONS.filter((l) => !l.sideQuest);
}

export function doneCount() {
  return mainLessons().filter((l) => isDone(l.id)).length;
}

export function sideDoneCount() {
  return LESSONS.filter((l) => l.sideQuest && isDone(l.id)).length;
}

export function pctDone() {
  const total = mainLessons().length;
  return total === 0 ? 0 : Math.round((doneCount() / total) * 100);
}

/* ---------- completing a lesson ---------- */

export function completeLesson(lesson, { score = 1 } = {}) {
  const already = isDone(lesson.id);
  const entry = state.lessons[lesson.id] || { attempts: 0 };
  entry.attempts += 1;
  entry.score = Math.max(entry.score || 0, score);
  entry.done = true;
  entry.completedAt = entry.completedAt || new Date().toISOString();
  state.lessons[lesson.id] = entry;

  let newCards = 0;
  if (!already) {
    state.xp += 60;
    for (const [i, card] of (lesson.cards || []).entries()) {
      const id = lesson.id + ':' + i;
      if (state.cards.some((c) => c.id === id)) continue;
      state.cards.push({
        id,
        lessonId: lesson.id,
        front: card.front,
        back: card.back,
        ease: 2.5,
        interval: 0,
        reps: 0,
        lapses: 0,
        due: Date.now()
      });
      newCards++;
    }
  }
  save();
  return { already, newCards };
}

/* ---------- spaced repetition (SM-2 flavoured) ---------- */

export function dueCards(now = Date.now()) {
  return state.cards.filter((c) => c.due <= now).sort((a, b) => a.due - b.due);
}

export function cardStats() {
  const now = Date.now();
  const total = state.cards.length;
  const due = state.cards.filter((c) => c.due <= now).length;
  const learned = state.cards.filter((c) => c.reps >= 2).length;
  return { total, due, learned };
}

export function gradeCard(cardId, grade) {
  const card = state.cards.find((c) => c.id === cardId);
  if (!card) return null;
  const g = Math.max(0, Math.min(3, grade));

  if (g === 0) {
    card.lapses += 1;
    card.ease = Math.max(1.3, card.ease - 0.2);
    card.interval = 0;
    card.reps = 0;
    card.due = Date.now() + 10 * 60 * 1000;
  } else {
    if (g === 1) card.ease = Math.max(1.3, card.ease - 0.05);
    if (g === 3) card.ease = Math.min(3.2, card.ease + 0.12);
    card.reps += 1;
    if (card.reps === 1) card.interval = 1;
    else if (card.reps === 2) card.interval = g === 1 ? 2 : 3;
    else {
      const factor = g === 1 ? 1.2 : g === 2 ? card.ease : card.ease * 1.3;
      card.interval = Math.max(1, Math.round(card.interval * factor));
    }
    card.due = Date.now() + card.interval * DAY;
  }
  state.xp += g === 0 ? 1 : 3;
  state.history.push({ at: Date.now(), cardId, grade: g });
  if (state.history.length > 500) state.history = state.history.slice(-500);
  save();
  return card;
}

/* ---------- misc ---------- */

export function resetAll() {
  state = fresh();
  save();
}

export function exportData() {
  return JSON.stringify(state, null, 2);
}


/* ---------- daily missions (the checklist from the roadmap) ---------- */

export function missionDone(lessonId, missionId) {
  return Boolean(state.missions?.[lessonId]?.[missionId]);
}

export function missionCount(lesson) {
  const list = lesson.missions || [];
  const done = list.filter((m) => missionDone(lesson.id, m.id)).length;
  return { done, total: list.length };
}

export function toggleMission(lessonId, missionId) {
  state.missions = state.missions || {};
  const row = (state.missions[lessonId] = state.missions[lessonId] || {});
  row[missionId] = !row[missionId];
  state.xp = Math.max(0, state.xp + (row[missionId] ? 10 : -10));
  save();
  return row[missionId];
}

/* ---------- ranks and badges ---------- */

export const RANKS = [
  { at: 0, name: 'Script Kiddie in Training' },
  { at: 150, name: 'Packet Sniffer' },
  { at: 400, name: 'Shell Wrangler' },
  { at: 750, name: 'Web Breaker' },
  { at: 1100, name: 'Intern-Ready' },
  { at: 1500, name: 'Hired' }
];

export function rankFor(xp = state.xp) {
  let cur = RANKS[0];
  let next = null;
  for (let i = 0; i < RANKS.length; i++) {
    if (xp >= RANKS[i].at) {
      cur = RANKS[i];
      next = RANKS[i + 1] || null;
    }
  }
  return { cur, next, pct: next ? Math.round(((xp - cur.at) / (next.at - cur.at)) * 100) : 100 };
}

export function awardBadge(id) {
  state.badges = state.badges || [];
  if (state.badges.includes(id)) return false;
  state.badges.push(id);
  save();
  return true;
}

export function hasBadge(id) {
  return (state.badges || []).includes(id);
}
