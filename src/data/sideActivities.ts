import {
  CastleRoomId,
  ExplorationBadgeId,
  LibraryCategoryId,
  RegionId,
} from '../types/game';

export interface HiddenBookInfo {
  id: string;
  title: string;
  regionId: RegionId;
  locationHint: string;
  wisdomTitle: string;
  wisdomText: string;
}

export const HIDDEN_MAGIC_BOOKS: HiddenBookInfo[] = [
  {
    id: 'buku_sakura',
    title: 'Kitab Rahsia Sakura #1',
    regionId: 'taman_sakura',
    locationHint: 'Tersembunyi berhampiran Pondok Kecil di Taman Sakura Bahasa.',
    wisdomTitle: 'Mutiara Bahasa: Kesantunan Berbahasa',
    wisdomText:
      'Dalam bahasa Melayu, pemilihan kata sapaan dan kata perintah yang tepat mencerminkan budi bahasa yang tinggi.',
  },
  {
    id: 'buku_istana',
    title: 'Kitab Rahsia Diraja #2',
    regionId: 'istana_luar',
    locationHint: 'Tersembunyi di taman bunga perkarangan Istana Kristal Kata.',
    wisdomTitle: 'Mutiara Bahasa: 15 Kata Majmuk Mantap',
    wisdomText:
      'Ingat kata kunci popular seperti "kerjasama", "tanggungjawab", "jawatankuasa", "kakitangan", dan "antarabangsa" yang ditulis bercantum rapat!',
  },
  {
    id: 'buku_hutan',
    title: 'Kitab Rahsia Rimba #3',
    regionId: 'hutan_misteri',
    locationHint: 'Tersembunyi di tepi Pondok Misteri dalam Hutan Misteri Perkataan.',
    wisdomTitle: 'Mutiara Bahasa: Empat Golongan Kata Utama',
    wisdomText:
      'Perkataan bahasa Melayu terbahagi kepada empat golongan utama: Kata Nama, Kata Kerja, Kata Adjektif, dan Kata Tugas.',
  },
  {
    id: 'buku_kampung',
    title: 'Kitab Rahsia Desa #4',
    regionId: 'kampung_tatabahasa',
    locationHint: 'Tersembunyi di sebelah Pondok Bacaan Kampung Tatabahasa.',
    wisdomTitle: 'Mutiara Bahasa: Rumus ATM bagi Kata Sendi "Dari"',
    wisdomText:
      'Gunakan "dari" hanya untuk Arah, Tempat, dan Masa (ATM). Selain itu seperti sumber atau perbandingan, gunakan "daripada".',
  },
  {
    id: 'buku_perpustakaan',
    title: 'Kitab Rahsia Menara Ilmu #5',
    regionId: 'perpustakaan_ajaib',
    locationHint: 'Tersembunyi di penjuru rak belakang Perpustakaan Ajaib.',
    wisdomTitle: 'Mutiara Bahasa: Bina Ayat Subjek & Predikat',
    wisdomText:
      'Setiap ayat lengkap mempunyai Subjek (perkara yang diceritakan) dan Predikat (cerita tentang subjek tersebut).',
  },
];

export const MAIN_NPCS_LIST = [
  { key: 'cikgu_salmah', name: 'Cikgu Salmah (Taman Sakura Bahasa)' },
  { key: 'penjaga_istana', name: 'Penjaga Istana (Istana Kristal Kata)' },
  { key: 'pustakawan_ajaib', name: 'Pustakawan Ajaib (Perpustakaan Ajaib)' },
  { key: 'peri_perkataan', name: 'Peri Perkataan (Hutan Misteri Perkataan)' },
  { key: 'ketua_kampung', name: 'Ketua Kampung (Kampung Tatabahasa)' },
  { key: 'pak_cik_rahman', name: 'Pak Cik Rahman (Pasar Perkataan)' },
  { key: 'wartawan_bahasa', name: 'Wartawan Bahasa (Menara Media)' },
  { key: 'profesor_bahasa', name: 'Profesor Bahasa (Benteng Wira Bahasa)' },
];

export const CASTLE_ROOMS_INFO: { id: CastleRoomId; label: string }[] = [
  { id: 'dewan_utama', label: 'Dewan Utama' },
  { id: 'bilik_kristal', label: 'Bilik Kristal (30 Ruang)' },
  { id: 'perpustakaan_diraja', label: 'Perpustakaan Diraja' },
  { id: 'bilik_peta', label: 'Bilik Peta' },
  { id: 'dewan_wira', label: 'Dewan Wira' },
];

export const LIBRARY_CATEGORIES_INFO: {
  id: LibraryCategoryId;
  label: string;
  topicId: string;
  slidePage: number;
}[] = [
  { id: 'ejaan', label: 'Ejaan', topicId: 'ejaan-baku', slidePage: 3 },
  { id: 'kata_sendi_nama', label: 'Kata Sendi Nama', topicId: 'kata-sendi', slidePage: 5 },
  { id: 'imbuhan', label: 'Imbuhan', topicId: 'imbuhan', slidePage: 7 },
  { id: 'kata_majmuk', label: 'Kata Majmuk', topicId: 'kata-majmuk', slidePage: 4 },
  { id: 'kata_ganda', label: 'Kata Ganda', topicId: 'kata-ganda', slidePage: 8 },
  { id: 'ayat_perintah', label: 'Ayat Perintah', topicId: 'ayat-perintah', slidePage: 6 },
  { id: 'struktur_ayat', label: 'Struktur Ayat', topicId: 'kata-hubung-klausa', slidePage: 9 },
];

