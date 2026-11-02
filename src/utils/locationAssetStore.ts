import {
  LocationAssetRecord,
  LocationAssetSlotId,
  RegionId,
} from '../types/game';
import { formatBytes, readFileAsDataUrl } from './questionImageStore';

export const MAX_LOCATION_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_EXTS = ['png', 'jpg', 'jpeg', 'webp'] as const;
const ALLOWED_MIMES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
] as const;

const IDB_NAME = 'kota_tatabahasa_loc_assets_db_v1';
const IDB_STORE = 'location_assets';

export interface LocationSlotDefinition {
  slotId: LocationAssetSlotId;
  slotNumber: number;
  slotTitle: string;
  locationName: string;
  regionId: RegionId | null;
  defaultUrl: string;
  fallbackUrl: string;
}

export const LOCATION_ASSET_SLOTS: LocationSlotDefinition[] = [
  {
    slotId: 'slot_01_peta_dunia',
    slotNumber: 1,
    slotTitle: 'SLOT 1: PETA DUNIA KERAJAAN TATABAHASA',
    locationName: 'Peta Dunia Kerajaan Tatabahasa',
    regionId: null,
    defaultUrl: '/assets/locations/peta-dunia.jpeg',
    fallbackUrl: '/assets/aistudio/PETA_DUNIA_a753ee18.jpeg',
  },
  {
    slotId: 'slot_02_taman_sakura',
    slotNumber: 2,
    slotTitle: 'SLOT 2: TAMAN SAKURA BAHASA',
    locationName: 'Taman Sakura Bahasa',
    regionId: 'taman_sakura',
    defaultUrl: '/assets/locations/taman-sakura-bahasa.jpeg',
    fallbackUrl: '/assets/aistudio/TAMAN_SAKURA_BAHASA_f238320c.jpeg',
  },
  {
    slotId: 'slot_03_istana_kristal',
    slotNumber: 3,
    slotTitle: 'SLOT 3: ISTANA KRISTAL KOTA',
    locationName: 'Istana Kristal Kota',
    regionId: 'istana_luar',
    defaultUrl: '/assets/locations/istana-kristal-kota.jpeg',
    fallbackUrl: '/assets/aistudio/ISTANA_KRISTAL_KOTA_b6cafa74.jpeg',
  },
  {
    slotId: 'slot_04_perpustakaan_ajaib',
    slotNumber: 4,
    slotTitle: 'SLOT 4: PERPUSTAKAAN AJAIB',
    locationName: 'Perpustakaan Ajaib',
    regionId: 'perpustakaan_ajaib',
    defaultUrl: '/assets/locations/perpustakaan-ajaib.jpeg',
    fallbackUrl: '/assets/aistudio/PERPUSTAKAAN_AJAIB_b9b75c3e.jpeg',
  },
  {
    slotId: 'slot_05_hutan_misteri',
    slotNumber: 5,
    slotTitle: 'SLOT 5: HUTAN MISTERI PERKATAAN',
    locationName: 'Hutan Misteri Perkataan',
    regionId: 'hutan_misteri',
    defaultUrl: '/assets/locations/hutan-misteri-perkataan.jpeg',
    fallbackUrl: '/assets/aistudio/HUTAN_MISTERI_PERKATAAN_5e75a015.jpeg',
  },
  {
    slotId: 'slot_06_kampung_tatabahasa',
    slotNumber: 6,
    slotTitle: 'SLOT 6: KAMPUNG TATABAHASA',
    locationName: 'Kampung Tatabahasa',
    regionId: 'kampung_tatabahasa',
    defaultUrl: '/assets/locations/kampung-tatabahasa.jpeg',
    fallbackUrl: '/assets/aistudio/KAMPUNG_BAHASA_bb8d8de0.jpeg',
  },
  {
    slotId: 'slot_07_pasar_perkataan',
    slotNumber: 7,
    slotTitle: 'SLOT 7: PASAR PERKATAAN',
    locationName: 'Pasar Perkataan',
    regionId: 'pasar_perkataan',
    defaultUrl: '/assets/locations/pasar-perkataan.jpeg',
    fallbackUrl: '/assets/aistudio/PASAR_PERKATAAN_29689bff.jpeg',
  },
  {
    slotId: 'slot_08_menara_media',
    slotNumber: 8,
    slotTitle: 'SLOT 8: MENARA MEDIA',
    locationName: 'Menara Media',
    regionId: 'menara_media',
    defaultUrl: '/assets/locations/menara-media.jpeg',
    fallbackUrl: '/assets/aistudio/MENARA_MEDIA_3297b918.jpeg',
  },
  {
    slotId: 'slot_09_benteng_wira',
    slotNumber: 9,
    slotTitle: 'SLOT 9: BENTENG WIRA BAHASA',
    locationName: 'Benteng Wira Bahasa',
    regionId: 'benteng_wira',
    defaultUrl: '/assets/locations/benteng-wira-bahasa.jpeg',
    fallbackUrl: '/assets/aistudio/BENTENG_WIRA_BAHASA_e43e6d13.jpeg',
  },
];

