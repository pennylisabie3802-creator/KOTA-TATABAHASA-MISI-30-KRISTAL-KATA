import React from 'react';
import { Award, CheckCircle2, Compass, Lock, Navigation, Sparkles, X } from 'lucide-react';
import {
  AvatarId,
  BadgeId,
  ExplorationBadgeId,
  ExplorationStatus,
  JournalRecord,
  RegionId,
} from '../types/game';
import { getQuestionsByMission } from '../data/questions';
import { REGION_DIRECTORY } from '../data/sideActivities';
import { PixelPortrait } from './PixelPortrait';
import { soundEngine } from '../audio/soundEngine';

interface ProgressModalProps {
  isOpen: boolean;
  playerName: string;
  avatarId: AvatarId;
  score: number;
  crystalsCount: number;
  badges: BadgeId[];
  explorationBadges: ExplorationBadgeId[];
  completedQuestions: Record<number, JournalRecord>;
  getRegionStatus: (regionId: RegionId) => ExplorationStatus;
  onSelectRegion: (regionId: RegionId) => void;
  onClose: () => void;
}

export const ProgressModal: React.FC<ProgressModalProps> = ({
  isOpen,
  playerName,
  avatarId,
  score,
  crystalsCount,
  badges,
  explorationBadges,
  completedQuestions,
  getRegionStatus,
  onSelectRegion,
  onClose,
}) => {
  if (!isOpen) return null;

  const m1Solved = getQuestionsByMission(1).filter((q) => completedQuestions[q.id]).length;
  const m2Solved = getQuestionsByMission(2).filter((q) => completedQuestions[q.id]).length;
  const m3Solved = getQuestionsByMission(3).filter((q) => completedQuestions[q.id]).length;

  const missions = [
    {
      num: 1 as const,
      title: 'MISI 1: DETEKTIF BAHASA',
      range: 'Soalan 1 hingga 10',
      locationName: 'Taman Sakura Bahasa',
      regionId: 'taman_sakura' as RegionId,
      solved: m1Solved,
      total: 10,
      unlocked: true,
      badgeEarned: badges.includes('lencana_detektif'),
    },
    {
      num: 2 as const,
      title: 'MISI 2: PEMBURU KESALAHAN',
      range: 'Soalan 11 hingga 20',
      locationName: 'Pasar Perkataan (11–16) & Menara Media (17–20)',
      regionId: (m2Solved >= 6 ? 'menara_media' : 'pasar_perkataan') as RegionId,
      solved: m2Solved,
      total: 10,
      unlocked: m1Solved === 10,
      badgeEarned: badges.includes('lencana_pemburu'),
    },
    {
      num: 3 as const,
      title: 'MISI 3: WIRA TATABAHASA',
      range: 'Soalan 21 hingga 30',
      locationName: 'Benteng Wira Bahasa',
      regionId: 'benteng_wira' as RegionId,
      solved: m3Solved,
      total: 10,
      unlocked: m2Solved === 10,
      badgeEarned: badges.includes('lencana_wira'),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-4xl max-h-[92vh] pixel-panel-purple flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="px-4 sm:px-6 py-3.5 bg-[#221445] border-b-3 border-[#f6c445] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-[#fde047] shrink-0" />
            <div>
              <h2 className="font-pixel font-bold text-xl sm:text-2xl text-[#fde047]">
                KEMAJUAN PENGEMBARAAN
              </h2>
              <p className="text-xs text-[#e9d5ff]">
                Status Misi Utama, Kristal Kata & Penerokaan 8 Lokasi Kerajaan
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playButtonClick();
              onClose();
            }}
            className="w-9 h-9 pixel-btn-purple flex items-center justify-center cursor-pointer"
            aria-label="Tutup Kemajuan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto pixel-scroll p-4 sm:p-6 space-y-5">
          {/* Player Summary Banner */}
          <div className="p-4 bg-[#190f36] border-3 border-[#f6c445] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-16 h-16 bg-[#100924] border-2 border-[#fde047] flex items-center justify-center shrink-0">
                <PixelPortrait mode="avatar" avatarId={avatarId} anim="happy" size={56} />
              </div>
              <div>
                <div className="font-pixel font-bold text-lg sm:text-xl text-white">
                  {playerName}
                </div>
                <div className="text-xs sm:text-sm text-[#e9d5ff] mt-0.5">
                  Markah Terkumpul:{' '}
                  <strong className="font-mono-num text-[#fde047]">{score}</strong> · Lencana:{' '}
                  <strong className="font-mono-num text-[#86efac]">
                    {badges.length + explorationBadges.length} / 8
                  </strong>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-[#110926] border-2 border-[#38bdf8] px-4 py-2.5">
              <PixelPortrait mode="crystal" lit={crystalsCount > 0} size={34} />
              <div>
                <div className="text-xs text-[#bae6fd] font-pixel">KRISTAL KATA</div>
                <div className="font-mono-num font-extrabold text-xl text-[#7dd3fc]">
                  {crystalsCount} / 30
                </div>
              </div>
            </div>
          </div>

          {/* 3 Main Missions Breakdown */}
          <div className="space-y-3">
            <h3 className="font-pixel font-bold text-lg text-[#fde047] flex items-center gap-2">
              <Award className="w-5 h-5" /> KEMAJUAN KETIGA-TIGA MISI UTAMA
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {missions.map((m) => {
                const pct = Math.round((m.solved / m.total) * 100);
                const isDone = m.solved === m.total;
                return (
                  <div
                    key={m.num}
                    className="pixel-panel-parchment p-4 flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-xs font-bold">
                        <span className="text-[#581c87] font-pixel">{m.range}</span>
                        {isDone ? (
                          <span className="text-[#15803d] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> SELESAI
                          </span>
                        ) : m.unlocked ? (
                          <span className="text-[#0369a1]">AKTIF</span>
                        ) : (
                          <span className="text-[#92400e] flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5" /> BELUM LAYAK
                          </span>
                        )}
                      </div>

                      <h4 className="font-pixel font-bold text-base text-[#261505]">{m.title}</h4>
                      <p className="text-xs font-semibold text-[#573619]">{m.locationName}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-[#261505]">
                        <span>Soalan Selesai</span>
                        <span className="font-mono-num">
                          {m.solved} / {m.total} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-3 bg-[#e7d5b3] border-2 border-[#7c4a21] overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className="h-full bg-gradient-to-r from-[#0284c7] to-[#16a34a] transition-all duration-300"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playButtonClick();
                          onClose();
                          onSelectRegion(m.regionId);
                        }}
                        className="w-full py-2 px-3 pixel-btn-gold font-pixel font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>PERGI KE LOKASI</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 8 Regions Exploration Status */}
          <div className="space-y-2.5">
            <h3 className="font-pixel font-bold text-lg text-[#fde047] flex items-center gap-2">
              <Compass className="w-5 h-5" /> STATUS PENEROKAAN 8 LOKASI KERAJAAN
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {REGION_DIRECTORY.map((reg) => {
                const st = getRegionStatus(reg.id);
                const statusLabel =
                  st === 'TELAH_DITEROKAI'
                    ? 'TELAH DITEROKAI'
                    : st === 'SEDANG_DITEROKAI'
                    ? 'SEDANG DITEROKAI'
                    : 'BELUM DITEROKAI';
                const statusColor =
                  st === 'TELAH_DITEROKAI'
                    ? 'text-[#86efac]'
                    : st === 'SEDANG_DITEROKAI'
                    ? 'text-[#7dd3fc]'
                    : 'text-[#cbd5e1]';

                return (
                  <button
                    key={reg.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playButtonClick();
                      onClose();
                      onSelectRegion(reg.id);
                    }}
                    className="p-3 bg-[#1b1138] hover:bg-[#271852] border-2 border-[#5b3ea8] text-left flex items-center justify-between gap-3 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="font-pixel font-bold text-sm text-[#fde047] truncate">
                        {reg.number}. {reg.name}
                      </div>
                      <div className={`text-[11px] font-bold mt-0.5 ${statusColor}`}>
                        Status: {statusLabel}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 pixel-btn-blue font-pixel font-bold text-[11px] shrink-0">
                      MASUK
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
