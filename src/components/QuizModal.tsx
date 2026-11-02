import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Edit3,
  HelpCircle,
  Lightbulb,
  Lock,
  Play,
  RotateCcw,
  Sparkles,
  X,
  ZoomIn,
} from 'lucide-react';
import { AvatarId, JournalRecord, QuestionImageRecord, QuizQuestion } from '../types/game';
import { WORLD_MAPS } from '../engine/maps';
import {
  getOriginalQuestionImageUrl,
  getThumbnailQuestionImageUrl,
} from '../utils/questionImageStore';
import { PixelPortrait } from './PixelPortrait';
import { QuestionImageZoomModal } from './QuestionImageZoomModal';
import { soundEngine } from '../audio/soundEngine';

interface QuizModalProps {
  question: QuizQuestion;
  avatarId: AvatarId;
  existingRecord?: JournalRecord;
  customImageRecord?: QuestionImageRecord;
  isDeveloperMode?: boolean;
  editRevision?: number;
  missionPrerequisiteLocked?: {
    requiredMission: 1 | 2;
    solvedInRequiredMission: number;
  } | null;
  lockedByPreviousQuestion?: QuizQuestion | null;
  onOpenQuickEdit?: (question: QuizQuestion) => void;
  onRecordQuestionAttempt?: (
    questionId: number,
    isCorrect: boolean,
    selectedOption?: 'A' | 'B' | 'C' | 'D'
  ) => void;
  onCompleteQuestion: (
    question: QuizQuestion,
    pointsEarned: number,
    attempts: number,
    usedHint: boolean,
    revealedAfterTwoFails: boolean,
    keepModalOpen?: boolean
  ) => void;
  onClose: () => void;
}

function normalizeAnswer(input: string): string {
  return input.trim().replace(/\s+/g, ' ').toLowerCase();
}

