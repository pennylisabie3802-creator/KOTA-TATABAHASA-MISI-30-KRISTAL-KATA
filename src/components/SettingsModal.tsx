import React, { useEffect, useState } from 'react';
import {
  Award,
  BookOpen,
  Edit3,
  Home,
  ImagePlus,
  Keyboard,
  Lock,
  Map as MapIcon,
  Maximize2,
  Minimize2,
  Music,
  RotateCcw,
  Settings,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface SettingsModalProps {
  isOpen: boolean;
  soundEnabled: boolean;
  musicEnabled: boolean;
  isPlayingMode: boolean;
  isDeveloperUnlocked: boolean;
  uploadedImagesCount: number;
  editedQuestionsCount?: number;
  isHotspotEditMode?: boolean;
  onUnlockDeveloperMode?: () => void;
  onLockDeveloperMode?: () => void;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onOpenQuestionImageManager: () => void;
  onOpenLocationAssetManager?: () => void;
  onOpenLogoManager?: () => void;
  onOpenGuide?: () => void;
  onOpenCredits?: () => void;
  onToggleHotspotEditMode?: () => void;
  onReturnToTitle: () => void;
  onResetAllProgress: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  soundEnabled,
  musicEnabled,
  isPlayingMode,
  isDeveloperUnlocked,
  uploadedImagesCount,
  editedQuestionsCount = 0,
  isHotspotEditMode = false,
  onUnlockDeveloperMode,
  onLockDeveloperMode,
  onToggleSound,
  onToggleMusic,
  onOpenQuestionImageManager,
  onOpenLocationAssetManager,
  onOpenLogoManager,
  onOpenGuide,
  onOpenCredits,
  onToggleHotspotEditMode,
  onReturnToTitle,
  onResetAllProgress,
  onClose,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);
  const [showDevCodeForm, setShowDevCodeForm] = useState(false);
  const [devCodeInput, setDevCodeInput] = useState('');
  const [devCodeError, setDevCodeError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() =>
    typeof document !== 'undefined' ? Boolean(document.fullscreenElement) : false
  );
  const [fullscreenNote, setFullscreenNote] = useState<string | null>(null);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
      setFullscreenNote(null);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  if (!isOpen) return null;

  const handleToggleFullscreen = async () => {
    soundEngine.playButtonClick();
    setFullscreenNote(null);
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      setFullscreenNote(
        'Paparan skrin penuh dihadkan oleh tetingkap pratonton pelayar semasa.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg pixel-panel-purple p-5 sm:p-6 space-y-4 my-auto">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#5b3ea8]">
          <div className="flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-[#fde047]" />
            <h2 className="font-pixel font-bold text-2xl text-[#fde047]">TETAPAN & KAWALAN</h2>
          </div>
          <button
            type="button"
            onClick={() => {
              soundEngine.playButtonClick();
              setConfirmReset(false);
              onClose();
            }}
            className="w-9 h-9 pixel-btn-purple flex items-center justify-center cursor-pointer"
            aria-label="Tutup Tetapan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Audio & Display Toggles */}
        <div className="space-y-2.5">
          <div className="p-3 bg-[#1d1238] border-2 border-[#5b3ea8] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              {soundEnabled ? (
                <Volume2 className="w-5 h-5 text-[#34d399] shrink-0" />
              ) : (
                <VolumeX className="w-5 h-5 text-[#f87171] shrink-0" />
              )}
              <span className="font-bold text-sm text-white">Kesan Bunyi & Audio Utama</span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!soundEnabled) {
                  onToggleSound();
                  window.setTimeout(() => soundEngine.playButtonClick(), 25);
                } else {
                  soundEngine.playButtonClick();
                  window.setTimeout(() => onToggleSound(), 50);
                }
              }}
              className={`px-4 py-1.5 font-pixel font-bold text-xs cursor-pointer whitespace-nowrap ${
                soundEnabled ? 'pixel-btn-emerald' : 'pixel-btn-wood'
              }`}
            >
              {soundEnabled ? 'BUNYI HIDUP' : 'BUNYI MATI'}
            </button>
          </div>

          <div className="p-3 bg-[#1d1238] border-2 border-[#5b3ea8] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <Music className="w-5 h-5 text-[#c084fc] shrink-0" />
              <span className="font-bold text-sm text-white">Muzik Latar Fantasi 8-Bit</span>
            </div>
            <button
              type="button"
              onClick={() => {
                soundEngine.playButtonClick();
                onToggleMusic();
              }}
              className={`px-4 py-1.5 font-pixel font-bold text-xs cursor-pointer whitespace-nowrap ${
                musicEnabled && soundEnabled ? 'pixel-btn-emerald' : 'pixel-btn-wood'
              }`}
            >
              {musicEnabled && soundEnabled ? 'MUZIK HIDUP' : 'MUZIK MATI'}
            </button>
          </div>

          <div className="p-3 bg-[#1d1238] border-2 border-[#5b3ea8] space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                {isFullscreen ? (
                  <Minimize2 className="w-5 h-5 text-[#7dd3fc] shrink-0" />
                ) : (
                  <Maximize2 className="w-5 h-5 text-[#7dd3fc] shrink-0" />
                )}
                <span className="font-bold text-sm text-white">Mod Skrin Penuh</span>
              </div>
              <button
                type="button"
                onClick={handleToggleFullscreen}
                className={`px-4 py-1.5 font-pixel font-bold text-xs cursor-pointer whitespace-nowrap ${
                  isFullscreen ? 'pixel-btn-emerald' : 'pixel-btn-blue'
                }`}
              >
                {isFullscreen ? 'KELUAR SKRIN PENUH' : 'SKRIN PENUH'}
              </button>
            </div>
            {fullscreenNote && (
              <p className="text-[11px] text-[#fde68a] leading-snug">{fullscreenNote}</p>
            )}
          </div>
        </div>

        {/* Controls Reference */}
        <div className="p-3.5 pixel-panel-parchment space-y-1.5 text-xs sm:text-sm">
          <div className="font-pixel font-bold text-sm text-[#581c87] flex items-center gap-1.5">
            <Keyboard className="w-4 h-4" /> Panduan Kawalan Permainan:
          </div>
          <p className="font-medium">
            <strong>Klik / Sentuh Peta (Click-to-Move):</strong> Tekan mana-mana laluan pada peta
            untuk bergerak secara automatik mengelakkan halangan. Tekan <strong>NPC</strong> untuk
            berbual atau <strong>Pintu</strong> untuk pilihan <strong>MASUK</strong>.
          </p>
          <p className="font-medium">
            <strong>Kawalan Manual:</strong> Kekunci <strong>W, A, S, D</strong>,{' '}
            <strong>Anak Panah</strong>, atau <strong>Kayu Ria Maya</strong> membatalkan pergerakan
            automatik serta-merta. Tekan <strong>E</strong> / <strong>Ruang</strong> untuk
            menyiasat.
          </p>
        </div>

        {/* Quick Access: Panduan Pengembaraan & Kredit Permainan */}
        {(onOpenGuide || onOpenCredits) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {onOpenGuide && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playButtonClick();
                  onClose();
                  onOpenGuide();
                }}
                className="py-2.5 px-3 pixel-btn-gold font-pixel font-bold text-xs flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <BookOpen className="w-4 h-4 shrink-0" />
                <span>PANDUAN PENGEMBARAAN</span>
              </button>
            )}

            {onOpenCredits && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playButtonClick();
                  onClose();
                  onOpenCredits();
                }}
                className="py-2.5 px-3 pixel-btn-blue font-pixel font-bold text-xs flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Award className="w-4 h-4 shrink-0" />
                <span>KREDIT PERMAINAN</span>
              </button>
            )}
          </div>
        )}

        {/* MOD PEMBANGUN / GURU — QUICK EDIT SOALAN, LOGO RASMI, ASET LOKASI, HOTSPOT & GAMBAR SOALAN */}
        <div className="p-3.5 bg-[#160d2e] border-2 border-[#facc15] space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {isDeveloperUnlocked ? (
                <ShieldCheck className="w-4 h-4 text-[#34d399]" />
              ) : (
                <Lock className="w-4 h-4 text-[#fde047]" />
              )}
              <span className="font-pixel font-bold text-sm text-[#fde047]">
                {isDeveloperUnlocked ? 'MOD PEMBANGUN (AKTIF)' : 'MOD PEMBANGUN / GURU'}
              </span>
            </div>
            {isDeveloperUnlocked && (
              <span className="font-mono-num text-xs font-bold text-[#7dd3fc]">
                Suntingan: {editedQuestionsCount}/30 · Gambar: {uploadedImagesCount}/30
              </span>
            )}
          </div>

          {!isDeveloperUnlocked ? (
            !showDevCodeForm ? (
              <div className="space-y-2">
                <p className="text-xs text-[#cbd5e1] leading-snug">
                  Khas untuk pembangun & guru bagi mengaktifkan butang Quick Edit soalan dan
                  pengurusan aset permainan.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playButtonClick();
                    setDevCodeError(null);
                    setDevCodeInput('');
                    setShowDevCodeForm(true);
                  }}
                  className="w-full py-2 px-3 pixel-btn-purple font-pixel font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span>AKTIFKAN MOD PEMBANGUN</span>
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const norm = devCodeInput.trim().toUpperCase();
                  if (norm === 'GURU' || norm === '1234' || norm === 'DEV') {
                    soundEngine.playMissionUnlock();
                    setDevCodeError(null);
                    setDevCodeInput('');
                    setShowDevCodeForm(false);
                    onUnlockDeveloperMode?.();
                  } else {
                    soundEngine.playWrong();
                    setDevCodeError('Kod akses tidak sah. Gunakan kod pembangun: GURU');
                  }
                }}
                className="space-y-2 pt-1"
              >
                <label className="block font-pixel text-xs text-[#fde047]">
                  MASUKKAN KOD PEMBANGUN / GURU (Kod: GURU):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    autoFocus
                    value={devCodeInput}
                    onChange={(e) => setDevCodeInput(e.target.value)}
                    placeholder="Taip GURU..."
                    className="flex-1 px-3 py-1.5 bg-[#0f0822] border-2 border-[#a78bfa] text-white font-mono-num font-bold text-xs focus:outline-none focus:border-[#fde047]"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 pixel-btn-emerald font-pixel font-bold text-xs cursor-pointer whitespace-nowrap"
                  >
                    BUKA
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playButtonClick();
                      setShowDevCodeForm(false);
                      setDevCodeError(null);
                    }}
                    className="px-3 py-1.5 pixel-btn-purple font-pixel font-bold text-xs cursor-pointer"
                  >
                    BATAL
                  </button>
                </div>
                {devCodeError && (
                  <p className="text-xs font-bold text-[#fca5a5]">{devCodeError}</p>
                )}
              </form>
            )
          ) : (
            <div className="space-y-2">
              <div className="p-2 bg-[#064e3b] border border-[#34d399] text-[11px] font-semibold text-[#d1fae5]">
                Butang <strong>“EDIT SOALAN INI”</strong> kini aktif pada semua paparan kuiz untuk
                menguji dan menyunting soalan secara langsung.
              </div>

              {onOpenLogoManager && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playButtonClick();
                    onClose();
                    onOpenLogoManager();
                  }}
                  className="w-full py-2 px-3 pixel-btn-emerald font-pixel font-bold text-xs flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>MUAT NAIK LOGO PERMAINAN (logo-kota-tatabahasa)</span>
                </button>
              )}

              {onOpenLocationAssetManager && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playButtonClick();
                    onClose();
                    onOpenLocationAssetManager();
                  }}
                  className="w-full py-2 px-3 pixel-btn-gold font-pixel font-bold text-xs flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <MapIcon className="w-4 h-4 shrink-0" />
                  <span>PENGURUSAN ASET GAMBAR LOKASI (9 SLOT)</span>
                </button>
              )}

              {onToggleHotspotEditMode && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playButtonClick();
                    onClose();
                    onToggleHotspotEditMode();
                  }}
                  className={`w-full py-2 px-3 font-pixel font-bold text-xs flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
                    isHotspotEditMode ? 'pixel-btn-emerald' : 'pixel-btn-blue'
                  }`}
                >
                  <Edit3 className="w-4 h-4 shrink-0" />
                  <span>
                    {isHotspotEditMode ? 'MATIKAN MOD EDIT HOTSPOT' : 'AKTIFKAN MOD EDIT HOTSPOT'}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  soundEngine.playButtonClick();
                  onClose();
                  onOpenQuestionImageManager();
                }}
                className="w-full py-2 px-3 pixel-btn-purple font-pixel font-bold text-xs flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <ImagePlus className="w-4 h-4 shrink-0" />
                <span>PENGURUSAN GAMBAR SOALAN (1–30)</span>
              </button>

              {onLockDeveloperMode && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playButtonClick();
                    onLockDeveloperMode();
                  }}
                  className="w-full py-1.5 px-3 bg-[#2a1746] hover:bg-[#3b2161] border border-[#a78bfa] text-[#e9d5ff] font-pixel font-bold text-xs cursor-pointer"
                >
                  KELUAR MOD PEMBANGUN (MOD MURID BIASA)
                </button>
              )}
            </div>
          )}
        </div>

        {/* Navigation & Save Reset */}
        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={() => {
              soundEngine.playButtonClick();
              setConfirmReset(false);
              onClose();
              if (isPlayingMode) {
                onReturnToTitle();
              }
            }}
            className="w-full py-2.5 px-4 pixel-btn-blue font-pixel font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>
              {isPlayingMode ? 'SIMPAN & KEMBALI KE MENU UTAMA' : 'KEMBALI KE MENU UTAMA'}
            </span>
          </button>

          {!confirmReset ? (
            <button
              type="button"
              onClick={() => {
                soundEngine.playButtonClick();
                setConfirmReset(true);
              }}
              className="w-full py-2 px-4 bg-[#3b1224] hover:bg-[#591834] border-2 border-[#f43f5e] text-[#fecdd3] font-pixel font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>PADAM SIMPANAN & MULA BAHARU</span>
            </button>
          ) : (
            <div className="p-3 bg-[#450a0a] border-2 border-[#f87171] space-y-2 text-center">
              <p className="text-xs font-bold text-[#fecaca]">
                Adakah anda pasti mahu memadam semua rekod Kristal Kata dan markah semasa?
              </p>
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playButtonClick();
                    setConfirmReset(false);
                    onResetAllProgress();
                    onClose();
                  }}
                  className="px-4 py-1.5 bg-[#ef4444] text-white font-pixel font-bold text-xs border-2 border-white cursor-pointer"
                >
                  YA, PADAM SEMUA
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="px-4 py-1.5 pixel-btn-purple font-pixel font-bold text-xs cursor-pointer"
                >
                  BATAL
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
