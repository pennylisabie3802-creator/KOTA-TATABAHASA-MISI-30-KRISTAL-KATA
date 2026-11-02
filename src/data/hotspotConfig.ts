import { HotspotRect, HotspotScopeId } from '../types/game';

const HOTSPOT_STORAGE_KEY = 'kota_tatabahasa_hotspot_coords_v1';

/**
 * Calibrated percentage coordinates (0..100) measured directly from the 9 original
 * 1280x720 pixel-art illustrations. Developers can adjust and save custom percentage
 * coordinates at runtime using MOD EDIT HOTSPOT.
 */
export const DEFAULT_HOTSPOTS_BY_SCOPE: Record<HotspotScopeId, HotspotRect[]> = {
  // =========================================================================
  // PETA DUNIA KERAJAAN TATABAHASA (8 Lokasi Utama)
  // =========================================================================
  world_map: [
    {
      id: 'taman_sakura',
      label: 'Taman Sakura Bahasa',
      subtitle: 'Misi 1: Detektif Bahasa',
      left: 2.5,
      top: 2.5,
      width: 30.5,
      height: 32.0,
      glowVariant: 'gold',
    },
    {
      id: 'istana_luar',
      label: 'Istana Kristal Kota',
      subtitle: 'Pusat Diraja & 30 Kristal',
      left: 35.0,
      top: 1.5,
      width: 29.8,
      height: 40.5,
      glowVariant: 'purple',
    },
    {
      id: 'perpustakaan_ajaib',
      label: 'Perpustakaan Ajaib',
      subtitle: '6 Modul Ilmu Bahasa',
      left: 67.0,
      top: 1.5,
      width: 31.2,
      height: 32.5,
      glowVariant: 'blue',
    },
    {
      id: 'hutan_misteri',
      label: 'Hutan Misteri Perkataan',
      subtitle: 'Petunjuk & Kuiz Mini',
      left: 1.8,
      top: 35.5,
      width: 29.0,
      height: 24.5,
      glowVariant: 'wood',
    },
    {
      id: 'menara_media',
      label: 'Menara Media',
      subtitle: 'Misi 2 (Soalan 17–20)',
      left: 73.5,
      top: 31.0,
      width: 25.0,
      height: 29.0,
      glowVariant: 'blue',
    },
    {
      id: 'kampung_tatabahasa',
      label: 'Kampung Tatabahasa',
      subtitle: 'Amalan Bahasa Harian',
      left: 1.8,
      top: 61.5,
      width: 29.5,
      height: 35.5,
      glowVariant: 'wood',
    },
    {
      id: 'pasar_perkataan',
      label: 'Pasar Perkataan',
      subtitle: 'Misi 2 (Soalan 11–16)',
      left: 33.8,
      top: 62.5,
      width: 31.2,
      height: 34.5,
      glowVariant: 'gold',
    },
    {
      id: 'benteng_wira',
      label: 'Benteng Wira Bahasa',
      subtitle: 'Misi 3 (Soalan 21–30)',
      left: 67.5,
      top: 60.5,
      width: 31.0,
      height: 36.5,
      glowVariant: 'purple',
    },
  ],

  // =========================================================================
  // 1. TAMAN SAKURA BAHASA
  // =========================================================================
  taman_sakura: [
    {
      id: 'misi_1_detektif',
      label: 'Misi 1: Detektif Bahasa',
      subtitle: 'Buka Cabaran Soalan 1–10',
      left: 75.3,
      top: 32.8,
      width: 23.3,
      height: 8.2,
      glowVariant: 'gold',
    },
    {
      id: 'bahan_pembelajaran',
      label: 'Bahan Pembelajaran',
      subtitle: 'Buka Modul Pembelajaran',
      left: 75.3,
      top: 43.8,
      width: 23.3,
      height: 8.2,
      glowVariant: 'purple',
    },
    {
      id: 'papan_notis',
      label: 'Papan Notis',
      subtitle: 'Paparkan Notis Interaktif',
      left: 75.3,
      top: 54.8,
      width: 23.3,
      height: 7.8,
      glowVariant: 'wood',
    },
    {
      id: 'peta_kota',
      label: 'Peta Kota',
      subtitle: 'Kembali ke Peta Dunia',
      left: 75.3,
      top: 65.2,
      width: 23.3,
      height: 8.0,
      glowVariant: 'blue',
    },
    {
      id: 'npc_cikgu_salmah',
      label: 'Berbual dengan Cikgu Salmah',
      subtitle: 'Guru Pembimbing Bahasa',
      left: 59.0,
      top: 40.5,
      width: 13.5,
      height: 32.0,
      glowVariant: 'purple',
      isSceneElement: true,
    },
    {
      id: 'scene_papan_notis_kiri',
      label: 'Periksa Papan Notis Kayu',
      subtitle: 'Siasat Notis Taman',
      left: 0.8,
      top: 24.5,
      width: 15.0,
      height: 29.0,
      glowVariant: 'gold',
      isSceneElement: true,
    },
  ],

  // =========================================================================
  // 2. ISTANA KRISTAL KOTA
  // =========================================================================
  istana_luar: [
    {
      id: 'dewan_utama',
      label: 'Dewan Utama',
      subtitle: 'Singgahsana & Titah Diraja',
      left: 76.0,
      top: 33.5,
      width: 23.0,
      height: 7.5,
      glowVariant: 'gold',
    },
    {
      id: 'bilik_kristal',
      label: 'Bilik Kristal',
      subtitle: 'Galeri 30 Kristal Kata',
      left: 76.0,
      top: 43.1,
      width: 23.0,
      height: 7.5,
      glowVariant: 'blue',
    },
    {
      id: 'perpustakaan_diraja',
      label: 'Perpustakaan Diraja',
      subtitle: 'Arkib 15 Kata Majmuk Mantap',
      left: 76.0,
      top: 52.4,
      width: 23.0,
      height: 7.4,
      glowVariant: 'purple',
    },
    {
      id: 'bilik_peta',
      label: 'Bilik Peta',
      subtitle: 'Peta Strategi 8 Lokasi',
      left: 76.0,
      top: 61.0,
      width: 23.0,
      height: 7.8,
      glowVariant: 'wood',
    },
    {
      id: 'dewan_wira',
      label: 'Dewan Wira',
      subtitle: 'Anugerah & Lencana Wira',
      left: 76.0,
      top: 70.9,
      width: 23.0,
      height: 7.8,
      glowVariant: 'gold',
    },
    {
      id: 'npc_burung_hantu',
      label: 'Burung Hantu Bijak',
      subtitle: 'Penasihat Diraja',
      left: 8.5,
      top: 15.5,
      width: 15.0,
      height: 19.5,
      glowVariant: 'purple',
      isSceneElement: true,
    },
    {
      id: 'npc_penjaga_istana',
      label: 'Penjaga Istana',
      subtitle: 'Pengawal Pintu Diraja',
      left: 35.2,
      top: 49.5,
      width: 8.5,
      height: 16.0,
      glowVariant: 'blue',
      isSceneElement: true,
    },
  ],

  // =========================================================================
  // 3. PERPUSTAKAAN AJAIB
  // =========================================================================
  perpustakaan_ajaib: [
    {
      id: 'ejaan',
      label: 'Ejaan',
      subtitle: 'Kitab Ejaan Baku & Serapan',
      left: 75.2,
      top: 20.1,
      width: 23.3,
      height: 7.3,
      glowVariant: 'gold',
    },
    {
      id: 'imbuhan',
      label: 'Imbuhan',
      subtitle: 'Kitab Awalan, Akhiran & Apitan',
      left: 75.2,
      top: 28.4,
      width: 23.3,
      height: 7.3,
      glowVariant: 'blue',
    },
    {
      id: 'kata_majmuk',
      label: 'Kata Majmuk',
      subtitle: 'Bentuk Terpisah & 15 Kata Mantap',
      left: 75.2,
      top: 36.9,
      width: 23.3,
      height: 7.2,
      glowVariant: 'wood',
    },
    {
      id: 'kata_ganda',
      label: 'Kata Ganda',
      subtitle: 'Kata Ganda & Tanda Sempang',
      left: 75.2,
      top: 45.4,
      width: 23.3,
      height: 7.3,
      glowVariant: 'purple',
    },
    {
      id: 'struktur_ayat',
      label: 'Struktur Ayat',
      subtitle: 'Subjek, Predikat & Klausa',
      left: 75.2,
      top: 54.1,
      width: 23.3,
      height: 7.2,
      glowVariant: 'blue',
    },
    {
      id: 'laras_bahasa',
      label: 'Laras Bahasa',
      subtitle: 'Kesantunan, Kata Sendi & Ayat Perintah',
      left: 75.2,
      top: 62.6,
      width: 23.3,
      height: 7.3,
      glowVariant: 'gold',
    },
    {
      id: 'npc_pustakawan_ajaib',
      label: 'Pustakawan Ajaib',
      subtitle: 'Penjaga Ilmu Perpustakaan',
      left: 60.5,
      top: 47.0,
      width: 14.0,
      height: 28.5,
      glowVariant: 'purple',
      isSceneElement: true,
    },
  ],

  // =========================================================================
  // 4. HUTAN MISTERI PERKATAAN
  // =========================================================================
  hutan_misteri: [
    {
      id: 'terokai_hutan',
      label: 'Terokai Hutan',
      subtitle: 'Ekspedisi Rimba & Mod RPG 2D',
      left: 77.2,
      top: 29.4,
      width: 21.4,
      height: 9.8,
      glowVariant: 'gold',
    },
    {
      id: 'cari_petunjuk',
      label: 'Cari Petunjuk',
      subtitle: 'Kitab Rahsia Rimba & Petunjuk',
      left: 77.2,
      top: 41.4,
      width: 21.4,
      height: 9.9,
      glowVariant: 'blue',
    },
    {
      id: 'cabaran_perkataan',
      label: 'Cabaran Perkataan',
      subtitle: 'Ujian Klasifikasi Golongan Kata',
      left: 77.2,
      top: 53.3,
      width: 21.4,
      height: 9.9,
      glowVariant: 'purple',
    },
    {
      id: 'kuiz_mini',
      label: 'Kuiz Mini',
      subtitle: 'Latihan Pantas Rimba Bahasa',
      left: 77.2,
      top: 65.3,
      width: 21.4,
      height: 9.8,
      glowVariant: 'wood',
    },
    {
      id: 'npc_peri_perkataan',
      label: 'Peri Perkataan',
      subtitle: 'Penjaga Rimba Bahasa',
      left: 47.0,
      top: 36.5,
      width: 12.0,
      height: 22.5,
      glowVariant: 'purple',
      isSceneElement: true,
    },
  ],

  // =========================================================================
  // 5. KAMPUNG TATABAHASA
  // =========================================================================
  kampung_tatabahasa: [
    {
      id: 'rumah_ilmu',
      label: 'Rumah Ilmu',
      subtitle: 'Kitab Desa & Rumus ATM',
      left: 75.5,
      top: 22.2,
      width: 23.2,
      height: 9.9,
      glowVariant: 'gold',
    },
    {
      id: 'tokoh_bahasa',
      label: 'Tokoh Bahasa',
      subtitle: 'Pesan Ketua Kampung & Ilmuwan',
      left: 75.5,
      top: 34.4,
      width: 23.2,
      height: 9.9,
      glowVariant: 'purple',
    },
    {
      id: 'papan_tanda',
      label: 'Papan Tanda',
      subtitle: 'Semakan Ejaan Papan Tanda Desa',
      left: 75.5,
      top: 46.8,
      width: 23.2,
      height: 9.9,
      glowVariant: 'wood',
    },
    {
      id: 'amalan_bahasa',
      label: 'Amalan Bahasa',
      subtitle: 'Kesantunan & Sapaan Harian',
      left: 75.5,
      top: 58.9,
      width: 23.2,
      height: 9.9,
      glowVariant: 'blue',
    },
    {
      id: 'aktiviti_interaktif',
      label: 'Aktiviti Interaktif',
      subtitle: 'Padanan Ayat Baku Kampung',
      left: 75.5,
      top: 70.8,
      width: 23.2,
      height: 9.7,
      glowVariant: 'gold',
    },
    {
      id: 'npc_ketua_kampung',
      label: 'Ketua Kampung',
      subtitle: 'Pemimpin Kampung Tatabahasa',
      left: 39.5,
      top: 47.0,
      width: 13.0,
      height: 34.0,
      glowVariant: 'gold',
      isSceneElement: true,
    },
  ],

  // =========================================================================
  // 6. PASAR PERKATAAN (Misi 2: Soalan 11–16)
  // =========================================================================
  pasar_perkataan: [
    {
      id: 'notis_pasar',
      label: 'Notis Pasar',
      subtitle: 'Siasat Notis Troli & Tabung (S11 & S16)',
      left: 75.5,
      top: 24.0,
      width: 23.2,
      height: 9.8,
      glowVariant: 'blue',
    },
    {
      id: 'surat_khabar',
      label: 'Surat Khabar',
      subtitle: 'Siasat Buku & Risalah Kedai (S12)',
      left: 75.5,
      top: 35.8,
      width: 23.2,
      height: 9.9,
      glowVariant: 'wood',
    },
    {
      id: 'menu_makanan',
      label: 'Menu Makanan',
      subtitle: 'Siasat Menu Gerai Makanan (S14 & S15)',
      left: 75.5,
      top: 47.8,
      width: 23.2,
      height: 10.2,
      glowVariant: 'gold',
    },
    {
      id: 'papan_iklan',
      label: 'Papan Iklan',
      subtitle: 'Siasat Papan Tanda Pasar (S13)',
      left: 75.5,
      top: 59.7,
      width: 23.2,
      height: 10.2,
      glowVariant: 'purple',
    },
    {
      id: 'cabar_kesalahan',
      label: 'Cabar Kesalahan',
      subtitle: 'Senarai Penuh Misi 2 Pasar (S11–S16)',
      left: 75.5,
      top: 71.5,
      width: 23.2,
      height: 10.3,
      glowVariant: 'gold',
    },
    {
      id: 'npc_pak_cik_rahman',
      label: 'Pak Cik Rahman',
      subtitle: 'Wakil Peniaga Pasar Perkataan',
      left: 59.5,
      top: 41.5,
      width: 15.0,
      height: 24.5,
      glowVariant: 'gold',
      isSceneElement: true,
    },
  ],

  // =========================================================================
  // 7. MENARA MEDIA (Misi 2: Soalan 17–20)
  // =========================================================================
  menara_media: [
    {
      id: 'bilik_berita',
      label: 'Bilik Berita',
      subtitle: 'Siasat Poster Siaran Ilmu (Soalan 17)',
      left: 76.0,
      top: 27.1,
      width: 22.8,
      height: 8.2,
      glowVariant: 'blue',
    },
    {
      id: 'studio_rakaman',
      label: 'Studio Rakaman',
      subtitle: 'Siasat Teks Ucapan Siaran (Soalan 18)',
      left: 76.0,
      top: 37.1,
      width: 22.8,
      height: 8.8,
      glowVariant: 'purple',
    },
    {
      id: 'surat_khabar_digital',
      label: 'Surat Khabar Digital',
      subtitle: 'Siasat Berita Kampus (Soalan 20)',
      left: 76.0,
      top: 47.5,
      width: 22.8,
      height: 9.3,
      glowVariant: 'wood',
    },
    {
      id: 'bahan_media',
      label: 'Bahan Media',
      subtitle: 'Siasat Poster Kempen (Soalan 19) & Nota',
      left: 76.0,
      top: 58.5,
      width: 22.8,
      height: 8.9,
      glowVariant: 'blue',
    },
    {
      id: 'cabaran_media_bahasa',
      label: 'Cabaran Media Bahasa',
      subtitle: 'Senarai Penuh Misi 2 Media (S17–S20)',
      left: 76.0,
      top: 68.9,
      width: 22.8,
      height: 9.3,
      glowVariant: 'gold',
    },
    {
      id: 'npc_wartawan_bahasa',
      label: 'Wartawan Bahasa',
      subtitle: 'Ketua Penyunting Menara Media',
      left: 60.5,
      top: 53.0,
      width: 10.5,
      height: 17.5,
      glowVariant: 'blue',
      isSceneElement: true,
    },
  ],

  // =========================================================================
  // 8. BENTENG WIRA BAHASA (Misi 3: Soalan 21–30 & Kemenangan)
  // =========================================================================
  benteng_wira: [
    {
      id: 'cabaran_akhir',
      label: 'Cabaran Akhir',
      subtitle: 'Senarai Misi 3: Wira Tatabahasa (S21–S30)',
      left: 76.5,
      top: 39.1,
      width: 22.5,
      height: 8.0,
      glowVariant: 'gold',
    },
    {
      id: 'uji_kemahiran',
      label: 'Uji Kemahiran',
      subtitle: 'Teruskan Soalan Misi 3 Seterusnya',
      left: 76.5,
      top: 48.2,
      width: 22.5,
      height: 8.2,
      glowVariant: 'blue',
    },
    {
      id: 'kumpul_kristal_kata',
      label: 'Kumpul Kristal Kata',
      subtitle: 'Semak Status 30 Kristal Kata',
      left: 76.5,
      top: 57.6,
      width: 22.5,
      height: 8.1,
      glowVariant: 'purple',
    },
    {
      id: 'sah_wira_bahasa',
      label: 'Sah Wira Bahasa',
      subtitle: 'Pengiktirafan Profesor Bahasa',
      left: 76.5,
      top: 67.2,
      width: 22.5,
      height: 7.9,
      glowVariant: 'gold',
    },
    {
      id: 'pulihkan_kota_tatabahasa',
      label: 'Pulihkan Kota Tatabahasa',
      subtitle: 'Aktifkan Gerbang 30 Kristal Kata',
      left: 76.5,
      top: 76.6,
      width: 22.5,
      height: 8.8,
      glowVariant: 'gold',
    },
    {
      id: 'npc_profesor_bahasa',
      label: 'Profesor Bahasa',
      subtitle: 'Penjaga Benteng Wira Bahasa',
      left: 60.0,
      top: 51.5,
      width: 16.0,
      height: 41.0,
      glowVariant: 'purple',
      isSceneElement: true,
    },
  ],
};

