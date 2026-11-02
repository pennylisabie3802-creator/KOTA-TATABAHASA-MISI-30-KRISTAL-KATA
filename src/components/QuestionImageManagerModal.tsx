import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  ImagePlus,
  Lock,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  Unlock,
  X,
  ZoomIn,
} from 'lucide-react';
import {
  QuestionImageRecord,
  QuestionImageSlotId,
  QuizQuestion,
} from '../types/game';
import { getQuestionsByMission } from '../data/questions';
import {
  formatBytes,
  formatQuestionSlotId,
  getOriginalQuestionImageUrl,
  getThumbnailQuestionImageUrl,
  readFileAsDataUrl,
  validateQuestionImageFile,
} from '../utils/questionImageStore';
import { PixelPortrait } from './PixelPortrait';
import { QuestionImageZoomModal } from './QuestionImageZoomModal';
import { soundEngine } from '../audio/soundEngine';

export const DEFAULT_TEACHER_ACCESS_CODE = 'GURU';

interface QuestionImageRowProps {
  question: QuizQuestion;
  savedRecord?: QuestionImageRecord;
  onSaveImage: (questionId: number, file: File, dataUrl: string) => Promise<void>;
  onDeleteImage: (questionId: number) => Promise<void>;
  onZoomPreview: (
    question: QuizQuestion,
    slotId: QuestionImageSlotId,
    originalImageUrl: string,
    fileName?: string,
    naturalWidth?: number,
    naturalHeight?: number
  ) => void;
}

