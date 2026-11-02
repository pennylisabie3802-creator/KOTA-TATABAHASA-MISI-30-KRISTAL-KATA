import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Image as ImageIcon,
  Settings,
  Sparkles,
  Target,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  AvatarId,
  BadgeId,
  CastleRoomId,
  DynamicNpcDialogueResult,
  ExplorationBadgeId,
  ExplorationStatus,
  GameLogoConfig,
  HotspotRect,
  HotspotScopeId,
  LibraryCategoryId,
  LocationAssetRecord,
  LocationAssetSlotId,
  LogoDisplayMode,
  MapId,
  MapInteractiveProp,
  MapNpc,
  MapPortal,
  MapSign,
  NpcDialogueOption,
  QuestionAttemptStat,
  QuestionEditableFields,
  QuestionImageRecord,
  QuestionImageSlotId,
  QuizQuestion,
  RegionId,
  SaveGameData,
  ScreenMode,
} from './types/game';
import { WORLD_MAPS } from './engine/maps';
import {
  applyAllQuestionOverrides,
  applySingleQuestionOverride,
  cloneQuizQuestion,
  getQuestionById,
  getQuestionsByMap,
  getQuestionsByMission,
  QUIZ_QUESTIONS,
} from './data/questions';
import {
  CASTLE_ROOMS_INFO,
  EXPLORATION_BADGES_INFO,
  HIDDEN_MAGIC_BOOKS,
  LIBRARY_CATEGORIES_INFO,
  MAIN_NPCS_LIST,
  REGION_DIRECTORY,
} from './data/sideActivities';
import { buildDynamicNpcDialogue } from './data/npcDialogues';
import {
  deleteQuestionImageFromStore,
  formatQuestionSlotId,
  loadAllQuestionImages,
  saveQuestionImageToStore,
} from './utils/questionImageStore';
import {
  deleteQuestionOverrideFromStore,
  loadAllQuestionOverrides,
  loadCachedQuestionOverrides,
  saveQuestionOverrideToStore,
} from './utils/questionOverrideStore';
import {
  buildEffectiveQuestionStats,
  loadAllQuestionStats,
  loadCachedQuestionStats,
  recordQuestionAttemptToStore,
  resetQuestionStatInStore,
} from './utils/questionStatsStore';
import {
  buildDefaultLocationAssetMap,
  getSlotByRegionId,
  loadAllLocationAssets,
  resetLocationAssetToDefault,
  saveLocationAssetToStore,
} from './utils/locationAssetStore';
import {
  buildDefaultGameLogoConfig,
  loadGameLogoConfig,
  resetToBuiltinOfficialLogo,
  saveUploadedGameLogo,
  setLogoPlaceholderOnlyMode,
  updateLogoDisplayMode,
} from './utils/gameLogoStore';
import {
  getResolvedHotspots,
  loadHotspotOverrides,
  resetHotspotOverridesForScope,
  saveHotspotOverridesForScope,
} from './data/hotspotConfig';
import { soundEngine } from './audio/soundEngine';
import { OpeningSplashScreen } from './components/OpeningSplashScreen';
import { TitleScreen } from './components/TitleScreen';
import { AvatarSelectScreen } from './components/AvatarSelectScreen';
import { IntroStoryScreen } from './components/IntroStoryScreen';
import { LocationSceneScreen } from './components/LocationSceneScreen';
import { LocationLoadingOverlay } from './components/LocationLoadingOverlay';
import { RpgCanvas } from './components/RpgCanvas';
import { PixelPortrait } from './components/PixelPortrait';
import { BottomGameNavBar } from './components/BottomGameNavBar';
import { NpcDialogModal } from './components/NpcDialogModal';
import { SignpostTravelModal } from './components/SignpostTravelModal';
import { QuizModal } from './components/QuizModal';
import {
  QuickEditQuestionModal,
  SupportingImageDraftAction,
} from './components/QuickEditQuestionModal';
import { MissionCompleteModal } from './components/MissionCompleteModal';
import { JournalModal } from './components/JournalModal';
import { LearningModal } from './components/LearningModal';
import { InventoryModal } from './components/InventoryModal';
import { ProgressModal } from './components/ProgressModal';
import { WorldMapModal } from './components/WorldMapModal';
import { SettingsModal } from './components/SettingsModal';
import { QuestionImageManagerModal } from './components/QuestionImageManagerModal';
import { LocationAssetManagerModal } from './components/LocationAssetManagerModal';
import { LogoManagerModal } from './components/LogoManagerModal';
import { GuideModal } from './components/GuideModal';
import { CreditsModal } from './components/CreditsModal';
import { VictoryScreen } from './components/VictoryScreen';
import { PortraitRotationPrompt } from './components/PortraitRotationPrompt';
import { useMobileViewport } from './hooks/useMobileViewport';

const STORAGE_KEY = 'kota_tatabahasa_save_v1';
const DEV_SESSION_KEY = 'kota_tatabahasa_dev_session_v1';

const DEFAULT_SAVE: SaveGameData = {
  hasStarted: false,
  playerName: 'Wira Bahasa',
  avatarId: 'wira_bahasa',
  currentMap: 'taman_sakura',
  previousMap: 'taman_sakura',
  lastPlayView: 'LOCATION_VIEW',
  playerTileX: WORLD_MAPS.taman_sakura.spawnX,
  playerTileY: WORLD_MAPS.taman_sakura.spawnY,
  score: 0,
  completedQuestions: {},
  badges: [],
  explorationBadges: [],
  visitedMaps: { taman_sakura: true },
  fullyExploredMaps: {},
  foundHiddenBooks: {},
  talkedToMainNpcs: {},
  readCategories: {},
  visitedCastleRooms: {},
  talkedToMentors: {},
  soundEnabled: true,
  musicEnabled: true,
};

function migrateLegacyMapId(rawMap: unknown): MapId {
  if (rawMap === 'kota') return 'istana_luar';
  if (rawMap === 'misi1') return 'taman_sakura';
  if (rawMap === 'misi2') return 'pasar_perkataan';
  if (rawMap === 'misi3') return 'benteng_wira';
  if (typeof rawMap === 'string' && rawMap in WORLD_MAPS) {
    return rawMap as MapId;
  }
  return 'taman_sakura';
}

function mapIdToRegionId(mapId: MapId): RegionId {
  return mapId === 'istana_dalam' ? 'istana_luar' : mapId;
}

function loadSaveData(): SaveGameData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SAVE;
    const parsed = JSON.parse(raw) as Partial<SaveGameData> & { currentMap?: unknown };
    const migratedMap = migrateLegacyMapId(parsed.currentMap);
    const mapDef = WORLD_MAPS[migratedMap];
    const validX =
      typeof parsed.playerTileX === 'number' &&
      parsed.playerTileX >= 1 &&
      parsed.playerTileX < mapDef.cols - 1
        ? parsed.playerTileX
        : mapDef.spawnX;
    const validY =
      typeof parsed.playerTileY === 'number' &&
      parsed.playerTileY >= 1 &&
      parsed.playerTileY < mapDef.rows - 1
        ? parsed.playerTileY
        : mapDef.spawnY;

    return {
      ...DEFAULT_SAVE,
      ...parsed,
      currentMap: migratedMap,
      previousMap: migrateLegacyMapId(parsed.previousMap),
      lastPlayView:
        parsed.lastPlayView === 'PLAYING' ? 'PLAYING' : 'LOCATION_VIEW',
      playerTileX: validX,
      playerTileY: validY,
      completedQuestions: parsed.completedQuestions ?? {},
      badges: Array.isArray(parsed.badges) ? parsed.badges : [],
      explorationBadges: Array.isArray(parsed.explorationBadges)
        ? parsed.explorationBadges
        : [],
      visitedMaps: parsed.visitedMaps ?? { [migratedMap]: true },
      fullyExploredMaps: parsed.fullyExploredMaps ?? {},
      foundHiddenBooks: parsed.foundHiddenBooks ?? {},
      talkedToMainNpcs: parsed.talkedToMainNpcs ?? {},
      readCategories: parsed.readCategories ?? {},
      visitedCastleRooms: parsed.visitedCastleRooms ?? {},
      talkedToMentors: parsed.talkedToMentors ?? {},
    };
  } catch {
    return DEFAULT_SAVE;
  }
}