export function getSlotByRegionId(regionId: RegionId | null): LocationSlotDefinition {
  if (regionId === null) return LOCATION_ASSET_SLOTS[0];
  return (
    LOCATION_ASSET_SLOTS.find((s) => s.regionId === regionId) ??
    LOCATION_ASSET_SLOTS[1]
  );
}

export function buildDefaultLocationAssetMap(): Record<
  LocationAssetSlotId,
  LocationAssetRecord
> {
  const map = {} as Record<LocationAssetSlotId, LocationAssetRecord>;
  for (const def of LOCATION_ASSET_SLOTS) {
    map[def.slotId] = {
      slotId: def.slotId,
      slotNumber: def.slotNumber,
      label: def.locationName,
      regionId: def.regionId,
      imageUrl: def.defaultUrl,
      fallbackUrl: def.fallbackUrl,
      isCustomUploaded: false,
    };
  }
  return map;
}

export function validateLocationImageFile(
  file: File
): { valid: true } | { valid: false; error: string } {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const mimeOk = (ALLOWED_MIMES as readonly string[]).includes(file.type.toLowerCase());
  const extOk = (ALLOWED_EXTS as readonly string[]).includes(ext);

  if (!mimeOk || !extOk) {
    return {
      valid: false,
      error:
        'Format tidak disokong! Sila pilih fail gambar berformat PNG, JPG, JPEG atau WEBP.',
    };
  }

  if (file.size > MAX_LOCATION_IMAGE_BYTES) {
    return {
      valid: false,
      error: `Saiz fail (${formatBytes(
        file.size
      )}) melebihi had maksimum 10 MB bagi setiap ilustrasi lokasi.`,
    };
  }

  return { valid: true };
}

interface LocalLocationIdbEntry {
  slotId: LocationAssetSlotId;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  updatedAt: string;
  dataUrl: string;
}

