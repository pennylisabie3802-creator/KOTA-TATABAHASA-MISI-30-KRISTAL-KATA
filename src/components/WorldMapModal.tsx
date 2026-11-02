import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Compass,
  Edit3,
  ImagePlus,
  MapPin,
  Menu,
  Navigation,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react';
import {
  ExplorationStatus,
  HotspotRect,
  HotspotScopeId,
  JournalRecord,
  LocationAssetRecord,
  LocationAssetSlotId,
  MapId,
  RegionId,
} from '../types/game';
import { REGION_DIRECTORY } from '../data/sideActivities';
import { getQuestionsByMap, getQuestionsByMission } from '../data/questions';
import { getSlotByRegionId } from '../utils/locationAssetStore';
import { soundEngine } from '../audio/soundEngine';
import { PixelPortrait } from './PixelPortrait';
import { BottomGameNavBar } from './BottomGameNavBar';
import { HotspotEditorOverlay } from './HotspotEditorOverlay';
import { PortraitRotationPrompt } from './PortraitRotationPrompt';
import { computeContained16By9Stage, useMobileViewport } from '../hooks/useMobileViewport';

interface WorldMapModalProps {
  isOpen: boolean;
  mode?: 'fullscreen' | 'modal';
  currentMap: MapId;
  isPlayingMode: boolean;
  completedQuestions: Record<number, JournalRecord>;
  getRegionStatus: (regionId: RegionId) => ExplorationStatus;
  locationAssets: Record<LocationAssetSlotId, LocationAssetRecord>;
  worldMapHotspots: HotspotRect[];
  isHotspotEditMode: boolean;
  onToggleHotspotEditMode: () => void;
  onSaveHotspots: (scope: HotspotScopeId, rects: HotspotRect[]) => void;
  onResetHotspots: (scope: HotspotScopeId) => void;
  onOpenLocationAssetManager: (focusSlot?: LocationAssetSlotId | null) => void;
  onSelectEnterRegion: (regionId: RegionId) => void;
  onOpenJournal?: () => void;
  onOpenInventory?: () => void;
  onOpenProgress?: () => void;
  onOpenSettings?: () => void;
  onOpenGuide?: () => void;
  onClose: () => void;
}

