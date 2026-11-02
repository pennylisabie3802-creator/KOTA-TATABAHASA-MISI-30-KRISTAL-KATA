import React from 'react';
import { soundEngine } from '../audio/soundEngine';

interface BottomGameNavBarProps {
  onOpenWorldMap: () => void;
  onOpenJournal: () => void;
  onOpenInventory: () => void;
  onOpenProgress: () => void;
  onOpenSettings: () => void;
  onOpenGuide?: () => void;
  crystalsCount: number;
  activeWorldMap?: boolean;
  compactOverlay?: boolean;
  ultraCompact?: boolean;
}

/**
 * Crisp 16x16 Pixel Art SVG Icons matching the 2D Fantasy Pixel Art RPG palette.
 */
const PixelMapIcon: React.FC = () => (
  <svg viewBox="0 0 16 16" className="w-4 h-4 shrink-0 pixelated" aria-hidden="true">
    <rect x="1" y="3" width="4" height="11" fill="#4ade80" />
    <rect x="6" y="2" width="4" height="11" fill="#86efac" />
    <rect x="11" y="3" width="4" height="11" fill="#22c55e" />
    <rect x="5" y="3" width="1" height="10" fill="#166534" />
    <rect x="10" y="3" width="1" height="10" fill="#166534" />
    <rect x="7" y="4" width="2" height="3" fill="#ef4444" />
    <rect x="7" y="7" width="2" height="1" fill="#fde047" />
  </svg>
);

const PixelJournalIcon: React.FC = () => (
  <svg viewBox="0 0 16 16" className="w-4 h-4 shrink-0 pixelated" aria-hidden="true">
    <rect x="2" y="2" width="12" height="12" fill="#fde047" />
    <rect x="3" y="3" width="4" height="10" fill="#fffbeb" />
    <rect x="9" y="3" width="4" height="10" fill="#fef3c7" />
    <rect x="7" y="2" width="2" height="12" fill="#92400e" />
    <rect x="4" y="5" width="2" height="1" fill="#6d28d9" />
    <rect x="4" y="7" width="2" height="1" fill="#6d28d9" />
    <rect x="10" y="5" width="2" height="1" fill="#6d28d9" />
    <rect x="10" y="7" width="2" height="1" fill="#6d28d9" />
  </svg>
);

const PixelInventoryIcon: React.FC = () => (
  <svg viewBox="0 0 16 16" className="w-4 h-4 shrink-0 pixelated" aria-hidden="true">
    <rect x="5" y="2" width="6" height="2" fill="#b45309" />
    <rect x="3" y="4" width="10" height="10" fill="#d97706" />
    <rect x="4" y="5" width="8" height="4" fill="#f59e0b" />
    <rect x="7" y="7" width="2" height="3" fill="#fde047" />
    <rect x="4" y="10" width="8" height="3" fill="#92400e" />
  </svg>
);

const PixelProgressIcon: React.FC = () => (
  <svg viewBox="0 0 16 16" className="w-4 h-4 shrink-0 pixelated" aria-hidden="true">
    <rect x="7" y="1" width="2" height="2" fill="#bae6fd" />
    <rect x="5" y="3" width="6" height="3" fill="#38bdf8" />
    <rect x="4" y="6" width="8" height="4" fill="#0284c7" />
    <rect x="5" y="10" width="6" height="3" fill="#0369a1" />
    <rect x="7" y="13" width="2" height="2" fill="#fde047" />
    <rect x="6" y="4" width="2" height="3" fill="#e0f2fe" />
  </svg>
);

const PixelSettingsIcon: React.FC = () => (
  <svg viewBox="0 0 16 16" className="w-4 h-4 shrink-0 pixelated" aria-hidden="true">
    <rect x="6" y="1" width="4" height="2" fill="#fde047" />
    <rect x="6" y="13" width="4" height="2" fill="#fde047" />
    <rect x="1" y="6" width="2" height="4" fill="#fde047" />
    <rect x="13" y="6" width="2" height="4" fill="#fde047" />
    <rect x="3" y="3" width="10" height="10" fill="#f59e0b" />
    <rect x="6" y="6" width="4" height="4" fill="#2b1d52" />
  </svg>
);

