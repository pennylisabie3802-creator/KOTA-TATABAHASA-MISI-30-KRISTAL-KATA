import React, { useEffect, useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { GameLogoConfig } from '../types/game';
import {
  BUILTIN_LOGO_FALLBACK_URL,
  BUILTIN_LOGO_PRIMARY_URL,
  getActiveLogoUrl,
} from '../utils/gameLogoStore';

export type GameLogoSize =
  | 'fill' // Fills percentage-scaled parent stage container 1:1
  | 'xs' // Journal / Modal compact header (44px - 52px)
  | 'sm' // Guide header (76px - 92px)
  | 'menu' // Main Menu corner: 55-75px mobile, 90-130px desktop
  | 'md' // Victory / Credits medium-large (96px - 124px)
  | 'lg' // Loading / Credits hero (124px - 156px)
  | 'xl'; // Opening Splash Screen (168px - 224px)

interface GameLogoProps {
  config: GameLogoConfig;
  size?: GameLogoSize;
  fadeIn?: boolean;
  floating?: boolean;
  softGlow?: boolean;
  sparkles?: boolean;
  className?: string;
  alt?: string;
}

const SIZE_CLASSES: Record<GameLogoSize, string> = {
  fill: 'w-full h-full',
  xs: 'w-11 h-11 sm:w-13 sm:h-13',
  sm: 'w-20 h-20 sm:w-24 sm:h-24',
  menu: 'w-[62px] h-[62px] sm:w-[76px] sm:h-[76px] md:w-[98px] md:h-[98px] lg:w-[116px] lg:h-[116px]',
  md: 'w-24 h-24 sm:w-30 sm:h-30',
  lg: 'w-28 h-28 sm:w-36 sm:h-36',
  xl: 'w-40 h-40 sm:w-52 sm:h-52 md:w-56 md:h-56',
};

const SPARKLE_POSITIONS = [
  { top: '-7%', left: '-6%', delay: '0ms', color: '#fde047' },
  { top: '-6%', right: '-7%', delay: '450ms', color: '#7dd3fc' },
  { bottom: '-6%', left: '-7%', delay: '900ms', color: '#f472b6' },
  { bottom: '-7%', right: '-6%', delay: '1350ms', color: '#fde047' },
] as const;

/**
 * Reusable Official Game Logo Component (`logo-kota-tatabahasa`).
 * - Renders the exact uploaded logo with `object-fit: contain` (zero cropping, zero distortion).
 * - Supports Mod A (Logo Asal with solid blue background in a crisp pixel frame) and
 *   Mod B (Logo Transparan if a transparent PNG was uploaded, without destructive background stripping).
 * - If no logo is present (`isPlaceholderMode`), renders a clean pixel placeholder box without AI art.
 * - Applies lightweight CSS animations only to the outer container, never distorting mascot features.
 */
export const GameLogo: React.FC<GameLogoProps> = ({
  config,
  size = 'md',
  fadeIn = false,
  floating = false,
  softGlow = false,
  sparkles = false,
  className = '',
  alt = 'Logo Rasmi Kota Tatabahasa: Misi 30 Kristal Kata',
}) => {
  const activeUrl = getActiveLogoUrl(config);
  const [imgSrc, setImgSrc] = useState<string | null>(activeUrl);
  const [failedAll, setFailedAll] = useState(false);

  useEffect(() => {
    setImgSrc(activeUrl);
    setFailedAll(false);
  }, [activeUrl]);

  const isTransparentActive =
    !config.isPlaceholderMode &&
    config.displayMode === 'transparent' &&
    Boolean(config.transparent?.imageUrl);

  const sizeClass = SIZE_CLASSES[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${
        fadeIn ? 'logo-anim-fade-in' : ''
      } ${className}`}
    >
      <div
        className={`relative flex items-center justify-center ${sizeClass} ${
          floating ? 'logo-anim-float' : ''
        }`}
      >
        {/* External Pixel Sparkle Stars (strictly outside logo boundary so white outlines stay untouched) */}
        {sparkles &&
          SPARKLE_POSITIONS.map((pos, idx) => (
            <svg
              key={idx}
              viewBox="0 0 8 8"
              aria-hidden="true"
              style={{
                top: 'top' in pos ? pos.top : undefined,
                bottom: 'bottom' in pos ? pos.bottom : undefined,
                left: 'left' in pos ? pos.left : undefined,
                right: 'right' in pos ? pos.right : undefined,
                animationDelay: pos.delay,
              }}
              className="pointer-events-none absolute w-3 h-3 sm:w-4 sm:h-4 z-20 pixelated logo-sparkle-star"
            >
              <rect x="3" y="0" width="2" height="8" fill={pos.color} />
              <rect x="0" y="3" width="8" height="2" fill={pos.color} />
              <rect x="3" y="3" width="2" height="2" fill="#ffffff" />
            </svg>
          ))}

        {/* Clean Non-AI Placeholder Box if Logo Not Uploaded / Cleared */}
        {!imgSrc || failedAll ? (
          <div
            className={`w-full h-full bg-[#131c47] border-3 border-dashed border-[#facc15] p-2 flex flex-col items-center justify-center text-center ${
              softGlow ? 'logo-anim-glow' : ''
            }`}
          >
            <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#fde047] mb-1 shrink-0" />
            <span className="font-pixel font-bold text-[9px] sm:text-[10px] text-[#fef08a] leading-tight">
              LOGO RASMI
            </span>
          </div>
        ) : isTransparentActive ? (
          /* MOD B: LOGO TRANSPARAN — Clean transparent container without box background */
          <div
            className={`w-full h-full flex items-center justify-center p-0.5 ${
              softGlow ? 'drop-shadow-[0_0_16px_rgba(250,204,21,0.65)]' : ''
            }`}
          >
            <img
              src={imgSrc}
              alt={alt}
              draggable={false}
              referrerPolicy="no-referrer"
              onError={() => setFailedAll(true)}
              className="w-full h-full object-contain block select-none"
            />
          </div>
        ) : (
          /* MOD A: LOGO ASAL — Full original royal-blue logo preserved 100% inside a crisp gold/sapphire pixel frame */
          <div
            className={`w-full h-full bg-[#0066cc] border-2 sm:border-3 border-[#facc15] rounded-xl overflow-hidden p-[2px] shadow-[0_4px_0_#1e1b4b] flex items-center justify-center ${
              softGlow ? 'logo-anim-glow' : ''
            }`}
          >
            <img
              src={imgSrc}
              alt={alt}
              draggable={false}
              referrerPolicy="no-referrer"
              onError={() => {
                if (imgSrc === BUILTIN_LOGO_PRIMARY_URL) {
                  setImgSrc(BUILTIN_LOGO_FALLBACK_URL);
                } else {
                  setFailedAll(true);
                }
              }}
              className="w-full h-full object-contain block rounded-[9px] select-none"
            />
          </div>
        )}
      </div>
    </div>
  );
};
