import React, { useEffect, useState } from 'react';
import { ChevronRight, FastForward, MessageSquare, X } from 'lucide-react';
import { DynamicNpcDialogueResult, MapSign, NpcDialogueOption } from '../types/game';
import { PixelPortrait } from './PixelPortrait';
import { soundEngine } from '../audio/soundEngine';

interface NpcDialogModalProps {
  dialogue: DynamicNpcDialogueResult | null;
  sign: MapSign | null;
  onClose: () => void;
  onSelectOptionAction: (action: NonNullable<NpcDialogueOption['action']>) => void;
}

export const NpcDialogModal: React.FC<NpcDialogModalProps> = ({
  dialogue,
  sign,
  onClose,
  onSelectOptionAction,
}) => {
  const [pages, setPages] = useState<string[]>([]);
  const [pageIdx, setPageIdx] = useState(0);
  const [displayedChars, setDisplayedChars] = useState(0);
  const [reactNonce, setReactNonce] = useState(0);
  const [activeOptionId, setActiveOptionId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<NpcDialogueOption['action'] | undefined>(
    undefined
  );

  useEffect(() => {
    if (dialogue) {
      setPages(dialogue.greetingPages);
      setPageIdx(0);
      setDisplayedChars(0);
      setActiveOptionId(null);
      setPendingAction(undefined);
      setReactNonce((n) => n + 1);
    } else if (sign) {
      setPages(sign.lines);
      setPageIdx(0);
      setDisplayedChars(0);
      setActiveOptionId(null);
      setPendingAction(undefined);
    }
  }, [dialogue, sign]);

  const fullText = pages[pageIdx] ?? '';
  const isTyping = displayedChars < fullText.length;
  const activeChar = isTyping ? fullText[displayedChars] : undefined;

  // Typewriter text reveal ("Teks muncul secara berperingkat" + voice blip)
  useEffect(() => {
    if (!dialogue && !sign) return;
    if (!fullText) return;
    if (displayedChars >= fullText.length) return;

    // Slight natural pause on sentence punctuation so NPC lip-sync pauses realistically!
    const prevChar = displayedChars > 0 ? fullText[displayedChars - 1] : '';
    const delayMs = /[.,!?;:]/.test(prevChar) ? 95 : 24;

    const timer = window.setTimeout(() => {
      const nextCount = Math.min(fullText.length, displayedChars + 2);
      setDisplayedChars(nextCount);
      if (dialogue && nextCount % 6 === 0) {
        soundEngine.playVoiceBlip();
      }
    }, delayMs);

    return () => clearTimeout(timer);
  }, [dialogue, sign, fullText, displayedChars]);

  if (!dialogue && !sign) return null;

  const isLastPage = pageIdx >= pages.length - 1;

  const handleSkipTyping = () => {
    soundEngine.playButtonClick();
    setDisplayedChars(fullText.length);
  };

  const handleNextOrFinish = () => {
    if (isTyping) {
      handleSkipTyping();
      return;
    }
    soundEngine.playButtonClick();
    if (!isLastPage) {
      setPageIdx((i) => i + 1);
      setDisplayedChars(0);
      return;
    }
    if (pendingAction) {
      onSelectOptionAction(pendingAction);
    } else {
      onClose();
    }
  };

  const handleChooseOption = (opt: NpcDialogueOption) => {
    soundEngine.playNpcInteract();
    setActiveOptionId(opt.id);
    setPages(opt.responsePages);
    setPageIdx(0);
    setDisplayedChars(0);
    setPendingAction(opt.action);
    setReactNonce((n) => n + 1);
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/60 flex items-end sm:items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-3xl pixel-panel-purple p-4 sm:p-6 space-y-4">
        {/* Top Bar: NPC / Sign Header */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b-2 border-[#5b3ea8]">
          <div>
            <h3 className="font-pixel font-bold text-xl sm:text-2xl text-[#fde047]">
              {dialogue ? dialogue.npcName : sign?.title}
            </h3>
            <p className="text-xs text-[#d8b4fe]">
              {dialogue
                ? `${dialogue.npcRole} · ${dialogue.moodBadge}`
                : 'Papan Maklumat & Catatan Persekitaran'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              soundEngine.playButtonClick();
              onClose();
            }}
            className="w-9 h-9 pixel-btn-purple flex items-center justify-center cursor-pointer"
            aria-label="Tutup Dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Animated Portrait Stage + Speech Box */}
        <div className="pixel-panel-parchment p-4 sm:p-5 flex flex-col sm:flex-row items-center sm:items-start gap-4">
          {dialogue ? (
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playNpcInteract();
                  setReactNonce((n) => n + 1);
                }}
                title="Klik potret untuk sapaan NPC!"
                className="p-1.5 bg-[#2b1d52] border-3 border-[#f6c445] hover:border-[#fde047] transition-transform active:translate-y-0.5 cursor-pointer relative"
              >
                <PixelPortrait
                  mode="npc"
                  npcKind={dialogue.spriteKind}
                  talking={isTyping}
                  activeChar={activeChar}
                  reactNonce={reactNonce}
                  interactiveStage
                  size={96}
                />
              </button>

              {/* Sharp Pixel Status Bar under Portrait (Talking Voice Meter vs Idle Listening) */}
              <div className="w-full px-2 py-1 bg-[#241645] border-2 border-[#5b3ea8] flex items-center justify-center gap-1.5">
                {isTyping ? (
                  <>
                    <span className="flex items-end gap-0.5 h-3" aria-hidden="true">
                      <span
                        style={{ height: displayedChars % 4 === 0 ? '10px' : '5px' }}
                        className="w-1 bg-[#fde047] transition-all duration-75"
                      />
                      <span
                        style={{ height: displayedChars % 3 === 0 ? '12px' : '6px' }}
                        className="w-1 bg-[#38bdf8] transition-all duration-75"
                      />
                      <span
                        style={{ height: displayedChars % 4 === 2 ? '11px' : '4px' }}
                        className="w-1 bg-[#fde047] transition-all duration-75"
                      />
                    </span>
                    <span className="font-pixel font-bold text-[10px] text-[#fde047] tracking-wide">
                      BERCAKAP
                    </span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 bg-[#4ade80] animate-pulse" aria-hidden="true" />
                    <span className="font-pixel font-bold text-[10px] text-[#e9d5ff] tracking-wide">
                      MENDENGAR
                    </span>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="p-2 bg-[#2b1d52] border-3 border-[#f6c445] shrink-0">
              <PixelPortrait mode="object" objectKind="signpost" size={88} />
            </div>
          )}

          <div className="flex-1 w-full">
            <div className="flex items-center justify-between text-xs text-[#78350f] mb-1.5 font-semibold">
              <span>{activeOptionId ? 'Maklum Balas Perbualan' : 'Dialog Semasa'}</span>
              <span className="font-mono-num">
                Halaman {pageIdx + 1} / {pages.length}
              </span>
            </div>

            <p className="font-body font-bold text-base sm:text-lg text-[#261505] leading-relaxed min-h-[4.25rem]">
              “{fullText.slice(0, displayedChars)}”
              {isTyping && (
                <span className="inline-block w-2 h-4 ml-1 bg-[#78350f] animate-pulse align-middle" />
              )}
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
              {isTyping && (
                <button
                  type="button"
                  onClick={handleSkipTyping}
                  className="px-3.5 py-2 pixel-btn-blue font-pixel font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <FastForward className="w-3.5 h-3.5" />
                  <span>LANGKAU TEKS</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNextOrFinish}
                className="px-5 py-2.5 pixel-btn-gold font-pixel font-bold text-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <span>
                  {!isLastPage
                    ? 'SETERUSNYA'
                    : pendingAction
                    ? 'TERUSKAN TINDAKAN'
                    : 'TUTUP PERBUALAN'}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Branching Dialogue Options (Shown for NPCs) */}
        {dialogue && dialogue.options.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-bold text-[#fde047] flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Pilihan Topik Perbualan (Mengikut Kemajuan Semasa Anda):</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {dialogue.options.map((opt) => {
                const isSelected = activeOptionId === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleChooseOption(opt)}
                    className={`px-3.5 py-2.5 text-left font-body font-semibold text-xs sm:text-sm border-2 transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-[#facc15] text-[#261505] border-[#4a2806]'
                        : 'bg-[#1f143d] text-[#f3e8ff] border-[#6d28d9] hover:border-[#fde047]'
                    }`}
                  >
                    <span>▸ {opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