const PixelGuideIcon: React.FC = () => (
  <svg viewBox="0 0 16 16" className="w-4 h-4 shrink-0 pixelated" aria-hidden="true">
    <rect x="3" y="2" width="10" height="12" fill="#38bdf8" />
    <rect x="4" y="3" width="8" height="10" fill="#0f172a" />
    <rect x="6" y="4" width="4" height="2" fill="#fde047" />
    <rect x="8" y="6" width="2" height="2" fill="#fde047" />
    <rect x="7" y="8" width="2" height="2" fill="#fde047" />
    <rect x="7" y="11" width="2" height="1" fill="#fde047" />
  </svg>
);

export const BottomGameNavBar: React.FC<BottomGameNavBarProps> = ({
  onOpenWorldMap,
  onOpenJournal,
  onOpenInventory,
  onOpenProgress,
  onOpenSettings,
  onOpenGuide,
  crystalsCount,
  activeWorldMap = false,
  compactOverlay = false,
  ultraCompact = false,
}) => {
  const btnPaddingCls = ultraCompact
    ? 'px-2 py-1 text-[10px]'
    : 'px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-xs';

  return (
    <nav
      aria-label="Navigasi Utama Permainan"
      className={
        compactOverlay
          ? `pointer-events-none absolute ${
              ultraCompact ? 'bottom-1' : 'bottom-2'
            } inset-x-0 z-20 flex justify-center px-2 safe-area-x`
          : `w-full bg-[#170e30] border-t-2 sm:border-t-3 border-[#f6c445] px-2 ${
              ultraCompact ? 'py-1' : 'py-1.5'
            } flex items-center justify-center shrink-0 z-20 safe-area-x`
      }
    >
      <div
        className={`pointer-events-auto flex items-center ${
          ultraCompact
            ? 'justify-start sm:justify-center gap-1 flex-nowrap overflow-x-auto no-scrollbar max-w-full'
            : 'justify-center gap-1.5 sm:gap-2.5 flex-wrap'
        }`}
      >
        <button
          type="button"
          onClick={() => {
            soundEngine.playButtonClick();
            onOpenWorldMap();
          }}
          className={`${btnPaddingCls} font-pixel font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
            activeWorldMap ? 'pixel-btn-gold' : 'pixel-btn-blue'
          }`}
        >
          <PixelMapIcon />
          <span>PETA DUNIA</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundEngine.playBookOpen();
            onOpenJournal();
          }}
          className={`${btnPaddingCls} pixel-btn-purple font-pixel font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0`}
        >
          <PixelJournalIcon />
          <span>JURNAL BAHASA</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundEngine.playButtonClick();
            onOpenInventory();
          }}
          className={`${btnPaddingCls} pixel-btn-wood font-pixel font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0`}
        >
          <PixelInventoryIcon />
          <span>INVENTORI</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundEngine.playButtonClick();
            onOpenProgress();
          }}
          className={`${btnPaddingCls} pixel-btn-emerald font-pixel font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0`}
        >
          <PixelProgressIcon />
          <span>KEMAJUAN ({crystalsCount}/30)</span>
        </button>

        {onOpenGuide && (
          <button
            type="button"
            onClick={() => {
              soundEngine.playButtonClick();
              onOpenGuide();
            }}
            className={`${btnPaddingCls} pixel-btn-blue font-pixel font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0`}
          >
            <PixelGuideIcon />
            <span>PANDUAN</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            soundEngine.playButtonClick();
            onOpenSettings();
          }}
          className={`${btnPaddingCls} pixel-btn-purple font-pixel font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0`}
        >
          <PixelSettingsIcon />
          <span>TETAPAN</span>
        </button>
      </div>
    </nav>
  );
};
