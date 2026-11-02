import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Compass,
  Lock,
  Navigation,
  Play,
  Sparkles,
  X,
} from 'lucide-react';
import {
  AvatarId,
  BadgeId,
  ExplorationBadgeId,
  ExplorationStatus,
  JournalRecord,
  LibraryCategoryId,
  QuizQuestion,
  RegionId,
} from '../types/game';
import { QUIZ_QUESTIONS, getQuestionsByMission } from '../data/questions';
import {
  EXPLORATION_BADGES_INFO,
  HIDDEN_MAGIC_BOOKS,
  REGION_DIRECTORY,
} from '../data/sideActivities';
import { PixelPortrait } from './PixelPortrait';
import { soundEngine } from '../audio/soundEngine';

export type LocationSubModalKind =
  | { type: 'MISSION_LIST'; title: string; subtitle: string; questionIds: number[] }
  | { type: 'SAKURA_NOTICE' }
  | { type: 'CASTLE_DEWAN_UTAMA' }
  | { type: 'CASTLE_BILIK_KRISTAL' }
  | { type: 'CASTLE_PERPUSTAKAAN_DIRAJA' }
  | { type: 'CASTLE_BILIK_PETA' }
  | { type: 'CASTLE_DEWAN_WIRA' }
  | { type: 'LIBRARY_LARAS_BAHASA' }
  | { type: 'FOREST_EXPLORE' }
  | { type: 'FOREST_CLUES' }
  | { type: 'FOREST_WORD_CHALLENGE' }
  | { type: 'FOREST_MINI_QUIZ' }
  | { type: 'VILLAGE_RUMAH_ILMU' }
  | { type: 'VILLAGE_TOKOH' }
  | { type: 'VILLAGE_SIGNBOARDS' }
  | { type: 'VILLAGE_PRACTICE' }
  | { type: 'VILLAGE_INTERACTIVE' }
  | { type: 'BENTENG_CRYSTAL_CHECK' }
  | { type: 'BENTENG_SAH_WIRA' }
  | { type: 'BENTENG_RESTORE_GATE' };

interface LocationActivityModalProps {
  modal: LocationSubModalKind | null;
  playerName: string;
  avatarId: AvatarId;
  score: number;
  crystalsCount: number;
  badges: BadgeId[];
  explorationBadges: ExplorationBadgeId[];
  completedQuestions: Record<number, JournalRecord>;
  foundHiddenBooks: Record<string, boolean>;
  getRegionStatus: (regionId: RegionId) => ExplorationStatus;
  onClose: () => void;
  onLaunchQuestion: (question: QuizQuestion) => void;
  onOpenLearningCategory: (cat: LibraryCategoryId | null) => void;
  onTalkNpcId: (npcId: string) => void;
  onDiscoverBook: (bookId: string) => void;
  onMarkRegionExplored: (regionId: RegionId) => void;
  onEnterRpgTilemap: () => void;
  onOpenWorldMap: () => void;
  onTravelRegion: (regionId: RegionId) => void;
  onTriggerVictory: () => void;
}

const FOREST_CLASSIFICATION_ITEMS = [
  {
    word: 'Cendawan',
    correct: 'Kata Nama',
    explain: '“Cendawan” menamakan benda atau tumbuh-tumbuhan di hutan.',
  },
  {
    word: 'Menyiasat',
    correct: 'Kata Kerja',
    explain: '“Menyiasat” merujuk perbuatan atau tindakan yang dilakukan.',
  },
  {
    word: 'Indah',
    correct: 'Kata Adjektif',
    explain: '“Indah” menerangkan sifat atau keadaan sesuatu benda.',
  },
  {
    word: 'Daripada',
    correct: 'Kata Tugas',
    explain: '“Daripada” ialah kata sendi nama di bawah golongan Kata Tugas.',
  },
] as const;

const FOREST_MINI_QUIZ_ITEMS = [
  {
    prompt: 'Pilih penggunaan kata sendi nama tempat yang betul:',
    options: ['Diatas jambatan kayu', 'Di atas jambatan kayu', 'Di-atas jambatan kayu'],
    answerIdx: 1,
    note: 'Kata sendi nama “di” yang menunjukkan tempat mesti dijarakkan daripada kata arah “atas”.',
  },
  {
    prompt: 'Manakah ejaan kata majmuk mantap yang tepat?',
    options: ['Tanggung jawab', 'Tanggung-jawab', 'Tanggungjawab'],
    answerIdx: 2,
    note: '“Tanggungjawab” merupakan satu daripada 15 kata majmuk mantap yang dieja rapat.',
  },
  {
    prompt: 'Pilih ayat larangan yang paling gramatis:',
    options: [
      'Tolong jangan memetik bunga.',
      'Jangan memetik bunga di taman ini.',
      'Sila jangan memetik bunga.',
    ],
    answerIdx: 1,
    note: 'Kata permintaan “tolong” atau “sila” tidak digabungkan terus dengan kata larangan “jangan”.',
  },
];

const VILLAGE_SIGNBOARDS_DATA = [
  {
    id: 'sb1',
    wrong: 'DI LARANG MEMIJAK RUMPUT',
    right: 'DILARANG MEMIJAK RUMPUT',
    rule: 'Awalan pasif “di-” pada kata kerja “dilarang” ditulis rapat tanpa jarak.',
  },
  {
    id: 'sb2',
    wrong: 'GERAI GORENG PISANG PANAS',
    right: 'GERAI PISANG GORENG PANAS',
    rule: 'Hukum D-M (Diterangkan-Menerangkan): benda yang diterangkan (“Pisang”) mendahului cara masakan (“Goreng”).',
  },
  {
    id: 'sb3',
    wrong: 'SILA TANGGAL KASUT DI SINI',
    right: 'SILA TANGGALKAN KASUT DI SINI',
    rule: 'Kata kerja transitif berakhiran “-kan” (“tanggalkan”) diperlukan apabila diikuti objek “kasut”.',
  },
  {
    id: 'sb4',
    wrong: 'KEDAI RUNCIT KAMPUNG — BUKA DARI 8 PAGI KE 9 MALAM',
    right: 'KEDAI RUNCIT KAMPUNG — DIBUKA DARI PUKUL 8.00 PAGI HINGGA 9.00 MALAM',
    rule: 'Pasangan kata sendi masa yang tepat ialah “dari ... hingga ...”.',
  },
];

