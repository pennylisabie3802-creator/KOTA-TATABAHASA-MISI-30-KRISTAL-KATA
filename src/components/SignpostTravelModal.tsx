import React from 'react';
import { Compass, MapPin, Navigation, X } from 'lucide-react';
import { ExplorationStatus, MapId, RegionId } from '../types/game';
import { REGION_DIRECTORY } from '../data/sideActivities';
import { PixelPortrait } from './PixelPortrait';
import { soundEngine } from '../audio/soundEngine';

interface SignpostTravelModalProps {
  isOpen: boolean;
  currentMap: MapId;
  getRegionStatus: (regionId: RegionId) => ExplorationStatus;
  onSelectRegion: (regionId: RegionId) => void;
  onOpenWorldMap: () => void;
  onClose: () => void;
}

function statusChip(status: ExplorationStatus) {
  if (status === 'TELAH_DITEROKAI') {
    return {
      text: 'TELAH DITEROKAI',
      cls: 'bg-[#16a34a] text-[#f0fdf4] border-[#86efac]',
    };
  }
  if (status === 'SEDANG_DITEROKAI') {
    return {
      text: 'SEDANG DITEROKAI',
      cls: 'bg-[#0284c7] text-[#f0f9ff] border-[#7dd3fc]',
    };
  }
  return {
    text: 'BELUM DILAWATI',
    cls: 'bg-[#334155] text-[#cbd5e1] border-[#64748b]',
  };
}

export const SignpostTravelModal: React.FC<SignpostTravelModalProps> = ({
  isOpen,
  currentMap,
  getRegionStatus,
  onSelectRegion,
  onOpenWorldMap,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-3xl pixel-panel-purple p-4 sm:p-6 my-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b-2 border-[#5b3ea8]">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-[#2b1d52] border-2 border-[#f6c445]">
              <PixelPortrait mode="object" objectKind="signpost" size={44} />
            </div>
            <div>
              <h2 className="font-pixel font-bold text-xl sm:text-2xl text-[#fde047]">
                KE MANA KAMU MAHU PERGI?
              </h2>
              <p className="text-xs sm:text-sm text-[#e9d5ff]">
                Papan Arah Kerajaan Kota Tatabahasa — Pilih destinasi pengembaraan seterusnya!
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
            aria-label="Tutup Papan Arah"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 8 Locations Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {REGION_DIRECTORY.map((reg) => {
            const isHere =
              currentMap === reg.id ||
              (currentMap === 'istana_dalam' && reg.id === 'istana_luar');
            const st = statusChip(getRegionStatus(reg.id));

            return (
              <button
                key={reg.id}
                type="button"
                onClick={() => {
                  soundEngine.playButtonClick();
                  onSelectRegion(reg.id);
                }}
                className={`p-3 text-left border-3 transition-colors cursor-pointer flex flex-col justify-between gap-2 ${
                  isHere
                    ? 'bg-[#2e1d59] border-[#facc15]'
                    : 'bg-[#1a1033] border-[#5b3ea8] hover:border-[#fde047] hover:bg-[#241645]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-pixel font-bold text-base text-[#fde047]">
                      {reg.number}. {reg.name}
                    </div>
                    {reg.missionTag && (
                      <div className="text-[11px] font-bold text-[#7dd3fc] mt-0.5">
                        ★ {reg.missionTag}
                      </div>
                    )}
                  </div>

                  {isHere ? (
                    <span className="px-2 py-0.5 bg-[#22c55e] text-[#052e16] font-pixel font-bold text-[10px] flex items-center gap-1 shrink-0">
                      <MapPin className="w-3 h-3" /> DI SINI
                    </span>
                  ) : (
                    <span
                      className={`px-2 py-0.5 border font-pixel font-bold text-[10px] shrink-0 ${st.cls}`}
                    >
                      {st.text}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-[#cbd5e1] pt-1 border-t border-[#3b2770]">
                  <span className="truncate pr-2">{reg.shortDesc}</span>
                  <Navigation className="w-3.5 h-3.5 text-[#fde047] shrink-0" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t-2 border-[#5b3ea8]">
          <button
            type="button"
            onClick={() => {
              soundEngine.playButtonClick();
              onOpenWorldMap();
            }}
            className="px-4 py-2 pixel-btn-blue font-pixel font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>BUKA PETA DUNIA PENUH</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playButtonClick();
              onClose();
            }}
            className="px-5 py-2 pixel-btn-gold font-pixel font-bold text-xs sm:text-sm cursor-pointer"
          >
            KEKAL DI LOKASI INI
          </button>
        </div>
      </div>
    </div>
  );
};
