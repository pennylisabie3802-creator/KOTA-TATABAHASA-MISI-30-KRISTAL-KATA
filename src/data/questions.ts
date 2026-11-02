import { QuestionEditableFields, QuizQuestion } from '../types/game';

/**
 * Semua 30 soalan, pilihan jawapan, jawapan betul dan justifikasi pembetulan
 * diambil bulat-bulat mengikut susunan asal daripada fail:
 * "Kuiz_RPG_30_Kristal_Kata_Misi_1_2_3.pdf"
 *
 * Diagihkan mengikut lokasi misi:
 * - Misi 1 (1–10): Taman Sakura Bahasa
 * - Misi 2 (11–16): Pasar Perkataan & (17–20): Menara Media
 * - Misi 3 (21–30): Benteng Wira Bahasa
 */
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // ==========================================
  // MISI 1: DETEKTIF BAHASA (1–10) — TAMAN SAKURA BAHASA
  // ==========================================
  {
    id: 1,
    mission: 1,
    mapId: 'taman_sakura',
    title: 'Soalan 1 — Notis Misteri',
    type: 'mcq',
    objectKind: 'notice_board',
    objectName: 'Papan Notis Taman Sakura',
    kesalahanAsal: 'Tolong kerjasama anda amatlah kami hargai.',
    situasi: 'Tolong kerjasama anda amatlah kami hargai.',
    arahan: 'Pilih ayat pembetulan yang tepat bagi notis di atas:',
    options: [
      { label: 'A', text: 'Tolonglah kerjasama anda amatlah kami hargai.' },
      { label: 'B', text: 'Kerjasama anda amatlah kami hargai.' },
      { label: 'C', text: 'Sila kerjasama anda amatlah kami hargai.' },
      { label: 'D', text: 'Harap kerjasama anda amatlah kami hargai.' },
    ],
    correctOption: 'B',
    pembetulanPenuh: 'Kerjasama anda amatlah kami hargai.',
    justifikasi:
      'Perkataan tolong digugurkan kerana lazimnya digunakan untuk menyatakan permintaan atau arahan sopan, khususnya apabila diikuti kata kerja atau frasa kerja.',
    petunjuk:
      'Perhatikan sama ada ayat ini menyatakan penghargaan atau arahan perbuatan. Adakah kata permintaan diperlukan di hadapan kata nama abstrak?',
    tileX: 6,
    tileY: 6,
  },
  {
    id: 2,
    mission: 1,
    mapId: 'taman_sakura',
    title: 'Soalan 2 — Rahsia Kata Sendi',
    type: 'fill',
    objectKind: 'signpost',
    objectName: 'Papan Tanda Pondok Sakura',
    kesalahanAsal: 'Diatas',
    situasi: 'Betulkan ejaan: Diatas',
    arahan: 'Taip ejaan yang betul di dalam ruang jawapan:',
    acceptedAnswers: ['di atas'],
    pembetulanPenuh: 'Di atas',
    justifikasi:
      'Di atas ditulis terpisah kerana di berfungsi sebagai kata sendi nama apabila menunjukkan arah, tempat atau kedudukan.',
    petunjuk:
      'Semak sama ada kata sendi nama yang menunjukkan tempat atau kedudukan perlu ditulis rapat atau terpisah.',
    tileX: 10,
    tileY: 5,
  },
  {
    id: 3,
    mission: 1,
    mapId: 'taman_sakura',
    title: 'Soalan 3 — Larangan Tersembunyi',
    type: 'mcq',
    objectKind: 'machine_sign',
    objectName: 'Notis Bilik Dobi Taman',
    kesalahanAsal: 'Tolong jangan melipat kain di depan mesin pengering.',
    situasi: 'Tolong jangan melipat kain di depan mesin pengering.',
    arahan: 'Pilih ayat larangan yang betul dan gramatis:',
    options: [
      { label: 'A', text: 'Sila jangan melipat kain di depan mesin pengering.' },
      { label: 'B', text: 'Tolonglah jangan melipat kain di depan mesin pengering.' },
      { label: 'C', text: 'Jangan melipat kain di depan mesin pengering.' },
      { label: 'D', text: 'Tolong tidak melipat kain di depan mesin pengering.' },
    ],
    correctOption: 'C',
    pembetulanPenuh: 'Jangan melipat kain di depan mesin pengering.',
    justifikasi:
      'Bentuk ayat permintaan tolong biasanya tidak membawa pengertian negatif sebagaimana ayat larangan jangan.',
    petunjuk:
      'Perhatikan gabungan dua kata perintah dalam satu ayat. Bolehkah kata permintaan digabungkan terus dengan kata larangan?',
    tileX: 5,
    tileY: 11,
  },
  {
    id: 4,
    mission: 1,
    mapId: 'taman_sakura',
    title: 'Soalan 4 — Arahan Penjaga Mesin',
    type: 'mcq',
    objectKind: 'machine_sign',
    objectName: 'Papan Arahan Mesin Taman',
    kesalahanAsal: 'Tolong bertanggungjawab terhadap mesin yang digunakan.',
    situasi: 'Tolong bertanggungjawab terhadap mesin yang digunakan. Apakah pengganti Tolong?',
    arahan: 'Pilih kata perintah pengganti yang paling tepat:',
    options: [
      { label: 'A', text: 'Harap' },
      { label: 'B', text: 'Minta' },
      { label: 'C', text: 'Sila' },
      { label: 'D', text: 'Jangan' },
    ],
    correctOption: 'C',
    pembetulanPenuh: 'Sila',
    justifikasi:
      'Sila lebih sesuai dan gramatis untuk mengarahkan atau menasihati seseorang secara umum melaksanakan amanah atau kewajipan.',
    petunjuk:
      'Fikirkan kata perintah sopan yang paling sesuai untuk menyeru orang ramai melaksanakan sesuatu tanggungjawab.',
    tileX: 9,
    tileY: 12,
  },
  {
    id: 5,
    mission: 1,
    mapId: 'taman_sakura',
    title: 'Soalan 5 — Misteri Imbuhan',
    type: 'fill',
    objectKind: 'magic_book',
    objectName: 'Buku Imbuhan di Meja Taman',
    kesalahanAsal: 'Menggeluarkan',
    situasi: 'Betulkan perkataan: Menggeluarkan',
    arahan: 'Taip ejaan perkataan berimbuhan yang betul:',
    acceptedAnswers: ['mengeluarkan'],
    pembetulanPenuh: 'Mengeluarkan',
    justifikasi:
      'Mengeluarkan terbentuk daripada keluar dengan apitan meN-...-kan. Bentuk menggeluarkan salah kerana penambahan huruf g tidak menepati proses pengimbuhan.',
    petunjuk:
      'Kenal pasti kata dasar bagi perkataan ini. Apabila kata dasar bermula dengan huruf "k" menerima awalan meN-, huruf "k" luluh menjadi "ng".',
    tileX: 19,
    tileY: 5,
  },
  {
    id: 6,
    mission: 1,
    mapId: 'taman_sakura',
    title: 'Soalan 6 — Pesanan Rahsia',
    type: 'mcq',
    objectKind: 'document',
    objectName: 'Dokumen Pesanan Taman',
    kesalahanAsal: 'Mohon dijaga',
    situasi: 'Betulkan ungkapan: Mohon dijaga',
    arahan: 'Pilih ungkapan pembetulan yang tepat:',
    options: [
      { label: 'A', text: 'Mohon menjaga' },
      { label: 'B', text: 'Mohon jaga' },
      { label: 'C', text: 'Mohon dijagakan' },
      { label: 'D', text: 'Mohon penjagaan' },
    ],
    correctOption: 'B',
    pembetulanPenuh: 'Mohon jaga',
    justifikasi:
      'Dokumen menyatakan dijaga ialah kata kerja pasif berimbuhan di-; kata kerja pasif di- tidak boleh diikuti kata ganti nama diri kedua anda. Nota: justifikasi asal tidak secara langsung menghuraikan keseluruhan frasa.',
    petunjuk:
      'Dalam ayat perintah atau permohonan kepada orang kedua, semak sama ada kata kerja perlu menggunakan kata dasar tanpa imbuhan pasif di-.',
    tileX: 23,
    tileY: 5,
  },
  {
    id: 7,
    mission: 1,
    mapId: 'taman_sakura',
    title: 'Soalan 7 — Cabaran Ayat Perintah',
    type: 'mcq',
    objectKind: 'notice_board',
    objectName: 'Papan Cabaran Perintah',
    kesalahanAsal: 'Nikmatinya!',
    situasi: 'Betulkan ungkapan: Nikmatinya!',
    arahan: 'Pilih bentuk ungkapan perintah yang betul:',
    options: [
      { label: 'A', text: 'Menikmatinya!' },
      { label: 'B', text: 'Nikmatilah!' },
      { label: 'C', text: 'Dinikmati!' },
      { label: 'D', text: 'Menikmatilah!' },
    ],
    correctOption: 'B',
    pembetulanPenuh: 'Nikmatilah!',
    justifikasi:
      'Menurut dokumen, ayat perintah mengekalkan bentuk kata dasar kata kerja transitif dan menggunakan partikel penegas -lah.',
    petunjuk:
      'Ayat perintah mengekalkan bentuk kata dasar tanpa awalan meN-. Perhatikan partikel penegas yang sesuai bagi menggantikan ganti nama "-nya".',
    tileX: 27,
    tileY: 6,
  },
  {
    id: 8,
    mission: 1,
    mapId: 'taman_sakura',
    title: 'Soalan 8 — Perkataan Bercantum',
    type: 'fill',
    objectKind: 'scroll',
    objectName: 'Skrol Wacana Sakura',
    kesalahanAsal: 'Walaubagaimanapun',
    situasi: 'Betulkan ejaan: Walaubagaimanapun',
    arahan: 'Taip ejaan penanda wacana yang betul:',
    acceptedAnswers: ['walau bagaimanapun'],
    pembetulanPenuh: 'Walau bagaimanapun',
    justifikasi:
      'Menurut dokumen yang merujuk DBP, walau dan bagaimanapun dieja terpisah.',
    petunjuk:
      'Perhatikan binaan penanda wacana ini. Adakah kedua-dua perkataan ini tergolong dalam 15 kata majmuk mantap, atau perlu dijarakkan?',
    tileX: 20,
    tileY: 12,
  },
  {
    id: 9,
    mission: 1,
    mapId: 'taman_sakura',
    title: 'Soalan 9 — Ejaan Asing',
    type: 'mcq',
    objectKind: 'document',
    objectName: 'Fail Pondok Penjaga Taman',
    kesalahanAsal: 'Staff',
    situasi: 'Pilih ejaan bahasa Melayu bagi Staff.',
    arahan: 'Pilih satu ejaan kata pinjaman bahasa Melayu yang baku:',
    options: [
      { label: 'A', text: 'Staff' },
      { label: 'B', text: 'Staf' },
      { label: 'C', text: 'Stafff' },
      { label: 'D', text: 'Staff-staf' },
    ],
    correctOption: 'B',
    pembetulanPenuh: 'Staf',
    justifikasi:
      'Staff ialah ejaan bahasa Inggeris; ejaan yang sesuai dalam bahasa Melayu ialah staf.',
    petunjuk:
      'Perhatikan penyesuaian huruf konsonan berganda di akhir kata pinjaman bahasa Inggeris apabila diserap ke dalam bahasa Melayu.',
    tileX: 24,
    tileY: 12,
  },
  {
    id: 10,
    mission: 1,
    mapId: 'taman_sakura',
    title: 'Soalan 10 — Kuasa Ejaan',
    type: 'fill',
    objectKind: 'magic_book',
    objectName: 'Kitab Kuat Kuasa',
    kesalahanAsal: 'Berkuatkuasa',
    situasi: 'Betulkan ejaan: Berkuatkuasa',
    arahan: 'Taip ejaan kata majmuk berimbuhan awalan yang betul:',
    acceptedAnswers: ['berkuat kuasa'],
    pembetulanPenuh: 'Berkuat kuasa',
    justifikasi:
      'Kuat kuasa yang menerima awalan ber- mengekalkan jarak; bentuk bercantum berlaku dengan imbuhan apitan, seperti penguatkuasaan.',
    petunjuk:
      'Kata majmuk yang menerima imbuhan awalan sahaja (tanpa akhiran) perlu dikekalkan jarak di antara dua kata dasarnya.',
    tileX: 28,
    tileY: 12,
  },

  // ==========================================
  // MISI 2: PEMBURU KESALAHAN (11–16 DI PASAR PERKATAAN, 17–20 DI MENARA MEDIA)
  // ==========================================
  {
    id: 11,
    mission: 2,
    mapId: 'pasar_perkataan',
    title: 'Soalan 11 — Troli Misteri',
    type: 'mcq',
    objectKind: 'trolley_sign',
    objectName: 'Notis Parkir Troli Pasar',
    kesalahanAsal: 'Sila meletakkan troli anda di tempat yang disediakan.',
    situasi: 'Sila meletakkan troli anda di tempat yang disediakan.',
    arahan: 'Pilih ayat perintah yang betul bagi notis pasar raya ini:',
    options: [
      { label: 'A', text: 'Sila meletak troli anda di tempat yang disediakan.' },
      { label: 'B', text: 'Sila letakkan troli anda di tempat yang disediakan.' },
      { label: 'C', text: 'Sila diletakkan troli anda di tempat yang disediakan.' },
      { label: 'D', text: 'Sila meletakkanlah troli anda di tempat yang disediakan.' },
    ],
    correctOption: 'B',
    pembetulanPenuh: 'Sila letakkan troli anda di tempat yang disediakan.',
    justifikasi:
      'Awalan meN- pada kata kerja transitif digugurkan apabila hadir selepas kata perintah.',
    petunjuk:
      'Perhatikan kata kerja selepas kata perintah "Sila". Apakah yang berlaku kepada imbuhan awalan meN- dalam ayat silaan?',
    tileX: 5,
    tileY: 6,
  },
  {
    id: 12,
    mission: 2,
    mapId: 'pasar_perkataan',
    title: 'Soalan 12 — Kesalahan dalam Buku',
    type: 'fill',
    objectKind: 'magic_book',
    objectName: 'Buku Panduan Kedai Runcit',
    kesalahanAsal: 'Berkerjasama',
    situasi: 'Betulkan ejaan: Berkerjasama',
    arahan: 'Taip ejaan perkataan yang betul:',
    acceptedAnswers: ['bekerjasama'],
    pembetulanPenuh: 'Bekerjasama',
    justifikasi:
      'Bentuk berkerjasama salah kerana awalan yang betul ialah be- dan bukannya ber- apabila digabungkan dengan kerjasama.',
    petunjuk:
      'Apabila awalan beR- bertemu dengan kata dasar yang suku kata pertamanya mengandungi "-er-" (seperti kerja), huruf "r" pada awalan digugurkan.',
    tileX: 10,
    tileY: 6,
  },
  {
    id: 13,
    mission: 2,
    mapId: 'pasar_perkataan',
    title: 'Soalan 13 — Papan Tanda Pasar',
    type: 'mcq',
    objectKind: 'signpost',
    objectName: 'Papan Tanda Gerbang Pasar',
    kesalahanAsal: 'Pasaraya',
    situasi: 'Betulkan ejaan: Pasaraya',
    arahan: 'Pilih ejaan kata majmuk yang betul:',
    options: [
      { label: 'A', text: 'Pasaraya' },
      { label: 'B', text: 'Pasar-raya' },
      { label: 'C', text: 'Pasar raya' },
      { label: 'D', text: 'Pasarraya' },
    ],
    correctOption: 'C',
    pembetulanPenuh: 'Pasar raya',
    justifikasi:
      'Pasar raya ialah kata majmuk yang terdiri daripada dua kata bebas dengan makna tersendiri.',
    petunjuk:
      'Semak sama ada gabungan dua kata bebas ini termasuk dalam 15 kata majmuk mantap atau perlu ditulis terpisah.',
    tileX: 15,
    tileY: 6,
  },
  {
    id: 14,
    mission: 2,
    mapId: 'pasar_perkataan',
    title: 'Soalan 14 — Menu Rahsia',
    type: 'mcq',
    objectKind: 'food_menu',
    objectName: 'Papan Menu Gerai Pertama',
    kesalahanAsal: 'Mee',
    situasi: 'Pilih ejaan baku bagi Mee.',
    arahan: 'Pilih ejaan Rumi bahasa Melayu yang baku:',
    options: [
      { label: 'A', text: 'Mee' },
      { label: 'B', text: 'Mi' },
      { label: 'C', text: 'Mie' },
      { label: 'D', text: 'Mei' },
    ],
    correctOption: 'B',
    pembetulanPenuh: 'Mi',
    justifikasi:
      'Mi ialah ejaan baku dalam sistem ejaan Rumi bahasa Melayu.',
    petunjuk:
      'Dalam sistem ejaan Rumi bahasa Melayu baku, bunyi vokal /i/ pada nama makanan ini dieja secara ringkas dengan dua huruf sahaja.',
    tileX: 20,
    tileY: 6,
  },
  {
    id: 15,
    mission: 2,
    mapId: 'pasar_perkataan',
    title: 'Soalan 15 — Hidangan Misteri',
    type: 'fill',
    objectKind: 'food_menu',
    objectName: 'Menu Hidangan Gerai Kedua',
    kesalahanAsal: 'Mee Hun',
    situasi: 'Betulkan ejaan: Mee Hun',
    arahan: 'Taip satu perkataan ejaan baku bagi hidangan ini:',
    acceptedAnswers: ['mihun'],
    pembetulanPenuh: 'Mihun',
    justifikasi:
      'Mihun merujuk bahan makanan seperti mi yang halus dan diperbuat daripada tepung beras; juga masakan seperti mihun goreng dan mihun sup.',
    petunjuk:
      'Ejaan baku bagi makanan halus daripada tepung beras ini ditulis rapat sebagai satu perkataan bermula dengan "Mi...".',
    tileX: 24,
    tileY: 6,
  },
  {
    id: 16,
    mission: 2,
    mapId: 'pasar_perkataan',
    title: 'Soalan 16 — Ejaan Sumbangan',
    type: 'mcq',
    objectKind: 'donation_box',
    objectName: 'Tabung Sumbangan Pasar',
    kesalahanAsal: 'Infaq',
    situasi: 'Betulkan ejaan: Infaq',
    arahan: 'Pilih ejaan rasmi bahasa Melayu menurut kamus:',
    options: [
      { label: 'A', text: 'Infaq' },
      { label: 'B', text: 'Infa’' },
      { label: 'C', text: 'Infak' },
      { label: 'D', text: 'Infa-k' },
    ],
    correctOption: 'C',
    pembetulanPenuh: 'Infak',
    justifikasi:
      'Ejaan bahasa Melayu rasmi ialah infak dengan huruf k di hujung, diserap daripada bahasa Arab.',
    petunjuk:
      'Kata serapan ini telah disesuaikan ejaannya mengikut sistem fonologi bahasa Melayu rasmi pada huruf konsonan terakhir.',
    tileX: 22,
    tileY: 12,
  },
  {
    id: 17,
    mission: 2,
    mapId: 'menara_media',
    title: 'Soalan 17 — Huruf Besar atau Kecil?',
    type: 'mcq',
    objectKind: 'notice_board',
    objectName: 'Poster Siaran Ilmu Media',
    kesalahanAsal: 'Bacaan Al-Quran',
    situasi: 'Betulkan ungkapan: Bacaan Al-Quran',
    arahan: 'Pilih penggunaan huruf besar dan huruf kecil yang tepat:',
    options: [
      { label: 'A', text: 'Bacaan Al-Quran' },
      { label: 'B', text: 'Bacaan al-Quran' },
      { label: 'C', text: 'Bacaan AL-QURAN' },
      { label: 'D', text: 'Bacaan Al-quran' },
    ],
    correctOption: 'B',
    pembetulanPenuh: 'Bacaan al-Quran',
    justifikasi:
      'Awalan al- ditulis huruf kecil kerana berada di tengah atau dalam ayat.',
    petunjuk:
      'Perhatikan kedudukan awalan kata sandang "al-" apabila tidak berada pada permulaan ayat, manakala nama kitab suci kekal huruf besar.',
    tileX: 6,
    tileY: 7,
  },
  {
    id: 18,
    mission: 2,
    mapId: 'menara_media',
    title: 'Soalan 18 — Ucapan Majlis',
    type: 'fill',
    objectKind: 'document',
    objectName: 'Teks Ucapan Siaran Rasmi',
    kesalahanAsal: 'Ucapan aluan-alu',
    situasi: 'Betulkan: Ucapan aluan-alu',
    arahan: 'Taip ungkapan penuh yang telah dibetulkan (dua patah perkataan):',
    acceptedAnswers: ['ucapan alu-aluan'],
    pembetulanPenuh: 'Ucapan alu-aluan',
    justifikasi:
      'Ucapan alu-aluan ialah ucapan lisan pertama yang disampaikan oleh tuan rumah dalam sesuatu majlis.',
    petunjuk:
      'Perhatikan kedudukan imbuhan akhiran "-an" pada kata ganda berimbuhan selepas perkataan "Ucapan".',
    tileX: 11,
    tileY: 7,
  },
  {
    id: 19,
    mission: 2,
    mapId: 'menara_media',
    title: 'Soalan 19 — Aktiviti Kemasyarakatan',
    type: 'mcq',
    objectKind: 'stage_banner',
    objectName: 'Poster Kempen Masyarakat',
    kesalahanAsal: 'Gotong royong',
    situasi: 'Betulkan ejaan: Gotong royong',
    arahan: 'Pilih ejaan yang tepat bagi kata ganda berentak ini:',
    options: [
      { label: 'A', text: 'Gotongroyong' },
      { label: 'B', text: 'Gotong royong' },
      { label: 'C', text: 'Gotong-royong' },
      { label: 'D', text: 'Gotong/royong' },
    ],
    correctOption: 'C',
    pembetulanPenuh: 'Gotong-royong',
    justifikasi:
      'Menurut dokumen yang merujuk DBP, ejaan betul ialah gotong-royong dengan tanda sempang.',
    petunjuk:
      'Kata ganda berentak memerlukan satu tanda baca khusus di tengah-tengahnya.',
    tileX: 17,
    tileY: 7,
  },
  {
    id: 20,
    mission: 2,
    mapId: 'menara_media',
    title: 'Soalan 20 — Berita dari Kampus',
    type: 'mcq',
    objectKind: 'newspaper',
    objectName: 'Meja Akhbar Menara Media',
    kesalahanAsal: 'Daripada kampus',
    situasi: 'Betulkan ungkapan: Daripada kampus',
    arahan: 'Pilih kata sendi nama yang tepat bagi menunjukkan tempat:',
    options: [
      { label: 'A', text: 'Dari kampus' },
      { label: 'B', text: 'Daripada kampus' },
      { label: 'C', text: 'Kepada kampus' },
      { label: 'D', text: 'Pada kampus' },
    ],
    correctOption: 'A',
    pembetulanPenuh: 'Dari kampus',
    justifikasi:
      'Dari digunakan untuk arah, tempat dan masa; daripada untuk punca, sumber, asal kejadian dan perbandingan.',
    petunjuk:
      'Ingat rumus ATM (Arah, Tempat, Masa). Kampus merupakan suatu tempat. Kata sendi nama manakah yang tepat?',
    tileX: 22,
    tileY: 7,
  },

  // ==========================================
  // MISI 3: WIRA TATABAHASA (21–30) — BENTENG WIRA BAHASA
  // ==========================================
  {
    id: 21,
    mission: 3,
    mapId: 'benteng_wira',
    title: 'Soalan 21 — Kata yang Hilang',
    type: 'fill',
    objectKind: 'scroll',
    objectName: 'Skrol Kata Hubung Benteng',
    kesalahanAsal: 'Pada masa _____ sama',
    situasi: 'Lengkapkan: Pada masa _____ sama',
    arahan: 'Taip satu kata hubung yang sesuai untuk mengisi tempat kosong:',
    acceptedAnswers: ['yang'],
    pembetulanPenuh: 'yang',
    justifikasi:
      'Yang ialah kata hubung pancangan relatif yang menghubungkan klausa utama dengan klausa kecil.',
    petunjuk:
      'Apakah kata hubung pancangan relatif yang lazim hadir di antara kata nama "masa" dan kata adjektif "sama"?',
    tileX: 5,
    tileY: 12,
  },
  {
    id: 22,
    mission: 3,
    mapId: 'benteng_wira',
    title: 'Soalan 22 — Berita Antarabangsa',
    type: 'mcq',
    objectKind: 'newspaper',
    objectName: 'Warta Diraja Antarabangsa',
    kesalahanAsal: 'akan adakan',
    situasi: 'Betulkan ungkapan: akan adakan',
    arahan: 'Pilih binaan kata bantu dan kata kerja aktif transitif yang betul:',
    options: [
      { label: 'A', text: 'akan diadakan' },
      { label: 'B', text: 'akan mengadakan' },
      { label: 'C', text: 'akan adakan' },
      { label: 'D', text: 'akan mengada' },
    ],
    correctOption: 'B',
    pembetulanPenuh: 'akan mengadakan',
    justifikasi:
      'Kata bantu akan yang diikuti kata kerja aktif transitif memerlukan imbuhan lengkap; ada menerima apitan meng-...-kan menjadi mengadakan.',
    petunjuk:
      'Dalam ayat aktif, kata kerja transitif selepas kata bantu aspek "akan" memerlukan imbuhan apitan aktif yang lengkap.',
    tileX: 9,
    tileY: 12,
  },
  {
    id: 23,
    mission: 3,
    mapId: 'benteng_wira',
    title: 'Soalan 23 — Misi Bantuan Kecemasan',
    type: 'fill',
    objectKind: 'document',
    objectName: 'Dokumen Skuad Benteng',
    kesalahanAsal: 'bantuan padam',
    situasi: 'Lengkapkan: bantuan _____ (asal: bantuan padam)',
    arahan: 'Taip kata nama terbitan yang tepat bagi mengisi tempat kosong:',
    acceptedAnswers: ['pemadaman'],
    pembetulanPenuh: 'pemadaman',
    justifikasi:
      'Bagi mengekalkan binaan frasa nama + frasa nama (Hukum D-M), kata kerja menjadi kata nama abstrak dengan imbuhan peN-...-an.',
    petunjuk:
      'Tukarkan kata kerja "padam" menjadi kata nama terbitan menggunakan imbuhan apitan peN-...-an supaya menepati binaan frasa nama.',
    tileX: 13,
    tileY: 12,
  },
  {
    id: 24,
    mission: 3,
    mapId: 'benteng_wira',
    title: 'Soalan 24 — Berita Penuh Misteri',
    type: 'mcq',
    objectKind: 'newspaper',
    objectName: 'Laporan Klausa Benteng',
    kesalahanAsal: '“... belum dapat dipastikan dengan ia sudah pasti mewujudkan kebimbangan ...”',
    situasi:
      'Betulkan hubungan klausa: “... belum dapat dipastikan dengan ia sudah pasti mewujudkan kebimbangan ...”',
    arahan: 'Pilih kaedah pembetulan hubungan klausa yang paling tepat:',
    options: [
      { label: 'A', text: 'Kekalkan dengan' },
      { label: 'B', text: 'Gantikan dengan serta' },
      {
        label: 'C',
        text: 'Gunakan “, dan keadaan tersebut sudah pasti menimbulkan kebimbangan ...”',
      },
      { label: 'D', text: 'Gugurkan keseluruhan klausa kedua' },
    ],
    correctOption: 'C',
    pembetulanPenuh: 'Gunakan “, dan keadaan tersebut sudah pasti menimbulkan kebimbangan ...”',
    justifikasi:
      'Kata hubung dengan tidak tepat kerana hubungan makna antara klausa ialah kesan atau akibat, bukannya cara.',
    petunjuk:
      'Perhatikan hubungan makna antara klausa pertama dan klausa kedua, serta elakkan penggunaan ganti nama "ia" bagi merujuk perkara/keadaan.',
    tileX: 18,
    tileY: 12,
  },
  {
    id: 25,
    mission: 3,
    mapId: 'benteng_wira',
    title: 'Soalan 25 — Imbuhan Tersembunyi',
    type: 'mcq',
    objectKind: 'magic_book',
    objectName: 'Kitab Kata Kerja Terbitan',
    kesalahanAsal: 'perjelas',
    situasi: 'Betulkan perkataan dalam konteks dokumen: perjelas',
    arahan: 'Pilih kata kerja terbitan yang lengkap dan tepat:',
    options: [
      { label: 'A', text: 'diperjelas' },
      { label: 'B', text: 'memperjelas' },
      { label: 'C', text: 'menjelaskan' },
      { label: 'D', text: 'penjelasan' },
    ],
    correctOption: 'C',
    pembetulanPenuh: 'menjelaskan',
    justifikasi:
      'Perjelas dianggap bentuk kata kerja tidak lengkap dalam ayat berkenaan; menjelaskan ialah kata kerja terbitan dengan awalan meN-.',
    petunjuk:
      'Bentuk kata kerja aktif transitif yang lazim dalam ayat penyata bagi menerangkan sesuatu perkara menggunakan apitan meN-...-kan pada kata dasar "jelas".',
    tileX: 22,
    tileY: 12,
  },
  {
    id: 26,
    mission: 3,
    mapId: 'benteng_wira',
    title: 'Soalan 26 — Bahasa Rasmi',
    type: 'fill',
    objectKind: 'scroll',
    objectName: 'Skrol Laras Media Rasmi',
    kesalahanAsal: 'lepas',
    situasi: 'Betulkan kata masa: lepas',
    arahan: 'Taip kata sendi/hubung masa laras rasmi yang betul:',
    acceptedAnswers: ['selepas'],
    pembetulanPenuh: 'selepas',
    justifikasi:
      'Menurut dokumen, lepas bersifat basahan dalam konteks ini; laras media rasmi menggunakan selepas atau setelah.',
    petunjuk:
      'Tambahkan awalan "se-" pada kata dasar "lepas" bagi membentuk perkataan laras bahasa Melayu rasmi.',
    tileX: 6,
    tileY: 7,
  },
  {
    id: 27,
    mission: 3,
    mapId: 'benteng_wira',
    title: 'Soalan 27 — Misteri Air Panas',
    type: 'mcq',
    objectKind: 'magic_book',
    objectName: 'Ensiklopedia Ruang Fizikal',
    kesalahanAsal: 'direndam air panas',
    situasi: 'Betulkan ungkapan: direndam air panas',
    arahan: 'Pilih ungkapan yang lengkap dengan kata sendi nama dan kata arah:',
    options: [
      { label: 'A', text: 'direndam kepada air panas' },
      { label: 'B', text: 'direndam di dalam air panas' },
      { label: 'C', text: 'direndam daripada air panas' },
      { label: 'D', text: 'direndam dengan dalam air panas' },
    ],
    correctOption: 'B',
    pembetulanPenuh: 'direndam di dalam air panas',
    justifikasi:
      'Di dalam menunjukkan tempat atau ruang yang mempunyai sempadan fizikal.',
    petunjuk:
      'Air panas di dalam bekas mempunyai ruang fizikal. Apakah gabungan kata sendi nama dan kata arah yang menunjukkan ruang fizikal?',
    tileX: 11,
    tileY: 7,
  },
  {
    id: 28,
    mission: 3,
    mapId: 'benteng_wira',
    title: 'Soalan 28 — Lokasi Misteri',
    type: 'fill',
    objectKind: 'signpost',
    objectName: 'Peta Lokasi Benteng',
    kesalahanAsal: 'dekat Puchong',
    situasi: 'Betulkan: dekat Puchong',
    arahan: 'Taip ungkapan lokasi yang betul menggunakan kata sendi nama tempat:',
    acceptedAnswers: ['di puchong'],
    pembetulanPenuh: 'di Puchong',
    justifikasi:
      'Dekat ialah kata adjektif jarak, bukannya kata sendi nama tempat; di digunakan untuk menunjukkan lokasi khusus.',
    petunjuk:
      'Gantikan kata adjektif jarak "dekat" dengan kata sendi nama tempat yang tepat diikuti nama tempat "Puchong".',
    tileX: 17,
    tileY: 7,
  },
  {
    id: 29,
    mission: 3,
    mapId: 'benteng_wira',
    title: 'Soalan 29 — Rahsia Kata Ganda',
    type: 'mcq',
    objectKind: 'scroll',
    objectName: 'Skrol Kata Ganda Diraja',
    kesalahanAsal: 'Merata-Merata',
    situasi: 'Betulkan ejaan: Merata-Merata',
    arahan: 'Pilih ejaan kata ganda separa/berimbuhan yang betul:',
    options: [
      { label: 'A', text: 'Merata-Merata' },
      { label: 'B', text: 'Merata rata' },
      { label: 'C', text: 'Merata-rata' },
      { label: 'D', text: 'Meratarata' },
    ],
    correctOption: 'C',
    pembetulanPenuh: 'Merata-rata',
    justifikasi:
      'Merata-rata bermaksud ke mana-mana sahaja, di segenap tempat atau seluruhnya.',
    petunjuk:
      'Perhatikan pengulangan kata dasar selepas awalan "Me-" serta penggunaan huruf kecil selepas tanda sempang.',
    tileX: 22,
    tileY: 7,
  },
  {
    id: 30,
    mission: 3,
    mapId: 'benteng_wira',
    title: 'Soalan 30 — Kristal Terakhir',
    type: 'fill',
    objectKind: 'crystal_pedestal',
    objectName: 'Altar Kristal Emas Utama',
    kesalahanAsal: 'bersihkan (kawasan pantai)',
    situasi: 'Betulkan kata kerja: bersihkan (kawasan pantai)',
    arahan: 'Taip satu kata kerja transitif berimbuhan lengkap (tanpa objek dalam kurungan):',
    acceptedAnswers: ['membersihkan'],
    pembetulanPenuh: 'membersihkan',
    justifikasi:
      'Membersihkan ialah kata kerja transitif yang menerima objek kawasan pantai, dengan imbuhan meN-...-kan.',
    petunjuk:
      'Dalam ayat penyata aktif, kata dasar "bersih" yang diikuti objek "kawasan pantai" memerlukan imbuhan apitan meN-...-kan.',
    tileX: 14,
    tileY: 4,
  },
];

