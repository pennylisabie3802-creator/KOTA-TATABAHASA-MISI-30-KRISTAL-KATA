import {
  CastleRoomId,
  MapId,
  MapInteractiveProp,
  MapNpc,
  MapPortal,
  MapSign,
  RegionId,
} from '../types/game';
import { getQuestionsByMap, QUIZ_QUESTIONS } from '../data/questions';

export type MapVisualTheme =
  | 'sakura'
  | 'castle_courtyard'
  | 'palace_interior'
  | 'library_interior'
  | 'forest'
  | 'village'
  | 'market'
  | 'media'
  | 'fortress';

export interface BuildingLandmark {
  id: string;
  title: string;
  subtitle?: string;
  style:
    | 'castle'
    | 'detektif'
    | 'pasar'
    | 'akademi'
    | 'library'
    | 'media'
    | 'village_house'
    | 'pondok'
    | 'fortress_gate';
  tileX: number;
  tileY: number;
  widthTiles: number;
  heightTiles: number;
}

export interface CastleRoomZone {
  roomId: CastleRoomId;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WorldMapDefinition {
  id: MapId;
  parentRegion: RegionId;
  name: string;
  subtitle: string;
  theme: MapVisualTheme;
  cols: number;
  rows: number;
  spawnX: number;
  spawnY: number;
  buildings: BuildingLandmark[];
  npcs: MapNpc[];
  portals: MapPortal[];
  signs: MapSign[];
  props: MapInteractiveProp[];
  trees: { x: number; y: number; pink?: boolean; fruit?: boolean; giant?: boolean }[];
  lamps: { x: number; y: number; torch?: boolean }[];
  waterRects: { x: number; y: number; w: number; h: number; waterfall?: boolean; koi?: boolean }[];
  pathRects: { x: number; y: number; w: number; h: number; bridge?: boolean; dirt?: boolean; carpet?: boolean }[];
  hasFountain?: { x: number; y: number };
  mushrooms?: { x: number; y: number }[];
  floatingBooks?: { x: number; y: number }[];
  castleRooms?: CastleRoomZone[];
}

// Generate 30 Crystal Pedestal props for Bilik Kristal inside Istana Kristal Kata!
const BILIK_KRISTAL_PROPS: MapInteractiveProp[] = Array.from({ length: 30 }, (_, idx) => {
  const qNum = idx + 1;
  // 3 rows of 10 crystal pedestals in the Northern Crystal Hall (x: 10..19, y: 2..4)
  const colOffset = idx % 10;
  const rowOffset = Math.floor(idx / 10);
  return {
    id: `ruang_kristal_${qNum}`,
    kind: 'crystal_slot',
    label: `Periksa Ruang Kristal #${qNum}`,
    tileX: 10 + colOffset,
    tileY: 2 + rowOffset,
    crystalQuestionId: qNum,
  };
});

export const WORLD_MAPS: Record<MapId, WorldMapDefinition> = {
  // ==============================================================
  // PETA 1: TAMAN SAKURA BAHASA (Permulaan & Misi 1: Soalan 1–10)
  // ==============================================================
  taman_sakura: {
    id: 'taman_sakura',
    parentRegion: 'taman_sakura',
    name: 'Taman Sakura Bahasa',
    subtitle: 'Taman Kristal & Misi 1: Detektif Bahasa (Soalan 1–10)',
    theme: 'sakura',
    cols: 32,
    rows: 20,
    spawnX: 15,
    spawnY: 11,
    hasFountain: { x: 14, y: 8 },
    waterRects: [
      // Kolam ikan koi di bahagian selatan dengan jambatan batu
      { x: 9, y: 15, w: 13, h: 3, koi: true },
    ],
    pathRects: [
      { x: 4, y: 5, w: 25, h: 9 },
      { x: 14, y: 1, w: 3, h: 5 },
      { x: 14, y: 14, w: 3, h: 5, bridge: true },
    ],
    buildings: [
      {
        id: 'pondok_sakura',
        title: 'Pondok Kecil Sakura',
        style: 'pondok',
        tileX: 25,
        tileY: 1,
        widthTiles: 4,
        heightTiles: 3,
      },
    ],
    npcs: [
      {
        id: 'cikgu_salmah',
        mainNpcKey: 'cikgu_salmah',
        name: 'Cikgu Salmah',
        role: 'Pembimbing Misi 1',
        spriteKind: 'cikgu_salmah',
        tileX: 12,
        tileY: 9,
        isMentor: true,
      },
      {
        id: 'detektif_muda',
        name: 'Detektif Muda Amir',
        role: 'Pelatih Siasatan',
        spriteKind: 'detektif_muda',
        tileX: 8,
        tileY: 8,
      },
    ],
    portals: [
      {
        id: 'sakura_ke_istana',
        label: 'Laluan Utara: Ke Istana Kristal Kata',
        tileX: 14,
        tileY: 0,
        widthTiles: 3,
        heightTiles: 1,
        targetMap: 'istana_luar',
        targetX: 15,
        targetY: 17,
      },
      {
        id: 'sakura_ke_kampung',
        label: 'Laluan Timur: Ke Kampung Tatabahasa',
        tileX: 31,
        tileY: 9,
        widthTiles: 1,
        heightTiles: 2,
        targetMap: 'kampung_tatabahasa',
        targetX: 2,
        targetY: 10,
      },
      {
        id: 'sakura_ke_hutan',
        label: 'Laluan Selatan: Ke Hutan Misteri Perkataan',
        tileX: 14,
        tileY: 19,
        widthTiles: 3,
        heightTiles: 1,
        targetMap: 'hutan_misteri',
        targetX: 14,
        targetY: 2,
      },
    ],
    signs: [
      {
        id: 'papan_arah_sakura',
        title: 'Papan Arah Taman Sakura Bahasa',
        lines: ['Pilih destinasi pengembaraan anda seterusnya!'],
        tileX: 17,
        tileY: 11,
        isTravelSignpost: true,
      },
    ],
    props: [
      {
        id: 'pancut_sakura_info',
        kind: 'fountain_info',
        label: 'Periksa Air Pancut Kristal',
        tileX: 16,
        tileY: 9,
      },
      {
        id: 'bangku_sakura_1',
        kind: 'bench_note',
        label: 'Duduk & Baca Nota Bangku Taman',
        tileX: 11,
        tileY: 7,
        title: 'Bangku Renungan Bahasa',
        lines: [
          'Tahukah kamu? Kata perintah seperti "Sila", "Tolong", dan "Jangan" menjadikan arahan awam lebih jelas dan bersopan!',
          'Cuba perhatikan papan-papan notis di sekitar Taman Sakura Bahasa ini.',
        ],
      },
      {
        id: 'buku_bangku_sakura',
        kind: 'learning_book',
        label: 'Buka Buku Tatabahasa di Bangku',
        tileX: 18,
        tileY: 7,
      },
      {
        id: 'papan_peta_sakura',
        kind: 'world_map_board',
        label: 'Lihat Papan Peta Dunia',
        tileX: 13,
        tileY: 11,
      },
      {
        id: 'hidden_book_1',
        kind: 'hidden_magic_book',
        label: 'Ambil Kitab Rahsia Sakura!',
        tileX: 29,
        tileY: 3,
        hiddenBookId: 'buku_sakura',
      },
    ],
    trees: [
      { x: 2, y: 2, pink: true },
      { x: 6, y: 2, pink: true },
      { x: 10, y: 2, pink: true },
      { x: 20, y: 2, pink: true },
      { x: 2, y: 8, pink: true },
      { x: 2, y: 14, pink: true },
      { x: 29, y: 8, pink: true },
      { x: 29, y: 15, pink: true },
      { x: 6, y: 16, pink: true },
      { x: 24, y: 16, pink: true },
    ],
    lamps: [
      { x: 12, y: 6 },
      { x: 18, y: 6 },
      { x: 12, y: 13 },
      { x: 18, y: 13 },
    ],
  },

  // ==============================================================
  // PETA 2A: ISTANA KRISTAL KATA (BAHAGIAN LUAR)
  // ==============================================================
  istana_luar: {
    id: 'istana_luar',
    parentRegion: 'istana_luar',
    name: 'Istana Kristal Kata',
    subtitle: 'Perkarangan Diraja & Pintu Gerbang Emas',
    theme: 'castle_courtyard',
    cols: 30,
    rows: 20,
    spawnX: 15,
    spawnY: 15,
    hasFountain: { x: 14, y: 11 },
    waterRects: [
      { x: 1, y: 1, w: 4, h: 6, waterfall: true },
      { x: 25, y: 1, w: 4, h: 6, waterfall: true },
    ],
    pathRects: [
      { x: 10, y: 8, w: 10, h: 11 },
      { x: 5, y: 12, w: 20, h: 3 },
    ],
    buildings: [
      {
        id: 'istana_kristal_utama',
        title: 'Istana Kristal Kata',
        subtitle: 'Masuk Pintu Emas untuk ke Dewan Utama & Bilik 30 Kristal',
        style: 'castle',
        tileX: 10,
        tileY: 1,
        widthTiles: 10,
        heightTiles: 7,
      },
    ],
    npcs: [
      {
        id: 'pengawal_istana',
        name: 'Pengawal Gerbang Zaki',
        role: 'Pengawal Diraja Istana',
        spriteKind: 'pengawal_istana',
        tileX: 12,
        tileY: 9,
      },
    ],
    portals: [
      {
        id: 'masuk_istana_dalam',
        label: 'Masuk ke Bahagian Dalam Istana Kristal Kata',
        tileX: 14,
        tileY: 8,
        widthTiles: 2,
        heightTiles: 1,
        targetMap: 'istana_dalam',
        targetX: 14,
        targetY: 16,
      },
      {
        id: 'istana_ke_sakura',
        label: 'Laluan Selatan: Ke Taman Sakura Bahasa',
        tileX: 14,
        tileY: 19,
        widthTiles: 3,
        heightTiles: 1,
        targetMap: 'taman_sakura',
        targetX: 15,
        targetY: 2,
      },
      {
        id: 'istana_ke_perpustakaan',
        label: 'Laluan Barat: Ke Perpustakaan Ajaib',
        tileX: 0,
        tileY: 12,
        widthTiles: 1,
        heightTiles: 2,
        targetMap: 'perpustakaan_ajaib',
        targetX: 14,
        targetY: 16,
      },
      {
        id: 'istana_ke_menara',
        label: 'Laluan Timur: Ke Menara Media',
        tileX: 29,
        tileY: 12,
        widthTiles: 1,
        heightTiles: 2,
        targetMap: 'menara_media',
        targetX: 2,
        targetY: 12,
      },
    ],
    signs: [
      {
        id: 'papan_arah_istana',
        title: 'Papan Arah Perkarangan Istana',
        lines: ['Pilih destinasi pengembaraan anda!'],
        tileX: 18,
        tileY: 14,
        isTravelSignpost: true,
      },
    ],
    props: [
      {
        id: 'patung_kristal_barat',
        kind: 'fountain_info',
        label: 'Periksa Patung Kristal Diraja',
        tileX: 10,
        tileY: 9,
      },
      {
        id: 'hidden_book_2',
        kind: 'hidden_magic_book',
        label: 'Ambil Kitab Rahsia Diraja!',
        tileX: 6,
        tileY: 9,
        hiddenBookId: 'buku_istana',
      },
    ],
    trees: [
      { x: 6, y: 4, pink: true },
      { x: 23, y: 4, pink: true },
      { x: 4, y: 16, pink: true },
      { x: 25, y: 16, pink: true },
    ],
    lamps: [
      { x: 11, y: 10 },
      { x: 18, y: 10 },
      { x: 11, y: 16 },
      { x: 18, y: 16 },
    ],
  },

  // ==============================================================
  // PETA 2B: BAHAGIAN DALAM ISTANA KRISTAL KATA (5 BILIK DIRAJA!)
  // ==============================================================
  istana_dalam: {
    id: 'istana_dalam',
    parentRegion: 'istana_luar',
    name: 'Dalam Istana Kristal Kata',
    subtitle: 'Dewan Utama · Bilik 30 Kristal · Perpustakaan Diraja · Bilik Peta · Dewan Wira',
    theme: 'palace_interior',
    cols: 30,
    rows: 19,
    spawnX: 14,
    spawnY: 16,
    waterRects: [],
    pathRects: [
      // Permaidani merah diraja di Dewan Utama menuju tangga Bilik Kristal
      { x: 13, y: 5, w: 4, h: 13, carpet: true },
      { x: 4, y: 11, w: 22, h: 2, carpet: true },
    ],
    castleRooms: [
      { roomId: 'dewan_utama', name: 'Dewan Utama Istana', x: 10, y: 8, w: 10, h: 10 },
      { roomId: 'bilik_kristal', name: 'Bilik 30 Kristal Kata', x: 8, y: 1, w: 14, h: 6 },
      { roomId: 'bilik_peta', name: 'Bilik Peta Diraja', x: 1, y: 1, w: 7, h: 7 },
      { roomId: 'perpustakaan_diraja', name: 'Perpustakaan Diraja', x: 1, y: 9, w: 8, h: 8 },
      { roomId: 'dewan_wira', name: 'Dewan Wira Bahasa', x: 21, y: 2, w: 8, h: 15 },
    ],
    buildings: [],
    npcs: [
      {
        id: 'penjaga_istana',
        mainNpcKey: 'penjaga_istana',
        name: 'Penjaga Istana Diraja',
        role: 'Penjaga Bilik 30 Kristal',
        spriteKind: 'pengawal_istana',
        tileX: 12,
        tileY: 10,
        isMentor: true,
      },
    ],
    portals: [
      {
        id: 'keluar_istana_dalam',
        label: 'Keluar ke Perkarangan Luar Istana',
        tileX: 13,
        tileY: 18,
        widthTiles: 4,
        heightTiles: 1,
        targetMap: 'istana_luar',
        targetX: 15,
        targetY: 9,
      },
    ],
    signs: [
      {
        id: 'plak_dewan_wira',
        title: 'Dewan Wira Kota Tatabahasa',
        lines: [
          'Dewan ini menghormati para pengembara yang menguasai 30 Kristal Kata serta mengumpul kesemua Lencana Penerokaan!',
          'Lawati kesemua 5 ruang di dalam istana ini untuk memperoleh Lencana Peneroka Istana.',
        ],
        tileX: 25,
        tileY: 8,
      },
    ],
    props: [
      ...BILIK_KRISTAL_PROPS,
      {
        id: 'meja_bilik_peta',
        kind: 'world_map_board',
        label: 'Buka Meja Peta Diraja (Bilik Peta)',
        tileX: 4,
        tileY: 4,
      },
      {
        id: 'kitab_perpustakaan_diraja',
        kind: 'learning_book',
        label: 'Baca Kitab Perpustakaan Diraja',
        tileX: 4,
        tileY: 13,
      },
      {
        id: 'kristal_utama_istana',
        kind: 'fountain_info',
        label: 'Periksa Kristal Utama Kota Tatabahasa',
        tileX: 14,
        tileY: 1,
      },
    ],
    trees: [],
    lamps: [
      { x: 10, y: 7, torch: true },
      { x: 19, y: 7, torch: true },
      { x: 10, y: 14, torch: true },
      { x: 19, y: 14, torch: true },
      { x: 2, y: 2, torch: true },
      { x: 27, y: 4, torch: true },
    ],
  },

  // ==============================================================
  // PETA 3: PERPUSTAKAAN AJAIB (7 Rak Buku Kategori Interaktif)
  // ==============================================================
  perpustakaan_ajaib: {
    id: 'perpustakaan_ajaib',
    parentRegion: 'perpustakaan_ajaib',
    name: 'Perpustakaan Ajaib',
    subtitle: 'Menara 7 Kategori Ilmu Bahasa & Buku Terapung',
    theme: 'library_interior',
    cols: 28,
    rows: 18,
    spawnX: 14,
    spawnY: 15,
    waterRects: [],
    pathRects: [
      { x: 4, y: 4, w: 20, h: 12, carpet: true },
    ],
    floatingBooks: [
      { x: 9, y: 8 },
      { x: 18, y: 8 },
      { x: 14, y: 6 },
    ],
    buildings: [],
    npcs: [
      {
        id: 'pustakawan_ajaib',
        mainNpcKey: 'pustakawan_ajaib',
        name: 'Pustakawan Ajaib',
        role: 'Penjaga Ilmu Bahasa Melayu',
        spriteKind: 'owl',
        tileX: 14,
        tileY: 10,
        isMentor: true,
      },
    ],
    portals: [
      {
        id: 'keluar_perpustakaan',
        label: 'Keluar ke Istana Kristal Kata / Peta Dunia',
        tileX: 13,
        tileY: 17,
        widthTiles: 2,
        heightTiles: 1,
        targetMap: 'istana_luar',
        targetX: 2,
        targetY: 12,
      },
    ],
    signs: [
      {
        id: 'papan_arah_perpustakaan',
        title: 'Portal Pengembaraan Perpustakaan',
        lines: ['Pilih lokasi pengembaraan lain!'],
        tileX: 16,
        tileY: 15,
        isTravelSignpost: true,
      },
    ],
    props: [
      {
        id: 'rak_ejaan',
        kind: 'library_shelf',
        label: 'Rak Buku 1: Kategori Ejaan',
        tileX: 5,
        tileY: 4,
        libraryCategory: 'ejaan',
      },
      {
        id: 'rak_sendi',
        kind: 'library_shelf',
        label: 'Rak Buku 2: Kategori Kata Sendi Nama',
        tileX: 9,
        tileY: 4,
        libraryCategory: 'kata_sendi_nama',
      },
      {
        id: 'rak_imbuhan',
        kind: 'library_shelf',
        label: 'Rak Buku 3: Kategori Imbuhan',
        tileX: 13,
        tileY: 4,
        libraryCategory: 'imbuhan',
      },
      {
        id: 'rak_majmuk',
        kind: 'library_shelf',
        label: 'Rak Buku 4: Kategori Kata Majmuk',
        tileX: 17,
        tileY: 4,
        libraryCategory: 'kata_majmuk',
      },
      {
        id: 'rak_ganda',
        kind: 'library_shelf',
        label: 'Rak Buku 5: Kategori Kata Ganda',
        tileX: 21,
        tileY: 4,
        libraryCategory: 'kata_ganda',
      },
      {
        id: 'rak_perintah',
        kind: 'library_shelf',
        label: 'Rak Buku 6: Kategori Ayat Perintah',
        tileX: 6,
        tileY: 11,
        libraryCategory: 'ayat_perintah',
      },
      {
        id: 'rak_struktur',
        kind: 'library_shelf',
        label: 'Rak Buku 7: Kategori Struktur Ayat',
        tileX: 21,
        tileY: 11,
        libraryCategory: 'struktur_ayat',
      },
      {
        id: 'hidden_book_5',
        kind: 'hidden_magic_book',
        label: 'Ambil Kitab Rahsia Menara Ilmu!',
        tileX: 24,
        tileY: 3,
        hiddenBookId: 'buku_perpustakaan',
      },
    ],
    trees: [],
    lamps: [
      { x: 4, y: 7 },
      { x: 23, y: 7 },
      { x: 11, y: 14 },
      { x: 17, y: 14 },
    ],
  },

  // ==============================================================
  // PETA 4: HUTAN MISTERI PERKATAAN (Laluan Berliku & Golongan Kata)
  // ==============================================================
  hutan_misteri: {
    id: 'hutan_misteri',
    parentRegion: 'hutan_misteri',
    name: 'Hutan Misteri Perkataan',
    subtitle: 'Rimba Cendawan Bercahaya & Rahsia Golongan Kata',
    theme: 'forest',
    cols: 30,
    rows: 19,
    spawnX: 14,
    spawnY: 3,
    waterRects: [
      // Sungai hutan membelah tengah dengan jambatan kayu
      { x: 14, y: 6, w: 3, h: 12 },
    ],
    pathRects: [
      { x: 4, y: 3, w: 10, h: 3, dirt: true },
      { x: 4, y: 6, w: 4, h: 9, dirt: true },
      { x: 8, y: 11, w: 15, h: 3, bridge: true },
      { x: 20, y: 5, w: 6, h: 10, dirt: true },
    ],
    mushrooms: [
      { x: 3, y: 8 },
      { x: 9, y: 7 },
      { x: 19, y: 15 },
      { x: 26, y: 9 },
      { x: 12, y: 16 },
    ],
    buildings: [
      {
        id: 'pondok_misteri',
        title: 'Pondok Bahasa',
        subtitle: 'Tempat Rahsia Rimba',
        style: 'pondok',
        tileX: 21,
        tileY: 2,
        widthTiles: 5,
        heightTiles: 3,
      },
    ],
    npcs: [
      {
        id: 'peri_perkataan',
        mainNpcKey: 'peri_perkataan',
        name: 'Peri Perkataan',
        role: 'Penjaga Hutan Misteri',
        spriteKind: 'peri_perkataan',
        tileX: 10,
        tileY: 4,
        isMentor: true,
      },
    ],
    portals: [
      {
        id: 'hutan_ke_sakura',
        label: 'Laluan Utara: Kembali ke Taman Sakura Bahasa',
        tileX: 13,
        tileY: 0,
        widthTiles: 3,
        heightTiles: 1,
        targetMap: 'taman_sakura',
        targetX: 15,
        targetY: 17,
      },
      {
        id: 'hutan_ke_kampung',
        label: 'Laluan Timur: Ke Kampung Tatabahasa',
        tileX: 29,
        tileY: 11,
        widthTiles: 1,
        heightTiles: 2,
        targetMap: 'kampung_tatabahasa',
        targetX: 2,
        targetY: 14,
      },
    ],
    signs: [
      {
        id: 'papan_arah_hutan',
        title: 'Papan Arah Hutan Misteri',
        lines: ['Pilih laluan keluar hutan!'],
        tileX: 12,
        tileY: 4,
        isTravelSignpost: true,
      },
    ],
    props: [
      {
        id: 'batu_kata_nama',
        kind: 'word_class_stone',
        label: 'Periksa Batu Petunjuk 1: Kata Nama',
        tileX: 5,
        tileY: 7,
        title: 'Rahsia Golongan Kata 1: KATA NAMA',
        lines: [
          'Kata Nama menamakan orang, haiwan, benda, atau tempat!',
          'Contoh di hutan ini: pokok, sungai, jambatan, burung hantu, Istana Kristal.',
        ],
      },
      {
        id: 'batu_kata_kerja',
        kind: 'word_class_stone',
        label: 'Periksa Batu Petunjuk 2: Kata Kerja',
        tileX: 5,
        tileY: 13,
        title: 'Rahsia Golongan Kata 2: KATA KERJA',
        lines: [
          'Kata Kerja menunjukkan sesuatu perbuatan atau tindakan!',
          'Contoh: berjalan, membaca, menyiasat, membersihkan, mengeluarkan.',
        ],
      },
      {
        id: 'batu_kata_adjektif',
        kind: 'word_class_stone',
        label: 'Periksa Batu Petunjuk 3: Kata Adjektif',
        tileX: 21,
        tileY: 13,
        title: 'Rahsia Golongan Kata 3: KATA ADJEKTIF',
        lines: [
          'Kata Adjektif menerangkan sifat atau keadaan sesuatu kata nama!',
          'Contoh: jernih, tinggi, ceria, indah, dekat, pantas.',
        ],
      },
      {
        id: 'batu_kata_tugas',
        kind: 'word_class_stone',
        label: 'Periksa Batu Petunjuk 4: Kata Tugas',
        tileX: 24,
        tileY: 7,
        title: 'Rahsia Golongan Kata 4: KATA TUGAS',
        lines: [
          'Kata Tugas hadir dalam ayat untuk mendukung tugas sintaksis seperti kata sendi nama, kata hubung, dan kata perintah!',
          'Contoh: di, ke, dari, daripada, yang, sila, jangan, selepas.',
        ],
      },
      {
        id: 'hidden_book_3',
        kind: 'hidden_magic_book',
        label: 'Ambil Kitab Rahsia Rimba!',
        tileX: 26,
        tileY: 5,
        hiddenBookId: 'buku_hutan',
      },
    ],
    trees: [
      { x: 2, y: 2, giant: true },
      { x: 8, y: 2, giant: true },
      { x: 18, y: 2, giant: true },
      { x: 2, y: 11, giant: true },
      { x: 2, y: 16, giant: true },
      { x: 10, y: 15, giant: true },
      { x: 27, y: 3, giant: true },
      { x: 27, y: 15, giant: true },
    ],
    lamps: [],
  },

  // ==============================================================
  // PETA 5: KAMPUNG TATABAHASA (Kehidupan Harian Bahasa Baku)
  // ==============================================================
  kampung_tatabahasa: {
    id: 'kampung_tatabahasa',
    parentRegion: 'kampung_tatabahasa',
    name: 'Kampung Tatabahasa',
    subtitle: 'Desa Permai & Amalan Bahasa Seharian',
    theme: 'village',
    cols: 30,
    rows: 19,
    spawnX: 6,
    spawnY: 10,
    waterRects: [
      { x: 0, y: 16, w: 30, h: 3 },
    ],
    pathRects: [
      { x: 1, y: 9, w: 28, h: 3, dirt: true },
      { x: 13, y: 5, w: 4, h: 10, dirt: true },
    ],
    buildings: [
      {
        id: 'rumah_kampung_1',
        title: 'Rumah Desa Melur',
        style: 'village_house',
        tileX: 4,
        tileY: 3,
        widthTiles: 5,
        heightTiles: 4,
      },
      {
        id: 'kedai_kecil_kampung',
        title: 'Kedai Runcit Desa',
        style: 'pasar',
        tileX: 12,
        tileY: 1,
        widthTiles: 6,
        heightTiles: 4,
      },
      {
        id: 'pondok_bacaan_kampung',
        title: 'Pondok Bacaan',
        style: 'pondok',
        tileX: 22,
        tileY: 3,
        widthTiles: 5,
        heightTiles: 4,
      },
    ],
    npcs: [
      {
        id: 'ketua_kampung',
        mainNpcKey: 'ketua_kampung',
        name: 'Ketua Kampung Tok Wan',
        role: 'Ketua Kampung Tatabahasa',
        spriteKind: 'ketua_kampung',
        tileX: 11,
        tileY: 8,
        isMentor: true,
      },
      {
        id: 'peniaga_buku',
        name: 'Kak Siti',
        role: 'Penjaga Pondok Bacaan',
        spriteKind: 'peniaga_buku',
        tileX: 21,
        tileY: 8,
      },
    ],
    portals: [
      {
        id: 'kampung_ke_sakura',
        label: 'Laluan Barat: Ke Taman Sakura Bahasa',
        tileX: 0,
        tileY: 9,
        widthTiles: 1,
        heightTiles: 3,
        targetMap: 'taman_sakura',
        targetX: 29,
        targetY: 9,
      },
      {
        id: 'kampung_ke_pasar',
        label: 'Laluan Timur: Ke Pasar Perkataan',
        tileX: 29,
        tileY: 9,
        widthTiles: 1,
        heightTiles: 3,
        targetMap: 'pasar_perkataan',
        targetX: 2,
        targetY: 10,
      },
    ],
    signs: [
      {
        id: 'papan_arah_kampung',
        title: 'Papan Arah Kampung Tatabahasa',
        lines: ['Pilih destinasi perjalanan!'],
        tileX: 16,
        tileY: 8,
        isTravelSignpost: true,
      },
      {
        id: 'papan_kebun_kampung',
        title: 'Papan Tanda Kebun Buah Desa',
        lines: [
          'Contoh Bahasa Harian Tepat: "Sila buang sampah ke dalam tong yang disediakan."',
          'Perhatikan kata sendi "ke dalam" dieja terpisah kerana menunjukkan arah dan ruang!',
        ],
        tileX: 7,
        tileY: 13,
      },
    ],
    props: [
      {
        id: 'notis_kedai_kampung',
        kind: 'village_notice',
        label: 'Periksa Notis Kedai Runcit Desa',
        tileX: 15,
        tileY: 6,
        title: 'Senarai Barang Ejaan Baku Kedai Desa',
        lines: [
          '✓ Telur ayam kampung · ✓ Sos cili · ✓ Kuetiau segar · ✓ Biskut kraker',
          'Menggunakan ejaan baku pada tanda harga memudahkan semua pembeli!',
        ],
      },
      {
        id: 'buku_pondok_kampung',
        kind: 'learning_book',
        label: 'Buka Buku di Pondok Bacaan',
        tileX: 24,
        tileY: 8,
      },
      {
        id: 'hidden_book_4',
        kind: 'hidden_magic_book',
        label: 'Ambil Kitab Rahsia Desa!',
        tileX: 27,
        tileY: 5,
        hiddenBookId: 'buku_kampung',
      },
    ],
    trees: [
      { x: 2, y: 4, fruit: true },
      { x: 10, y: 4, fruit: true },
      { x: 19, y: 4, fruit: true },
      { x: 4, y: 14, fruit: true },
      { x: 24, y: 14, fruit: true },
    ],
    lamps: [
      { x: 9, y: 11 },
      { x: 20, y: 11 },
    ],
  },

  // ==============================================================
  // PETA 6: PASAR PERKATAAN (Misi 2 Bahagian 1: Soalan 11–16)
  // ==============================================================
  pasar_perkataan: {
    id: 'pasar_perkataan',
    parentRegion: 'pasar_perkataan',
    name: 'Pasar Perkataan',
    subtitle: 'Pasar Meriah & Misi 2: Pemburu Kesalahan (Soalan 11–16)',
    theme: 'market',
    cols: 30,
    rows: 19,
    spawnX: 14,
    spawnY: 15,
    waterRects: [],
    pathRects: [
      { x: 3, y: 5, w: 24, h: 11 },
      { x: 13, y: 0, w: 4, h: 6 },
    ],
    buildings: [
      {
        id: 'gerai_utama_pasar',
        title: 'Bazar & Kedai Runcit',
        style: 'pasar',
        tileX: 4,
        tileY: 1,
        widthTiles: 7,
        heightTiles: 4,
      },
      {
        id: 'gerai_makanan_pasar',
        title: 'Medan Selera Baku',
        style: 'pasar',
        tileX: 19,
        tileY: 1,
        widthTiles: 7,
        heightTiles: 4,
      },
    ],
    npcs: [
      {
        id: 'pak_cik_rahman',
        mainNpcKey: 'pak_cik_rahman',
        name: 'Pak Cik Rahman',
        role: 'Pembimbing Pasar Perkataan (Misi 2)',
        spriteKind: 'pak_cik_rahman',
        tileX: 12,
        tileY: 13,
        isMentor: true,
      },
      {
        id: 'peniaga_mi',
        name: 'Pak Cik Samad',
        role: 'Peniaga Hidangan Mi',
        spriteKind: 'peniaga_mi',
        tileX: 22,
        tileY: 8,
      },
    ],
    portals: [
      {
        id: 'pasar_ke_kampung',
        label: 'Laluan Barat: Ke Kampung Tatabahasa',
        tileX: 0,
        tileY: 10,
        widthTiles: 1,
        heightTiles: 2,
        targetMap: 'kampung_tatabahasa',
        targetX: 27,
        targetY: 10,
      },
      {
        id: 'pasar_ke_menara',
        label: 'Laluan Utara: Ke Menara Media (Soalan 17–20)',
        tileX: 13,
        tileY: 0,
        widthTiles: 4,
        heightTiles: 1,
        targetMap: 'menara_media',
        targetX: 14,
        targetY: 16,
      },
    ],
    signs: [
      {
        id: 'papan_arah_pasar',
        title: 'Papan Arah Pasar Perkataan',
        lines: ['Pilih destinasi perjalanan!'],
        tileX: 16,
        tileY: 13,
        isTravelSignpost: true,
      },
    ],
    props: [],
    trees: [
      { x: 2, y: 3, pink: true },
      { x: 27, y: 3, pink: true },
      { x: 2, y: 15, fruit: true },
      { x: 27, y: 15, fruit: true },
    ],
    lamps: [
      { x: 8, y: 10 },
      { x: 20, y: 10 },
    ],
  },

  // ==============================================================
  // PETA 7: MENARA MEDIA (Misi 2 Bahagian 2: Soalan 17–20)
  // ==============================================================
  menara_media: {
    id: 'menara_media',
    parentRegion: 'menara_media',
    name: 'Menara Media',
    subtitle: 'Pusat Akhbar, Jam Besar & Misi 2 (Soalan 17–20)',
    theme: 'media',
    cols: 28,
    rows: 18,
    spawnX: 14,
    spawnY: 15,
    waterRects: [],
    pathRects: [
      { x: 4, y: 6, w: 20, h: 10 },
    ],
    buildings: [
      {
        id: 'bangunan_menara_jam',
        title: 'Menara Media & Jam Besar',
        subtitle: 'Pusat Penyiaran Kota Tatabahasa',
        style: 'media',
        tileX: 10,
        tileY: 1,
        widthTiles: 8,
        heightTiles: 5,
      },
    ],
    npcs: [
      {
        id: 'wartawan_bahasa',
        mainNpcKey: 'wartawan_bahasa',
        name: 'Wartawan Bahasa',
        role: 'Pembimbing Menara Media (Misi 2)',
        spriteKind: 'encik_hakim',
        tileX: 12,
        tileY: 13,
        isMentor: true,
      },
      {
        id: 'editor_media',
        name: 'Editor Cik Wani',
        role: 'Penyunting Berita',
        spriteKind: 'editor_media',
        tileX: 19,
        tileY: 11,
      },
    ],
    portals: [
      {
        id: 'media_ke_pasar',
        label: 'Laluan Selatan: Kembali ke Pasar Perkataan',
        tileX: 13,
        tileY: 17,
        widthTiles: 2,
        heightTiles: 1,
        targetMap: 'pasar_perkataan',
        targetX: 14,
        targetY: 2,
      },
      {
        id: 'media_ke_istana',
        label: 'Laluan Barat: Ke Istana Kristal Kata',
        tileX: 0,
        tileY: 11,
        widthTiles: 1,
        heightTiles: 2,
        targetMap: 'istana_luar',
        targetX: 27,
        targetY: 12,
      },
    ],
    signs: [
      {
        id: 'papan_arah_media',
        title: 'Papan Arah Menara Media',
        lines: ['Pilih lokasi pengembaraan!'],
        tileX: 16,
        tileY: 13,
        isTravelSignpost: true,
      },
    ],
    props: [
      {
        id: 'mesin_cetak_media',
        kind: 'printing_press',
        label: 'Periksa Mesin Cetak Akhbar',
        tileX: 8,
        tileY: 11,
        title: 'Mesin Cetak Diraja Kota Tatabahasa',
        lines: [
          'Mesin cetak ini sedang mencetak ribuan naskhah Warta Kota Tatabahasa!',
          'Setiap tajuk berita wajib disemak agar bebas daripada bahasa basahan dan kesalahan kata sendi nama.',
        ],
      },
    ],
    trees: [
      { x: 2, y: 4, pink: false },
      { x: 25, y: 4, pink: false },
    ],
    lamps: [
      { x: 6, y: 13 },
      { x: 21, y: 13 },
    ],
  },

  // ==============================================================
  // PETA 8: BENTENG WIRA BAHASA (Misi 3 Akhir: Soalan 21–30)
  // ==============================================================
  benteng_wira: {
    id: 'benteng_wira',
    parentRegion: 'benteng_wira',
    name: 'Benteng Wira Bahasa',
    subtitle: 'Dewan Cabaran Akhir Misi 3 (Soalan 21–30) & Pintu Kristal Utama',
    theme: 'fortress',
    cols: 28,
    rows: 19,
    spawnX: 14,
    spawnY: 16,
    waterRects: [
      { x: 1, y: 2, w: 2, h: 14 },
      { x: 25, y: 2, w: 2, h: 14 },
    ],
    pathRects: [
      { x: 4, y: 4, w: 20, h: 13 },
      { x: 12, y: 2, w: 4, h: 16, carpet: true },
    ],
    buildings: [
      {
        id: 'gerbang_kristal_utama',
        title: 'Pintu Kristal Utama',
        subtitle: 'Terbuka Selepas 30 Kristal Kata Dikumpulkan',
        style: 'fortress_gate',
        tileX: 11,
        tileY: 0,
        widthTiles: 6,
        heightTiles: 3,
      },
    ],
    npcs: [
      {
        id: 'profesor_bahasa',
        mainNpcKey: 'profesor_bahasa',
        name: 'Profesor Bahasa',
        role: 'Pembimbing Cabaran Akhir Misi 3',
        spriteKind: 'profesor_bahasa',
        tileX: 11,
        tileY: 15,
        isMentor: true,
      },
    ],
    portals: [
      {
        id: 'pintu_kemenangan_kristal',
        label: 'Masuk Pintu Kristal Utama (Sambutan Kemenangan!)',
        tileX: 13,
        tileY: 3,
        widthTiles: 2,
        heightTiles: 1,
        targetMap: 'istana_dalam',
        targetX: 14,
        targetY: 8,
        isVictoryGate: true,
      },
      {
        id: 'benteng_keluar',
        label: 'Keluar ke Istana Kristal Kata',
        tileX: 13,
        tileY: 18,
        widthTiles: 2,
        heightTiles: 1,
        targetMap: 'istana_luar',
        targetX: 15,
        targetY: 15,
      },
    ],
    signs: [
      {
        id: 'papan_arah_benteng',
        title: 'Papan Arah Benteng Wira Bahasa',
        lines: ['Pilih destinasi perjalanan!'],
        tileX: 17,
        tileY: 15,
        isTravelSignpost: true,
      },
    ],
    props: [],
    trees: [],
    lamps: [
      { x: 8, y: 5, torch: true },
      { x: 19, y: 5, torch: true },
      { x: 8, y: 14, torch: true },
      { x: 19, y: 14, torch: true },
    ],
  },
};

export function getMapQuestObjects(mapId: MapId) {
  return getQuestionsByMap(mapId);
}

export interface DynamicTileCollisionOptions {
  /**
   * Live occupied tile keys (`packTileKey(map.cols, tx, ty)`) for dynamic entities such as
   * patrolling/moving NPCs. When provided, overrides static `map.npcs` tile coordinates.
   */
  dynamicOccupiedKeys?: ReadonlySet<number>;
  /**
   * Collected hidden magic books (`foundHiddenBooks`) whose tiles become walkable once picked up.
   */
  foundHiddenBooks?: Readonly<Record<string, boolean>>;
  /**
   * Optional temporary tile keys (`packTileKey(map.cols, tx, ty)`) penalized/blocked during
   * anti-stuck dynamic A* recovery.
   */
  avoidTileKeys?: ReadonlySet<number>;
}

export function packTileKey(cols: number, tx: number, ty: number): number {
  return ty * cols + tx;
}

/**
 * Checks only static map bounds, portals, bridges/rivers, buildings, fountains, and trees.
 */
export function isStaticTerrainOrStructureSolid(mapId: MapId, tx: number, ty: number): boolean {
  const map = WORLD_MAPS[mapId];
  if (!map) return true;

  const onPortal = map.portals.some(
    (p) =>
      tx >= p.tileX &&
      tx < p.tileX + p.widthTiles &&
      ty >= p.tileY &&
      ty < p.tileY + p.heightTiles
  );
  if (onPortal) return false;

  if (tx < 1 || ty < 1 || tx >= map.cols - 1 || ty >= map.rows - 1) {
    return true;
  }

  const onBridge = map.pathRects.some(
    (r) => r.bridge && tx >= r.x && tx < r.x + r.w && ty >= r.y && ty < r.y + r.h
  );

  if (!onBridge) {
    for (const w of map.waterRects) {
      if (tx >= w.x && tx < w.x + w.w && ty >= w.y && ty < w.y + w.h) {
        return true;
      }
    }
  }

  for (const b of map.buildings) {
    if (
      tx >= b.tileX &&
      tx < b.tileX + b.widthTiles &&
      ty >= b.tileY &&
      ty < b.tileY + b.heightTiles
    ) {
      return true;
    }
  }

  if (map.hasFountain) {
    if (
      tx >= map.hasFountain.x &&
      tx < map.hasFountain.x + 2 &&
      ty >= map.hasFountain.y &&
      ty < map.hasFountain.y + 2
    ) {
      return true;
    }
  }

  for (const t of map.trees) {
    if (tx === t.x && ty === t.y) return true;
  }

  return false;
}

export function isTileSolid(
  mapId: MapId,
  tx: number,
  ty: number,
  options?: DynamicTileCollisionOptions
): boolean {
  const map = WORLD_MAPS[mapId];
  if (!map) return true;

  if (tx < 0 || ty < 0 || tx >= map.cols || ty >= map.rows) {
    return true;
  }

  const key = packTileKey(map.cols, tx, ty);
  if (options?.avoidTileKeys?.has(key)) {
    return true;
  }

  if (isStaticTerrainOrStructureSolid(mapId, tx, ty)) {
    return true;
  }

  if (options?.dynamicOccupiedKeys) {
    if (options.dynamicOccupiedKeys.has(key)) return true;
  } else {
    for (const n of map.npcs) {
      if (tx === n.tileX && ty === n.tileY) return true;
    }
  }

  for (const s of map.signs) {
    if (tx === s.tileX && ty === s.tileY) return true;
  }

  for (const prop of map.props) {
    if (
      prop.kind === 'hidden_magic_book' &&
      prop.hiddenBookId &&
      options?.foundHiddenBooks?.[prop.hiddenBookId]
    ) {
      continue;
    }
    // Crystal slots in Bilik Kristal & active environmental props are solid floor objects
    if (tx === prop.tileX && ty === prop.tileY) return true;
  }

  const qObjs = getMapQuestObjects(mapId);
  for (const q of qObjs) {
    if (tx === q.tileX && ty === q.tileY) return true;
  }

  return false;
}

export function getNextGlobalQuestionId(completedIds: Record<number, unknown>): number | null {
  for (const q of QUIZ_QUESTIONS) {
    if (!completedIds[q.id]) return q.id;
  }
  return null;
}
