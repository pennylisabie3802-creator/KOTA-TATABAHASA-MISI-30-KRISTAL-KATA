export type ScreenMode =
  | 'SPLASH'
  | 'TITLE'
  | 'AVATAR_SELECT'
  | 'INTRO_STORY'
  | 'WORLD_SELECT'
  | 'LOCATION_VIEW'
  | 'PLAYING'
  | 'VICTORY';

export type AvatarId = 'wira_bahasa' | 'wira_tatabahasa';

export type AvatarAnimState =
  | 'idle'
  | 'walk'
  | 'interact'
  | 'happy'
  | 'reward';

export type Direction = 'down' | 'up' | 'left' | 'right';

// 8 Lokasi Utama Kerajaan Kota Tatabahasa + Ruang Dalaman Istana Kristal Kata
export type RegionId =
  | 'taman_sakura'
  | 'istana_luar'
  | 'perpustakaan_ajaib'
  | 'hutan_misteri'
  | 'kampung_tatabahasa'
  | 'pasar_perkataan'
  | 'menara_media'
  | 'benteng_wira';

export type MapId = RegionId | 'istana_dalam';

export type ExplorationStatus =
  | 'BELUM_DILAWATI'
  | 'SEDANG_DITEROKAI'
  | 'TELAH_DITEROKAI';

export type QuestionType = 'mcq' | 'fill';

export type ObjectSpriteKind =
  | 'notice_board'
  | 'document'
  | 'machine_sign'
  | 'magic_book'
  | 'scroll'
  | 'signpost'
  | 'trolley_sign'
  | 'food_menu'
  | 'donation_box'
  | 'stage_banner'
  | 'newspaper'
  | 'crystal_pedestal';

