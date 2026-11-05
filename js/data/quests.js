/**
 * Daily quest board: six study days a week, four quests a day.
 * Two pieces of the week's own material, one hands-on step, one habit.
 * Ids are stable (w01-d1-q1) so ticks survive reloads.
 */
import { WEEKS, RES, MINDMAPS } from './roadmap.js';

export const DAYS_PER_WEEK = 6;
export const QUESTS_PER_DAY = 4;

const HABITS = [
  { kind: 'review', title: 'Clear your due review cards', detail: 'Review tab. Two minutes now beats an hour of re-reading later.', href: '#/review' },
  { kind: 'proof', title: "Commit today's work to your repo", detail: 'git add . then git commit -m "week notes". Recruiters read commit history.', href: null },
  { kind: 'write', title: 'Write three lines you could show an interviewer', detail: 'What you did, what broke, what you would do differently.', href: null },
  { kind: 'review', title: 'Explain one concept out loud, no jargon', detail: 'If you cannot say it plainly you do not own it yet.', href: '#/review' },

  { kind: 'proof', title: 'Push your repo and check the green squares', detail: 'A commit a day for twelve weeks is itself a credential.', href: null }
];

function resourceQuest(key) {
  const res = RES[key];
  if (!res) return null;
  return {
    kind: 'study',
    title: (res.kind === 'docs' ? 'Read: ' : 'Watch: ') + res.title,
    detail: res.note + (res.kind === 'hindi' ? '  ·  Hindi' : ''),
    href: res.url || null,
    external: Boolean(res.url)
  };
}

/** The 24 quests of one week, grouped into six days of four. */
export function weekQuestDays(week) {
  const groups = [];
  groups.push((week.resources || []).map(resourceQuest).filter(Boolean));
  groups.push((week.missions || []).map((m) => ({
    kind: m.kind || 'learn',
    title: m.text,
    detail: "From this week's mission list.",
    href: '#/lesson/' + week.id
  })));
  groups.push((week.lab?.tasks || []).map((t, i) => ({
    kind: 'lab',
    title: 'Hands on: ' + t.prompt,
    detail: 'Boss lab task ' + (i + 1) + '. The terminal grades it.',
    href: '#/lesson/' + week.id
  })));
  groups.push((week.side || []).map((id) => ({
    kind: 'side',
    title: 'Side quest: ' + String(id).replace(/^sq-/, '').replace(/-/g, ' '),
    detail: "Optional XP, same week's topic.",
    href: '#/lesson/' + id
  })));
  const tail = [];
  if (week.deliverable) tail.push({ kind: 'proof', title: 'Ship: ' + week.deliverable, detail: 'The thing you point at in an interview.', href: '#/lesson/' + week.id });
  tail.push({ kind: 'boss', title: 'Beat the boss: ' + (week.boss || "this week's room"), detail: 'All tasks inside the lab, no hints first.', href: '#/lesson/' + week.id });

  // Round-robin across kinds so no day is three videos in a row.
  const pool = [];
  const longest = Math.max(...groups.map((g) => g.length), tail.length);
  for (let i = 0; i < longest; i++) {
    groups.forEach((g) => { if (g[i]) pool.push(g[i]); });
    if (tail[i]) pool.push(tail[i]);
  }

  const handsOn = pool.filter((q) => ['lab', 'boss', 'side'].includes(q.kind));
  const soft = pool.filter((q) => !['lab', 'boss', 'side'].includes(q.kind));

  const days = [];
  let hi = 0;
  let si = 0;
  for (let day = 1; day <= DAYS_PER_WEEK; day++) {
    const picks = [];
    // slot 1 and 2: one hands-on and one study/proof, alternating which comes first
    const hand = handsOn.length ? handsOn[hi++ % handsOn.length] : soft[si++ % soft.length];
    const study = soft.length ? soft[si++ % soft.length] : hand;
    if (day % 2 === 0) picks.push(study, hand);
    else picks.push(hand, study);
    // slot 3: another from the pool, preferring the other family
    const third = soft[si++ % soft.length] || hand;
    picks.push(third);
    // slot 4: a habit, rotating
    picks.push(HABITS[(day - 1) % HABITS.length]);

    const quests = picks.map((base, i) => ({ ...base, id: week.id + '-d' + day + '-q' + (i + 1), day, slot: i + 1, xp: 10 }));
    days.push(quests);
  }
  return days;
}

export function weekById(id) {
  return WEEKS.find((w) => w.id === id) || null;
}

export function allQuests() {
  return WEEKS.flatMap((w) => weekQuestDays(w).flat());
}

export { MINDMAPS };
