import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Edit3,
  ImagePlus,
  RotateCcw,
  Save,
  Trash2,
  X,
  ZoomIn,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  QuestionAttemptStat,
  QuestionEditableFields,
  QuestionImageRecord,
  QuestionType,
  QuizOption,
  QuizQuestion,
} from '../types/game';
import { getOriginalQuestionById, QUIZ_QUESTIONS } from '../data/questions';
import {
  formatBytes,
  formatQuestionSlotId,
  getOriginalQuestionImageUrl,
  getThumbnailQuestionImageUrl,
  readFileAsDataUrl,
  validateQuestionImageFile,
} from '../utils/questionImageStore';
import {
  createEmptyQuestionStat,
  getWrongAnswerPercentage,
} from '../utils/questionStatsStore';
import { PixelPortrait } from './PixelPortrait';
import { QuestionImageZoomModal } from './QuestionImageZoomModal';
import { soundEngine } from '../audio/soundEngine';

export type SupportingImageDraftAction =
  | { kind: 'unchanged' }
  | { kind: 'upload'; file: File; dataUrl: string }
  | { kind: 'remove' };

interface QuickEditQuestionModalProps {
  question: QuizQuestion;
  customImageRecord?: QuestionImageRecord;
  questionStats: Record<number, QuestionAttemptStat>;
  onResetQuestionStat?: (questionId: number) => Promise<void>;
  onSaveAndReturn: (
    questionId: number,
    fields: QuestionEditableFields,
    imageAction: SupportingImageDraftAction,
    isRestoringFactoryDefault: boolean
  ) => Promise<void>;
  onCancel: () => void;
}

const OPTION_LABELS: readonly ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];

function buildInitialOptions(q: QuizQuestion): Record<'A' | 'B' | 'C' | 'D', string> {
  const map: Record<'A' | 'B' | 'C' | 'D', string> = {
    A: '',
    B: '',
    C: '',
    D: '',
  };
  if (q.options && q.options.length > 0) {
    for (const opt of q.options) {
      if (OPTION_LABELS.includes(opt.label)) {
        map[opt.label] = opt.text;
      }
    }
  } else {
    map.A = q.pembetulanPenuh || '';
    map.B = q.kesalahanAsal || '';
  }
  return map;
}

function normalizeAnswerPreview(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').toLowerCase();
}

function parseAcceptedAnswersInput(raw: string): string[] {
  const parts = raw
    .split(/[\n,;]+/)
    .map((item) => normalizeAnswerPreview(item))
    .filter(Boolean);
  return Array.from(new Set(parts));
}