export const WorldMapModal: React.FC<WorldMapModalProps> = ({
  isOpen,
  mode = 'modal',
  currentMap,
  isPlayingMode,
  completedQuestions,
  getRegionStatus,
  locationAssets,
  worldMapHotspots,
  isHotspotEditMode,
  onToggleHotspotEditMode,
  onSaveHotspots,
  onResetHotspots,
  onOpenLocationAssetManager,
  onSelectEnterRegion,
  onOpenJournal,
  onOpenInventory,
  onOpenProgress,
  onOpenSettings,
  onOpenGuide,
  onClose,
}) => {
  const outerWrapRef = useRef<HTMLDivElement | null>(null);
  const stageBoxRef = useRef<HTMLDivElement | null>(null);
  const { isPortraitPhone, isLandscapePhone, isMobileDevice } = useMobileViewport();

  const [stageSize, setStageSize] = useState<{ width: number; height: number } | null>(null);
  const [landscapeMenuOpen, setLandscapeMenuOpen] = useState<boolean>(false);

  // Selected Region Preview Panel ("LOKASI PENGEMBARAAN" — Bahagian 4)
  const [previewRegionId, setPreviewRegionId] = useState<RegionId | null>(null);
  const [hoveredRegionId, setHoveredRegionId] = useState<RegionId | null>(null);

  const worldAsset = locationAssets.slot_01_peta_dunia;
  const [mapImgSrc, setMapImgSrc] = useState<string | null>(
    worldAsset.imageUrl || worldAsset.fallbackUrl || null
  );
  const [isMapLoading, setIsMapLoading] = useState<boolean>(true);
  const [isMapFailed, setIsMapFailed] = useState<boolean>(false);

  const [previewImgOverride, setPreviewImgOverride] = useState<string | null>(null);
  const [previewImgFailed, setPreviewImgFailed] = useState<boolean>(false);

  useEffect(() => {
    setMapImgSrc(worldAsset.imageUrl || worldAsset.fallbackUrl || null);
    setIsMapLoading(true);
    setIsMapFailed(false);
  }, [worldAsset.imageUrl, worldAsset.fallbackUrl]);

  useEffect(() => {
    if (!isOpen) {
      setPreviewRegionId(null);
      setLandscapeMenuOpen(false);
    }
  }, [isOpen]);

  // Reset fallback override & failure flag whenever previewRegionId or locationAssets changes
  useEffect(() => {
    setPreviewImgOverride(null);
    setPreviewImgFailed(false);
  }, [previewRegionId, locationAssets]);

  // Measure available container to keep exact 16:9 aspect ratio for Peta Dunia
  useEffect(() => {
    if (!isOpen) return;
    const updateLayout = () => {
      const container = outerWrapRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const nextStage = computeContained16By9Stage(rect.width, rect.height);
      if (nextStage) {
        setStageSize(nextStage);
      }
    };

    updateLayout();
    const ro =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateLayout) : null;
    if (ro && outerWrapRef.current) {
      ro.observe(outerWrapRef.current);
    }
    window.addEventListener('resize', updateLayout);
    window.addEventListener('orientationchange', updateLayout);
    window.visualViewport?.addEventListener('resize', updateLayout);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', updateLayout);
      window.removeEventListener('orientationchange', updateLayout);
      window.visualViewport?.removeEventListener('resize', updateLayout);
    };
  }, [isOpen, isPortraitPhone, isLandscapePhone]);

  if (!isOpen) return null;

  const totalCrystals = Object.keys(completedQuestions).length;
  const m1Solved = getQuestionsByMission(1).filter((q) => completedQuestions[q.id]).length;
  const m2Solved = getQuestionsByMission(2).filter((q) => completedQuestions[q.id]).length;

  const previewRegion = previewRegionId
    ? REGION_DIRECTORY.find((r) => r.id === previewRegionId) ?? null
    : null;

  const previewSlotDef = previewRegion ? getSlotByRegionId(previewRegion.id) : null;
  const previewAsset = previewSlotDef ? locationAssets[previewSlotDef.slotId] : null;
  const resolvedPreviewImgSrc =
    previewImgOverride ||
    previewAsset?.imageUrl ||
    previewSlotDef?.defaultUrl ||
    null;
  const previewStatus = previewRegion ? getRegionStatus(previewRegion.id) : 'BELUM_DILAWATI';
  const previewQuestions = previewRegion ? getQuestionsByMap(previewRegion.id) : [];
  const previewSolvedCount = previewQuestions.filter((q) => completedQuestions[q.id]).length;

  const previewGateNote =
    previewRegion?.missionNumber === 2 && m1Solved < 10
      ? `Kawasan bebas diterokai! Kuiz Misi 2 dibuka selepas Misi 1 selesai (${m1Solved}/10).`
      : previewRegion?.missionNumber === 3 && m2Solved < 10
      ? `Kawasan bebas diterokai! Kuiz Misi 3 dibuka selepas Misi 2 selesai (${m2Solved}/10).`
      : null;

  const statusDisplay =
    previewStatus === 'TELAH_DITEROKAI'
      ? {
          text: 'TELAH DITEROKAI',
          cls: 'bg-[#16a34a] text-[#f0fdf4] border-[#86efac]',
        }
      : previewStatus === 'SEDANG_DITEROKAI'
      ? {
          text: 'SEDANG DITEROKAI',
          cls: 'bg-[#0284c7] text-[#f0f9ff] border-[#7dd3fc]',
        }
      : {
          text: 'BELUM DITEROKAI',
          cls: 'bg-[#475569] text-[#f1f5f9] border-[#cbd5e1]',
        };

  return (
    <div
      className={`${
        mode === 'fullscreen'
          ? 'app-viewport-shell mobile-stage-backdrop'
          : isLandscapePhone
          ? 'fixed inset-0 z-50 bg-[#0d0a1f] p-0 flex items-center justify-center'
          : 'fixed inset-0 z-50 bg-black/80 p-1.5 sm:p-4 flex items-center justify-center'
      } select-none overflow-hidden`}
    >
      <div
        className={`relative ${
          mode === 'fullscreen' || isLandscapePhone
            ? 'w-full h-full flex flex-col overflow-hidden'
            : 'w-full max-w-6xl h-[94dvh] pixel-panel-purple flex flex-col overflow-hidden'
        }`}
      >
        {/* Mobile Portrait Orientation Guidance (Requirement 7) */}
        {isPortraitPhone && <PortraitRotationPrompt variant="banner" />}

        {/* TOP HEADER BAR (Desktop & Portrait; hidden in Phone Landscape so 16:9 Peta Dunia fills 100% height) */}
        {!isLandscapePhone && (
          <header className="px-2.5 sm:px-5 py-1.5 sm:py-2 bg-[#1c1038] border-b-2 sm:border-b-3 border-[#f6c445] flex flex-wrap items-center justify-between gap-2 shrink-0 z-20 safe-area-x">
            <div className="flex items-center gap-2 min-w-0">
              <Compass className="w-5 h-5 sm:w-6 sm:h-6 text-[#fde047] shrink-0" />
              <div className="min-w-0">
                <h1 className="font-pixel font-bold text-sm sm:text-xl text-[#fde047] truncate">
                  {isPortraitPhone ? 'PETA DUNIA' : 'PETA DUNIA KERAJAAN TATABAHASA'}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-[#110924] border-2 border-[#f6c445]">
                <PixelPortrait mode="crystal" lit={totalCrystals > 0} size={16} />
                <span className="font-pixel font-bold text-xs text-white whitespace-nowrap">
                  Kristal Kata:{' '}
                  <span className="font-mono-num text-[#7dd3fc]">{totalCrystals} / 30</span>
                </span>
              </div>

              {/* 9-Slot Asset Manager Button */}
              <button
                type="button"
                onClick={() => {
                  soundEngine.playButtonClick();
                  onOpenLocationAssetManager(null);
                }}
                title="Pengurusan 9 Aset Gambar Lokasi"
                className="px-2 sm:px-2.5 py-1 sm:py-1.5 pixel-btn-gold font-pixel font-bold text-[11px] sm:text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <ImagePlus className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">ASET GAMBAR (9)</span>
              </button>

              {/* Developer Hotspot Calibration Mode */}
              <button
                type="button"
                onClick={() => {
                  soundEngine.playButtonClick();
                  onToggleHotspotEditMode();
                }}
                title="Mod Edit Hotspot Peta Dunia"
                className={`px-2 sm:px-2.5 py-1 sm:py-1.5 font-pixel font-bold text-[11px] sm:text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  isHotspotEditMode ? 'pixel-btn-emerald' : 'pixel-btn-blue'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">
                  {isHotspotEditMode ? 'TUTUP EDIT' : 'EDIT HOTSPOT'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playButtonClick();
                  onClose();
                }}
                className="px-2.5 sm:px-3 py-1 sm:py-1.5 pixel-btn-purple font-pixel font-bold text-[11px] sm:text-xs flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                <span>KEMBALI</span>
              </button>
            </div>
          </header>
        )}

        {/* PHONE LANDSCAPE FLOATING ULTRA-SLIM CORNER CONTROLS (Zero vertical height stolen from 16:9 Peta Dunia!) */}
        {isLandscapePhone && (
          <>
            <div className="pointer-events-none absolute top-1.5 inset-x-0 z-30 flex items-center justify-between gap-2 safe-area-x">
              <div className="pointer-events-auto flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playButtonClick();
                    onClose();
                  }}
                  className="px-2 py-1 pixel-btn-purple font-pixel font-bold text-[10px] flex items-center gap-1 cursor-pointer whitespace-nowrap opacity-95"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>KEMBALI</span>
                </button>

                <div className="px-2 py-0.5 bg-[#160d2e]/90 border border-[#f6c445] flex items-center gap-1">
                  <PixelPortrait mode="crystal" lit={totalCrystals > 0} size={13} />
                  <span className="font-mono-num font-bold text-[10px] text-[#7dd3fc] whitespace-nowrap">
                    {totalCrystals}/30
                  </span>
                </div>
              </div>

              <div className="pointer-events-auto flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playButtonClick();
                    onOpenLocationAssetManager(null);
                  }}
                  title="Pengurusan 9 Aset Gambar Lokasi"
                  className="p-1 pixel-btn-gold flex items-center justify-center cursor-pointer opacity-95"
                >
                  <ImagePlus className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playButtonClick();
                    onToggleHotspotEditMode();
                  }}
                  title="Mod Edit Hotspot"
                  className={`p-1 flex items-center justify-center cursor-pointer opacity-95 ${
                    isHotspotEditMode ? 'pixel-btn-emerald' : 'pixel-btn-blue'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                {mode === 'fullscreen' &&
                  onOpenJournal &&
                  onOpenInventory &&
                  onOpenProgress &&
                  onOpenSettings && (
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playButtonClick();
                        setLandscapeMenuOpen((v) => !v);
                      }}
                      aria-expanded={landscapeMenuOpen}
                      className="px-2 py-1 pixel-btn-purple font-pixel font-bold text-[10px] flex items-center gap-1 cursor-pointer whitespace-nowrap opacity-95"
                    >
                      {landscapeMenuOpen ? (
                        <X className="w-3 h-3" />
                      ) : (
                        <Menu className="w-3 h-3" />
                      )}
                      <span>MENU</span>
                    </button>
                  )}
              </div>
            </div>

            {mode === 'fullscreen' &&
              landscapeMenuOpen &&
              onOpenJournal &&
              onOpenInventory &&
              onOpenProgress &&
              onOpenSettings && (
                <BottomGameNavBar
                  activeWorldMap
                  compactOverlay
                  ultraCompact
                  crystalsCount={totalCrystals}
                  onOpenWorldMap={() => setLandscapeMenuOpen(false)}
                  onOpenJournal={() => {
                    setLandscapeMenuOpen(false);
                    onOpenJournal();
                  }}
                  onOpenInventory={() => {
                    setLandscapeMenuOpen(false);
                    onOpenInventory();
                  }}
                  onOpenProgress={() => {
                    setLandscapeMenuOpen(false);
                    onOpenProgress();
                  }}
                  onOpenSettings={() => {
                    setLandscapeMenuOpen(false);
                    onOpenSettings();
                  }}
                  onOpenGuide={
                    onOpenGuide
                      ? () => {
                          setLandscapeMenuOpen(false);
                          onOpenGuide();
                        }
                      : undefined
                  }
                />
              )}
          </>
        )}

        {/* MAIN 16:9 PETA DUNIA ILLUSTRATION STAGE */}
        <div
          ref={outerWrapRef}
          className={`relative flex-1 w-full min-h-0 flex items-center justify-center mobile-stage-backdrop overflow-hidden ${
            isMobileDevice ? 'p-0' : 'p-1.5 sm:p-2.5'
          }`}
        >
          <div
            ref={stageBoxRef}
            style={
              stageSize
                ? { width: `${stageSize.width}px`, height: `${stageSize.height}px` }
                : undefined
            }
            className={`relative overflow-hidden shadow-2xl bg-[#0b0718] ${
              isLandscapePhone
                ? ''
                : isPortraitPhone
                ? 'border-y-2 border-[#f6c445]'
                : 'border-3 border-[#f6c445]'
            } ${
              stageSize
                ? ''
                : 'aspect-video w-[min(100vw,calc(100dvh*16/9))] max-w-full max-h-full'
            }`}
          >
            {/* Kristal Kata Loading Indicator */}
            {isMapLoading && !isMapFailed && (
              <div className="absolute inset-0 z-20 bg-[#120a26] flex flex-col items-center justify-center gap-3 p-4">
                <div className="p-3 bg-[#1d113b] border-2 border-[#facc15] animate-bounce">
                  <PixelPortrait mode="crystal" lit size={44} />
                </div>
                <div className="flex items-center gap-2 font-pixel font-bold text-sm sm:text-base text-[#fde047]">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memuatkan Peta Dunia Kerajaan Tatabahasa...</span>
                </div>
              </div>
            )}

            {/* Missing / Failed Peta Dunia Fallback */}
            {isMapFailed || !mapImgSrc ? (
              <div className="absolute inset-0 z-20 bg-[#140b29] flex flex-col items-center justify-center gap-4 p-6 text-center">
                <h2 className="font-pixel font-bold text-xl text-[#fde047]">
                  Gambar lokasi belum tersedia.
                </h2>
                <p className="text-xs sm:text-sm text-[#cbd5e1] max-w-md">
                  Sila muat naik semula ilustrasi <strong>Peta Dunia Kerajaan Tatabahasa</strong>{' '}
                  pada Slot 1.
                </p>
                <button
                  type="button"
                  onClick={() => onOpenLocationAssetManager('slot_01_peta_dunia')}
                  className="px-5 py-2.5 pixel-btn-gold font-pixel font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
                >
                  <ImagePlus className="w-4 h-4" />
                  <span>MUAT NAIK SEMULA</span>
                </button>
              </div>
            ) : (
              <img
                src={mapImgSrc}
                alt="Peta Dunia Kerajaan Tatabahasa"
                referrerPolicy="no-referrer"
                draggable={false}
                onLoad={() => {
                  setIsMapLoading(false);
                  setIsMapFailed(false);
                }}
                onError={() => {
                  if (worldAsset.fallbackUrl && mapImgSrc !== worldAsset.fallbackUrl) {
                    setMapImgSrc(worldAsset.fallbackUrl);
                  } else {
                    setIsMapLoading(false);
                    setIsMapFailed(true);
                  }
                }}
                className="w-full h-full object-contain block select-none pointer-events-none"
              />
            )}

            {/* 8 TRANSPARENT INTERACTIVE LOCATION HOTSPOTS (Borders hidden at rest; soft selection glow on hover/touch) */}
            {!isMapFailed &&
              !isHotspotEditMode &&
              worldMapHotspots.map((spot) => {
                const regId = spot.id as RegionId;
                const isCurrentHere =
                  isPlayingMode &&
                  (currentMap === regId ||
                    (currentMap === 'istana_dalam' && regId === 'istana_luar'));
                const isHovered = hoveredRegionId === regId;
                const st = getRegionStatus(regId);

                const glowCls =
                  spot.glowVariant === 'purple'
                    ? 'menu-hotspot-purple'
                    : spot.glowVariant === 'blue'
                    ? 'menu-hotspot-blue'
                    : spot.glowVariant === 'wood'
                    ? 'menu-hotspot-wood'
                    : 'menu-hotspot-gold';

                return (
                  <button
                    key={spot.id}
                    type="button"
                    aria-label={`Pilih lokasi ${spot.label}`}
                    onMouseEnter={() => {
                      soundEngine.playButtonHover();
                      setHoveredRegionId(regId);
                    }}
                    onMouseLeave={() =>
                      setHoveredRegionId((prev) => (prev === regId ? null : prev))
                    }
                    onClick={() => {
                      soundEngine.playButtonClick();
                      setPreviewRegionId(regId);
                    }}
                    style={{
                      left: `${spot.left}%`,
                      top: `${spot.top}%`,
                      width: `${spot.width}%`,
                      height: `${spot.height}%`,
                    }}
                    className={`menu-hotspot ${glowCls} rounded-2xl absolute cursor-pointer touch-manipulation focus:outline-none`}
                  >
                    <span className="sr-only">{spot.label}</span>
                    <span aria-hidden="true" className="menu-hotspot-shimmer" />

                    {/* Current Player Pin (Small corner marker, never covering artwork title) */}
                    {isCurrentHere && (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-[#160d2e]/95 border border-[#facc15] font-pixel font-bold text-[10px] text-[#fde047] flex items-center gap-1 shadow-md"
                      >
                        <MapPin className="w-3 h-3 text-[#f43f5e] fill-[#fde047]" />
                        <span>DI SINI</span>
                      </span>
                    )}

                    {/* Gentle Hover Status Tooltip at Top Edge */}
                    {isHovered && (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute top-1.5 left-1.5 px-2 py-0.5 bg-[#140b29]/95 border border-[#fde047] font-pixel font-bold text-[10px] text-[#fef08a] shadow-md whitespace-nowrap"
                      >
                        {st === 'TELAH_DITEROKAI'
                          ? '✓ Telah Diterokai'
                          : st === 'SEDANG_DITEROKAI'
                          ? '• Sedang Diterokai'
                          : 'Klik untuk Pratonton'}
                      </span>
                    )}
                  </button>
                );
              })}

            {/* DEVELOPER MODE: Interactive Hotspot Editor on Peta Dunia */}
            {!isMapFailed && isHotspotEditMode && (
              <HotspotEditorOverlay
                scopeId="world_map"
                scopeTitle="Peta Dunia Kerajaan Tatabahasa"
                hotspots={worldMapHotspots}
                stageRef={stageBoxRef}
                onSaveHotspots={onSaveHotspots}
                onResetHotspots={onResetHotspots}
                onCloseEditor={onToggleHotspotEditMode}
                onTestClickHotspot={(id) => setPreviewRegionId(id as RegionId)}
              />
            )}
          </div>
        </div>

        {/* BOTTOM NAVIGATION BAR IN FULLSCREEN WORLD SELECT MODE (Bahagian 7) */}
        {mode === 'fullscreen' &&
          !isLandscapePhone &&
          onOpenJournal &&
          onOpenInventory &&
          onOpenProgress &&
          onOpenSettings && (
            <BottomGameNavBar
              activeWorldMap
              ultraCompact={isPortraitPhone}
              crystalsCount={totalCrystals}
              onOpenWorldMap={() => {}}
              onOpenJournal={onOpenJournal}
              onOpenInventory={onOpenInventory}
              onOpenProgress={onOpenProgress}
              onOpenSettings={onOpenSettings}
              onOpenGuide={onOpenGuide}
            />
          )}
      </div>

      {/* =====================================================================
          PANEL PEMILIHAN LOKASI: "LOKASI PENGEMBARAAN" (BAHAGIAN 4)
         ===================================================================== */}
      {previewRegion && (
        <div
          className="fixed inset-0 z-60 bg-black/75 flex items-center justify-center p-2.5 sm:p-5 overflow-y-auto"
          onClick={() => setPreviewRegionId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl max-h-[94dvh] overflow-y-auto pixel-scroll pixel-panel-purple p-4 sm:p-6 space-y-3.5 my-auto"
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b-2 border-[#5b3ea8]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#fde047] shrink-0" />
                <span className="font-pixel font-bold text-sm sm:text-base text-[#fde047] tracking-wide">
                  LOKASI PENGEMBARAAN
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playButtonClick();
                  setPreviewRegionId(null);
                }}
                className="w-8 h-8 pixel-btn-purple flex items-center justify-center cursor-pointer"
                aria-label="Kembali ke Peta"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1. Nama Lokasi & 4. Status Penerokaan */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-pixel font-bold text-2xl text-[#fde047]">
                {previewRegion.name.toUpperCase()}
              </h2>
              <span
                className={`px-2.5 py-0.5 border font-pixel font-bold text-xs ${statusDisplay.cls}`}
              >
                Status: {statusDisplay.text}
              </span>
            </div>

            {/* 2. Gambar Pratonton Lokasi Asal (16:9 object-fit: contain) */}
            <div className="relative w-full aspect-video bg-[#0b0718] border-3 border-[#f6c445] overflow-hidden flex items-center justify-center">
              {!previewImgFailed && resolvedPreviewImgSrc ? (
                <img
                  src={resolvedPreviewImgSrc}
                  alt={previewRegion.name}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  onError={() => {
                    if (
                      previewAsset?.fallbackUrl &&
                      resolvedPreviewImgSrc !== previewAsset.fallbackUrl
                    ) {
                      setPreviewImgOverride(previewAsset.fallbackUrl);
                    } else {
                      setPreviewImgFailed(true);
                    }
                  }}
                  className="w-full h-full object-contain block"
                />
              ) : (
                <div className="p-4 text-center space-y-2">
                  <p className="font-pixel font-bold text-sm text-[#fca5a5]">
                    Gambar lokasi belum tersedia.
                  </p>
                  {previewSlotDef && (
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewRegionId(null);
                        onOpenLocationAssetManager(previewSlotDef.slotId);
                      }}
                      className="px-3.5 py-1.5 pixel-btn-gold font-pixel font-bold text-xs cursor-pointer"
                    >
                      MUAT NAIK SEMULA
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 3. Penerangan Ringkas */}
            <div className="pixel-panel-parchment p-3.5 space-y-1.5">
              <p className="text-xs sm:text-sm font-bold text-[#291509] leading-relaxed">
                “{previewRegion.shortDesc}”
              </p>
            </div>

            {/* 5. Kemajuan Cabaran Jika Berkaitan */}
            <div className="p-3 bg-[#150c2e] border-2 border-[#5b3ea8] space-y-1.5">
              <div className="flex items-center justify-between text-xs font-pixel text-[#fde047]">
                <span>KEMAJUAN CABARAN</span>
                <span className="font-mono-num text-[#7dd3fc]">
                  {previewQuestions.length > 0
                    ? `${previewSolvedCount} / ${previewQuestions.length} Soalan Selesai`
                    : 'Zon Pembelajaran & Aktiviti Interaktif'}
                </span>
              </div>

              {previewQuestions.length > 0 && (
                <div className="w-full h-2.5 bg-[#090514] border border-[#4c3385] overflow-hidden">
                  <div
                    style={{
                      width: `${Math.round(
                        (previewSolvedCount / previewQuestions.length) * 100
                      )}%`,
                    }}
                    className="h-full bg-gradient-to-r from-[#38bdf8] to-[#22c55e] transition-all duration-300"
                  />
                </div>
              )}

              {previewGateNote && (
                <p className="text-[11px] font-semibold text-[#fde68a] pt-0.5">
                  {previewGateNote}
                </p>
              )}
            </div>

            {/* Action Buttons: "MASUK KAWASAN" & "KEMBALI KE PETA" */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  const target = previewRegion.id;
                  soundEngine.playButtonClick();
                  setPreviewRegionId(null);
                  onSelectEnterRegion(target);
                }}
                className="py-3 px-4 pixel-btn-gold font-pixel font-bold text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Navigation className="w-4 h-4 shrink-0" />
                <span>MASUK KAWASAN</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playButtonClick();
                  setPreviewRegionId(null);
                }}
                className="py-3 px-4 pixel-btn-purple font-pixel font-bold text-sm flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" />
                <span>KEMBALI KE PETA</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
