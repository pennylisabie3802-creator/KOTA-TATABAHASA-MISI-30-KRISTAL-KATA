import { QuestionImageRecord, QuestionImageSlotId } from '../types/game';

export const MAX_QUESTION_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const;
export const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;

const IDB_NAME = 'kota_tatabahasa_qimages_db_v1';
const IDB_STORE = 'question_images';

interface LocalIdbEntry {
  slotId: QuestionImageSlotId;
  questionId: number;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  updatedAt: string;
  dataUrl: string;
  thumbnailDataUrl?: string;
  naturalWidth?: number;
  naturalHeight?: number;
}

const THUMBNAIL_MAX_DIMENSION = 960;

/**
 * Generates the strict unique ID `question_01` .. `question_30` for Question 1 .. 30.
 */
export function formatQuestionSlotId(questionId: number): QuestionImageSlotId {
  const clamped = Math.max(1, Math.min(30, Math.floor(questionId)));
  const padded = String(clamped).padStart(2, '0');
  return `question_${padded}` as QuestionImageSlotId;
}

/**
 * Always returns the untouched original full-resolution image URL for zoom/fullscreen inspection.
 */
export function getOriginalQuestionImageUrl(record?: QuestionImageRecord | null): string | null {
  if (!record) return null;
  const src = record.originalImageUrl || record.imageUrl;
  return src && src.trim().length > 0 ? src : null;
}

/**
 * Returns the lightweight preview thumbnail URL for small card/inline previews, falling back to original.
 */
export function getThumbnailQuestionImageUrl(record?: QuestionImageRecord | null): string | null {
  if (!record) return null;
  const src = record.thumbnailUrl || record.originalImageUrl || record.imageUrl;
  return src && src.trim().length > 0 ? src : null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function validateQuestionImageFile(file: File): { valid: true } | { valid: false; error: string } {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const mimeOk = (ALLOWED_IMAGE_MIMES as readonly string[]).includes(file.type.toLowerCase());
  const extOk = (ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(ext);

  if (!mimeOk || !extOk) {
    return {
      valid: false,
      error: 'Format tidak disokong! Sila pilih fail gambar berformat JPG, JPEG, PNG atau WEBP sahaja.',
    };
  }

  if (file.size > MAX_QUESTION_IMAGE_BYTES) {
    return {
      valid: false,
      error: `Saiz fail (${formatBytes(file.size)}) melebihi had maksimum 5 MB bagi setiap gambar.`,
    };
  }

  return { valid: true };
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Gagal membaca fail gambar.'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca fail gambar daripada peranti.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Measures natural image dimensions and generates a separate preview thumbnail ONLY for card display,
 * while keeping the original `dataUrl` 100% untouched and uncompressed for zoom inspection.
 */
async function buildSeparateThumbnailAndDimensions(
  originalDataUrl: string,
  mimeType: string
): Promise<{
  thumbnailDataUrl?: string;
  naturalWidth?: number;
  naturalHeight?: number;
}> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {};
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const naturalWidth = img.naturalWidth || img.width;
      const naturalHeight = img.naturalHeight || img.height;

      if (!naturalWidth || !naturalHeight) {
        resolve({});
        return;
      }

      const maxDim = Math.max(naturalWidth, naturalHeight);
      if (maxDim <= THUMBNAIL_MAX_DIMENSION) {
        resolve({ naturalWidth, naturalHeight });
        return;
      }

      try {
        const ratio = THUMBNAIL_MAX_DIMENSION / maxDim;
        const targetW = Math.max(1, Math.round(naturalWidth * ratio));
        const targetH = Math.max(1, Math.round(naturalHeight * ratio));
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ naturalWidth, naturalHeight });
          return;
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetW, targetH);

        const outMime =
          mimeType === 'image/png'
            ? 'image/png'
            : mimeType === 'image/webp'
            ? 'image/webp'
            : 'image/jpeg';
        const thumbUrl = canvas.toDataURL(outMime, 0.92);
        resolve({
          thumbnailDataUrl: thumbUrl && thumbUrl.length < originalDataUrl.length ? thumbUrl : undefined,
          naturalWidth,
          naturalHeight,
        });
      } catch {
        resolve({ naturalWidth, naturalHeight });
      }
    };
    img.onerror = () => resolve({});
    img.src = originalDataUrl;
  });
}

function openIdb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: 'slotId' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbGetAll(): Promise<Record<string, LocalIdbEntry>> {
  const db = await openIdb();
  if (!db) return {};
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const map: Record<string, LocalIdbEntry> = {};
        for (const item of (req.result ?? []) as LocalIdbEntry[]) {
          if (item && item.slotId) {
            map[item.slotId] = item;
          }
        }
        resolve(map);
      };
      req.onerror = () => resolve({});
    } catch {
      resolve({});
    }
  });
}

