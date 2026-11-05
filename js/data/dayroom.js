/**
 * A day is 24 steps built from six concepts, and every concept runs the same four-step loop:
 *   read the idea  ->  answer a question  ->  do the build/real-world task  ->  play the game
 * Steps are ids like w03-d2-b4-s2, so ticks survive and days roll forward on their own.
 */
import { PRACTICE } from './questbank.js';
import { WEEKS } from './roadmap.js';

export const BLOCKS_PER_DAY = 6;
export const STEPS_PER_BLOCK = 4;
export const STEPS_PER_DAY = BLOCKS_PER_DAY * STEPS_PER_BLOCK;

const QUESTIONS = PRACTICE.filter((q) => q.topic !== 'crypto' && q.kind !== 'command');
const BUILDS = PRACTICE.filter((q) => q.kind === 'command' || q.topic === 'linux');
const GAMES = PRACTICE.filter((q) => q.kind === 'decode' || q.topic === 'crypto');

const blockThemes = [
  'Read the idea',
  'Name it cold',
  'Do it for real',
  'Play the game'
];

/** Where the student is: one day per calendar day, six days a week. */
export function dayClock(createdISO, nowDate = new Date()) {
  const [y, m, d] = String(createdISO || '').split('-').map(Number);
  const start = Date.UTC(y || 1970, (m || 1) - 1, d || 1);
  const now = Date.UTC(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
  const elapsed = Math.max(0, Math.round((now - start) / 86400000));
  const weekIndex = Math.floor(elapsed / 6);
  const dayInWeek = (elapsed % 6) + 1;
  return { elapsed, weekIndex, dayInWeek, dayIndex: elapsed };
}

const pickFrom = (list, n) => list[((n % list.length) + list.length) % list.length];

/** 24 steps for one day of one week. */
export function daySteps(weekNumber, dayNumber) {
  const week = WEEKS[Math.min(Math.max(weekNumber, 1), WEEKS.length) - 1];
  const base = ((weekNumber - 1) * 6 + (dayNumber - 1)) * 7;
  const steps = [];
  for (let b = 1; b <= BLOCKS_PER_DAY; b++) {
    const q = pickFrom(QUESTIONS, base + b);
    const build = pickFrom(BUILDS, base + b * 3);
    const game = pickFrom(GAMES, base + b * 5);
    const prefix = `${week.id}-d${dayNumber}-b${b}`;
    const blockName = q.title || blockThemes[b % 4];
    steps.push({
      id: prefix + '-s1', block: b, step: 1, kind: 'concept', graded: false, xp: 5,
      title: blockName,
      text: q.explain || 'Read the prompt below and say what the tool is doing.',
      prompt: `Concept: ${q.title || 'this week\'s theme'}`,
      detail: q.explain || ''
    });
    steps.push({
      id: prefix + '-s2', block: b, step: 2, kind: 'question', graded: true, xp: 15,
      title: 'Question', prompt: q.prompt, answer: q.answer, explain: q.explain, topic: q.topic
    });
    steps.push({
      id: prefix + '-s3', block: b, step: 3, kind: 'build', graded: true, xp: 20,
      title: 'Build it', prompt: build.prompt, answer: build.answer, explain: build.explain,
      lab: week.id, topic: build.topic
    });
    steps.push({
      id: prefix + '-s4', block: b, step: 4, kind: 'game', graded: true, xp: 20,
      title: 'Game', prompt: game.prompt, answer: game.answer, explain: game.explain, topic: game.topic
    });
  }
  return steps;
}

export function dayMeta(weekNumber, dayNumber) {
  const week = WEEKS[Math.min(Math.max(weekNumber, 1), WEEKS.length) - 1];
  return { week, title: week.title, boss: week.boss, id: week.id };
}