export const EXPLORATION_BADGES_INFO: {
  id: ExplorationBadgeId;
  title: string;
  activityName: string;
  desc: string;
}[] = [
  {
    id: 'lencana_pencari_buku',
    title: 'Lencana Pencari Buku Ajaib',
    activityName: 'Aktiviti 1: Pencari Buku Ajaib',
    desc: 'Menemui kesemua 5 Buku Ajaib tersembunyi di seluruh kerajaan.',
  },
  {
    id: 'lencana_penjelajah',
    title: 'Lencana Penjelajah Kota',
    activityName: 'Aktiviti 2: Penjelajah Kota',
    desc: 'Melawat kesemua 8 lokasi utama Kerajaan Kota Tatabahasa.',
  },
  {
    id: 'lencana_sahabat_bahasa',
    title: 'Lencana Sahabat Bahasa',
    activityName: 'Aktiviti 3: Sahabat Bahasa',
    desc: 'Berbual dengan kesemua 8 NPC utama di setiap kawasan.',
  },
  {
    id: 'lencana_pengumpul_ilmu',
    title: 'Lencana Pengumpul Ilmu',
    activityName: 'Aktiviti 4: Pengumpul Ilmu',
    desc: 'Membaca kesemua 7 kategori buku tatabahasa di Perpustakaan Ajaib.',
  },
  {
    id: 'lencana_peneroka_istana',
    title: 'Lencana Peneroka Istana',
    activityName: 'Aktiviti 5: Peneroka Istana',
    desc: 'Memasuki kesemua 5 bilik utama di dalam Istana Kristal Kata.',
  },
];

export const REGION_DIRECTORY: {
  id: RegionId;
  number: number;
  name: string;
  shortDesc: string;
  missionTag?: string;
  missionNumber?: 1 | 2 | 3;
  worldX: number;
  worldY: number;
}[] = [
  {
    id: 'taman_sakura',
    number: 1,
    name: 'Taman Sakura Bahasa',
    shortDesc:
      'Terokai taman yang indah, bertemu Cikgu Salmah dan mulakan pengembaraan bahasa!',
    missionTag: 'Misi 1 (Soalan 1–10)',
    missionNumber: 1,
    worldX: 18,
    worldY: 20,
  },
  {
    id: 'istana_luar',
    number: 2,
    name: 'Istana Kristal Kota',
    shortDesc:
      'Kunjungi istana diraja yang megah, lawati Dewan Utama, Bilik 30 Kristal Kata, Perpustakaan Diraja, Bilik Peta dan Dewan Wira!',
    worldX: 50,
    worldY: 20,
  },
  {
    id: 'perpustakaan_ajaib',
    number: 3,
    name: 'Perpustakaan Ajaib',
    shortDesc:
      'Pelajari rahsia Ejaan, Imbuhan, Kata Majmuk, Kata Ganda, Struktur Ayat dan Laras Bahasa bersama Pustakawan Ajaib!',
    worldX: 82,
    worldY: 20,
  },
  {
    id: 'hutan_misteri',
    number: 4,
    name: 'Hutan Misteri Perkataan',
    shortDesc:
      'Jelajahi rimba bercahaya bersama Peri Perkataan, cari petunjuk bahasa, sahut cabaran perkataan dan jawab kuiz mini!',
    worldX: 16,
    worldY: 48,
  },
  {
    id: 'kampung_tatabahasa',
    number: 5,
    name: 'Kampung Tatabahasa',
    shortDesc:
      'Lawati Rumah Ilmu, kenali Tokoh Bahasa, periksa papan tanda kampung dan hayati amalan bahasa santun bersama Ketua Kampung!',
    worldX: 16,
    worldY: 80,
  },
  {
    id: 'pasar_perkataan',
    number: 6,
    name: 'Pasar Perkataan',
    shortDesc:
      'Siasat Notis Pasar, Surat Khabar, Menu Makanan dan Papan Iklan dalam Misi 2 bersama Pak Cik Rahman!',
    missionTag: 'Misi 2 (Soalan 11–16)',
    missionNumber: 2,
    worldX: 50,
    worldY: 80,
  },
  {
    id: 'menara_media',
    number: 7,
    name: 'Menara Media',
    shortDesc:
      'Masuki Bilik Berita, Studio Rakaman dan Surat Khabar Digital untuk melengkapkan cabaran Misi 2 bersama Wartawan Bahasa!',
    missionTag: 'Misi 2 (Soalan 17–20)',
    missionNumber: 2,
    worldX: 85,
    worldY: 46,
  },
  {
    id: 'benteng_wira',
    number: 8,
    name: 'Benteng Wira Bahasa',
    shortDesc:
      'Sahut Cabaran Akhir Misi 3 bersama Profesor Bahasa, kumpulkan kesemua 30 Kristal Kata dan pulihkan Kota Tatabahasa!',
    missionTag: 'Misi 3 (Soalan 21–30)',
    missionNumber: 3,
    worldX: 83,
    worldY: 80,
  },
];
