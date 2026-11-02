import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB for question images
const MAX_LOCATION_ASSET_BYTES = 10 * 1024 * 1024; // 10 MB for 16:9 pixel art location assets
const DATA_DIR = path.join(__dirname, 'data', 'question-images');
const MANIFEST_PATH = path.join(DATA_DIR, 'manifest.json');
const LOCATION_DATA_DIR = path.join(__dirname, 'data', 'location-assets');
const LOCATION_MANIFEST_PATH = path.join(LOCATION_DATA_DIR, 'manifest.json');
const LOGO_DATA_DIR = path.join(__dirname, 'data', 'game-logo');
const LOGO_MANIFEST_PATH = path.join(LOGO_DATA_DIR, 'manifest.json');
const MAX_LOGO_BYTES = 10 * 1024 * 1024; // 10 MB for official game logo assets
const QUESTION_OVERRIDES_DIR = path.join(__dirname, 'data', 'question-overrides');
const QUESTION_OVERRIDES_PATH = path.join(QUESTION_OVERRIDES_DIR, 'overrides.json');
const QUESTION_STATS_DIR = path.join(__dirname, 'data', 'question-stats');
const QUESTION_STATS_PATH = path.join(QUESTION_STATS_DIR, 'stats.json');

interface StoredImageMeta {
  slotId: string;
  questionId: number;
  originalName: string;
  storedFileName: string;
  thumbnailStoredFileName?: string;
  naturalWidth?: number;
  naturalHeight?: number;
  mimeType: string;
  sizeBytes: number;
  updatedAt: string;
}

interface StoredLocationAssetMeta {
  slotId: string;
  originalName: string;
  storedFileName: string;
  mimeType: string;
  sizeBytes: number;
  updatedAt: string;
}

type ManifestMap = Record<string, StoredImageMeta>;
type LocationManifestMap = Record<string, StoredLocationAssetMeta>;

interface StoredLogoSlotMeta {
  variant: 'original' | 'transparent';
  originalName: string;
  storedFileName: string;
  mimeType: string;
  sizeBytes: number;
  updatedAt: string;
}

interface StoredLogoManifest {
  displayMode?: 'original' | 'transparent';
  isPlaceholderMode?: boolean;
  original?: StoredLogoSlotMeta;
  transparent?: StoredLogoSlotMeta;
}

interface StoredQuestionStat {
  questionId: number;
  totalAttempts: number;
  wrongAttempts: number;
  correctAttempts: number;
  optionSelections: Record<'A' | 'B' | 'C' | 'D', number>;
  wrongOptionSelections: Record<'A' | 'B' | 'C' | 'D', number>;
  updatedAt: string;
}

type QuestionStatsManifest = Record<string, StoredQuestionStat>;

const VALID_LOCATION_SLOTS = new Set([
  'slot_01_peta_dunia',
  'slot_02_taman_sakura',
  'slot_03_istana_kristal',
  'slot_04_perpustakaan_ajaib',
  'slot_05_hutan_misteri',
  'slot_06_kampung_tatabahasa',
  'slot_07_pasar_perkataan',
  'slot_08_menara_media',
  'slot_09_benteng_wira',
]);

const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function isValidSlotId(slotId: string): boolean {
  return /^question_(0[1-9]|[12][0-9]|30)$/.test(slotId);
}

function isValidLocationSlotId(slotId: string): boolean {
  return VALID_LOCATION_SLOTS.has(slotId);
}

function parseQuestionNumber(slotId: string): number {
  return Number.parseInt(slotId.replace('question_', ''), 10);
}

async function ensureStorageReady(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(LOCATION_DATA_DIR, { recursive: true });
  await fs.mkdir(LOGO_DATA_DIR, { recursive: true });
  await fs.mkdir(QUESTION_OVERRIDES_DIR, { recursive: true });
  await fs.mkdir(QUESTION_STATS_DIR, { recursive: true });
}

