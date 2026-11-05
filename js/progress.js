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
    history: []
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
  const found = LESSONS.find((l) => !isDone(l.id));
  if (!found) return null;
  const index = LESSONS.indexOf(found);
  return isUnlocked(index) ? found.id : null;
}

export function doneCount() {
  return LESSONS.filter((l) => isDone(l.id)).length;
}

export function pctDone() {
  return TOTAL_LESSONS === 0 ? 0 : Math.round((doneCount() / TOTAL_LESSONS) * 100);
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
