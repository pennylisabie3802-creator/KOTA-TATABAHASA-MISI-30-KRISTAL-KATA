import React, { useCallback, useEffect, useRef } from 'react';
import { FastForward } from 'lucide-react';
import { GameLogoConfig } from '../types/game';
import { GameLogo } from './GameLogo';
import { PixelPortrait } from './PixelPortrait';
import { soundEngine } from '../audio/soundEngine';
import { useMobileViewport } from '../hooks/useMobileViewport';

interface OpeningSplashScreenProps {
  logoConfig: GameLogoConfig;
  onFinishSplash: () => void;
}

const SPLASH_DURATION_MS = 2700; // 2.7 seconds (within 2 to 3 seconds requirement)

const BACKGROUND_STARS = [
  { left: '8%', top: '12%', delay: '0ms', color: '#fde047' },
  { left: '19%', top: '26%', delay: '350ms', color: '#f9a8d4' },
  { left: '82%', top: '15%', delay: '700ms', color: '#fde047' },
  { left: '91%', top: '30%', delay: '1050ms', color: '#93c5fd' },
  { left: '14%', top: '74%', delay: '500ms', color: '#fde047' },
  { left: '87%', top: '72%', delay: '900ms', color: '#f9a8d4' },
  { left: '28%', top: '14%', delay: '1200ms', color: '#fef08a' },
  { left: '73%', top: '20%', delay: '250ms', color: '#fef08a' },
] as const;

const FLOATING_CRYSTALS = [
  { left: '11%', top: '44%', delay: '0ms' },
  { left: '85%', top: '45%', delay: '700ms' },
  { left: '20%', top: '58%', delay: '1300ms' },
  { left: '78%', top: '60%', delay: '400ms' },
] as const;

/**
 * SKRIN PEMBUKAAN PERMAINAN (Section 3)
 * - 2D pixel-art fantasy backdrop using Sapphire Blue, Royal Purple, Soft Pink, and Golden Yellow.
 * - Large centered official logo (`logo-kota-tatabahasa`) with fade-in, golden glow, twinkling stars,
 *   and floating small crystals.
 * - Auto-transitions after 2.7 seconds with an instant "LANGKAU" button.
 */
export const OpeningSplashScreen: React.FC<OpeningSplashScreenProps> = ({
  logoConfig,
  onFinishSplash,
}) => {
  const finishedRef = useRef(false);
  const { isLandscapePhone } = useMobileViewport();

  const completeSplash = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinishSplash();
  }, [onFinishSplash]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      completeSplash();
    }, SPLASH_DURATION_MS);

    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') {
        e.preventDefault();
        soundEngine.playButtonClick();
        completeSplash();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, [completeSplash]);

  return (
    <div
      className={`relative w-full h-full overflow-hidden select-none flex flex-col items-center justify-between ${
        isLandscapePhone ? 'p-2.5 safe-area-x' : 'p-5 sm:p-8'
      } bg-gradient-to-b from-[#0f256e] via-[#3b1c78] to-[#5b1d5c]`}
    >
      {/* Pixel Grid Horizon & Soft Pink / Royal Gold Fantasy Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(250,204,21,0.24)_0%,rgba(244,114,182,0.16)_38%,rgba(15,37,110,0)_72%)]"
      />

      {/* Pixel Art Castle Silhouette Horizon Band at Bottom */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-[#12092b] via-[#271252]/80 to-transparent"
      />

      {/* Twinkling Pixel Stars */}
      {BACKGROUND_STARS.map((star, idx) => (
        <svg
          key={idx}
          viewBox="0 0 8 8"
          aria-hidden="true"
          style={{
            left: star.left,
            top: star.top,
            animationDelay: star.delay,
          }}
          className="pointer-events-none absolute w-3.5 h-3.5 sm:w-4 sm:h-4 pixelated logo-sparkle-star"
        >
          <rect x="3" y="0" width="2" height="8" fill={star.color} />
          <rect x="0" y="3" width="8" height="2" fill={star.color} />
          <rect x="3" y="3" width="2" height="2" fill="#ffffff" />
        </svg>
      ))}

      {/* Small Floating Pixel Crystals */}
      {FLOATING_CRYSTALS.map((c, idx) => (
        <div
          key={idx}
          aria-hidden="true"
          style={{
            left: c.left,
            top: c.top,
            animationDelay: c.delay,
          }}
          className="hidden sm:block pointer-events-none absolute logo-anim-float opacity-90"
        >
          <PixelPortrait mode="crystal" lit size={28} />
        </div>
      ))}

      {/* Top Bar with LANGKAU Button */}
      <div className="relative z-20 w-full flex items-center justify-end">
        <button
          type="button"
          onClick={() => {
            soundEngine.playButtonClick();
            completeSplash();
          }}
          className="px-3 py-1 sm:px-3.5 sm:py-1.5 pixel-btn-gold font-pixel font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <span>LANGKAU</span>
          <FastForward className="w-4 h-4 shrink-0" />
        </button>
      </div>

      {/* Center Official Logo + Welcome Titles */}
      <div
        className={`relative z-10 flex flex-col items-center justify-center text-center max-w-2xl mx-auto my-auto ${
          isLandscapePhone ? 'space-y-1.5' : 'space-y-4'
        }`}
      >
        {/* Golden Light Halo Behind Official Logo */}
        <div className="relative flex items-center justify-center">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-5 rounded-full bg-[radial-gradient(circle,rgba(253,224,71,0.42)_0%,rgba(59,130,246,0.22)_50%,transparent_75%)] blur-md"
          />
          <GameLogo
            config={logoConfig}
            size={isLandscapePhone ? 'md' : 'xl'}
            fadeIn
            floating
            softGlow
            sparkles
          />
        </div>

        <div className={`${isLandscapePhone ? 'space-y-0.5' : 'space-y-1.5 pt-1'} logo-anim-fade-in`}>
          <p className="font-pixel font-bold text-[11px] sm:text-sm tracking-[0.18em] text-[#fbcfe8] drop-shadow-[0_2px_0_#1e1b4b]">
            SELAMAT DATANG KE
          </p>
          <h1
            className={`font-pixel font-bold ${
              isLandscapePhone ? 'text-2xl' : 'text-3xl sm:text-5xl'
            } text-[#fde047] drop-shadow-[0_4px_0_#311042]`}
          >
            KOTA TATABAHASA
          </h1>
          <div className="inline-block px-3.5 py-0.5 sm:px-4 sm:py-1 bg-[#4c1d95]/90 border-2 border-[#facc15] shadow-[0_3px_0_#1e1b4b]">
            <h2
              className={`font-pixel font-bold ${
                isLandscapePhone ? 'text-xs' : 'text-sm sm:text-lg'
              } text-[#fef08a] tracking-wide`}
            >
              MISI 30 KRISTAL KATA
            </h2>
          </div>
        </div>
      </div>

      {/* Bottom Motto */}
      <div className="relative z-10 text-center pb-0.5 logo-anim-fade-in">
        <p
          className={`font-pixel font-bold ${
            isLandscapePhone ? 'text-[11px]' : 'text-xs sm:text-base'
          } text-[#fef9c3] leading-relaxed drop-shadow-[0_2px_0_#1e1b4b]`}
        >
          AYUH BERMAIN, AYUH BERBAHASA,
          <br className="sm:hidden" /> TATABAHASA KITA KUASAI!
        </p>
      </div>
    </div>
  );
};
