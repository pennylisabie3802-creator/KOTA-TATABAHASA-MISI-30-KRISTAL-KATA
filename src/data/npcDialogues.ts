import { DynamicNpcDialogueResult, JournalRecord } from '../types/game';
import { QUIZ_QUESTIONS } from './questions';

interface DialogueContext {
  playerName: string;
  completedQuestions: Record<number, JournalRecord>;
  score: number;
  readCategoriesCount?: number;
  visitedCastleRoomsCount?: number;
  foundBooksCount?: number;
}

function countRange(completed: Record<number, JournalRecord>, start: number, end: number): number {
  let count = 0;
  for (let i = start; i <= end; i++) {
    if (completed[i]) count++;
  }
  return count;
}

function getNextPendingInRange(completed: Record<number, JournalRecord>, start: number, end: number) {
  for (let i = start; i <= end; i++) {
    if (!completed[i]) {
      return QUIZ_QUESTIONS.find((q) => q.id === i) || null;
    }
  }
  return null;
}

function getLatestSolvedInRange(completed: Record<number, JournalRecord>, start: number, end: number) {
  let latestId = -1;
  let latestTime = '';
  for (let i = start; i <= end; i++) {
    const rec = completed[i];
    if (rec && rec.completedAt >= latestTime) {
      latestTime = rec.completedAt;
      latestId = i;
    }
  }
  if (latestId === -1) return null;
  return QUIZ_QUESTIONS.find((q) => q.id === latestId) || null;
}