export function cloneQuizQuestion(q: QuizQuestion): QuizQuestion {
  return {
    ...q,
    options: q.options ? q.options.map((opt) => ({ ...opt })) : undefined,
    acceptedAnswers: q.acceptedAnswers ? [...q.acceptedAnswers] : undefined,
  };
}

/**
 * Immutable baseline snapshot of all 30 original questions so any individual
 * question can be edited or restored cleanly without affecting other questions.
 */
export const ORIGINAL_QUIZ_QUESTIONS: readonly QuizQuestion[] = QUIZ_QUESTIONS.map((q) =>
  cloneQuizQuestion(q)
);

export function getOriginalQuestionById(questionId: number): QuizQuestion | undefined {
  const found = ORIGINAL_QUIZ_QUESTIONS.find((q) => q.id === questionId);
  return found ? cloneQuizQuestion(found) : undefined;
}

export function getQuestionById(questionId: number): QuizQuestion | undefined {
  return QUIZ_QUESTIONS.find((q) => q.id === questionId);
}

function normalizeAcceptedEntry(input: string): string {
  return input.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Applies an edit override to ONLY the target `questionId` (1..30) in `QUIZ_QUESTIONS`,
 * leaving all other 29 questions completely untouched.
 */
export function applySingleQuestionOverride(
  questionId: number,
  override: QuestionEditableFields | null
): QuizQuestion | null {
  const idx = QUIZ_QUESTIONS.findIndex((q) => q.id === questionId);
  const base = ORIGINAL_QUIZ_QUESTIONS.find((q) => q.id === questionId);
  if (idx === -1 || !base) return null;

  if (!override) {
    const restored = cloneQuizQuestion(base);
    QUIZ_QUESTIONS[idx] = restored;
    return cloneQuizQuestion(restored);
  }

  const nextType = override.type === 'mcq' || override.type === 'fill' ? override.type : base.type;

  const merged: QuizQuestion = {
    ...cloneQuizQuestion(base),
    title: override.title.trim() || base.title,
    objectName: override.objectName?.trim() || base.objectName,
    type: nextType,
    situasi: override.situasi,
    arahan: override.arahan,
    petunjuk: override.petunjuk,
    kesalahanAsal: override.kesalahanAsal,
    pembetulanPenuh: override.pembetulanPenuh,
    justifikasi: override.justifikasi,
  };

  if (nextType === 'mcq') {
    const fallbackOpts = base.options ?? [
      { label: 'A', text: '' },
      { label: 'B', text: '' },
      { label: 'C', text: '' },
      { label: 'D', text: '' },
    ];
    merged.options = (['A', 'B', 'C', 'D'] as const).map((label, i) => {
      const match = override.options?.find((o) => o.label === label);
      return {
        label,
        text: match ? match.text : (fallbackOpts[i]?.text ?? ''),
      };
    });
    merged.correctOption =
      override.correctOption && ['A', 'B', 'C', 'D'].includes(override.correctOption)
        ? override.correctOption
        : (base.correctOption ?? 'A');
    merged.acceptedAnswers = override.acceptedAnswers
      ? override.acceptedAnswers.map(normalizeAcceptedEntry).filter(Boolean)
      : base.acceptedAnswers;
  } else {
    const normalizedAccepted = (override.acceptedAnswers ?? [])
      .map(normalizeAcceptedEntry)
      .filter(Boolean);
    merged.acceptedAnswers =
      normalizedAccepted.length > 0
        ? Array.from(new Set(normalizedAccepted))
        : base.acceptedAnswers ?? [normalizeAcceptedEntry(override.pembetulanPenuh)];
    merged.options = override.options
      ? override.options.map((o) => ({ ...o }))
      : base.options?.map((o) => ({ ...o }));
    merged.correctOption = override.correctOption ?? base.correctOption;
  }

  QUIZ_QUESTIONS[idx] = merged;
  return cloneQuizQuestion(merged);
}

export function applyAllQuestionOverrides(
  overrides: Record<number, QuestionEditableFields>
): void {
  for (const base of ORIGINAL_QUIZ_QUESTIONS) {
    const ov = overrides[base.id] ?? null;
    applySingleQuestionOverride(base.id, ov);
  }
}

export function getQuestionsByMission(mission: 1 | 2 | 3): QuizQuestion[] {
  return QUIZ_QUESTIONS.filter((q) => q.mission === mission);
}

export function getQuestionsByMap(mapId: string): QuizQuestion[] {
  return QUIZ_QUESTIONS.filter((q) => q.mapId === mapId);
}
