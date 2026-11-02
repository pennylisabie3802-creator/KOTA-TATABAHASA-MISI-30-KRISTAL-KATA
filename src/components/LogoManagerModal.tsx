import React, { useRef, useState } from 'react';
import {
  CheckCircle2,
  ImagePlus,
  Layers,
  RefreshCw,
  Save,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { GameLogoConfig, LogoDisplayMode } from '../types/game';
import { formatBytes, readFileAsDataUrl } from '../utils/questionImageStore';
import { OFFICIAL_LOGO_ASSET_ID, validateLogoFile } from '../utils/gameLogoStore';
import { GameLogo } from './GameLogo';
import { soundEngine } from '../audio/soundEngine';

interface LogoManagerModalProps {
  isOpen: boolean;
  logoConfig: GameLogoConfig;
  onSaveLogoFile: (file: File, variant: LogoDisplayMode) => Promise<void>;
  onChangeDisplayMode: (mode: LogoDisplayMode) => Promise<void>;
  onResetToOfficialLogo: () => Promise<void>;
  onSetPlaceholderMode: () => Promise<void>;
  onClose: () => void;
}

export const LogoManagerModal: React.FC<LogoManagerModalProps> = ({
  isOpen,
  logoConfig,
  onSaveLogoFile,
  onChangeDisplayMode,
  onResetToOfficialLogo,
  onSetPlaceholderMode,
  onClose,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [targetVariant, setTargetVariant] = useState<LogoDisplayMode>(logoConfig.displayMode);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setErrorMsg(null);
    setStatusMsg(null);

    const validationErr = validateLogoFile(file);
    if (validationErr) {
      soundEngine.playWrong();
      setErrorMsg(validationErr);
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      soundEngine.playButtonClick();
      setPendingFile(file);
      setPendingPreviewUrl(dataUrl);
    } catch {
      setErrorMsg('Gagal membaca fail gambar logo yang dipilih.');
    }
  };

  const handleConfirmSave = async () => {
    if (!pendingFile || isSaving) return;
    setIsSaving(true);
    setErrorMsg(null);
    try {
      await onSaveLogoFile(pendingFile, targetVariant);
      soundEngine.playCrystalGain();
      setPendingFile(null);
      setPendingPreviewUrl(null);
      setStatusMsg(
        `Logo berjaya dimuat naik dan disimpan sebagai aset projek (${OFFICIAL_LOGO_ASSET_ID}).`
      );
    } catch (err) {
      soundEngine.playWrong();
      setErrorMsg(
        err instanceof Error ? err.message : 'Gagal menyimpan logo permainan.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSwitchMode = async (mode: LogoDisplayMode) => {
    soundEngine.playButtonClick();
    setTargetVariant(mode);
    setErrorMsg(null);
    await onChangeDisplayMode(mode);
    setStatusMsg(
      mode === 'original'
        ? 'Mod A (Logo Asal Berlatar Biru) telah diaktifkan.'
        : logoConfig.transparent
        ? 'Mod B (Logo Transparan PNG) telah diaktifkan.'
        : 'Mod B dipilih — muat naik fail PNG transparan jika mahu latar belakang lutsinar tanpa merosakkan garisan putih maskot.'
    );
  };

  const previewConfig: GameLogoConfig = pendingPreviewUrl
    ? {
        ...logoConfig,
        displayMode: targetVariant,
        isPlaceholderMode: false,
        original:
          targetVariant === 'original'
            ? {
                variant: 'original',
                imageUrl: pendingPreviewUrl,
                isCustomUploaded: true,
                fileName: pendingFile?.name,
              }
            : logoConfig.original,
        transparent:
          targetVariant === 'transparent'
            ? {
                variant: 'transparent',
                imageUrl: pendingPreviewUrl,
                isCustomUploaded: true,
                fileName: pendingFile?.name,
              }
            : logoConfig.transparent,
      }
    : logoConfig;

  const isLoaded = !logoConfig.isPlaceholderMode;

  return (
    <div className="fixed inset-0 z-60 bg-black/75 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-2xl pixel-panel-purple overflow-hidden my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#231547] border-b-3 border-[#f6c445] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ImagePlus className="w-6 h-6 text-[#fde047] shrink-0" />
            <div>
              <h2 className="font-pixel font-bold text-xl sm:text-2xl text-[#fde047]">
                MUAT NAIK LOGO PERMAINAN
              </h2>
              <p className="text-xs text-[#e9d5ff]">
                Nama Aset Projek:{' '}
                <code className="px-1.5 py-0.5 bg-[#140b29] border border-[#7c3aed] text-[#7dd3fc] font-mono-num">
                  {OFFICIAL_LOGO_ASSET_ID}
                </code>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playButtonClick();
              onClose();
            }}
            className="w-10 h-10 pixel-btn-purple flex items-center justify-center cursor-pointer"
            aria-label="Tutup Pengurusan Logo"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 bg-[#1c1138] max-h-[82vh] overflow-y-auto pixel-scroll">
          {/* Upload Status Bar */}
          <div
            className={`p-3 border-2 flex flex-wrap items-center justify-between gap-2 ${
              isLoaded
                ? 'bg-[#064e3b]/60 border-[#34d399] text-[#d1fae5]'
                : 'bg-[#312e81]/50 border-[#facc15] text-[#fef08a]'
            }`}
          >
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#34d399]" />
              <span>
                {isLoaded
                  ? 'STATUS: LOGO RASMI TERSEDIA & AKTIF PADA SEMUA HALAMAN'
                  : 'STATUS: PEMEGANG TEMPAT AKTIF (TIADA GAMBAR REKAAN AI DIGUNAKAN)'}
              </span>
            </div>
            <span className="font-mono-num text-[11px] px-2 py-0.5 bg-black/35 border border-white/20">
              {logoConfig.displayMode === 'transparent' && logoConfig.transparent
                ? 'MOD B: TRANSPARAN'
                : 'MOD A: LOGO ASAL'}
            </span>
          </div>

          {statusMsg && (
            <div className="p-3 bg-[#065f46] border-2 border-[#6ee7b7] text-xs sm:text-sm font-bold text-[#ecfdf5] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#fde047] shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-[#7f1d1d] border-2 border-[#fca5a5] text-xs sm:text-sm font-bold text-[#fee2e2]">
              {errorMsg}
            </div>
          )}

          {/* Two Background Display Modes (Section 11: MOD A vs MOD B) */}
          <div className="p-3.5 bg-[#140b29] border-2 border-[#5b3ea8] space-y-2.5">
            <div className="flex items-center gap-2 font-pixel font-bold text-xs sm:text-sm text-[#fde047]">
              <Layers className="w-4 h-4 shrink-0" />
              <span>PILIHAN MOD LATAR BELAKANG LOGO:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleSwitchMode('original')}
                className={`p-3 text-left border-2 cursor-pointer transition-colors ${
                  logoConfig.displayMode === 'original'
                    ? 'bg-[#1e3a8a] border-[#fde047] text-white'
                    : 'bg-[#221542] border-[#5b3ea8] text-[#cbd5e1] hover:border-[#a78bfa]'
                }`}
              >
                <div className="font-pixel font-bold text-xs sm:text-sm text-[#fde047]">
                  MOD A: LOGO ASAL
                </div>
                <p className="text-[11px] mt-1 leading-snug text-[#e2e8f0]">
                  Memaparkan logo penuh bersama latar belakang biru asal di dalam bingkai piksel
                  kemas tanpa memotong garisan putih maskot.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchMode('transparent')}
                className={`p-3 text-left border-2 cursor-pointer transition-colors ${
                  logoConfig.displayMode === 'transparent'
                    ? 'bg-[#1e3a8a] border-[#fde047] text-white'
                    : 'bg-[#221542] border-[#5b3ea8] text-[#cbd5e1] hover:border-[#a78bfa]'
                }`}
              >
                <div className="font-pixel font-bold text-xs sm:text-sm text-[#7dd3fc]">
                  MOD B: LOGO TRANSPARAN
                </div>
                <p className="text-[11px] mt-1 leading-snug text-[#e2e8f0]">
                  Menggunakan versi PNG berlatar lutsinar jika dimuat naik (tidak membuang latar
                  biru secara paksa supaya garisan putih kekal utuh).
                </p>
              </button>
            </div>
          </div>

          {/* Live Logo Preview & Dropzone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
            {/* Pratonton Logo */}
            <div className="p-4 bg-[#120a26] border-2 border-[#f6c445] flex flex-col items-center justify-center text-center space-y-3">
              <span className="font-pixel font-bold text-xs text-[#fef08a]">
                {pendingFile ? 'PRATONTON LOGO BAHARU (BELUM DISIMPAN)' : 'PRATONTON LOGO SEMASA'}
              </span>

              <GameLogo
                config={previewConfig}
                size="lg"
                floating
                softGlow
                sparkles
              />

              <div className="text-[11px] text-[#cbd5e1] space-y-0.5">
                {pendingFile ? (
                  <p className="text-[#86efac] font-bold">
                    Fail dipilih: {pendingFile.name} ({formatBytes(pendingFile.size)})
                  </p>
                ) : (
                  <p>
                    Nisbah asal dikekalkan dengan{' '}
                    <code className="text-[#fde047]">object-fit: contain</code>
                  </p>
                )}
              </div>
            </div>

            {/* Ruang Muat Naik & Butang Tindakan */}
            <div className="p-4 bg-[#120a26] border-2 border-[#5b3ea8] flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <span className="font-pixel font-bold text-xs text-[#e9d5ff] block">
                  RUANG MUAT NAIK GAMBAR LOGO
                </span>
                <p className="text-xs text-[#cbd5e1] leading-relaxed">
                  Format disokong: <strong>PNG, JPG, JPEG, WEBP</strong> (sehingga 10 MB). Sasaran
                  muat naik semasa:{' '}
                  <strong className="text-[#fde047]">
                    {targetVariant === 'transparent' ? 'Mod B (PNG Transparan)' : 'Mod A (Logo Asal)'}
                  </strong>
                  .
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                  onChange={handleSelectFile}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-4 border-2 border-dashed border-[#a78bfa] hover:border-[#fde047] bg-[#1d1238] hover:bg-[#27184a] transition-colors cursor-pointer text-center space-y-1.5"
                >
                  <Upload className="w-6 h-6 text-[#fde047] mx-auto" />
                  <div className="font-pixel font-bold text-xs text-white">
                    KLIK UNTUK MEMILIH FAIL LOGO
                  </div>
                  <div className="text-[11px] text-[#c4b5fd]">
                    PNG · JPG · JPEG · WEBP
                  </div>
                </div>
              </div>

              {/* Action Buttons: SIMPAN LOGO & GANTI LOGO */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  disabled={!pendingFile || isSaving}
                  onClick={handleConfirmSave}
                  className={`w-full py-2.5 px-4 font-pixel font-bold text-xs sm:text-sm flex items-center justify-center gap-2 whitespace-nowrap ${
                    pendingFile && !isSaving
                      ? 'pixel-btn-gold cursor-pointer'
                      : 'bg-[#332659] text-[#94a3b8] border-2 border-[#473873] cursor-not-allowed'
                  }`}
                >
                  <Save className="w-4 h-4 shrink-0" />
                  <span>{isSaving ? 'MENYIMPAN LOGO...' : 'SIMPAN LOGO'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playButtonClick();
                    fileInputRef.current?.click();
                  }}
                  className="w-full py-2 px-4 pixel-btn-blue font-pixel font-bold text-xs flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <ImagePlus className="w-4 h-4 shrink-0" />
                  <span>GANTI LOGO</span>
                </button>
              </div>
            </div>
          </div>

          {/* Utility Row: Restore Official Uploaded Logo / Test Placeholder */}
          <div className="pt-2 border-t border-[#4c3385] flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={async () => {
                soundEngine.playButtonClick();
                setPendingFile(null);
                setPendingPreviewUrl(null);
                await onResetToOfficialLogo();
                setTargetVariant('original');
                setStatusMsg(
                  'Logo rasmi asal yang dimuat naik (logo-kota-tatabahasa) telah dipulihkan.'
                );
              }}
              className="px-3 py-1.5 pixel-btn-emerald font-pixel font-bold text-[11px] flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className="w-3.5 h-3.5 shrink-0" />
              <span>PULIHKAN LOGO RASMI ASAL</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                soundEngine.playButtonClick();
                setPendingFile(null);
                setPendingPreviewUrl(null);
                await onSetPlaceholderMode();
                setStatusMsg(
                  'Ruang pemegang tempat diaktifkan (tanpa sebarang gambar rekaan AI).'
                );
              }}
              className="px-3 py-1.5 pixel-btn-wood font-pixel font-bold text-[11px] cursor-pointer whitespace-nowrap"
            >
              UJI RUANG PEMEGANG TEMPAT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
