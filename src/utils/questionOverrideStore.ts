import { QuestionEditableFields, QuizOption } from '../types/game';

const LS_OVERRIDES_KEY = 'kota_tatabahasa_question_overrides_v1';
const IDB_NAME = 'kota_tatabahasa_qoverrides_db_v1';
const IDB_STORE = 'question_overrides';

interface IdbOverrideRow {
  questionId: number;
  fields: QuestionEditableFields;
}

function isValidQuestionId(id: number): boolean {
  return Number.isInteger(id) && id >= 1 && id <= 30;
}

function sanitizeEditableFields(raw: unknown): QuestionEditableFields | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (
    typeof obj.title !== 'string' ||
    typeof obj.situasi !== 'string' ||
    typeof obj.arahan !== 'string' ||
    typeof obj.petunjuk !== 'string' ||
    typeof obj.kesalahanAsal !== 'string' ||
    typeof obj.pembetulanPenuh !== 'string' ||
    typeof obj.justifikasi !== 'string'
  ) {
    return null;
  }

  const type = obj.type === 'fill' ? 'fill' : 'mcq';

  let options: QuizOption[] | undefined;
  if (Array.isArray(obj.options)) {
    const validLabels = ['A', 'B', 'C', 'D'] as const;
    const parsedOpts: QuizOption[] = [];
    for (const label of validLabels) {
      const found = (obj.options as unknown[]).find(
        (item) =>
          item &&
          typeof item === 'object' &&
          (item as Record<string, unknown>).label === label &&
          typeof (item as Record<string, unknown>).text === 'string'
      ) as QuizOption | undefined;
      if (found) {
        parsedOpts.push({ label, text: found.text });
      }
    }
    if (parsedOpts.length > 0) {
      options = parsedOpts;
    }
  }

  const correctOption =
    obj.correctOption === 'A' ||
    obj.correctOption === 'B' ||
    obj.correctOption === 'C' ||
    obj.correctOption === 'D'
      ? obj.correctOption
      : undefined;

  const acceptedAnswers = Array.isArray(obj.acceptedAnswers)
    ? obj.acceptedAnswers
        .filter((a): a is string => typeof a === 'string')
        .map((a) => a.trim().replace(/\s+/g, ' ').toLowerCase())
        .filter(Boolean)
    : undefined;

  return {
    title: obj.title,
    objectName: typeof obj.objectName === 'string' ? obj.objectName : '',
    type,
    situasi: obj.situasi,
    arahan: obj.arahan,
    options,
    correctOption,
    acceptedAnswers,
    petunjuk: obj.petunjuk,
    kesalahanAsal: obj.kesalahanAsal,
    pembetulanPenuh: obj.pembetulanPenuh,
    justifikasi: obj.justifikasi,
    updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : undefined,
  };
}

export function loadCachedQuestionOverrides(): Record<number, QuestionEditableFields> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LS_OVERRIDES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') return {};
    const out: Record<number, QuestionEditableFields> = {};
    for (const [k, val] of Object.entries(parsed)) {
      const qId = Number.parseInt(k, 10);
      if (!isValidQuestionId(qId)) continue;
      const clean = sanitizeEditableFields(val);
      if (clean) {
        out[qId] = clean;
      }
    }
    return out;
  } catch {
    return {};
  }
}

function saveCachedQuestionOverrides(map: Record<number, QuestionEditableFields>): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(LS_OVERRIDES_KEY, JSON.stringify(map));
  } catch {
    // Ignore localStorage quota issues; IndexedDB + Server still persist safely
  }
}

function openOverrideIdb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: 'questionId' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbGetAllOverrides(): Promise<Record<number, QuestionEditableFields>> {
  const db = await openOverrideIdb();
  if (!db) return {};
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).getAll();
      req.onsuccess = () => {
        const out: Record<number, QuestionEditableFields> = {};
        for (const row of (req.result ?? []) as IdbOverrideRow[]) {
          if (row && isValidQuestionId(row.questionId)) {
            const clean = sanitizeEditableFields(row.fields);
            if (clean) out[row.questionId] = clean;
          }
        }
        resolve(out);
      };
      req.onerror = () => resolve({});
    } catch {
      resolve({});
    }
  });
}