function openLocationIdb(): Promise<IDBDatabase | null> {
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

async function idbGetAllLocationAssets(): Promise<
  Record<string, LocalLocationIdbEntry>
> {
  const db = await openLocationIdb();
  if (!db) return {};
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).getAll();
      req.onsuccess = () => {
        const out: Record<string, LocalLocationIdbEntry> = {};
        for (const item of (req.result ?? []) as LocalLocationIdbEntry[]) {
          if (item && item.slotId) {
            out[item.slotId] = item;
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

async function idbPutLocationAsset(entry: LocalLocationIdbEntry): Promise<void> {
  const db = await openLocationIdb();
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

async function idbDeleteLocationAsset(slotId: LocationAssetSlotId): Promise<void> {
  const db = await openLocationIdb();
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
 * Loads all 9 Location Asset slots: starts with built-in original project illustrations,
 * overlaid with any runtime IndexedDB or server-saved custom replacements.
 */
export async function loadAllLocationAssets(): Promise<
  Record<LocationAssetSlotId, LocationAssetRecord>
> {
  const merged = buildDefaultLocationAssetMap();

  // 1. Apply IndexedDB entries (instant local persistence)
  const localEntries = await idbGetAllLocationAssets();
  for (const def of LOCATION_ASSET_SLOTS) {
    const item = localEntries[def.slotId];
    if (item && item.dataUrl) {
      merged[def.slotId] = {
        ...merged[def.slotId],
        imageUrl: item.dataUrl,
        isCustomUploaded: true,
        fileName: item.fileName,
        mimeType: item.mimeType,
        sizeBytes: item.sizeBytes,
        updatedAt: item.updatedAt,
      };
    }
  }

  // 2. Apply server-stored custom assets if available
  try {
    const res = await fetch('/api/location-assets', { method: 'GET' });
    if (res.ok) {
      const data = (await res.json()) as {
        assets?: Record<
          string,
          {
            slotId: string;
            fileName: string;
            mimeType: string;
            sizeBytes: number;
            updatedAt: string;
            imageUrl: string;
          }
        >;
      };
      if (data.assets) {
        for (const def of LOCATION_ASSET_SLOTS) {
          const srv = data.assets[def.slotId];
          if (srv && srv.imageUrl) {
            merged[def.slotId] = {
              ...merged[def.slotId],
              imageUrl: srv.imageUrl,
              isCustomUploaded: true,
              fileName: srv.fileName,
              mimeType: srv.mimeType,
              sizeBytes: srv.sizeBytes,
              updatedAt: srv.updatedAt,
            };
          }
        }
      }
    }
  } catch {
    // IndexedDB + built-in project assets continue seamlessly offline
  }

  return merged;
}

export async function saveLocationAssetToStore(
  slotId: LocationAssetSlotId,
  file: File,
  preReadDataUrl?: string
): Promise<LocationAssetRecord> {
  const def =
    LOCATION_ASSET_SLOTS.find((s) => s.slotId === slotId) ?? LOCATION_ASSET_SLOTS[0];
  const dataUrl = preReadDataUrl ?? (await readFileAsDataUrl(file));
  const nowIso = new Date().toISOString();

  await idbPutLocationAsset({
    slotId,
    fileName: file.name,
    mimeType: file.type || 'image/png',
    sizeBytes: file.size,
    updatedAt: nowIso,
    dataUrl,
  });

  try {
    const res = await fetch(`/api/location-assets/${slotId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataUrl,
        fileName: file.name,
        mimeType: file.type,
      }),
    });
    if (res.ok) {
      const payload = (await res.json()) as {
        asset?: {
          fileName: string;
          mimeType: string;
          sizeBytes: number;
          updatedAt: string;
          imageUrl: string;
        };
      };
      if (payload.asset) {
        return {
          slotId,
          slotNumber: def.slotNumber,
          label: def.locationName,
          regionId: def.regionId,
          imageUrl: payload.asset.imageUrl,
          fallbackUrl: def.fallbackUrl,
          isCustomUploaded: true,
          fileName: payload.asset.fileName,
          mimeType: payload.asset.mimeType,
          sizeBytes: payload.asset.sizeBytes,
          updatedAt: payload.asset.updatedAt,
        };
      }
    }
  } catch {
    // Fallback to IndexedDB dataUrl seamlessly
  }

  return {
    slotId,
    slotNumber: def.slotNumber,
    label: def.locationName,
    regionId: def.regionId,
    imageUrl: dataUrl,
    fallbackUrl: def.fallbackUrl,
    isCustomUploaded: true,
    fileName: file.name,
    mimeType: file.type || 'image/png',
    sizeBytes: file.size,
    updatedAt: nowIso,
  };
}

export async function resetLocationAssetToDefault(
  slotId: LocationAssetSlotId
): Promise<LocationAssetRecord> {
  const def =
    LOCATION_ASSET_SLOTS.find((s) => s.slotId === slotId) ?? LOCATION_ASSET_SLOTS[0];
  await idbDeleteLocationAsset(slotId);
  try {
    await fetch(`/api/location-assets/${slotId}`, { method: 'DELETE' });
  } catch {
    // Ignore network error after local reset
  }
  return {
    slotId,
    slotNumber: def.slotNumber,
    label: def.locationName,
    regionId: def.regionId,
    imageUrl: def.defaultUrl,
    fallbackUrl: def.fallbackUrl,
    isCustomUploaded: false,
  };
}