export const QuickEditQuestionModal: React.FC<QuickEditQuestionModalProps> = ({
  question,
  customImageRecord,
  questionStats,
  onResetQuestionStat,
  onSaveAndReturn,
  onCancel,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const slotId = formatQuestionSlotId(question.id);

  // Draft fields initialized with all original/current content of ONLY this question
  const [title, setTitle] = useState(question.title);
  const [objectName, setObjectName] = useState(question.objectName);
  const [questionType, setQuestionType] = useState<QuestionType>(question.type);
  const [situasi, setSituasi] = useState(question.situasi);
  const [arahan, setArahan] = useState(question.arahan);
  const [optionTexts, setOptionTexts] = useState<Record<'A' | 'B' | 'C' | 'D', string>>(() =>
    buildInitialOptions(question)
  );
  const [correctOption, setCorrectOption] = useState<'A' | 'B' | 'C' | 'D'>(
    question.correctOption ?? 'A'
  );
  const [acceptedAnswersRaw, setAcceptedAnswersRaw] = useState<string>(() =>
    question.acceptedAnswers && question.acceptedAnswers.length > 0
      ? question.acceptedAnswers.join(', ')
      : normalizeAnswerPreview(question.pembetulanPenuh)
  );
  const [petunjuk, setPetunjuk] = useState(question.petunjuk);
  const [kesalahanAsal, setKesalahanAsal] = useState(question.kesalahanAsal);
  const [pembetulanPenuh, setPembetulanPenuh] = useState(question.pembetulanPenuh);
  const [justifikasi, setJustifikasi] = useState(question.justifikasi);

  // Transactional supporting image state (committed ONLY on SIMPAN DAN KEMBALI)
  const [imageAction, setImageAction] = useState<SupportingImageDraftAction>({
    kind: 'unchanged',
  });
  const [isFactoryRestoredDraft, setIsFactoryRestoredDraft] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [chartMode, setChartMode] = useState<'current' | 'comparison'>('current');
  const [confirmResetStats, setConfirmResetStats] = useState(false);
  const [isResettingStats, setIsResettingStats] = useState(false);
  const [isSupportImageZoomOpen, setIsSupportImageZoomOpen] = useState(false);

  // Sync draft if active question ID changes
  useEffect(() => {
    setTitle(question.title);
    setObjectName(question.objectName);
    setQuestionType(question.type);
    setSituasi(question.situasi);
    setArahan(question.arahan);
    setOptionTexts(buildInitialOptions(question));
    setCorrectOption(question.correctOption ?? 'A');
    setAcceptedAnswersRaw(
      question.acceptedAnswers && question.acceptedAnswers.length > 0
        ? question.acceptedAnswers.join(', ')
        : normalizeAnswerPreview(question.pembetulanPenuh)
    );
    setPetunjuk(question.petunjuk);
    setKesalahanAsal(question.kesalahanAsal);
    setPembetulanPenuh(question.pembetulanPenuh);
    setJustifikasi(question.justifikasi);
    setImageAction({ kind: 'unchanged' });
    setIsFactoryRestoredDraft(false);
    setValidationError(null);
    setConfirmResetStats(false);
  }, [question]);

  // Student Error Frequency Analytics Computations
  const currentStat = useMemo(
    () => questionStats[question.id] ?? createEmptyQuestionStat(question.id),
    [questionStats, question.id]
  );

  const wrongPercentage = useMemo(
    () => getWrongAnswerPercentage(currentStat),
    [currentStat]
  );

  const correctPercentage = useMemo(() => {
    if (currentStat.totalAttempts <= 0) return 0;
    return Math.round((currentStat.correctAttempts / currentStat.totalAttempts) * 1000) / 10;
  }, [currentStat]);

  // Ranked list of all attempted questions from highest % wrong answers to lowest
  const rankedAttemptedQuestions = useMemo(() => {
    return QUIZ_QUESTIONS.map((q) => {
      const st = questionStats[q.id];
      const total = st?.totalAttempts ?? 0;
      const wrong = st?.wrongAttempts ?? 0;
      const wrongPct = getWrongAnswerPercentage(st);
      return {
        questionId: q.id,
        label: `S${q.id}`,
        title: q.title,
        mission: q.mission,
        totalAttempts: total,
        wrongAttempts: wrong,
        wrongPct,
        isCurrent: q.id === question.id,
      };
    })
      .filter((item) => item.totalAttempts > 0)
      .sort((a, b) => {
        if (b.wrongPct !== a.wrongPct) return b.wrongPct - a.wrongPct;
        if (b.wrongAttempts !== a.wrongAttempts) return b.wrongAttempts - a.wrongAttempts;
        return a.questionId - b.questionId;
      });
  }, [questionStats, question.id]);

  const currentDifficultyRank = useMemo(() => {
    const idx = rankedAttemptedQuestions.findIndex((item) => item.questionId === question.id);
    return idx >= 0 ? idx + 1 : null;
  }, [rankedAttemptedQuestions, question.id]);

  // Top comparison chart data (up to 8 hardest attempted questions + always include current question)
  const comparisonChartData = useMemo(() => {
    if (rankedAttemptedQuestions.length === 0) return [];
    const topSlice = rankedAttemptedQuestions.slice(0, 8);
    const hasCurrent = topSlice.some((item) => item.questionId === question.id);
    if (!hasCurrent) {
      const currentEntry = rankedAttemptedQuestions.find(
        (item) => item.questionId === question.id
      ) ?? {
        questionId: question.id,
        label: `S${question.id}`,
        title: title || question.title,
        mission: question.mission,
        totalAttempts: 0,
        wrongAttempts: 0,
        wrongPct: 0,
        isCurrent: true,
      };
      return [...topSlice.slice(0, 7), currentEntry];
    }
    return topSlice;
  }, [rankedAttemptedQuestions, question.id, question.mission, question.title, title]);

  // Option-level or Correct-vs-Wrong chart data for the active question
  const currentQuestionChartInfo = useMemo(() => {
    const optTotal =
      currentStat.optionSelections.A +
      currentStat.optionSelections.B +
      currentStat.optionSelections.C +
      currentStat.optionSelections.D;

    if (questionType === 'mcq' && optTotal > 0) {
      let maxWrongCount = 0;
      let topDistractorLabel: 'A' | 'B' | 'C' | 'D' | null = null;
      for (const lbl of OPTION_LABELS) {
        if (lbl !== correctOption) {
          const wCount = currentStat.optionSelections[lbl] ?? 0;
          if (wCount > maxWrongCount) {
            maxWrongCount = wCount;
            topDistractorLabel = lbl;
          }
        }
      }

      const bars = OPTION_LABELS.map((lbl) => {
        const count = currentStat.optionSelections[lbl] ?? 0;
        const pct = Math.round((count / optTotal) * 1000) / 10;
        const isCorrectOpt = lbl === correctOption;
        const isTopWrong = !isCorrectOpt && lbl === topDistractorLabel && count > 0;
        return {
          name: `Pilihan ${lbl}`,
          shortLabel: isCorrectOpt ? `${lbl} (Betul)` : `Pilihan ${lbl}`,
          pct,
          count,
          total: optTotal,
          isCorrectOpt,
          isTopWrong,
          detailText: optionTexts[lbl] || `Pilihan ${lbl}`,
          fillColor: isCorrectOpt
            ? '#10b981'
            : isTopWrong
            ? '#ef4444'
            : count > 0
            ? '#f97316'
            : '#475569',
        };
      });

      return {
        mode: 'mcq_options' as const,
        bars,
        topDistractorLabel,
        topDistractorPct:
          topDistractorLabel && optTotal > 0
            ? Math.round((maxWrongCount / optTotal) * 1000) / 10
            : 0,
      };
    }

    const total = currentStat.totalAttempts;
    return {
      mode: 'summary_split' as const,
      bars: [
        {
          name: 'Jawapan Salah',
          shortLabel: 'Jawapan Salah',
          pct: wrongPercentage,
          count: currentStat.wrongAttempts,
          total,
          isCorrectOpt: false,
          isTopWrong: currentStat.wrongAttempts > 0,
          detailText: 'Percubaan murid yang tidak tepat',
          fillColor: '#ef4444',
        },
        {
          name: 'Jawapan Betul',
          shortLabel: 'Jawapan Betul',
          pct: correctPercentage,
          count: currentStat.correctAttempts,
          total,
          isCorrectOpt: true,
          isTopWrong: false,
          detailText: 'Percubaan murid yang tepat',
          fillColor: '#10b981',
        },
      ],
      topDistractorLabel: null,
      topDistractorPct: 0,
    };
  }, [currentStat, questionType, correctOption, optionTexts, wrongPercentage, correctPercentage]);

  const difficultyIndicator = useMemo(() => {
    if (currentStat.totalAttempts === 0) {
      return {
        symbol: '○',
        label: 'Belum Dijawab Murid',
        textClass: 'text-[#cbd5e1]',
      };
    }
    if (wrongPercentage >= 50) {
      return {
        symbol: '▲',
        label: 'Sukar Difahami (Kesalahan Tinggi)',
        textClass: 'text-[#fca5a5]',
      };
    }
    if (wrongPercentage >= 25) {
      return {
        symbol: '◆',
        label: 'Kesukaran Sederhana',
        textClass: 'text-[#fde047]',
      };
    }
    return {
      symbol: '●',
      label: 'Mudah Difahami',
      textClass: 'text-[#86efac]',
    };
  }, [currentStat.totalAttempts, wrongPercentage]);

  const handleConfirmResetStat = async () => {
    if (!onResetQuestionStat) return;
    setIsResettingStats(true);
    try {
      soundEngine.playButtonClick();
      await onResetQuestionStat(question.id);
      setConfirmResetStats(false);
    } finally {
      setIsResettingStats(false);
    }
  };

  const resolvedThumbnailImageUrl: string | null =
    imageAction.kind === 'upload'
      ? imageAction.dataUrl || null
      : imageAction.kind === 'remove'
      ? null
      : customImageRecord?.questionId === question.id
      ? getThumbnailQuestionImageUrl(customImageRecord)
      : null;

  const resolvedOriginalImageUrl: string | null =
    imageAction.kind === 'upload'
      ? imageAction.dataUrl || null
      : imageAction.kind === 'remove'
      ? null
      : customImageRecord?.questionId === question.id
      ? getOriginalQuestionImageUrl(customImageRecord)
      : null;

  const markModified = () => {
    if (isFactoryRestoredDraft) {
      setIsFactoryRestoredDraft(false);
    }
    if (validationError) {
      setValidationError(null);
    }
  };

  const handleTriggerFileUpload = () => {
    soundEngine.playButtonClick();
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const check = validateQuestionImageFile(file);
    if (!check.valid) {
      soundEngine.playWrong();
      setValidationError(check.error);
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      soundEngine.playBookOpen();
      setImageAction({ kind: 'upload', file, dataUrl });
      setValidationError(null);
    } catch {
      soundEngine.playWrong();
      setValidationError('Gagal membaca fail gambar sokongan yang dipilih.');
    }
  };

  const handleLoadFactoryOriginal = () => {
    const orig = getOriginalQuestionById(question.id);
    if (!orig) return;
    soundEngine.playButtonClick();
    setTitle(orig.title);
    setObjectName(orig.objectName);
    setQuestionType(orig.type);
    setSituasi(orig.situasi);
    setArahan(orig.arahan);
    setOptionTexts(buildInitialOptions(orig));
    setCorrectOption(orig.correctOption ?? 'A');
    setAcceptedAnswersRaw(
      orig.acceptedAnswers && orig.acceptedAnswers.length > 0
        ? orig.acceptedAnswers.join(', ')
        : normalizeAnswerPreview(orig.pembetulanPenuh)
    );
    setPetunjuk(orig.petunjuk);
    setKesalahanAsal(orig.kesalahanAsal);
    setPembetulanPenuh(orig.pembetulanPenuh);
    setJustifikasi(orig.justifikasi);
    setIsFactoryRestoredDraft(true);
    setValidationError(null);
  };

  const handleSubmitSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!situasi.trim()) {
      soundEngine.playWrong();
      setValidationError('Teks soalan (Situasi / Bahan Siasatan) tidak boleh dibiarkan kosong.');
      return;
    }
    if (!arahan.trim()) {
      soundEngine.playWrong();
      setValidationError('Arahan soalan tidak boleh dibiarkan kosong.');
      return;
    }
    if (!kesalahanAsal.trim()) {
      soundEngine.playWrong();
      setValidationError('Ruangan Kesalahan Asal wajib diisi.');
      return;
    }
    if (!pembetulanPenuh.trim()) {
      soundEngine.playWrong();
      setValidationError('Ruangan Pembetulan wajib diisi.');
      return;
    }
    if (!justifikasi.trim()) {
      soundEngine.playWrong();
      setValidationError('Ruangan Justifikasi wajib diisi.');
      return;
    }
    if (!petunjuk.trim()) {
      soundEngine.playWrong();
      setValidationError('Ruangan Petunjuk wajib diisi.');
      return;
    }

    const builtOptions: QuizOption[] = OPTION_LABELS.map((label) => ({
      label,
      text: optionTexts[label].trim(),
    }));

    if (questionType === 'mcq') {
      const emptyOpt = builtOptions.find((o) => !o.text);
      if (emptyOpt) {
        soundEngine.playWrong();
        setValidationError(
          `Pilihan jawapan ${emptyOpt.label} masih kosong. Sila lengkapkan kesemua pilihan A, B, C dan D.`
        );
        return;
      }
      if (!OPTION_LABELS.includes(correctOption)) {
        soundEngine.playWrong();
        setValidationError('Sila pilih satu Jawapan Betul (A, B, C atau D).');
        return;
      }
    }

    const parsedAccepted = parseAcceptedAnswersInput(acceptedAnswersRaw);
    if (questionType === 'fill' && parsedAccepted.length === 0) {
      soundEngine.playWrong();
      setValidationError(
        'Sila masukkan sekurang-kurangnya satu Jawapan Betul yang diterima untuk soalan isi tempat kosong.'
      );
      return;
    }

    const payload: QuestionEditableFields = {
      title: title.trim() || `Soalan ${question.id}`,
      objectName: objectName.trim() || question.objectName,
      type: questionType,
      situasi: situasi.trim(),
      arahan: arahan.trim(),
      options: builtOptions,
      correctOption,
      acceptedAnswers:
        parsedAccepted.length > 0
          ? parsedAccepted
          : [normalizeAnswerPreview(pembetulanPenuh)],
      petunjuk: petunjuk.trim(),
      kesalahanAsal: kesalahanAsal.trim(),
      pembetulanPenuh: pembetulanPenuh.trim(),
      justifikasi: justifikasi.trim(),
    };

    setIsSaving(true);
    try {
      await onSaveAndReturn(question.id, payload, imageAction, isFactoryRestoredDraft);
      soundEngine.playCrystalGain();
    } catch {
      soundEngine.playWrong();
      setValidationError('Gagal menyimpan perubahan soalan. Sila cuba sekali lagi.');
      setIsSaving(false);
    }
  };

  const acceptedPreviewTokens = parseAcceptedAnswersInput(acceptedAnswersRaw);

  return (
    <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-2.5 sm:p-5 overflow-y-auto">
      <form
        onSubmit={handleSubmitSave}
        className="w-full max-w-4xl max-h-[94vh] pixel-panel-purple flex flex-col overflow-hidden my-auto"
      >
        {/* TOP HEADER */}
        <div className="px-4 sm:px-6 py-3.5 bg-[#221445] border-b-3 border-[#f6c445] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#7dd3fc] font-semibold">
              <span>MOD PEMBANGUN · QUICK EDIT</span>
              <span aria-hidden="true">·</span>
              <span>Soalan {question.id} / 30 (Misi {question.mission})</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#86efac]">Permainan Dijeda & Keadaan Disimpan</span>
            </div>
            <h2 className="font-pixel font-bold text-xl sm:text-2xl text-[#fde047] truncate mt-0.5">
              Editor Soalan Semasa — Cabaran #{question.id}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleLoadFactoryOriginal}
              title="Muatkan semula teks asal lalai bagi Soalan ini ke dalam borang"
              className="px-2.5 py-1.5 pixel-btn-blue font-pixel font-bold text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>TEKS ASAL</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playButtonClick();
                onCancel();
              }}
              className="w-9 h-9 pixel-btn-purple flex items-center justify-center cursor-pointer"
              aria-label="Batal dan kembali ke kuiz"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SCROLLABLE EDITOR BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto pixel-scroll space-y-5 bg-[#26194a] flex-1">
          {validationError && (
            <div className="p-3 bg-[#450a0a] border-2 border-[#f87171] text-[#fecaca] text-xs sm:text-sm font-bold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[#f87171] shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* ANALYTICS PANEL: KEKERAPAN KESALAHAN MURID (RECHARTS) */}
          <div className="p-4 bg-[#1c1238] border-3 border-[#5b3ea8] space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#4c3385] pb-2.5">
              <div>
                <h3 className="font-pixel font-bold text-base sm:text-lg text-[#fde047] flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#7dd3fc] shrink-0" />
                  <span>Analisis Kekerapan Kesalahan Murid</span>
                </h3>
                <p className="text-xs text-[#cbd5e1] mt-0.5">
                  Pantau peratusan jawapan salah bagi mengenal pasti soalan yang sukar difahami murid.
                </p>
              </div>

              {/* Segmented Chart Switcher */}
              <div className="flex items-center gap-1 bg-[#120a26] p-1 border border-[#4c3385]">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playButtonClick();
                    setChartMode('current');
                  }}
                  className={`px-2.5 py-1 font-pixel font-bold text-xs cursor-pointer transition-colors whitespace-nowrap ${
                    chartMode === 'current'
                      ? 'bg-[#facc15] text-[#1e1b4b]'
                      : 'text-[#e9d5ff] hover:bg-[#2e1d59]'
                  }`}
                >
                  Soalan #{question.id}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playButtonClick();
                    setChartMode('comparison');
                  }}
                  className={`px-2.5 py-1 font-pixel font-bold text-xs cursor-pointer transition-colors whitespace-nowrap ${
                    chartMode === 'comparison'
                      ? 'bg-[#facc15] text-[#1e1b4b]'
                      : 'text-[#e9d5ff] hover:bg-[#2e1d59]'
                  }`}
                >
                  Soalan Paling Sukar ({rankedAttemptedQuestions.length})
                </button>
              </div>
            </div>

            {/* Key Metric Row (Tabular Numerals) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-[#140b29] border border-[#4c3385] p-3">
              <div className="sm:border-r sm:border-[#3b276b] sm:pr-3">
                <span className="block text-[11px] font-semibold text-[#cbd5e1]">
                  Peratusan Jawapan Salah
                </span>
                <div className="mt-0.5 flex items-baseline gap-2">
                  <span
                    className={`font-mono-num font-extrabold text-xl ${
                      currentStat.totalAttempts === 0
                        ? 'text-[#94a3b8]'
                        : wrongPercentage >= 50
                        ? 'text-[#f87171]'
                        : wrongPercentage >= 25
                        ? 'text-[#fbbf24]'
                        : 'text-[#34d399]'
                    }`}
                  >
                    {currentStat.totalAttempts > 0 ? `${wrongPercentage.toFixed(1)}%` : '0.0%'}
                  </span>
                  <span className="font-mono-num text-xs text-[#cbd5e1]">
                    ({currentStat.wrongAttempts} salah / {currentStat.totalAttempts} cubaan)
                  </span>
                </div>
              </div>

              <div className="sm:border-r sm:border-[#3b276b] sm:px-3">
                <span className="block text-[11px] font-semibold text-[#cbd5e1]">
                  Tahap Kefahaman Semasa
                </span>
                <div className={`mt-1 text-xs sm:text-sm font-bold ${difficultyIndicator.textClass}`}>
                  <span aria-hidden="true" className="mr-1.5">
                    {difficultyIndicator.symbol}
                  </span>
                  <span>{difficultyIndicator.label}</span>
                </div>
              </div>

              <div className="sm:pl-3 flex items-center justify-between gap-2">
                <div>
                  <span className="block text-[11px] font-semibold text-[#cbd5e1]">
                    Kedudukan Kesukaran
                  </span>
                  <div className="mt-1 font-mono-num text-xs sm:text-sm font-bold text-[#e2e8f0]">
                    {currentDifficultyRank !== null
                      ? `Tangga #${currentDifficultyRank} daripada ${rankedAttemptedQuestions.length} soalan`
                      : 'Tiada rekod cubaan'}
                  </div>
                </div>

                {onResetQuestionStat && currentStat.totalAttempts > 0 && (
                  <div className="shrink-0">
                    {confirmResetStats ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={isResettingStats}
                          onClick={handleConfirmResetStat}
                          className="px-2 py-1 bg-[#7f1d1d] hover:bg-[#991b1b] border border-[#f87171] text-white font-pixel text-[10px] cursor-pointer"
                        >
                          SAHKAN
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmResetStats(false)}
                          className="px-2 py-1 bg-[#2e1d59] border border-[#6d28d9] text-[#e9d5ff] font-pixel text-[10px] cursor-pointer"
                        >
                          BATAL
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmResetStats(true)}
                        title="Kosongkan rekod kesalahan soalan ini selepas soalan ditambah baik"
                        className="px-2 py-1 bg-[#2a1b4e] hover:bg-[#3b276b] border border-[#6d28d9] text-[#cbd5e1] font-pixel text-[10px] cursor-pointer whitespace-nowrap"
                      >
                        SET SEMULA
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Chart Viewport */}
            {chartMode === 'current' ? (
              currentStat.totalAttempts === 0 ? (
                <div className="h-44 bg-[#120a26] border border-[#3b276b] px-4 flex flex-col items-center justify-center text-center gap-1.5">
                  <p className="text-xs sm:text-sm font-bold text-[#e9d5ff]">
                    Belum ada percubaan murid direkodkan bagi Soalan #{question.id}.
                  </p>
                  <p className="text-xs text-[#94a3b8] max-w-lg">
                    Graf peratusan jawapan salah dan pilihan pengganggu akan dipaparkan secara
                    automatik sebaik sahaja murid menjawab soalan ini dalam permainan.
                  </p>
                  {rankedAttemptedQuestions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playButtonClick();
                        setChartMode('comparison');
                      }}
                      className="mt-1 px-3 py-1.5 pixel-btn-blue font-pixel font-bold text-xs cursor-pointer"
                    >
                      LIHAT PERBANDINGAN {rankedAttemptedQuestions.length} SOALAN LAIN
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-full h-52 min-w-0 bg-[#120a26] border border-[#3b276b] pt-3 pr-3 pb-1 pl-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={currentQuestionChartInfo.bars}
                        margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#2e1d59" vertical={false} />
                        <XAxis
                          dataKey="shortLabel"
                          tick={{ fill: '#e2e8f0', fontSize: 11, fontWeight: 700 }}
                          axisLine={{ stroke: '#4c3385' }}
                          tickLine={false}
                        />
                        <YAxis
                          domain={[0, 100]}
                          tickFormatter={(v) => `${v}%`}
                          tick={{ fill: '#cbd5e1', fontSize: 11 }}
                          axisLine={{ stroke: '#4c3385' }}
                          tickLine={false}
                          width={44}
                        />
                        <Tooltip
                          cursor={{ fill: 'rgba(125, 211, 252, 0.08)' }}
                          content={({ active, payload }) => {
                            if (!active || !payload || payload.length === 0) return null;
                            const row = payload[0].payload as (typeof currentQuestionChartInfo.bars)[number];
                            return (
                              <div className="bg-[#190e36] border-2 border-[#f6c445] px-3 py-2 text-xs shadow-lg max-w-xs">
                                <div className="font-pixel font-bold text-[#fde047]">
                                  {row.name}{' '}
                                  {row.isCorrectOpt ? '(Jawapan Betul)' : '(Pilihan Salah)'}
                                </div>
                                <p className="text-[#e2e8f0] mt-0.5 line-clamp-2">
                                  {row.detailText}
                                </p>
                                <div className="mt-1.5 font-mono-num font-bold text-[#7dd3fc]">
                                  Kekerapan: {row.pct.toFixed(1)}% ({row.count} / {row.total} cubaan)
                                </div>
                              </div>
                            );
                          }}
                        />
                        <Bar dataKey="pct" radius={[2, 2, 0, 0]} maxBarSize={56}>
                          {currentQuestionChartInfo.bars.map((entry) => (
                            <Cell key={entry.name} fill={entry.fillColor} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#cbd5e1]">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-[#ef4444] inline-block" />
                        <span>Kesalahan Utama</span>
                      </span>
                      {currentQuestionChartInfo.mode === 'mcq_options' && (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 bg-[#f97316] inline-block" />
                          <span>Pengganggu Lain</span>
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-[#10b981] inline-block" />
                        <span>Jawapan Betul</span>
                      </span>
                    </div>

                    {currentQuestionChartInfo.topDistractorLabel && (
                      <div className="text-[#fecaca] font-semibold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#f87171] shrink-0" />
                        <span>
                          Pengganggu paling mengelirukan: Pilihan{' '}
                          <strong>{currentQuestionChartInfo.topDistractorLabel}</strong> (
                          <span className="font-mono-num">
                            {currentQuestionChartInfo.topDistractorPct.toFixed(1)}%
                          </span>
                          )
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            ) : comparisonChartData.length === 0 ? (
              <div className="h-44 bg-[#120a26] border border-[#3b276b] px-4 flex flex-col items-center justify-center text-center gap-1.5">
                <p className="text-xs sm:text-sm font-bold text-[#e9d5ff]">
                  Belum ada data jawapan murid bagi mana-mana soalan setakat ini.
                </p>
                <p className="text-xs text-[#94a3b8] max-w-lg">
                  Apabila murid mula menjawab kuiz, graf ini akan menyusun soalan mengikut peratusan
                  jawapan salah tertinggi supaya guru tahu soalan mana yang paling sukar difahami.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-full h-52 min-w-0 bg-[#120a26] border border-[#3b276b] pt-3 pr-3 pb-1 pl-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={comparisonChartData}
                      margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#2e1d59" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: '#e2e8f0', fontSize: 11, fontWeight: 700 }}
                        axisLine={{ stroke: '#4c3385' }}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                        tick={{ fill: '#cbd5e1', fontSize: 11 }}
                        axisLine={{ stroke: '#4c3385' }}
                        tickLine={false}
                        width={44}
                      />
                      <ReferenceLine
                        y={50}
                        stroke="#f87171"
                        strokeDasharray="4 4"
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(125, 211, 252, 0.08)' }}
                        content={({ active, payload }) => {
                          if (!active || !payload || payload.length === 0) return null;
                          const item = payload[0].payload as (typeof comparisonChartData)[number];
                          return (
                            <div className="bg-[#190e36] border-2 border-[#f6c445] px-3 py-2 text-xs shadow-lg max-w-xs">
                              <div className="font-pixel font-bold text-[#fde047]">
                                Soalan #{item.questionId} (Misi {item.mission})
                                {item.isCurrent ? ' · Sedang Diedit' : ''}
                              </div>
                              <p className="text-[#e2e8f0] mt-0.5 line-clamp-2">{item.title}</p>
                              <div className="mt-1.5 font-mono-num font-bold text-[#fca5a5]">
                                Jawapan Salah: {item.wrongPct.toFixed(1)}% ({item.wrongAttempts} /{' '}
                                {item.totalAttempts} cubaan)
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="wrongPct" radius={[2, 2, 0, 0]} maxBarSize={46}>
                        {comparisonChartData.map((entry) => {
                          const barColor = entry.isCurrent
                            ? '#facc15'
                            : entry.wrongPct >= 50
                            ? '#ef4444'
                            : entry.wrongPct >= 25
                            ? '#f59e0b'
                            : '#10b981';
                          return <Cell key={entry.questionId} fill={barColor} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#cbd5e1]">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-[#facc15] inline-block" />
                      <span>Soalan Semasa (S{question.id})</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-[#ef4444] inline-block" />
                      <span>Sukar (≥50% Salah)</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-[#f59e0b] inline-block" />
                      <span>Sederhana (25–49%)</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-[#10b981] inline-block" />
                      <span>Mudah (&lt;25%)</span>
                    </span>
                  </div>
                  <span>Garis putus merah menandakan ambang 50% kesalahan.</span>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 1: TEKS SOALAN & TAJUK */}
          <div className="pixel-panel-parchment p-4 space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#d6c096] pb-2">
              <h3 className="font-pixel font-bold text-base sm:text-lg text-[#581c87] flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                <span>1. Teks Soalan & Arahan</span>
              </h3>
              <span className="text-xs font-semibold text-[#78350f]">
                Hanya mengubah Soalan {question.id}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-extrabold text-[#451a03] mb-1">
                  Tajuk Soalan:
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    markModified();
                    setTitle(e.target.value);
                  }}
                  className="w-full px-3 py-2 bg-white text-[#1e1b4b] font-body font-bold text-sm border-2 border-[#7c4a21] focus:outline-none focus:border-[#581c87]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#451a03] mb-1">
                  Nama Objek Siasatan:
                </label>
                <input
                  type="text"
                  value={objectName}
                  onChange={(e) => {
                    markModified();
                    setObjectName(e.target.value);
                  }}
                  className="w-full px-3 py-2 bg-white text-[#1e1b4b] font-body font-bold text-sm border-2 border-[#7c4a21] focus:outline-none focus:border-[#581c87]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#451a03] mb-1">
                Teks Soalan (Situasi / Bahan Siasatan):
              </label>
              <textarea
                rows={2}
                value={situasi}
                onChange={(e) => {
                  markModified();
                  setSituasi(e.target.value);
                }}
                placeholder="Masukkan ayat atau situasi soalan..."
                className="w-full px-3 py-2 bg-white text-[#1e1b4b] font-body font-bold text-sm sm:text-base border-2 border-[#7c4a21] focus:outline-none focus:border-[#581c87]"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#451a03] mb-1">
                Arahan Soalan:
              </label>
              <input
                type="text"
                value={arahan}
                onChange={(e) => {
                  markModified();
                  setArahan(e.target.value);
                }}
                placeholder="Contoh: Pilih ayat pembetulan yang tepat bagi notis di atas:"
                className="w-full px-3 py-2 bg-white text-[#1e1b4b] font-body font-semibold text-sm border-2 border-[#7c4a21] focus:outline-none focus:border-[#581c87]"
              />
            </div>
          </div>

          {/* SECTION 2: PILIHAN JAWAPAN & JAWAPAN BETUL */}
          <div className="pixel-panel-parchment p-4 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d6c096] pb-2">
              <h3 className="font-pixel font-bold text-base sm:text-lg text-[#581c87]">
                2. Pilihan Jawapan & Jawapan Betul
              </h3>

              {/* Question Type Switcher */}
              <div className="flex items-center gap-1 bg-[#eaddc5] p-1 border border-[#a16207]">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playButtonClick();
                    markModified();
                    setQuestionType('mcq');
                  }}
                  className={`px-3 py-1 font-pixel font-bold text-xs cursor-pointer transition-colors ${
                    questionType === 'mcq'
                      ? 'bg-[#581c87] text-[#fde047]'
                      : 'text-[#451a03] hover:bg-[#fde68a]'
                  }`}
                >
                  Aneka Pilihan (A–D)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playButtonClick();
                    markModified();
                    setQuestionType('fill');
                  }}
                  className={`px-3 py-1 font-pixel font-bold text-xs cursor-pointer transition-colors ${
                    questionType === 'fill'
                      ? 'bg-[#581c87] text-[#fde047]'
                      : 'text-[#451a03] hover:bg-[#fde68a]'
                  }`}
                >
                  Isi Tempat Kosong
                </button>
              </div>
            </div>

            {questionType === 'mcq' ? (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-[#5c3a1b]">
                  Ubah suai teks pilihan jawapan A, B, C, D dan klik butang{' '}
                  <strong>JAWAPAN BETUL</strong> pada pilihan yang tepat:
                </p>

                <div className="space-y-2.5">
                  {OPTION_LABELS.map((label) => {
                    const isMarkedCorrect = correctOption === label;
                    return (
                      <div
                        key={label}
                        className={`p-2.5 border-2 flex flex-col sm:flex-row sm:items-center gap-2.5 ${
                          isMarkedCorrect
                            ? 'bg-[#ecfdf5] border-[#059669]'
                            : 'bg-[#fffbeb] border-[#92400e]'
                        }`}
                      >
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="w-8 h-8 bg-[#581c87] text-[#fde047] font-pixel font-bold text-sm flex items-center justify-center">
                            {label}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              soundEngine.playButtonClick();
                              markModified();
                              setCorrectOption(label);
                            }}
                            className={`px-2.5 py-1.5 font-pixel font-bold text-xs flex items-center gap-1 cursor-pointer border-2 whitespace-nowrap ${
                              isMarkedCorrect
                                ? 'bg-[#059669] text-white border-[#064e3b]'
                                : 'bg-white text-[#451a03] border-[#7c4a21] hover:bg-[#fef3c7]'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isMarkedCorrect ? 'JAWAPAN BETUL' : 'Tanda Betul'}</span>
                          </button>
                        </div>

                        <input
                          type="text"
                          value={optionTexts[label]}
                          onChange={(e) => {
                            markModified();
                            setOptionTexts((prev) => ({
                              ...prev,
                              [label]: e.target.value,
                            }));
                          }}
                          placeholder={`Masukkan teks pilihan ${label}...`}
                          className="flex-1 px-3 py-2 bg-white text-[#1e1b4b] font-body font-bold text-sm border-2 border-[#7c4a21] focus:outline-none focus:border-[#581c87]"
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="text-xs font-bold text-[#065f46]">
                  Sistem semakan jawapan semasa: Pilihan{' '}
                  <span className="font-pixel text-sm underline">{correctOption}</span> disahkan
                  sebagai jawapan betul.
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <label className="block text-xs font-extrabold text-[#451a03]">
                  Jawapan Betul Diterima (pisahkan dengan tanda koma jika lebih daripada satu variasi):
                </label>
                <input
                  type="text"
                  value={acceptedAnswersRaw}
                  onChange={(e) => {
                    markModified();
                    setAcceptedAnswersRaw(e.target.value);
                  }}
                  placeholder="Contoh: di atas, diatas meja"
                  className="w-full px-3 py-2.5 bg-white text-[#1e1b4b] font-body font-bold text-sm sm:text-base border-2 border-[#059669] focus:outline-none focus:border-[#581c87]"
                />
                <p className="text-xs font-medium text-[#5c3a1b]">
                  Semakan jawapan tidak sensitif huruf besar/kecil. Variasi diterima:{' '}
                  <strong className="text-[#065f46]">
                    {acceptedPreviewTokens.length > 0
                      ? acceptedPreviewTokens.map((t) => `“${t}”`).join(' · ')
                      : 'Tiada lagi'}
                  </strong>
                </p>
              </div>
            )}
          </div>

          {/* SECTION 3: PETUNJUK, KESALAHAN ASAL, PEMBETULAN & JUSTIFIKASI */}
          <div className="pixel-panel-parchment p-4 space-y-3.5">
            <h3 className="font-pixel font-bold text-base sm:text-lg text-[#581c87] border-b border-[#d6c096] pb-2">
              3. Petunjuk, Kesalahan Asal, Pembetulan & Justifikasi
            </h3>

            <div>
              <label className="block text-xs font-extrabold text-[#b45309] mb-1">
                Petunjuk (Hint):
              </label>
              <textarea
                rows={2}
                value={petunjuk}
                onChange={(e) => {
                  markModified();
                  setPetunjuk(e.target.value);
                }}
                placeholder="Masukkan petunjuk konsep untuk membantu pemain..."
                className="w-full px-3 py-2 bg-white text-[#1e1b4b] font-body font-semibold text-sm border-2 border-[#d97706] focus:outline-none focus:border-[#581c87]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-extrabold text-[#991b1b] mb-1">
                  Kesalahan Asal:
                </label>
                <textarea
                  rows={2}
                  value={kesalahanAsal}
                  onChange={(e) => {
                    markModified();
                    setKesalahanAsal(e.target.value);
                  }}
                  placeholder="Ayat atau perkataan yang mengandungi kesalahan..."
                  className="w-full px-3 py-2 bg-white text-[#450a0a] font-body font-bold text-sm border-2 border-[#dc2626] focus:outline-none focus:border-[#581c87]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#065f46] mb-1">
                  Pembetulan:
                </label>
                <textarea
                  rows={2}
                  value={pembetulanPenuh}
                  onChange={(e) => {
                    markModified();
                    setPembetulanPenuh(e.target.value);
                  }}
                  placeholder="Ayat atau ejaan pembetulan yang tepat..."
                  className="w-full px-3 py-2 bg-white text-[#064e3b] font-body font-extrabold text-sm border-2 border-[#059669] focus:outline-none focus:border-[#581c87]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#581c87] mb-1">
                Justifikasi Tatabahasa:
              </label>
              <textarea
                rows={3}
                value={justifikasi}
                onChange={(e) => {
                  markModified();
                  setJustifikasi(e.target.value);
                }}
                placeholder="Penerangan sebab kesalahan dan hukum tatabahasa yang betul..."
                className="w-full px-3 py-2 bg-white text-[#1e1b4b] font-body font-semibold text-sm border-2 border-[#7c4a21] focus:outline-none focus:border-[#581c87]"
              />
            </div>
          </div>

          {/* SECTION 4: GAMBAR SOKONGAN */}
          <div className="p-4 bg-[#1c1238] border-3 border-[#5b3ea8] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#4c3385] pb-2">
              <h3 className="font-pixel font-bold text-base sm:text-lg text-[#fde047]">
                4. Gambar Sokongan ({slotId})
              </h3>
              <span className="text-xs text-[#cbd5e1]">
                Format: PNG, JPG, JPEG, WEBP (Maksimum 5 MB)
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={handleFileSelected}
              className="hidden"
            />

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-full sm:w-56 h-36 bg-[#120a26] border-3 border-[#f6c445] flex items-center justify-center overflow-hidden shrink-0">
                {resolvedThumbnailImageUrl && resolvedOriginalImageUrl ? (
                  <>
                    <img
                      src={resolvedThumbnailImageUrl}
                      alt={`Gambar sokongan Soalan ${question.id}`}
                      onClick={() => {
                        soundEngine.playButtonClick();
                        setIsSupportImageZoomOpen(true);
                      }}
                      className="w-full h-full object-contain cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playButtonClick();
                        setIsSupportImageZoomOpen(true);
                      }}
                      title="Besarkan gambar sokongan"
                      className="absolute bottom-1.5 right-1.5 px-2 py-0.5 bg-[#16122b]/95 border border-[#facc15] font-pixel font-bold text-[10px] text-[#fde047] flex items-center gap-1 cursor-pointer hover:bg-[#2b1d52]"
                    >
                      <ZoomIn className="w-3 h-3" />
                      <span>BESARKAN</span>
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-2 gap-1 opacity-85">
                    <PixelPortrait mode="object" objectKind={question.objectKind} size={56} />
                    <span className="font-pixel text-[10px] text-[#cbd5e1]">
                      Ikon Objek Lalai (Tiada Gambar Tambahan)
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2.5 w-full">
                <div className="text-xs text-[#e9d5ff] space-y-1">
                  {imageAction.kind === 'upload' && (
                    <p className="text-[#86efac] font-bold">
                      Gambar baharu dipilih: {imageAction.file.name} (
                      {formatBytes(imageAction.file.size)}) — akan disimpan apabila anda menekan
                      SIMPAN DAN KEMBALI.
                    </p>
                  )}
                  {imageAction.kind === 'remove' && (
                    <p className="text-[#fca5a5] font-bold">
                      Gambar sokongan ditandakan untuk dibuang apabila anda menekan SIMPAN DAN
                      KEMBALI.
                    </p>
                  )}
                  {imageAction.kind === 'unchanged' && (
                    <p>
                      {resolvedOriginalImageUrl
                        ? `Gambar sokongan aktif: ${customImageRecord?.fileName ?? slotId}`
                        : 'Belum ada gambar sokongan khas dimuat naik bagi soalan ini.'}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTriggerFileUpload}
                    className="px-3.5 py-2 pixel-btn-gold font-pixel font-bold text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <ImagePlus className="w-4 h-4" />
                    <span>
                      {resolvedOriginalImageUrl ? 'GANTI GAMBAR SOKONGAN' : 'MUAT NAIK GAMBAR SOKONGAN'}
                    </span>
                  </button>

                  {resolvedOriginalImageUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playButtonClick();
                        setImageAction({ kind: 'remove' });
                      }}
                      className="px-3.5 py-2 bg-[#4c1d24] hover:bg-[#6b212c] border-2 border-[#f87171] text-[#fecdd3] font-pixel font-bold text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>BUANG GAMBAR</span>
                    </button>
                  )}

                  {imageAction.kind !== 'unchanged' && (
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playButtonClick();
                        setImageAction({ kind: 'unchanged' });
                      }}
                      className="px-3 py-2 pixel-btn-purple font-pixel font-bold text-xs cursor-pointer whitespace-nowrap"
                    >
                      BATAL PERUBAHAN GAMBAR
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION FOOTER: BATAL & SIMPAN DAN KEMBALI */}
        <div className="px-4 sm:px-6 py-3.5 bg-[#1b1036] border-t-3 border-[#f6c445] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-[#cbd5e1]">
            Markah dan kemajuan pemain tidak akan ditetapkan semula.
          </span>

          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => {
                soundEngine.playButtonClick();
                onCancel();
              }}
              className="px-5 py-2.5 pixel-btn-purple font-pixel font-bold text-xs sm:text-sm cursor-pointer disabled:opacity-50"
            >
              BATAL
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 pixel-btn-emerald font-pixel font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'MENYIMPAN...' : 'SIMPAN DAN KEMBALI'}</span>
            </button>
          </div>
        </div>
      </form>

      {resolvedOriginalImageUrl && (
        <QuestionImageZoomModal
          isOpen={isSupportImageZoomOpen}
          originalImageUrl={resolvedOriginalImageUrl}
          questionId={question.id}
          mission={question.mission}
          title={title || question.title}
          slotId={slotId}
          fileName={
            imageAction.kind === 'upload'
              ? imageAction.file.name
              : customImageRecord?.fileName
          }
          knownNaturalWidth={
            imageAction.kind === 'unchanged' ? customImageRecord?.naturalWidth : undefined
          }
          knownNaturalHeight={
            imageAction.kind === 'unchanged' ? customImageRecord?.naturalHeight : undefined
          }
          onClose={() => setIsSupportImageZoomOpen(false)}
        />
      )}
    </div>
  );
};