export default function App() {
  const { isPortraitPhone, isLandscapePhone, isMobileDevice } = useMobileViewport();
  const [save, setSave] = useState<SaveGameData>(() => loadSaveData());
  const [screen, setScreen] = useState<ScreenMode>('SPLASH');
  const [isScreenFading, setIsScreenFading] = useState(false);
  const screenFadeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (screenFadeTimerRef.current !== null) {
        window.clearTimeout(screenFadeTimerRef.current);
      }
    };
  }, []);

  // ~300ms uniform fade-out / fade-in transition (Bahagian 4)
  const runWithScreenFade = useCallback((action: () => void, fadeMs = 260) => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      action();
      return;
    }

    if (screenFadeTimerRef.current !== null) {
      window.clearTimeout(screenFadeTimerRef.current);
    }

    setIsScreenFading(true);
    screenFadeTimerRef.current = window.setTimeout(() => {
      screenFadeTimerRef.current = null;
      action();
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          setIsScreenFading(false);
        });
      });
    }, fadeMs);
  }, []);

  const navigateToScreen = useCallback(
    (nextScreen: ScreenMode) => {
      runWithScreenFade(() => {
        setScreen(nextScreen);
      });
    },
    [runWithScreenFade]
  );

  // Active Modals & Overlays
  const [activeDialogue, setActiveDialogue] = useState<DynamicNpcDialogueResult | null>(null);
  const [activeSign, setActiveSign] = useState<MapSign | null>(null);
  const [isSignpostOpen, setIsSignpostOpen] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<QuizQuestion | null>(null);
  const [completedMissionCelebration, setCompletedMissionCelebration] = useState<1 | 2 | 3 | null>(
    null
  );

  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [isLearningOpen, setIsLearningOpen] = useState(false);
  const [learningInitialCategory, setLearningInitialCategory] =
    useState<LibraryCategoryId | null>(null);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);
  const [isLogoManagerOpen, setIsLogoManagerOpen] = useState(false);
  const [questTrackerExpanded, setQuestTrackerExpanded] = useState(true);

  // Official Game Logo System (asset: logo-kota-tatabahasa — Sections 1, 2 & 11)
  const [logoConfig, setLogoConfig] = useState<GameLogoConfig>(() =>
    buildDefaultGameLogoConfig()
  );

  // Real Asset Location Loading Overlay State (Section 5)
  const [locationLoadingState, setLocationLoadingState] = useState<{
    isOpen: boolean;
    locationName: string;
    progress: number;
  }>({
    isOpen: false,
    locationName: '',
    progress: 0,
  });

  // Developer / Teacher Mode — Quick Edit & Question Image Management (strictly hidden for normal students)
  const [isDeveloperUnlocked, setIsDeveloperUnlocked] = useState<boolean>(() => {
    try {
      return typeof sessionStorage !== 'undefined' && sessionStorage.getItem(DEV_SESSION_KEY) === 'unlocked';
    } catch {
      return false;
    }
  });
  const [isQuestionImageManagerOpen, setIsQuestionImageManagerOpen] = useState(false);
  const [questionImages, setQuestionImages] = useState<
    Partial<Record<QuestionImageSlotId, QuestionImageRecord>>
  >({});

  // Per-question Quick Edit overrides & active Quick Edit state
  const [questionOverrides, setQuestionOverrides] = useState<
    Record<number, QuestionEditableFields>
  >(() => {
    const cached = loadCachedQuestionOverrides();
    applyAllQuestionOverrides(cached);
    return cached;
  });
  const [quickEditQuestion, setQuickEditQuestion] = useState<QuizQuestion | null>(null);
  const [questionEditRevision, setQuestionEditRevision] = useState(0);
  const [questionStats, setQuestionStats] = useState<Record<number, QuestionAttemptStat>>(() =>
    loadCachedQuestionStats()
  );

  const effectiveQuestionStats = useMemo(
    () => buildEffectiveQuestionStats(questionStats, save.completedQuestions),
    [questionStats, save.completedQuestions]
  );

  const handleRecordQuestionAttempt = useCallback(
    (questionId: number, isCorrect: boolean, selectedOption?: 'A' | 'B' | 'C' | 'D') => {
      void recordQuestionAttemptToStore(questionId, isCorrect, selectedOption).then((updated) => {
        setQuestionStats(updated);
      });
    },
    []
  );

  const handleResetQuestionStat = useCallback(async (questionId: number) => {
    const updated = await resetQuestionStatInStore(questionId);
    setQuestionStats(updated);
  }, []);

  const handleUnlockDeveloperMode = useCallback(() => {
    setIsDeveloperUnlocked(true);
    try {
      sessionStorage.setItem(DEV_SESSION_KEY, 'unlocked');
    } catch {
      // Ignore sessionStorage restrictions
    }
  }, []);

  const handleLockDeveloperMode = useCallback(() => {
    setIsDeveloperUnlocked(false);
    setQuickEditQuestion(null);
    setIsHotspotEditMode(false);
    try {
      sessionStorage.removeItem(DEV_SESSION_KEY);
    } catch {
      // Ignore sessionStorage restrictions
    }
  }, []);

  // 9-Slot Location Illustration Asset System (Bahagian 1) & Hotspot Editor Mode (Bahagian 3)
  const [locationAssets, setLocationAssets] = useState<
    Record<LocationAssetSlotId, LocationAssetRecord>
  >(() => buildDefaultLocationAssetMap());
  const [isLocationAssetManagerOpen, setIsLocationAssetManagerOpen] = useState(false);
  const [assetManagerFocusSlot, setAssetManagerFocusSlot] =
    useState<LocationAssetSlotId | null>(null);

  const [hotspotOverrides, setHotspotOverrides] = useState(() => loadHotspotOverrides());
  const [isHotspotEditMode, setIsHotspotEditMode] = useState(false);

  useEffect(() => {
    let active = true;
    loadGameLogoConfig().then((loadedLogo) => {
      if (active) {
        setLogoConfig(loadedLogo);
      }
    });
    loadAllQuestionImages().then((loaded) => {
      if (active) {
        setQuestionImages(loaded);
      }
    });
    loadAllQuestionOverrides().then((loadedOverrides) => {
      if (active) {
        applyAllQuestionOverrides(loadedOverrides);
        setQuestionOverrides(loadedOverrides);
        setActiveQuestion((prevActive) => {
          if (!prevActive) return null;
          const refreshed = getQuestionById(prevActive.id);
          return refreshed ? cloneQuizQuestion(refreshed) : prevActive;
        });
      }
    });
    loadAllLocationAssets().then((loadedLocs) => {
      if (active) {
        setLocationAssets(loadedLocs);
      }
    });
    loadAllQuestionStats().then((loadedStats) => {
      if (active) {
        setQuestionStats(loadedStats);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const handleSaveLogoFile = useCallback(
    async (file: File, variant: LogoDisplayMode) => {
      const updated = await saveUploadedGameLogo(file, variant, logoConfig);
      setLogoConfig(updated);
    },
    [logoConfig]
  );

  const handleChangeLogoDisplayMode = useCallback(
    async (mode: LogoDisplayMode) => {
      const updated = await updateLogoDisplayMode(mode, logoConfig);
      setLogoConfig(updated);
    },
    [logoConfig]
  );

  const handleResetToOfficialLogo = useCallback(async () => {
    const def = await resetToBuiltinOfficialLogo();
    setLogoConfig(def);
  }, []);

  const handleSetLogoPlaceholderMode = useCallback(async () => {
    const ph = await setLogoPlaceholderOnlyMode();
    setLogoConfig(ph);
  }, []);

  const handleSaveQuestionImage = useCallback(
    async (questionId: number, file: File, dataUrl: string) => {
      const record = await saveQuestionImageToStore(questionId, file, dataUrl);
      const slotId = formatQuestionSlotId(questionId);
      setQuestionImages((prev) => ({
        ...prev,
        [slotId]: record,
      }));
    },
    []
  );

  const handleDeleteQuestionImage = useCallback(async (questionId: number) => {
    await deleteQuestionImageFromStore(questionId);
    const slotId = formatQuestionSlotId(questionId);
    setQuestionImages((prev) => {
      const next = { ...prev };
      delete next[slotId];
      return next;
    });
  }, []);

  const handleSaveLocationAsset = useCallback(
    async (slotId: LocationAssetSlotId, file: File, dataUrl: string) => {
      const updatedRecord = await saveLocationAssetToStore(slotId, file, dataUrl);
      setLocationAssets((prev) => ({
        ...prev,
        [slotId]: updatedRecord,
      }));
    },
    []
  );

  const handleResetLocationAsset = useCallback(async (slotId: LocationAssetSlotId) => {
    const defaultRecord = await resetLocationAssetToDefault(slotId);
    setLocationAssets((prev) => ({
      ...prev,
      [slotId]: defaultRecord,
    }));
  }, []);

  const handleOpenLocationAssetManager = useCallback(
    (focusSlot: LocationAssetSlotId | null = null) => {
      setAssetManagerFocusSlot(focusSlot);
      setIsLocationAssetManagerOpen(true);
    },
    []
  );

  const handleSaveHotspots = useCallback((scope: HotspotScopeId, rects: HotspotRect[]) => {
    const updated = saveHotspotOverridesForScope(scope, rects);
    setHotspotOverrides(updated);
  }, []);

  const handleResetHotspots = useCallback((scope: HotspotScopeId) => {
    const updated = resetHotspotOverridesForScope(scope);
    setHotspotOverrides(updated);
  }, []);

  const worldMapHotspots = useMemo(
    () => getResolvedHotspots('world_map', hotspotOverrides),
    [hotspotOverrides]
  );

  const activeRegionId = useMemo(
    () => mapIdToRegionId(save.currentMap),
    [save.currentMap]
  );

  const activeRegionHotspots = useMemo(
    () => getResolvedHotspots(activeRegionId, hotspotOverrides),
    [activeRegionId, hotspotOverrides]
  );

  const activeRegionAsset = useMemo(() => {
    const slotDef = getSlotByRegionId(activeRegionId);
    return locationAssets[slotDef.slotId];
  }, [activeRegionId, locationAssets]);

  // Achievement / Discovery Toast
  const [toastBanner, setToastBanner] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastBanner(msg);
  }, []);

  useEffect(() => {
    if (!toastBanner) return;
    const t = window.setTimeout(() => setToastBanner(null), 3400);
    return () => clearTimeout(t);
  }, [toastBanner]);

  // Persist lightweight player progress to localStorage automatically (Bahagian 11)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    } catch {
      // Ignore storage quota issues
    }
  }, [save]);

  // Sync SoundEngine with saved audio preferences
  useEffect(() => {
    soundEngine.setSoundEnabled(save.soundEnabled);
    soundEngine.setMusicEnabled(save.musicEnabled);
  }, [save.soundEnabled, save.musicEnabled]);

  // Auto-start 8-bit BGM on first user pointer/keyboard gesture when audio is enabled
  useEffect(() => {
    if (!save.soundEnabled || !save.musicEnabled) return;
    const unlockBgm = () => {
      soundEngine.startBgm();
    };
    window.addEventListener('pointerdown', unlockBgm, { once: true, passive: true });
    window.addEventListener('keydown', unlockBgm, { once: true, passive: true });
    return () => {
      window.removeEventListener('pointerdown', unlockBgm);
      window.removeEventListener('keydown', unlockBgm);
    };
  }, [save.soundEnabled, save.musicEnabled]);

  // Check and award all 5 Educational Side-Activity Exploration Badges automatically
  useEffect(() => {
    const earned: ExplorationBadgeId[] = [];

    const allBooks = HIDDEN_MAGIC_BOOKS.every((b) => save.foundHiddenBooks[b.id]);
    if (allBooks) earned.push('lencana_pencari_buku');

    const allRegions = REGION_DIRECTORY.every((r) => save.visitedMaps[r.id]);
    if (allRegions) earned.push('lencana_penjelajah');

    const allNpcs = MAIN_NPCS_LIST.every((n) => save.talkedToMainNpcs[n.key]);
    if (allNpcs) earned.push('lencana_sahabat_bahasa');

    const allCats = LIBRARY_CATEGORIES_INFO.every((c) => save.readCategories[c.id]);
    if (allCats) earned.push('lencana_pengumpul_ilmu');

    const allCastleRooms = CASTLE_ROOMS_INFO.every((r) => save.visitedCastleRooms[r.id]);
    if (allCastleRooms) earned.push('lencana_peneroka_istana');

    const newlyUnlocked = earned.filter((b) => !save.explorationBadges.includes(b));
    if (newlyUnlocked.length > 0) {
      soundEngine.playMissionUnlock();
      const firstInfo = EXPLORATION_BADGES_INFO.find((i) => i.id === newlyUnlocked[0]);
      if (firstInfo) {
        showToast(`🏅 Lencana Penerokaan Diperoleh: ${firstInfo.title}!`);
      }
      setSave((prev) => ({
        ...prev,
        explorationBadges: Array.from(new Set([...prev.explorationBadges, ...newlyUnlocked])),
      }));
    }
  }, [
    save.foundHiddenBooks,
    save.visitedMaps,
    save.talkedToMainNpcs,
    save.readCategories,
    save.visitedCastleRooms,
    save.explorationBadges,
    showToast,
  ]);

  // Global Keyboard Shortcuts & ESC modal closer
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Developer / Teacher shortcut: Ctrl + Shift + G opens PENGURUSAN GAMBAR SOALAN
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyG') {
        e.preventDefault();
        setIsQuestionImageManagerOpen(true);
        return;
      }
      // Developer / Teacher shortcut: Ctrl + Shift + L opens 9-Slot Location Asset Manager
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyL') {
        e.preventDefault();
        handleOpenLocationAssetManager(null);
        return;
      }
      // Developer / Teacher shortcut: Ctrl + Shift + M opens Official Logo Upload Manager
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyM') {
        e.preventDefault();
        setIsLogoManagerOpen(true);
        return;
      }

      if (e.code !== 'Escape') return;
      if (quickEditQuestion) {
        setQuickEditQuestion(null);
      } else if (isLogoManagerOpen) {
        setIsLogoManagerOpen(false);
      } else if (isGuideOpen) {
        setIsGuideOpen(false);
      } else if (isCreditsOpen) {
        setIsCreditsOpen(false);
      } else if (isLocationAssetManagerOpen) {
        setIsLocationAssetManagerOpen(false);
      } else if (isQuestionImageManagerOpen) {
        setIsQuestionImageManagerOpen(false);
      } else if (activeQuestion) {
        setActiveQuestion(null);
      } else if (activeDialogue || activeSign) {
        setActiveDialogue(null);
        setActiveSign(null);
      } else if (isSignpostOpen) {
        setIsSignpostOpen(false);
      } else if (isJournalOpen) {
        setIsJournalOpen(false);
      } else if (isLearningOpen) {
        setIsLearningOpen(false);
        setLearningInitialCategory(null);
      } else if (isInventoryOpen) {
        setIsInventoryOpen(false);
      } else if (isProgressOpen) {
        setIsProgressOpen(false);
      } else if (isMapOpen) {
        setIsMapOpen(false);
      } else if (screen === 'PLAYING' || screen === 'LOCATION_VIEW') {
        setIsSettingsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    quickEditQuestion,
    isLogoManagerOpen,
    isGuideOpen,
    isCreditsOpen,
    isLocationAssetManagerOpen,
    isQuestionImageManagerOpen,
    activeQuestion,
    activeDialogue,
    activeSign,
    isSignpostOpen,
    isJournalOpen,
    isLearningOpen,
    isInventoryOpen,
    isProgressOpen,
    isMapOpen,
    screen,
    handleOpenLocationAssetManager,
  ]);

  const crystalsCount = useMemo(
    () => Object.keys(save.completedQuestions).length,
    [save.completedQuestions]
  );

  const playerLevel = useMemo(
    () => Math.min(7, 1 + Math.floor(crystalsCount / 5)),
    [crystalsCount]
  );

  const m1SolvedCount = useMemo(
    () => getQuestionsByMission(1).filter((q) => Boolean(save.completedQuestions[q.id])).length,
    [save.completedQuestions]
  );
  const m2SolvedCount = useMemo(
    () => getQuestionsByMission(2).filter((q) => Boolean(save.completedQuestions[q.id])).length,
    [save.completedQuestions]
  );
  const m3SolvedCount = useMemo(
    () => getQuestionsByMission(3).filter((q) => Boolean(save.completedQuestions[q.id])).length,
    [save.completedQuestions]
  );

  const m1Done = m1SolvedCount === 10;
  const m2Done = m2SolvedCount === 10;
  const m3Done = m3SolvedCount === 10;

  // Region Exploration Status Calculator
  const getRegionStatus = useCallback(
    (regionId: RegionId): ExplorationStatus => {
      if (!save.visitedMaps[regionId]) {
        return 'BELUM_DILAWATI';
      }
      if (save.fullyExploredMaps[regionId]) {
        return 'TELAH_DITEROKAI';
      }

      const mapQs = getQuestionsByMap(regionId);
      if (mapQs.length > 0) {
        const allQsSolved = mapQs.every((q) => Boolean(save.completedQuestions[q.id]));
        if (allQsSolved) return 'TELAH_DITEROKAI';
        return 'SEDANG_DITEROKAI';
      }

      if (regionId === 'istana_luar') {
        const roomsDone = CASTLE_ROOMS_INFO.every((r) => save.visitedCastleRooms[r.id]);
        if (roomsDone || (save.visitedMaps.istana_dalam && save.talkedToMainNpcs.penjaga_istana)) {
          return 'TELAH_DITEROKAI';
        }
      } else if (regionId === 'perpustakaan_ajaib') {
        const readCount = Object.keys(save.readCategories).length;
        if (save.talkedToMainNpcs.pustakawan_ajaib && readCount >= 3) {
          return 'TELAH_DITEROKAI';
        }
      } else if (regionId === 'hutan_misteri') {
        if (save.talkedToMainNpcs.peri_perkataan && save.foundHiddenBooks.buku_hutan) {
          return 'TELAH_DITEROKAI';
        }
      } else if (regionId === 'kampung_tatabahasa') {
        if (save.talkedToMainNpcs.ketua_kampung && save.foundHiddenBooks.buku_kampung) {
          return 'TELAH_DITEROKAI';
        }
      }

      return 'SEDANG_DITEROKAI';
    },
    [
      save.visitedMaps,
      save.fullyExploredMaps,
      save.completedQuestions,
      save.visitedCastleRooms,
      save.talkedToMainNpcs,
      save.readCategories,
      save.foundHiddenBooks,
    ]
  );

  const anyModalOpen = Boolean(
    activeDialogue ||
      activeSign ||
      isSignpostOpen ||
      activeQuestion ||
      quickEditQuestion ||
      completedMissionCelebration ||
      isJournalOpen ||
      isLearningOpen ||
      isInventoryOpen ||
      isProgressOpen ||
      isMapOpen ||
      isSettingsOpen ||
      isGuideOpen ||
      isCreditsOpen ||
      isLogoManagerOpen ||
      isQuestionImageManagerOpen ||
      isLocationAssetManagerOpen ||
      locationLoadingState.isOpen
  );

  // Real Asset Preloader with Progress Bar for Entering Adventure Locations (Section 5)
  const preloadRegionAssetsWithOverlay = useCallback(
    async (regionId: RegionId, displayLabel: string) => {
      const slotDef = getSlotByRegionId(regionId);
      const asset = locationAssets[slotDef.slotId];

      setLocationLoadingState({
        isOpen: true,
        locationName: displayLabel,
        progress: 18,
      });

      const loadSingleUrl = (url: string): Promise<boolean> =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            if (typeof img.decode === 'function') {
              img
                .decode()
                .catch(() => {})
                .finally(() => resolve(true));
            } else {
              resolve(true);
            }
          };
          img.onerror = () => resolve(false);
          img.src = url;
        });

      const startTs = performance.now();
      let loadedOk = await loadSingleUrl(asset.imageUrl);
      setLocationLoadingState((prev) => ({ ...prev, progress: 68 }));

      if (!loadedOk && asset.fallbackUrl) {
        loadedOk = await loadSingleUrl(asset.fallbackUrl);
      }

      if (typeof document !== 'undefined' && document.fonts?.ready) {
        await Promise.race([
          document.fonts.ready,
          new Promise((r) => window.setTimeout(r, 150)),
        ]);
      }

      setLocationLoadingState((prev) => ({ ...prev, progress: 100 }));

      // Brief visual settle only if cached instantaneously so progress reaches 100% cleanly without flicker
      const elapsed = performance.now() - startTs;
      const settleMs = Math.max(120, Math.min(280, 320 - elapsed));
      await new Promise((r) => window.setTimeout(r, settleMs));
    },
    [locationAssets]
  );

  // Enter a Region in Mod A (Ilustrasi Interaktif — Bahagian 4, 5 & 9) with Real Asset Loading Screen
  const enterRegionIllustration = useCallback(
    (regionId: RegionId) => {
      soundEngine.startBgm();
      const mapDef = WORLD_MAPS[regionId];
      const regInfo = REGION_DIRECTORY.find((r) => r.id === regionId);
      const displayLabel = regInfo?.name ?? mapDef.name;

      setIsMapOpen(false);
      setIsProgressOpen(false);
      setIsSignpostOpen(false);

      void preloadRegionAssetsWithOverlay(regionId, displayLabel).then(() => {
        setSave((prev) => ({
          ...prev,
          hasStarted: true,
          previousMap: prev.currentMap,
          currentMap: regionId,
          lastPlayView: 'LOCATION_VIEW',
          playerTileX: mapDef.spawnX,
          playerTileY: mapDef.spawnY,
          visitedMaps: {
            ...prev.visitedMaps,
            [regionId]: true,
          },
        }));
        setScreen('LOCATION_VIEW');
        setLocationLoadingState((prev) => ({ ...prev, isOpen: false }));
      });
    },
    [preloadRegionAssetsWithOverlay]
  );

  // Smooth Travel Between Locations & Interiors inside Mod B (2D Tilemap RPG) using Official Logo Loading Overlay
  const travelToMap = useCallback(
    (targetMap: MapId, customX?: number, customY?: number) => {
      const mapDef = WORLD_MAPS[targetMap];
      const nx = customX ?? mapDef.spawnX;
      const ny = customY ?? mapDef.spawnY;
      const targetRegionId = mapIdToRegionId(targetMap);

      void preloadRegionAssetsWithOverlay(targetRegionId, mapDef.name).then(() => {
        setLocationLoadingState((prev) => ({ ...prev, isOpen: false }));

        setSave((prev) => {
          const nextVisited = {
            ...prev.visitedMaps,
            [targetMap]: true,
            ...(targetMap === 'istana_dalam' ? { istana_luar: true } : {}),
          };

          const mentorNpcId =
            targetMap === 'taman_sakura'
              ? 'cikgu_salmah'
              : targetMap === 'pasar_perkataan'
              ? 'pak_cik_rahman'
              : targetMap === 'menara_media'
              ? 'wartawan_bahasa'
              : targetMap === 'benteng_wira'
              ? 'profesor_bahasa'
              : null;

          if (mentorNpcId && !prev.talkedToMentors[mentorNpcId]) {
            window.setTimeout(() => {
              const dlg = buildDynamicNpcDialogue(mentorNpcId, {
                playerName: prev.playerName,
                completedQuestions: prev.completedQuestions,
                score: prev.score,
              });
              setActiveDialogue(dlg);
            }, 220);

            return {
              ...prev,
              previousMap: prev.currentMap,
              currentMap: targetMap,
              playerTileX: nx,
              playerTileY: ny,
              visitedMaps: nextVisited,
              talkedToMentors: { ...prev.talkedToMentors, [mentorNpcId]: true },
              talkedToMainNpcs: { ...prev.talkedToMainNpcs, [mentorNpcId]: true },
            };
          }

          return {
            ...prev,
            previousMap: prev.currentMap,
            currentMap: targetMap,
            playerTileX: nx,
            playerTileY: ny,
            visitedMaps: nextVisited,
          };
        });
      });
    },
    [preloadRegionAssetsWithOverlay]
  );

  // Main Flow Handlers ("MENU UTAMA" -> "PILIH AVATAR" -> "PETA DUNIA KERAJAAN TATABAHASA" -> "MASUK LOKASI")
  const applyStartNewFlowDirect = () => {
    soundEngine.startBgm();
    setSave((prev) => ({
      ...DEFAULT_SAVE,
      soundEnabled: prev.soundEnabled,
      musicEnabled: prev.musicEnabled,
      hasStarted: false,
    }));
    setScreen('AVATAR_SELECT');
  };

  // "SAMBUNG PENGEMBARAAN": opens the player's last saved location directly (Bahagian 11)
  const applyContinueGameDirect = () => {
    soundEngine.startBgm();
    if (!save.hasStarted) {
      setScreen('AVATAR_SELECT');
      return;
    }
    setScreen(save.lastPlayView === 'PLAYING' ? 'PLAYING' : 'LOCATION_VIEW');
  };

  const handleConfirmAvatar = (avatarId: AvatarId, playerName: string) => {
    soundEngine.startBgm();
    setSave((prev) => ({
      ...DEFAULT_SAVE,
      soundEnabled: prev.soundEnabled,
      musicEnabled: prev.musicEnabled,
      hasStarted: true,
      avatarId,
      playerName,
      currentMap: 'taman_sakura',
      lastPlayView: 'LOCATION_VIEW',
    }));
    navigateToScreen('INTRO_STORY');
  };

  const handleFinishIntro = () => {
    soundEngine.startBgm();
    navigateToScreen('WORLD_SELECT');
  };

  // Talk to an NPC by ID (used by Mod A Ilustrasi Interaktif hotspots)
  const handleTalkNpcById = useCallback(
    (npcId: string) => {
      const dlg = buildDynamicNpcDialogue(npcId, {
        playerName: save.playerName,
        completedQuestions: save.completedQuestions,
        score: save.score,
        readCategoriesCount: Object.keys(save.readCategories).length,
        visitedCastleRoomsCount: Object.keys(save.visitedCastleRooms).length,
      });
      setActiveDialogue(dlg);

      const mainKeyMatch = MAIN_NPCS_LIST.find((n) => n.key === npcId);
      if (mainKeyMatch) {
        setSave((prev) => ({
          ...prev,
          talkedToMainNpcs: { ...prev.talkedToMainNpcs, [mainKeyMatch.key]: true },
        }));
      }
    },
    [
      save.playerName,
      save.completedQuestions,
      save.score,
      save.readCategories,
      save.visitedCastleRooms,
    ]
  );

  // World Interactions (Mod B Tilemap RPG)
  const handleInteractNpc = useCallback(
    (npc: MapNpc) => {
      const dlg = buildDynamicNpcDialogue(npc.id, {
        playerName: save.playerName,
        completedQuestions: save.completedQuestions,
        score: save.score,
        readCategoriesCount: Object.keys(save.readCategories).length,
        visitedCastleRoomsCount: Object.keys(save.visitedCastleRooms).length,
      });
      setActiveDialogue(dlg);

      if (npc.mainNpcKey) {
        setSave((prev) => ({
          ...prev,
          talkedToMainNpcs: { ...prev.talkedToMainNpcs, [npc.mainNpcKey!]: true },
        }));
      }
    },
    [
      save.playerName,
      save.completedQuestions,
      save.score,
      save.readCategories,
      save.visitedCastleRooms,
    ]
  );

  const handleInteractSign = useCallback((sign: MapSign) => {
    if (sign.isTravelSignpost) {
      soundEngine.playButtonClick();
      setIsSignpostOpen(true);
      return;
    }
    setActiveSign(sign);
  }, []);

  const handleEnterCastleRoom = useCallback(
    (roomId: CastleRoomId, roomName: string) => {
      setSave((prev) => {
        if (prev.visitedCastleRooms[roomId]) return prev;
        showToast(`🏰 Memasuki ${roomName}`);
        return {
          ...prev,
          visitedCastleRooms: { ...prev.visitedCastleRooms, [roomId]: true },
        };
      });
    },
    [showToast]
  );

  const handleDiscoverBookById = useCallback(
    (bookId: string) => {
      const book = HIDDEN_MAGIC_BOOKS.find((b) => b.id === bookId);
      if (!book) return;
      setSave((prev) => {
        if (prev.foundHiddenBooks[bookId]) return prev;
        soundEngine.playCrystalGain();
        showToast(`✨ Buku Ajaib Ditemui: ${book.title}!`);
        return {
          ...prev,
          foundHiddenBooks: { ...prev.foundHiddenBooks, [bookId]: true },
        };
      });
    },
    [showToast]
  );

  const handleMarkRegionExplored = useCallback((regionId: RegionId) => {
    setSave((prev) => {
      if (prev.fullyExploredMaps[regionId]) return prev;
      return {
        ...prev,
        fullyExploredMaps: { ...prev.fullyExploredMaps, [regionId]: true },
      };
    });
  }, []);

  const handleInteractProp = useCallback(
    (prop: MapInteractiveProp) => {
      if (prop.kind === 'world_map_board') {
        soundEngine.playButtonClick();
        setIsMapOpen(true);
        return;
      }

      if (prop.kind === 'learning_book') {
        soundEngine.playBookOpen();
        setLearningInitialCategory(null);
        setIsLearningOpen(true);
        return;
      }

      if (prop.kind === 'library_shelf' && prop.libraryCategory) {
        soundEngine.playBookOpen();
        const cat = prop.libraryCategory;
        setSave((prev) => ({
          ...prev,
          readCategories: { ...prev.readCategories, [cat]: true },
        }));
        setLearningInitialCategory(cat);
        setIsLearningOpen(true);
        return;
      }

      if (prop.kind === 'hidden_magic_book' && prop.hiddenBookId) {
        const book = HIDDEN_MAGIC_BOOKS.find((b) => b.id === prop.hiddenBookId);
        if (!book) return;
        const alreadyFound = Boolean(save.foundHiddenBooks[book.id]);
        if (!alreadyFound) {
          soundEngine.playCrystalGain();
          setSave((prev) => ({
            ...prev,
            foundHiddenBooks: { ...prev.foundHiddenBooks, [book.id]: true },
          }));
          showToast(`✨ Buku Ajaib Ditemui: ${book.title}!`);
        } else {
          soundEngine.playBookOpen();
        }
        setActiveSign({
          id: `book_${book.id}`,
          title: `${book.title} — ${book.wisdomTitle}`,
          lines: [
            book.wisdomText,
            alreadyFound
              ? 'Buku Ajaib ini telah direkodkan dalam koleksi Pencari Buku Ajaib kamu!'
              : 'Tahniah! Penemuan ini dikira dalam Aktiviti Sampingan: Pencari Buku Ajaib!',
          ],
          tileX: prop.tileX,
          tileY: prop.tileY,
        });
        return;
      }

      if (prop.kind === 'fountain_info') {
        soundEngine.playCrystalGain();
        setActiveSign({
          id: prop.id,
          title: 'Air Pancut Kristal Ajaib',
          lines: [
            `Status Pemulihan Semasa: ${crystalsCount} / 30 Kristal Kata telah dipulihkan!`,
            crystalsCount >= 30
              ? 'Air pancut memancarkan cahaya keemasan penuh! Pergi ke Pintu Kristal Utama di Benteng Wira Bahasa!'
              : 'Setiap cabaran tatabahasa yang diselesaikan dalam Misi 1, Misi 2, dan Misi 3 akan menambah sinaran kristal kota ini.',
          ],
          tileX: prop.tileX,
          tileY: prop.tileY,
        });
        return;
      }

      if (prop.kind === 'crystal_slot' && prop.crystalQuestionId) {
        const qId = prop.crystalQuestionId;
        const q = QUIZ_QUESTIONS.find((item) => item.id === qId);
        const solved = Boolean(save.completedQuestions[qId]);
        soundEngine.playButtonClick();
        if (q) {
          const locName = WORLD_MAPS[q.mapId]?.name ?? 'Kota Tatabahasa';
          setActiveSign({
            id: prop.id,
            title: `Ruang Kristal Kata #${qId} (${solved ? 'BERCAHAYA BIRU' : 'MASIH KELABU'})`,
            lines: solved
              ? [
                  `Kristal Kata #${qId} telah dipulihkan melalui ${q.title}!`,
                  `Pembetulan yang direkodkan: “${q.pembetulanPenuh}”`,
                ]
              : [
                  `Ruang Kristal Kata #${qId} masih kelabu dan menunggu kuasa bahasa.`,
                  `Terokai ${locName} (Misi ${q.mission}) untuk menyelesaikan ${q.title}!`,
                ],
            tileX: prop.tileX,
            tileY: prop.tileY,
          });
        }
        return;
      }

      soundEngine.playBookOpen();
      if (prop.title && prop.lines) {
        if (prop.kind === 'word_class_stone' || prop.kind === 'village_notice') {
          const curMap = save.currentMap;
          if (curMap !== 'istana_dalam') {
            setSave((prev) => ({
              ...prev,
              fullyExploredMaps: { ...prev.fullyExploredMaps, [curMap]: true },
            }));
          }
        }
        setActiveSign({
          id: prop.id,
          title: prop.title,
          lines: prop.lines,
          tileX: prop.tileX,
          tileY: prop.tileY,
        });
      }
    },
    [crystalsCount, save.completedQuestions, save.currentMap, save.foundHiddenBooks, showToast]
  );

  const handleUsePortal = useCallback(
    (portal: MapPortal) => {
      if (portal.isVictoryGate) {
        if (crystalsCount >= 30) {
          soundEngine.playVictoryFanfare();
          setScreen('VICTORY');
        } else {
          soundEngine.playWrong();
          setActiveSign({
            id: 'victory_gate_locked',
            title: 'Pintu Kristal Utama Kota Tatabahasa',
            lines: [
              `Pintu Kristal Utama memerlukan kuasa kesemua 30 Kristal Kata (Semasa: ${crystalsCount} / 30).`,
              'Selesaikan baki cabaran Misi 1, Misi 2, dan Misi 3 untuk membuka gerbang kemenangan diraja ini!',
            ],
            tileX: portal.tileX,
            tileY: portal.tileY,
          });
        }
        return;
      }
      soundEngine.playButtonClick();
      travelToMap(portal.targetMap, portal.targetX, portal.targetY);
    },
    [crystalsCount, travelToMap]
  );

  const launchQuestionByIdOrRef = useCallback((question: QuizQuestion) => {
    const latest = getQuestionById(question.id) ?? question;
    setActiveQuestion(cloneQuizQuestion(latest));
  }, []);

  const handleInteractQuestion = useCallback(
    (question: QuizQuestion) => {
      launchQuestionByIdOrRef(question);
    },
    [launchQuestionByIdOrRef]
  );

  // Developer Quick Edit: 1. Pause RPG, 2. Persist current game state, 3. Open editor with current content
  const handleOpenQuickEditForQuestion = useCallback(
    (question: QuizQuestion) => {
      if (!isDeveloperUnlocked) return;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
      } catch {
        // Ignore storage quota issues
      }
      const latest = getQuestionById(question.id) ?? question;
      setQuickEditQuestion(cloneQuizQuestion(latest));
    },
    [isDeveloperUnlocked, save]
  );

  const handleSaveQuickEditAndReturn = useCallback(
    async (
      questionId: number,
      fields: QuestionEditableFields,
      imageAction: SupportingImageDraftAction,
      isRestoringFactoryDefault: boolean
    ) => {
      // 1. Save or restore ONLY this question's text/options/answer/justification override
      if (isRestoringFactoryDefault) {
        await deleteQuestionOverrideFromStore(questionId);
        applySingleQuestionOverride(questionId, null);
        setQuestionOverrides((prev) => {
          const next = { ...prev };
          delete next[questionId];
          return next;
        });
      } else {
        const savedFields = await saveQuestionOverrideToStore(questionId, fields);
        applySingleQuestionOverride(questionId, savedFields);
        setQuestionOverrides((prev) => ({
          ...prev,
          [questionId]: savedFields,
        }));
      }

      // 2. Apply supporting image draft action transactionally
      if (imageAction.kind === 'upload') {
        await handleSaveQuestionImage(questionId, imageAction.file, imageAction.dataUrl);
      } else if (imageAction.kind === 'remove') {
        await handleDeleteQuestionImage(questionId);
      }

      // 3. Reload updated content into QuizModal and return directly to the quiz view
      const refreshed = getQuestionById(questionId);
      if (refreshed) {
        setActiveQuestion(cloneQuizQuestion(refreshed));
      }
      setQuestionEditRevision((rev) => rev + 1);
      setQuickEditQuestion(null);
    },
    [handleSaveQuestionImage, handleDeleteQuestionImage]
  );

  // Open-World Rule: Locations are unlocked, only Misi 2 / Misi 3 challenges require prior mission completion!
  const missionPrerequisiteLocked = useMemo(() => {
    if (!activeQuestion) return null;
    if (save.completedQuestions[activeQuestion.id]) return null;
    if (activeQuestion.mission === 2 && !m1Done) {
      return { requiredMission: 1 as const, solvedInRequiredMission: m1SolvedCount };
    }
    if (activeQuestion.mission === 3 && !m2Done) {
      return { requiredMission: 2 as const, solvedInRequiredMission: m2SolvedCount };
    }
    return null;
  }, [activeQuestion, save.completedQuestions, m1Done, m2Done, m1SolvedCount, m2SolvedCount]);

  // Sequential Question Order Guard within each Mission (1..10, 11..20, 21..30)
  const lockedByPreviousQuestion = useMemo(() => {
    if (!activeQuestion) return null;
    if (save.completedQuestions[activeQuestion.id]) return null;
    const missionQuestions = getQuestionsByMission(activeQuestion.mission);
    for (const q of missionQuestions) {
      if (q.id < activeQuestion.id && !save.completedQuestions[q.id]) {
        return q;
      }
    }
    return null;
  }, [activeQuestion, save.completedQuestions, questionEditRevision]);

  // Complete Question & Award Crystal + Check Mission Completion!
  const handleCompleteQuestion = (
    question: QuizQuestion,
    pointsEarned: number,
    attempts: number,
    usedHint: boolean,
    revealedAfterTwoFails: boolean,
    keepModalOpen = false
  ) => {
    if (!keepModalOpen) {
      setActiveQuestion(null);
    }

    setSave((prev) => {
      if (prev.completedQuestions[question.id]) return prev;

      const updatedCompleted = {
        ...prev.completedQuestions,
        [question.id]: {
          questionId: question.id,
          mission: question.mission,
          completedAt: new Date().toISOString(),
          attempts,
          usedHint,
          pointsEarned,
          revealedAfterTwoFails,
        },
      };

      // Helpful toast when Question 16 in Pasar Perkataan finishes -> guide to Menara Media for Q17–20!
      if (question.id === 16) {
        window.setTimeout(() => {
          showToast('📰 Soalan 11–16 selesai! Teruskan Misi 2 (Soalan 17–20) di Menara Media!');
        }, 250);
      }

      const nextBadges = [...prev.badges];
      const missionQs = getQuestionsByMission(question.mission);
      const justCompletedMission = missionQs.every((mq) => Boolean(updatedCompleted[mq.id]));

      if (justCompletedMission) {
        const badgeToAward: BadgeId =
          question.mission === 1
            ? 'lencana_detektif'
            : question.mission === 2
            ? 'lencana_pemburu'
            : 'lencana_wira';
        if (!nextBadges.includes(badgeToAward)) {
          nextBadges.push(badgeToAward);
        }
        if (!keepModalOpen) {
          window.setTimeout(() => {
            setCompletedMissionCelebration(question.mission);
          }, 160);
        } else {
          showToast(`🏆 Misi ${question.mission} lengkap! Lencana diperoleh!`);
        }
      }

      return {
        ...prev,
        score: prev.score + pointsEarned,
        completedQuestions: updatedCompleted,
        badges: nextBadges,
      };
    });
  };

  const handleMissionCelebrationContinue = () => {
    const finishedMission = completedMissionCelebration;
    setCompletedMissionCelebration(null);
    if (finishedMission === 1) {
      if (screen === 'PLAYING') {
        travelToMap('pasar_perkataan');
      } else {
        enterRegionIllustration('pasar_perkataan');
      }
    } else if (finishedMission === 2) {
      if (screen === 'PLAYING') {
        travelToMap('benteng_wira');
      } else {
        enterRegionIllustration('benteng_wira');
      }
    } else if (finishedMission === 3) {
      soundEngine.playVictoryFanfare();
      navigateToScreen('VICTORY');
    }
  };

  const handleNpcDialogueAction = (action: NonNullable<NpcDialogueOption['action']>) => {
    setActiveDialogue(null);
    if (action === 'OPEN_LEARNING') {
      setLearningInitialCategory(null);
      setIsLearningOpen(true);
    } else if (action === 'OPEN_JOURNAL') {
      setIsJournalOpen(true);
    } else if (action === 'OPEN_MAP') {
      if (screen === 'LOCATION_VIEW') {
        navigateToScreen('WORLD_SELECT');
      } else {
        setIsMapOpen(true);
      }
    } else if (action === 'OPEN_SIGNPOST') {
      setIsSignpostOpen(true);
    } else if (action === 'ENTER_ISTANA_DALAM') {
      runWithScreenFade(() => {
        setSave((prev) => ({ ...prev, lastPlayView: 'PLAYING' }));
        setScreen('PLAYING');
        travelToMap('istana_dalam');
      });
    } else if (action === 'GO_TAMAN_SAKURA') {
      if (screen === 'PLAYING') travelToMap('taman_sakura');
      else enterRegionIllustration('taman_sakura');
    } else if (action === 'GO_PASAR_PERKATAAN') {
      if (screen === 'PLAYING') travelToMap('pasar_perkataan');
      else enterRegionIllustration('pasar_perkataan');
    } else if (action === 'GO_MENARA_MEDIA') {
      if (screen === 'PLAYING') travelToMap('menara_media');
      else enterRegionIllustration('menara_media');
    } else if (action === 'GO_BENTENG_WIRA') {
      if (screen === 'PLAYING') travelToMap('benteng_wira');
      else enterRegionIllustration('benteng_wira');
    }
  };

  const handleToggleSound = () => {
    setSave((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  };

  const handleToggleMainMenuAudio = () => {
    setSave((prev) => {
      const nextSound = !prev.soundEnabled;
      const nextMusic = nextSound ? true : prev.musicEnabled;
      if (nextSound && nextMusic) {
        window.setTimeout(() => soundEngine.startBgm(), 30);
      }
      return {
        ...prev,
        soundEnabled: nextSound,
        musicEnabled: nextMusic,
      };
    });
  };

  const handleToggleMusic = () => {
    setSave((prev) => ({ ...prev, musicEnabled: !prev.musicEnabled }));
  };

  const handleResetAllProgress = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSave((prev) => ({
      ...DEFAULT_SAVE,
      soundEnabled: prev.soundEnabled,
      musicEnabled: prev.musicEnabled,
    }));
    navigateToScreen('TITLE');
  };

  // Current Mission Objective Guidance Text for Right Scroll Tracker
  const activeObjectiveText = useMemo(() => {
    if (m3Done) {
      return 'Kesemua 30 Kristal Kata telah dipulihkan! Masuk Pintu Kristal Utama di Benteng Wira Bahasa!';
    }
    if (!m1Done) {
      return save.currentMap === 'taman_sakura'
        ? `Misi 1 Aktif: Siasat 10 objek di Taman Sakura Bahasa (${m1SolvedCount}/10 selesai).`
        : `Misi 1: Lawati Taman Sakura Bahasa untuk mengumpul 10 Kristal Kata pertama (${m1SolvedCount}/10).`;
    }
    if (!m2Done) {
      const pDone = getQuestionsByMap('pasar_perkataan').filter(
        (q) => save.completedQuestions[q.id]
      ).length;
      if (pDone < 6) {
        return `Misi 2 Aktif: Siasat gerai di Pasar Perkataan untuk Soalan 11–16 (${m2SolvedCount}/10 selesai).`;
      }
      return `Misi 2 Aktif: Pergi ke Menara Media untuk Soalan 17–20 (${m2SolvedCount}/10 selesai).`;
    }
    return save.currentMap === 'benteng_wira'
      ? `Misi 3 Aktif: Pulihkan 10 Kristal Emas di Benteng Wira Bahasa (${m3SolvedCount}/10 selesai).`
      : `Misi 2 Selesai! Pergi ke Benteng Wira Bahasa untuk cabaran terakhir (${m3SolvedCount}/10).`;
  }, [
    m1Done,
    m2Done,
    m3Done,
    m1SolvedCount,
    m2SolvedCount,
    m3SolvedCount,
    save.currentMap,
    save.completedQuestions,
  ]);

  // Counters for InventoryModal Side Activities
  const foundBooksCount = HIDDEN_MAGIC_BOOKS.filter((b) => save.foundHiddenBooks[b.id]).length;
  const visitedRegionsCount = REGION_DIRECTORY.filter((r) => save.visitedMaps[r.id]).length;
  const talkedMainNpcsCount = MAIN_NPCS_LIST.filter((n) => save.talkedToMainNpcs[n.key]).length;
  const readCategoriesCount = LIBRARY_CATEGORIES_INFO.filter(
    (c) => save.readCategories[c.id]
  ).length;
  const visitedCastleRoomsCount = CASTLE_ROOMS_INFO.filter(
    (r) => save.visitedCastleRooms[r.id]
  ).length;

  const savedLastLocationName = useMemo(() => {
    const regId = mapIdToRegionId(save.currentMap);
    const regInfo = REGION_DIRECTORY.find((r) => r.id === regId);
    return regInfo?.name ?? WORLD_MAPS[save.currentMap]?.name ?? 'Taman Sakura Bahasa';
  }, [save.currentMap]);

  const showGlobalPortraitBanner =
    isPortraitPhone &&
    screen !== 'TITLE' &&
    screen !== 'WORLD_SELECT' &&
    screen !== 'LOCATION_VIEW';

  return (
    <div className="relative app-viewport-shell flex flex-col overflow-hidden select-none bg-[#0d0a1f]">
      {showGlobalPortraitBanner && <PortraitRotationPrompt variant="banner" />}

      <div
        className={`relative flex-1 w-full min-h-0 transition-opacity duration-300 ease-in-out motion-reduce:transition-none ${
          isScreenFading ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {/* 0. SKRIN PEMBUKAAN PERMAINAN (Section 3) */}
        {screen === 'SPLASH' && (
          <OpeningSplashScreen
            logoConfig={logoConfig}
            onFinishSplash={() => navigateToScreen('TITLE')}
          />
        )}

        {/* 1. HALAMAN MENU UTAMA */}
        {screen === 'TITLE' && (
          <TitleScreen
            logoConfig={logoConfig}
            hasSavedProgress={save.hasStarted}
            savedPlayerName={save.playerName}
            savedAvatarId={save.avatarId}
            savedCrystals={crystalsCount}
            savedScore={save.score}
            savedLastLocationName={savedLastLocationName}
            soundEnabled={save.soundEnabled}
            musicEnabled={save.musicEnabled}
            isOverlayModalOpen={anyModalOpen}
            onRunWithScreenFade={runWithScreenFade}
            onToggleSound={handleToggleMainMenuAudio}
            onStartNewGameConfirm={applyStartNewFlowDirect}
            onContinueSavedGame={applyContinueGameDirect}
            onOpenLearning={() => {
              soundEngine.startBgm();
              setLearningInitialCategory(null);
              setIsLearningOpen(true);
            }}
            onOpenInventory={() => {
              soundEngine.startBgm();
              setIsInventoryOpen(true);
            }}
            onOpenMap={() => {
              soundEngine.startBgm();
              setIsMapOpen(true);
            }}
            onOpenSettings={() => {
              soundEngine.startBgm();
              setIsSettingsOpen(true);
            }}
            onOpenGuide={() => {
              soundEngine.startBgm();
              setIsGuideOpen(true);
            }}
            onOpenCredits={() => {
              soundEngine.startBgm();
              setIsCreditsOpen(true);
            }}
            onOpenLogoManager={() => {
              soundEngine.startBgm();
              setIsLogoManagerOpen(true);
            }}
          />
        )}

        {/* 2. PEMILIHAN AVATAR */}
        {screen === 'AVATAR_SELECT' && (
          <AvatarSelectScreen
            initialAvatar={save.avatarId}
            initialName={save.playerName}
            onBack={() => navigateToScreen('TITLE')}
            onConfirm={handleConfirmAvatar}
          />
        )}

        {/* 3. PENGENALAN CERITA */}
        {screen === 'INTRO_STORY' && (
          <IntroStoryScreen
            avatarId={save.avatarId}
            playerName={save.playerName}
            onFinishIntro={handleFinishIntro}
          />
        )}

        {/* 4. PETA DUNIA KERAJAAN TATABAHASA ("PILIH LOKASI PENGEMBARAAN") */}
        {screen === 'WORLD_SELECT' && (
          <WorldMapModal
            isOpen
            mode="fullscreen"
            currentMap={save.currentMap}
            isPlayingMode={false}
            completedQuestions={save.completedQuestions}
            getRegionStatus={getRegionStatus}
            locationAssets={locationAssets}
            worldMapHotspots={worldMapHotspots}
            isHotspotEditMode={isHotspotEditMode}
            onToggleHotspotEditMode={() => setIsHotspotEditMode((v) => !v)}
            onSaveHotspots={handleSaveHotspots}
            onResetHotspots={handleResetHotspots}
            onOpenLocationAssetManager={handleOpenLocationAssetManager}
            onSelectEnterRegion={enterRegionIllustration}
            onOpenJournal={() => setIsJournalOpen(true)}
            onOpenInventory={() => setIsInventoryOpen(true)}
            onOpenProgress={() => setIsProgressOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenGuide={() => setIsGuideOpen(true)}
            onClose={() => navigateToScreen('TITLE')}
          />
        )}

        {/* 5A. MOD A: ILUSTRASI INTERAKTIF LOKASI (Bahagian 5, 6 & 9) */}
        {screen === 'LOCATION_VIEW' && (
          <div className="relative w-full h-full">
            <LocationSceneScreen
              regionId={activeRegionId}
              playerName={save.playerName}
              avatarId={save.avatarId}
              score={save.score}
              crystalsCount={crystalsCount}
              badges={save.badges}
              explorationBadges={save.explorationBadges}
              completedQuestions={save.completedQuestions}
              foundHiddenBooks={save.foundHiddenBooks}
              locationAsset={activeRegionAsset}
              hotspots={activeRegionHotspots}
              isHotspotEditMode={isHotspotEditMode}
              onToggleHotspotEditMode={() => setIsHotspotEditMode((v) => !v)}
              onSaveHotspots={handleSaveHotspots}
              onResetHotspots={handleResetHotspots}
              getRegionStatus={getRegionStatus}
              onOpenAssetUploadForSlot={(slotId) => handleOpenLocationAssetManager(slotId)}
              onBackToWorldMap={() => navigateToScreen('WORLD_SELECT')}
              onTravelRegion={enterRegionIllustration}
              onEnterRpgTilemap={() => {
                soundEngine.startBgm();
                runWithScreenFade(() => {
                  setSave((prev) => ({
                    ...prev,
                    currentMap: activeRegionId,
                    lastPlayView: 'PLAYING',
                  }));
                  setScreen('PLAYING');
                }, 260);
              }}
              onLaunchQuestion={launchQuestionByIdOrRef}
              onOpenLearningCategory={(cat) => {
                soundEngine.playBookOpen();
                if (cat) {
                  setSave((prev) => ({
                    ...prev,
                    readCategories: { ...prev.readCategories, [cat]: true },
                  }));
                }
                setLearningInitialCategory(cat);
                setIsLearningOpen(true);
              }}
              onTalkNpcId={handleTalkNpcById}
              onVisitCastleRoom={handleEnterCastleRoom}
              onDiscoverBook={handleDiscoverBookById}
              onMarkRegionExplored={handleMarkRegionExplored}
              onOpenJournal={() => setIsJournalOpen(true)}
              onOpenInventory={() => setIsInventoryOpen(true)}
              onOpenProgress={() => setIsProgressOpen(true)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenGuide={() => setIsGuideOpen(true)}
              onTriggerVictory={() => {
                soundEngine.playVictoryFanfare();
                navigateToScreen('VICTORY');
              }}
            />

            {/* Side-Activity / Discovery Toast Notification in Mod A */}
            {toastBanner && (
              <div className="pointer-events-none absolute top-14 left-1/2 -translate-x-1/2 z-40 px-4">
                <div className="bg-[#1e123b] border-3 border-[#facc15] px-4 py-2 shadow-lg flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#fde047] shrink-0" />
                  <span className="font-pixel font-bold text-xs sm:text-sm text-[#fef9c3] whitespace-nowrap">
                    {toastBanner}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5B. MOD B: PENEROKAAN RPG 2D TILEMAP (Bahagian 9) */}
        {screen === 'PLAYING' && (
          <div className="relative w-full h-full">
            {/* Isolated 60fps 2D Pixel Art World Canvas */}
            <RpgCanvas
              mapId={save.currentMap}
              initialTileX={save.playerTileX}
              initialTileY={save.playerTileY}
              avatarId={save.avatarId}
              completedQuestions={save.completedQuestions}
              foundHiddenBooks={save.foundHiddenBooks}
              readCategories={save.readCategories}
              isPausedOrModalOpen={anyModalOpen}
              onPlayerTileChange={(tx, ty) =>
                setSave((prev) => ({ ...prev, playerTileX: tx, playerTileY: ty }))
              }
              onEnterCastleRoom={handleEnterCastleRoom}
              onInteractNpc={handleInteractNpc}
              onInteractQuestion={handleInteractQuestion}
              onInteractSign={handleInteractSign}
              onInteractProp={handleInteractProp}
              onUsePortal={handleUsePortal}
            />

            {/* Side-Activity / Discovery Toast Notification */}
            {toastBanner && (
              <div className="pointer-events-none absolute top-16 left-1/2 -translate-x-1/2 z-30 px-4">
                <div className="bg-[#1e123b] border-3 border-[#facc15] px-4 py-2 shadow-lg flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#fde047] shrink-0" />
                  <span className="font-pixel font-bold text-xs sm:text-sm text-[#fef9c3] whitespace-nowrap">
                    {toastBanner}
                  </span>
                </div>
              </div>
            )}

            {/* TOP HUD OVERLAY */}
            <div
              className={`pointer-events-none absolute top-0 inset-x-0 z-20 ${
                isMobileDevice ? 'p-1.5 safe-area-x' : 'p-2 sm:p-3'
              } flex flex-wrap items-start justify-between gap-1.5 sm:gap-2`}
            >
              {/* Top-Left: Avatar + Name + Level + Progress Bar */}
              <div
                className={`pointer-events-auto flex items-center gap-2 bg-[#241747] border-2 sm:border-3 border-[#f6c445] ${
                  isMobileDevice ? 'px-2 py-1' : 'px-2.5 py-1.5'
                } shadow-md`}
              >
                <div
                  className={`${
                    isMobileDevice ? 'w-8 h-8' : 'w-11 h-11'
                  } bg-[#140d2b] border-2 border-[#facc15] flex items-center justify-center overflow-hidden shrink-0`}
                >
                  <PixelPortrait
                    mode="avatar"
                    avatarId={save.avatarId}
                    anim="idle"
                    size={isMobileDevice ? 30 : 42}
                  />
                </div>
                <div className={isMobileDevice ? 'min-w-[88px]' : 'min-w-[110px] sm:min-w-[140px]'}>
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="font-pixel font-bold text-[11px] sm:text-sm text-white truncate max-w-[90px] sm:max-w-[105px]">
                      {save.playerName}
                    </span>
                    <span className="font-mono-num font-bold text-[10px] sm:text-xs text-[#fde047]">
                      Lv.{playerLevel}
                    </span>
                  </div>
                  <div className="mt-0.5 w-full h-2 bg-[#120b24] border border-[#6d28d9] overflow-hidden">
                    <div
                      style={{ width: `${Math.round((crystalsCount / 30) * 100)}%` }}
                      className="h-full bg-gradient-to-r from-[#22c55e] to-[#4ade80] transition-all duration-300"
                    />
                  </div>
                </div>
              </div>

              {/* Top-Center: Markah + Kristal Kata X / 30 */}
              <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-3">
                <div
                  className={`bg-[#241747] border-2 sm:border-3 border-[#f6c445] ${
                    isMobileDevice ? 'px-2 py-1' : 'px-3 py-1.5'
                  } flex items-center gap-1.5 shadow-md`}
                >
                  <span className="text-[#fde047] font-pixel text-sm leading-none">★</span>
                  <span className="font-pixel font-bold text-[11px] sm:text-sm text-white whitespace-nowrap">
                    {!isMobileDevice && 'Markah: '}
                    <span className="font-mono-num text-[#fde047]">{save.score}</span>
                  </span>
                </div>

                <div
                  className={`bg-[#241747] border-2 sm:border-3 border-[#f6c445] ${
                    isMobileDevice ? 'px-2 py-1' : 'px-3 py-1.5'
                  } flex items-center gap-1.5 shadow-md`}
                >
                  <PixelPortrait
                    mode="crystal"
                    lit={crystalsCount > 0}
                    size={isMobileDevice ? 16 : 20}
                  />
                  <span className="font-pixel font-bold text-[11px] sm:text-sm text-white whitespace-nowrap">
                    {!isMobileDevice && 'Kristal Kata: '}
                    <span className="font-mono-num text-[#7dd3fc]">{crystalsCount}/30</span>
                  </span>
                </div>
              </div>

              {/* Top-Right: Switch back to Mod A (Ilustrasi) + Library + Sound + Settings */}
              <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playButtonClick();
                    runWithScreenFade(() => {
                      setSave((prev) => ({ ...prev, lastPlayView: 'LOCATION_VIEW' }));
                      setScreen('LOCATION_VIEW');
                    }, 260);
                  }}
                  title="Tukar ke Mod A: Ilustrasi Interaktif Lokasi"
                  className={`${
                    isMobileDevice ? 'px-2 h-8 text-[10px]' : 'px-3 h-10 text-xs'
                  } pixel-btn-gold font-pixel font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap`}
                >
                  <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span>{isMobileDevice ? 'ILUSTRASI' : 'MOD ILUSTRASI'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playBookOpen();
                    setLearningInitialCategory(null);
                    setIsLearningOpen(true);
                  }}
                  title="Bahan Pembelajaran"
                  className={`${
                    isMobileDevice ? 'w-8 h-8' : 'w-10 h-10'
                  } pixel-btn-purple flex items-center justify-center cursor-pointer`}
                  aria-label="Bahan Pembelajaran"
                >
                  <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playButtonClick();
                    handleToggleSound();
                  }}
                  title={save.soundEnabled ? 'Bunyi Hidup' : 'Bunyi Mati'}
                  className={`${
                    isMobileDevice ? 'w-8 h-8' : 'w-10 h-10'
                  } pixel-btn-purple flex items-center justify-center cursor-pointer`}
                  aria-label={save.soundEnabled ? 'Matikan Bunyi' : 'Hidupkan Bunyi'}
                >
                  {save.soundEnabled ? (
                    <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playButtonClick();
                    setIsSettingsOpen(true);
                  }}
                  title="Menu & Tetapan (ESC)"
                  className={`${
                    isMobileDevice ? 'w-8 h-8' : 'w-10 h-10'
                  } pixel-btn-purple flex items-center justify-center cursor-pointer`}
                  aria-label="Menu Tetapan"
                >
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            {/* RIGHT SIDE QUEST & LOCATION SCROLL */}
            {!isLandscapePhone && (
              <div className="hidden sm:block pointer-events-auto absolute top-18 right-3 z-20 w-60">
                <div className="pixel-panel-parchment p-3">
                  <button
                    type="button"
                    onClick={() => setQuestTrackerExpanded((v) => !v)}
                    className="w-full flex items-center justify-between gap-2 font-pixel font-bold text-sm text-[#7c2d12] cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-[#dc2626]" />
                      <span>Misi & Lokasi</span>
                    </span>
                    {questTrackerExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {questTrackerExpanded && (
                    <div className="mt-2 pt-2 border-t border-[#d6c096] space-y-2">
                      <div className="text-[11px] font-extrabold text-[#581c87]">
                        📍 {WORLD_MAPS[save.currentMap].name}
                      </div>
                      <p className="text-xs font-semibold text-[#291509] leading-snug">
                        {activeObjectiveText}
                      </p>
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.playButtonClick();
                            setIsMapOpen(true);
                          }}
                          className="py-1.5 px-2 pixel-btn-blue font-pixel font-bold text-[11px] cursor-pointer"
                        >
                          PETA DUNIA
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.playButtonClick();
                            setIsSignpostOpen(true);
                          }}
                          className="py-1.5 px-2 pixel-btn-gold font-pixel font-bold text-[11px] cursor-pointer"
                        >
                          PAPAN ARAH
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* BOTTOM PIXEL NAVIGATION BAR */}
            <BottomGameNavBar
              compactOverlay
              ultraCompact={isMobileDevice}
              crystalsCount={crystalsCount}
              onOpenWorldMap={() => setIsMapOpen(true)}
              onOpenJournal={() => setIsJournalOpen(true)}
              onOpenInventory={() => setIsInventoryOpen(true)}
              onOpenProgress={() => setIsProgressOpen(true)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenGuide={() => setIsGuideOpen(true)}
            />
          </div>
        )}

        {/* 6. SKRIN KEMENANGAN */}
        {screen === 'VICTORY' && (
          <VictoryScreen
            logoConfig={logoConfig}
            avatarId={save.avatarId}
            playerName={save.playerName}
            score={save.score}
            crystalsCount={crystalsCount}
            onBackToWorldMap={() => navigateToScreen('WORLD_SELECT')}
            onOpenJournal={() => setIsJournalOpen(true)}
            onOpenCredits={() => setIsCreditsOpen(true)}
            onPlayAgain={() => {
              localStorage.removeItem(STORAGE_KEY);
              setSave((prev) => ({
                ...DEFAULT_SAVE,
                soundEnabled: prev.soundEnabled,
                musicEnabled: prev.musicEnabled,
              }));
              navigateToScreen('AVATAR_SELECT');
            }}
            onBackToMenu={() => navigateToScreen('TITLE')}
          />
        )}
      </div>

      {/* SHARED MODALS */}
      <NpcDialogModal
        dialogue={activeDialogue}
        sign={activeSign}
        onClose={() => {
          setActiveDialogue(null);
          setActiveSign(null);
        }}
        onSelectOptionAction={handleNpcDialogueAction}
      />

      <SignpostTravelModal
        isOpen={isSignpostOpen}
        currentMap={save.currentMap}
        getRegionStatus={getRegionStatus}
        onSelectRegion={(regionId) => {
          setIsSignpostOpen(false);
          if (screen === 'PLAYING') {
            travelToMap(regionId);
          } else {
            enterRegionIllustration(regionId);
          }
        }}
        onOpenWorldMap={() => {
          setIsSignpostOpen(false);
          setIsMapOpen(true);
        }}
        onClose={() => setIsSignpostOpen(false)}
      />

      {activeQuestion && (
        <QuizModal
          question={activeQuestion}
          avatarId={save.avatarId}
          existingRecord={save.completedQuestions[activeQuestion.id]}
          customImageRecord={questionImages[formatQuestionSlotId(activeQuestion.id)]}
          isDeveloperMode={isDeveloperUnlocked}
          editRevision={questionEditRevision}
          missionPrerequisiteLocked={missionPrerequisiteLocked}
          lockedByPreviousQuestion={lockedByPreviousQuestion}
          onOpenQuickEdit={handleOpenQuickEditForQuestion}
          onRecordQuestionAttempt={handleRecordQuestionAttempt}
          onCompleteQuestion={handleCompleteQuestion}
          onClose={() => {
            setQuickEditQuestion(null);
            setActiveQuestion(null);
          }}
        />
      )}

      {isDeveloperUnlocked && quickEditQuestion && (
        <QuickEditQuestionModal
          question={quickEditQuestion}
          customImageRecord={questionImages[formatQuestionSlotId(quickEditQuestion.id)]}
          questionStats={effectiveQuestionStats}
          onResetQuestionStat={handleResetQuestionStat}
          onSaveAndReturn={handleSaveQuickEditAndReturn}
          onCancel={() => setQuickEditQuestion(null)}
        />
      )}

      <MissionCompleteModal
        mission={completedMissionCelebration}
        onContinue={handleMissionCelebrationContinue}
      />

      <JournalModal
        isOpen={isJournalOpen}
        logoConfig={logoConfig}
        completedQuestions={save.completedQuestions}
        questionImages={questionImages}
        onClose={() => {
          if (screen === 'TITLE') {
            runWithScreenFade(() => setIsJournalOpen(false));
          } else {
            setIsJournalOpen(false);
          }
        }}
      />

      <LearningModal
        isOpen={isLearningOpen}
        initialCategory={learningInitialCategory}
        readCategories={save.readCategories}
        isOnMainMenu={screen === 'TITLE'}
        onSelectCategory={(cat) => {
          setSave((prev) => ({
            ...prev,
            readCategories: { ...prev.readCategories, [cat]: true },
          }));
        }}
        onClose={() => {
          if (screen === 'TITLE') {
            runWithScreenFade(() => {
              setIsLearningOpen(false);
              setLearningInitialCategory(null);
            });
          } else {
            setIsLearningOpen(false);
            setLearningInitialCategory(null);
          }
        }}
        onStartMission={() => {
          if (screen === 'TITLE') {
            runWithScreenFade(() => {
              setIsLearningOpen(false);
              setLearningInitialCategory(null);
              applyContinueGameDirect();
            });
          } else {
            setIsLearningOpen(false);
            setLearningInitialCategory(null);
          }
        }}
      />

      <InventoryModal
        isOpen={isInventoryOpen}
        crystalsCount={crystalsCount}
        score={save.score}
        playerLevel={playerLevel}
        badges={save.badges}
        explorationBadges={save.explorationBadges}
        foundBooksCount={foundBooksCount}
        visitedRegionsCount={visitedRegionsCount}
        talkedMainNpcsCount={talkedMainNpcsCount}
        readCategoriesCount={readCategoriesCount}
        visitedCastleRoomsCount={visitedCastleRoomsCount}
        completedQuestions={save.completedQuestions}
        onOpenJournal={() => {
          if (screen === 'TITLE') {
            runWithScreenFade(() => {
              setIsInventoryOpen(false);
              setIsJournalOpen(true);
            });
          } else {
            setIsInventoryOpen(false);
            setIsJournalOpen(true);
          }
        }}
        onClose={() => {
          if (screen === 'TITLE') {
            runWithScreenFade(() => setIsInventoryOpen(false));
          } else {
            setIsInventoryOpen(false);
          }
        }}
      />

      <ProgressModal
        isOpen={isProgressOpen}
        playerName={save.playerName}
        avatarId={save.avatarId}
        score={save.score}
        crystalsCount={crystalsCount}
        badges={save.badges}
        explorationBadges={save.explorationBadges}
        completedQuestions={save.completedQuestions}
        getRegionStatus={getRegionStatus}
        onSelectRegion={(regionId) => {
          setIsProgressOpen(false);
          if (screen === 'PLAYING') {
            travelToMap(regionId);
          } else {
            enterRegionIllustration(regionId);
          }
        }}
        onClose={() => setIsProgressOpen(false)}
      />

      <WorldMapModal
        isOpen={isMapOpen}
        mode="modal"
        currentMap={save.currentMap}
        isPlayingMode={screen === 'PLAYING' || screen === 'LOCATION_VIEW'}
        completedQuestions={save.completedQuestions}
        getRegionStatus={getRegionStatus}
        locationAssets={locationAssets}
        worldMapHotspots={worldMapHotspots}
        isHotspotEditMode={isHotspotEditMode}
        onToggleHotspotEditMode={() => setIsHotspotEditMode((v) => !v)}
        onSaveHotspots={handleSaveHotspots}
        onResetHotspots={handleResetHotspots}
        onOpenLocationAssetManager={handleOpenLocationAssetManager}
        onSelectEnterRegion={(regionId) => {
          enterRegionIllustration(regionId);
        }}
        onClose={() => {
          if (screen === 'TITLE') {
            runWithScreenFade(() => setIsMapOpen(false));
          } else {
            setIsMapOpen(false);
          }
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        soundEnabled={save.soundEnabled}
        musicEnabled={save.musicEnabled}
        isPlayingMode={screen === 'PLAYING' || screen === 'LOCATION_VIEW' || screen === 'WORLD_SELECT'}
        isDeveloperUnlocked={isDeveloperUnlocked}
        uploadedImagesCount={Object.keys(questionImages).length}
        editedQuestionsCount={Object.keys(questionOverrides).length}
        isHotspotEditMode={isHotspotEditMode}
        onUnlockDeveloperMode={handleUnlockDeveloperMode}
        onLockDeveloperMode={handleLockDeveloperMode}
        onToggleSound={handleToggleSound}
        onToggleMusic={handleToggleMusic}
        onOpenQuestionImageManager={() => setIsQuestionImageManagerOpen(true)}
        onOpenLocationAssetManager={() => handleOpenLocationAssetManager(null)}
        onOpenLogoManager={() => setIsLogoManagerOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenCredits={() => setIsCreditsOpen(true)}
        onToggleHotspotEditMode={() => setIsHotspotEditMode((v) => !v)}
        onReturnToTitle={() => navigateToScreen('TITLE')}
        onResetAllProgress={handleResetAllProgress}
        onClose={() => {
          if (screen === 'TITLE') {
            runWithScreenFade(() => setIsSettingsOpen(false));
          } else {
            setIsSettingsOpen(false);
          }
        }}
      />

      <QuestionImageManagerModal
        isOpen={isQuestionImageManagerOpen}
        isDeveloperUnlocked={isDeveloperUnlocked}
        questionImages={questionImages}
        onUnlockDeveloperMode={handleUnlockDeveloperMode}
        onLockDeveloperMode={handleLockDeveloperMode}
        onSaveQuestionImage={handleSaveQuestionImage}
        onDeleteQuestionImage={handleDeleteQuestionImage}
        onClose={() => setIsQuestionImageManagerOpen(false)}
      />

      <LocationAssetManagerModal
        isOpen={isLocationAssetManagerOpen}
        initialFocusSlot={assetManagerFocusSlot}
        locationAssets={locationAssets}
        onSaveLocationAsset={handleSaveLocationAsset}
        onResetLocationAsset={handleResetLocationAsset}
        onClose={() => setIsLocationAssetManagerOpen(false)}
      />

      <LogoManagerModal
        isOpen={isLogoManagerOpen}
        logoConfig={logoConfig}
        onSaveLogoFile={handleSaveLogoFile}
        onChangeDisplayMode={handleChangeLogoDisplayMode}
        onResetToOfficialLogo={handleResetToOfficialLogo}
        onSetPlaceholderMode={handleSetLogoPlaceholderMode}
        onClose={() => setIsLogoManagerOpen(false)}
      />

      <GuideModal
        isOpen={isGuideOpen}
        logoConfig={logoConfig}
        onClose={() => setIsGuideOpen(false)}
      />

      <CreditsModal
        isOpen={isCreditsOpen}
        logoConfig={logoConfig}
        onClose={() => setIsCreditsOpen(false)}
      />

      {/* Real Asset Location Loading Overlay (Section 5) */}
      <LocationLoadingOverlay
        isOpen={locationLoadingState.isOpen}
        locationName={locationLoadingState.locationName}
        progressPercent={locationLoadingState.progress}
        logoConfig={logoConfig}
      />

      {/* Unified Top-Level Screen & Modal Transition Veil (~300ms Fade-Out -> Action -> Fade-In) */}
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed inset-0 z-70 bg-[#0d0a1f] transition-opacity duration-300 ease-in-out motion-reduce:transition-none ${
          isScreenFading ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
