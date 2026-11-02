import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Compass,
  Edit3,
  Gamepad2,
  ImagePlus,
  Menu,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react';
import {
  AvatarId,
  BadgeId,
  CastleRoomId,
  ExplorationBadgeId,
  ExplorationStatus,
  HotspotRect,
  HotspotScopeId,
  JournalRecord,
  LibraryCategoryId,
  LocationAssetRecord,
  LocationAssetSlotId,
  QuizQuestion,
  RegionId,
} from '../types/game';
import { QUIZ_QUESTIONS, getQuestionsByMap } from '../data/questions';
import { REGION_DIRECTORY } from '../data/sideActivities';
import { getSlotByRegionId } from '../utils/locationAssetStore';
import { soundEngine } from '../audio/soundEngine';
import { PixelPortrait } from './PixelPortrait';
import { BottomGameNavBar } from './BottomGameNavBar';
import { HotspotEditorOverlay } from './HotspotEditorOverlay';
import { PortraitRotationPrompt } from './PortraitRotationPrompt';
import { computeContained16By9Stage, useMobileViewport } from '../hooks/useMobileViewport';
import {
  LocationActivityModal,
  LocationSubModalKind,
} from './LocationActivityModal';

interface LocationSceneScreenProps {
  regionId: RegionId;
  playerName: string;
  avatarId: AvatarId;
  score: number;
  crystalsCount: number;
  badges: BadgeId[];
  explorationBadges: ExplorationBadgeId[];
  completedQuestions: Record<number, JournalRecord>;
  foundHiddenBooks: Record<string, boolean>;
  locationAsset: LocationAssetRecord;
  hotspots: HotspotRect[];
  isHotspotEditMode: boolean;
  onToggleHotspotEditMode: () => void;
  onSaveHotspots: (scope: HotspotScopeId, rects: HotspotRect[]) => void;
  onResetHotspots: (scope: HotspotScopeId) => void;
  getRegionStatus: (regionId: RegionId) => ExplorationStatus;
  onOpenAssetUploadForSlot: (slotId: LocationAssetSlotId) => void;
  onBackToWorldMap: () => void;
  onTravelRegion: (regionId: RegionId) => void;
  onEnterRpgTilemap: () => void;
  onLaunchQuestion: (question: QuizQuestion) => void;
  onOpenLearningCategory: (cat: LibraryCategoryId | null) => void;
  onTalkNpcId: (npcId: string) => void;
  onVisitCastleRoom: (roomId: CastleRoomId, roomName: string) => void;
  onDiscoverBook: (bookId: string) => void;
  onMarkRegionExplored: (regionId: RegionId) => void;
  onOpenJournal: () => void;
  onOpenInventory: () => void;
  onOpenProgress: () => void;
  onOpenSettings: () => void;
  onOpenGuide?: () => void;
  onTriggerVictory: () => void;
}

