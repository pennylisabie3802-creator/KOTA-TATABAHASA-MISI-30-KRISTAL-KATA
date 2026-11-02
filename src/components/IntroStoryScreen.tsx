import React, { useEffect, useRef, useState } from 'react';
import { ChevronRight, Play } from 'lucide-react';
import { AvatarId } from '../types/game';
import { drawAvatarSprite, drawCrystalSprite, drawOwlMascot } from '../engine/pixelSprites';
import { PixelPortrait } from './PixelPortrait';
import { soundEngine } from '../audio/soundEngine';
import { useMobileViewport } from '../hooks/useMobileViewport';

interface IntroStoryScreenProps {
  avatarId: AvatarId;
  playerName: string;
  onFinishIntro: () => void;
}

const STORY_DIALOGUES = [
  'Selamat datang ke Kota Tatabahasa!',
  'Sebanyak 30 Kristal Kata telah kehilangan kuasanya akibat kesalahan bahasa.',
  'Hanya Wira Bahasa yang mampu mengembalikan cahaya kristal tersebut.',
  'Jelajahi kota, cari kesalahan, betulkan bahasa dan selamatkan dunia!',
];

export const IntroStoryScreen: React.FC<IntroStoryScreenProps> = ({
  avatarId,
  playerName,
  onFinishIntro,
}) => {
  const { isLandscapePhone } = useMobileViewport();
  const [step, setStep] = useState(0);
  const [displayedChars, setDisplayedChars] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const currentLine = STORY_DIALOGUES[step] ?? '';
  const isTyping = displayedChars < currentLine.length;

  useEffect(() => {
    setDisplayedChars(0);
  }, [step]);

  useEffect(() => {
    if (displayedChars >= currentLine.length) return;
    const prev = displayedChars > 0 ? currentLine[displayedChars - 1] : '';
    const delayMs = /[.,!?]/.test(prev) ? 90 : 24;
    const timer = window.setTimeout(() => {
      const next = Math.min(currentLine.length, displayedChars + 2);
      setDisplayedChars(next);
      if (next % 6 === 0) {
        soundEngine.playVoiceBlip();
      }
    }, delayMs);
    return () => clearTimeout(timer);
  }, [currentLine, displayedChars]);

  // Animated cutscene canvas: Step 0 shows bright peaceful Kota Tatabahasa; Step >= 1 shows dimmed crystals & floating error notices!
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let tick = 0;

    const render = () => {
      tick++;
      const frame = Math.floor(tick / 10) % 8;
      const w = canvas.width;
      const h = canvas.height;
      ctx.imageSmoothingEnabled = false;

      const isDimmed = step >= 1;

      // Sky
      ctx.fillStyle = isDimmed ? '#1e1b4b' : '#38bdf8';
      ctx.fillRect(0, 0, w, h * 0.68);
      ctx.fillStyle = isDimmed ? '#312e81' : '#7dd3fc';
      ctx.fillRect(0, h * 0.34, w, h * 0.34);

      // Ground
      ctx.fillStyle = isDimmed ? '#1e3a2f' : '#22c55e';
      ctx.fillRect(0, h * 0.68, w, h * 0.32);
      ctx.fillStyle = '#d6c3a5';
      ctx.fillRect(w / 2 - 48, h * 0.68, 96, h * 0.32);

      // Castle Silhouette in Center
      const cx = w / 2 - 90;
      const cy = h * 0.2;
      ctx.fillStyle = isDimmed ? '#cbd5e1' : '#faf5ff';
      ctx.fillRect(cx + 25, cy + 35, 130, 110);
      ctx.fillStyle = '#6d28d9';
      ctx.fillRect(cx + 15, cy + 12, 42, 28);
      ctx.fillRect(cx + 123, cy + 12, 42, 28);
      ctx.fillStyle = '#7e22ce';
      ctx.fillRect(cx + 58, cy - 8, 64, 44);

      // Ring of Crystals around Castle (Lit on step 0, Dimmed on step >= 1!)
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + tick * 0.015;
        const rx = w / 2 - 14 + Math.cos(angle) * 145;
        const ry = h * 0.42 + Math.sin(angle) * 52;
        drawCrystalSprite(ctx, rx, ry, 2, !isDimmed, frame % 4);
      }

      // Floating Grammar Errors appearing when crystals lose light (Step >= 1)
      if (isDimmed) {
        const errorCards = [
          { txt: 'Diatas ❌', x: w * 0.12, y: h * 0.24 },
          { txt: 'Pasaraya ❌', x: w * 0.74, y: h * 0.22 },
          { txt: 'Mee Hun ❌', x: w * 0.14, y: h * 0.5 },
          { txt: 'Berkuatkuasa ❌', x: w * 0.72, y: h * 0.5 },
        ];
        errorCards.forEach((card, idx) => {
          const floatY = Math.sin(tick * 0.06 + idx) * 5;
          ctx.fillStyle = '#fef3c7';
          ctx.fillRect(card.x, card.y + floatY, 128, 28);
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 3;
          ctx.strokeRect(card.x, card.y + floatY, 128, 28);
          ctx.fillStyle = '#991b1b';
          ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(card.txt, card.x + 64, card.y + 19 + floatY);
        });
      }

      // Hero + Owl Guardian meeting on stone road
      drawAvatarSprite(ctx, avatarId, 'up', 'idle', frame % 4, w / 2 - 64, h * 0.64, 2.5);
      drawOwlMascot(ctx, w / 2 + 8, h * 0.56, 2.4, frame, isTyping ? 'talk' : 'idle');

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [avatarId, step, isTyping]);

  const isLastStep = step === STORY_DIALOGUES.length - 1;

  return (
    <div className="w-full h-full bg-[#120d26] overflow-y-auto pixel-scroll flex flex-col items-center justify-center p-2.5 sm:p-4 safe-area-x">
      <div
        className={`w-full max-w-4xl pixel-panel-purple my-auto flex flex-col ${
          isLandscapePhone ? 'p-2.5 gap-2' : 'p-4 md:p-6 gap-4'
        }`}
      >
        {/* Top Banner */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={`font-pixel font-bold ${
              isLandscapePhone ? 'text-sm' : 'text-base sm:text-lg'
            } text-[#fde047] truncate`}
          >
            KISAH PERMULAAN · KOTA TATABAHASA
          </span>
          <button
            type="button"
            onClick={() => {
              soundEngine.playButtonClick();
              onFinishIntro();
            }}
            className="text-xs font-bold text-[#c4b5fd] hover:text-white underline cursor-pointer shrink-0"
          >
            Langkau Pengenalan
          </button>
        </div>

        {/* Animated Pixel Scene Viewport */}
        <div
          className={`w-full ${
            isLandscapePhone ? 'h-36' : 'h-48 sm:h-68 md:h-76'
          } border-3 sm:border-4 border-[#4a2806] overflow-hidden bg-[#1e1b4b]`}
        >
          <canvas
            ref={canvasRef}
            width={820}
            height={320}
            className="w-full h-full object-contain bg-[#1e1b4b] pixelated"
          />
        </div>

        {/* Guardian Owl Dialogue Box */}
        <div
          className={`pixel-panel-parchment ${
            isLandscapePhone ? 'p-2.5 gap-3' : 'p-4 md:p-5 gap-4'
          } flex flex-col sm:flex-row items-center`}
        >
          <div className="p-1 bg-[#2b1d52] border-2 sm:border-3 border-[#f6c445] shrink-0">
            <PixelPortrait
              mode="npc"
              npcKind="owl"
              talking={isTyping}
              activeChar={isTyping ? currentLine[displayedChars] : undefined}
              reactNonce={step}
              interactiveStage
              size={isLandscapePhone ? 56 : 84}
            />
          </div>

          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-0.5">
              <span className="font-pixel font-bold text-xs sm:text-sm text-[#6d28d9] truncate">
                PENJAGA BAHASA (BURUNG HANTU DIRAJA)
              </span>
              <span className="text-[11px] sm:text-xs text-[#78350f] font-mono-num shrink-0">
                · Babak {step + 1}/{STORY_DIALOGUES.length}
              </span>
            </div>
            <p
              className={`font-body font-bold ${
                isLandscapePhone ? 'text-sm leading-snug' : 'text-base sm:text-lg md:text-xl leading-relaxed min-h-[2.25rem]'
              } text-[#261505]`}
            >
              “{currentLine.slice(0, displayedChars)}”
              {isTyping && (
                <span className="inline-block w-2 h-4 ml-1 bg-[#78350f] animate-pulse align-middle" />
              )}
            </p>
            {!isLandscapePhone && (
              <p className="mt-1 text-xs text-[#78350f]">
                Bersedia, <span className="font-bold">{playerName}</span>? Kota Tatabahasa mengharapkan ketelitianmu!
              </p>
            )}
          </div>

          <div className="shrink-0">
            {!isLastStep ? (
              <button
                type="button"
                onClick={() => {
                  if (isTyping) {
                    soundEngine.playButtonClick();
                    setDisplayedChars(currentLine.length);
                    return;
                  }
                  soundEngine.playNpcInteract();
                  setStep((s) => s + 1);
                }}
                className={`${
                  isLandscapePhone ? 'px-4 py-2 text-xs' : 'px-5 py-3 text-sm sm:text-base'
                } pixel-btn-purple font-pixel font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap`}
              >
                <span>{isTyping ? 'LANGKAU TEKS' : 'SETERUSNYA'}</span>
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (isTyping) {
                    soundEngine.playButtonClick();
                    setDisplayedChars(currentLine.length);
                    return;
                  }
                  soundEngine.playMissionUnlock();
                  onFinishIntro();
                }}
                className={`${
                  isLandscapePhone ? 'px-4 py-2 text-xs' : 'px-6 py-3.5 text-base sm:text-lg'
                } pixel-btn-gold font-pixel font-bold flex items-center gap-2 cursor-pointer whitespace-nowrap`}
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                <span>{isTyping ? 'LANGKAU TEKS' : 'PILIH LOKASI PENGEMBARAAN'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