export function buildDynamicNpcDialogue(
  npcId: string,
  ctx: DialogueContext
): DynamicNpcDialogueResult {
  const {
    playerName,
    completedQuestions,
    score,
    readCategoriesCount = 0,
    visitedCastleRoomsCount = 0,
  } = ctx;

  const totalCrystals = Object.keys(completedQuestions).length;
  const m1Count = countRange(completedQuestions, 1, 10);
  const m2PasarCount = countRange(completedQuestions, 11, 16);
  const m2MediaCount = countRange(completedQuestions, 17, 20);
  const m2Count = m2PasarCount + m2MediaCount;
  const m3Count = countRange(completedQuestions, 21, 30);

  const m1Done = m1Count === 10;
  const m2Done = m2Count === 10;
  const m3Done = m3Count === 10;

  // =========================================================
  // 1. CIKGU SALMAH (TAMAN SAKURA BAHASA — MISI 1)
  // =========================================================
  if (npcId === 'cikgu_salmah') {
    const nextM1 = getNextPendingInRange(completedQuestions, 1, 10);
    const lastM1 = getLatestSolvedInRange(completedQuestions, 1, 10);

    if (m1Done) {
      return {
        npcId,
        npcName: 'Cikgu Salmah',
        npcRole: 'Pembimbing Misi 1 · Taman Sakura Bahasa',
        spriteKind: 'cikgu_salmah',
        moodBadge: 'Misi 1 Selesai · Lencana Detektif Diraih',
        greetingPages: [
          `Tahniah, Detektif Bahasa ${playerName}! Taman Sakura Bahasa kini bebas daripada kesemua 10 kesalahan bahasa!`,
          m2Done
            ? `Kamu sudah mengumpul ${totalCrystals}/30 Kristal Kata! Teruskan langkahmu ke Benteng Wira Bahasa untuk Misi 3!`
            : 'Sekarang kamu layak memulakan cabaran Misi 2 di Pasar Perkataan dan Menara Media!',
        ],
        options: [
          {
            id: 'pergi_pasar',
            label: 'Pergi ke Pasar Perkataan (Misi 2)',
            responsePages: ['Pak Cik Rahman sedang menanti bantuan kamu di Pasar Perkataan!'],
            action: 'GO_PASAR_PERKATAAN',
          },
          {
            id: 'buka_jurnal',
            label: 'Semak rekod Jurnal Bahasa',
            responsePages: ['Silakan menyemak semua bukti siasatan yang telah direkodkan!'],
            action: 'OPEN_JOURNAL',
          },
        ],
      };
    }

    if (m1Count === 0) {
      return {
        npcId,
        npcName: 'Cikgu Salmah',
        npcRole: 'Pembimbing Misi 1 · Taman Sakura Bahasa',
        spriteKind: 'cikgu_salmah',
        moodBadge: 'Misi 1 Sedia Dimulakan · 0/10',
        greetingPages: [
          'Selamat datang ke Taman Sakura Bahasa!',
          'Di sinilah pengembaraan kamu bermula.',
          'Terokai kawasan ini dan pelajari rahsia tatabahasa.',
          'Jika kamu sudah bersedia, mulakan Misi Detektif Bahasa!',
        ],
        options: [
          {
            id: 'petunjuk_pertama_sakura',
            label: 'Di manakah kes pertama Misi Detektif Bahasa?',
            responsePages: [
              `Hampiri "${nextM1?.objectName}" di sebelah barat laut taman yang mempunyai ikon tanda seru (!) emas untuk menjawab Soalan 1!`,
              'Kamu juga boleh memeriksa buku di bangku taman, membaca papan peta, atau melihat air pancut kristal.',
            ],
          },
          {
            id: 'rujukan_awal',
            label: 'Buka Bahan Pembelajaran dahulu',
            responsePages: ['Langkah bijak! Mari ulang kaji asas tatabahasa sebelum menyiasat.'],
            action: 'OPEN_LEARNING',
          },
        ],
      };
    }

    return {
      npcId,
      npcName: 'Cikgu Salmah',
      npcRole: 'Pembimbing Misi 1 · Taman Sakura Bahasa',
      spriteKind: 'cikgu_salmah',
      moodBadge: `Misi 1 Aktif · ${m1Count}/10 Selesai`,
      greetingPages: [
        `Syabas ${playerName}! Kamu telah memulihkan ${m1Count} daripada 10 Kristal Kata di Taman Sakura Bahasa.`,
        lastM1
          ? `Pembetulan "${lastM1.kesalahanAsal}" menjadi "${lastM1.pembetulanPenuh}" tadi sangat tepat!`
          : 'Teruskan siasatan mengikut urutan nombor!',
      ],
      options: [
        {
          id: 'kes_seterusnya',
          label: 'Di manakah petunjuk seterusnya?',
          responsePages: nextM1
            ? [
                `Siasat objek "${nextM1.objectName}" yang bertanda seru (!) emas bagi menyelesaikan ${nextM1.title}!`,
              ]
            : ['Semua kes hampir selesai!'],
        },
        {
          id: 'peta_dunia',
          label: 'Buka Peta Dunia Pengembaraan',
          responsePages: ['Ini peta penuh Kerajaan Kota Tatabahasa!'],
          action: 'OPEN_MAP',
        },
      ],
    };
  }

  // =========================================================
  // 2A. BURUNG HANTU DIRAJA (ISTANA KRISTAL KOTA)
  // =========================================================
  if (npcId === 'owl_istana') {
    return {
      npcId,
      npcName: 'Burung Hantu Diraja',
      npcRole: 'Utusan Ilmu Istana Kristal Kota',
      spriteKind: 'owl',
      moodBadge: `Kristal Pulih: ${totalCrystals}/30`,
      greetingPages: [
        `Selamat datang ke Istana Kristal Kota, ${playerName}!`,
        'Aku menjaga warkah diraja dan memantau cahaya 30 Kristal Kata dari puncak menara istana.',
        totalCrystals === 30
          ? 'Kesemua 30 Kristal Kata telah menyala gemilang! Pergilah ke Benteng Wira Bahasa untuk memulihkan Kota Tatabahasa!'
          : `Setakat ini kamu telah mengumpul ${totalCrystals}/30 Kristal Kata. Jangan lupa melawat kelima-lima bilik istana di papan menu sebelah kanan!`,
      ],
      options: [
        {
          id: 'owl_buka_nota',
          label: 'Buka Bahan Pembelajaran Diraja',
          responsePages: ['Silakan meneliti panduan tatabahasa sebelum meneruskan kembara!'],
          action: 'OPEN_LEARNING',
        },
        {
          id: 'owl_buka_peta',
          label: 'Buka Peta Dunia Kerajaan Tatabahasa',
          responsePages: ['Terbanglah ke mana-mana lokasi kerajaan untuk mencari Kristal Kata!'],
          action: 'OPEN_MAP',
        },
      ],
    };
  }

  // =========================================================
  // 2B. PENJAGA ISTANA (ISTANA KRISTAL KOTA — LUAR & DALAM)
  // =========================================================
  if (npcId === 'penjaga_istana' || npcId === 'pengawal_istana') {
    return {
      npcId,
      npcName: npcId === 'penjaga_istana' ? 'Penjaga Istana Diraja' : 'Pengawal Gerbang Zaki',
      npcRole: 'Pelindung Istana Kristal Kata',
      spriteKind: 'pengawal_istana',
      moodBadge: `Ruang Kristal: ${totalCrystals}/30 Menyala`,
      greetingPages: [
        'Kristal Kata ialah sumber kekuatan Kota Tatabahasa.',
        'Setiap pembetulan bahasa mengembalikan cahaya kristal.',
        'Teruskan pengembaraanmu!',
      ],
      options: [
        {
          id: 'status_bilik_kristal',
          label: 'Bagaimanakah keadaan Bilik Kristal sekarang?',
          responsePages: [
            totalCrystals === 30
              ? 'Kesemua 30 ruang kristal di Bilik Kristal telah menyala biru gemilang dan Kristal Utama bersinar keemasan!'
              : `Setakat ini ${totalCrystals} ruang kristal telah menyala biru bercahaya, manakala ${30 - totalCrystals} ruang lagi masih kelabu menunggu pembetulanmu.`,
            `Kamu juga telah meneroka ${visitedCastleRoomsCount} daripada 5 bilik utama di dalam istana ini!`,
          ],
        },
        ...(npcId === 'pengawal_istana'
          ? [
              {
                id: 'masuk_istana',
                label: 'Masuk ke Bahagian Dalam Istana sekarang',
                responsePages: ['Silakan melangkah masuk ke Dewan Utama Istana Kristal Kata!'],
                action: 'ENTER_ISTANA_DALAM' as const,
              },
            ]
          : [
              {
                id: 'lihat_peta_diraja',
                label: 'Buka Peta Dunia Kerajaan',
                responsePages: ['Sila pilih destinasi pengembaraanmu seterusnya, Wira!'],
                action: 'OPEN_MAP' as const,
              },
            ]),
      ],
    };
  }

  // =========================================================
  // 3. PUSTAKAWAN AJAIB (PERPUSTAKAAN AJAIB — BURUNG HANTU UNGU)
  // =========================================================
  if (npcId === 'pustakawan_ajaib') {
    return {
      npcId,
      npcName: 'Pustakawan Ajaib',
      npcRole: 'Ketua Ilmuwan Perpustakaan Ajaib',
      spriteKind: 'owl',
      moodBadge: `Kategori Dibaca: ${readCategoriesCount}/7`,
      greetingPages: [
        'Selamat datang ke Perpustakaan Ajaib!',
        'Setiap buku menyimpan rahsia bahasa Melayu.',
        'Pilih bahan pembelajaran untuk menambah pengetahuanmu!',
      ],
      options: [
        {
          id: 'panduan_rak',
          label: 'Bagaimanakah cara memperoleh Lencana Pengumpul Ilmu?',
          responsePages: [
            `Hampiri ketujuh-tujuh rak buku kategori di dewan ini (Ejaan, Kata Sendi Nama, Imbuhan, Kata Majmuk, Kata Ganda, Ayat Perintah, dan Struktur Ayat) dan tekan E!`,
            readCategoriesCount >= 7
              ? 'Syabas! Kamu telah membaca kesemua 7 kategori dan meraih Lencana Pengumpul Ilmu!'
              : `Kamu sudah membaca ${readCategoriesCount} daripada 7 rak kategori setakat ini.`,
          ],
        },
        {
          id: 'buka_slaid_akademi',
          label: 'Buka Slaid Akademi Kota Tatabahasa',
          responsePages: ['Silakan meneliti 12 slaid bergambar Akademi Kota Tatabahasa!'],
          action: 'OPEN_LEARNING',
        },
      ],
    };
  }

  // =========================================================
  // 4. PERI PERKATAAN (HUTAN MISTERI PERKATAAN)
  // =========================================================
  if (npcId === 'peri_perkataan') {
    return {
      npcId,
      npcName: 'Peri Perkataan',
      npcRole: 'Penjaga Hutan Misteri Perkataan',
      spriteKind: 'peri_perkataan',
      moodBadge: 'Penjaga Rahsia Golongan Kata',
      greetingPages: [
        'Hutan ini menyimpan pelbagai rahsia perkataan.',
        'Gunakan pengetahuan bahasa untuk memahami setiap petunjuk!',
      ],
      options: [
        {
          id: 'rahsia_hutan',
          label: 'Apakah aktiviti yang boleh saya terokai di hutan ini?',
          responsePages: [
            'Periksa empat Batu Petunjuk Golongan Kata di sepanjang laluan berliku untuk mengenali Kata Nama, Kata Kerja, Kata Adjektif, dan Kata Tugas!',
            'Jangan lupa menyeberangi jambatan kayu menuju Pondok Misteri—ada sebuah Buku Ajaib Rahsia tersembunyi di sebelahnya!',
          ],
        },
        {
          id: 'papan_arah_hutan',
          label: 'Ke manakah laluan keluar hutan ini menuju?',
          responsePages: ['Gunakan Papan Arah atau Peta Dunia untuk mengembara ke Kampung Tatabahasa atau Taman Sakura Bahasa!'],
          action: 'OPEN_SIGNPOST',
        },
      ],
    };
  }

  // =========================================================
  // 5. KETUA KAMPUNG (KAMPUNG TATABAHASA)
  // =========================================================
  if (npcId === 'ketua_kampung') {
    return {
      npcId,
      npcName: 'Ketua Kampung Tok Wan',
      npcRole: 'Pemimpin Kampung Tatabahasa',
      spriteKind: 'ketua_kampung',
      moodBadge: 'Bahasa Indah Budaya Kita',
      greetingPages: [
        'Selamat datang ke Kampung Tatabahasa!',
        'Bahasa yang betul penting dalam kehidupan seharian.',
        'Cuba perhatikan papan tanda di sekitar kampung ini.',
      ],
      options: [
        {
          id: 'aktiviti_kampung',
          label: 'Apakah yang menarik di Kampung Tatabahasa?',
          responsePages: [
            'Penduduk kampung kami sentiasa mengamalkan ejaan baku pada papan tanda kedai kecil, kebun bunga, dan pondok bacaan.',
            'Singgahlah ke Pondok Bacaan di sebelah timur—ada sebuah Buku Ajaib Rahsia buat pengembara yang rajin membaca!',
          ],
        },
        {
          id: 'pergi_pasar_dari_kampung',
          label: 'Tunjukkan jalan ke Pasar Perkataan',
          responsePages: ['Pasar Perkataan terletak betul-betul di sebelah timur kampung kita. Ayuh ke sana!'],
          action: 'GO_PASAR_PERKATAAN',
        },
      ],
    };
  }

  // =========================================================
  // 6. PAK CIK RAHMAN (PASAR PERKATAAN — MISI 2 BAHAGIAN 1: Q11–Q16)
  // =========================================================
  if (npcId === 'pak_cik_rahman') {
    const nextPasar = getNextPendingInRange(completedQuestions, 11, 16);
    const lastPasar = getLatestSolvedInRange(completedQuestions, 11, 16);

    if (!m1Done) {
      return {
        npcId,
        npcName: 'Pak Cik Rahman',
        npcRole: 'Ketua Peniaga Pasar Perkataan (Misi 2)',
        spriteKind: 'pak_cik_rahman',
        moodBadge: `Teroka Bebas · Cabaran Misi 2 Perlu Misi 1 (${m1Count}/10)`,
        greetingPages: [
          'Wira Bahasa!',
          'Pasar ini mempunyai banyak papan tanda dan notis.',
          'Namun, terdapat kesalahan bahasa yang perlu dibetulkan.',
          'Bolehkah kamu membantu kami?',
        ],
        options: [
          {
            id: 'syarat_misi2',
            label: 'Bagaimanakah cara membuka cabaran kuiz di pasar ini?',
            responsePages: [
              `Kamu bebas berjalan-jalan dan berbual dengan peniaga di Pasar Perkataan sekarang!`,
              `Untuk memulakan pembetulan rasmi Misi 2 (Soalan 11–16), selesaikan dahulu 10 cabaran Misi 1 di Taman Sakura Bahasa (${m1Count}/10 selesai).`,
            ],
          },
          {
            id: 'balik_sakura',
            label: 'Pergi ke Taman Sakura Bahasa (Misi 1)',
            responsePages: ['Semoga berjaya membantu Cikgu Salmah dahulu!'],
            action: 'GO_TAMAN_SAKURA',
          },
        ],
      };
    }

    if (m2PasarCount === 6) {
      return {
        npcId,
        npcName: 'Pak Cik Rahman',
        npcRole: 'Ketua Peniaga Pasar Perkataan (Misi 2)',
        spriteKind: 'pak_cik_rahman',
        moodBadge: '6/6 Kes Pasar Selesai!',
        greetingPages: [
          `Alhamdulillah, terima kasih ${playerName}! Kesemua 6 kesalahan pada troli, buku kedai, papan tanda Pasar raya, menu Mi, Mihun, dan tabung Infak di pasar ini sudah selesai!`,
          m2MediaCount < 4
            ? `Sekarang bergegaslah ke Menara Media untuk membantu Wartawan Bahasa menyelesaikan baki 4 soalan Misi 2 (Soalan 17–20)!`
            : 'Seluruh Misi 2 telah berjaya diselesaikan dengan cemerlang!',
        ],
        options: [
          {
            id: 'terus_ke_media',
            label: 'Pergi ke Menara Media sekarang',
            responsePages: ['Wartawan Bahasa sedang menunggu kamu di Menara Media!'],
            action: 'GO_MENARA_MEDIA',
          },
        ],
      };
    }

    return {
      npcId,
      npcName: 'Pak Cik Rahman',
      npcRole: 'Ketua Peniaga Pasar Perkataan (Misi 2)',
      spriteKind: 'pak_cik_rahman',
      moodBadge: `Pasar Perkataan · ${m2PasarCount}/6 Selesai`,
      greetingPages:
        m2PasarCount === 0
          ? [
              'Wira Bahasa!',
              'Pasar ini mempunyai banyak papan tanda dan notis.',
              'Namun, terdapat kesalahan bahasa yang perlu dibetulkan.',
              'Bolehkah kamu membantu kami?',
            ]
          : [
              `Bagus sekali, ${playerName}! ${m2PasarCount} daripada 6 kes di Pasar Perkataan telah berjaya dibetulkan.`,
              lastPasar
                ? `Para pelanggan memuji pembetulan "${lastPasar.kesalahanAsal}" kepada "${lastPasar.pembetulanPenuh}" tadi!`
                : 'Teruskan memeriksa gerai-gerai seterusnya!',
            ],
      options: [
        {
          id: 'sasaran_pasar',
          label: 'Objek manakah perlu saya periksa sekarang?',
          responsePages: nextPasar
            ? [
                `Periksa "${nextPasar.objectName}" yang mempunyai tanda seru (!) emas untuk menyelesaikan ${nextPasar.title}!`,
              ]
            : ['Semua kes pasar selesai!'],
        },
      ],
    };
  }

  // =========================================================
  // 7. WARTAWAN BAHASA (MENARA MEDIA — MISI 2 BAHAGIAN 2: Q17–Q20)
  // =========================================================
  if (npcId === 'wartawan_bahasa' || npcId === 'encik_hakim') {
    const nextMedia = getNextPendingInRange(completedQuestions, 17, 20);

    if (!m1Done) {
      return {
        npcId,
        npcName: 'Wartawan Bahasa (Encik Hakim)',
        npcRole: 'Ketua Pengarang Menara Media',
        spriteKind: 'encik_hakim',
        moodBadge: `Teroka Bebas · Perlu Misi 1 (${m1Count}/10)`,
        greetingPages: [
          'Berita perlu disampaikan menggunakan bahasa yang tepat.',
          'Bantu kami menyemak kesalahan dalam dokumen ini!',
        ],
        options: [
          {
            id: 'info_menara',
            label: 'Bilakah saya boleh menyemak dokumen berita ini?',
            responsePages: [
              'Kamu boleh meninjau mesin cetak dan meja wartawan kami pada bila-bila masa!',
              'Sebaik sahaja Misi 1 di Taman Sakura Bahasa dan Soalan 11–16 di Pasar Perkataan selesai, kamu boleh membetulkan Soalan 17–20 di sini.',
            ],
          },
        ],
      };
    }

    if (m2PasarCount < 6) {
      return {
        npcId,
        npcName: 'Wartawan Bahasa (Encik Hakim)',
        npcRole: 'Ketua Pengarang Menara Media',
        spriteKind: 'encik_hakim',
        moodBadge: `Menunggu Kes Pasar (${m2PasarCount}/6)`,
        greetingPages: [
          'Berita perlu disampaikan menggunakan bahasa yang tepat.',
          `Selesaikan dahulu kesemua 6 kes di Pasar Perkataan bersama Pak Cik Rahman (Soalan 11–16), kemudian kembali ke sini untuk Soalan 17–20!`,
        ],
        options: [
          {
            id: 'ke_pasar',
            label: 'Pergi ke Pasar Perkataan (Soalan 11–16)',
            responsePages: ['Mari selesaikan siasatan di Pasar Perkataan dahulu!'],
            action: 'GO_PASAR_PERKATAAN',
          },
        ],
      };
    }

    if (m2Done) {
      return {
        npcId,
        npcName: 'Wartawan Bahasa (Encik Hakim)',
        npcRole: 'Ketua Pengarang Menara Media',
        spriteKind: 'encik_hakim',
        moodBadge: 'Misi 2 Selesai · Lencana Pemburu Diraih!',
        greetingPages: [
          `Syabas ${playerName}! Kesemua poster, teks ucapan, dan laporan berita di Menara Media kini 100% tepat!`,
          'Dengan 20 Kristal Kata di tanganmu, Profesor Bahasa sedang menunggu kamu di Benteng Wira Bahasa untuk cabaran terakhir Misi 3!',
        ],
        options: [
          {
            id: 'ke_benteng',
            label: 'Menuju ke Benteng Wira Bahasa (Misi 3)',
            responsePages: ['Semoga berjaya menamatkan cabaran puncak Wira Tatabahasa!'],
            action: 'GO_BENTENG_WIRA',
          },
        ],
      };
    }

    return {
      npcId,
      npcName: 'Wartawan Bahasa (Encik Hakim)',
      npcRole: 'Pembimbing Menara Media (Misi 2)',
      spriteKind: 'encik_hakim',
      moodBadge: `Menara Media · ${m2MediaCount}/4 Selesai`,
      greetingPages: [
        'Berita perlu disampaikan menggunakan bahasa yang tepat.',
        'Bantu kami menyemak kesalahan dalam dokumen ini!',
      ],
      options: [
        {
          id: 'dokumen_seterusnya',
          label: 'Dokumen manakah perlu saya semak sekarang?',
          responsePages: nextMedia
            ? [
                `Hampiri "${nextMedia.objectName}" yang bertanda seru (!) emas untuk menyelesaikan ${nextMedia.title}!`,
              ]
            : ['Semua dokumen selesai!'],
        },
      ],
    };
  }

  // =========================================================
  // 8. PROFESOR BAHASA (BENTENG WIRA BAHASA — MISI 3: Q21–Q30)
  // =========================================================
  if (npcId === 'profesor_bahasa') {
    const nextM3 = getNextPendingInRange(completedQuestions, 21, 30);

    if (!m2Done) {
      return {
        npcId,
        npcName: 'Profesor Bahasa',
        npcRole: 'Penjaga Agung Benteng Wira Bahasa (Misi 3)',
        spriteKind: 'profesor_bahasa',
        moodBadge: `Teroka Bebas · Perlu 20 Kristal (${totalCrystals}/20)`,
        greetingPages: [
          'Kamu telah melalui pelbagai cabaran bahasa.',
          'Namun, perjalananmu belum berakhir!',
          `Benteng Wira Bahasa terbuka untuk kamu tinjau, tetapi cabaran akhir Misi 3 (Soalan 21–30) memerlukan 20 Kristal Kata daripada Misi 1 dan Misi 2 (kini: ${totalCrystals}/20).`,
        ],
        options: [
          {
            id: 'arah_sebelum_m3',
            label: 'Di manakah saya perlu mengumpul kristal sebelum ini?',
            responsePages: [
              !m1Done
                ? 'Lengkapkan 10 Kristal Kata Misi 1 di Taman Sakura Bahasa terlebih dahulu!'
                : 'Lengkapkan baki Kristal Kata Misi 2 di Pasar Perkataan (Soalan 11–16) dan Menara Media (Soalan 17–20)!',
            ],
            action: !m1Done ? 'GO_TAMAN_SAKURA' : 'GO_PASAR_PERKATAAN',
          },
        ],
      };
    }

    if (m3Done) {
      return {
        npcId,
        npcName: 'Profesor Bahasa',
        npcRole: 'Penjaga Agung Benteng Wira Bahasa',
        spriteKind: 'profesor_bahasa',
        moodBadge: '30/30 Kristal · Pintu Kristal Utama Terbuka!',
        greetingPages: [
          `Tahniah luar biasa, Wira Tatabahasa ${playerName}! Kesemua 30 Kristal Kata telah kembali bercahaya dengan markah ${score} mata!`,
          'Lihat di bahagian paling utara benteng—Pintu Kristal Utama kini terbuka luas untuk meraikan kemenanganmu!',
        ],
        options: [
          {
            id: 'buka_jurnal_akhir',
            label: 'Semak kesemua 30 rekod Jurnal Bahasa',
            responsePages: ['Inilah khazanah ilmu tatabahasa yang telah berjaya kamu selamatkan!'],
            action: 'OPEN_JOURNAL',
          },
        ],
      };
    }

    return {
      npcId,
      npcName: 'Profesor Bahasa',
      npcRole: 'Pembimbing Misi 3 · Benteng Wira Bahasa',
      spriteKind: 'profesor_bahasa',
      moodBadge: `Misi 3 Aktif · ${m3Count}/10 Selesai`,
      greetingPages: [
        'Kamu telah melalui pelbagai cabaran bahasa.',
        'Namun, perjalananmu belum berakhir!',
        'Gunakan segala ilmu yang telah dipelajari.',
        'Selamat datang ke cabaran Wira Tatabahasa!',
      ],
      options: [
        {
          id: 'cabaran_benteng_seterusnya',
          label: 'Apakah cabaran seterusnya di dewan ini?',
          responsePages: nextM3
            ? [
                nextM3.id === 30
                  ? 'Hampiri Altar Kristal Emas Utama di bahagian utara dewan untuk menyelesaikan Soalan 30 dan membuka Pintu Kristal Utama!'
                  : `Siasat "${nextM3.objectName}" yang bertanda seru (!) emas bagi menyelesaikan ${nextM3.title}!`,
              ]
            : ['Semua cabaran selesai!'],
        },
        {
          id: 'ulang_kaji_benteng',
          label: 'Rujuk Bahan Pembelajaran sebelum menjawab',
          responsePages: ['Silakan meneliti nota tatabahasa sebagai bekalan terakhir!'],
          action: 'OPEN_LEARNING',
        },
      ],
    };
  }

  // =========================================================
  // PENDUDUK SAMPINGAN: PAK CIK SAMAD, KAK SITI, DETEKTIF AMIR, CIK WANI
  // =========================================================
  if (npcId === 'peniaga_mi') {
    const doneMi = Boolean(completedQuestions[14]) && Boolean(completedQuestions[15]);
    return {
      npcId,
      npcName: 'Pak Cik Samad',
      npcRole: 'Peniaga Gerai Mi & Mihun',
      spriteKind: 'peniaga_mi',
      moodBadge: doneMi ? 'Menu Gerai Baku!' : 'Gerai Makanan Pasar',
      greetingPages: doneMi
        ? [
            `Terima kasih ${playerName}! Menu "Mi" dan "Mihun" di gerai Pak Cik kini menjadi rujukan ejaan baku seluruh pasar!`,
          ]
        : [
            `Singgah dahulu, ${playerName}! Ramai orang masih tersilap menulis "Mee" dan "Mee Hun" pada papan menu gerai.`,
          ],
      options: [
        {
          id: 'nota_ejaan_makanan',
          label: 'Semak panduan Ejaan Baku',
          responsePages: ['Mari lihat panduan ejaan baku dalam Bahan Pembelajaran!'],
          action: 'OPEN_LEARNING',
        },
      ],
    };
  }

  if (npcId === 'peniaga_buku') {
    return {
      npcId,
      npcName: 'Kak Siti',
      npcRole: 'Penduduk & Peniaga Buku',
      spriteKind: 'peniaga_buku',
      moodBadge: 'Pencinta Bahasa Baku',
      greetingPages: [
        `Ceria sungguh suasana hari ini, ${playerName}! Membaca papan tanda dan buku dengan ejaan yang tepat menjadikan komunikasi kita lebih jelas.`,
      ],
      options: [
        {
          id: 'lihat_jurnal_siti',
          label: 'Buka Jurnal Bahasa saya',
          responsePages: ['Wah, kemas sungguh catatan pembetulan bahasa kamu!'],
          action: 'OPEN_JOURNAL',
        },
      ],
    };
  }

  if (npcId === 'detektif_muda') {
    return {
      npcId,
      npcName: 'Detektif Muda Amir',
      npcRole: 'Pelatih Siasatan Taman Sakura',
      spriteKind: 'detektif_muda',
      moodBadge: `Kemajuan Misi 1: ${m1Count}/10`,
      greetingPages: [
        `Hai ${playerName}! Selain 10 objek siasatan Misi 1 di Taman Sakura ini, jangan lupa periksa bangku kayu, kolam ikan, dan Pondok Kecil di timur laut!`,
      ],
      options: [
        {
          id: 'tips_amir',
          label: 'Ada rahsia tersembunyi di Taman Sakura?',
          responsePages: [
            'Psst! Cuba periksa sekitar Pondok Kecil—saya ternampak kilauan sebuah Buku Ajaib Rahsia bagi koleksi Lencana Pencari Buku Ajaib!',
          ],
        },
      ],
    };
  }

  return {
    npcId,
    npcName: 'Cik Wani',
    npcRole: 'Editor Meja Berita Menara Media',
    spriteKind: 'editor_media',
    moodBadge: 'Bilik Cetak Menara Media',
    greetingPages: [
      `Selamat datang ke Menara Media, ${playerName}! Cuba periksa Mesin Cetak di sebelah sana untuk melihat bagaimana berita bahasa baku diterbitkan.`,
    ],
    options: [
      {
        id: 'buka_peta_wani',
        label: 'Buka Peta Dunia',
        responsePages: ['Sila pilih destinasi pengembaraan anda!'],
        action: 'OPEN_MAP',
      },
    ],
  };
}
