import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Award,
  BookOpen,
  ImagePlus,
   Play,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { AvatarId, GameLogoConfig } from '../types/game';
import { PixelPortrait } from './PixelPortrait';
import { PixelAudioVisualizer } from './PixelAudioVisualizer';
import { GameLogo } from './GameLogo';
import { PortraitRotationPrompt } from './PortraitRotationPrompt';
import { computeContained16By9Stage, useMobileViewport } from '../hooks/useMobileViewport';
import {
  AnyCharacterAnimName,
  MenuCharacterId,
  MenuCharacterSprite,
  TriggeredAnimRequest,
} from './MenuCharacterSprite';
import { soundEngine } from '../audio/soundEngine';

interface TitleScreenProps {
  logoConfig: GameLogoConfig;
  hasSavedProgress: boolean;
  savedPlayerName: string;
  savedAvatarId: AvatarId;
  savedCrystals: number;
  savedScore: number;
  savedLastLocationName?: string;
  soundEnabled: boolean;
  musicEnabled?: boolean;
  onToggleSound: () => void;
  onStartNewGameConfirm: () => void;
  onContinueSavedGame: () => void;
  onOpenLearning: () => void;
  onOpenInventory: () => void;
  onOpenMap: () => void;
  onOpenSettings: () => void;
  onOpenGuide?: () => void;
  onOpenCredits?: () => void;
  onOpenLogoManager?: () => void;
  onRunWithScreenFade?: (action: () => void) => void;
  isOverlayModalOpen?: boolean;
}

type MenuButtonId =
  | 'mula-pengembaraan'
  | 'bahan-pembelajaran'
  | 'inventori'
  | 'peta-kota';

interface CharacterDialogueState {
  characterId: MenuCharacterId;
  speakerName: string;
  speakerBadgeColor: string;
  message: string;
}

const CLICK_REACTION_DURATION_MS = 380;
const LOCAL_FADE_DURATION_MS = 180;

const CHARACTER_CLICK_DIALOGUES: Record<MenuCharacterId, CharacterDialogueState> = {
  wira: {
    characterId: 'wira',
    speakerName: 'WIRA BAHASA',
    speakerBadgeColor: '#fde047',
    message: 'Selamat datang ke Kota Tatabahasa! Ayuh mulakan pengembaraan!',
  },
  srikandi: {
    characterId: 'srikandi',
    speakerName: 'SRIKANDI BAHASA',
    speakerBadgeColor: '#f472b6',
    message: 'Jom kuasai tatabahasa dan kumpulkan 30 Kristal Kata!',
  },
  owl: {
    characterId: 'owl',
    speakerName: 'BURUNG HANTU BIJAKSANA',
    speakerBadgeColor: '#c084fc',
    message: 'Setiap cabaran mempunyai petunjuk. Baca dengan teliti sebelum menjawab!',
  },
};

const TITLE_SPARKLES = [
  { left: '22.8%', top: '8.5%', delay: '0ms', color: '#fde047' },
  { left: '73.6%', top: '10.2%', delay: '550ms', color: '#7dd3fc' },
  { left: '26.4%', top: '34.5%', delay: '1100ms', color: '#f472b6' },
  { left: '71.8%', top: '33.0%', delay: '1650ms', color: '#fde047' },
] as const;

const AMBIENT_TWINKLE_STARS = [
  { left: '19.5%', top: '6.8%', delay: '200ms', color: '#fef08a' },
  { left: '34.2%', top: '4.2%', delay: '950ms', color: '#bae6fd' },
  { left: '64.5%', top: '5.5%', delay: '1500ms', color: '#fef08a' },
  { left: '81.0%', top: '14.5%', delay: '600ms', color: '#e9d5ff' },
  { left: '95.2%', top: '16.8%', delay: '1250ms', color: '#bae6fd' },
] as const;

const AMBIENT_PETALS = [
  { left: '8.5%', top: '52%', delay: '0s', color: '#f472b6' },
  { left: '29.5%', top: '46%', delay: '2.4s', color: '#f9a8d4' },
  { left: '54.0%', top: '56%', delay: '4.8s', color: '#e879f9' },
  { left: '79.5%', top: '50%', delay: '1.6s', color: '#f472b6' },
] as const;