const VILLAGE_BAKU_MATCH = [
  {
    situation: 'Menjemput tetamu masuk ke Rumah Ilmu Kampung:',
    wrongOpt: 'Sila masuk ke dalam rumah.',
    rightOpt: 'Silalah masuk ke Rumah Ilmu.',
    explain: 'Ungkapan silaan yang santun dan ringkas mengelakkan lewah makna.',
  },
  {
    situation: 'Menyatakan asal bahan kraftangan rotan kampung:',
    wrongOpt: 'Bakul ini diperbuat dari rotan.',
    rightOpt: 'Bakul ini diperbuat daripada rotan.',
    explain: 'Kata sendi “daripada” digunakan untuk menyatakan punca atau asal kejadian bahan.',
  },
  {
    situation: 'Menulis kata ganda penuh bagi penduduk kampung:',
    wrongOpt: 'Kanak2 bermain di halaman.',
    rightOpt: 'Kanak-kanak bermain di halaman.',
    explain: 'Dalam penulisan bahasa Melayu baku, kata ganda menggunakan tanda sempang (-), bukan angka 2.',
  },
];

export const LocationActivityModal: React.FC<LocationActivityModalProps> = ({
  modal,
  playerName,
  avatarId,
  score,
  crystalsCount,
  badges,
  explorationBadges,
  completedQuestions,
  foundHiddenBooks,
  getRegionStatus,
  onClose,
  onLaunchQuestion,
  onOpenLearningCategory,
  onTalkNpcId,
  onDiscoverBook,
  onMarkRegionExplored,
  onEnterRpgTilemap,
  onOpenWorldMap,
  onTravelRegion,
  onTriggerVictory,
}) => {
  // Interactive mini-states for Forest & Village side activities
  const [wordStep, setWordStep] = useState(0);
  const [wordFeedback, setWordFeedback] = useState<string | null>(null);
  const [miniQuizStep, setMiniQuizStep] = useState(0);
  const [miniQuizFeedback, setMiniQuizFeedback] = useState<{
    correct: boolean;
    text: string;
  } | null>(null);
  const [flippedSigns, setFlippedSigns] = useState<Record<string, boolean>>({});
  const [villageStep, setVillageStep] = useState(0);
  const [villageFeedback, setVillageFeedback] = useState<string | null>(null);

  if (!modal) return null;

  const m1Solved = getQuestionsByMission(1).filter((q) => completedQuestions[q.id]).length;
  const m2Solved = getQuestionsByMission(2).filter((q) => completedQuestions[q.id]).length;
  const m3Solved = getQuestionsByMission(3).filter((q) => completedQuestions[q.id]).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-3xl max-h-[90vh] pixel-panel-purple flex flex-col overflow-hidden">
        {/* ===============================================================
            1. MISSION_LIST (Taman Sakura, Pasar Perkataan, Menara Media, Benteng Wira)
           =============================================================== */}
        {modal.type === 'MISSION_LIST' && (() => {
          const questions = modal.questionIds
            .map((id) => QUIZ_QUESTIONS.find((q) => q.id === id))
            .filter((q): q is QuizQuestion => Boolean(q));
          const missionNum = questions[0]?.mission ?? 1;
          const prereqLocked =
            (missionNum === 2 && m1Solved < 10) || (missionNum === 3 && m2Solved < 10);
          const nextUnanswered = questions.find((q) => !completedQuestions[q.id]);

          return (
            <>
              <div className="px-5 py-3.5 bg-[#221445] border-b-3 border-[#f6c445] flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-pixel font-bold text-xl sm:text-2xl text-[#fde047]">
                    {modal.title}
                  </h3>
                  <p className="text-xs text-[#e9d5ff]">{modal.subtitle}</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-9 h-9 pixel-btn-purple flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pixel-scroll p-4 sm:p-5 space-y-4">
                {prereqLocked && (
                  <div className="p-3.5 bg-[#3b1d70] border-2 border-[#facc15] text-xs sm:text-sm text-[#fef08a] flex items-center gap-2.5">
                    <Lock className="w-5 h-5 shrink-0 text-[#fde047]" />
                    <span>
                      Kawasan ini bebas diterokai! Namun cabaran kuiz{' '}
                      <strong>Misi {missionNum}</strong> akan dibuka sebaik sahaja kamu menyelesaikan{' '}
                      <strong>Misi {missionNum - 1}</strong> terlebih dahulu.
                    </span>
                  </div>
                )}

                {nextUnanswered && !prereqLocked && (
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playButtonClick();
                      onClose();
                      onLaunchQuestion(nextUnanswered);
                    }}
                    className="w-full py-3 px-4 pixel-btn-gold font-pixel font-bold text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>MULAKAN {nextUnanswered.title.toUpperCase()}</span>
                  </button>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {questions.map((q) => {
                    const solved = Boolean(completedQuestions[q.id]);
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => {
                          soundEngine.playButtonClick();
                          onClose();
                          onLaunchQuestion(q);
                        }}
                        className={`p-3 border-2 text-left flex items-center justify-between gap-2.5 cursor-pointer transition-colors ${
                          solved
                            ? 'bg-[#064e3b] border-[#34d399] text-[#ecfdf5]'
                            : 'bg-[#1b1138] hover:bg-[#281952] border-[#5b3ea8] text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <PixelPortrait mode="object" objectKind={q.objectKind} size={34} />
                          <div className="min-w-0">
                            <div className="font-pixel font-bold text-xs sm:text-sm text-[#fde047] truncate">
                              {q.title}
                            </div>
                            <div className="text-[11px] text-[#cbd5e1] truncate">
                              {q.objectName}
                            </div>
                          </div>
                        </div>
                        <span className="font-pixel font-bold text-[11px] shrink-0">
                          {solved ? '✓ SELESAI' : 'SIASAT'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          );
        })()}

        {/* ===============================================================
            2. PAPAN NOTIS TAMAN SAKURA BAHASA
           =============================================================== */}
        {modal.type === 'SAKURA_NOTICE' && (() => {
          const sakuraBook = HIDDEN_MAGIC_BOOKS[0];
          const hasBook = Boolean(foundHiddenBooks[sakuraBook.id]);
          const q1 = QUIZ_QUESTIONS[0];
          return (
            <>
              <div className="px-5 py-3.5 bg-[#221445] border-b-3 border-[#f6c445] flex items-center justify-between">
                <h3 className="font-pixel font-bold text-xl text-[#fde047]">
                  PAPAN NOTIS TAMAN SAKURA BAHASA
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-9 h-9 pixel-btn-purple flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4 overflow-y-auto pixel-scroll">
                <div className="pixel-panel-parchment p-4 space-y-2.5">
                  <div className="font-pixel font-bold text-base text-[#581c87]">
                    PENGUMUMAN DETEKTIF BAHASA:
                  </div>
                  <p className="text-sm font-semibold text-[#291509] leading-relaxed">
                    1. Selamat datang ke Taman Sakura Bahasa! Terdapat 10 objek siasatan Misi 1 di
                    sekitar taman ini (Soalan 1 hingga Soalan 10).
                  </p>
                  <p className="text-sm font-semibold text-[#291509] leading-relaxed">
                    2. Perhatikan penggunaan kata perintah (Sila, Tolong, Jangan, Mohon), kata sendi
                    nama (“di atas”), serta ejaan kata pinjaman (“staf”).
                  </p>
                </div>

                <div className="p-4 bg-[#190f36] border-2 border-[#facc15] flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-pixel font-bold text-sm text-[#fde047]">
                      {sakuraBook.title} — {sakuraBook.wisdomTitle}
                    </div>
                    <p className="text-xs text-[#e9d5ff] mt-1">{sakuraBook.wisdomText}</p>
                  </div>
                  {!hasBook ? (
                    <button
                      type="button"
                      onClick={() => onDiscoverBook(sakuraBook.id)}
                      className="px-3.5 py-2 pixel-btn-gold font-pixel font-bold text-xs cursor-pointer shrink-0"
                    >
                      KUMPUL BUKU AJAIB #1
                    </button>
                  ) : (
                    <span className="text-xs font-pixel text-[#86efac]">✓ TELAH DIKUMPUL</span>
                  )}
                </div>

                <div className="flex flex-wrap justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onTalkNpcId('cikgu_salmah');
                    }}
                    className="px-4 py-2 pixel-btn-purple font-pixel font-bold text-xs cursor-pointer"
                  >
                    BERBUAL DENGAN CIKGU SALMAH
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLaunchQuestion(q1);
                    }}
                    className="px-4 py-2 pixel-btn-gold font-pixel font-bold text-xs cursor-pointer"
                  >
                    SIASAT NOTIS SOALAN 1
                  </button>
                </div>
              </div>
            </>
          );
        })()}

        {/* ===============================================================
            3. ISTANA KRISTAL KOTA — 5 BILIK DIRAJA
           =============================================================== */}
        {modal.type === 'CASTLE_DEWAN_UTAMA' && (
          <>
            <div className="px-5 py-3.5 bg-[#221445] border-b-3 border-[#f6c445] flex items-center justify-between">
              <h3 className="font-pixel font-bold text-xl text-[#fde047]">
                DEWAN UTAMA — ISTANA KRISTAL KOTA
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 pixel-btn-purple flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto pixel-scroll">
              <div className="pixel-panel-parchment p-4 space-y-2">
                <h4 className="font-pixel font-bold text-base text-[#581c87]">
                  TITAH PEMULIHAN KERAJAAN TATABAHASA
                </h4>
                <p className="text-sm font-semibold text-[#291509] leading-relaxed">
                  Selamat datang, <strong>{playerName}</strong>! Dewan Utama ini merupakan pusat
                  pentadbiran Kerajaan Kota Tatabahasa. Setiap Kristal Kata yang kamu pulihkan
                  mengembalikan seri cahaya ke atas menara istana ini.
                </p>
                <p className="text-xs font-bold text-[#047857]">
                  Status Semasa: {crystalsCount} / 30 Kristal Kata telah dipulihkan.
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onTalkNpcId('penjaga_istana');
                  }}
                  className="px-4 py-2 pixel-btn-blue font-pixel font-bold text-xs cursor-pointer"
                >
                  BERBUAL PENJAGA ISTANA
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEnterRpgTilemap();
                  }}
                  className="px-4 py-2 pixel-btn-gold font-pixel font-bold text-xs cursor-pointer"
                >
                  TEROKA RUANG DALAM ISTANA (MOD RPG 2D)
                </button>
              </div>
            </div>
          </>
        )}

        {modal.type === 'CASTLE_BILIK_KRISTAL' && (
          <>
            <div className="px-5 py-3.5 bg-[#221445] border-b-3 border-[#f6c445] flex items-center justify-between">
              <div>
                <h3 className="font-pixel font-bold text-xl text-[#fde047]">
                  BILIK KRISTAL — 30 RUANG KRISTAL KATA
                </h3>
                <p className="text-xs text-[#e9d5ff]">
                  Klik mana-mana ruang kristal untuk menyemak status atau menuju ke lokasinya ({crystalsCount}/30 bercahaya)
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 pixel-btn-purple flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 sm:p-5 overflow-y-auto pixel-scroll space-y-4">
              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2">
                {QUIZ_QUESTIONS.map((q) => {
                  const lit = Boolean(completedQuestions[q.id]);
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => {
                        soundEngine.playButtonClick();
                        onClose();
                        if (lit) {
                          onLaunchQuestion(q);
                        } else {
                          onTravelRegion(q.mapId);
                        }
                      }}
                      title={`${q.title} (${lit ? 'Telah Dipulihkan' : 'Klik untuk ke lokasi'})`}
                      className={`p-2 border-2 flex flex-col items-center gap-1 cursor-pointer transition-transform hover:scale-105 ${
                        lit
                          ? 'bg-[#0c4a6e] border-[#38bdf8] text-[#e0f2fe]'
                          : 'bg-[#1e1b2e] border-[#475569] text-[#94a3b8]'
                      }`}
                    >
                      <PixelPortrait mode="crystal" lit={lit} size={24} />
                      <span className="font-mono-num font-bold text-[10px]">#{q.id}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {modal.type === 'CASTLE_PERPUSTAKAAN_DIRAJA' && (() => {
          const istanaBook = HIDDEN_MAGIC_BOOKS[1];
          const hasBook = Boolean(foundHiddenBooks[istanaBook.id]);
          return (
            <>
              <div className="px-5 py-3.5 bg-[#221445] border-b-3 border-[#f6c445] flex items-center justify-between">
                <h3 className="font-pixel font-bold text-xl text-[#fde047]">
                  PERPUSTAKAAN DIRAJA — ARKIB KATA MANTAP
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-9 h-9 pixel-btn-purple flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4 overflow-y-auto pixel-scroll">
                <div className="pixel-panel-parchment p-4 space-y-2">
                  <div className="font-pixel font-bold text-base text-[#581c87]">
                    ARKIB DIRAJA: 15 KATA MAJMUK MANTAP
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-[#291509] leading-relaxed">
                    Antarabangsa · Beritahu · Bumiputera · Jawatankuasa · Kakitangan · Kerjasama ·
                    Olahraga · Matahari · Setiausaha · Sukarela · Suruhanjaya · Tandatangan ·
                    Tanggungjawab · Warganegara · Pesuruhjaya.
                  </p>
                </div>

                <div className="p-3.5 bg-[#190f36] border-2 border-[#facc15] flex items-center justify-between gap-3">
                  <div>
                    <div className="font-pixel font-bold text-sm text-[#fde047]">
                      {istanaBook.title}
                    </div>
                    <p className="text-xs text-[#e9d5ff]">{istanaBook.wisdomText}</p>
                  </div>
                  {!hasBook ? (
                    <button
                      type="button"
                      onClick={() => onDiscoverBook(istanaBook.id)}
                      className="px-3 py-2 pixel-btn-gold font-pixel font-bold text-xs cursor-pointer shrink-0"
                    >
                      KUMPUL KITAB #2
                    </button>
                  ) : (
                    <span className="text-xs font-pixel text-[#86efac]">✓ DIKUMPUL</span>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenLearningCategory('kata_majmuk');
                    }}
                    className="px-4 py-2.5 pixel-btn-gold font-pixel font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>BUKA MODUL KATA MAJMUK PENUH</span>
                  </button>
                </div>
              </div>
            </>
          );
        })()}

        {modal.type === 'CASTLE_BILIK_PETA' && (
          <>
            <div className="px-5 py-3.5 bg-[#221445] border-b-3 border-[#f6c445] flex items-center justify-between">
              <h3 className="font-pixel font-bold text-xl text-[#fde047]">
                BILIK PETA STRATEGI DIRAJA
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 pixel-btn-purple flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto pixel-scroll">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {REGION_DIRECTORY.map((reg) => {
                  const st = getRegionStatus(reg.id);
                  return (
                    <div
                      key={reg.id}
                      className="p-3 bg-[#190f36] border-2 border-[#5b3ea8] flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-pixel font-bold text-sm text-[#fde047]">
                          {reg.number}. {reg.name}
                        </div>
                        <div className="text-[11px] text-[#cbd5e1]">
                          {st === 'TELAH_DITEROKAI'
                            ? 'Telah Diterokai'
                            : st === 'SEDANG_DITEROKAI'
                            ? 'Sedang Diterokai'
                            : 'Belum Diterokai'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onTravelRegion(reg.id);
                        }}
                        className="px-2.5 py-1 pixel-btn-blue font-pixel font-bold text-[11px] cursor-pointer"
                      >
                        LAWAT
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenWorldMap();
                  }}
                  className="px-5 py-2.5 pixel-btn-gold font-pixel font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Compass className="w-4 h-4" />
                  <span>BUKA PETA DUNIA KERAJAAN</span>
                </button>
              </div>
            </div>
          </>
        )}

        {modal.type === 'CASTLE_DEWAN_WIRA' && (
          <>
            <div className="px-5 py-3.5 bg-[#221445] border-b-3 border-[#f6c445] flex items-center justify-between">
              <h3 className="font-pixel font-bold text-xl text-[#fde047]">
                DEWAN WIRA BAHASA
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 pixel-btn-purple flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto pixel-scroll">
              <div className="p-4 bg-[#190f36] border-3 border-[#facc15] flex items-center gap-4">
                <div className="p-2 bg-[#0e0820] border-2 border-[#fde047]">
                  <PixelPortrait mode="avatar" avatarId={avatarId} anim="reward" size={64} />
                </div>
                <div>
                  <div className="font-pixel font-bold text-xl text-[#fde047]">{playerName}</div>
                  <p className="text-xs sm:text-sm text-[#e9d5ff]">
                    Kristal Kata: <strong>{crystalsCount}/30</strong> · Markah:{' '}
                    <strong>{score}</strong> · Lencana Terkumpul:{' '}
                    <strong>{badges.length + explorationBadges.length}/8</strong>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {EXPLORATION_BADGES_INFO.map((b) => {
                  const unlocked = explorationBadges.includes(b.id);
                  return (
                    <div
                      key={b.id}
                      className={`p-3 border-2 ${
                        unlocked
                          ? 'bg-[#064e3b] border-[#34d399] text-[#ecfdf5]'
                          : 'bg-[#1b1138] border-[#4c3385] text-[#cbd5e1]'
                      }`}
                    >
                      <div className="font-pixel font-bold text-xs text-[#fde047] flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5" />
                        <span>{b.title}</span>
                      </div>
                      <p className="text-[11px] mt-1">{b.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ===============================================================
            4. PERPUSTAKAAN AJAIB — MODUL LARAS BAHASA
           =============================================================== */}
        {modal.type === 'LIBRARY_LARAS_BAHASA' && (() => {
          const libBook = HIDDEN_MAGIC_BOOKS[4];
          const hasBook = Boolean(foundHiddenBooks[libBook.id]);
          return (
            <>
              <div className="px-5 py-3.5 bg-[#221445] border-b-3 border-[#f6c445] flex items-center justify-between">
                <h3 className="font-pixel font-bold text-xl text-[#fde047]">
                  KITAB LARAS BAHASA, KATA SENDI & AYAT PERINTAH
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-9 h-9 pixel-btn-purple flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4 overflow-y-auto pixel-scroll">
                <div className="pixel-panel-parchment p-4 space-y-2.5 text-sm">
                  <div className="font-pixel font-bold text-base text-[#581c87]">
                    PANDUAN LARAS BAHASA RASMI & NOTIS AWAM:
                  </div>
                  <p className="font-semibold text-[#291509]">
                    • <strong>Laras Arahan & Silaan:</strong> Gunakan <em>“Sila”</em> untuk jemputan
                    sopan atau kewajipan umum (contoh: <em>“Sila letakkan troli...”</em> tanpa awalan{' '}
                    <em>meN-</em>).
                  </p>
                  <p className="font-semibold text-[#291509]">
                    • <strong>Laras Larangan:</strong> Gunakan <em>“Jangan”</em> atau{' '}
                    <em>“Usah”</em> secara tunggal tanpa digabungkan dengan <em>“Tolong”</em>.
                  </p>
                  <p className="font-semibold text-[#291509]">
                    • <strong>Laras Penghargaan:</strong> Ungkapan <em>“Kerjasama anda amatlah kami hargai”</em>{' '}
                    tidak memerlukan perkataan <em>“Tolong”</em> di hadapannya.
                  </p>
                </div>

                <div className="p-3.5 bg-[#190f36] border-2 border-[#facc15] flex items-center justify-between gap-3">
                  <div>
                    <div className="font-pixel font-bold text-sm text-[#fde047]">
                      {libBook.title} — {libBook.wisdomTitle}
                    </div>
                    <p className="text-xs text-[#e9d5ff]">{libBook.wisdomText}</p>
                  </div>
                  {!hasBook ? (
                    <button
                      type="button"
                      onClick={() => onDiscoverBook(libBook.id)}
                      className="px-3 py-2 pixel-btn-gold font-pixel font-bold text-xs cursor-pointer shrink-0"
                    >
                      KUMPUL KITAB #5
                    </button>
                  ) : (
                    <span className="text-xs font-pixel text-[#86efac]">✓ DIKUMPUL</span>
                  )}
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenLearningCategory('kata_sendi_nama');
                    }}
                    className="px-4 py-2 pixel-btn-blue font-pixel font-bold text-xs cursor-pointer"
                  >
                    KITAB KATA SENDI NAMA
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenLearningCategory('ayat_perintah');
                    }}
                    className="px-4 py-2 pixel-btn-gold font-pixel font-bold text-xs cursor-pointer"
                  >
                    KITAB AYAT PERINTAH
                  </button>
                </div>
              </div>
            </>
          );
        })()}

        {/* ===============================================================
            5. HUTAN MISTERI PERKATAAN (4 HOTSPOTS)
           =============================================================== */}
        {modal.type === 'FOREST_EXPLORE' && (
          <>
            <div className="px-5 py-3.5 bg-[#221445] border-b-3 border-[#f6c445] flex items-center justify-between">
              <h3 className="font-pixel font-bold text-xl text-[#fde047]">
                TEROKAI HUTAN MISTERI PERKATAAN
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 pixel-btn-purple flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto pixel-scroll">
              <div className="pixel-panel-parchment p-4 space-y-2 text-sm">
                <h4 className="font-pixel font-bold text-base text-[#581c87]">
                  EMPAT BATU BERSURAT GOLONGAN KATA
                </h4>
                <p className="font-semibold text-[#291509]">
                  1. <strong>Kata Nama:</strong> Menamakan orang, haiwan, benda atau tempat.
                </p>
                <p className="font-semibold text-[#291509]">
                  2. <strong>Kata Kerja:</strong> Menunjukkan perbuatan atau tindakan.
                </p>
                <p className="font-semibold text-[#291509]">
                  3. <strong>Kata Adjektif:</strong> Menerangkan sifat atau keadaan.
                </p>
                <p className="font-semibold text-[#291509]">
                  4. <strong>Kata Tugas:</strong> Kata hubung, kata sendi nama, kata perintah & partikel.
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onTalkNpcId('peri_perkataan');
                  }}
                  className="px-4 py-2 pixel-btn-purple font-pixel font-bold text-xs cursor-pointer"
                >
                  BERBUAL PERI PERKATAAN
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onMarkRegionExplored('hutan_misteri');
                    onClose();
                    onEnterRpgTilemap();
                  }}
                  className="px-4 py-2.5 pixel-btn-gold font-pixel font-bold text-xs cursor-pointer"
                >
                  BERJALAN DI HUTAN (MOD RPG 2D)
                </button>
              </div>
            </div>
          </>
        )}

        {modal.type === 'FOREST_CLUES' && (() => {
          const forestBook = HIDDEN_MAGIC_BOOKS[2];
          const hasBook = Boolean(foundHiddenBooks[forestBook.id]);
          return (
            <>
              <div className="px-5 py-3.5 bg-[#221445] border-b-3 border-[#f6c445] flex items-center justify-between">
                <h3 className="font-pixel font-bold text-xl text-[#fde047]">
                  CARI PETUNJUK RIMBA PERKATAAN
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-9 h-9 pixel-btn-purple flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4 overflow-y-auto pixel-scroll">
                <div className="pixel-panel-parchment p-4 space-y-2 text-xs sm:text-sm font-semibold text-[#291509]">
                  <div className="font-pixel font-bold text-base text-[#581c87]">
                    PETUNJUK RAHSIA WIRA TATABAHASA:
                  </div>
                  <p>• <strong>Petunjuk #1 (Imbuhan):</strong> Kata dasar <em>keluar</em> + <em>meN-...-kan</em> menjadi <strong>mengeluarkan</strong> (satu huruf g sahaja).</p>
                  <p>• <strong>Petunjuk #2 (Awalan beR-):</strong> Kata dasar <em>kerjasama</em> menerima awalan <em>be-</em> menjadi <strong>bekerjasama</strong>.</p>
                  <p>• <strong>Petunjuk #3 (Kata Ganda):</strong> Kata ganda berentak seperti <strong>gotong-royong</strong> dan kata ganda berimbuhan seperti <strong>alu-aluan</strong> wajib bertanda sempang.</p>
                </div>

                <div className="p-3.5 bg-[#190f36] border-2 border-[#facc15] flex items-center justify-between gap-3">
                  <div>
                    <div className="font-pixel font-bold text-sm text-[#fde047]">
                      {forestBook.title} — {forestBook.wisdomTitle}
                    </div>
                    <p className="text-xs text-[#e9d5ff]">{forestBook.wisdomText}</p>
                  </div>
                  {!hasBook ? (
                    <button
                      type="button"
                      onClick={() => onDiscoverBook(forestBook.id)}
                      className="px-3 py-2 pixel-btn-gold font-pixel font-bold text-xs cursor-pointer shrink-0"
                    >
                      KUMPUL KITAB #3
                    </button>
                  ) : (
                    <span className="text-xs font-pixel text-[#86efac]">✓ DIKUMPUL</span>
                  )}
                </div>
              </div>
            </>
          );
        })()}

        {modal.type === 'FOREST_WORD_CHALLENGE' && (() => {
          const item = FOREST_CLASSIFICATION_ITEMS[wordStep % FOREST_CLASSIFICATION_ITEMS.length];
          return (
            <>
              <div className="px-5 py-3.5 bg-[#221445] border-b-3 border-[#f6c445] flex items-center justify-between">
                <h3 className="font-pixel font-bold text-xl text-[#fde047]">
                  CABARAN PERKATAAN — GOLONGAN KATA
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-9 h-9 pixel-btn-purple flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="pixel-panel-parchment p-4 text-center space-y-2">
                  <div className="text-xs font-bold text-[#581c87]">
                    Perkataan {wordStep + 1} / {FOREST_CLASSIFICATION_ITEMS.length}
                  </div>
                  <div className="font-pixel font-bold text-2xl text-[#261505]">
                    “{item.word}”
                  </div>
                  <p className="text-xs font-semibold text-[#573619]">
                    Pilih golongan kata yang tepat bagi perkataan di atas:
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {(['Kata Nama', 'Kata Kerja', 'Kata Adjektif', 'Kata Tugas'] as const).map(
                    (cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          if (cat === item.correct) {
                            soundEngine.playCorrect();
                            setWordFeedback(`✓ Tepat sekali! ${item.explain}`);
                            onMarkRegionExplored('hutan_misteri');
                          } else {
                            soundEngine.playWrong();
                            setWordFeedback(`Belum tepat. Cuba kenal pasti fungsi perkataan “${item.word}”.`);
                          }
                        }}
                        className="py-2.5 px-3 pixel-btn-blue font-pixel font-bold text-xs sm:text-sm cursor-pointer"
                      >
                        {cat}
                      </button>
                    )
                  )}
                </div>

                {wordFeedback && (
                  <div className="p-3 bg-[#190f36] border-2 border-[#facc15] text-xs sm:text-sm text-[#fef08a] flex items-center justify-between gap-3">
                    <span>{wordFeedback}</span>
                    {wordFeedback.startsWith('✓') && (
                      <button
                        type="button"
                        onClick={() => {
                          setWordFeedback(null);
                          setWordStep((s) => (s + 1) % FOREST_CLASSIFICATION_ITEMS.length);
                        }}
                        className="px-3 py-1.5 pixel-btn-gold font-pixel font-bold text-xs cursor-pointer shrink-0"
                      >
                        SETERUSNYA
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          );
        })()}

        {modal.type === 'FOREST_MINI_QUIZ' && (() => {
          const q = FOREST_MINI_QUIZ_ITEMS[miniQuizStep % FOREST_MINI_QUIZ_ITEMS.length];
          return (
            <>
              <div className="px-5 py-3.5 bg-[#221445] border-b-3 border-[#f6c445] flex items-center justify-between">
                <h3 className="font-pixel font-bold text-xl text-[#fde047]">
                  KUIZ MINI RIMBA PERKATAAN ({miniQuizStep + 1}/{FOREST_MINI_QUIZ_ITEMS.length})
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-9 h-9 pixel-btn-purple flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="pixel-panel-parchment p-4 space-y-3">
                  <p className="font-bold text-sm sm:text-base text-[#261505]">{q.prompt}</p>
                  <div className="space-y-2">
                    {q.options.map((opt, idx) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          const ok = idx === q.answerIdx;
                          if (ok) {
                            soundEngine.playCorrect();
                            onMarkRegionExplored('hutan_misteri');
                          } else {
                            soundEngine.playWrong();
                          }
                          setMiniQuizFeedback({
                            correct: ok,
                            text: ok ? `✓ Betul! ${q.note}` : `Belum tepat! Petunjuk: ${q.note}`,
                          });
                        }}
                        className="w-full p-2.5 bg-white hover:bg-[#fef9c3] border-2 border-[#7c4a21] text-left font-bold text-xs sm:text-sm text-[#261505] cursor-pointer"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {miniQuizFeedback && (
                  <div
                    className={`p-3 border-2 text-xs sm:text-sm flex items-center justify-between gap-3 ${
                      miniQuizFeedback.correct
                        ? 'bg-[#064e3b] border-[#34d399] text-[#ecfdf5]'
                        : 'bg-[#7f1d1d] border-[#f87171] text-[#fef2f2]'
                    }`}
                  >
                    <span>{miniQuizFeedback.text}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setMiniQuizFeedback(null);
                        setMiniQuizStep((s) => (s + 1) % FOREST_MINI_QUIZ_ITEMS.length);
                      }}
                      className="px-3 py-1.5 pixel-btn-gold font-pixel font-bold text-xs cursor-pointer shrink-0"
                    >
                      SOALAN LAIN
                    </button>
                  </div>
                )}
              </div>
            </>
          );
        })()}

        {/* ===============================================================
            6. KAMPUNG TATABAHASA (5 HOTSPOTS)
           =============================================================== */}
        {modal.type === 'VILLAGE_RUMAH_ILMU' && (() => {
          const villageBook = HIDDEN_MAGIC_BOOKS[3];
          const hasBook = Boolean(foundHiddenBooks[villageBook.id]);
          return (
            <>
              <div className="px-5 py-3.5 bg-[#221445] border-b-3 border-[#f6c445] flex items-center justify-between">
                <h3 className="font-pixel font-bold text-xl text-[#fde047]">
                  RUMAH ILMU KAMPUNG TATABAHASA
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-9 h-9 pixel-btn-purple flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4 overflow-y-auto pixel-scroll">
                <div className="pixel-panel-parchment p-4 space-y-2 text-xs sm:text-sm font-semibold text-[#291509]">
                  <div className="font-pixel font-bold text-base text-[#581c87]">
                    RUMUS EMAS DESA: “DARI” LAWAN “DARIPADA”
                  </div>
                  <p>• <strong>DARI (Rumus ATM):</strong> Digunakan khusus untuk <strong>A</strong>rah, <strong>T</strong>empat, dan <strong>M</strong>asa (contoh: <em>dari kampung, dari pukul lapan pagi</em>).</p>
                  <p>• <strong>DARIPADA:</strong> Digunakan untuk punca/manusia, asal kejadian bahan, dan perbandingan (contoh: <em>surat daripada ibu, kuih daripada tepung beras</em>).</p>
                </div>

                <div className="p-3.5 bg-[#190f36] border-2 border-[#facc15] flex items-center justify-between gap-3">
                  <div>
                    <div className="font-pixel font-bold text-sm text-[#fde047]">
                      {villageBook.title}
                    </div>
                    <p className="text-xs text-[#e9d5ff]">{villageBook.wisdomText}</p>
                  </div>
                  {!hasBook ? (
                    <button
                      type="button"
                      onClick={() => onDiscoverBook(villageBook.id)}
                      className="px-3 py-2 pixel-btn-gold font-pixel font-bold text-xs cursor-pointer shrink-0"
                    >
                      KUMPUL KITAB #4
                    </button>
                  ) : (
                    <span className="text-xs font-pixel text-[#86efac]">✓ DIKUMPUL</span>
                  )}
                </div>
              </div>
            </>
          );
        })()}

        {modal.type === 'VILLAGE_TOKOH' && (
          <>
            <div className="px-5 py-3.5 bg-[#221445] border-b-3 border-[#f6c445] flex items-center justify-between">
              <h3 className="font-pixel font-bold text-xl text-[#fde047]">
                SUDUT TOKOH & PESANAN KETUA KAMPUNG
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 pixel-btn-purple flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="pixel-panel-parchment p-4 space-y-2 text-sm font-semibold text-[#291509]">
                <p>
                  “Bahasa jiwa bangsa. Di Kampung Tatabahasa, setiap penduduk memelihara ketepatan
                  ejaan, hukum D-M, dan kesantunan sapaan agar warisan ilmu kekal terpelihara.”
                </p>
                <p className="text-xs text-[#581c87] font-bold">
                  — Tok Ketua Kampung Tatabahasa
                </p>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onTalkNpcId('ketua_kampung');
                  }}
                  className="px-4 py-2.5 pixel-btn-gold font-pixel font-bold text-xs cursor-pointer"
                >
                  BERBUAL DENGAN KETUA KAMPUNG
                </button>
              </div>
            </div>
          </>
        )}

        {modal.type === 'VILLAGE_SIGNBOARDS' && (
          <>
            <div className="px-5 py-3.5 bg-[#221445] border-b-3 border-[#f6c445] flex items-center justify-between">
              <h3 className="font-pixel font-bold text-xl text-[#fde047]">
                PEMERIKSAAN PAPAN TANDA KAMPUNG
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 pixel-btn-purple flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 overflow-y-auto pixel-scroll">
              <p className="text-xs text-[#e9d5ff]">
                Tekan setiap papan tanda di bawah untuk membetulkan kesalahan ejaan dan tatabahasa:
              </p>
              {VILLAGE_SIGNBOARDS_DATA.map((sb) => {
                const fixed = Boolean(flippedSigns[sb.id]);
                return (
                  <button
                    key={sb.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playButtonClick();
                      setFlippedSigns((prev) => ({ ...prev, [sb.id]: !prev[sb.id] }));
                      onMarkRegionExplored('kampung_tatabahasa');
                    }}
                    className={`w-full p-3.5 border-2 text-left cursor-pointer transition-colors ${
                      fixed
                        ? 'bg-[#064e3b] border-[#34d399] text-[#ecfdf5]'
                        : 'bg-[#3b1c0e] border-[#f59e0b] text-[#fef3c7]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs font-pixel">
                      <span>{fixed ? '✓ PAPAN TANDA DIBETULKAN' : 'KLIK UNTUK BETULKAN'}</span>
                    </div>
                    <div className="font-bold text-sm sm:text-base mt-1">
                      {fixed ? sb.right : sb.wrong}
                    </div>
                    {fixed && <p className="text-xs text-[#a7f3d0] mt-1">{sb.rule}</p>}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {modal.type === 'VILLAGE_PRACTICE' && (
          <>
            <div className="px-5 py-3.5 bg-[#221445] border-b-3 border-[#f6c445] flex items-center justify-between">
              <h3 className="font-pixel font-bold text-xl text-[#fde047]">
                AMALAN BAHASA SANTUN HARIAN
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 pixel-btn-purple flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 overflow-y-auto pixel-scroll">
              <div className="pixel-panel-parchment p-4 space-y-2.5 text-xs sm:text-sm font-semibold text-[#291509]">
                <p>1. <strong>Kata Ganti Nama Diri Hormat:</strong> Gunakan <em>tuan, puan, encik, cikgu</em> atau <em>saudara</em> mengikut konteks rasmi dan masyarakat.</p>
                <p>2. <strong>Partikel Penegas Sopan:</strong> Gunakan partikel <em>-lah</em> pada ayat perintah seperti <em>“Masuklah”</em> atau <em>“Nikmatilah”</em> bagi melembutkan nada suruhan.</p>
                <p>3. <strong>Elakkan Bahasa Rojak:</strong> Gunakan istilah bahasa Melayu baku seperti <em>staf</em> (bukan staff), <em>infak</em> (bukan infaq), dan <em>mihun</em> (bukan mee hun).</p>
              </div>
            </div>
          </>
        )}

        {modal.type === 'VILLAGE_INTERACTIVE' && (() => {
          const cur = VILLAGE_BAKU_MATCH[villageStep % VILLAGE_BAKU_MATCH.length];
          return (
            <>
              <div className="px-5 py-3.5 bg-[#221445] border-b-3 border-[#f6c445] flex items-center justify-between">
                <h3 className="font-pixel font-bold text-xl text-[#fde047]">
                  AKTIVITI INTERAKTIF — AYAT BAKU KAMPUNG
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-9 h-9 pixel-btn-purple flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="pixel-panel-parchment p-4 space-y-3">
                  <div className="text-xs font-bold text-[#581c87]">
                    Situasi {villageStep + 1} / {VILLAGE_BAKU_MATCH.length}
                  </div>
                  <p className="font-bold text-sm sm:text-base text-[#261505]">{cur.situation}</p>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playWrong();
                        setVillageFeedback(`Kurang tepat. ${cur.explain}`);
                      }}
                      className="w-full p-2.5 bg-white hover:bg-[#fef9c3] border-2 border-[#7c4a21] text-left font-bold text-xs sm:text-sm text-[#261505] cursor-pointer"
                    >
                      A. {cur.wrongOpt}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playCorrect();
                        onMarkRegionExplored('kampung_tatabahasa');
                        setVillageFeedback(`✓ Tepat sekali! ${cur.explain}`);
                      }}
                      className="w-full p-2.5 bg-white hover:bg-[#fef9c3] border-2 border-[#7c4a21] text-left font-bold text-xs sm:text-sm text-[#261505] cursor-pointer"
                    >
                      B. {cur.rightOpt}
                    </button>
                  </div>
                </div>

                {villageFeedback && (
                  <div className="p-3 bg-[#190f36] border-2 border-[#facc15] text-xs sm:text-sm text-[#fef08a] flex items-center justify-between gap-2">
                    <span>{villageFeedback}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setVillageFeedback(null);
                        setVillageStep((s) => (s + 1) % VILLAGE_BAKU_MATCH.length);
                      }}
                      className="px-3 py-1.5 pixel-btn-gold font-pixel font-bold text-xs cursor-pointer shrink-0"
                    >
                      SETERUSNYA
                    </button>
                  </div>
                )}
              </div>
            </>
          );
        })()}

        {/* ===============================================================
            7. BENTENG WIRA BAHASA — KUMPUL KRISTAL / SAH WIRA / PULIHKAN KOTA
           =============================================================== */}
        {modal.type === 'BENTENG_CRYSTAL_CHECK' && (
          <>
            <div className="px-5 py-3.5 bg-[#221445] border-b-3 border-[#f6c445] flex items-center justify-between">
              <h3 className="font-pixel font-bold text-xl text-[#fde047]">
                STATUS PENGUMPULAN 30 KRISTAL KATA
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 pixel-btn-purple flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 pixel-panel-parchment space-y-2">
                  <div className="font-pixel font-bold text-sm text-[#581c87]">MISI 1</div>
                  <div className="font-mono-num font-extrabold text-xl text-[#261505]">
                    {m1Solved} / 10 Kristal
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onTravelRegion('taman_sakura');
                    }}
                    className="w-full py-1.5 pixel-btn-blue font-pixel font-bold text-xs cursor-pointer"
                  >
                    KE TAMAN SAKURA
                  </button>
                </div>

                <div className="p-3.5 pixel-panel-parchment space-y-2">
                  <div className="font-pixel font-bold text-sm text-[#581c87]">MISI 2</div>
                  <div className="font-mono-num font-extrabold text-xl text-[#261505]">
                    {m2Solved} / 10 Kristal
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onTravelRegion(m2Solved >= 6 ? 'menara_media' : 'pasar_perkataan');
                    }}
                    className="w-full py-1.5 pixel-btn-blue font-pixel font-bold text-xs cursor-pointer"
                  >
                    KE LOKASI MISI 2
                  </button>
                </div>

                <div className="p-3.5 pixel-panel-parchment space-y-2">
                  <div className="font-pixel font-bold text-sm text-[#581c87]">MISI 3</div>
                  <div className="font-mono-num font-extrabold text-xl text-[#261505]">
                    {m3Solved} / 10 Kristal
                  </div>
                  <span className="block text-[11px] font-bold text-[#047857]">
                    Di Benteng Wira Ini
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {modal.type === 'BENTENG_SAH_WIRA' && (
          <>
            <div className="px-5 py-3.5 bg-[#221445] border-b-3 border-[#f6c445] flex items-center justify-between">
              <h3 className="font-pixel font-bold text-xl text-[#fde047]">
                PENGESAHAN GELARAN WIRA BAHASA
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 pixel-btn-purple flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="pixel-panel-parchment p-4 space-y-2 text-sm">
                <p className="font-bold text-[#261505]">
                  {crystalsCount >= 30
                    ? `Tahniah, ${playerName}! Profesor Bahasa mengesahkan bahawa kamu telah memulihkan kesemua 30 Kristal Kata! Kamu kini layak mengaktifkan Gerbang Pemulihan Kota Tatabahasa!`
                    : `Wahai ${playerName}, kamu telah mengumpulkan ${crystalsCount} daripada 30 Kristal Kata. Lengkapkan baki ${
                        30 - crystalsCount
                      } cabaran untuk menerima pengiktirafan tertinggi Wira Bahasa!`}
                </p>
              </div>
              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onTalkNpcId('profesor_bahasa');
                  }}
                  className="px-4 py-2 pixel-btn-purple font-pixel font-bold text-xs cursor-pointer"
                >
                  BERBUAL PROFESOR BAHASA
                </button>
                {crystalsCount >= 30 && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onTriggerVictory();
                    }}
                    className="px-5 py-2.5 pixel-btn-gold font-pixel font-bold text-xs cursor-pointer"
                  >
                    PULIHKAN KOTA TATABAHASA!
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {modal.type === 'BENTENG_RESTORE_GATE' && (
          <>
            <div className="px-5 py-3.5 bg-[#221445] border-b-3 border-[#f6c445] flex items-center justify-between">
              <h3 className="font-pixel font-bold text-xl text-[#fde047]">
                GERBANG PEMULIHAN KOTA TATABAHASA
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 pixel-btn-purple flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-20 h-20 bg-[#140b29] border-3 border-[#facc15] flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-[#fde047]" />
              </div>
              <h4 className="font-pixel font-bold text-2xl text-[#fde047]">
                KUASA KRISTAL SEMASA: {crystalsCount} / 30
              </h4>
              <p className="text-sm text-[#e9d5ff] leading-relaxed max-w-lg mx-auto">
                Gerbang Kristal Utama memerlukan kesemua <strong>30 Kristal Kata</strong> daripada
                Misi 1, Misi 2, dan Misi 3 untuk memulihkan cahaya keemasan Kota Tatabahasa
                sepenuhnya. Selesaikan baki <strong>{30 - crystalsCount}</strong> soalan terlebih dahulu!
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 pixel-btn-gold font-pixel font-bold text-sm cursor-pointer"
              >
                TERUSKAN CABARAN
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