async function idbPutOverride(questionId: number, fields: QuestionEditableFields): Promise<void> {
  const db = await openOverrideIdb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put({ questionId, fields } satisfies IdbOverrideRow);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function idbDeleteOverride(questionId: number): Promise<void> {
  const db = await openOverrideIdb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).delete(questionId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

/**
 * Loads all saved question edits across localStorage, IndexedDB, and Server storage,
 * keeping whichever version has the newest timestamp per question ID.
 */
export async function loadAllQuestionOverrides(): Promise<
  Record<number, QuestionEditableFields>
> {
  const merged: Record<number, QuestionEditableFields> = {
    ...loadCachedQuestionOverrides(),
  };

  const mergeEntry = (qId: number, candidate: QuestionEditableFields) => {
    const existing = merged[qId];
    if (!existing) {
      merged[qId] = candidate;
      return;
    }
    const existingTs = existing.updatedAt ? Date.parse(existing.updatedAt) : 0;
    const candidateTs = candidate.updatedAt ? Date.parse(candidate.updatedAt) : 0;
    if (candidateTs >= existingTs) {
      merged[qId] = candidate;
    }
  };

  const idbMap = await idbGetAllOverrides();
  for (const [key, fields] of Object.entries(idbMap)) {
    const qId = Number.parseInt(key, 10);
    if (isValidQuestionId(qId)) {
      mergeEntry(qId, fields);
    }
  }

  try {
    const res = await fetch('/api/question-overrides', { method: 'GET' });
    if (res.ok) {
      const payload = (await res.json()) as {
        overrides?: Record<string, unknown>;
      };
      if (payload.overrides && typeof payload.overrides === 'object') {
        for (const [key, rawVal] of Object.entries(payload.overrides)) {
          const qId = Number.parseInt(key, 10);
          if (!isValidQuestionId(qId)) continue;
          const clean = sanitizeEditableFields(rawVal);
          if (clean) {
            mergeEntry(qId, clean);
          }
        }
      }
    }
  } catch {
    // Offline fallback uses IndexedDB + localStorage seamlessly
  }

  saveCachedQuestionOverrides(merged);
  return merged;
}

/**
 * Safely saves edits for ONLY `questionId` (1..30) across localStorage, IndexedDB, and Server.
 */
export async function saveQuestionOverrideToStore(
  questionId: number,
  fields: QuestionEditableFields
): Promise<QuestionEditableFields> {
  if (!isValidQuestionId(questionId)) {
    throw new Error('ID soalan tidak sah.');
  }

  const stamped: QuestionEditableFields = {
    ...fields,
    updatedAt: new Date().toISOString(),
  };

  // 1. Update localStorage cache for only this questionId
  const currentCached = loadCachedQuestionOverrides();
  currentCached[questionId] = stamped;
  saveCachedQuestionOverrides(currentCached);

  // 2. Update IndexedDB
  await idbPutOverride(questionId, stamped);

  // 3. Persist to Express server (/api/question-overrides/:questionId)
  try {
    const res = await fetch(`/api/question-overrides/${questionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: stamped }),
    });
    if (res.ok) {
      const data = (await res.json()) as { override?: unknown };
      const cleanSrv = sanitizeEditableFields(data.override);
      if (cleanSrv) {
        const refreshed = loadCachedQuestionOverrides();
        refreshed[questionId] = cleanSrv;
        saveCachedQuestionOverrides(refreshed);
        await idbPutOverride(questionId, cleanSrv);
        return cleanSrv;
      }
    }
  } catch {
    // Offline fallback remains safely stored in localStorage & IndexedDB
  }

  return stamped;
}

/**
 * Removes custom text override for ONLY `questionId` (1..30), restoring its baseline PDF text.
 */
export async function deleteQuestionOverrideFromStore(questionId: number): Promise<void> {
  if (!isValidQuestionId(questionId)) return;

  const currentCached = loadCachedQuestionOverrides();
  delete currentCached[questionId];
  saveCachedQuestionOverrides(currentCached);

  await idbDeleteOverride(questionId);

  try {
    await fetch(`/api/question-overrides/${questionId}`, { method: 'DELETE' });
  } catch {
    // Ignore network error after local deletion
  }
}
