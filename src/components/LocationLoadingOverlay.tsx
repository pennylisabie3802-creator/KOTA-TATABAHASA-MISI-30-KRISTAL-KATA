import React from 'react';
import { GameLogoConfig } from '../types/game';
import { GameLogo } from './GameLogo';
import { PixelPortrait } from './PixelPortrait';

interface LocationLoadingOverlayProps {
  isOpen: boolean;
  locationName: string;
  progressPercent: number;
  logoConfig: GameLogoConfig;
}

/**
 * SKRIN PEMUATAN LOKASI PENGEMBARAAN (Section 5)
 * - Displays the official logo in the center with twinkling small crystals around it.
 * - Shows dynamic uppercase text: e.g. "MEMUATKAN TAMAN SAKURA BAHASA..."
 * - Pixel-art progress bar in Blue, Purple, and Gold reflecting real asset preload progress.
 */
export const LocationLoadingOverlay: React.FC<LocationLoadingOverlayProps> = ({
  isOpen,
  locationName,
  progressPercent,
  logoConfig,
}) => {
  if (!isOpen) return null;

  const clamped = Math.max(8, Math.min(100, Math.round(progressPercent)));

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-65 bg-gradient-to-b from-[#0e1e5b] via-[#271454] to-[#130a2b] flex flex-col items-center justify-center p-5 select-none"
    >
      {/* Subtle Golden & Sapphire Center Aura */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(250,204,21,0.2)_0%,rgba(59,130,246,0.16)_40%,transparent_72%)]"
      />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center text-center space-y-5">
        {/* Official Logo Surrounded by Twinkling Small Crystals */}
        <div className="relative flex items-center justify-center px-10 py-2">
          <div className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 logo-sparkle-star">
            <PixelPortrait mode="crystal" lit size={26} />
          </div>
          <div
            style={{ animationDelay: '550ms' }}
            className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 logo-sparkle-star"
          >
            <PixelPortrait mode="crystal" lit size={26} />
          </div>
          <div
            style={{ animationDelay: '950ms' }}
            className="pointer-events-none absolute -top-3 left-6 logo-sparkle-star"
          >
            <PixelPortrait mode="crystal" lit size={20} />
          </div>
          <div
            style={{ animationDelay: '300ms' }}
            className="pointer-events-none absolute -bottom-2 right-6 logo-sparkle-star"
          >
            <PixelPortrait mode="crystal" lit size={20} />
          </div>

          <GameLogo
            config={logoConfig}
            size="lg"
            floating
            softGlow
            sparkles
          />
        </div>

        {/* Dynamic Uppercase Loading Label */}
        <div className="space-y-1">
          <p className="font-pixel font-bold text-sm sm:text-lg text-[#fde047] tracking-wide drop-shadow-[0_2px_0_#1e1b4b]">
            MEMUATKAN {locationName.toUpperCase()}...
          </p>
          <p className="font-mono-num text-xs font-bold text-[#bae6fd]">
            Menyediakan Aset Ilustrasi & Peta ({clamped}%)
          </p>
        </div>

        {/* Blue, Purple & Gold Pixel-Art Progress Bar */}
        <div className="w-full p-1 bg-[#120926] border-3 border-[#facc15] shadow-[0_4px_0_#090414]">
          <div className="w-full h-5 bg-[#1e153b] overflow-hidden relative">
            <div
              style={{ width: `${clamped}%` }}
              className="h-full bg-gradient-to-r from-[#2563eb] via-[#9333ea] to-[#facc15] transition-[width] duration-150 ease-out"
            />
            {/* Pixel Segment Notches */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_14px,rgba(18,9,38,0.45)_14px,rgba(18,9,38,0.45)_16px)]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