export const LocationSceneScreen: React.FC<LocationSceneScreenProps> = ({
  regionId,
  playerName,
  avatarId,
  score,
  crystalsCount,
  badges,
  explorationBadges,
  completedQuestions,
  foundHiddenBooks,
  locationAsset,
  hotspots,
  isHotspotEditMode,
  onToggleHotspotEditMode,
  onSaveHotspots,
  onResetHotspots,
  getRegionStatus,
  onOpenAssetUploadForSlot,
  onBackToWorldMap,
  onTravelRegion,
  onEnterRpgTilemap,
  onLaunchQuestion,
  onOpenLearningCategory,
  onTalkNpcId,
  onVisitCastleRoom,
  onDiscoverBook,
  onMarkRegionExplored,
  onOpenJournal,
  onOpenInventory,
  onOpenProgress,
  onOpenSettings,
  onOpenGuide,
  onTriggerVictory,
}) => {
  const outerWrapRef = useRef<HTMLDivElement | null>(null);
  const stageBoxRef = useRef<HTMLDivElement | null>(null);
  const { isPortraitPhone, isLandscapePhone, isMobileDevice } = useMobileViewport();

  const [stageSize, setStageSize] = useState<{ width: number; height: number } | null>(null);
  const [landscapeMenuOpen, setLandscapeMenuOpen] = useState<boolean>(false);
  const [imgSrc, setImgSrc] = useState<string | null>(
    locationAsset.imageUrl || locationAsset.fallbackUrl || null
  );
  const [isImgLoading, setIsImgLoading] = useState<boolean>(true);
  const [isImgFailed, setIsImgFailed] = useState<boolean>(false);
  const [pressedSpotId, setPressedSpotId] = useState<string | null>(null);
  const [subModal, setSubModal] = useState<LocationSubModalKind | null>(null);

  const regionInfo =
    REGION_DIRECTORY.find((r) => r.id === regionId) ?? REGION_DIRECTORY[0];
  const slotDef = getSlotByRegionId(regionId);

  // Sync image source whenever regionId or uploaded asset changes
  useEffect(() => {
    setImgSrc(locationAsset.imageUrl || locationAsset.fallbackUrl || null);
    setIsImgLoading(true);
    setIsImgFailed(false);
    setSubModal(null);
    setLandscapeMenuOpen(false);
  }, [regionId, locationAsset.imageUrl, locationAsset.fallbackUrl]);

  // Maintain exact 16:9 box inside available space so percentage hotspots align 100% accurately
  useEffect(() => {
    const updateSize = () => {
      const container = outerWrapRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const nextStage = computeContained16By9Stage(rect.width, rect.height);
      if (nextStage) {
        setStageSize(nextStage);
      }
    };

    updateSize();
    const ro =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateSize) : null;
    if (ro && outerWrapRef.current) {
      ro.observe(outerWrapRef.current);
    }
    window.addEventListener('resize', updateSize);
    window.addEventListener('orientationchange', updateSize);
    window.visualViewport?.addEventListener('resize', updateSize);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('orientationchange', updateSize);
      window.visualViewport?.removeEventListener('resize', updateSize);
    };
  }, [isPortraitPhone, isLandscapePhone]);

  const openOrLaunchSingleOrList = useCallback(
    (ids: number[], listTitle: string, listSubtitle: string) => {
      if (ids.length === 1) {
        const q = QUIZ_QUESTIONS.find((item) => item.id === ids[0]);
        if (q) {
          onLaunchQuestion(q);
          return;
        }
      }
      setSubModal({
        type: 'MISSION_LIST',
        title: listTitle,
        subtitle: listSubtitle,
        questionIds: ids,
      });
    },
    [onLaunchQuestion]
  );

  // Master Hotspot Action Dispatcher for all 8 Location Illustrations (Bahagian 6)
  const executeHotspotAction = useCallback(
    (hotspotId: string) => {
      soundEngine.playButtonClick();

      // 1. TAMAN SAKURA BAHASA
      if (regionId === 'taman_sakura') {
        if (hotspotId === 'misi_1_detektif') {
          openOrLaunchSingleOrList(
            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            'MISI 1: DETEKTIF BAHASA',
            'Taman Sakura Bahasa · Soalan 1 hingga Soalan 10'
          );
          return;
        }
        if (hotspotId === 'bahan_pembelajaran') {
          onOpenLearningCategory(null);
          return;
        }
        if (hotspotId === 'papan_notis' || hotspotId === 'scene_papan_notis_kiri') {
          setSubModal({ type: 'SAKURA_NOTICE' });
          return;
        }
        if (hotspotId === 'peta_kota') {
          onBackToWorldMap();
          return;
        }
        if (hotspotId === 'npc_cikgu_salmah') {
          onTalkNpcId('cikgu_salmah');
          return;
        }
      }

      // 2. ISTANA KRISTAL KOTA
      if (regionId === 'istana_luar') {
        if (hotspotId === 'dewan_utama') {
          onVisitCastleRoom('dewan_utama', 'Dewan Utama');
          setSubModal({ type: 'CASTLE_DEWAN_UTAMA' });
          return;
        }
        if (hotspotId === 'bilik_kristal') {
          onVisitCastleRoom('bilik_kristal', 'Bilik Kristal');
          setSubModal({ type: 'CASTLE_BILIK_KRISTAL' });
          return;
        }
        if (hotspotId === 'perpustakaan_diraja') {
          onVisitCastleRoom('perpustakaan_diraja', 'Perpustakaan Diraja');
          setSubModal({ type: 'CASTLE_PERPUSTAKAAN_DIRAJA' });
          return;
        }
        if (hotspotId === 'bilik_peta') {
          onVisitCastleRoom('bilik_peta', 'Bilik Peta');
          setSubModal({ type: 'CASTLE_BILIK_PETA' });
          return;
        }
        if (hotspotId === 'dewan_wira') {
          onVisitCastleRoom('dewan_wira', 'Dewan Wira');
          setSubModal({ type: 'CASTLE_DEWAN_WIRA' });
          return;
        }
        if (hotspotId === 'npc_burung_hantu') {
          onTalkNpcId('owl_istana');
          return;
        }
        if (hotspotId === 'npc_penjaga_istana') {
          onTalkNpcId('penjaga_istana');
          return;
        }
      }

      // 3. PERPUSTAKAAN AJAIB
      if (regionId === 'perpustakaan_ajaib') {
        if (hotspotId === 'ejaan') {
          onOpenLearningCategory('ejaan');
          return;
        }
        if (hotspotId === 'imbuhan') {
          onOpenLearningCategory('imbuhan');
          return;
        }
        if (hotspotId === 'kata_majmuk') {
          onOpenLearningCategory('kata_majmuk');
          return;
        }
        if (hotspotId === 'kata_ganda') {
          onOpenLearningCategory('kata_ganda');
          return;
        }
        if (hotspotId === 'struktur_ayat') {
          onOpenLearningCategory('struktur_ayat');
          return;
        }
        if (hotspotId === 'laras_bahasa') {
          setSubModal({ type: 'LIBRARY_LARAS_BAHASA' });
          return;
        }
        if (hotspotId === 'npc_pustakawan_ajaib') {
          onTalkNpcId('pustakawan_ajaib');
          return;
        }
      }

      // 4. HUTAN MISTERI PERKATAAN
      if (regionId === 'hutan_misteri') {
        if (hotspotId === 'terokai_hutan') {
          setSubModal({ type: 'FOREST_EXPLORE' });
          return;
        }
        if (hotspotId === 'cari_petunjuk') {
          setSubModal({ type: 'FOREST_CLUES' });
          return;
        }
        if (hotspotId === 'cabaran_perkataan') {
          setSubModal({ type: 'FOREST_WORD_CHALLENGE' });
          return;
        }
        if (hotspotId === 'kuiz_mini') {
          setSubModal({ type: 'FOREST_MINI_QUIZ' });
          return;
        }
        if (hotspotId === 'npc_peri_perkataan') {
          onTalkNpcId('peri_perkataan');
          return;
        }
      }

      // 5. KAMPUNG TATABAHASA
      if (regionId === 'kampung_tatabahasa') {
        if (hotspotId === 'rumah_ilmu') {
          setSubModal({ type: 'VILLAGE_RUMAH_ILMU' });
          return;
        }
        if (hotspotId === 'tokoh_bahasa') {
          setSubModal({ type: 'VILLAGE_TOKOH' });
          return;
        }
        if (hotspotId === 'papan_tanda') {
          setSubModal({ type: 'VILLAGE_SIGNBOARDS' });
          return;
        }
        if (hotspotId === 'amalan_bahasa') {
          setSubModal({ type: 'VILLAGE_PRACTICE' });
          return;
        }
        if (hotspotId === 'aktiviti_interaktif') {
          setSubModal({ type: 'VILLAGE_INTERACTIVE' });
          return;
        }
        if (hotspotId === 'npc_ketua_kampung') {
          onTalkNpcId('ketua_kampung');
          return;
        }
      }

      // 6. PASAR PERKATAAN (Misi 2: Soalan 11–16)
      if (regionId === 'pasar_perkataan') {
        if (hotspotId === 'notis_pasar') {
          openOrLaunchSingleOrList(
            [11, 16],
            'NOTIS PASAR & TABUNG SUMBANGAN',
            'Siasatan Misi 2 di Pasar Perkataan (Soalan 11 & Soalan 16)'
          );
          return;
        }
        if (hotspotId === 'surat_khabar') {
          openOrLaunchSingleOrList(
            [12],
            'SURAT KHABAR & BUKU PANDUAN KEDAI',
            'Siasatan Misi 2 di Pasar Perkataan (Soalan 12)'
          );
          return;
        }
        if (hotspotId === 'menu_makanan') {
          openOrLaunchSingleOrList(
            [14, 15],
            'MENU MAKANAN GERAI PASAR',
            'Siasatan Ejaan Makanan Misi 2 (Soalan 14 & Soalan 15)'
          );
          return;
        }
        if (hotspotId === 'papan_iklan') {
          openOrLaunchSingleOrList(
            [13],
            'PAPAN IKLAN & TANDA PASAR',
            'Siasatan Kata Majmuk Misi 2 (Soalan 13)'
          );
          return;
        }
        if (hotspotId === 'cabar_kesalahan') {
          openOrLaunchSingleOrList(
            [11, 12, 13, 14, 15, 16],
            'MISI 2: PEMBURU KESALAHAN (PASAR PERKATAAN)',
            'Lengkapkan Soalan 11 hingga Soalan 16 di Pasar Perkataan'
          );
          return;
        }
        if (hotspotId === 'npc_pak_cik_rahman') {
          onTalkNpcId('pak_cik_rahman');
          return;
        }
      }

      // 7. MENARA MEDIA (Misi 2: Soalan 17–20)
      if (regionId === 'menara_media') {
        if (hotspotId === 'bilik_berita') {
          openOrLaunchSingleOrList([17], 'BILIK BERITA', 'Soalan 17');
          return;
        }
        if (hotspotId === 'studio_rakaman') {
          openOrLaunchSingleOrList([18], 'STUDIO RAKAMAN', 'Soalan 18');
          return;
        }
        if (hotspotId === 'surat_khabar_digital') {
          openOrLaunchSingleOrList([20], 'SURAT KHABAR DIGITAL', 'Soalan 20');
          return;
        }
        if (hotspotId === 'bahan_media') {
          openOrLaunchSingleOrList([19], 'BAHAN MEDIA', 'Soalan 19');
          return;
        }
        if (hotspotId === 'cabaran_media_bahasa') {
          openOrLaunchSingleOrList(
            [17, 18, 19, 20],
            'MISI 2: CABARAN MEDIA BAHASA (MENARA MEDIA)',
            'Lengkapkan Soalan 17 hingga Soalan 20 di Menara Media'
          );
          return;
        }
        if (hotspotId === 'npc_wartawan_bahasa') {
          onTalkNpcId('wartawan_bahasa');
          return;
        }
      }

      // 8. BENTENG WIRA BAHASA (Misi 3: Soalan 21–30 & Kemenangan)
      if (regionId === 'benteng_wira') {
        if (hotspotId === 'cabaran_akhir') {
          openOrLaunchSingleOrList(
            [21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
            'MISI 3: WIRA TATABAHASA — CABARAN AKHIR',
            'Benteng Wira Bahasa · Soalan 21 hingga Soalan 30'
          );
          return;
        }
        if (hotspotId === 'uji_kemahiran') {
          const m3Qs = QUIZ_QUESTIONS.filter((q) => q.mission === 3);
          const nextQ = m3Qs.find((q) => !completedQuestions[q.id]) ?? m3Qs[0];
          onLaunchQuestion(nextQ);
          return;
        }
        if (hotspotId === 'kumpul_kristal_kata') {
          setSubModal({ type: 'BENTENG_CRYSTAL_CHECK' });
          return;
        }
        if (hotspotId === 'sah_wira_bahasa') {
          setSubModal({ type: 'BENTENG_SAH_WIRA' });
          return;
        }
        if (hotspotId === 'pulihkan_kota_tatabahasa') {
          if (crystalsCount >= 30) {
            onTriggerVictory();
          } else {
            setSubModal({ type: 'BENTENG_RESTORE_GATE' });
          }
          return;
        }
        if (hotspotId === 'npc_profesor_bahasa') {
          onTalkNpcId('profesor_bahasa');
          return;
        }
      }
    },
    [
      regionId,
      completedQuestions,
      crystalsCount,
      openOrLaunchSingleOrList,
      onOpenLearningCategory,
      onBackToWorldMap,
      onTalkNpcId,
      onVisitCastleRoom,
      onLaunchQuestion,
      onTriggerVictory,
    ]
  );

  const regionQuestions = getQuestionsByMap(regionId);
  const regionSolved = regionQuestions.filter((q) => completedQuestions[q.id]).length;

  return (
    <div className="relative w-full h-full mobile-stage-backdrop flex flex-col overflow-hidden select-none">
      {/* Mobile Portrait Orientation Guidance (Requirement 7) */}
      {isPortraitPhone && <PortraitRotationPrompt variant="banner" />}

      {/* TOP COMPACT BAR (Desktop & Portrait; hidden in Phone Landscape so 16:9 stage fills 100% height) */}
      {!isLandscapePhone && (
        <header className="w-full bg-[#190f34] border-b-2 sm:border-b-3 border-[#f6c445] px-2.5 sm:px-4 py-1.5 flex items-center justify-between gap-2 shrink-0 z-20 safe-area-x">
          {/* Left: Back to World Map + Location Title */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => {
                soundEngine.playButtonClick();
                onBackToWorldMap();
              }}
              className="px-2 sm:px-2.5 py-1 pixel-btn-purple font-pixel font-bold text-[11px] sm:text-xs flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>PETA DUNIA</span>
            </button>

            <span className="font-pixel font-bold text-xs sm:text-base text-[#fde047] truncate">
              {regionInfo.name}
            </span>

            {regionQuestions.length > 0 && (
              <span className="hidden md:inline-block font-mono-num text-xs text-[#7dd3fc] whitespace-nowrap shrink-0">
                · Cabaran: {regionSolved}/{regionQuestions.length}
              </span>
            )}
          </div>

          {/* Center/Right: Kristal Kata + Mod B Tilemap Switch + Developer Hotspot Edit */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#110924] border-2 border-[#f6c445]">
              <PixelPortrait mode="crystal" lit={crystalsCount > 0} size={16} />
              <span className="font-mono-num font-bold text-xs text-[#7dd3fc] whitespace-nowrap">
                {crystalsCount} / 30
              </span>
            </div>

            {/* Switch to MOD B: PENEROKAAN RPG (Tilemap + WASD + Collision + NPCs) */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playButtonClick();
                onEnterRpgTilemap();
              }}
              title="Buka Peta Permainan Tilemap 2D dengan kawalan pergerakan avatar"
              className="px-2 sm:px-3 py-1 pixel-btn-gold font-pixel font-bold text-[10px] sm:text-xs flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <Gamepad2 className="w-3.5 h-3.5 shrink-0" />
              <span>{isPortraitPhone ? 'RPG 2D' : 'TEROKAI KAWASAN (RPG 2D)'}</span>
            </button>

            {/* Developer Hotspot Calibration Toggle */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playButtonClick();
                onToggleHotspotEditMode();
              }}
              title="Mod Edit Hotspot (Pembangun)"
              className={`px-2 py-1 font-pixel font-bold text-[11px] flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                isHotspotEditMode ? 'pixel-btn-emerald' : 'pixel-btn-blue'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden lg:inline">
                {isHotspotEditMode ? 'TUTUP EDIT HOTSPOT' : 'EDIT HOTSPOT'}
              </span>
            </button>
          </div>
        </header>
      )}

      {/* PHONE LANDSCAPE FLOATING ULTRA-SLIM CORNER CONTROLS (Zero vertical height stolen from 16:9 stage!) */}
      {isLandscapePhone && (
        <>
          <div className="pointer-events-none absolute top-1.5 inset-x-0 z-30 flex items-center justify-between gap-2 safe-area-x">
            <div className="pointer-events-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playButtonClick();
                  onBackToWorldMap();
                }}
                className="px-2 py-1 pixel-btn-purple font-pixel font-bold text-[10px] flex items-center gap-1 cursor-pointer whitespace-nowrap opacity-95"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>PETA</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playButtonClick();
                  onEnterRpgTilemap();
                }}
                className="px-2 py-1 pixel-btn-gold font-pixel font-bold text-[10px] flex items-center gap-1 cursor-pointer whitespace-nowrap opacity-95"
              >
                <Gamepad2 className="w-3 h-3 shrink-0" />
                <span>RPG 2D</span>
              </button>
            </div>

            <div className="pointer-events-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playButtonClick();
                  onToggleHotspotEditMode();
                }}
                title="Mod Edit Hotspot"
                className={`p-1 font-pixel font-bold text-[10px] flex items-center justify-center cursor-pointer opacity-95 ${
                  isHotspotEditMode ? 'pixel-btn-emerald' : 'pixel-btn-blue'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>

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
            </div>
          </div>

          {landscapeMenuOpen && (
            <BottomGameNavBar
              compactOverlay
              ultraCompact
              crystalsCount={crystalsCount}
              onOpenWorldMap={() => {
                setLandscapeMenuOpen(false);
                onBackToWorldMap();
              }}
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

      {/* MAIN 16:9 ORIGINAL ILLUSTRATION STAGE (object-fit: contain, zero cropping/distortion, zero wasted space in landscape) */}
      <main
        ref={outerWrapRef}
        className={`relative flex-1 w-full min-h-0 flex items-center justify-center overflow-hidden ${
          isMobileDevice ? 'p-0' : 'p-1 sm:p-2'
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
          {/* Kristal Kata Loading Indicator (Bahagian 10) */}
          {isImgLoading && !isImgFailed && (
            <div className="absolute inset-0 z-20 bg-[#120a26] flex flex-col items-center justify-center gap-3 p-4">
              <div className="p-3 bg-[#1d113b] border-2 border-[#facc15] animate-bounce">
                <PixelPortrait mode="crystal" lit size={44} />
              </div>
              <div className="flex items-center gap-2 font-pixel font-bold text-sm sm:text-base text-[#fde047]">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Memuatkan Ilustrasi {regionInfo.name}...</span>
              </div>
            </div>
          )}

          {/* Resilient Missing/Failed Image Fallback (Bahagian 10) */}
          {isImgFailed || !imgSrc ? (
            <div className="absolute inset-0 z-20 bg-[#140b29] flex flex-col items-center justify-center gap-4 p-6 text-center">
              <div className="p-3 bg-[#241447] border-2 border-[#f87171]">
                <Sparkles className="w-8 h-8 text-[#fde047]" />
              </div>
              <div className="space-y-1">
                <h2 className="font-pixel font-bold text-xl text-[#fde047]">
                  Gambar lokasi belum tersedia.
                </h2>
                <p className="text-xs sm:text-sm text-[#cbd5e1] max-w-md">
                  Sila muat naik semula ilustrasi asal bagi <strong>{regionInfo.name}</strong>{' '}
                  melalui pengurus aset gambar.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playButtonClick();
                    onOpenAssetUploadForSlot(slotDef.slotId);
                  }}
                  className="px-5 py-2.5 pixel-btn-gold font-pixel font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
                >
                  <ImagePlus className="w-4 h-4" />
                  <span>MUAT NAIK SEMULA</span>
                </button>
                <button
                  type="button"
                  onClick={onBackToWorldMap}
                  className="px-4 py-2.5 pixel-btn-purple font-pixel font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Compass className="w-4 h-4" />
                  <span>KEMBALI KE PETA</span>
                </button>
              </div>
            </div>
          ) : (
            <img
              src={imgSrc}
              alt={regionInfo.name}
              referrerPolicy="no-referrer"
              draggable={false}
              onLoad={() => {
                setIsImgLoading(false);
                setIsImgFailed(false);
              }}
              onError={() => {
                if (locationAsset.fallbackUrl && imgSrc !== locationAsset.fallbackUrl) {
                  setImgSrc(locationAsset.fallbackUrl);
                } else {
                  setIsImgLoading(false);
                  setIsImgFailed(true);
                }
              }}
              className="w-full h-full object-contain block select-none pointer-events-none"
            />
          )}

          {/* NORMAL PLAY MODE: Transparent Interactive Hotspots Aligned With Drawn Menu Plaques & Characters */}
          {!isImgFailed &&
            !isHotspotEditMode &&
            hotspots.map((spot) => {
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
                  aria-label={spot.label}
                  title={spot.subtitle ? `${spot.label} — ${spot.subtitle}` : spot.label}
                  onMouseEnter={() => soundEngine.playButtonHover()}
                  onClick={() => {
                    setPressedSpotId(spot.id);
                    window.setTimeout(() => {
                      setPressedSpotId(null);
                      executeHotspotAction(spot.id);
                    }, 150);
                  }}
                  style={{
                    left: `${spot.left}%`,
                    top: `${spot.top}%`,
                    width: `${spot.width}%`,
                    height: `${spot.height}%`,
                  }}
                  className={`menu-hotspot ${glowCls} rounded-xl ${
                    pressedSpotId === spot.id ? 'menu-hotspot-pressed' : ''
                  } group absolute cursor-pointer touch-manipulation focus:outline-none`}
                >
                  <span className="sr-only">{spot.label}</span>
                  <span aria-hidden="true" className="menu-hotspot-shimmer" />
                  {spot.isSceneElement && (
                    <span className="pointer-events-none opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#160d2e]/95 border border-[#facc15] font-pixel font-bold text-[10px] text-[#fde047] whitespace-nowrap shadow-md">
                      {spot.label}
                    </span>
                  )}
                </button>
              );
            })}

          {/* DEVELOPER MODE: Interactive Percentage Hotspot Calibrator */}
          {!isImgFailed && isHotspotEditMode && (
            <HotspotEditorOverlay
              scopeId={regionId}
              scopeTitle={regionInfo.name}
              hotspots={hotspots}
              stageRef={stageBoxRef}
              onSaveHotspots={onSaveHotspots}
              onResetHotspots={onResetHotspots}
              onCloseEditor={onToggleHotspotEditMode}
              onTestClickHotspot={(id) => executeHotspotAction(id)}
            />
          )}
        </div>
      </main>

      {/* BOTTOM NAVIGATION BAR (Desktop & Portrait; hidden in Phone Landscape unless toggled via MENU) */}
      {!isLandscapePhone && (
        <BottomGameNavBar
          ultraCompact={isPortraitPhone}
          crystalsCount={crystalsCount}
          onOpenWorldMap={onBackToWorldMap}
          onOpenJournal={onOpenJournal}
          onOpenInventory={onOpenInventory}
          onOpenProgress={onOpenProgress}
          onOpenSettings={onOpenSettings}
          onOpenGuide={onOpenGuide}
        />
      )}

      {/* Rich Interactive Sub-Modal for Location Hotspots */}
      <LocationActivityModal
        modal={subModal}
        playerName={playerName}
        avatarId={avatarId}
        score={score}
        crystalsCount={crystalsCount}
        badges={badges}
        explorationBadges={explorationBadges}
        completedQuestions={completedQuestions}
        foundHiddenBooks={foundHiddenBooks}
        getRegionStatus={getRegionStatus}
        onClose={() => setSubModal(null)}
        onLaunchQuestion={onLaunchQuestion}
        onOpenLearningCategory={onOpenLearningCategory}
        onTalkNpcId={onTalkNpcId}
        onDiscoverBook={onDiscoverBook}
        onMarkRegionExplored={onMarkRegionExplored}
        onEnterRpgTilemap={onEnterRpgTilemap}
        onOpenWorldMap={onBackToWorldMap}
        onTravelRegion={onTravelRegion}
        onTriggerVictory={onTriggerVictory}
      />
    </div>
  );
};
