import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  ImagePlus,
  RefreshCw,
  RotateCcw,
  Save,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { LocationAssetRecord, LocationAssetSlotId } from '../types/game';
import {
  LOCATION_ASSET_SLOTS,
  validateLocationImageFile,
} from '../utils/locationAssetStore';
import { formatBytes, readFileAsDataUrl } from '../utils/questionImageStore';
import { soundEngine } from '../audio/soundEngine';

interface LocationAssetManagerModalProps {
  isOpen: boolean;
  initialFocusSlot?: LocationAssetSlotId | null;
  locationAssets: Record<LocationAssetSlotId, LocationAssetRecord>;
  onSaveLocationAsset: (
    slotId: LocationAssetSlotId,
    file: File,
    dataUrl: string
  ) => Promise<void>;
  onResetLocationAsset: (slotId: LocationAssetSlotId) => Promise<void>;
  onClose: () => void;
}

interface PendingDraft {
  file: File;
  previewDataUrl: string;
}

export const LocationAssetManagerModal: React.FC<LocationAssetManagerModalProps> = ({
  isOpen,
  initialFocusSlot = null,
  locationAssets,
  onSaveLocationAsset,
  onResetLocationAsset,
  onClose,
}) => {
  const [drafts, setDrafts] = useState<Partial<Record<LocationAssetSlotId, PendingDraft>>>({});
  const [savingSlot, setSavingSlot] = useState<LocationAssetSlotId | null>(null);
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [failedPreviewSlots, setFailedPreviewSlots] = useState<Record<string, boolean>>({});

  const fileInputRefs = useRef<Partial<Record<LocationAssetSlotId, HTMLInputElement | null>>>({});
  const cardRefs = useRef<Partial<Record<LocationAssetSlotId, HTMLDivElement | null>>>({});

  useEffect(() => {
    if (!isOpen || !initialFocusSlot) return;
    const targetEl = cardRefs.current[initialFocusSlot];
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isOpen, initialFocusSlot]);

  if (!isOpen) return null;

  const handleChooseFile = async (slotId: LocationAssetSlotId, file: File | undefined) => {
    if (!file) return;
    setStatusBanner(null);

    const check = validateLocationImageFile(file);
    if (!check.valid) {
      soundEngine.playWrong();
      setStatusBanner({ type: 'error', message: check.error });
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      soundEngine.playButtonClick();
      setDrafts((prev) => ({
        ...prev,
        [slotId]: { file, previewDataUrl: dataUrl },
      }));
      setFailedPreviewSlots((prev) => ({ ...prev, [slotId]: false }));
    } catch {
      soundEngine.playWrong();
      setStatusBanner({
        type: 'error',
        message: 'Gagal membaca fail gambar daripada peranti.',
      });
    }
  };

  const handleConfirmSave = async (slotId: LocationAssetSlotId) => {
    const draft = drafts[slotId];
    if (!draft) return;

    setSavingSlot(slotId);
    setStatusBanner(null);
    try {
      await onSaveLocationAsset(slotId, draft.file, draft.previewDataUrl);
      soundEngine.playCrystalGain();
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[slotId];
        return next;
      });
      const slotInfo = LOCATION_ASSET_SLOTS.find((s) => s.slotId === slotId);
      setStatusBanner({
        type: 'success',
        message: `Gambar bagi ${slotInfo?.slotTitle ?? slotId} berjaya disimpan ke IndexedDB & aset projek!`,
      });
    } catch {
      soundEngine.playWrong();
      setStatusBanner({
        type: 'error',
        message: 'Gagal menyimpan gambar lokasi. Sila cuba lagi.',
      });
    } finally {
      setSavingSlot(null);
    }
  };

  const handleResetSlot = async (slotId: LocationAssetSlotId) => {
    setSavingSlot(slotId);
    setStatusBanner(null);
    try {
      await onResetLocationAsset(slotId);
      soundEngine.playButtonClick();
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[slotId];
        return next;
      });
      setFailedPreviewSlots((prev) => ({ ...prev, [slotId]: false }));
      const slotInfo = LOCATION_ASSET_SLOTS.find((s) => s.slotId === slotId);
      setStatusBanner({
        type: 'success',
        message: `${slotInfo?.locationName ?? 'Lokasi'} telah dipulihkan kepada ilustrasi asal projek.`,
      });
    } finally {
      setSavingSlot(null);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-6xl h-[93vh] pixel-panel-purple flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="px-4 sm:px-6 py-3.5 bg-[#221445] border-b-3 border-[#f6c445] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ImagePlus className="w-6 h-6 text-[#fde047] shrink-0" />
            <div>
              <h2 className="font-pixel font-bold text-xl sm:text-2xl text-[#fde047]">
                PENGURUSAN ASET GAMBAR LOKASI (9 SLOT)
              </h2>
              <p className="text-xs text-[#e9d5ff]">
                Format diterima: PNG, JPG, JPEG, WEBP · Nisbah asal 16:9 dipelihara (object-fit:
                contain) · Disimpan dalam Aset Projek & IndexedDB
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playButtonClick();
              onClose();
            }}
            className="px-3.5 py-1.5 pixel-btn-purple font-pixel font-bold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>TUTUP</span>
          </button>
        </div>

        {/* STATUS MESSAGE */}
        {statusBanner && (
          <div
            className={`px-5 py-2.5 text-xs sm:text-sm font-bold flex items-center justify-between gap-2 border-b-2 ${
              statusBanner.type === 'success'
                ? 'bg-[#064e3b] text-[#ecfdf5] border-[#34d399]'
                : 'bg-[#7f1d1d] text-[#fef2f2] border-[#f87171]'
            }`}
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#fde047] shrink-0" />
              <span>{statusBanner.message}</span>
            </span>
            <button
              type="button"
              onClick={() => setStatusBanner(null)}
              className="text-xs underline cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

        {/* 9 SLOTS GRID */}
        <div className="flex-1 overflow-y-auto pixel-scroll p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {LOCATION_ASSET_SLOTS.map((slot) => {
              const record = locationAssets[slot.slotId];
              const draft = drafts[slot.slotId];
              const isFocused = initialFocusSlot === slot.slotId;
              const isBroken = Boolean(failedPreviewSlots[slot.slotId]);
              const displaySrc =
                (draft ? draft.previewDataUrl : record?.imageUrl || slot.defaultUrl) || null;

              return (
                <div
                  key={slot.slotId}
                  ref={(el) => {
                    cardRefs.current[slot.slotId] = el;
                  }}
                  className={`p-3.5 bg-[#1b1138] border-3 flex flex-col justify-between gap-3 ${
                    isFocused ? 'border-[#fde047] ring-2 ring-[#fde047]' : 'border-[#5b3ea8]'
                  }`}
                >
                  {/* Slot Header & Status */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
                      <span className="font-mono-num text-[#fde047]">SLOT {slot.slotNumber} / 9</span>
                      {draft ? (
                        <span className="text-[#fde047]">PRATONTON BAHARU (BELUM DISIMPAN)</span>
                      ) : isBroken ? (
                        <span className="text-[#fca5a5]">BELUM TERSEDIA</span>
                      ) : record?.isCustomUploaded ? (
                        <span className="text-[#7dd3fc] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> GAMBAR TERSUAI TERSEDIA
                        </span>
                      ) : (
                        <span className="text-[#86efac] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> ILUSTRASI ASAL TERSEDIA
                        </span>
                      )}
                    </div>
                    <h3 className="font-pixel font-bold text-base text-white leading-snug">
                      {slot.slotTitle}
                    </h3>
                  </div>

                  {/* 16:9 Full Uncropped Preview (object-fit: contain) */}
                  <div className="relative w-full aspect-video bg-[#0b0718] border-2 border-[#f6c445] flex items-center justify-center overflow-hidden">
                    {!isBroken && displaySrc ? (
                      <img
                        src={displaySrc}
                        alt={slot.locationName}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (
                            !draft &&
                            slot.fallbackUrl &&
                            target.src.indexOf(slot.fallbackUrl) === -1
                          ) {
                            target.src = slot.fallbackUrl;
                          } else {
                            setFailedPreviewSlots((prev) => ({
                              ...prev,
                              [slot.slotId]: true,
                            }));
                          }
                        }}
                        className="w-full h-full object-contain block"
                      />
                    ) : (
                      <div className="p-3 text-center space-y-1">
                        <p className="font-pixel font-bold text-xs text-[#fca5a5]">
                          Gambar lokasi belum tersedia.
                        </p>
                        <p className="text-[11px] text-[#cbd5e1]">
                          Tekan MUAT NAIK GAMBAR di bawah.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Metadata line */}
                  <div className="text-[11px] text-[#cbd5e1] flex items-center justify-between gap-2">
                    <span className="truncate">
                      Lokasi: <strong className="text-[#fde047]">{slot.locationName}</strong>
                    </span>
                    {draft ? (
                      <span className="font-mono-num text-[#fde68a] shrink-0">
                        {formatBytes(draft.file.size)}
                      </span>
                    ) : record?.sizeBytes ? (
                      <span className="font-mono-num text-[#94a3b8] shrink-0">
                        {formatBytes(record.sizeBytes)}
                      </span>
                    ) : null}
                  </div>

                  {/* Hidden File Picker */}
                  <input
                    ref={(el) => {
                      fileInputRefs.current[slot.slotId] = el;
                    }}
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      handleChooseFile(slot.slotId, f);
                      e.currentTarget.value = '';
                    }}
                  />

                  {/* Action Buttons: MUAT NAIK GAMBAR / GANTI GAMBAR + SIMPAN */}
                  <div className="space-y-2 pt-1 border-t border-[#3b2770]">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[slot.slotId]?.click()}
                        className="py-2 px-2.5 pixel-btn-blue font-pixel font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Upload className="w-3.5 h-3.5 shrink-0" />
                        <span>{isBroken ? 'MUAT NAIK GAMBAR' : 'GANTI GAMBAR'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={!draft || savingSlot === slot.slotId}
                        onClick={() => handleConfirmSave(slot.slotId)}
                        className="py-2 px-2.5 pixel-btn-gold disabled:opacity-45 font-pixel font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        {savingSlot === slot.slotId ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                        ) : (
                          <Save className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>SIMPAN</span>
                      </button>
                    </div>

                    {(draft || record?.isCustomUploaded) && (
                      <button
                        type="button"
                        onClick={() => {
                          if (draft) {
                            setDrafts((prev) => {
                              const next = { ...prev };
                              delete next[slot.slotId];
                              return next;
                            });
                          } else {
                            handleResetSlot(slot.slotId);
                          }
                        }}
                        className="w-full py-1.5 px-2.5 pixel-btn-wood font-pixel font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <RotateCcw className="w-3 h-3 shrink-0" />
                        <span>
                          {draft ? 'BATAL PILIHAN BAHARU' : 'PULIHKAN GAMBAR ASAL PROJEK'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