export const TitleScreen: React.FC<TitleScreenProps> = ({
  logoConfig,
  hasSavedProgress,
  savedPlayerName,
  savedAvatarId,
  savedCrystals,
  savedScore,
  savedLastLocationName,
  soundEnabled,
  musicEnabled = true,
  onToggleSound,
  onStartNewGameConfirm,
  onContinueSavedGame,
  onOpenLearning,
  onOpenInventory,
  onOpenMap,
  onOpenSettings,
  onOpenGuide,
  onOpenCredits,
  onOpenLogoManager,
  onRunWithScreenFade,
  isOverlayModalOpen = false,
}) => {
  const stageAreaRef = useRef<HTMLDivElement | null>(null);
  const { isPortraitPhone } = useMobileViewport();
  const [stageSize, setStageSize] = useState<{ width: number; height: number } | null>(null);
  const [bgImgSrc, setBgImgSrc] = useState<string>('/assets/ui/menu/main-menu-clean-bg.png');
  const [usingFallbackStaticBg, setUsingFallbackStaticBg] = useState<boolean>(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() =>
    typeof window !== 'undefined'
      ? Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
      : false
  );

  // Initial entrance fade-in on mount
  const [hasEntered, setHasEntered] = useState<boolean>(false);

  // Modals & Interactive Panels on Title Screen
  const [showStartChoiceModal, setShowStartChoiceModal] = useState<boolean>(false);
  const [confirmOverwriteSave, setConfirmOverwriteSave] = useState<boolean>(false);
  const [showLogoWelcomeModal, setShowLogoWelcomeModal] = useState<boolean>(false);
  const [activeCharDialogue, setActiveCharDialogue] = useState<CharacterDialogueState | null>(null);

  // Hover & Click states for the 4 RPG Menu Buttons + Top-Right Icons
  const [hoveredMenuBtn, setHoveredMenuBtn] = useState<MenuButtonId | null>(null);
  const [clickingMenuBtn, setClickingMenuBtn] = useState<MenuButtonId | null>(null);
  const [pressedIconId, setPressedIconId] = useState<string | null>(null);
  const [crystalFlashActive, setCrystalFlashActive] = useState<boolean>(false);
  const [bookOverlayOpenAnim, setBookOverlayOpenAnim] = useState<boolean>(false);
  const [mapScrollOverlayAnim, setMapScrollOverlayAnim] = useState<boolean>(false);
  const [showWiraBagBadge, setShowWiraBagBadge] = useState<boolean>(false);
  const [localFadeOut, setLocalFadeOut] = useState<boolean>(false);

  // Triggered character sprite animations (for clicks & menu reactions)
  const animNonceRef = useRef<number>(1);
  const [wiraTrigger, setWiraTrigger] = useState<TriggeredAnimRequest | null>(null);
  const [srikandiTrigger, setSrikandiTrigger] = useState<TriggeredAnimRequest | null>(null);
  const [owlTrigger, setOwlTrigger] = useState<TriggeredAnimRequest | null>(null);

  const isBusyRef = useRef<boolean>(false);
  const timersRef = useRef<number[]>([]);
  const dialogueAutoHideRef = useRef<number | null>(null);

  const scheduleTimer = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timersRef.current = timersRef.current.filter((t) => t !== id);
      fn();
    }, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  const triggerCharAnim = useCallback(
    (charId: MenuCharacterId, anim: AnyCharacterAnimName, repeatCount = 2) => {
      const nextReq: TriggeredAnimRequest = {
        anim,
        nonce: ++animNonceRef.current,
        repeatCount,
      };
      if (charId === 'wira') setWiraTrigger(nextReq);
      else if (charId === 'srikandi') setSrikandiTrigger(nextReq);
      else setOwlTrigger(nextReq);
    },
    []
  );

  useEffect(() => {
    const rafId = window.requestAnimationFrame(() => {
      setHasEntered(true);
    });
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const onMqChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq?.addEventListener?.('change', onMqChange);

    return () => {
      window.cancelAnimationFrame(rafId);
      mq?.removeEventListener?.('change', onMqChange);
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
      if (dialogueAutoHideRef.current !== null) {
        window.clearTimeout(dialogueAutoHideRef.current);
      }
    };
  }, []);

  // Measure available stage container & maintain exact 16:9 box matching 1280x720 scene
  useEffect(() => {
    const updateLayout = () => {
      const container = stageAreaRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const portraitReserve = isPortraitPhone ? 96 : 0;
      const nextStage = computeContained16By9Stage(
        rect.width,
        Math.max(1, rect.height - portraitReserve)
      );
      if (nextStage) {
        setStageSize(nextStage);
      }
    };

    updateLayout();

    const observer =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateLayout) : null;
    if (observer && stageAreaRef.current) {
      observer.observe(stageAreaRef.current);
    }

    window.addEventListener('resize', updateLayout);
    window.addEventListener('orientationchange', updateLayout);
    window.visualViewport?.addEventListener('resize', updateLayout);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updateLayout);
      window.removeEventListener('orientationchange', updateLayout);
      window.visualViewport?.removeEventListener('resize', updateLayout);
    };
  }, [isPortraitPhone]);

  const executeWithUniformFade = useCallback(
    (action: () => void) => {
      if (prefersReducedMotion) {
        isBusyRef.current = false;
        action();
        return;
      }

      if (onRunWithScreenFade) {
        onRunWithScreenFade(() => {
          action();
        });
        scheduleTimer(() => {
          isBusyRef.current = false;
        }, LOCAL_FADE_DURATION_MS * 2 + 40);
        return;
      }

      setLocalFadeOut(true);
      scheduleTimer(() => {
        action();
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            setLocalFadeOut(false);
            scheduleTimer(() => {
              isBusyRef.current = false;
            }, LOCAL_FADE_DURATION_MS);
          });
        });
      }, LOCAL_FADE_DURATION_MS);
    },
    [onRunWithScreenFade, prefersReducedMotion, scheduleTimer]
  );

  const executeMulaPengembaraan = useCallback(() => {
    if (hasSavedProgress) {
      setConfirmOverwriteSave(false);
      setShowStartChoiceModal(true);
    } else {
      onStartNewGameConfirm();
    }
  }, [hasSavedProgress, onStartNewGameConfirm]);

  const handleCloseStartChoiceModal = useCallback(() => {
    if (isBusyRef.current) return;
    isBusyRef.current = true;
    soundEngine.playButtonClick();
    executeWithUniformFade(() => {
      setShowStartChoiceModal(false);
      setConfirmOverwriteSave(false);
    });
  }, [executeWithUniformFade]);

  // Interactive Character Click Handler (Section 8)
  const handleCharacterClick = useCallback(
    (charId: MenuCharacterId) => {
      if (charId === 'wira') {
        soundEngine.playNpcInteract();
        triggerCharAnim('wira', 'WAVE', 2);
      } else if (charId === 'srikandi') {
        soundEngine.playMagicSparkle();
        triggerCharAnim('srikandi', 'CAST_MAGIC', 2);
      } else {
        soundEngine.playMapUnfold();
        triggerCharAnim('owl', 'LIFT_SCROLL', 2);
      }

      setActiveCharDialogue(CHARACTER_CLICK_DIALOGUES[charId]);
      if (dialogueAutoHideRef.current !== null) {
        window.clearTimeout(dialogueAutoHideRef.current);
      }
      dialogueAutoHideRef.current = window.setTimeout(() => {
        setActiveCharDialogue(null);
      }, 5500);
    },
    [triggerCharAnim]
  );

  // Coordinated Menu Button Click + Character Reactions + Audio + Complete Click Anim Before Transition (Sections 3-6 & 9)
  const handleMenuButtonClick = useCallback(
    (btnId: MenuButtonId) => {
      if (isBusyRef.current) return;
      isBusyRef.current = true;
      setActiveCharDialogue(null);

      if (btnId === 'mula-pengembaraan') {
        soundEngine.playAdventureStart();
        triggerCharAnim('wira', 'JUMP', 1);
        triggerCharAnim('srikandi', 'CAST_MAGIC', 1);
        triggerCharAnim('owl', 'FLAP', 2);
        if (!prefersReducedMotion) setCrystalFlashActive(true);
      } else if (btnId === 'bahan-pembelajaran') {
        soundEngine.playBookOpen();
        triggerCharAnim('srikandi', 'CAST_MAGIC', 1);
        if (!prefersReducedMotion) setBookOverlayOpenAnim(true);
      } else if (btnId === 'inventori') {
        soundEngine.playBagOpen();
        triggerCharAnim('wira', 'WAVE', 1);
        setShowWiraBagBadge(true);
      } else if (btnId === 'peta-kota') {
        soundEngine.playMapUnfold();
        triggerCharAnim('owl', 'LIFT_SCROLL', 2);
        if (!prefersReducedMotion) setMapScrollOverlayAnim(true);
      }

      if (prefersReducedMotion) {
        setShowWiraBagBadge(false);
        isBusyRef.current = false;
        if (btnId === 'mula-pengembaraan') executeMulaPengembaraan();
        else if (btnId === 'bahan-pembelajaran') onOpenLearning();
        else if (btnId === 'inventori') onOpenInventory();
        else onOpenMap();
        return;
      }

      setClickingMenuBtn(btnId);
      scheduleTimer(() => {
        setClickingMenuBtn(null);
        setCrystalFlashActive(false);
        setBookOverlayOpenAnim(false);
        setMapScrollOverlayAnim(false);
        setShowWiraBagBadge(false);

        if (btnId === 'mula-pengembaraan') {
          executeWithUniformFade(executeMulaPengembaraan);
        } else if (btnId === 'bahan-pembelajaran') {
          executeWithUniformFade(onOpenLearning);
        } else if (btnId === 'inventori') {
          executeWithUniformFade(onOpenInventory);
        } else {
          executeWithUniformFade(onOpenMap);
        }
      }, CLICK_REACTION_DURATION_MS);
    },
    [
      executeMulaPengembaraan,
      executeWithUniformFade,
      onOpenInventory,
      onOpenLearning,
      onOpenMap,
      prefersReducedMotion,
      scheduleTimer,
      triggerCharAnim,
    ]
  );

  // Top-right Icon Click Handler
  const handleIconClick = useCallback(
    (iconId: string, action: () => void, customSfx?: () => void) => {
      if (isBusyRef.current) return;
      if (customSfx) customSfx();
      else soundEngine.playButtonClick();

      if (prefersReducedMotion) {
        action();
        return;
      }
      setPressedIconId(iconId);
      scheduleTimer(() => {
        setPressedIconId(null);
        action();
      }, 160);
    },
    [prefersReducedMotion, scheduleTimer]
  );

  // Keyboard shortcuts (Escape closes open local panels; Enter starts MULA PENGEMBARAAN)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isOverlayModalOpen) return;
      if (showLogoWelcomeModal) {
        if (e.code === 'Escape') {
          soundEngine.playButtonClick();
          setShowLogoWelcomeModal(false);
        }
        return;
      }
      if (activeCharDialogue && e.code === 'Escape') {
        setActiveCharDialogue(null);
        return;
      }
      if (showStartChoiceModal) {
        if (e.code === 'Escape') {
          handleCloseStartChoiceModal();
        }
        return;
      }
      if (
        e.code === 'Enter' &&
        !(e.target instanceof HTMLButtonElement) &&
        !(e.target instanceof HTMLInputElement)
      ) {
        handleMenuButtonClick('mula-pengembaraan');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    activeCharDialogue,
    handleCloseStartChoiceModal,
    handleMenuButtonClick,
    isOverlayModalOpen,
    showLogoWelcomeModal,
    showStartChoiceModal,
  ]);

  const anyMenuOverlayPaused =
    isOverlayModalOpen || showStartChoiceModal || showLogoWelcomeModal;

  const menuButtons: {
    id: MenuButtonId;
    label: string;
    imgUrl: string;
    left: string;
    top: string;
    width: string;
    height: string;
    entranceDelay: string;
    auraClass: string;
    hoverScaleClass: string;
  }[] = [
    {
      id: 'mula-pengembaraan',
      label: 'Mula Pengembaraan',
      imgUrl: '/assets/ui/menu/btn-mula.png',
      left: '45.7%',
      top: '53.5%',
      width: '27.4%',
      height: '12.35%',
      entranceDelay: '300ms',
      auraClass: 'menu-aura-gold',
      hoverScaleClass: 'hover:scale-[1.05] focus-visible:scale-[1.05]',
    },
    {
      id: 'bahan-pembelajaran',
      label: 'Bahan Pembelajaran',
      imgUrl: '/assets/ui/menu/btn-bahan.png',
      left: '47.95%',
      top: '66.1%',
      width: '24.8%',
      height: '9.85%',
      entranceDelay: '450ms',
      auraClass: 'menu-aura-purple',
      hoverScaleClass: 'hover:scale-[1.04] focus-visible:scale-[1.04]',
    },
    {
      id: 'inventori',
      label: 'Inventori',
      imgUrl: '/assets/ui/menu/btn-inventori.png',
      left: '47.95%',
      top: '76.1%',
      width: '24.8%',
      height: '9.3%',
      entranceDelay: '600ms',
      auraClass: 'menu-aura-wood',
      hoverScaleClass: 'hover:scale-[1.04] focus-visible:scale-[1.04]',
    },
    {
      id: 'peta-kota',
      label: 'Peta Kota — Peta Dunia Kerajaan Tatabahasa',
      imgUrl: '/assets/ui/menu/btn-peta.png',
      left: '47.95%',
      top: '85.55%',
      width: '24.9%',
      height: '10.1%',
      entranceDelay: '750ms',
      auraClass: 'menu-aura-blue',
      hoverScaleClass: 'hover:scale-[1.04] focus-visible:scale-[1.04]',
    },
  ];

  const isCompactStage = Boolean(stageSize && stageSize.width < 560);

  return (
    <div
      className={`relative w-full h-full mobile-stage-backdrop flex flex-col items-center justify-center overflow-hidden select-none transition-opacity duration-200 ease-out motion-reduce:transition-none ${
        hasEntered ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Responsive 16:9 Viewport Stage Area (fills screen in landscape; cleanly framed in portrait) */}
      <div
        ref={stageAreaRef}
        className="relative flex-1 w-full min-h-0 flex flex-col items-center justify-center overflow-hidden"
      >
        {isPortraitPhone && (
          <div className="mb-2 px-3 py-1 bg-[#1b1036]/90 border border-[#f6c445]/80 shadow-md flex items-center gap-1.5 z-10">
            <Sparkles className="w-3 h-3 text-[#fde047] shrink-0" />
            <span className="font-pixel font-bold text-[10px] tracking-wider text-[#fef08a]">
              KOTA TATABAHASA · MISI 30 KRISTAL KATA
            </span>
          </div>
        )}

        <div
          style={
            stageSize
              ? { width: `${stageSize.width}px`, height: `${stageSize.height}px` }
              : undefined
          }
          className={`relative overflow-hidden shadow-2xl ${
            isPortraitPhone ? 'border-y-2 border-[#facc15]/85' : ''
          } ${
            stageSize
              ? ''
              : 'aspect-video w-[min(100vw,calc(100dvh*16/9))] max-w-full max-h-full'
          }`}
        >
          {/* 1. CLEAN FANTASY PIXEL-ART BACKGROUND PLATE (16:9, zero duplicate characters/buttons) */}
          <img
            src={bgImgSrc}
            onError={() => {
              if (bgImgSrc !== '/assets/ui/main-menu.png') {
                setBgImgSrc('/assets/ui/main-menu.png');
                setUsingFallbackStaticBg(true);
              }
            }}
            alt="Kota Tatabahasa: Misi 30 Kristal Kata — Latar Istana dan Air Terjun"
            referrerPolicy="no-referrer"
            draggable={false}
            className="w-full h-full object-contain block select-none pointer-events-none pixelated"
          />

          {/* 2. LIGHTWEIGHT AMBIENT BACKGROUND LAYERS (Section 7 — non-intrusive, low particle count) */}
          {!prefersReducedMotion && (
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-5 overflow-hidden">
              {/* Drifting Pixel Clouds in Sky (Left -> Right) */}
              <div
                style={{ top: '7%', left: '-8%' }}
                className="absolute w-[14%] h-[5.5%] ambient-cloud-slow opacity-45"
              >
                <div className="w-full h-full bg-white/65 rounded-sm shadow-[0_2px_0_rgba(186,230,253,0.7)]" />
              </div>
              <div
                style={{ top: '14%', left: '-18%', animationDelay: '-24s' }}
                className="absolute w-[11%] h-[4%] ambient-cloud-slower opacity-35"
              >
                <div className="w-full h-full bg-white/60 rounded-sm" />
              </div>

              {/* Twinkling Low-Intensity Pixel Stars in Sky */}
              {AMBIENT_TWINKLE_STARS.map((st, idx) => (
                <svg
                  key={idx}
                  viewBox="0 0 6 6"
                  style={{
                    left: st.left,
                    top: st.top,
                    animationDelay: st.delay,
                  }}
                  className="absolute w-2.5 h-2.5 pixelated logo-sparkle-star opacity-70"
                >
                  <rect x="2" y="0" width="2" height="6" fill={st.color} />
                  <rect x="0" y="2" width="6" height="2" fill={st.color} />
                </svg>
              ))}

              {/* Flowing Waterfall Shimmer Overlay (Left Waterfall Cliff) */}
              <div
                style={{ left: '2.2%', top: '42.0%', width: '4.6%', height: '16.5%' }}
                className="absolute overflow-hidden rounded-sm"
              >
                <div className="w-full h-[140%] ambient-waterfall-stream flex justify-around">
                  <span className="w-[2px] h-full bg-gradient-to-b from-transparent via-cyan-100/75 to-transparent" />
                  <span className="w-[3px] h-full bg-gradient-to-b from-white/70 via-sky-200/65 to-transparent" />
                  <span className="w-[2px] h-full bg-gradient-to-b from-transparent via-white/80 to-transparent" />
                </div>
              </div>

              {/* Castle Center Crystal & Foreground Crystal Soft Blue/Purple Glow */}
              <div
                style={{ left: '81.6%', top: '25.8%', width: '5.5%', height: '10.8%' }}
                className={`absolute rounded-full bg-radial from-cyan-300/45 via-purple-400/25 to-transparent menu-aura-blue ${
                  crystalFlashActive ? 'scale-150 opacity-100' : ''
                }`}
              />
              <div
                style={{ left: '89.5%', top: '80.5%', width: '8.5%', height: '16.0%' }}
                className={`absolute rounded-full bg-radial from-sky-300/40 via-indigo-400/20 to-transparent menu-aura-purple ${
                  crystalFlashActive ? 'scale-125 opacity-100' : ''
                }`}
              />

              {/* Gentle Drifting Sakura / Meadow Flower Petals (4 lightweight petals) */}
              {AMBIENT_PETALS.map((pt, idx) => (
                <span
                  key={idx}
                  style={{
                    left: pt.left,
                    top: pt.top,
                    animationDelay: pt.delay,
                    backgroundColor: pt.color,
                  }}
                  className="absolute w-2 h-1.5 rounded-[1px] ambient-petal shadow-[0_0_4px_rgba(244,114,182,0.55)]"
                />
              ))}
            </div>
          )}

          {/* 3. ORIGINAL KOTA TATABAHASA TITLE + SUBTITLE EMBLEM (800ms entrance bounce + outer sparkles) */}
          {!usingFallbackStaticBg && (
            <div
              style={{
                left: '21.72%',
                top: '0.55%',
                width: '52.27%',
                height: '52.64%',
              }}
              className="pointer-events-none absolute z-10 select-none menu-title-enter"
            >
              <img
                src="/assets/ui/menu/title-emblem.png"
                alt="KOTA TATABAHASA — Misi 30 Kristal Kata"
                draggable={false}
                className="w-full h-full object-contain block pixelated"
              />
            </div>
          )}

          {/* Subtle Pixel Sparkles Strictly Outside Title Emblem */}
          {!prefersReducedMotion &&
            TITLE_SPARKLES.map((sp, idx) => (
              <svg
                key={idx}
                viewBox="0 0 8 8"
                aria-hidden="true"
                style={{
                  left: sp.left,
                  top: sp.top,
                  animationDelay: sp.delay,
                }}
                className="pointer-events-none absolute z-12 w-3 h-3 sm:w-3.5 sm:h-3.5 pixelated logo-sparkle-star"
              >
                <rect x="3" y="0" width="2" height="8" fill={sp.color} />
                <rect x="0" y="3" width="8" height="2" fill={sp.color} />
                <rect x="3" y="3" width="2" height="2" fill="#ffffff" />
              </svg>
            ))}

          {/* 4. AUTHENTIC PIXEL-ART SPRITE SHEET CHARACTERS (Wira Bahasa, Srikandi Bahasa, Burung Hantu) */}
          {!usingFallbackStaticBg && (
            <>
              {/* BURUNG HANTU BIJAKSANA (Floating left of title) */}
              <MenuCharacterSprite
                characterId="owl"
                label="Burung Hantu Bijaksana"
                left="7.4%"
                top="17.8%"
                width="16.8%"
                height="26.5%"
                paused={anyMenuOverlayPaused}
                prefersReducedMotion={prefersReducedMotion}
                triggeredAnim={owlTrigger}
                onMouseEnterCharacter={() => soundEngine.playButtonHover()}
                onClickCharacter={() => handleCharacterClick('owl')}
              />

              {/* WIRA BAHASA (Standing left foreground) */}
              <MenuCharacterSprite
                characterId="wira"
                label="Wira Bahasa"
                left="3.2%"
                top="44.2%"
                width="24.2%"
                height="53.2%"
                paused={anyMenuOverlayPaused}
                prefersReducedMotion={prefersReducedMotion}
                triggeredAnim={wiraTrigger}
                showBagBadge={showWiraBagBadge}
                onMouseEnterCharacter={() => soundEngine.playButtonHover()}
                onClickCharacter={() => handleCharacterClick('wira')}
              />

              {/* SRIKANDI BAHASA (Standing beside Wira Bahasa with magic book) */}
              <MenuCharacterSprite
                characterId="srikandi"
                label="Srikandi Bahasa"
                left="25.0%"
                top="49.5%"
                width="21.5%"
                height="47.2%"
                paused={anyMenuOverlayPaused}
                prefersReducedMotion={prefersReducedMotion}
                triggeredAnim={srikandiTrigger}
                onMouseEnterCharacter={() => soundEngine.playButtonHover()}
                onClickCharacter={() => handleCharacterClick('srikandi')}
              />
            </>
          )}

          {/* Interactive Pixel-Art RPG Character Dialogue Bubble (Section 8) */}
          {activeCharDialogue && (
            <div
              role="status"
              aria-live="polite"
              style={
                isCompactStage
                  ? { left: '12%', top: '19%', width: '76%' }
                  : activeCharDialogue.characterId === 'owl'
                  ? { left: '6.5%', top: '43.5%' }
                  : activeCharDialogue.characterId === 'wira'
                  ? { left: '3.5%', top: '32.5%' }
                  : { left: '19.5%', top: '36.5%' }
              }
              className={`absolute z-30 ${
                isCompactStage ? 'p-1.5' : 'w-[250px] sm:w-[305px] p-2.5 sm:p-3'
              } pixel-panel-purple shadow-2xl animate-in fade-in zoom-in-95 duration-150`}
            >
              <div className="flex items-center justify-between gap-2 pb-1 mb-1 border-b border-[#5b3ea8]">
                <span
                  style={{ color: activeCharDialogue.speakerBadgeColor }}
                  className={`font-pixel font-bold ${
                    isCompactStage ? 'text-[9px]' : 'text-[11px] sm:text-xs'
                  } tracking-wide truncate`}
                >
                  ✦ {activeCharDialogue.speakerName}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playButtonClick();
                    setActiveCharDialogue(null);
                  }}
                  aria-label="Tutup dialog watak"
                  className="text-[#e9d5ff] hover:text-white cursor-pointer p-0.5 shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p
                className={`font-body font-semibold ${
                  isCompactStage ? 'text-[10px]' : 'text-[11px] sm:text-xs'
                } text-[#fff8e7] leading-snug`}
              >
                “{activeCharDialogue.message}”
              </p>
            </div>
          )}

          {/* 5. 8-Bit Pixel Audio Visualizer +BUNYI HIDUP/MATI Badge + Top-Right Controls */}
          <PixelAudioVisualizer soundEnabled={soundEnabled} musicEnabled={musicEnabled} />

          {/* Explicit BUNYI HIDUP / MATI Quick Pill below Visualizer/Speaker for clear status & 1-click toggle */}
          <button
            type="button"
            onClick={() =>
              handleIconClick(
                'ikon-bunyi',
                () => {
                  onToggleSound();
                  if (!soundEnabled) {
                    window.setTimeout(() => soundEngine.playButtonClick(), 35);
                  }
                },
                () => {
                  if (soundEnabled) soundEngine.playButtonClick();
                }
              )
            }
            onMouseEnter={() => soundEngine.playButtonHover()}
            aria-pressed={!soundEnabled}
            title={soundEnabled ? 'Bunyi Hidup — Klik untuk Matikan' : 'Bunyi Mati — Klik untuk Hidupkan'}
            style={{ left: '71.2%', top: '12.2%' }}
            className={`absolute z-20 ${
              isCompactStage ? 'hidden' : 'px-1.5 sm:px-2 py-0.5 flex'
            } bg-[#1b0f36]/90 hover:bg-[#2b1d52] border border-[#f6c445] rounded items-center gap-1 cursor-pointer transition-transform duration-150 hover:scale-105`}
          >
            {soundEnabled ? (
              <Volume2 className="w-3 h-3 text-[#86efac] shrink-0" />
            ) : (
              <VolumeX className="w-3 h-3 text-[#fb7185] shrink-0" />
            )}
            <span className="font-pixel font-bold text-[8px] sm:text-[10px] text-[#fef08a] whitespace-nowrap">
              {soundEnabled ? 'BUNYI: HIDUP' : 'BUNYI: MATI'}
            </span>
          </button>

          {/* Top-Right Speaker & Settings Hotspots Over Baked Top-Right Icons */}
          <button
            type="button"
            aria-label={
              soundEnabled
                ? 'Bunyi Hidup — Tekan untuk Matikan'
                : 'Bunyi Mati — Tekan untuk Hidupkan'
            }
            aria-pressed={!soundEnabled}
            title={soundEnabled ? 'Bunyi Hidup' : 'Bunyi Mati'}
            onMouseEnter={() => soundEngine.playButtonHover()}
            onClick={() =>
              handleIconClick(
                'ikon-bunyi',
                () => {
                  onToggleSound();
                  if (!soundEnabled) {
                    window.setTimeout(() => soundEngine.playButtonClick(), 35);
                  }
                },
                () => {
                  if (soundEnabled) soundEngine.playButtonClick();
                }
              )
            }
            style={{ left: '86.6%', top: '2.5%', width: '5.6%', height: '9.3%' }}
            className={`menu-hotspot menu-hotspot-icon rounded-xl ${
              pressedIconId === 'ikon-bunyi' ? 'menu-hotspot-pressed' : ''
            } absolute z-20 cursor-pointer touch-manipulation focus:outline-none ${
              !soundEnabled ? 'ring-2 ring-rose-500/85 bg-rose-950/25' : ''
            }`}
          >
            <span className="sr-only">Bunyi Hidup atau Mati</span>
            <span aria-hidden="true" className="menu-hotspot-shimmer" />
            {!soundEnabled && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
              >
                <span className="block w-[78%] h-[3px] bg-rose-500/90 rotate-[-38deg] rounded-full shadow-[0_0_4px_rgba(0,0,0,0.85)]" />
              </span>
            )}
          </button>

          <button
            type="button"
            aria-label="Tetapan Permainan"
            title="Tetapan Permainan"
            onMouseEnter={() => soundEngine.playButtonHover()}
            onClick={() => handleIconClick('ikon-tetapan', onOpenSettings)}
            style={{ left: '93.0%', top: '2.5%', width: '5.6%', height: '9.3%' }}
            className={`menu-hotspot menu-hotspot-icon rounded-xl ${
              pressedIconId === 'ikon-tetapan' ? 'menu-hotspot-pressed' : ''
            } absolute z-20 cursor-pointer touch-manipulation focus:outline-none`}
          >
            <span className="sr-only">Tetapan Permainan</span>
            <span aria-hidden="true" className="menu-hotspot-shimmer" />
          </button>

          {/* 6. OFFICIAL GAME LOGO IN TOP-LEFT CORNER (Exact 16:9 Stage Percentage Position so it scales proportionally on phones & desktops) */}
          <div
            style={{
              left: '1.1%',
              top: '2.0%',
              width: '9.2%',
              height: '16.35%',
            }}
            className="absolute z-25 flex items-center justify-center"
          >
            <button
              type="button"
              onClick={() => {
                soundEngine.playButtonClick();
                setShowLogoWelcomeModal(true);
              }}
              onMouseEnter={() => soundEngine.playButtonHover()}
              title="Logo Rasmi Kota Tatabahasa — Klik untuk maklumat permainan"
              aria-label="Logo Rasmi Kota Tatabahasa — Buka panel Selamat Datang"
              className="w-full h-full rounded-xl cursor-pointer touch-manipulation transition-transform duration-200 ease-out hover:scale-105 active:scale-95 motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#fde047]"
            >
              <GameLogo
                config={logoConfig}
                size="fill"
                className="w-full h-full"
                fadeIn
                floating
                softGlow
                sparkles
              />
            </button>
          </div>

          {/* 7. STAGGERED 4 PIXEL-ART RPG MENU BUTTONS (Sections 2, 3, 4, 5, 6) */}
          {menuButtons.map((btn) => {
            const isHovered = hoveredMenuBtn === btn.id;
            const isClicking = clickingMenuBtn === btn.id;
            const isMula = btn.id === 'mula-pengembaraan';
            const isBahan = btn.id === 'bahan-pembelajaran';
            const isInventori = btn.id === 'inventori';
            const isPeta = btn.id === 'peta-kota';

            return (
              <div
                key={btn.id}
                style={{
                  left: btn.left,
                  top: btn.top,
                  width: btn.width,
                  height: btn.height,
                  animationDelay: prefersReducedMotion ? '0ms' : btn.entranceDelay,
                }}
                className="absolute z-20 menu-btn-enter"
              >
                <div className={`w-full h-full ${isMula ? 'menu-mula-float' : ''}`}>
                  <button
                    type="button"
                    aria-label={btn.label}
                    title={btn.label}
                    onMouseEnter={() => {
                      setHoveredMenuBtn(btn.id);
                      if (isBahan) soundEngine.playBookHover();
                      else soundEngine.playButtonHover();
                    }}
                    onMouseLeave={() => {
                      setHoveredMenuBtn((curr) => (curr === btn.id ? null : curr));
                    }}
                    onClick={() => handleMenuButtonClick(btn.id)}
                    className={`relative w-full h-full block cursor-pointer touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-[#fde047] rounded-2xl transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      btn.hoverScaleClass
                    } active:scale-95 ${isClicking ? 'menu-btn-clicking' : ''}`}
                  >
                    {/* Soft Palette-Matched Idle & Hover Aura Behind Button */}
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute inset-[6%] rounded-xl ${btn.auraClass} ${
                        isHovered ? '!opacity-95 scale-[1.02]' : ''
                      } transition-opacity duration-200`}
                    />

                    {/* Extracted Crisp Original Pixel-Art Button Graphic */}
                    {!usingFallbackStaticBg && (
                      <img
                        src={btn.imgUrl}
                        alt=""
                        aria-hidden="true"
                        draggable={false}
                        className="relative z-10 w-full h-full object-contain block pixelated select-none pointer-events-none"
                      />
                    )}
                    <span className="sr-only">{btn.label}</span>

                    {/* Sub-Icon Micro-Animations & Shimmer Sweeps Per Button */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-[8%] z-20 overflow-hidden rounded-xl"
                    >
                      {/* Shimmer glint sweep (Idle on Inventori & Peta Kota, plus Hover on all) */}
                      <span
                        className={`absolute top-[-25%] bottom-[-25%] left-0 w-[36%] bg-gradient-to-r from-transparent via-white/35 to-transparent ${
                          isInventori
                            ? 'menu-idle-glint'
                            : isPeta
                            ? 'menu-blue-border-sweep'
                            : isHovered
                            ? 'translate-x-[300%] opacity-90 transition-transform duration-500'
                            : 'translate-x-[-150%] opacity-0'
                        }`}
                      />
                    </span>

                    {/* Button 1 (MULA PENGEMBARAAN): Pulsing Play Triangle Glow + Hover Nudge */}
                    {isMula && (
                      <span
                        aria-hidden="true"
                        style={{ left: '15.2%', top: '20%', width: '15.5%', height: '58%' }}
                        className={`pointer-events-none absolute z-20 flex items-center justify-center transition-transform duration-200 ${
                          isHovered ? 'translate-x-[3px] scale-110' : 'menu-play-pulse'
                        }`}
                      >
                        <span className="w-3.5 h-3.5 rounded-full bg-yellow-100/45 blur-[2px]" />
                      </span>
                    )}

                    {/* Button 2 (BAHAN PEMBELAJARAN): Subtle Magic Book Sparkle */}
                    {isBahan && (
                      <span
                        aria-hidden="true"
                        style={{ left: '12.5%', top: '16%', width: '19%', height: '66%' }}
                        className={`pointer-events-none absolute z-20 flex items-center justify-center ${
                          isHovered ? 'scale-110 -translate-y-0.5' : 'menu-book-idle'
                        } transition-transform duration-200`}
                      >
                        <Sparkles
                          className={`w-3.5 h-3.5 text-[#fef08a] drop-shadow-[0_0_4px_rgba(250,204,21,0.9)] ${
                            isHovered ? 'opacity-100' : 'opacity-55'
                          }`}
                        />
                      </span>
                    )}

                    {/* Button 3 (INVENTORI): Subtle Golden Bag Glint on Hover */}
                    {isInventori && isHovered && (
                      <span
                        aria-hidden="true"
                        style={{ left: '12.5%', top: '15%', width: '19%', height: '68%' }}
                        className="pointer-events-none absolute z-20 flex items-center justify-center -translate-y-0.5 scale-105 transition-transform duration-150"
                      >
                        <span className="w-2 h-2 bg-[#fef08a] rotate-45 shadow-[0_0_6px_#fde047]" />
                      </span>
                    )}

                    {/* Button 4 (PETA KOTA): Pulsing Map Location Pin Glow + Lift on Hover */}
                    {isPeta && (
                      <span
                        aria-hidden="true"
                        style={{ left: '16.5%', top: '10%', width: '12%', height: '55%' }}
                        className={`pointer-events-none absolute z-20 flex items-center justify-center transition-transform duration-200 ${
                          isHovered ? '-translate-y-1 scale-110' : 'menu-pin-idle'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-200/65 shadow-[0_0_8px_#38bdf8]" />
                      </span>
                    )}

                    {/* Click Golden / Magic Flash Burst Before Transition */}
                    {isClicking && (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 z-30 rounded-2xl border-2 border-[#fef08a] bg-yellow-200/35 shadow-[0_0_24px_#fde047] menu-click-flash"
                      />
                    )}
                  </button>
                </div>
              </div>
            );
          })}

          {/* Click Transition Micro-FX Overlays (Book Open / Map Scroll Unfurl) */}
          {bookOverlayOpenAnim && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-35 flex items-center justify-center bg-purple-950/25 animate-in fade-in duration-150"
            >
              <div className="px-5 py-3 pixel-panel-purple flex items-center gap-3 scale-105">
                <BookOpen className="w-7 h-7 text-[#fde047] animate-pulse" />
                <span className="font-pixel font-bold text-sm sm:text-base text-[#fef08a]">
                  MEMBUKA KITAB TATABAHASA...
                </span>
              </div>
            </div>
          )}

          {mapScrollOverlayAnim && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-35 flex items-center justify-center bg-sky-950/25 animate-in fade-in duration-150"
            >
              <div className="px-5 py-3 pixel-panel-parchment flex items-center gap-3 scale-105">
                <Sparkles className="w-6 h-6 text-[#0284c7] animate-spin" />
                <span className="font-pixel font-bold text-sm sm:text-base text-[#3b1d06]">
                  MEMBUKA PETA KERAJAAN TATABAHASA...
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Portrait Orientation Guidance Card Directly Below 16:9 Stage (Requirement 7) */}
        {isPortraitPhone && (
          <div className="w-full px-3 mt-3 flex justify-center z-20">
            <PortraitRotationPrompt variant="card" />
          </div>
        )}
      </div>

      {/* Self-contained Local Fade Veil */}
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed inset-0 z-55 bg-[#0d0a1f] transition-opacity duration-180 ease-in-out motion-reduce:transition-none ${
          localFadeOut ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Section 8 (Part A): Official Logo Welcome Modal ("SELAMAT DATANG KE KOTA TATABAHASA!") */}
      {showLogoWelcomeModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="logo-welcome-heading"
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-3 sm:p-4"
        >
          <div className="w-full max-w-md max-h-[92dvh] overflow-y-auto pixel-scroll pixel-panel-purple p-4 sm:p-6 space-y-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b-2 border-[#5b3ea8]">
              <div className="flex items-center gap-3">
                <GameLogo config={logoConfig} size="xs" softGlow />
                <h2
                  id="logo-welcome-heading"
                  className="font-pixel font-bold text-base sm:text-lg text-[#fde047] leading-snug"
                >
                  SELAMAT DATANG KE KOTA TATABAHASA!
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playButtonClick();
                  setShowLogoWelcomeModal(false);
                }}
                aria-label="Tutup Panel Selamat Datang"
                className="w-8 h-8 pixel-btn-purple flex items-center justify-center shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-[#f3e8ff] leading-relaxed">
              Kembara merentasi enam wilayah fantasi 2D Pixel Art bersama{' '}
              <span className="font-bold text-[#fde047]">Wira Bahasa</span>,{' '}
              <span className="font-bold text-[#f9a8d4]">Srikandi Bahasa</span>, dan{' '}
              <span className="font-bold text-[#c4b5fd]">Burung Hantu Bijaksana</span> untuk
              mengesan kesalahan ayat serta memulihkan kesemua{' '}
              <span className="font-bold text-[#7dd3fc]">30 Kristal Kata</span>!
            </p>

            {/* Preserve Quick Access to Panduan, Kredit & Pengurusan Logo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              {onOpenGuide && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playButtonClick();
                    setShowLogoWelcomeModal(false);
                    onOpenGuide();
                  }}
                  className="py-2 px-2.5 pixel-btn-blue font-pixel font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                  <span>PANDUAN</span>
                </button>
              )}
              {onOpenCredits && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playButtonClick();
                    setShowLogoWelcomeModal(false);
                    onOpenCredits();
                  }}
                  className="py-2 px-2.5 pixel-btn-wood font-pixel font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5 shrink-0" />
                  <span>KREDIT</span>
                </button>
              )}
              {onOpenLogoManager && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playButtonClick();
                    setShowLogoWelcomeModal(false);
                    onOpenLogoManager();
                  }}
                  className="py-2 px-2.5 pixel-btn-purple font-pixel font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ImagePlus className="w-3.5 h-3.5 shrink-0" />
                  <span>URUS LOGO</span>
                </button>
              )}
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playButtonClick();
                  setShowLogoWelcomeModal(false);
                }}
                className="w-full py-2.5 px-4 pixel-btn-gold font-pixel font-bold text-sm flex items-center justify-center cursor-pointer"
              >
                TUTUP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Progress Choice Modal ("SAMBUNG PENGEMBARAAN" vs "MULA PERMAINAN BAHARU") */}
      {showStartChoiceModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-md max-h-[92dvh] overflow-y-auto pixel-scroll pixel-panel-purple p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#5b3ea8]">
              <h2 className="font-pixel font-bold text-xl sm:text-2xl text-[#fde047]">
                MULA PENGEMBARAAN
              </h2>
              <button
                type="button"
                onClick={handleCloseStartChoiceModal}
                className="w-9 h-9 pixel-btn-purple flex items-center justify-center cursor-pointer"
                aria-label="Tutup Pilihan Permainan"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Saved Player Summary */}
            <div className="p-3.5 bg-[#1b1036] border-2 border-[#f6c445] flex items-center gap-3">
              <div className="w-14 h-14 bg-[#120a24] border-2 border-[#fde047] flex items-center justify-center shrink-0">
                <PixelPortrait mode="avatar" avatarId={savedAvatarId} anim="idle" size={48} />
              </div>
              <div className="min-w-0">
                <div className="font-pixel font-bold text-base text-white truncate">
                  {savedPlayerName}
                </div>
                <div className="text-xs text-[#e9d5ff] mt-0.5">
                  Kristal Kata:{' '}
                  <span className="font-mono-num font-bold text-[#7dd3fc]">
                    {savedCrystals} / 30
                  </span>{' '}
                  · Markah:{' '}
                  <span className="font-mono-num font-bold text-[#fde047]">{savedScore}</span>
                </div>
                {savedLastLocationName && (
                  <div className="text-[11px] font-bold text-[#86efac] mt-0.5 truncate">
                    Lokasi Terakhir: {savedLastLocationName}
                  </div>
                )}
              </div>
            </div>

            {!confirmOverwriteSave ? (
              <div className="space-y-3 pt-1">
                <button
                  type="button"
                  onMouseEnter={() => soundEngine.playButtonHover()}
                  onClick={() => {
                    if (isBusyRef.current) return;
                    isBusyRef.current = true;
                    soundEngine.playAdventureStart();
                    executeWithUniformFade(() => {
                      setShowStartChoiceModal(false);
                      onContinueSavedGame();
                    });
                  }}
                  className="w-full py-3 px-4 pixel-btn-gold font-pixel font-bold text-base flex items-center justify-center gap-2.5 cursor-pointer whitespace-nowrap"
                >
                  <Play className="w-5 h-5 fill-current shrink-0" />
                  <span>SAMBUNG PENGEMBARAAN</span>
                </button>

                <button
                  type="button"
                  onMouseEnter={() => soundEngine.playButtonHover()}
                  onClick={() => {
                    soundEngine.playButtonClick();
                    setConfirmOverwriteSave(true);
                  }}
                  className="w-full py-2.5 px-4 pixel-btn-wood font-pixel font-bold text-sm flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw className="w-4 h-4 shrink-0" />
                  <span>MULA PERMAINAN BAHARU</span>
                </button>
              </div>
            ) : (
              <div className="p-4 bg-[#3b0a1d] border-2 border-[#fb7185] space-y-3 text-center">
                <div className="flex items-center justify-center gap-2 text-[#fda4af] font-pixel font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>SAHKAN PERMAINAN BAHARU</span>
                </div>
                <p className="text-xs sm:text-sm text-[#ffe4e6] leading-relaxed">
                  Kemajuan sedia ada ({savedCrystals} / 30 Kristal Kata dan {savedScore} markah)
                  akan dipadamkan untuk memulakan pengembaraan baharu. Teruskan?
                </p>
                <div className="flex items-center justify-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (isBusyRef.current) return;
                      isBusyRef.current = true;
                      soundEngine.playAdventureStart();
                      executeWithUniformFade(() => {
                        setShowStartChoiceModal(false);
                        setConfirmOverwriteSave(false);
                        onStartNewGameConfirm();
                      });
                    }}
                    className="px-4 py-2 bg-[#e11d48] hover:bg-[#be123c] text-white font-pixel font-bold text-xs sm:text-sm border-2 border-[#fde047] cursor-pointer whitespace-nowrap"
                  >
                    YA, MULA BAHARU
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playButtonClick();
                      setConfirmOverwriteSave(false);
                    }}
                    className="px-4 py-2 pixel-btn-purple font-pixel font-bold text-xs sm:text-sm cursor-pointer whitespace-nowrap"
                  >
                    BATAL
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
