import { GameLogoConfig, GameLogoSlotInfo, LogoDisplayMode } from '../types/game';
import { readFileAsDataUrl } from './questionImageStore';

export const OFFICIAL_LOGO_ASSET_ID = 'logo-kota-tatabahasa' as const;
export const BUILTIN_LOGO_PRIMARY_URL = '/assets/logo/logo-kota-tatabahasa.jpeg';
export const BUILTIN_LOGO_FALLBACK_URL = '/assets/aistudio/logo_060d56b7.jpeg';
export const MAX_LOGO_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_EXTS = ['png', 'jpg', 'jpeg', 'webp'] as const;
const ALLOWED_MIMES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'] as const;

const IDB_NAME = 'kota_tatabahasa_logo_db_v1';
const IDB_STORE = 'game_logo_store';
const IDB_KEY = 'logo-kota-tatabahasa';

interface PersistedLogoRecord {
  displayMode: LogoDisplayMode;
  isPlaceholderMode: boolean;
  original?: {
    dataUrl: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    updatedAt: string;
  };
  transparent?: {
    dataUrl: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    updatedAt: string;
  };
}

// Single in-memory Image preload cache so the logo is loaded once and reused across all screens
const preloadedLogoCache = new Map<string, Promise<void>>();

export function preloadLogoUrl(url: string): Promise<void> {
  if (!url || typeof window === 'undefined') return Promise.resolve();
  const existing = preloadedLogoCache.get(url);
  if (existing) return existing;

  const p = new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      if (typeof img.decode === 'function') {
        img.decode().catch(() => {}).finally(() => resolve());
      } else {
        resolve();
      }
    };
    img.onerror = () => resolve();
    img.src = url;
  });

  preloadedLogoCache.set(url, p);
  return p;
}

export function buildDefaultGameLogoConfig(): GameLogoConfig {
  return {
    assetId: OFFICIAL_LOGO_ASSET_ID,
    displayMode: 'original',
    isPlaceholderMode: false,
    original: {
      variant: 'original',
      imageUrl: BUILTIN_LOGO_PRIMARY_URL,
      isCustomUploaded: false,
      fileName: 'logo-kota-tatabahasa.jpeg',
      mimeType: 'image/jpeg',
    },
    transparent: null,
  };
}

export function getActiveLogoUrl(config: GameLogoConfig): string | null {
  if (config.isPlaceholderMode) return null;
  if (config.displayMode === 'transparent' && config.transparent?.imageUrl) {
    return config.transparent.imageUrl;
  }
  return config.original.imageUrl || BUILTIN_LOGO_PRIMARY_URL;
}

export function validateLogoFile(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const mime = (file.type || '').toLowerCase();
  const validExt = ALLOWED_EXTS.includes(ext as (typeof ALLOWED_EXTS)[number]);
  const validMime = ALLOWED_MIMES.includes(mime as (typeof ALLOWED_MIMES)[number]);

  if (!validExt && !validMime) {
    return 'Format tidak disokong. Sila pilih fail PNG, JPG, JPEG, atau WEBP.';
  }
  if (file.size > MAX_LOGO_FILE_BYTES) {
    return 'Saiz fail melebihi had maksimum 10 MB.';
  }
  return null;
}

function openLogoDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function readIdbLogoRecord(): Promise<PersistedLogoRecord | null> {
  try {
    const db = await openLogoDb();
    return await new Promise<PersistedLogoRecord | null>((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(IDB_KEY);
      req.onsuccess = () => resolve((req.result as PersistedLogoRecord | undefined) ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function writeIdbLogoRecord(record: PersistedLogoRecord): Promise<void> {
  try {
    const db = await openLogoDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const req = store.put(record, IDB_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Ignore IndexedDB quota/private mode errors
  }
}

export async function loadGameLogoConfig(): Promise<GameLogoConfig> {
  const base = buildDefaultGameLogoConfig();
  const local = await readIdbLogoRecord();

  if (local) {
    base.displayMode = local.displayMode === 'transparent' ? 'transparent' : 'original';
    base.isPlaceholderMode = Boolean(local.isPlaceholderMode);
    if (local.original?.dataUrl) {
      base.original = {
        variant: 'original',
        imageUrl: local.original.dataUrl,
        isCustomUploaded: true,
        fileName: local.original.fileName,
        mimeType: local.original.mimeType,
        sizeBytes: local.original.sizeBytes,
        updatedAt: local.original.updatedAt,
      };
    }
    if (local.transparent?.dataUrl) {
      base.transparent = {
        variant: 'transparent',
        imageUrl: local.transparent.dataUrl,
        isCustomUploaded: true,
        fileName: local.transparent.fileName,
        mimeType: local.transparent.mimeType,
        sizeBytes: local.transparent.sizeBytes,
        updatedAt: local.transparent.updatedAt,
      };
    }
  }

  try {
    const resp = await fetch('/api/game-logo');
    if (resp.ok) {
      const data = (await resp.json()) as {
        displayMode?: LogoDisplayMode;
        isPlaceholderMode?: boolean;
        original?: Omit<GameLogoSlotInfo, 'isCustomUploaded'> | null;
        transparent?: Omit<GameLogoSlotInfo, 'isCustomUploaded'> | null;
      };

      if (data.original || data.transparent || data.isPlaceholderMode) {
        base.displayMode = data.displayMode === 'transparent' ? 'transparent' : 'original';
        base.isPlaceholderMode = Boolean(data.isPlaceholderMode);
        if (data.original?.imageUrl) {
          base.original = {
            ...data.original,
            variant: 'original',
            isCustomUploaded: true,
          };
        }
        if (data.transparent?.imageUrl) {
          base.transparent = {
            ...data.transparent,
            variant: 'transparent',
            isCustomUploaded: true,
          };
        }
      }
    }
  } catch {
    // Fallback to IndexedDB / built-in static asset
  }

  const activeUrl = getActiveLogoUrl(base);
  if (activeUrl) {
    void preloadLogoUrl(activeUrl);
  }
  void preloadLogoUrl(BUILTIN_LOGO_PRIMARY_URL);

  return base;
}

export async function saveUploadedGameLogo(
  file: File,
  variant: LogoDisplayMode,
  existingConfig: GameLogoConfig
): Promise<GameLogoConfig> {
  const err = validateLogoFile(file);
  if (err) {
    throw new Error(err);
  }

  const dataUrl = await readFileAsDataUrl(file);
  const now = new Date().toISOString();
  const nextDisplayMode: LogoDisplayMode =
    variant === 'transparent' ? 'transparent' : existingConfig.displayMode;

  const existingLocal = (await readIdbLogoRecord()) ?? {
    displayMode: nextDisplayMode,
    isPlaceholderMode: false,
  };

  const slotData = {
    dataUrl,
    fileName: file.name,
    mimeType: file.type || 'image/png',
    sizeBytes: file.size,
    updatedAt: now,
  };

  const updatedLocal: PersistedLogoRecord = {
    ...existingLocal,
    displayMode: variant === 'transparent' ? 'transparent' : 'original',
    isPlaceholderMode: false,
    ...(variant === 'transparent' ? { transparent: slotData } : { original: slotData }),
  };

  await writeIdbLogoRecord(updatedLocal);

  let serverImageUrl: string | null = null;
  try {
    const resp = await fetch('/api/game-logo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        variant,
        dataUrl,
        fileName: file.name,
        mimeType: file.type || 'image/png',
        displayMode: updatedLocal.displayMode,
        isPlaceholderMode: false,
      }),
    });
    if (resp.ok) {
      const json = (await resp.json()) as {
        slot?: { imageUrl?: string };
      };
      if (json.slot?.imageUrl) {
        serverImageUrl = json.slot.imageUrl;
      }
    }
  } catch {
    // IndexedDB already persisted locally
  }

  const resolvedUrl = serverImageUrl ?? dataUrl;
  await preloadLogoUrl(resolvedUrl);

  const updatedSlot: GameLogoSlotInfo = {
    variant,
    imageUrl: resolvedUrl,
    isCustomUploaded: true,
    fileName: file.name,
    mimeType: file.type || 'image/png',
    sizeBytes: file.size,
    updatedAt: now,
  };

  return {
    ...existingConfig,
    assetId: OFFICIAL_LOGO_ASSET_ID,
    displayMode: updatedLocal.displayMode,
    isPlaceholderMode: false,
    original: variant === 'original' ? updatedSlot : existingConfig.original,
    transparent: variant === 'transparent' ? updatedSlot : existingConfig.transparent,
  };
}

export async function updateLogoDisplayMode(
  displayMode: LogoDisplayMode,
  existingConfig: GameLogoConfig
): Promise<GameLogoConfig> {
  const existingLocal = (await readIdbLogoRecord()) ?? {
    displayMode,
    isPlaceholderMode: existingConfig.isPlaceholderMode,
  };
  await writeIdbLogoRecord({
    ...existingLocal,
    displayMode,
  });

  try {
    await fetch('/api/game-logo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayMode }),
    });
  } catch {
    // Ignore offline error
  }

  const next: GameLogoConfig = {
    ...existingConfig,
    displayMode,
  };
  const activeUrl = getActiveLogoUrl(next);
  if (activeUrl) void preloadLogoUrl(activeUrl);
  return next;
}

export async function resetToBuiltinOfficialLogo(): Promise<GameLogoConfig> {
  await writeIdbLogoRecord({
    displayMode: 'original',
    isPlaceholderMode: false,
  });

  try {
    await fetch('/api/game-logo?mode=reset_builtin', { method: 'DELETE' });
  } catch {
    // Ignore offline error
  }

  const def = buildDefaultGameLogoConfig();
  await preloadLogoUrl(BUILTIN_LOGO_PRIMARY_URL);
  return def;
}

export async function setLogoPlaceholderOnlyMode(): Promise<GameLogoConfig> {
  await writeIdbLogoRecord({
    displayMode: 'original',
    isPlaceholderMode: true,
  });

  try {
    await fetch('/api/game-logo?mode=placeholder', { method: 'DELETE' });
  } catch {
    // Ignore offline error
  }

  return {
    ...buildDefaultGameLogoConfig(),
    isPlaceholderMode: true,
  };
}
