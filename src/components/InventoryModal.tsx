import React from 'react';
import { Award, Backpack, BookOpen, Compass, KeyRound, Lightbulb, ScrollText, X } from 'lucide-react';
import { BadgeId, ExplorationBadgeId, JournalRecord } from '../types/game';
import {
  CASTLE_ROOMS_INFO,
  EXPLORATION_BADGES_INFO,
  HIDDEN_MAGIC_BOOKS,
  LIBRARY_CATEGORIES_INFO,
  MAIN_NPCS_LIST,
  REGION_DIRECTORY,
} from '../data/sideActivities';
import { PixelPortrait } from './PixelPortrait';
import { soundEngine } from '../audio/soundEngine';

interface InventoryModalProps {
  isOpen: boolean;
  crystalsCount: number;
  score: number;
  playerLevel: number;
  badges: BadgeId[];
  explorationBadges: ExplorationBadgeId[];
  foundBooksCount: number;
  visitedRegionsCount: number;
  talkedMainNpcsCount: number;
  readCategoriesCount: number;
  visitedCastleRoomsCount: number;
  completedQuestions: Record<number, JournalRecord>;
  onOpenJournal: () => void;
  onClose: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  crystalsCount,
  score,
  playerLevel,
  badges,
  explorationBadges,
  foundBooksCount,
  visitedRegionsCount,
  talkedMainNpcsCount,
  readCategoriesCount,
  visitedCastleRoomsCount,
  completedQuestions,
  onOpenJournal,
  onClose,
}) => {
  if (!isOpen) return null;

  const m1Done = badges.includes('lencana_detektif');
  const m2Done = badges.includes('lencana_pemburu');
  const m3Done = badges.includes('lencana_wira');

  const currentMissionText = !m1Done
    ? 'Misi 1: Detektif Bahasa di Taman Sakura Bahasa (Soalan 1–10)'
    : !m2Done
    ? 'Misi 2: Pemburu Kesalahan di Pasar Perkataan & Menara Media (Soalan 11–20)'
    : !m3Done
    ? 'Misi 3: Wira Tatabahasa di Benteng Wira Bahasa (Soalan 21–30)'
    : 'Semua Misi Selesai — Masuk Pintu Kristal Utama di Benteng Wira Bahasa!';

  const solvedCount = Object.keys(completedQuestions).length;

  const progressByBadge: Record<ExplorationBadgeId, string> = {
    lencana_pencari_buku: `${foundBooksCount} / ${HIDDEN_MAGIC_BOOKS.length} Buku Ajaib`,
    lencana_penjelajah: `${visitedRegionsCount} / ${REGION_DIRECTORY.length} Lokasi`,
    lencana_sahabat_bahasa: `${talkedMainNpcsCount} / ${MAIN_NPCS_LIST.length} NPC Utama`,
    lencana_pengumpul_ilmu: `${readCategoriesCount} / ${LIBRARY_CATEGORIES_INFO.length} Kategori`,
    lencana_peneroka_istana: `${visitedCastleRoomsCount} / ${CASTLE_ROOMS_INFO.length} Bilik Istana`,
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-5xl max-h-[92vh] pixel-panel-purple p-4 sm:p-6 my-auto space-y-5 overflow-y-auto pixel-scroll">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#5b3ea8]">
          <div className="flex items-center gap-3">
            <Backpack className="w-7 h-7 text-[#fde047]" />
            <div>
              <h2 className="font-pixel font-bold text-2xl text-[#fde047]">
                INVENTORI & KOLEKSI LENCANA WIRA
              </h2>
              <p className="text-xs sm:text-sm text-[#e9d5ff]">
                Tahap {playerLevel} · Jumlah Markah:{' '}
                <span className="font-mono-num font-bold text-[#fde047]">{score}</span> · Kristal Kata:{' '}
                <span className="font-mono-num font-bold text-[#7dd3fc]">{crystalsCount} / 30</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playButtonClick();
              onClose();
            }}
            className="w-10 h-10 pixel-btn-purple flex items-center justify-center cursor-pointer"
            aria-label="Tutup Inventori"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 6 Required RPG Inventory Slots */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* 1. Kristal Kata */}
          <div className="p-3.5 bg-[#1d1238] border-3 border-[#38bdf8] flex items-center gap-3">
            <PixelPortrait mode="crystal" lit={crystalsCount > 0} size={48} />
            <div>
              <h3 className="font-pixel font-bold text-base text-[#7dd3fc]">Kristal Kata</h3>
              <p className="font-mono-num font-bold text-lg text-white">{crystalsCount} / 30</p>
              <p className="text-xs text-[#cbd5e1]">Dipamerkan di Bilik Kristal Istana</p>
            </div>
          </div>

          {/* 2. Jurnal Bahasa */}
          <div className="p-3.5 bg-[#1d1238] border-3 border-[#f6c445] flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <BookOpen className="w-9 h-9 text-[#fde047] shrink-0" />
              <div>
                <h3 className="font-pixel font-bold text-base text-[#fde047]">Jurnal Bahasa</h3>
                <p className="text-xs text-[#e9d5ff]">{solvedCount} / 30 Rekod Disimpan</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                soundEngine.playBookOpen();
                onOpenJournal();
              }}
              className="px-2.5 py-1.5 pixel-btn-gold font-pixel font-bold text-xs cursor-pointer"
            >
              BUKA
            </button>
          </div>

          {/* 3. Akses Kawasan & Misi */}
          <div className="p-3.5 bg-[#1d1238] border-3 border-[#a78bfa] flex items-center gap-3">
            <KeyRound className="w-9 h-9 text-[#facc15] shrink-0" />
            <div>
              <h3 className="font-pixel font-bold text-base text-[#fde047]">Kunci Cabaran</h3>
              <p className="text-xs text-[#e9d5ff]">
                {m2Done
                  ? 'Semua 8 Kawasan & 3 Misi Dibuka'
                  : m1Done
                  ? '8 Kawasan Terbuka · Kuiz Misi 1 & 2 Aktif'
                  : 'Semua 8 Kawasan Bebas Diterokai!'}
              </p>
            </div>
          </div>

          {/* 4. Skrol Misi */}
          <div className="p-3.5 bg-[#1d1238] border-3 border-[#a78bfa] flex items-center gap-3 sm:col-span-2">
            <ScrollText className="w-9 h-9 text-[#f472b6] shrink-0" />
            <div>
              <h3 className="font-pixel font-bold text-base text-[#f9a8d4]">Skrol Misi Semasa</h3>
              <p className="text-xs sm:text-sm font-semibold text-white">{currentMissionText}</p>
            </div>
          </div>

          {/* 5. Kanta Petunjuk */}
          <div className="p-3.5 bg-[#1d1238] border-3 border-[#34d399] flex items-center gap-3">
            <Lightbulb className="w-9 h-9 text-[#34d399] shrink-0" />
            <div>
              <h3 className="font-pixel font-bold text-base text-[#6ee7b7]">Kanta Petunjuk</h3>
              <p className="text-xs text-[#d1fae5]">Sedia digunakan dalam setiap kuiz</p>
            </div>
          </div>
        </div>

        {/* Tiga Lencana Penyelesaian Misi Utama */}
        <div className="p-4 bg-[#190f33] border-3 border-[#f6c445] space-y-3">
          <h3 className="font-pixel font-bold text-lg text-[#fde047] flex items-center gap-2">
            <Award className="w-5 h-5" />
            <span>LENCANA PENYELESAIAN MISI UTAMA ({badges.length} / 3)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: 'lencana_detektif' as BadgeId,
                title: 'Lencana Detektif Bahasa',
                desc: 'Ganjaran Misi 1 (Soalan 1–10)',
              },
              {
                id: 'lencana_pemburu' as BadgeId,
                title: 'Lencana Pemburu Kesalahan',
                desc: 'Ganjaran Misi 2 (Soalan 11–20)',
              },
              {
                id: 'lencana_wira' as BadgeId,
                title: 'Lencana Wira Tatabahasa',
                desc: 'Ganjaran Misi 3 (Soalan 21–30)',
              },
            ].map((b) => {
              const unlocked = badges.includes(b.id);
              return (
                <div
                  key={b.id}
                  className={`p-3 border-2 flex items-center gap-3 ${
                    unlocked
                      ? 'bg-[#2e1d59] border-[#facc15]'
                      : 'bg-[#150d29] border-[#475569] opacity-75'
                  }`}
                >
                  <PixelPortrait mode="badge" badgeId={b.id} unlocked={unlocked} size={52} />
                  <div>
                    <div className="font-pixel font-bold text-sm text-white">{b.title}</div>
                    <div className="text-xs text-[#cbd5e1]">{b.desc}</div>
                    <div
                      className={`text-xs font-bold mt-0.5 ${
                        unlocked ? 'text-[#34d399]' : 'text-[#94a3b8]'
                      }`}
                    >
                      {unlocked ? '✓ Diperoleh' : 'Belum Diperoleh'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lima Lencana Penerokaan (Aktiviti Sampingan Pendidikan — Bahagian M) */}
        <div className="p-4 bg-[#190f33] border-3 border-[#38bdf8] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-pixel font-bold text-lg text-[#7dd3fc] flex items-center gap-2">
              <Compass className="w-5 h-5" />
              <span>LENCANA PENEROKAAN & AKTIVITI SAMPINGAN ({explorationBadges.length} / 5)</span>
            </h3>
            <span className="text-xs text-[#cbd5e1]">
              Ganjaran penerokaan dunia tanpa mengubah jumlah 30 Kristal Kata utama
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {EXPLORATION_BADGES_INFO.map((eb) => {
              const unlocked = explorationBadges.includes(eb.id);
              return (
                <div
                  key={eb.id}
                  className={`p-3 border-2 flex items-start gap-3 ${
                    unlocked
                      ? 'bg-[#1e293b] border-[#38bdf8]'
                      : 'bg-[#140c29] border-[#475569] opacity-80'
                  }`}
                >
                  <PixelPortrait mode="badge" badgeId={eb.id} unlocked={unlocked} size={48} />
                  <div className="min-w-0 flex-1">
                    <div className="font-pixel font-bold text-sm text-[#fde047]">{eb.title}</div>
                    <div className="text-[11px] text-[#cbd5e1] leading-snug mt-0.5">{eb.desc}</div>
                    <div className="mt-1.5 flex items-center justify-between gap-2 text-xs font-mono-num font-bold">
                      <span className="text-[#7dd3fc]">{progressByBadge[eb.id]}</span>
                      <span className={unlocked ? 'text-[#34d399]' : 'text-[#94a3b8]'}>
                        {unlocked ? '✓ Diperoleh' : 'Dalam Kemajuan'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