const QuestionImageRow: React.FC<QuestionImageRowProps> = ({
  question,
  savedRecord,
  onSaveImage,
  onDeleteImage,
  onZoomPreview,
}) => {
  const slotId = formatQuestionSlotId(question.id);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Isolated per-question draft state (ensures question_01 never leaks into question_02..30)
  const [draftFile, setDraftFile] = useState<File | null>(null);
  const [draftPreviewUrl, setDraftPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [justSavedNotice, setJustSavedNotice] = useState(false);

  const savedOriginalUrl = getOriginalQuestionImageUrl(savedRecord);
  const savedThumbnailUrl = getThumbnailQuestionImageUrl(savedRecord);
  const hasSavedImage = Boolean(savedOriginalUrl);
  const activeThumbUrl = (draftPreviewUrl || savedThumbnailUrl) || null;
  const activeOriginalUrl = (draftPreviewUrl || savedOriginalUrl) || null;

  const openFilePicker = () => {
    soundEngine.playButtonClick();
    setErrorMsg(null);
    setConfirmDelete(false);
    setJustSavedNotice(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setJustSavedNotice(false);

    const check = validateQuestionImageFile(file);
    if (!check.valid) {
      soundEngine.playWrong();
      setErrorMsg(check.error);
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      soundEngine.playBookOpen();
      setDraftFile(file);
      setDraftPreviewUrl(dataUrl);
    } catch {
      soundEngine.playWrong();
      setErrorMsg('Gagal membaca fail gambar yang dipilih. Sila cuba lagi.');
    }
  };

  const handleSaveDraft = async () => {
    if (!draftFile || !draftPreviewUrl) return;
    setIsSaving(true);
    setErrorMsg(null);
    try {
      await onSaveImage(question.id, draftFile, draftPreviewUrl);
      soundEngine.playCrystalGain();
      setDraftFile(null);
      setDraftPreviewUrl(null);
      setJustSavedNotice(true);
    } catch {
      soundEngine.playWrong();
      setErrorMsg('Gagal menyimpan gambar pada soalan ini.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelDraft = () => {
    soundEngine.playButtonClick();
    setDraftFile(null);
    setDraftPreviewUrl(null);
    setErrorMsg(null);
  };

  const handleConfirmDelete = async () => {
    setIsSaving(true);
    setErrorMsg(null);
    try {
      await onDeleteImage(question.id);
      soundEngine.playButtonClick();
      setConfirmDelete(false);
      setJustSavedNotice(false);
    } catch {
      soundEngine.playWrong();
      setErrorMsg('Gagal memadam gambar soalan ini.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 bg-[#1c1238] border-3 border-[#5b3ea8] flex flex-col lg:flex-row items-stretch gap-4">
      {/* Hidden Device File Input Dedicated Strictly to this Question Slot */}
      <input
        ref={fileInputRef}
        id={`upload-${slotId}`}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* LEFT: PRATONTON GAMBAR */}
      <div className="w-full lg:w-56 shrink-0 flex flex-col gap-2">
        <div className="relative w-full h-38 bg-[#120a26] border-3 border-[#f6c445] overflow-hidden flex items-center justify-center">
          {activeThumbUrl && activeOriginalUrl ? (
            <>
              <img
                src={activeThumbUrl}
                alt={`Pratonton Soalan ${question.id}`}
                onClick={() =>
                  onZoomPreview(
                    question,
                    slotId,
                    activeOriginalUrl,
                    draftFile?.name ?? savedRecord?.fileName,
                    draftFile ? undefined : savedRecord?.naturalWidth,
                    draftFile ? undefined : savedRecord?.naturalHeight
                  )
                }
                className="w-full h-full object-contain bg-[#0c071a] cursor-pointer"
              />
              <button
                type="button"
                onClick={() =>
                  onZoomPreview(
                    question,
                    slotId,
                    activeOriginalUrl,
                    draftFile?.name ?? savedRecord?.fileName,
                    draftFile ? undefined : savedRecord?.naturalWidth,
                    draftFile ? undefined : savedRecord?.naturalHeight
                  )
                }
                title="Semak & besarkan gambar asal"
                className="absolute bottom-1.5 right-1.5 px-2 py-1 bg-[#16122b]/90 border border-[#facc15] text-[#fde047] font-pixel text-[10px] flex items-center gap-1 cursor-pointer hover:bg-[#2b1d52]"
              >
                <ZoomIn className="w-3 h-3" />
                <span>BESARKAN</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-2 gap-1 opacity-80">
              <PixelPortrait mode="object" objectKind={question.objectKind} size={54} />
              <span className="font-pixel text-[10px] text-[#cbd5e1]">
                Ilustrasi Piksel Asal (Tiada Gambar Muat Naik)
              </span>
            </div>
          )}

          {draftPreviewUrl && (
            <div className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-[#f59e0b] text-[#261505] font-pixel font-bold text-[10px] border border-[#451a03]">
              PRATONTON BAHARU
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono-num text-[#c4b5fd] px-0.5">
          <span>ID: {slotId}</span>
          {draftFile ? (
            <span className="text-[#fde047]">{formatBytes(draftFile.size)}</span>
          ) : savedRecord ? (
            <span>{formatBytes(savedRecord.sizeBytes)}</span>
          ) : (
            <span>Maks: 5 MB</span>
          )}
        </div>
      </div>

      {/* RIGHT: MAKLUMAT SOALAN, STATUS & TINDAKAN */}
      <div className="flex-1 flex flex-col justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-[#facc15] text-[#261505] font-pixel font-bold text-xs">
                SOALAN {question.id}
              </span>
              <span className="font-mono-num text-xs font-bold text-[#7dd3fc]">
                [{slotId}]
              </span>
            </div>

            {/* STATUS GAMBAR: BELUM DIMUAT NAIK / GAMBAR TERSEDIA */}
            {hasSavedImage ? (
              <span className="px-2.5 py-1 bg-[#065f46] border-2 border-[#34d399] text-[#ecfdf5] font-pixel font-bold text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#34d399]" />
                <span>STATUS: GAMBAR TERSEDIA</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-[#334155] border-2 border-[#94a3b8] text-[#e2e8f0] font-pixel font-bold text-xs">
                STATUS: BELUM DIMUAT NAIK
              </span>
            )}
          </div>

          <h4 className="font-pixel font-bold text-lg text-[#fde047]">{question.title}</h4>
          <p className="text-xs sm:text-sm text-[#e9d5ff] leading-snug">
            <strong className="text-[#c4b5fd]">Situasi:</strong> {question.situasi}
          </p>

          {savedRecord && !draftFile && (
            <p className="text-[11px] text-[#86efac] font-mono-num">
              Fail tersimpan: {savedRecord.fileName} ({formatBytes(savedRecord.sizeBytes)})
            </p>
          )}
        </div>

        {/* VALIDATION ERROR ALERT */}
        {errorMsg && (
          <div className="p-2.5 bg-[#450a0a] border-2 border-[#f87171] text-[#fecaca] text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#f87171] shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* SAVED SUCCESS FEEDBACK */}
        {justSavedNotice && !draftFile && (
          <div className="p-2 bg-[#064e3b] border-2 border-[#34d399] text-[#d1fae5] text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#34d399] shrink-0" />
            <span>
              Gambar berjaya disimpan khas untuk <strong>Soalan {question.id} ({slotId})</strong>!
            </span>
          </div>
        )}

        {/* REVIEW & SAVE WORKFLOW WHEN NEW IMAGE SELECTED */}
        {draftFile && draftPreviewUrl ? (
          <div className="p-3 bg-[#2b1d52] border-2 border-[#facc15] space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-[#fde047]">
                Semak Gambar Dipilih: <span className="text-white">{draftFile.name}</span> (
                {formatBytes(draftFile.size)})
              </span>
              <button
                type="button"
                onClick={() =>
                  onZoomPreview(question, slotId, draftPreviewUrl, draftFile.name)
                }
                className="text-[#7dd3fc] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" /> Lihat Saiz Penuh
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveDraft}
                className="px-4 py-2 pixel-btn-gold font-pixel font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'MENYIMPAN...' : 'SIMPAN GAMBAR'}</span>
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={openFilePicker}
                className="px-3.5 py-2 pixel-btn-blue font-pixel font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>PILIH FAIL LAIN</span>
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={handleCancelDraft}
                className="px-3.5 py-2 pixel-btn-purple font-pixel font-bold text-xs cursor-pointer"
              >
                BATAL
              </button>
            </div>
          </div>
        ) : confirmDelete ? (
          <div className="p-3 bg-[#450a0a] border-2 border-[#f87171] flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#fecaca]">
              Padam gambar bagi Soalan {question.id} ({slotId})?
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 bg-[#ef4444] text-white border-2 border-white font-pixel font-bold text-xs cursor-pointer"
              >
                YA, PADAM GAMBAR
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-3.5 py-1.5 pixel-btn-purple font-pixel font-bold text-xs cursor-pointer"
              >
                BATAL
              </button>
            </div>
          </div>
        ) : (
          /* STANDARD ACTION BUTTONS: MUAT NAIK GAMBAR · TUKAR GAMBAR · PADAM GAMBAR */
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              disabled={hasSavedImage}
              onClick={openFilePicker}
              className="px-3.5 py-2 pixel-btn-emerald disabled:opacity-40 disabled:cursor-not-allowed font-pixel font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <ImagePlus className="w-4 h-4" />
              <span>MUAT NAIK GAMBAR</span>
            </button>

            <button
              type="button"
              disabled={!hasSavedImage}
              onClick={openFilePicker}
              className="px-3.5 py-2 pixel-btn-blue disabled:opacity-40 disabled:cursor-not-allowed font-pixel font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>TUKAR GAMBAR</span>
            </button>

            <button
              type="button"
              disabled={!hasSavedImage}
              onClick={() => {
                soundEngine.playButtonClick();
                setConfirmDelete(true);
              }}
              className="px-3.5 py-2 bg-[#4c1127] hover:bg-[#6b1636] disabled:opacity-40 disabled:cursor-not-allowed border-2 border-[#f43f5e] text-[#fecdd3] font-pixel font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>PADAM GAMBAR</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

interface QuestionImageManagerModalProps {
  isOpen: boolean;
  isDeveloperUnlocked: boolean;
  questionImages: Partial<Record<QuestionImageSlotId, QuestionImageRecord>>;
  onUnlockDeveloperMode: () => void;
  onLockDeveloperMode: () => void;
  onSaveQuestionImage: (questionId: number, file: File, dataUrl: string) => Promise<void>;
  onDeleteQuestionImage: (questionId: number) => Promise<void>;
  onClose: () => void;
}

export const QuestionImageManagerModal: React.FC<QuestionImageManagerModalProps> = ({
  isOpen,
  isDeveloperUnlocked,
  questionImages,
  onUnlockDeveloperMode,
  onLockDeveloperMode,
  onSaveQuestionImage,
  onDeleteQuestionImage,
  onClose,
}) => {
  const [accessInput, setAccessInput] = useState('');
  const [accessError, setAccessError] = useState<string | null>(null);
  const [activeMissionFilter, setActiveMissionFilter] = useState<'ALL' | 1 | 2 | 3>('ALL');
  const [zoomModal, setZoomModal] = useState<{
    question: QuizQuestion;
    slotId: QuestionImageSlotId;
    imageUrl: string;
    fileName?: string;
    naturalWidth?: number;
    naturalHeight?: number;
  } | null>(null);

  if (!isOpen) return null;

  const uploadedCount = Object.keys(questionImages).length;

  const missionSections: {
    mission: 1 | 2 | 3;
    heading: string;
    sub: string;
    questions: QuizQuestion[];
  }[] = [
    {
      mission: 1,
      heading: 'MISI 1: DETEKTIF BAHASA',
      sub: 'Soalan 1 hingga 10 (question_01 – question_10)',
      questions: getQuestionsByMission(1),
    },
    {
      mission: 2,
      heading: 'MISI 2: PEMBURU KESALAHAN',
      sub: 'Soalan 11 hingga 20 (question_11 – question_20)',
      questions: getQuestionsByMission(2),
    },
    {
      mission: 3,
      heading: 'MISI 3: WIRA TATABAHASA',
      sub: 'Soalan 21 hingga 30 (question_21 – question_30)',
      questions: getQuestionsByMission(3),
    },
  ];

  const visibleSections = missionSections.filter((s) =>
    activeMissionFilter === 'ALL' ? true : s.mission === activeMissionFilter
  );

  // Developer / Teacher Mode Access Gate if not yet unlocked
  if (!isDeveloperUnlocked) {
    const handleVerifyAccess = (e: React.FormEvent) => {
      e.preventDefault();
      const norm = accessInput.trim().toUpperCase();
      if (norm === DEFAULT_TEACHER_ACCESS_CODE || norm === '1234') {
        soundEngine.playMissionUnlock();
        setAccessError(null);
        setAccessInput('');
        onUnlockDeveloperMode();
      } else {
        soundEngine.playWrong();
        setAccessError('Kod akses tidak tepat. Masukkan kod pembangun/guru: GURU');
      }
    };

    return (
      <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
        <div className="w-full max-w-md pixel-panel-purple p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-[#5b3ea8] pb-3">
            <div className="flex items-center gap-2.5">
              <Lock className="w-6 h-6 text-[#fde047]" />
              <h2 className="font-pixel font-bold text-xl text-[#fde047]">
                MOD PEMBANGUN / GURU
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 pixel-btn-purple flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs sm:text-sm text-[#e9d5ff] leading-relaxed">
            Halaman <strong>PENGURUSAN GAMBAR SOALAN</strong> dikhaskan untuk pembangun permainan dan guru sahaja bagi mengelakkan perubahan tidak sengaja oleh murid.
          </p>

          <form onSubmit={handleVerifyAccess} className="space-y-3">
            <div>
              <label className="block font-pixel text-xs text-[#fde047] mb-1">
                MASUKKAN KOD AKSES GURU / PEMBANGUN (Kod Lalai: GURU):
              </label>
              <input
                type="text"
                autoFocus
                value={accessInput}
                onChange={(e) => setAccessInput(e.target.value)}
                placeholder="Taip GURU di sini..."
                className="w-full px-3.5 py-2.5 bg-[#120a26] border-2 border-[#a78bfa] text-white font-mono-num font-bold text-sm focus:outline-none focus:border-[#fde047]"
              />
            </div>

            {accessError && (
              <p className="text-xs font-bold text-[#fca5a5]">{accessError}</p>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 pixel-btn-purple font-pixel font-bold text-xs cursor-pointer"
              >
                BATAL
              </button>
              <button
                type="submit"
                className="px-5 py-2 pixel-btn-gold font-pixel font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>MASUK MOD GURU</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-2 sm:p-5">
      <div className="w-full max-w-6xl h-[94vh] pixel-panel-purple flex flex-col overflow-hidden">
        {/* TOP HEADER */}
        <div className="p-3.5 sm:p-4 bg-[#231547] border-b-3 border-[#f6c445] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-[#140b29] border-2 border-[#facc15] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-[#34d399]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-pixel font-bold text-xl sm:text-2xl text-[#fde047]">
                  PENGURUSAN GAMBAR SOALAN
                </h2>
                <span className="px-2 py-0.5 bg-[#065f46] border border-[#34d399] font-pixel font-bold text-[10px] text-[#ecfdf5]">
                  MOD PEMBANGUN / GURU AKTIF
                </span>
              </div>
              <p className="text-xs text-[#e9d5ff]">
                Format dibenarkan: <strong>JPG, JPEG, PNG, WEBP</strong> · Had saiz: <strong>5 MB / gambar</strong> · Gambar Tersedia:{' '}
                <strong className="font-mono-num text-[#fde047]">{uploadedCount} / 30</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                soundEngine.playButtonClick();
                onLockDeveloperMode();
                onClose();
              }}
              title="Kunci semula Mod Pembangun / Guru"
              className="px-3 py-2 bg-[#3b1224] hover:bg-[#591834] border-2 border-[#f43f5e] text-[#fecdd3] font-pixel font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">KUNCI MOD GURU</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playButtonClick();
                onClose();
              }}
              className="w-10 h-10 pixel-btn-purple flex items-center justify-center cursor-pointer"
              aria-label="Tutup Pengurusan Gambar Soalan"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MISSION FILTER TABS */}
        <div className="px-4 py-2.5 bg-[#190f33] border-b-2 border-[#4c3385] flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: 'ALL', label: 'Semua Misi (Soalan 1–30)' },
                { id: 1, label: 'Misi 1: Detektif Bahasa (1–10)' },
                { id: 2, label: 'Misi 2: Pemburu Kesalahan (11–20)' },
                { id: 3, label: 'Misi 3: Wira Tatabahasa (21–30)' },
              ] as const
            ).map((tab) => {
              const active = activeMissionFilter === tab.id;
              return (
                <button
                  key={String(tab.id)}
                  type="button"
                  onClick={() => {
                    soundEngine.playButtonClick();
                    setActiveMissionFilter(tab.id);
                  }}
                  className={`px-3.5 py-1.5 font-pixel font-bold text-xs sm:text-sm border-2 cursor-pointer ${
                    active
                      ? 'bg-[#facc15] text-[#261505] border-[#4a2806]'
                      : 'bg-[#2b1d52] text-[#e9d5ff] border-[#5b3ea8] hover:border-[#a78bfa]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <span className="text-[11px] font-mono-num text-[#7dd3fc] hidden xl:inline">
            ID Unik: question_01 → question_30
          </span>
        </div>

        {/* SCROLLABLE 30 QUESTIONS LIST GROUPED BY MISSION */}
        <div className="flex-1 overflow-y-auto pixel-scroll p-3 sm:p-5 space-y-6 bg-[#241645]">
          {visibleSections.map((sec) => {
            const secUploaded = sec.questions.filter(
              (q) => Boolean(questionImages[formatQuestionSlotId(q.id)])
            ).length;

            return (
              <section key={sec.mission} className="space-y-3">
                {/* Mission Group Banner */}
                <div className="p-3.5 bg-[#150c2e] border-3 border-[#f6c445] flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-pixel font-bold text-lg sm:text-xl text-[#fde047]">
                      {sec.heading}
                    </h3>
                    <p className="text-xs text-[#cbd5e1]">{sec.sub}</p>
                  </div>
                  <span className="px-3 py-1 bg-[#2b1d52] border border-[#7dd3fc] font-mono-num font-bold text-xs text-[#7dd3fc]">
                    Gambar Tersedia: {secUploaded} / 10
                  </span>
                </div>

                {/* Individual Question Rows */}
                <div className="space-y-3">
                  {sec.questions.map((q) => {
                    const slotId = formatQuestionSlotId(q.id);
                    return (
                      <QuestionImageRow
                        key={slotId}
                        question={q}
                        savedRecord={questionImages[slotId]}
                        onSaveImage={onSaveQuestionImage}
                        onDeleteImage={onDeleteQuestionImage}
                        onZoomPreview={(
                          qItem,
                          sId,
                          imageUrl,
                          fileName,
                          naturalWidth,
                          naturalHeight
                        ) =>
                          setZoomModal({
                            question: qItem,
                            slotId: sId,
                            imageUrl,
                            fileName,
                            naturalWidth,
                            naturalHeight,
                          })
                        }
                      />
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {/* INTERACTIVE FULL-SIZE IMAGE ZOOM & FULLSCREEN INSPECTION */}
      {zoomModal && (
        <QuestionImageZoomModal
          isOpen
          originalImageUrl={zoomModal.imageUrl}
          questionId={zoomModal.question.id}
          mission={zoomModal.question.mission}
          title={zoomModal.question.title}
          slotId={zoomModal.slotId}
          fileName={zoomModal.fileName}
          knownNaturalWidth={zoomModal.naturalWidth}
          knownNaturalHeight={zoomModal.naturalHeight}
          onClose={() => setZoomModal(null)}
        />
      )}
    </div>
  );
};