export interface QuizOption {
  label: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface QuizQuestion {
  id: number; // 1..30
  mission: 1 | 2 | 3;
  mapId: RegionId;
  title: string;
  type: QuestionType;
  objectKind: ObjectSpriteKind;
  objectName: string;
  kesalahanAsal: string;
  situasi: string;
  arahan: string;
  options?: QuizOption[];
  correctOption?: 'A' | 'B' | 'C' | 'D';
  acceptedAnswers?: string[];
  pembetulanPenuh: string;
  justifikasi: string;
  petunjuk: string;
  tileX: number;
  tileY: number;
}

export interface QuestionEditableFields {
  title: string;
  objectName: string;
  type: QuestionType;
  situasi: string;
  arahan: string;
  options?: QuizOption[];
  correctOption?: 'A' | 'B' | 'C' | 'D';
  acceptedAnswers?: string[];
  petunjuk: string;
  kesalahanAsal: string;
  pembetulanPenuh: string;
  justifikasi: string;
  updatedAt?: string;
}

export interface QuestionAttemptStat {
  questionId: number;
  totalAttempts: number;
  wrongAttempts: number;
  correctAttempts: number;
  optionSelections: Record<'A' | 'B' | 'C' | 'D', number>;
  wrongOptionSelections: Record<'A' | 'B' | 'C' | 'D', number>;
  updatedAt: string;
}

export interface JournalRecord {
  questionId: number;
  mission: 1 | 2 | 3;
  completedAt: string;
  attempts: number;
  usedHint: boolean;
  pointsEarned: number;
  revealedAfterTwoFails: boolean;
}

export type BadgeId =
  | 'lencana_detektif'
  | 'lencana_pemburu'
  | 'lencana_wira';

export type ExplorationBadgeId =
  | 'lencana_pencari_buku'
  | 'lencana_penjelajah'
  | 'lencana_sahabat_bahasa'
  | 'lencana_pengumpul_ilmu'
  | 'lencana_peneroka_istana';

export type CastleRoomId =
  | 'dewan_utama'
  | 'bilik_kristal'
  | 'perpustakaan_diraja'
  | 'bilik_peta'
  | 'dewan_wira';

export type LibraryCategoryId =
  | 'ejaan'
  | 'kata_sendi_nama'
  | 'imbuhan'
  | 'kata_majmuk'
  | 'kata_ganda'
  | 'ayat_perintah'
  | 'struktur_ayat';

export interface SaveGameData {
  hasStarted: boolean;
  playerName: string;
  avatarId: AvatarId;
  currentMap: MapId;
  previousMap: MapId;
  lastPlayView?: 'LOCATION_VIEW' | 'PLAYING';
  playerTileX: number;
  playerTileY: number;
  score: number;
  completedQuestions: Record<number, JournalRecord>;
  badges: BadgeId[];
  explorationBadges: ExplorationBadgeId[];
  visitedMaps: Record<string, boolean>;
  fullyExploredMaps: Record<string, boolean>;
  foundHiddenBooks: Record<string, boolean>;
  talkedToMainNpcs: Record<string, boolean>;
  readCategories: Record<string, boolean>;
  visitedCastleRooms: Record<string, boolean>;
  talkedToMentors: Record<string, boolean>;
  soundEnabled: boolean;
  musicEnabled: boolean;
}

export type NpcSpriteKind =
  | 'owl'
  | 'cikgu_salmah'
  | 'encik_hakim'
  | 'profesor_bahasa'
  | 'detektif_muda'
  | 'pustakawan'
  | 'peniaga_mi'
  | 'peniaga_buku'
  | 'editor_media'
  | 'pengawal_istana'
  | 'peri_perkataan'
  | 'ketua_kampung'
  | 'pak_cik_rahman';

export interface NpcDialogueOption {
  id: string;
  label: string;
  responsePages: string[];
  action?:
    | 'OPEN_LEARNING'
    | 'OPEN_JOURNAL'
    | 'OPEN_MAP'
    | 'OPEN_SIGNPOST'
    | 'ENTER_ISTANA_DALAM'
    | 'GO_TAMAN_SAKURA'
    | 'GO_PASAR_PERKATAAN'
    | 'GO_MENARA_MEDIA'
    | 'GO_BENTENG_WIRA';
}

export interface DynamicNpcDialogueResult {
  npcId: string;
  npcName: string;
  npcRole: string;
  spriteKind: NpcSpriteKind;
  moodBadge: string;
  greetingPages: string[];
  options: NpcDialogueOption[];
}

export interface MapNpc {
  id: string;
  mainNpcKey?: string; // Used for Aktiviti Sampingan 3: Sahabat Bahasa
  name: string;
  role: string;
  spriteKind: NpcSpriteKind;
  tileX: number;
  tileY: number;
  isMentor?: boolean;
}

export interface MapPortal {
  id: string;
  label: string;
  tileX: number;
  tileY: number;
  widthTiles: number;
  heightTiles: number;
  targetMap: MapId;
  targetX: number;
  targetY: number;
  isVictoryGate?: boolean;
}

export interface MapSign {
  id: string;
  title: string;
  lines: string[];
  tileX: number;
  tileY: number;
  isTravelSignpost?: boolean; // Opens "KE MANA KAMU MAHU PERGI?"
}

export type InteractivePropKind =
  | 'fountain_info'
  | 'bench_note'
  | 'world_map_board'
  | 'learning_book'
  | 'hidden_magic_book'
  | 'library_shelf'
  | 'word_class_stone'
  | 'crystal_slot'
  | 'printing_press'
  | 'village_notice';

export interface MapInteractiveProp {
  id: string;
  kind: InteractivePropKind;
  label: string;
  tileX: number;
  tileY: number;
  hiddenBookId?: string;
  libraryCategory?: LibraryCategoryId;
  crystalQuestionId?: number; // 1..30 in Bilik Kristal
  title?: string;
  lines?: string[];
}

export type QuestionImageSlotId =
  | 'question_01'
  | 'question_02'
  | 'question_03'
  | 'question_04'
  | 'question_05'
  | 'question_06'
  | 'question_07'
  | 'question_08'
  | 'question_09'
  | 'question_10'
  | 'question_11'
  | 'question_12'
  | 'question_13'
  | 'question_14'
  | 'question_15'
  | 'question_16'
  | 'question_17'
  | 'question_18'
  | 'question_19'
  | 'question_20'
  | 'question_21'
  | 'question_22'
  | 'question_23'
  | 'question_24'
  | 'question_25'
  | 'question_26'
  | 'question_27'
  | 'question_28'
  | 'question_29'
  | 'question_30';

export interface QuestionImageRecord {
  slotId: QuestionImageSlotId;
  questionId: number;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  updatedAt: string;
  imageUrl: string;
  originalImageUrl?: string;
  thumbnailUrl?: string;
  naturalWidth?: number;
  naturalHeight?: number;
}

// 9 Slot Aset Ilustrasi Pixel Art 2D (Peta Dunia + 8 Lokasi Pengembaraan)
export type LocationAssetSlotId =
  | 'slot_01_peta_dunia'
  | 'slot_02_taman_sakura'
  | 'slot_03_istana_kristal'
  | 'slot_04_perpustakaan_ajaib'
  | 'slot_05_hutan_misteri'
  | 'slot_06_kampung_tatabahasa'
  | 'slot_07_pasar_perkataan'
  | 'slot_08_menara_media'
  | 'slot_09_benteng_wira';

export interface LocationAssetRecord {
  slotId: LocationAssetSlotId;
  slotNumber: number;
  label: string;
  regionId: RegionId | null;
  imageUrl: string;
  fallbackUrl: string;
  isCustomUploaded: boolean;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  updatedAt?: string;
}

export type HotspotScopeId = 'world_map' | RegionId;

export interface HotspotRect {
  id: string;
  label: string;
  subtitle?: string;
  left: number; // percentage 0..100
  top: number; // percentage 0..100
  width: number; // percentage 1..100
  height: number; // percentage 1..100
  glowVariant?: 'gold' | 'purple' | 'wood' | 'blue' | 'icon';
  isSceneElement?: boolean; // true for optional NPC/prop in scene, false for wooden menu button / world region
}

export type LogoDisplayMode = 'original' | 'transparent';

export interface GameLogoSlotInfo {
  variant: LogoDisplayMode;
  imageUrl: string;
  isCustomUploaded: boolean;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  updatedAt?: string;
}

export interface GameLogoConfig {
  assetId: 'logo-kota-tatabahasa';
  displayMode: LogoDisplayMode;
  isPlaceholderMode: boolean;
  original: GameLogoSlotInfo;
  transparent: GameLogoSlotInfo | null;
}



