import { JournalRecord, QuestionAttemptStat } from '../types/game';

const QUESTION_STATS_CACHE_KEY = 'kota_tatabahasa_question_stats_v1';
const QUESTION_STATS_RESET_KEY = 'kota_tatabahasa_question_stats_reset_v1';

export function createEmptyQuestionStat(questionId: number): QuestionAttemptStat {
  return {
    questionId,
    totalAttempts: 0,
    wrongAttempts: 0,
    correctAttempts: 0,
    optionSelections: { A: 0, B: 0, C: 0, D: 0 },
    wrongOptionSelections: { A: 0, B: 0, C: 0, D: 0 },
    updatedAt: '',
  };
}

function sanitizeStat(questionId: number, raw: unknown): QuestionAttemptStat | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const totalAttempts = typeof obj.totalAttempts === 'number' && obj.totalAttempts >= 0 ? obj.totalAttempts : 0;
  const wrongAttempts = typeof obj.wrongAttempts === 'number' && obj.wrongAttempts >= 0 ? obj.wrongAttempts : 0;
  const correctAttempts = typeof obj.correctAttempts === 'number' && obj.correctAttempts >= 0 ? obj.correctAttempts : 0;

  const optRaw =
    obj.optionSelections && typeof obj.optionSelections === 'object'
      ? (obj.optionSelections as Record<string, unknown>)
      : {};
  const wrongOptRaw =
    obj.wrongOptionSelections && typeof obj.wrongOptionSelections === 'object'
      ? (obj.wrongOptionSelections as Record<string, unknown>)
      : {};

  return {
    questionId,
    totalAttempts,
    wrongAttempts,
    correctAttempts,
    optionSelections: {
      A: typeof optRaw.A === 'number' && optRaw.A >= 0 ? optRaw.A : 0,
      B: typeof optRaw.B === 'number' && optRaw.B >= 0 ? optRaw.B : 0,
      C: typeof optRaw.C === 'number' && optRaw.C >= 0 ? optRaw.C : 0,
      D: typeof optRaw.D === 'number' && optRaw.D >= 0 ? optRaw.D : 0,
    },
    wrongOptionSelections: {
      A: typeof wrongOptRaw.A === 'number' && wrongOptRaw.A >= 0 ? wrongOptRaw.A : 0,
      B: typeof wrongOptRaw.B === 'number' && wrongOptRaw.B >= 0 ? wrongOptRaw.B : 0,
      C: typeof wrongOptRaw.C === 'number' && wrongOptRaw.C >= 0 ? wrongOptRaw.C : 0,
      D: typeof wrongOptRaw.D === 'number' && wrongOptRaw.D >= 0 ? wrongOptRaw.D : 0,
    },
    updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : '',
  };
}

function parseRawStatsMap(rawMap: unknown): Record<number, QuestionAttemptStat> {
  if (!rawMap || typeof rawMap !== 'object') return {};
  const result: Record<number, QuestionAttemptStat> = {};
  for (const [key, val] of Object.entries(rawMap as Record<string, unknown>)) {
    const qId = Number.parseInt(key, 10);
    if (!Number.isInteger(qId) || qId < 1 || qId > 30) continue;
    const clean = sanitizeStat(qId, val);
    if (clean && clean.totalAttempts > 0) {
      result[qId] = clean;
    }
  }
  return result;
}

export function loadCachedQuestionStats(): Record<number, QuestionAttemptStat> {
  try {
    const raw = localStorage.getItem(QUESTION_STATS_CACHE_KEY);
    if (!raw) return {};
    return parseRawStatsMap(JSON.parse(raw));
  } catch {
    return {};
  }
}

function writeCachedQuestionStats(stats: Record<number, QuestionAttemptStat>): void {
  try {
    localStorage.setItem(QUESTION_STATS_CACHE_KEY, JSON.stringify(stats));
  } catch {
    // Ignore storage quota restrictions
  }
}

function loadResetFlags(): Record<number, string> {
  try {
    const raw = localStorage.getItem(QUESTION_STATS_RESET_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<number, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      const id = Number.parseInt(k, 10);
      if (Number.isInteger(id) && typeof v === 'string') {
        out[id] = v;
      }
    }
    return out;
  } catch {
    return {};
  }
}

function saveResetFlags(flags: Record<number, string>): void {
  try {
    localStorage.setItem(QUESTION_STATS_RESET_KEY, JSON.stringify(flags));
  } catch {
    // Ignore storage quota restrictions
  }
}

export async function loadAllQuestionStats(): Promise<Record<number, QuestionAttemptStat>> {
  const local = loadCachedQuestionStats();
  try {
    const res = await fetch('/api/question-stats');
    if (!res.ok) return local;
    const data = (await res.json()) as { stats?: unknown };
    const serverStats = parseRawStatsMap(data.stats);
    const merged: Record<number, QuestionAttemptStat> = { ...local };
    for (const [key, sStat] of Object.entries(serverStats)) {
      const qId = Number(key);
      const lStat = local[qId];
      if (!lStat || sStat.totalAttempts >= lStat.totalAttempts) {
        merged[qId] = sStat;
      }
    }
    writeCachedQuestionStats(merged);
    return merged;
  } catch {
    return local;
  }
}

