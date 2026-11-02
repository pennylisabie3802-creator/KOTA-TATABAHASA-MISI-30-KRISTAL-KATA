import React, { useEffect } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { BadgeId } from '../types/game';
import { PixelPortrait } from './PixelPortrait';
import { soundEngine } from '../audio/soundEngine';

interface MissionCompleteModalProps {
  mission: 1 | 2 | 3 | null;
  onContinue: () => void;
}

const MISSION_REWARD_CONFIG: Record<
  1 | 2 | 3,
  {
    headline: string;
    subheadline: string;
    badgeId: BadgeId;
    badgeName: string;
    unlockNote: string;
    ctaLabel: string;
  }
> = {
  1: {
    headline: 'MISI 1 SELESAI!',
    subheadline: 'TAHNIAH, DETEKTIF BAHASA!',
    badgeId: 'lencana_detektif',
    badgeName: 'Lencana Detektif Bahasa',
    unlockNote: 'Akses ke Misi 2: Pemburu Kesalahan (Pasar Perkataan & Menara Media) kini dibuka!',
    ctaLabel: 'TERUSKAN KE MISI 2',
  },
  2: {
    headline: 'MISI 2 SELESAI!',
    subheadline: 'TAHNIAH, PEMBURU KESALAHAN!',
    badgeId: 'lencana_pemburu',
    badgeName: 'Lencana Pemburu Kesalahan',
    unlockNote: 'Akses ke Misi 3: Wira Tatabahasa (Benteng Bahasa & Akademi) kini dibuka!',
    ctaLabel: 'TERUSKAN KE MISI 3',
  },
  3: {
    headline: 'MISI 3 SELESAI!',
    subheadline: 'TAHNIAH, WIRA TATABAHASA!',
    badgeId: 'lencana_wira',
    badgeName: 'Lencana Wira Tatabahasa',
    unlockNote: 'Kesemua 30 Kristal Kata telah dikumpulkan! Kota Tatabahasa berjaya diselamatkan!',
    ctaLabel: ' MENUJU SKRIN KEMENANGAN',
  },
};

export const MissionCompleteModal: React.FC<MissionCompleteModalProps> = ({
  mission,
  onContinue,
}) => {
  useEffect(() => {
    if (mission) {
      soundEngine.playMissionUnlock();
    }
  }, [mission]);

  if (!mission) return null;
  const info = MISSION_REWARD_CONFIG[mission];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <div className="w-full max-w-xl pixel-panel-purple p-6 sm:p-8 text-center space-y-5">
        <div className="inline-flex items-center gap-2 px-4 py-1 bg-[#facc15] text-[#261505] font-pixel font-bold text-sm">
          <Sparkles className="w-4 h-4" /> GANJARAN PENYELESAIAN MISI
        </div>

        <div>
          <h2 className="font-pixel font-bold text-3xl sm:text-4xl text-[#fde047]">
            {info.headline}
          </h2>
          <p className="font-pixel font-bold text-lg sm:text-xl text-white mt-1">
            {info.subheadline}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 p-4 bg-[#1c1238] border-3 border-[#6d28d9]">
          <div className="flex flex-col items-center justify-center">
            <PixelPortrait mode="crystal" lit size={56} />
            <span className="font-pixel font-bold text-base text-[#7dd3fc] mt-1">
              10 Kristal Kata
            </span>
            <span className="text-xs text-[#cbd5e1]">Telah Dipulihkan</span>
          </div>

          <div className="flex flex-col items-center justify-center">
            <PixelPortrait mode="badge" badgeId={info.badgeId} unlocked size={56} />
            <span className="font-pixel font-bold text-base text-[#fde047] mt-1">
              {info.badgeName}
            </span>
            <span className="text-xs text-[#34d399]">Diperoleh!</span>
          </div>
        </div>

        <p className="text-sm sm:text-base font-semibold text-[#fef3c7]">{info.unlockNote}</p>

        <button
          type="button"
          onClick={() => {
            soundEngine.playButtonClick();
            onContinue();
          }}
          className="w-full py-3.5 px-6 pixel-btn-gold font-pixel font-bold text-base sm:text-lg flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>{info.ctaLabel}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
