import React, { useEffect, useState } from 'react';
import { Maximize2, Minimize2, RotateCcw, Smartphone } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface PortraitRotationPromptProps {
  variant?: 'banner' | 'card';
  className?: string;
}

/**
 * Reusable Mobile Portrait Orientation Guidance Component.
 * - Displays the exact required Bahasa Melayu instruction:
 *   "Putarkan telefon anda untuk pengalaman permainan terbaik."
 * - Never locks or forces screen orientation if unsupported by the browser.
 * - Optionally provides a safe, non-blocking Fullscreen toggle if supported by the browser.
 */
export const PortraitRotationPrompt: React.FC<PortraitRotationPromptProps> = ({
  variant = 'banner',
  className = '',
}) => {
  const [canFullscreen, setCanFullscreen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const supported = Boolean(
      document.fullscreenEnabled && document.documentElement?.requestFullscreen
    );
    setCanFullscreen(supported);
    setIsFullscreen(Boolean(document.fullscreenElement));

    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const handleToggleFullscreen = async () => {
    soundEngine.playButtonClick();
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen?.();
      } else {
        await document.documentElement.requestFullscreen?.();
      }
    } catch {
      // Gracefully ignore if browser/iframe blocks fullscreen — never force or error
    }
  };

  if (variant === 'card') {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`w-full max-w-md px-3.5 py-2.5 bg-[#1e123b]/95 border-2 border-[#facc15] shadow-[0_4px_0_#120a26] flex items-center justify-between gap-3 ${className}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative w-8 h-8 bg-[#2b1d52] border border-[#fde047] flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4 text-[#fde047] phone-rotate-anim" />
            <RotateCcw className="w-2.5 h-2.5 text-[#7dd3fc] absolute -bottom-1 -right-1 bg-[#1e123b] rounded-full" />
          </div>
          <p className="font-pixel font-bold text-xs text-[#fef08a] leading-snug text-left">
            Putarkan telefon anda untuk pengalaman permainan terbaik.
          </p>
        </div>

        {canFullscreen && (
          <button
            type="button"
            onClick={handleToggleFullscreen}
            title={isFullscreen ? 'Keluar Skrin Penuh' : 'Skrin Penuh'}
            className="px-2.5 py-1.5 pixel-btn-gold font-pixel font-bold text-[10px] flex items-center gap-1 shrink-0 cursor-pointer whitespace-nowrap"
          >
            {isFullscreen ? (
              <Minimize2 className="w-3 h-3 shrink-0" />
            ) : (
              <Maximize2 className="w-3 h-3 shrink-0" />
            )}
            <span>{isFullscreen ? 'NORMAL' : 'PENUH'}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`w-full px-3 py-1.5 bg-[#1e123b] border-b-2 border-[#facc15] flex items-center justify-center gap-2 text-center shrink-0 z-30 ${className}`}
    >
      <Smartphone className="w-3.5 h-3.5 text-[#fde047] phone-rotate-anim shrink-0" />
      <span className="font-pixel font-bold text-[11px] sm:text-xs text-[#fef08a] leading-tight">
        Putarkan telefon anda untuk pengalaman permainan terbaik.
      </span>
    </div>
  );
};