async function readManifest(): Promise<ManifestMap> {
  try {
    await ensureStorageReady();
    const raw = await fs.readFile(MANIFEST_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as ManifestMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function writeManifest(manifest: ManifestMap): Promise<void> {
  await ensureStorageReady();
  await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
}

async function readLocationManifest(): Promise<LocationManifestMap> {
  try {
    await ensureStorageReady();
    const raw = await fs.readFile(LOCATION_MANIFEST_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as LocationManifestMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function writeLocationManifest(manifest: LocationManifestMap): Promise<void> {
  await ensureStorageReady();
  await fs.writeFile(LOCATION_MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
}

async function readLogoManifest(): Promise<StoredLogoManifest> {
  try {
    await ensureStorageReady();
    const raw = await fs.readFile(LOGO_MANIFEST_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as StoredLogoManifest;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function writeLogoManifest(manifest: StoredLogoManifest): Promise<void> {
  await ensureStorageReady();
  await fs.writeFile(LOGO_MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
}

async function readQuestionOverridesManifest(): Promise<Record<string, unknown>> {
  try {
    await ensureStorageReady();
    const raw = await fs.readFile(QUESTION_OVERRIDES_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function writeQuestionOverridesManifest(manifest: Record<string, unknown>): Promise<void> {
  await ensureStorageReady();
  await fs.writeFile(QUESTION_OVERRIDES_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
}

async function readQuestionStatsManifest(): Promise<QuestionStatsManifest> {
  try {
    await ensureStorageReady();
    const raw = await fs.readFile(QUESTION_STATS_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as QuestionStatsManifest;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function writeQuestionStatsManifest(manifest: QuestionStatsManifest): Promise<void> {
  await ensureStorageReady();
  await fs.writeFile(QUESTION_STATS_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
}

async function startServer() {
  await ensureStorageReady();
  const app = express();

  // 15mb JSON body limit accommodates up to 10 MB binary images encoded as base64 data URLs
  app.use(express.json({ limit: '15mb' }));

  // 1. List all uploaded question images (question_01 .. question_30)
  app.get('/api/question-images', async (_req, res) => {
    try {
      const manifest = await readManifest();
      const result: Record<
        string,
        {
          slotId: string;
          questionId: number;
          fileName: string;
          mimeType: string;
          sizeBytes: number;
          updatedAt: string;
          imageUrl: string;
          originalImageUrl: string;
          thumbnailUrl: string;
          naturalWidth?: number;
          naturalHeight?: number;
        }
      > = {};

      for (const [slotId, meta] of Object.entries(manifest)) {
        if (!isValidSlotId(slotId)) continue;
        const filePath = path.join(DATA_DIR, meta.storedFileName);
        try {
          await fs.access(filePath);
          const version = encodeURIComponent(meta.updatedAt);
          const originalUrl = `/api/question-images/file/${encodeURIComponent(meta.storedFileName)}?v=${version}`;
          let thumbUrl = originalUrl;
          if (meta.thumbnailStoredFileName) {
            const thumbPath = path.join(DATA_DIR, meta.thumbnailStoredFileName);
            try {
              await fs.access(thumbPath);
              thumbUrl = `/api/question-images/file/${encodeURIComponent(meta.thumbnailStoredFileName)}?v=${version}`;
            } catch {
              thumbUrl = originalUrl;
            }
          }

          result[slotId] = {
            slotId: meta.slotId,
            questionId: meta.questionId,
            fileName: meta.originalName,
            mimeType: meta.mimeType,
            sizeBytes: meta.sizeBytes,
            updatedAt: meta.updatedAt,
            imageUrl: originalUrl,
            originalImageUrl: originalUrl,
            thumbnailUrl: thumbUrl,
            ...(typeof meta.naturalWidth === 'number' ? { naturalWidth: meta.naturalWidth } : {}),
            ...(typeof meta.naturalHeight === 'number'
              ? { naturalHeight: meta.naturalHeight }
              : {}),
          };
        } catch {
          // Skip missing file entry
        }
      }

      res.json({ images: result });
    } catch {
      res.status(500).json({ error: 'Gagal memuatkan senarai gambar soalan.' });
    }
  });

  // 2. Serve stored binary image file (original full-quality or separate thumbnail)
  app.get('/api/question-images/file/:storedFileName', async (req, res) => {
    const rawName = path.basename(req.params.storedFileName);
    if (!/^question_(0[1-9]|[12][0-9]|30)(?:_thumb)?\.(jpg|png|webp)$/.test(rawName)) {
      res.status(400).end();
      return;
    }

    const filePath = path.join(DATA_DIR, rawName);
    try {
      const ext = path.extname(rawName).slice(1);
      const mime =
        ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      const buf = await fs.readFile(filePath);
      res.setHeader('Content-Type', mime);
      res.setHeader('Cache-Control', 'no-cache');
      res.send(buf);
    } catch {
      res.status(404).end();
    }
  });

  // 3. Upload / Replace image for a specific question slot (question_01 .. question_30)
  app.post('/api/question-images/:slotId', async (req, res) => {
    const { slotId } = req.params;
    if (!isValidSlotId(slotId)) {
      res.status(400).json({ error: 'ID soalan tidak sah. Gunakan question_01 hingga question_30.' });
      return;
    }

    const { dataUrl, thumbnailDataUrl, naturalWidth, naturalHeight, fileName, mimeType } =
      req.body as {
        dataUrl?: string;
        thumbnailDataUrl?: string;
        naturalWidth?: number;
        naturalHeight?: number;
        fileName?: string;
        mimeType?: string;
      };

    if (!dataUrl || typeof dataUrl !== 'string') {
      res.status(400).json({ error: 'Data gambar tidak lengkap.' });
      return;
    }

    const match = dataUrl.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=]+)$/i);
    if (!match) {
      res.status(400).json({
        error: 'Format gambar tidak disokong. Sila gunakan JPG, JPEG, PNG atau WEBP sahaja.',
      });
      return;
    }

    const normalizedMime = match[1].toLowerCase() === 'image/jpg' ? 'image/jpeg' : match[1].toLowerCase();
    const ext = ALLOWED_MIME_TO_EXT[normalizedMime] ?? ALLOWED_MIME_TO_EXT[(mimeType ?? '').toLowerCase()];
    if (!ext) {
      res.status(400).json({
        error: 'Format fail tidak dibenarkan. Hanya JPG, JPEG, PNG dan WEBP diterima.',
      });
      return;
    }

    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.byteLength > MAX_IMAGE_BYTES) {
      res.status(400).json({
        error: 'Saiz fail melebihi had maksimum 5 MB bagi setiap gambar.',
      });
      return;
    }

    try {
      await ensureStorageReady();
      const manifest = await readManifest();

      // Remove any previous original & thumbnail files with any extension for THIS slotId only
      for (const candidateExt of ['jpg', 'png', 'webp']) {
        await fs.unlink(path.join(DATA_DIR, `${slotId}.${candidateExt}`)).catch(() => {});
        await fs.unlink(path.join(DATA_DIR, `${slotId}_thumb.${candidateExt}`)).catch(() => {});
      }

      // Write untouched 100% original image binary without recompression
      const storedFileName = `${slotId}.${ext}`;
      await fs.writeFile(path.join(DATA_DIR, storedFileName), buffer);

      // Write optional separate thumbnail binary if provided
      let thumbnailStoredFileName: string | undefined;
      if (typeof thumbnailDataUrl === 'string' && thumbnailDataUrl !== dataUrl) {
        const thumbMatch = thumbnailDataUrl.match(
          /^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=]+)$/i
        );
        if (thumbMatch) {
          const thumbMime =
            thumbMatch[1].toLowerCase() === 'image/jpg'
              ? 'image/jpeg'
              : thumbMatch[1].toLowerCase();
          const thumbExt = ALLOWED_MIME_TO_EXT[thumbMime];
          if (thumbExt) {
            const thumbBuffer = Buffer.from(thumbMatch[2], 'base64');
            if (thumbBuffer.byteLength > 0 && thumbBuffer.byteLength <= MAX_IMAGE_BYTES) {
              thumbnailStoredFileName = `${slotId}_thumb.${thumbExt}`;
              await fs.writeFile(path.join(DATA_DIR, thumbnailStoredFileName), thumbBuffer);
            }
          }
        }
      }

      const updatedAt = new Date().toISOString();
      const validWidth =
        typeof naturalWidth === 'number' && Number.isFinite(naturalWidth) && naturalWidth > 0
          ? Math.round(naturalWidth)
          : undefined;
      const validHeight =
        typeof naturalHeight === 'number' && Number.isFinite(naturalHeight) && naturalHeight > 0
          ? Math.round(naturalHeight)
          : undefined;

      const meta: StoredImageMeta = {
        slotId,
        questionId: parseQuestionNumber(slotId),
        originalName: (fileName ?? storedFileName).slice(0, 120),
        storedFileName,
        ...(thumbnailStoredFileName ? { thumbnailStoredFileName } : {}),
        ...(validWidth ? { naturalWidth: validWidth } : {}),
        ...(validHeight ? { naturalHeight: validHeight } : {}),
        mimeType: normalizedMime,
        sizeBytes: buffer.byteLength,
        updatedAt,
      };

      manifest[slotId] = meta;
      await writeManifest(manifest);

      const version = encodeURIComponent(updatedAt);
      const originalUrl = `/api/question-images/file/${encodeURIComponent(storedFileName)}?v=${version}`;
      const thumbUrl = thumbnailStoredFileName
        ? `/api/question-images/file/${encodeURIComponent(thumbnailStoredFileName)}?v=${version}`
        : originalUrl;

      res.json({
        record: {
          slotId,
          questionId: meta.questionId,
          fileName: meta.originalName,
          mimeType: meta.mimeType,
          sizeBytes: meta.sizeBytes,
          updatedAt: meta.updatedAt,
          imageUrl: originalUrl,
          originalImageUrl: originalUrl,
          thumbnailUrl: thumbUrl,
          ...(validWidth ? { naturalWidth: validWidth } : {}),
          ...(validHeight ? { naturalHeight: validHeight } : {}),
        },
      });
    } catch {
      res.status(500).json({ error: 'Gagal menyimpan gambar pada pelayan.' });
    }
  });

  // 4. Delete image for a specific question slot (question_01 .. question_30)
  app.delete('/api/question-images/:slotId', async (req, res) => {
    const { slotId } = req.params;
    if (!isValidSlotId(slotId)) {
      res.status(400).json({ error: 'ID soalan tidak sah.' });
      return;
    }

    try {
      const manifest = await readManifest();
      delete manifest[slotId];
      await writeManifest(manifest);

      for (const candidateExt of ['jpg', 'png', 'webp']) {
        await fs.unlink(path.join(DATA_DIR, `${slotId}.${candidateExt}`)).catch(() => {});
        await fs.unlink(path.join(DATA_DIR, `${slotId}_thumb.${candidateExt}`)).catch(() => {});
      }

      res.json({ deleted: true, slotId });
    } catch {
      res.status(500).json({ error: 'Gagal memadam gambar soalan.' });
    }
  });

  // 5. List custom uploaded location assets (slot_01_peta_dunia .. slot_09_benteng_wira)
  app.get('/api/location-assets', async (_req, res) => {
    try {
      const manifest = await readLocationManifest();
      const assets: Record<
        string,
        {
          slotId: string;
          fileName: string;
          mimeType: string;
          sizeBytes: number;
          updatedAt: string;
          imageUrl: string;
        }
      > = {};

      for (const [slotId, meta] of Object.entries(manifest)) {
        if (!isValidLocationSlotId(slotId)) continue;
        const filePath = path.join(LOCATION_DATA_DIR, meta.storedFileName);
        try {
          await fs.access(filePath);
          const version = encodeURIComponent(meta.updatedAt);
          assets[slotId] = {
            slotId: meta.slotId,
            fileName: meta.originalName,
            mimeType: meta.mimeType,
            sizeBytes: meta.sizeBytes,
            updatedAt: meta.updatedAt,
            imageUrl: `/api/location-assets/file/${encodeURIComponent(meta.storedFileName)}?v=${version}`,
          };
        } catch {
          // Ignore missing file entry
        }
      }

      res.json({ assets });
    } catch {
      res.status(500).json({ error: 'Gagal memuatkan aset gambar lokasi.' });
    }
  });

  // 6. Serve custom uploaded location asset binary file
  app.get('/api/location-assets/file/:storedFileName', async (req, res) => {
    const rawName = path.basename(req.params.storedFileName);
    const ext = path.extname(rawName).slice(1).toLowerCase();
    const baseSlot = path.basename(rawName, path.extname(rawName));
    if (!isValidLocationSlotId(baseSlot) || !['jpg', 'png', 'webp'].includes(ext)) {
      res.status(400).end();
      return;
    }

    const filePath = path.join(LOCATION_DATA_DIR, rawName);
    try {
      const mime =
        ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      const buf = await fs.readFile(filePath);
      res.setHeader('Content-Type', mime);
      res.setHeader('Cache-Control', 'no-cache');
      res.send(buf);
    } catch {
      res.status(404).end();
    }
  });

  // 7. Upload / Replace image for one of the 9 Location Asset Slots
  app.post('/api/location-assets/:slotId', async (req, res) => {
    const { slotId } = req.params;
    if (!isValidLocationSlotId(slotId)) {
      res.status(400).json({ error: 'ID slot aset lokasi tidak sah.' });
      return;
    }

    const { dataUrl, fileName, mimeType } = req.body as {
      dataUrl?: string;
      fileName?: string;
      mimeType?: string;
    };

    if (!dataUrl || typeof dataUrl !== 'string') {
      res.status(400).json({ error: 'Data gambar tidak lengkap.' });
      return;
    }

    const match = dataUrl.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=]+)$/i);
    if (!match) {
      res.status(400).json({
        error: 'Format tidak disokong. Sila gunakan PNG, JPG, JPEG atau WEBP.',
      });
      return;
    }

    const normalizedMime =
      match[1].toLowerCase() === 'image/jpg' ? 'image/jpeg' : match[1].toLowerCase();
    const ext =
      ALLOWED_MIME_TO_EXT[normalizedMime] ?? ALLOWED_MIME_TO_EXT[(mimeType ?? '').toLowerCase()];
    if (!ext) {
      res.status(400).json({ error: 'Format fail tidak dibenarkan.' });
      return;
    }

    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.byteLength > MAX_LOCATION_ASSET_BYTES) {
      res.status(400).json({
        error: 'Saiz fail melebihi had maksimum 10 MB bagi setiap ilustrasi lokasi.',
      });
      return;
    }

    try {
      await ensureStorageReady();
      const manifest = await readLocationManifest();

      for (const candidateExt of ['jpg', 'png', 'webp']) {
        const oldFile = path.join(LOCATION_DATA_DIR, `${slotId}.${candidateExt}`);
        await fs.unlink(oldFile).catch(() => {});
      }

      const storedFileName = `${slotId}.${ext}`;
      await fs.writeFile(path.join(LOCATION_DATA_DIR, storedFileName), buffer);

      const updatedAt = new Date().toISOString();
      const meta: StoredLocationAssetMeta = {
        slotId,
        originalName: (fileName ?? storedFileName).slice(0, 120),
        storedFileName,
        mimeType: normalizedMime,
        sizeBytes: buffer.byteLength,
        updatedAt,
      };

      manifest[slotId] = meta;
      await writeLocationManifest(manifest);

      const version = encodeURIComponent(updatedAt);
      res.json({
        asset: {
          slotId,
          fileName: meta.originalName,
          mimeType: meta.mimeType,
          sizeBytes: meta.sizeBytes,
          updatedAt: meta.updatedAt,
          imageUrl: `/api/location-assets/file/${encodeURIComponent(storedFileName)}?v=${version}`,
        },
      });
    } catch {
      res.status(500).json({ error: 'Gagal menyimpan aset gambar lokasi.' });
    }
  });

  // 8. Reset a Location Asset Slot back to built-in original project asset
  app.delete('/api/location-assets/:slotId', async (req, res) => {
    const { slotId } = req.params;
    if (!isValidLocationSlotId(slotId)) {
      res.status(400).json({ error: 'ID slot aset lokasi tidak sah.' });
      return;
    }

    try {
      const manifest = await readLocationManifest();
      delete manifest[slotId];
      await writeLocationManifest(manifest);

      for (const candidateExt of ['jpg', 'png', 'webp']) {
        const target = path.join(LOCATION_DATA_DIR, `${slotId}.${candidateExt}`);
        await fs.unlink(target).catch(() => {});
      }

      res.json({ deleted: true, slotId });
    } catch {
      res.status(500).json({ error: 'Gagal menetapkan semula gambar lokasi.' });
    }
  });

  // 9. Official Game Logo API (asset: logo-kota-tatabahasa, supporting Mod A original & Mod B transparent)
  app.get('/api/game-logo', async (_req, res) => {
    try {
      const manifest = await readLogoManifest();
      const buildSlotInfo = async (slot?: StoredLogoSlotMeta) => {
        if (!slot) return null;
        const filePath = path.join(LOGO_DATA_DIR, slot.storedFileName);
        try {
          await fs.access(filePath);
          const v = encodeURIComponent(slot.updatedAt);
          return {
            variant: slot.variant,
            fileName: slot.originalName,
            mimeType: slot.mimeType,
            sizeBytes: slot.sizeBytes,
            updatedAt: slot.updatedAt,
            imageUrl: `/api/game-logo/file/${encodeURIComponent(slot.storedFileName)}?v=${v}`,
          };
        } catch {
          return null;
        }
      };

      const [original, transparent] = await Promise.all([
        buildSlotInfo(manifest.original),
        buildSlotInfo(manifest.transparent),
      ]);

      res.json({
        assetId: 'logo-kota-tatabahasa',
        displayMode: manifest.displayMode === 'transparent' ? 'transparent' : 'original',
        isPlaceholderMode: Boolean(manifest.isPlaceholderMode),
        original,
        transparent,
      });
    } catch {
      res.status(500).json({ error: 'Gagal memuatkan konfigurasi logo permainan.' });
    }
  });

  app.get('/api/game-logo/file/:storedFileName', async (req, res) => {
    const rawName = path.basename(req.params.storedFileName);
    const ext = path.extname(rawName).slice(1).toLowerCase();
    const baseName = path.basename(rawName, path.extname(rawName));
    const allowedBases = new Set([
      'logo-kota-tatabahasa',
      'logo-kota-tatabahasa-transparent',
    ]);
    if (!allowedBases.has(baseName) || !['jpg', 'png', 'webp'].includes(ext)) {
      res.status(400).end();
      return;
    }

    const filePath = path.join(LOGO_DATA_DIR, rawName);
    try {
      const mime =
        ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      const buf = await fs.readFile(filePath);
      res.setHeader('Content-Type', mime);
      res.setHeader('Cache-Control', 'no-cache');
      res.send(buf);
    } catch {
      res.status(404).end();
    }
  });

  app.post('/api/game-logo', async (req, res) => {
    const {
      variant = 'original',
      dataUrl,
      fileName,
      mimeType,
      displayMode,
      isPlaceholderMode,
    } = req.body as {
      variant?: 'original' | 'transparent';
      dataUrl?: string;
      fileName?: string;
      mimeType?: string;
      displayMode?: 'original' | 'transparent';
      isPlaceholderMode?: boolean;
    };

    try {
      await ensureStorageReady();
      const manifest = await readLogoManifest();

      // Mode-only update (switching Mod A / Mod B or toggling placeholder mode)
      if (!dataUrl) {
        if (displayMode === 'original' || displayMode === 'transparent') {
          manifest.displayMode = displayMode;
        }
        if (typeof isPlaceholderMode === 'boolean') {
          manifest.isPlaceholderMode = isPlaceholderMode;
        }
        await writeLogoManifest(manifest);
        res.json({
          updated: true,
          displayMode: manifest.displayMode ?? 'original',
          isPlaceholderMode: Boolean(manifest.isPlaceholderMode),
        });
        return;
      }

      const targetVariant: 'original' | 'transparent' =
        variant === 'transparent' ? 'transparent' : 'original';

      const match = dataUrl.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=]+)$/i);
      if (!match) {
        res.status(400).json({
          error: 'Format tidak disokong. Sila gunakan PNG, JPG, JPEG atau WEBP.',
        });
        return;
      }

      const normalizedMime =
        match[1].toLowerCase() === 'image/jpg' ? 'image/jpeg' : match[1].toLowerCase();
      const ext =
        ALLOWED_MIME_TO_EXT[normalizedMime] ?? ALLOWED_MIME_TO_EXT[(mimeType ?? '').toLowerCase()];
      if (!ext) {
        res.status(400).json({ error: 'Format fail logo tidak dibenarkan.' });
        return;
      }

      const buffer = Buffer.from(match[2], 'base64');
      if (buffer.byteLength > MAX_LOGO_BYTES) {
        res.status(400).json({
          error: 'Saiz fail logo melebihi had maksimum 10 MB.',
        });
        return;
      }

      const basePrefix =
        targetVariant === 'transparent'
          ? 'logo-kota-tatabahasa-transparent'
          : 'logo-kota-tatabahasa';

      for (const candidateExt of ['jpg', 'png', 'webp']) {
        const oldFile = path.join(LOGO_DATA_DIR, `${basePrefix}.${candidateExt}`);
        await fs.unlink(oldFile).catch(() => {});
      }

      const storedFileName = `${basePrefix}.${ext}`;
      await fs.writeFile(path.join(LOGO_DATA_DIR, storedFileName), buffer);

      const updatedAt = new Date().toISOString();
      const slotMeta: StoredLogoSlotMeta = {
        variant: targetVariant,
        originalName: (fileName ?? storedFileName).slice(0, 120),
        storedFileName,
        mimeType: normalizedMime,
        sizeBytes: buffer.byteLength,
        updatedAt,
      };

      manifest[targetVariant] = slotMeta;
      manifest.isPlaceholderMode = false;
      if (displayMode === 'original' || displayMode === 'transparent') {
        manifest.displayMode = displayMode;
      } else if (targetVariant === 'transparent') {
        manifest.displayMode = 'transparent';
      } else if (!manifest.displayMode) {
        manifest.displayMode = 'original';
      }

      await writeLogoManifest(manifest);

      const v = encodeURIComponent(updatedAt);
      res.json({
        assetId: 'logo-kota-tatabahasa',
        displayMode: manifest.displayMode,
        isPlaceholderMode: false,
        slot: {
          variant: targetVariant,
          fileName: slotMeta.originalName,
          mimeType: slotMeta.mimeType,
          sizeBytes: slotMeta.sizeBytes,
          updatedAt: slotMeta.updatedAt,
          imageUrl: `/api/game-logo/file/${encodeURIComponent(storedFileName)}?v=${v}`,
        },
      });
    } catch {
      res.status(500).json({ error: 'Gagal menyimpan logo permainan pada pelayan.' });
    }
  });

  app.delete('/api/game-logo', async (req, res) => {
    const mode = req.query.mode === 'placeholder' ? 'placeholder' : 'reset_builtin';
    try {
      const manifest = await readLogoManifest();
      delete manifest.original;
      delete manifest.transparent;
      manifest.displayMode = 'original';
      manifest.isPlaceholderMode = mode === 'placeholder';
      await writeLogoManifest(manifest);

      for (const basePrefix of ['logo-kota-tatabahasa', 'logo-kota-tatabahasa-transparent']) {
        for (const candidateExt of ['jpg', 'png', 'webp']) {
          await fs.unlink(path.join(LOGO_DATA_DIR, `${basePrefix}.${candidateExt}`)).catch(() => {});
        }
      }

      res.json({
        reset: true,
        isPlaceholderMode: manifest.isPlaceholderMode,
        displayMode: 'original',
      });
    } catch {
      res.status(500).json({ error: 'Gagal menetapkan semula logo permainan.' });
    }
  });

  // Question Content Quick Edit Overrides (Question 1..30)
  app.get('/api/question-overrides', async (_req, res) => {
    try {
      const overrides = await readQuestionOverridesManifest();
      res.json({ overrides });
    } catch {
      res.status(500).json({ error: 'Gagal memuatkan suntingan soalan.' });
    }
  });

  app.put('/api/question-overrides/:questionId', async (req, res) => {
    const qId = Number.parseInt(req.params.questionId, 10);
    if (!Number.isInteger(qId) || qId < 1 || qId > 30) {
      res.status(400).json({ error: 'ID soalan mesti antara 1 hingga 30.' });
      return;
    }

    const { fields } = req.body as { fields?: Record<string, unknown> };
    if (
      !fields ||
      typeof fields !== 'object' ||
      typeof fields.title !== 'string' ||
      typeof fields.situasi !== 'string' ||
      typeof fields.arahan !== 'string' ||
      typeof fields.petunjuk !== 'string' ||
      typeof fields.kesalahanAsal !== 'string' ||
      typeof fields.pembetulanPenuh !== 'string' ||
      typeof fields.justifikasi !== 'string'
    ) {
      res.status(400).json({ error: 'Data kandungan soalan tidak lengkap.' });
      return;
    }

    try {
      const manifest = await readQuestionOverridesManifest();
      const updatedOverride = {
        ...fields,
        updatedAt: new Date().toISOString(),
      };
      manifest[String(qId)] = updatedOverride;
      await writeQuestionOverridesManifest(manifest);
      res.json({ override: updatedOverride });
    } catch {
      res.status(500).json({ error: 'Gagal menyimpan suntingan soalan.' });
    }
  });

  app.delete('/api/question-overrides/:questionId', async (req, res) => {
    const qId = Number.parseInt(req.params.questionId, 10);
    if (!Number.isInteger(qId) || qId < 1 || qId > 30) {
      res.status(400).json({ error: 'ID soalan mesti antara 1 hingga 30.' });
      return;
    }

    try {
      const manifest = await readQuestionOverridesManifest();
      delete manifest[String(qId)];
      await writeQuestionOverridesManifest(manifest);
      res.json({ deleted: true });
    } catch {
      res.status(500).json({ error: 'Gagal memadam suntingan soalan.' });
    }
  });

  // Student Error Frequency Analytics (Question 1..30)
  app.get('/api/question-stats', async (_req, res) => {
    try {
      const stats = await readQuestionStatsManifest();
      res.json({ stats });
    } catch {
      res.status(500).json({ error: 'Gagal memuatkan statistik jawapan murid.' });
    }
  });

  app.post('/api/question-stats/:questionId/attempt', async (req, res) => {
    const qId = Number.parseInt(req.params.questionId, 10);
    if (!Number.isInteger(qId) || qId < 1 || qId > 30) {
      res.status(400).json({ error: 'ID soalan mesti antara 1 hingga 30.' });
      return;
    }

    const { isCorrect, selectedOption } = req.body as {
      isCorrect?: unknown;
      selectedOption?: unknown;
    };

    if (typeof isCorrect !== 'boolean') {
      res.status(400).json({ error: 'Status jawapan tidak sah.' });
      return;
    }

    const validOpt =
      selectedOption === 'A' ||
      selectedOption === 'B' ||
      selectedOption === 'C' ||
      selectedOption === 'D'
        ? selectedOption
        : null;

    try {
      const manifest = await readQuestionStatsManifest();
      const key = String(qId);
      const existing: StoredQuestionStat = manifest[key] ?? {
        questionId: qId,
        totalAttempts: 0,
        wrongAttempts: 0,
        correctAttempts: 0,
        optionSelections: { A: 0, B: 0, C: 0, D: 0 },
        wrongOptionSelections: { A: 0, B: 0, C: 0, D: 0 },
        updatedAt: new Date().toISOString(),
      };

      const nextOptionSelections = {
        A: existing.optionSelections?.A ?? 0,
        B: existing.optionSelections?.B ?? 0,
        C: existing.optionSelections?.C ?? 0,
        D: existing.optionSelections?.D ?? 0,
      };
      const nextWrongOptionSelections = {
        A: existing.wrongOptionSelections?.A ?? 0,
        B: existing.wrongOptionSelections?.B ?? 0,
        C: existing.wrongOptionSelections?.C ?? 0,
        D: existing.wrongOptionSelections?.D ?? 0,
      };

      if (validOpt) {
        nextOptionSelections[validOpt] += 1;
        if (!isCorrect) {
          nextWrongOptionSelections[validOpt] += 1;
        }
      }

      const updated: StoredQuestionStat = {
        questionId: qId,
        totalAttempts: (existing.totalAttempts ?? 0) + 1,
        wrongAttempts: (existing.wrongAttempts ?? 0) + (isCorrect ? 0 : 1),
        correctAttempts: (existing.correctAttempts ?? 0) + (isCorrect ? 1 : 0),
        optionSelections: nextOptionSelections,
        wrongOptionSelections: nextWrongOptionSelections,
        updatedAt: new Date().toISOString(),
      };

      manifest[key] = updated;
      await writeQuestionStatsManifest(manifest);
      res.json({ stat: updated, stats: manifest });
    } catch {
      res.status(500).json({ error: 'Gagal merekodkan statistik jawapan murid.' });
    }
  });

  app.delete('/api/question-stats/:questionId', async (req, res) => {
    const qId = Number.parseInt(req.params.questionId, 10);
    if (!Number.isInteger(qId) || qId < 1 || qId > 30) {
      res.status(400).json({ error: 'ID soalan mesti antara 1 hingga 30.' });
      return;
    }

    try {
      const manifest = await readQuestionStatsManifest();
      delete manifest[String(qId)];
      await writeQuestionStatsManifest(manifest);
      res.json({ reset: true, stats: manifest });
    } catch {
      res.status(500).json({ error: 'Gagal menetapkan semula statistik soalan.' });
    }
  });

  // Mount Vite middleware in development or serve built SPA in production
  if (process.env.NODE_ENV !== 'production') {
    app.use(express.static(path.join(__dirname, 'public')));
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
