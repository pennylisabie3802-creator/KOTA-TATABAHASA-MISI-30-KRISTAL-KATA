import React, { useEffect, useRef, useState } from 'react';

export type MenuCharacterId = 'wira' | 'srikandi' | 'owl';

export type WiraAnimName = 'IDLE' | 'BLINK' | 'WAVE' | 'CHEER' | 'JUMP';
export type SrikandiAnimName = 'IDLE' | 'BLINK' | 'READ' | 'CAST_MAGIC' | 'SMILE';
export type OwlAnimName = 'IDLE' | 'BLINK' | 'FLAP' | 'LIFT_SCROLL' | 'CHEER';

export type AnyCharacterAnimName = WiraAnimName | SrikandiAnimName | OwlAnimName;

interface AnimRowSpec {
  row: number;
  frames: number;
  fps: number;
  loop: boolean;
}

interface CharacterSheetSpec {
  sheetUrl: string;
  cellWidth: number;
  cellHeight: number;
  maxCols: number;
  totalRows: number;
  animations: Record<string, AnimRowSpec>;
}

export const MENU_CHARACTER_SPECS: Record<MenuCharacterId, CharacterSheetSpec> = {
  wira: {
    sheetUrl: '/assets/sprites/wira-bahasa-sheet.png',
    cellWidth: 120,
    cellHeight: 148,
    maxCols: 8,
    totalRows: 5,
    animations: {
      IDLE: { row: 0, frames: 4, fps: 8, loop: true },
      BLINK: { row: 1, frames: 4, fps: 10, loop: false },
      WAVE: { row: 2, frames: 6, fps: 9, loop: false },
      CHEER: { row: 3, frames: 6, fps: 9, loop: false },
      JUMP: { row: 4, frames: 8, fps: 11, loop: false },
    },
  },
  srikandi: {
    sheetUrl: '/assets/sprites/srikandi-bahasa-sheet.png',
    cellWidth: 120,
    cellHeight: 144,
    maxCols: 8,
    totalRows: 5,
    animations: {
      IDLE: { row: 0, frames: 4, fps: 8, loop: true },
      BLINK: { row: 1, frames: 4, fps: 9, loop: false },
      READ: { row: 2, frames: 6, fps: 8, loop: false },
      CAST_MAGIC: { row: 3, frames: 8, fps: 10, loop: false },
      SMILE: { row: 4, frames: 6, fps: 8, loop: false },
    },
  },
  owl: {
    sheetUrl: '/assets/sprites/burung-hantu-sheet.png',
    cellWidth: 120,
    cellHeight: 136,
    maxCols: 6,
    totalRows: 5,
    animations: {
      IDLE: { row: 0, frames: 4, fps: 8, loop: true },
      BLINK: { row: 1, frames: 4, fps: 10, loop: false },
      FLAP: { row: 2, frames: 6, fps: 9, loop: false },
      LIFT_SCROLL: { row: 3, frames: 6, fps: 8, loop: false },
      CHEER: { row: 4, frames: 6, fps: 10, loop: false },
    },
  },
};

export interface TriggeredAnimRequest {
  anim: AnyCharacterAnimName;
  nonce: number;
  repeatCount?: number;
}

interface MenuCharacterSpriteProps {
  characterId: MenuCharacterId;
  label: string;
  left: string;
  top: string;
  width: string;
  height: string;
  paused?: boolean;
  prefersReducedMotion?: boolean;
  triggeredAnim?: TriggeredAnimRequest | null;
  showBagBadge?: boolean;
  onClickCharacter: () => void;
  onMouseEnterCharacter?: () => void;
}

/**
 * Reusable 2D Pixel-Art Sprite Sheet Character Component for the Main Menu.
 * - Renders authentic multi-frame limb/feature animations (`8-12 FPS`, `image-rendering: pixelated`).
 * - Runs character-specific automatic director schedule with natural random blink intervals.
 * - Supports interactive click & menu-reaction animation overrides.
 * - Automatically pauses when `document.hidden` or `paused` is true.
 */