export const QuizModal: React.FC<QuizModalProps> = ({
  question,
  avatarId,
  existingRecord,
  customImageRecord,
  isDeveloperMode = false,
  editRevision = 0,
  missionPrerequisiteLocked,
  lockedByPreviousQuestion,
  onOpenQuickEdit,
  onRecordQuestionAttempt,
  onCompleteQuestion,
  onClose,
}) => {
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [textInput, setTextInput] = useState('');
  const [usedHint, setUsedHint] = useState(false);
  const [showHintBox, setShowHintBox] = useState(false);
  const [wrongCount, setWrongCount] = useState(0);
  const [phase, setPhase] = useState<'ANSWERING' | 'WRONG_ONCE' | 'REVEALED_AFTER_TWO' | 'CORRECT'>(
    'ANSWERING'
  );
  const [earnedPointsPreview, setEarnedPointsPreview] = useState(0);
  const [confirmedReadJustification, setConfirmedReadJustification] = useState(false);
  const [isImageZoomOpen, setIsImageZoomOpen] = useState(false);

  // Re-test session mode (allows re-testing an already-answered question without extra rewards)
  const [isRetestNoReward, setIsRetestNoReward] = useState(false);
  const [devBypassLock, setDevBypassLock] = useState(false);
  const [updatedBannerVisible, setUpdatedBannerVisible] = useState(false);

  const prevEditRevisionRef = useRef(editRevision);
  const prevQuestionIdRef = useRef(question.id);

  // Reset transient state if switching to a different question ID
  useEffect(() => {
    if (prevQuestionIdRef.current !== question.id) {
      prevQuestionIdRef.current = question.id;
      setSelectedOption(null);
      setTextInput('');
      setUsedHint(false);
      setShowHintBox(false);
      setWrongCount(0);
      setPhase('ANSWERING');
      setEarnedPointsPreview(0);
      setConfirmedReadJustification(false);
      setIsImageZoomOpen(false);
      setIsRetestNoReward(false);
      setDevBypassLock(false);
      setUpdatedBannerVisible(false);
    }
  }, [question.id]);

  // Refresh quiz view cleanly when returning from SIMPAN DAN KEMBALI in Quick Edit
  useEffect(() => {
    if (prevEditRevisionRef.current !== editRevision) {
      prevEditRevisionRef.current = editRevision;
      setSelectedOption(null);
      setTextInput('');
      setWrongCount(0);
      setConfirmedReadJustification(false);
      setPhase('ANSWERING');
      setUpdatedBannerVisible(true);
    }
  }, [editRevision]);

  const startRetestWithoutReward = () => {
    soundEngine.playButtonClick();
    setIsRetestNoReward(true);
    setSelectedOption(null);
    setTextInput('');
    setUsedHint(false);
    setShowHintBox(false);
    setWrongCount(0);
    setEarnedPointsPreview(0);
    setConfirmedReadJustification(false);
    setPhase('ANSWERING');
  };

  const renderQuickEditButton = () => {
    if (!isDeveloperMode || !onOpenQuickEdit) return null;
    return (
      <button
        type="button"
        onClick={() => {
          soundEngine.playButtonClick();
          onOpenQuickEdit(question);
        }}
        className="px-2.5 py-1.5 pixel-btn-emerald font-pixel font-bold text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
      >
        <Edit3 className="w-3.5 h-3.5 shrink-0" />
        <span>EDIT SOALAN INI</span>
      </button>
    );
  };

  const verifiedCustomImage =
    customImageRecord &&
    customImageRecord.questionId === question.id &&
    Boolean(getOriginalQuestionImageUrl(customImageRecord))
      ? customImageRecord
      : undefined;

  const thumbnailImageUrl = getThumbnailQuestionImageUrl(verifiedCustomImage);
  const originalZoomImageUrl = getOriginalQuestionImageUrl(verifiedCustomImage);

  // 0. Open-World Exploration Rule: Locations are freely open, only Misi 2 / Misi 3 challenges require prior mission!
  if (missionPrerequisiteLocked && !existingRecord && !devBypassLock) {
    const reqM = missionPrerequisiteLocked.requiredMission;
    const reqLocation =
      reqM === 1
        ? 'Taman Sakura Bahasa (Soalan 1–10)'
        : 'Pasar Perkataan & Menara Media (Soalan 11–20)';
    return (
      <div className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-4">
        <div className="w-full max-w-lg pixel-panel-purple p-6 text-center space-y-4">
          {isDeveloperMode && (
            <div className="flex items-center justify-end gap-2 pb-2 border-b border-[#5b3ea8]">
              {renderQuickEditButton()}
            </div>
          )}
          <div className="mx-auto w-20 h-20 bg-[#1e143b] border-3 border-[#facc15] flex items-center justify-center">
            <Lock className="w-10 h-10 text-[#fde047]" />
          </div>
          <h3 className="font-pixel font-bold text-2xl text-[#fde047]">
            CABARAN MISI {question.mission} BELUM DIBUKA
          </h3>
          <p className="text-sm sm:text-base text-[#f3e8ff] leading-relaxed">
            Kamu bebas meneroka kawasan ini pada bila-bila masa! Namun untuk membuka kuiz{' '}
            <strong className="text-[#fde047]">Misi {question.mission}</strong>, lengkapkan dahulu{' '}
            <strong className="text-[#7dd3fc]">Misi {reqM}</strong> di{' '}
            <strong className="text-[#fde047]">{reqLocation}</strong> (
            {missionPrerequisiteLocked.solvedInRequiredMission} / 10 selesai).
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            {isDeveloperMode && (
              <button
                type="button"
                onClick={() => {
                  setDevBypassLock(true);
                  startRetestWithoutReward();
                }}
                className="px-4 py-2.5 pixel-btn-blue font-pixel font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>UJI SOALAN (MOD PEMBANGUN · TIADA GANJARAN)</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                soundEngine.playButtonClick();
                onClose();
              }}
              className="px-6 py-2.5 pixel-btn-gold font-pixel font-bold text-sm cursor-pointer"
            >
              TERUSKAN MENEROKA KAWASAN INI
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 1. Sequential Order Guard ("Paparkan soalan mengikut urutan asal")
  if (lockedByPreviousQuestion && !existingRecord && !devBypassLock) {
    const targetMapName = WORLD_MAPS[lockedByPreviousQuestion.mapId]?.name ?? 'kawasan berkaitan';
    return (
      <div className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-4">
        <div className="w-full max-w-lg pixel-panel-purple p-6 text-center space-y-4">
          {isDeveloperMode && (
            <div className="flex items-center justify-end gap-2 pb-2 border-b border-[#5b3ea8]">
              {renderQuickEditButton()}
            </div>
          )}
          <div className="mx-auto w-20 h-20 bg-[#1e143b] border-3 border-[#facc15] flex items-center justify-center">
            <PixelPortrait mode="object" objectKind={lockedByPreviousQuestion.objectKind} size={64} />
          </div>
          <h3 className="font-pixel font-bold text-2xl text-[#fde047]">
            IKUT URUTAN SIASATAN!
          </h3>
          <p className="text-sm sm:text-base text-[#f3e8ff] leading-relaxed">
            Wahai Detektif, siasat{' '}
            <strong className="text-[#fde047]">{lockedByPreviousQuestion.title}</strong> pada objek{' '}
            <strong className="text-[#7dd3fc]">“{lockedByPreviousQuestion.objectName}”</strong> di{' '}
            <strong className="text-[#86efac]">{targetMapName}</strong> terlebih dahulu sebelum
            membuka Soalan {question.id}!
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            {isDeveloperMode && (
              <button
                type="button"
                onClick={() => {
                  setDevBypassLock(true);
                  startRetestWithoutReward();
                }}
                className="px-4 py-2.5 pixel-btn-blue font-pixel font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>UJI SOALAN (MOD PEMBANGUN · TIADA GANJARAN)</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                soundEngine.playButtonClick();
                onClose();
              }}
              className="px-6 py-2.5 pixel-btn-gold font-pixel font-bold text-sm cursor-pointer"
            >
              FAHAM, SAYA CARI SOALAN {lockedByPreviousQuestion.id}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Read-Only Review Mode if Question Already Solved (unless player/developer initiates Re-test without extra rewards)
  if (existingRecord && !isRetestNoReward && phase === 'ANSWERING') {
    return (
      <div className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-2xl pixel-panel-purple p-5 sm:p-6 space-y-4 my-auto">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#5b3ea8] pb-3">
            <div>
              <span className="text-xs font-bold text-[#34d399]">
                ✓ TELAH DISELESAIKAN (+{existingRecord.pointsEarned} Mata · +1 Kristal Kata)
              </span>
              <h3 className="font-pixel font-bold text-xl sm:text-2xl text-[#fde047]">
                {question.title}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {renderQuickEditButton()}
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 pixel-btn-purple flex items-center justify-center cursor-pointer"
                aria-label="Tutup Semakan Soalan"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {updatedBannerVisible && (
            <div className="p-2.5 bg-[#064e3b] border-2 border-[#34d399] text-xs font-bold text-[#d1fae5] flex items-center justify-between gap-2">
              <span>✓ Perubahan berjaya disimpan! Kandungan terkini soalan telah dimuatkan.</span>
              <button
                type="button"
                onClick={startRetestWithoutReward}
                className="px-2.5 py-1 pixel-btn-gold font-pixel text-[11px] cursor-pointer shrink-0"
              >
                UJI SEKARANG
              </button>
            </div>
          )}

          {verifiedCustomImage && thumbnailImageUrl && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playButtonClick();
                setIsImageZoomOpen(true);
              }}
              title="Klik untuk besarkan gambar soalan"
              className="relative w-full bg-[#120a26] border-3 border-[#f6c445] p-2 flex flex-col items-center justify-center gap-2 cursor-pointer group hover:border-[#fde047] transition-colors"
            >
              <img
                src={thumbnailImageUrl}
                alt={question.title}
                className="max-h-56 w-full object-contain"
              />
              <span className="px-3 py-1 bg-[#16122b]/95 border border-[#facc15] font-pixel font-bold text-xs text-[#fde047] flex items-center gap-1.5 group-hover:bg-[#2b1d52]">
                <ZoomIn className="w-3.5 h-3.5" />
                <span>KLIK UNTUK BESARKAN GAMBAR</span>
              </span>
            </button>
          )}

          <div className="pixel-panel-parchment p-4 space-y-3">
            <div>
              <span className="text-xs font-bold text-[#991b1b]">KESALAHAN ASAL:</span>
              <p className="font-bold text-base text-[#261505]">{question.kesalahanAsal}</p>
            </div>
            <div>
              <span className="text-xs font-bold text-[#065f46]">PEMBETULAN TEPAT:</span>
              <p className="font-bold text-lg text-[#047857]">{question.pembetulanPenuh}</p>
            </div>
            <div className="pt-2 border-t border-[#d6c096]">
              <span className="text-xs font-bold text-[#581c87]">JUSTIFIKASI TATABAHASA:</span>
              <p className="text-sm font-medium text-[#2d1e12] leading-relaxed mt-0.5">
                {question.justifikasi}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={startRetestWithoutReward}
              className="px-4 py-2.5 pixel-btn-blue font-pixel font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>UJI SEMULA (TANPA GANJARAN)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playButtonClick();
                onClose();
              }}
              className="px-6 py-2.5 pixel-btn-gold font-pixel font-bold text-sm cursor-pointer ml-auto"
            >
              KEMBALI MENEROKA
            </button>
          </div>
        </div>

        {verifiedCustomImage && originalZoomImageUrl && (
          <QuestionImageZoomModal
            isOpen={isImageZoomOpen}
            originalImageUrl={originalZoomImageUrl}
            questionId={question.id}
            mission={question.mission}
            title={question.title}
            slotId={verifiedCustomImage.slotId}
            fileName={verifiedCustomImage.fileName}
            knownNaturalWidth={verifiedCustomImage.naturalWidth}
            knownNaturalHeight={verifiedCustomImage.naturalHeight}
            onClose={() => setIsImageZoomOpen(false)}
          />
        )}
      </div>
    );
  }

  const handleOpenHint = () => {
    soundEngine.playBookOpen();
    setUsedHint(true);
    setShowHintBox(true);
  };

  // Always evaluates against the latest edited question properties (correctOption / acceptedAnswers)
  const evaluateSubmission = (choice?: 'A' | 'B' | 'C' | 'D') => {
    setUpdatedBannerVisible(false);
    let isCorrect = false;
    let pickedOption: 'A' | 'B' | 'C' | 'D' | undefined;
    if (question.type === 'mcq') {
      const picked = choice ?? selectedOption;
      if (!picked) return;
      pickedOption = picked;
      isCorrect = picked === question.correctOption;
    } else {
      const norm = normalizeAnswer(textInput);
      if (!norm) return;
      const validSet = (question.acceptedAnswers ?? []).map(normalizeAnswer);
      isCorrect = validSet.includes(norm);
    }

    if (!isRetestNoReward && !existingRecord && !devBypassLock) {
      onRecordQuestionAttempt?.(question.id, isCorrect, pickedOption);
    }

    if (isCorrect) {
      const pts = isRetestNoReward || Boolean(existingRecord)
        ? 0
        : wrongCount > 0
        ? 50
        : usedHint
        ? 70
        : 100;
      setEarnedPointsPreview(pts);
      setPhase('CORRECT');
      soundEngine.playCorrect();
      if (!isRetestNoReward && !existingRecord) {
        soundEngine.playCrystalGain();
      }
    } else {
      const nextWrong = wrongCount + 1;
      setWrongCount(nextWrong);
      soundEngine.playWrong();
      if (nextWrong >= 2) {
        setEarnedPointsPreview(0);
        setPhase('REVEALED_AFTER_TWO');
      } else {
        setPhase('WRONG_ONCE');
      }
    }
  };

  const isNoRewardRun = isRetestNoReward || Boolean(existingRecord);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-4xl pixel-panel-purple p-4 sm:p-6 my-auto space-y-4">
        {/* TOP BAR: Kuiz Tatabahasa · Misi X / 30 */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b-2 border-[#5b3ea8]">
          <div className="flex flex-wrap items-center gap-3 min-w-0">
            <span className="px-3 py-1 bg-[#facc15] text-[#261505] font-pixel font-bold text-xs sm:text-sm shrink-0">
              MISI {question.mission}
            </span>
            <div className="min-w-0">
              <h2 className="font-pixel font-bold text-lg sm:text-2xl text-[#fff8e7]">
                Kuiz Tatabahasa · Cabaran {question.id} / 30
              </h2>
              {isNoRewardRun && (
                <p className="text-xs font-semibold text-[#7dd3fc]">
                  Mod Uji Semula · Tiada ganjaran markah atau kristal tambahan
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {renderQuickEditButton()}
            {phase === 'ANSWERING' && (
              <button
                type="button"
                onClick={handleOpenHint}
                className="px-3 py-1.5 pixel-btn-blue font-pixel font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Lightbulb className="w-4 h-4" />
                <span>PETUNJUK</span>
              </button>
            )}
            {(phase === 'ANSWERING' || isNoRewardRun) && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playButtonClick();
                  onClose();
                }}
                className="w-9 h-9 pixel-btn-purple flex items-center justify-center cursor-pointer"
                aria-label="Tutup Kuiz"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {updatedBannerVisible && (
          <div className="p-2.5 bg-[#064e3b] border-2 border-[#34d399] text-xs font-bold text-[#d1fae5]">
            ✓ Kandungan soalan dan jawapan semakan telah dikemas kini. Sila uji soalan di bawah.
          </div>
        )}

        {/* ANSWERING VIEW */}
        {phase === 'ANSWERING' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
            {/* LEFT PANEL: Uploaded Question Image (question_01..30) OR Pixel Object Illustration + Petunjuk */}
            <div className="md:col-span-4 bg-[#1c1238] border-3 border-[#5b3ea8] p-4 flex flex-col items-center justify-between text-center gap-3">
              <div className="flex flex-col items-center w-full">
                {verifiedCustomImage && thumbnailImageUrl ? (
                  <div className="w-full space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playButtonClick();
                        setIsImageZoomOpen(true);
                      }}
                      title="Klik untuk besarkan gambar soalan"
                      className="relative w-full h-48 bg-[#120a26] border-3 border-[#f6c445] hover:border-[#fde047] overflow-hidden flex items-center justify-center cursor-pointer group transition-colors"
                    >
                      <img
                        src={thumbnailImageUrl}
                        alt={question.title}
                        className="w-full h-full object-contain"
                      />
                      <span className="absolute bottom-1.5 right-1.5 px-2.5 py-1 bg-[#16122b]/95 border border-[#facc15] font-pixel font-bold text-[10px] sm:text-xs text-[#fde047] flex items-center gap-1 group-hover:bg-[#2b1d52]">
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>KLIK UNTUK BESARKAN</span>
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-[#2b1d52] border-3 border-[#f6c445]">
                    <PixelPortrait mode="object" objectKind={question.objectKind} size={96} />
                  </div>
                )}
                <span className="mt-2 font-pixel font-bold text-base text-[#fde047]">
                  {question.objectName}
                </span>
                <span className="text-xs text-[#c4b5fd]">
                  {question.type === 'mcq' ? 'Soalan Aneka Pilihan' : 'Soalan Isi Tempat Kosong'}
                </span>
              </div>

              {showHintBox ? (
                <div className="w-full p-3 bg-[#fffbeb] text-[#451a03] border-3 border-[#f59e0b] text-left">
                  <div className="font-pixel font-bold text-xs text-[#b45309] flex items-center gap-1 mb-1">
                    <Lightbulb className="w-3.5 h-3.5" /> PETUNJUK DETEKTIF:
                  </div>
                  <p className="text-xs sm:text-sm font-medium leading-snug">{question.petunjuk}</p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenHint}
                  className="w-full py-2 px-3 bg-[#2b1d52] hover:bg-[#3b2770] border-2 border-[#7dd3fc] text-[#bae6fd] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Perlukan Petunjuk Konsep?</span>
                </button>
              )}
            </div>

            {/* RIGHT PANEL: Question Title, Situation, Instruction & Answer Area */}
            <div className="md:col-span-8 pixel-panel-parchment p-4 sm:p-5 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-pixel font-bold text-lg sm:text-xl text-[#581c87]">
                    {question.title}
                  </h3>
                  {wrongCount === 1 && (
                    <span className="text-xs font-bold text-[#c2410c]">
                      {isNoRewardRun ? 'Percubaan Kedua (Uji Semula)' : 'Percubaan Kedua (+50 Mata)'}
                    </span>
                  )}
                </div>

                {/* Highlighted Situation / Original Error */}
                <div className="p-3.5 bg-[#fef3c7] border-2 border-[#b45309]">
                  <span className="block text-xs font-bold text-[#92400e] mb-1">
                    SITUASI / BAHAN SIASATAN:
                  </span>
                  <p className="font-body font-extrabold text-base sm:text-lg text-[#1e1b4b]">
                    {question.situasi}
                  </p>
                </div>

                <p className="text-sm font-bold text-[#3b1d0e]">{question.arahan}</p>
              </div>

              {/* MCQ Options OR Fill-in-the-blank Input */}
              {question.type === 'mcq' && question.options ? (
                <div className="grid grid-cols-1 gap-2.5">
                  {question.options.map((opt) => {
                    const isPicked = selectedOption === opt.label;
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => {
                          soundEngine.playButtonClick();
                          setSelectedOption(opt.label);
                          evaluateSubmission(opt.label);
                        }}
                        className={`p-3 text-left border-3 transition-transform cursor-pointer flex items-center gap-3 ${
                          isPicked
                            ? 'bg-[#fde047] border-[#4a2806] text-[#261505]'
                            : 'bg-white hover:bg-[#fef9c3] border-[#7c4a21] text-[#261505]'
                        }`}
                      >
                        <span className="w-8 h-8 bg-[#581c87] text-[#fde047] font-pixel font-bold text-base flex items-center justify-center shrink-0">
                          {opt.label}
                        </span>
                        <span className="font-body font-bold text-sm sm:text-base">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    soundEngine.playButtonClick();
                    evaluateSubmission();
                  }}
                  className="space-y-3"
                >
                  <input
                    type="text"
                    autoFocus
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Taip jawapan pembetulan anda di sini..."
                    className="w-full px-4 py-3 bg-white text-[#1e1b4b] font-body font-bold text-base sm:text-lg border-3 border-[#581c87] focus:outline-none focus:border-[#d97706]"
                  />
                  <button
                    type="submit"
                    disabled={!textInput.trim()}
                    className="w-full py-3 px-6 pixel-btn-gold disabled:opacity-50 font-pixel font-bold text-base cursor-pointer"
                  >
                    SEMAK JAWAPAN
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* WRONG FIRST ATTEMPT: Soft Orange Panel (No Answer Leak Yet!) */}
        {phase === 'WRONG_ONCE' && (
          <div className="bg-[#fff7ed] border-4 border-[#ea580c] p-5 sm:p-6 text-[#431407] space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="p-2 bg-[#ffedd5] border-2 border-[#ea580c]">
                <PixelPortrait mode="avatar" avatarId={avatarId} anim="idle" size={80} />
              </div>
              <div className="text-center sm:text-left flex-1">
                <h3 className="font-pixel font-bold text-2xl sm:text-3xl text-[#c2410c]">
                  BELUM TEPAT!
                </h3>
                <p className="font-bold text-base sm:text-lg mt-1">
                  Jangan berputus asa. Cuba sekali lagi!
                </p>
                <p className="text-sm text-[#7c2d12] mt-1">
                  Kamu mempunyai satu lagi peluang percubaan sebelum pembetulan didedahkan. Gunakan
                  butang Petunjuk jika mahu bantuan konsep!
                </p>
              </div>
            </div>

            {showHintBox && (
              <div className="p-3.5 bg-[#fef3c7] border-2 border-[#d97706]">
                <span className="font-pixel font-bold text-xs text-[#92400e]">PETUNJUK:</span>
                <p className="text-sm font-semibold text-[#451a03] mt-0.5">{question.petunjuk}</p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-3">
              {verifiedCustomImage && originalZoomImageUrl && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playButtonClick();
                    setIsImageZoomOpen(true);
                  }}
                  className="px-4 py-2.5 pixel-btn-purple font-pixel font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer mr-auto"
                >
                  <ZoomIn className="w-4 h-4" />
                  <span>BESARKAN GAMBAR SOALAN</span>
                </button>
              )}
              {!showHintBox && (
                <button
                  type="button"
                  onClick={handleOpenHint}
                  className="px-5 py-2.5 pixel-btn-blue font-pixel font-bold text-sm flex items-center gap-2 cursor-pointer"
                >
                  <Lightbulb className="w-4 h-4" />
                  <span>PETUNJUK</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  soundEngine.playButtonClick();
                  setSelectedOption(null);
                  setPhase('ANSWERING');
                }}
                className="px-6 py-2.5 pixel-btn-gold font-pixel font-bold text-sm flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>CUBA LAGI</span>
              </button>
            </div>
          </div>
        )}

        {/* CORRECT PANEL: ILMU BAHASA DIPEROLEH! + Kesalahan Asal, Pembetulan, Justifikasi */}
        {phase === 'CORRECT' && (
          <div className="bg-gradient-to-b from-[#064e3b] to-[#065f46] border-4 border-[#facc15] p-5 sm:p-6 text-[#ecfdf5] space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b-2 border-[#10b981] pb-4">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-[#022c22] border-3 border-[#facc15]">
                  <PixelPortrait mode="avatar" avatarId={avatarId} anim="reward" size={84} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-[#fde047]" />
                    <h3 className="font-pixel font-bold text-2xl sm:text-3xl text-[#fde047]">
                      ILMU BAHASA DIPEROLEH!
                    </h3>
                  </div>
                  <p className="font-pixel font-bold text-base sm:text-lg text-white">
                    BETUL! TAHNIAH, WIRA BAHASA!
                  </p>
                </div>
              </div>

              {/* Rewards Earned (or 0 Extra Rewards in Retest Mode) */}
              {isNoRewardRun ? (
                <div className="bg-[#022c22] border-2 border-[#7dd3fc] px-4 py-2.5 text-left">
                  <div className="font-pixel font-bold text-xs text-[#7dd3fc]">
                    SESI UJI SEMULA
                  </div>
                  <div className="font-mono-num font-bold text-sm text-[#e2e8f0]">
                    Tiada Ganjaran Tambahan (+0 Mata)
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-[#022c22] border-2 border-[#facc15] px-4 py-2.5">
                  <PixelPortrait mode="crystal" lit size={40} />
                  <div className="text-left">
                    <div className="font-mono-num font-bold text-base text-[#fde047]">
                      +{earnedPointsPreview} Mata
                    </div>
                    <div className="font-pixel font-bold text-sm text-[#7dd3fc]">
                      +1 Kristal Kata
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[#fffbeb] text-[#261505] border-3 border-[#f59e0b] p-4 space-y-2.5">
              <div>
                <span className="text-xs font-extrabold text-[#991b1b] tracking-wide">
                  KESALAHAN ASAL:
                </span>
                <p className="font-body font-bold text-sm sm:text-base text-[#451a03]">
                  {question.kesalahanAsal}
                </p>
              </div>
              <div className="pt-2 border-t border-[#fde68a]">
                <span className="text-xs font-extrabold text-[#047857] tracking-wide">
                  PEMBETULAN:
                </span>
                <p className="font-body font-extrabold text-lg text-[#065f46]">
                  {question.pembetulanPenuh}
                </p>
              </div>
              <div className="pt-2 border-t border-[#fde68a]">
                <span className="text-xs font-extrabold text-[#6d28d9] tracking-wide">
                  JUSTIFIKASI:
                </span>
                <p className="font-body font-semibold text-sm sm:text-base text-[#291509] leading-relaxed mt-0.5">
                  {question.justifikasi}
                </p>
              </div>
            </div>

            {verifiedCustomImage && thumbnailImageUrl && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playButtonClick();
                  setIsImageZoomOpen(true);
                }}
                title="Klik untuk besarkan gambar soalan"
                className="w-full p-2 bg-[#022c22] border-2 border-[#facc15] hover:border-[#fde047] flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={thumbnailImageUrl}
                    alt={question.title}
                    className="w-16 h-12 object-contain bg-[#090514] border border-[#facc15] shrink-0"
                  />
                  <span className="font-body font-bold text-xs sm:text-sm text-[#fef9c3] truncate">
                    Semak semula bahan bacaan / notis pada gambar soalan
                  </span>
                </div>
                <span className="px-2.5 py-1 bg-[#16122b] border border-[#facc15] font-pixel font-bold text-[10px] sm:text-xs text-[#fde047] flex items-center gap-1 shrink-0">
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>BESARKAN</span>
                </span>
              </button>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              {isNoRewardRun ? (
                <>
                  <button
                    type="button"
                    onClick={startRetestWithoutReward}
                    className="px-4 py-2.5 pixel-btn-blue font-pixel font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>UJI SEKALI LAGI (TANPA GANJARAN)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playButtonClick();
                      onClose();
                    }}
                    className="px-6 py-3 pixel-btn-gold font-pixel font-bold text-sm sm:text-base flex items-center gap-2 cursor-pointer ml-auto"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>SELESAI UJI SEMULA</span>
                  </button>
                </>
              ) : (
                <>
                  {isDeveloperMode && (
                    <button
                      type="button"
                      onClick={() => {
                        onCompleteQuestion(
                          question,
                          earnedPointsPreview,
                          wrongCount + 1,
                          usedHint,
                          false,
                          true
                        );
                        startRetestWithoutReward();
                      }}
                      className="px-4 py-2.5 pixel-btn-blue font-pixel font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>SIMPAN & UJI SEMULA (TANPA GANJARAN)</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playButtonClick();
                      onCompleteQuestion(
                        question,
                        earnedPointsPreview,
                        wrongCount + 1,
                        usedHint,
                        false,
                        false
                      );
                    }}
                    className="px-6 py-3 pixel-btn-gold font-pixel font-bold text-base flex items-center gap-2 cursor-pointer ml-auto"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>SAYA FAHAM, TERUSKAN</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* REVEALED AFTER TWO WRONG ATTEMPTS: ILMU BAHASA DIPEROLEH! */}
        {phase === 'REVEALED_AFTER_TWO' && (
          <div className="bg-[#2e1a47] border-4 border-[#f59e0b] p-5 sm:p-6 text-[#fff8e7] space-y-4">
            <div>
              <span className="px-2.5 py-0.5 bg-[#f59e0b] text-[#261505] font-pixel font-bold text-xs">
                ULANG KAJI & PEMBETULAN
              </span>
              <h3 className="font-pixel font-bold text-2xl sm:text-3xl text-[#fde047] mt-1">
                ILMU BAHASA DIPEROLEH!
              </h3>
              <p className="text-xs sm:text-sm text-[#e9d5ff]">
                {isNoRewardRun
                  ? 'Sesi uji semula selesai (tiada ganjaran tambahan diberikan). Semak pembetulan dan justifikasi di bawah.'
                  : 'Baca pembetulan dan justifikasi di bawah dengan teliti untuk memulihkan Kristal Kata ini (+1 Kristal Kata, 0 mata bonus).'}
              </p>
            </div>

            <div className="pixel-panel-parchment p-4 space-y-3">
              <div>
                <span className="text-xs font-extrabold text-[#991b1b]">KESALAHAN ASAL:</span>
                <p className="font-bold text-sm text-[#451a03]">{question.kesalahanAsal}</p>
              </div>
              <div className="pt-2 border-t border-[#d6c096]">
                <span className="text-xs font-extrabold text-[#047857]">PEMBETULAN:</span>
                <p className="font-extrabold text-lg text-[#065f46]">{question.pembetulanPenuh}</p>
              </div>
              <div className="pt-2 border-t border-[#d6c096]">
                <span className="text-xs font-extrabold text-[#581c87]">JUSTIFIKASI:</span>
                <p className="font-semibold text-sm sm:text-base text-[#261505] leading-relaxed mt-0.5">
                  {question.justifikasi}
                </p>
              </div>
            </div>

            {verifiedCustomImage && thumbnailImageUrl && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playButtonClick();
                  setIsImageZoomOpen(true);
                }}
                title="Klik untuk besarkan gambar soalan"
                className="w-full p-2 bg-[#160d2e] border-2 border-[#f6c445] hover:border-[#fde047] flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={thumbnailImageUrl}
                    alt={question.title}
                    className="w-16 h-12 object-contain bg-[#090514] border border-[#facc15] shrink-0"
                  />
                  <span className="font-body font-bold text-xs sm:text-sm text-[#fef9c3] truncate">
                    Semak semula bahan bacaan / notis pada gambar soalan
                  </span>
                </div>
                <span className="px-2.5 py-1 bg-[#2b1d52] border border-[#facc15] font-pixel font-bold text-[10px] sm:text-xs text-[#fde047] flex items-center gap-1 shrink-0">
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>BESARKAN</span>
                </span>
              </button>
            )}

            {!isNoRewardRun && (
              <label className="flex items-center gap-3 p-3 bg-[#1c1030] border-2 border-[#a78bfa] cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmedReadJustification}
                  onChange={(e) => setConfirmedReadJustification(e.target.checked)}
                  className="w-5 h-5 accent-[#facc15]"
                />
                <span className="text-xs sm:text-sm font-bold text-[#fef3c7]">
                  Saya telah membaca dan memahami justifikasi pembetulan tatabahasa di atas.
                </span>
              </label>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              {isNoRewardRun ? (
                <>
                  <button
                    type="button"
                    onClick={startRetestWithoutReward}
                    className="px-4 py-2.5 pixel-btn-blue font-pixel font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>UJI SEKALI LAGI (TANPA GANJARAN)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playButtonClick();
                      onClose();
                    }}
                    className="px-6 py-3 pixel-btn-gold font-pixel font-bold text-sm sm:text-base cursor-pointer ml-auto"
                  >
                    SELESAI UJI SEMULA
                  </button>
                </>
              ) : (
                <>
                  {isDeveloperMode && (
                    <button
                      type="button"
                      disabled={!confirmedReadJustification}
                      onClick={() => {
                        soundEngine.playCrystalGain();
                        onCompleteQuestion(question, 0, 2, usedHint, true, true);
                        startRetestWithoutReward();
                      }}
                      className="px-4 py-2.5 pixel-btn-blue disabled:opacity-45 font-pixel font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>SIMPAN & UJI SEMULA (TANPA GANJARAN)</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={!confirmedReadJustification}
                    onClick={() => {
                      soundEngine.playCrystalGain();
                      onCompleteQuestion(question, 0, 2, usedHint, true, false);
                    }}
                    className="px-6 py-3 pixel-btn-gold disabled:opacity-45 font-pixel font-bold text-sm sm:text-base cursor-pointer ml-auto"
                  >
                    SAYA FAHAM, TERUSKAN
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* INTERACTIVE FULL-QUALITY QUESTION IMAGE ZOOM & FULLSCREEN MODAL */}
      {verifiedCustomImage && originalZoomImageUrl && (
        <QuestionImageZoomModal
          isOpen={isImageZoomOpen}
          originalImageUrl={originalZoomImageUrl}
          questionId={question.id}
          mission={question.mission}
          title={question.title}
          slotId={verifiedCustomImage.slotId}
          fileName={verifiedCustomImage.fileName}
          knownNaturalWidth={verifiedCustomImage.naturalWidth}
          knownNaturalHeight={verifiedCustomImage.naturalHeight}
          onClose={() => setIsImageZoomOpen(false)}
        />
      )}
    </div>
  );
};
