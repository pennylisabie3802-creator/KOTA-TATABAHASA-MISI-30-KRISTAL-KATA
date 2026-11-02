import React, { useState } from 'react';
import { CheckCircle2, Lock, X, ZoomIn } from 'lucide-react';
import {
  GameLogoConfig,
  JournalRecord,
  QuestionImageRecord,
  QuestionImageSlotId,
  QuizQuestion,
} from '../types/game';
import { QUIZ_QUESTIONS } from '../data/questions';
import {
  formatQuestionSlotId,
  getOriginalQuestionImageUrl,
  getThumbnailQuestionImageUrl,
} from '../utils/questionImageStore';
import { GameLogo } from './GameLogo';
import { QuestionImageZoomModal } from './QuestionImageZoomModal';
import { soundEngine } from '../audio/soundEngine';

interface JournalModalProps {
  isOpen: boolean;
  logoConfig: GameLogoConfig;
  completedQuestions: Record<number, JournalRecord>;
  questionImages?: Partial<Record<QuestionImageSlotId, QuestionImageRecord>>;
  onClose: () => void;
}

const MISSION_NAMES: Record<1 | 2 | 3, string> = {
  1: 'Misi 1: Detektif Bahasa',
  2: 'Misi 2: Pemburu Kesalahan',
  3: 'Misi 3: Wira Tatabahasa',
};