export const MenuCharacterSprite: React.FC<MenuCharacterSpriteProps> = ({
  characterId,
  label,
  left,
  top,
  width,
  height,
  paused = false,
  prefersReducedMotion = false,
  triggeredAnim = null,
  showBagBadge = false,
  onClickCharacter,
  onMouseEnterCharacter,
}) => {
  const spec = MENU_CHARACTER_SPECS[characterId];
  const [activeAnim, setActiveAnim] = useState<string>(
    characterId === 'owl' ? 'FLAP' : 'IDLE'
  );
  const [frameIndex, setFrameIndex] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isDocHidden, setIsDocHidden] = useState<boolean>(
    typeof document !== 'undefined' ? document.hidden : false
  );

  // Track multi-cycle playback for non-looping animations (so 6-8 frame clips @ 9fps play visibly for ~1.1-1.4s)
  const remainingCyclesRef = useRef<number>(characterId === 'owl' ? 2 : 1);
  const lastHandledNonceRef = useRef<number>(0);

  // Visibility listener: pause all sprite timers when tab is hidden
  useEffect(() => {
    const onVisChange = () => {
      setIsDocHidden(document.hidden);
    };
    document.addEventListener('visibilitychange', onVisChange);
    return () => document.removeEventListener('visibilitychange', onVisChange);
  }, []);

  // Imperative override from parent (click on character or click on menu button)
  useEffect(() => {
    if (!triggeredAnim || triggeredAnim.nonce === lastHandledNonceRef.current) return;
    lastHandledNonceRef.current = triggeredAnim.nonce;
    if (!spec.animations[triggeredAnim.anim]) return;

    remainingCyclesRef.current = triggeredAnim.repeatCount ?? 2;
    setActiveAnim(triggeredAnim.anim);
    setFrameIndex(0);
  }, [triggeredAnim, spec.animations]);

  // Automatic Main Menu Director Schedule (Section 7) with slight jitter so characters don't move in robotic lockstep
  useEffect(() => {
    if (prefersReducedMotion || paused || isDocHidden) return;

    const scheduledIds: number[] = [];
    let cancelled = false;

    const triggerScheduled = (animName: string, cycles = 2) => {
      if (cancelled) return;
      setActiveAnim((curr) => {
        // Don't interrupt an active user-triggered special pose unless currently IDLE/BLINK
        if (curr !== 'IDLE' && curr !== 'BLINK') return curr;
        remainingCyclesRef.current = cycles;
        setFrameIndex(0);
        return animName;
      });
    };

    const runDirectorCycle = (isFirstCycle: boolean) => {
      if (cancelled) return;
      const jitter = () => Math.floor(Math.random() * 320);

      if (characterId === 'wira') {
        // Wira: IDLE -> 5s WAVE -> 8s CHEER -> IDLE (+ natural BLINKs)
        scheduledIds.push(
          window.setTimeout(() => triggerScheduled('BLINK', 1), 2300 + jitter()),
          window.setTimeout(() => triggerScheduled('WAVE', 2), 5000 + jitter()),
          window.setTimeout(() => triggerScheduled('CHEER', 2), 8000 + jitter()),
          window.setTimeout(() => triggerScheduled('BLINK', 1), 11400 + jitter()),
          window.setTimeout(() => runDirectorCycle(false), 14200 + jitter())
        );
      } else if (characterId === 'srikandi') {
        // Srikandi: IDLE -> 4s READ -> 8s CAST_MAGIC -> IDLE (+ natural BLINK & SMILE)
        scheduledIds.push(
          window.setTimeout(() => triggerScheduled('BLINK', 1), 1900 + jitter()),
          window.setTimeout(() => triggerScheduled('READ', 2), 4000 + jitter()),
          window.setTimeout(() => triggerScheduled('CAST_MAGIC', 2), 8000 + jitter()),
          window.setTimeout(() => triggerScheduled('SMILE', 2), 11800 + jitter()),
          window.setTimeout(() => runDirectorCycle(false), 14800 + jitter())
        );
      } else {
        // Owl: Starts slow FLAP -> 6s LIFT_SCROLL -> 10s CHEER -> IDLE (+ natural BLINK)
        if (isFirstCycle) {
          remainingCyclesRef.current = 2;
          setActiveAnim('FLAP');
          setFrameIndex(0);
        } else {
          scheduledIds.push(
            window.setTimeout(() => triggerScheduled('FLAP', 2), 900 + jitter())
          );
        }
        scheduledIds.push(
          window.setTimeout(() => triggerScheduled('BLINK', 1), 3400 + jitter()),
          window.setTimeout(() => triggerScheduled('LIFT_SCROLL', 2), 6000 + jitter()),
          window.setTimeout(() => triggerScheduled('CHEER', 2), 10000 + jitter()),
          window.setTimeout(() => triggerScheduled('BLINK', 1), 13100 + jitter()),
          window.setTimeout(() => runDirectorCycle(false), 15600 + jitter())
        );
      }
    };

    runDirectorCycle(true);

    return () => {
      cancelled = true;
      scheduledIds.forEach((id) => window.clearTimeout(id));
    };
  }, [characterId, prefersReducedMotion, paused, isDocHidden]);

  // Frame-by-frame Sprite Stepping Clock (8-12 FPS)
  useEffect(() => {
    if (prefersReducedMotion) {
      setFrameIndex(0);
      return;
    }
    if (paused || isDocHidden) return;

    const animSpec = spec.animations[activeAnim] ?? spec.animations.IDLE;
    const intervalMs = Math.round(1000 / animSpec.fps);

    const timer = window.setInterval(() => {
      setFrameIndex((prev) => {
        const next = prev + 1;
        if (next < animSpec.frames) {
          return next;
        }
        if (animSpec.loop) {
          return 0;
        }
        if (remainingCyclesRef.current > 1) {
          remainingCyclesRef.current -= 1;
          return 0;
        }
        // Return cleanly to IDLE frame 0 after finishing non-looping clip
        setActiveAnim('IDLE');
        return 0;
      });
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [activeAnim, paused, isDocHidden, prefersReducedMotion, spec.animations]);

  const currentAnimSpec = spec.animations[activeAnim] ?? spec.animations.IDLE;
  const safeCol = prefersReducedMotion ? 0 : Math.min(frameIndex, currentAnimSpec.frames - 1);
  const safeRow = prefersReducedMotion ? 0 : currentAnimSpec.row;

  // CSS percentage background-position formula for exact pixel cell slicing:
  // posX% = col / (maxCols - 1) * 100%, posY% = row / (totalRows - 1) * 100%
  const bgPosX =
    spec.maxCols > 1 ? `${(safeCol / (spec.maxCols - 1)) * 100}%` : '0%';
  const bgPosY =
    spec.totalRows > 1 ? `${(safeRow / (spec.totalRows - 1)) * 100}%` : '0%';

  const isMagicCasting =
    characterId === 'srikandi' && activeAnim === 'CAST_MAGIC' && !prefersReducedMotion;
  const isReadingBook =
    characterId === 'srikandi' && activeAnim === 'READ' && !prefersReducedMotion;

  return (
    <button
      type="button"
      onClick={onClickCharacter}
      onMouseEnter={() => {
        setIsHovered(true);
        onMouseEnterCharacter?.();
      }}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={label}
      title={`${label} — Klik untuk berinteraksi`}
      style={{
        left,
        top,
        width,
        height,
      }}
      className={`group absolute z-15 cursor-pointer touch-manipulation select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#fde047] rounded-xl transition-transform duration-200 ease-out motion-reduce:transition-none ${
        isHovered ? 'scale-[1.03]' : 'scale-100'
      }`}
    >
      {/* Crisp Pixel-Art Frame-by-Frame Sprite Sheet Viewport */}
      <div
        aria-hidden="true"
        style={{
          backgroundImage: `url(${spec.sheetUrl})`,
          backgroundSize: `${spec.maxCols * 100}% ${spec.totalRows * 100}%`,
          backgroundPosition: `${bgPosX} ${bgPosY}`,
          backgroundRepeat: 'no-repeat',
          imageRendering: 'pixelated',
        }}
        className={`w-full h-full pixelated transition-opacity duration-150 ${
          isHovered
            ? 'drop-shadow-[0_0_10px_rgba(253,224,71,0.55)]'
            : 'drop-shadow-[0_4px_6px_rgba(13,10,31,0.45)]'
        }`}
      />

      {/* Srikandi Bahasa Magic Book Particle Effects (Purple, Gold & Light Blue — max 5 subtle particles) */}
      {(isMagicCasting || isReadingBook) && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-visible">
          <span className="menu-magic-particle menu-magic-p1 bg-[#fde047]" />
          <span className="menu-magic-particle menu-magic-p2 bg-[#c084fc]" />
          <span className="menu-magic-particle menu-magic-p3 bg-[#7dd3fc]" />
          {isMagicCasting && (
            <>
              <span className="menu-magic-particle menu-magic-p4 bg-[#fde047]" />
              <span className="menu-magic-particle menu-magic-p5 bg-[#e879f9]" />
            </>
          )}
        </div>
      )}

      {/* Wira Bahasa Adventure Bag Badge when INVENTORI is clicked */}
      {showBagBadge && characterId === 'wira' && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-2 right-1 z-25 px-2 py-1 bg-[#78350f] border-2 border-[#fde047] shadow-lg flex items-center gap-1 animate-bounce"
        >
          <svg viewBox="0 0 12 12" className="w-3.5 h-3.5 pixelated">
            <rect x="3" y="1" width="6" height="2" fill="#facc15" />
            <rect x="1" y="3" width="10" height="8" fill="#d97706" />
            <rect x="2" y="4" width="8" height="3" fill="#f59e0b" />
            <rect x="5" y="5" width="2" height="3" fill="#fef08a" />
          </svg>
          <span className="font-pixel font-bold text-[9px] text-[#fef08a]">BEG WIRA</span>
        </div>
      )}
    </button>
  );
};