export async function recordQuestionAttemptToStore(
  questionId: number,
  isCorrect: boolean,
  selectedOption?: 'A' | 'B' | 'C' | 'D'
): Promise<Record<number, QuestionAttemptStat>> {
  const current = loadCachedQuestionStats();
  const prev = current[questionId] ?? createEmptyQuestionStat(questionId);

  const nextOptionSelections = { ...prev.optionSelections };
  const nextWrongOptionSelections = { ...prev.wrongOptionSelections };
  if (selectedOption) {
    nextOptionSelections[selectedOption] = (nextOptionSelections[selectedOption] ?? 0) + 1;
    if (!isCorrect) {
      nextWrongOptionSelections[selectedOption] =
        (nextWrongOptionSelections[selectedOption] ?? 0) + 1;
    }
  }

  const optimistic: QuestionAttemptStat = {
    questionId,
    totalAttempts: prev.totalAttempts + 1,
    wrongAttempts: prev.wrongAttempts + (isCorrect ? 0 : 1),
    correctAttempts: prev.correctAttempts + (isCorrect ? 1 : 0),
    optionSelections: nextOptionSelections,
    wrongOptionSelections: nextWrongOptionSelections,
    updatedAt: new Date().toISOString(),
  };

  const nextMap: Record<number, QuestionAttemptStat> = {
    ...current,
    [questionId]: optimistic,
  };
  writeCachedQuestionStats(nextMap);

  try {
    const res = await fetch(`/api/question-stats/${questionId}/attempt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isCorrect, selectedOption }),
    });
    if (res.ok) {
      const data = (await res.json()) as { stats?: unknown };
      const synced = parseRawStatsMap(data.stats);
      if (Object.keys(synced).length > 0) {
        writeCachedQuestionStats(synced);
        return synced;
      }
    }
  } catch {
    // Keep optimistic local stats if offline
  }

  return nextMap;
}

export async function resetQuestionStatInStore(
  questionId: number
): Promise<Record<number, QuestionAttemptStat>> {
  const current = loadCachedQuestionStats();
  const nextMap = { ...current };
  delete nextMap[questionId];
  writeCachedQuestionStats(nextMap);

  const flags = loadResetFlags();
  flags[questionId] = new Date().toISOString();
  saveResetFlags(flags);

  try {
    const res = await fetch(`/api/question-stats/${questionId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      const data = (await res.json()) as { stats?: unknown };
      const synced = parseRawStatsMap(data.stats);
      writeCachedQuestionStats(synced);
      return synced;
    }
  } catch {
    // Keep local reset
  }

  return nextMap;
}

/**
 * Combines explicit recorded attempt statistics with any historical completedQuestions
 * from local save data (for sessions recorded before granular stats existed, unless reset).
 */
export function buildEffectiveQuestionStats(
  recordedStats: Record<number, QuestionAttemptStat>,
  completedQuestions?: Record<number, JournalRecord>
): Record<number, QuestionAttemptStat> {
  const effective: Record<number, QuestionAttemptStat> = { ...recordedStats };
  if (!completedQuestions) return effective;

  const resetFlags = loadResetFlags();

  for (const [key, rec] of Object.entries(completedQuestions)) {
    const qId = Number.parseInt(key, 10);
    if (!Number.isInteger(qId) || qId < 1 || qId > 30) continue;
    if (effective[qId] && effective[qId].totalAttempts > 0) continue;

    // Skip fallback synthesis if teacher reset stats after this completion record
    const resetAt = resetFlags[qId];
    if (resetAt && rec.completedAt && resetAt >= rec.completedAt) {
      continue;
    }

    const wrongAttempts = rec.revealedAfterTwoFails
      ? Math.max(2, rec.attempts)
      : Math.max(0, rec.attempts - 1);
    const correctAttempts = rec.revealedAfterTwoFails ? 0 : 1;
    const totalAttempts = wrongAttempts + correctAttempts;

    if (totalAttempts > 0) {
      effective[qId] = {
        questionId: qId,
        totalAttempts,
        wrongAttempts,
        correctAttempts,
        optionSelections: { A: 0, B: 0, C: 0, D: 0 },
        wrongOptionSelections: { A: 0, B: 0, C: 0, D: 0 },
        updatedAt: rec.completedAt || '',
      };
    }
  }

  return effective;
}

export function getWrongAnswerPercentage(stat?: QuestionAttemptStat): number {
  if (!stat || stat.totalAttempts <= 0) return 0;
  return Math.round((stat.wrongAttempts / stat.totalAttempts) * 1000) / 10;
}