export const JournalModal: React.FC<JournalModalProps> = ({
  isOpen,
  logoConfig,
  completedQuestions,
  questionImages,
  onClose,
}) => {
  const [filterMission, setFilterMission] = useState<'ALL' | 1 | 2 | 3>('ALL');
  const [zoomEntry, setZoomEntry] = useState<{
    question: QuizQuestion;
    record: QuestionImageRecord;
    originalUrl: string;
  } | null>(null);

  if (!isOpen) return null;

  const solvedCount = Object.keys(completedQuestions).length;
  const progressPct = Math.round((solvedCount / 30) * 100);
  const filtered = QUIZ_QUESTIONS.filter((q) =>
    filterMission === 'ALL' ? true : q.mission === filterMission
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-5xl max-h-[90vh] pixel-panel-purple flex flex-col overflow-hidden">
        {/* Header with Small Official Logo beside "JURNAL BAHASA" (Section 7) */}
        <div className="p-4 sm:p-5 border-b-3 border-[#f6c445] bg-[#231547] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <GameLogo config={logoConfig} size="xs" softGlow />
            <div className="min-w-0">
              <h2 className="font-pixel font-bold text-xl sm:text-2xl text-[#fde047]">
                JURNAL BAHASA
              </h2>
              <p className="text-xs sm:text-sm text-[#e9d5ff]">
                Kemajuan Pembelajaran:{' '}
                <span className="font-mono-num font-bold text-white">{solvedCount} / 30</span> (
                <span className="font-mono-num font-bold text-[#7dd3fc]">{progressPct}%</span>)
              </p>
              <div className="mt-1.5 w-48 sm:w-64 h-2 bg-[#120b24] border border-[#7c3aed] overflow-hidden">
                <div
                  style={{ width: `${progressPct}%` }}
                  className="h-full bg-gradient-to-r from-[#38bdf8] via-[#a855f7] to-[#fde047] transition-all duration-300"
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playButtonClick();
              onClose();
            }}
            className="w-10 h-10 pixel-btn-purple flex items-center justify-center cursor-pointer shrink-0"
            aria-label="Tutup Jurnal Bahasa"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 py-2.5 bg-[#1b1036] border-b-2 border-[#4c3385] flex flex-wrap gap-2">
          {(
            [
              { id: 'ALL', label: 'Semua (1–30)' },
              { id: 1, label: 'Misi 1 (1–10)' },
              { id: 2, label: 'Misi 2 (11–20)' },
              { id: 3, label: 'Misi 3 (21–30)' },
            ] as const
          ).map((tab) => (
            <button
              key={String(tab.id)}
              type="button"
              onClick={() => {
                soundEngine.playButtonHover();
                setFilterMission(tab.id);
              }}
              className={`px-3.5 py-1.5 font-pixel font-bold text-xs sm:text-sm border-2 cursor-pointer whitespace-nowrap ${
                filterMission === tab.id
                  ? 'bg-[#facc15] text-[#261505] border-[#4a2806]'
                  : 'bg-[#2b1d52] text-[#e9d5ff] border-[#5b3ea8] hover:border-[#a78bfa]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Entries List */}
        <div className="p-4 sm:p-5 overflow-y-auto pixel-scroll space-y-3 flex-1 bg-[#26194a]">
          {filtered.map((q) => {
            const rec = completedQuestions[q.id];
            const slotId = formatQuestionSlotId(q.id);
            const customImg = questionImages?.[slotId];

            if (!rec) {
              return (
                <div
                  key={q.id}
                  className="p-3.5 bg-[#1a1133] border-2 border-[#4c3385] flex items-center justify-between gap-3 opacity-80"
                >
                  <div>
                    <span className="text-xs font-bold text-[#a78bfa]">
                      {MISSION_NAMES[q.mission]} · SOALAN {q.id}
                    </span>
                    <p className="font-pixel font-bold text-base text-[#cbd5e1]">{q.title}</p>
                  </div>
                  <span className="text-xs font-semibold text-[#94a3b8] flex items-center gap-1.5 shrink-0">
                    <Lock className="w-4 h-4" /> Belum Disiasat
                  </span>
                </div>
              );
            }

            return (
              <div key={q.id} className="pixel-panel-parchment p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-[#d6c096]">
                  <span className="font-pixel font-bold text-sm sm:text-base text-[#581c87]">
                    {MISSION_NAMES[q.mission].toUpperCase()} · SOALAN {q.id}
                  </span>
                  <span className="text-xs font-bold text-[#047857] flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Selesai (+{rec.pointsEarned} Mata)
                  </span>
                </div>

                {customImg &&
                  customImg.questionId === q.id &&
                  getOriginalQuestionImageUrl(customImg) && (
                    <button
                      type="button"
                      onClick={() => {
                        const origUrl = getOriginalQuestionImageUrl(customImg);
                        if (!origUrl) return;
                        soundEngine.playButtonClick();
                        setZoomEntry({
                          question: q,
                          record: customImg,
                          originalUrl: origUrl,
                        });
                      }}
                      title="Klik untuk besarkan gambar soalan"
                      className="relative w-full p-2 bg-[#120a26] border-2 border-[#7c4a21] hover:border-[#d97706] flex items-center justify-center cursor-pointer group"
                    >
                      <img
                        src={getThumbnailQuestionImageUrl(customImg) || customImg.imageUrl}
                        alt={q.title}
                        className="max-h-36 object-contain"
                      />
                      <span className="absolute bottom-2 right-2 px-2.5 py-0.5 bg-[#16122b]/95 border border-[#facc15] font-pixel font-bold text-[10px] text-[#fde047] flex items-center gap-1 group-hover:bg-[#2b1d52]">
                        <ZoomIn className="w-3 h-3" />
                        <span>BESARKAN</span>
                      </span>
                    </button>
                  )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="p-2.5 bg-[#fee2e2] border border-[#fca5a5]">
                    <span className="block text-xs font-extrabold text-[#991b1b]">KESALAHAN:</span>
                    <p className="font-bold text-[#450a0a] mt-0.5">{q.kesalahanAsal}</p>
                  </div>
                  <div className="p-2.5 bg-[#d1fae5] border border-[#6ee7b7]">
                    <span className="block text-xs font-extrabold text-[#065f46]">PEMBETULAN:</span>
                    <p className="font-extrabold text-[#064e3b] mt-0.5">{q.pembetulanPenuh}</p>
                  </div>
                </div>

                <div className="pt-1">
                  <span className="text-xs font-extrabold text-[#6d28d9]">JUSTIFIKASI:</span>
                  <p className="text-xs sm:text-sm font-medium text-[#291509] leading-relaxed">
                    {q.justifikasi}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {zoomEntry && (
        <QuestionImageZoomModal
          isOpen
          originalImageUrl={zoomEntry.originalUrl}
          questionId={zoomEntry.question.id}
          mission={zoomEntry.question.mission}
          title={zoomEntry.question.title}
          slotId={zoomEntry.record.slotId}
          fileName={zoomEntry.record.fileName}
          knownNaturalWidth={zoomEntry.record.naturalWidth}
          knownNaturalHeight={zoomEntry.record.naturalHeight}
          onClose={() => setZoomEntry(null)}
        />
      )}
    </div>
  );
};