async function idbPut(entry: LocalIdbEntry): Promise<void> {
  const db = await openIdb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function idbDelete(slotId: QuestionImageSlotId): Promise<void> {
  const db = await openIdb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).delete(slotId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

/**
 * Loads all saved question images (`question_01` .. `question_30`), merging server storage with IndexedDB fallback.
 */
export async function loadAllQuestionImages(): Promise<
  Partial<Record<QuestionImageSlotId, QuestionImageRecord>>
> {
  const combined: Partial<Record<QuestionImageSlotId, QuestionImageRecord>> = {};

  // 1. Load local IndexedDB entries first as instant fallback
  const localMap = await idbGetAll();
  for (const [key, item] of Object.entries(localMap)) {
    const slotId = key as QuestionImageSlotId;
    combined[slotId] = {
      slotId,
      questionId: item.questionId,
      fileName: item.fileName,
      mimeType: item.mimeType,
      sizeBytes: item.sizeBytes,
      updatedAt: item.updatedAt,
      imageUrl: item.dataUrl,
      originalImageUrl: item.dataUrl,
      thumbnailUrl: item.thumbnailDataUrl || item.dataUrl,
      ...(typeof item.naturalWidth === 'number' ? { naturalWidth: item.naturalWidth } : {}),
      ...(typeof item.naturalHeight === 'number' ? { naturalHeight: item.naturalHeight } : {}),
    };
  }

  // 2. Load server-stored images (authoritative across sessions & shared links)
  try {
    const res = await fetch('/api/question-images', { method: 'GET' });
    if (res.ok) {
      const data = (await res.json()) as {
        images?: Record<string, QuestionImageRecord>;
      };
      if (data.images) {
        for (const [key, srvRec] of Object.entries(data.images)) {
          const slotId = key as QuestionImageSlotId;
          combined[slotId] = {
            ...srvRec,
            originalImageUrl: srvRec.originalImageUrl || srvRec.imageUrl,
            thumbnailUrl: srvRec.thumbnailUrl || srvRec.originalImageUrl || srvRec.imageUrl,
          };
        }
      }
    }
  } catch {
    // Offline or standalone preview fallback uses IndexedDB seamlessly
  }

  return combined;
}

/**
 * Saves an image strictly to the target question's unique ID (`question_01` .. `question_30`).
 * Never compresses or alters `dataUrl` (the original uploaded image), while storing a separate thumbnail for previews.
 */
export async function saveQuestionImageToStore(
  questionId: number,
  file: File,
  dataUrl: string
): Promise<QuestionImageRecord> {
  const slotId = formatQuestionSlotId(questionId);
  const nowIso = new Date().toISOString();
  const resolvedMime = file.type || 'image/png';

  const { thumbnailDataUrl, naturalWidth, naturalHeight } =
    await buildSeparateThumbnailAndDimensions(dataUrl, resolvedMime);

  // Save untouched original + separate preview thumbnail in IndexedDB
  await idbPut({
    slotId,
    questionId,
    fileName: file.name,
    mimeType: resolvedMime,
    sizeBytes: file.size,
    updatedAt: nowIso,
    dataUrl,
    ...(thumbnailDataUrl ? { thumbnailDataUrl } : {}),
    ...(typeof naturalWidth === 'number' ? { naturalWidth } : {}),
    ...(typeof naturalHeight === 'number' ? { naturalHeight } : {}),
  });

  // Also persist original + separate thumbnail to workspace server (/data/question-images/)
  try {
    const res = await fetch(`/api/question-images/${slotId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataUrl,
        ...(thumbnailDataUrl ? { thumbnailDataUrl } : {}),
        ...(typeof naturalWidth === 'number' ? { naturalWidth } : {}),
        ...(typeof naturalHeight === 'number' ? { naturalHeight } : {}),
        fileName: file.name,
        mimeType: resolvedMime,
      }),
    });
    if (res.ok) {
      const payload = (await res.json()) as { record?: QuestionImageRecord };
      if (payload.record) {
        return {
          ...payload.record,
          originalImageUrl: payload.record.originalImageUrl || payload.record.imageUrl,
          thumbnailUrl:
            payload.record.thumbnailUrl ||
            payload.record.originalImageUrl ||
            payload.record.imageUrl,
        };
      }
    }
  } catch {
    // Fallback to IndexedDB record if server unreachable
  }

  return {
    slotId,
    questionId,
    fileName: file.name,
    mimeType: resolvedMime,
    sizeBytes: file.size,
    updatedAt: nowIso,
    imageUrl: dataUrl,
    originalImageUrl: dataUrl,
    thumbnailUrl: thumbnailDataUrl || dataUrl,
    ...(typeof naturalWidth === 'number' ? { naturalWidth } : {}),
    ...(typeof naturalHeight === 'number' ? { naturalHeight } : {}),
  };
}

/**
 * Deletes the stored image strictly for `question_01` .. `question_30`.
 */
export async function deleteQuestionImageFromStore(questionId: number): Promise<void> {
  const slotId = formatQuestionSlotId(questionId);
  await idbDelete(slotId);
  try {
    await fetch(`/api/question-images/${slotId}`, { method: 'DELETE' });
  } catch {
    // Ignore network error after local deletion
  }
}