export type StoredHotspotOverrides = Partial<
  Record<HotspotScopeId, Record<string, Pick<HotspotRect, 'left' | 'top' | 'width' | 'height'>>>
>;

function clampPct(val: number, min = 0, max = 100): number {
  return Math.round(Math.max(min, Math.min(max, val)) * 10) / 10;
}

export function loadHotspotOverrides(): StoredHotspotOverrides {
  try {
    const raw = localStorage.getItem(HOTSPOT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredHotspotOverrides;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveHotspotOverridesForScope(
  scope: HotspotScopeId,
  rects: HotspotRect[]
): StoredHotspotOverrides {
  const current = loadHotspotOverrides();
  const scopeMap: Record<
    string,
    Pick<HotspotRect, 'left' | 'top' | 'width' | 'height'>
  > = {};

  for (const r of rects) {
    const width = clampPct(r.width, 2, 98);
    const height = clampPct(r.height, 2, 98);
    const left = clampPct(r.left, 0, 100 - width);
    const top = clampPct(r.top, 0, 100 - height);
    scopeMap[r.id] = { left, top, width, height };
  }

  const updated: StoredHotspotOverrides = {
    ...current,
    [scope]: scopeMap,
  };

  try {
    localStorage.setItem(HOTSPOT_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota errors
  }

  return updated;
}

export function resetHotspotOverridesForScope(
  scope: HotspotScopeId
): StoredHotspotOverrides {
  const current = loadHotspotOverrides();
  const updated: StoredHotspotOverrides = { ...current };
  delete updated[scope];
  try {
    localStorage.setItem(HOTSPOT_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore
  }
  return updated;
}

export function getResolvedHotspots(
  scope: HotspotScopeId,
  overrides: StoredHotspotOverrides
): HotspotRect[] {
  const defaults = DEFAULT_HOTSPOTS_BY_SCOPE[scope] ?? [];
  const scopeOverrides = overrides[scope];
  if (!scopeOverrides) return defaults;

  return defaults.map((item) => {
    const ov = scopeOverrides[item.id];
    if (!ov) return item;
    return {
      ...item,
      left: ov.left,
      top: ov.top,
      width: ov.width,
      height: ov.height,
    };
  });
}
