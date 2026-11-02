import React, { useState } from 'react';
import { Edit3, Save, X } from 'lucide-react';
import { GameLogoConfig } from '../types/game';
import { GameLogo } from './GameLogo';
import { soundEngine } from '../audio/soundEngine';

interface CreditsModalProps {
  isOpen: boolean;
  logoConfig: GameLogoConfig;
  onClose: () => void;
}

interface CustomCreditsInfo {
  developerName: string;
  projectName: string;
  institution: string;
  developmentYear: string;
}

const CREDITS_STORAGE_KEY = 'kota_tatabahasa_credits_v1';

const DEFAULT_CREDITS_INFO: CustomCreditsInfo = {
  developerName: '',
  projectName: 'Kota Tatabahasa: Misi 30 Kristal Kata',
  institution: '',
  developmentYear: '',
};

function loadCreditsInfo(): CustomCreditsInfo {
  try {
    const raw = localStorage.getItem(CREDITS_STORAGE_KEY);
    if (!raw) return DEFAULT_CREDITS_INFO;
    const parsed = JSON.parse(raw) as Partial<CustomCreditsInfo>;
    return {
      developerName: typeof parsed.developerName === 'string' ? parsed.developerName : '',
      projectName:
        typeof parsed.projectName === 'string' && parsed.projectName.trim()
          ? parsed.projectName
          : DEFAULT_CREDITS_INFO.projectName,
      institution: typeof parsed.institution === 'string' ? parsed.institution : '',
      developmentYear: typeof parsed.developmentYear === 'string' ? parsed.developmentYear : '',
    };
  } catch {
    return DEFAULT_CREDITS_INFO;
  }
}

/**
 * HALAMAN KREDIT PERMAINAN ("KREDIT PERMAINAN" — Section 9)
 * - Displays the official logo at the top-center.
 * - Shows "KOTA TATABAHASA: MISI 30 KRISTAL KATA" and
 *   "AYUH BERMAIN, AYUH BERBAHASA, TATABAHASA KITA KUASAI!" below the logo.
 * - Provides dedicated slots for Nama pembangun, Nama projek, Institusi, and Tahun pembangunan
 *   WITHOUT inventing any fake developer/institution details, allowing user/developer to fill & save.
 */
export const CreditsModal: React.FC<CreditsModalProps> = ({
  isOpen,
  logoConfig,
  onClose,
}) => {
  const [credits, setCredits] = useState<CustomCreditsInfo>(() => loadCreditsInfo());
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<CustomCreditsInfo>(() => loadCreditsInfo());

  if (!isOpen) return null;

  const handleSaveCredits = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playCrystalGain();
    const cleaned: CustomCreditsInfo = {
      developerName: draft.developerName.trim(),
      projectName: draft.projectName.trim() || DEFAULT_CREDITS_INFO.projectName,
      institution: draft.institution.trim(),
      developmentYear: draft.developmentYear.trim(),
    };
    setCredits(cleaned);
    try {
      localStorage.setItem(CREDITS_STORAGE_KEY, JSON.stringify(cleaned));
    } catch {
      // Ignore storage errors
    }
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-55 bg-black/75 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-2xl max-h-[90vh] pixel-panel-purple flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="px-4 py-3.5 bg-[#231547] border-b-3 border-[#f6c445] flex items-center justify-between gap-3">
          <h2 className="font-pixel font-bold text-xl sm:text-2xl text-[#fde047]">
            KREDIT PERMAINAN
          </h2>
          <button
            type="button"
            onClick={() => {
              soundEngine.playButtonClick();
              setIsEditing(false);
              onClose();
            }}
            className="w-9 h-9 pixel-btn-purple flex items-center justify-center cursor-pointer"
            aria-label="Tutup Kredit Permainan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto pixel-scroll bg-[#1b1036] space-y-5 flex-1">
          {/* Top-Center Official Logo + Game Title & Motto */}
          <div className="flex flex-col items-center text-center space-y-3">
            <GameLogo
              config={logoConfig}
              size="lg"
              fadeIn
              floating
              softGlow
              sparkles
            />

            <div className="space-y-1.5 pt-1">
              <h3 className="font-pixel font-bold text-lg sm:text-2xl text-[#fde047] drop-shadow-[0_2px_0_#120826]">
                KOTA TATABAHASA: MISI 30 KRISTAL KATA
              </h3>
              <p className="font-pixel font-bold text-xs sm:text-sm text-[#fef08a] leading-relaxed">
                AYUH BERMAIN, AYUH BERBAHASA, TATABAHASA KITA KUASAI!
              </p>
            </div>
          </div>

          {/* Dedicated Credits Fields (Zero Fabricated Info) */}
          {!isEditing ? (
            <div className="pixel-panel-parchment p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#d6c096]">
                <span className="font-pixel font-bold text-sm text-[#581c87]">
                  MAKLUMAT PEMBANGUNAN PROJEK
                </span>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playButtonClick();
                    setDraft(credits);
                    setIsEditing(true);
                  }}
                  className="px-3 py-1 pixel-btn-purple font-pixel font-bold text-[11px] flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Edit3 className="w-3.5 h-3.5 shrink-0" />
                  <span>ISI / SUNTING</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="p-3 bg-[#fffbeb] border-2 border-[#d97706]">
                  <span className="block font-pixel font-bold text-[11px] text-[#92400e]">
                    NAMA PEMBANGUN
                  </span>
                  <p className="mt-1 font-bold text-[#291509] min-h-[20px]">
                    {credits.developerName || (
                      <span className="italic font-normal text-[#78716c]">
                        Ruang disediakan — klik Isi / Sunting
                      </span>
                    )}
                  </p>
                </div>

                <div className="p-3 bg-[#fffbeb] border-2 border-[#d97706]">
                  <span className="block font-pixel font-bold text-[11px] text-[#92400e]">
                    NAMA PROJEK
                  </span>
                  <p className="mt-1 font-bold text-[#291509] min-h-[20px]">
                    {credits.projectName}
                  </p>
                </div>

                <div className="p-3 bg-[#fffbeb] border-2 border-[#d97706]">
                  <span className="block font-pixel font-bold text-[11px] text-[#92400e]">
                    INSTITUSI
                  </span>
                  <p className="mt-1 font-bold text-[#291509] min-h-[20px]">
                    {credits.institution || (
                      <span className="italic font-normal text-[#78716c]">
                        Ruang disediakan — klik Isi / Sunting
                      </span>
                    )}
                  </p>
                </div>

                <div className="p-3 bg-[#fffbeb] border-2 border-[#d97706]">
                  <span className="block font-pixel font-bold text-[11px] text-[#92400e]">
                    TAHUN PEMBANGUNAN
                  </span>
                  <p className="mt-1 font-bold text-[#291509] min-h-[20px]">
                    {credits.developmentYear || (
                      <span className="italic font-normal text-[#78716c]">
                        Ruang disediakan — klik Isi / Sunting
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSaveCredits}
              className="pixel-panel-parchment p-4 sm:p-5 space-y-3 text-xs sm:text-sm"
            >
              <div className="font-pixel font-bold text-sm text-[#581c87] pb-1 border-b border-[#d6c096]">
                KEMAS KINI MAKLUMAT KREDIT PERMAINAN
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="font-pixel font-bold text-[11px] text-[#7c2d12]">
                    Nama Pembangun:
                  </span>
                  <input
                    type="text"
                    value={draft.developerName}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, developerName: e.target.value }))
                    }
                    placeholder="Masukkan nama pembangun"
                    className="w-full px-3 py-2 bg-white border-2 border-[#92400e] text-[#1c1917] font-semibold focus:outline-none focus:border-[#6d28d9]"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="font-pixel font-bold text-[11px] text-[#7c2d12]">
                    Nama Projek:
                  </span>
                  <input
                    type="text"
                    value={draft.projectName}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, projectName: e.target.value }))
                    }
                    placeholder="Kota Tatabahasa: Misi 30 Kristal Kata"
                    className="w-full px-3 py-2 bg-white border-2 border-[#92400e] text-[#1c1917] font-semibold focus:outline-none focus:border-[#6d28d9]"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="font-pixel font-bold text-[11px] text-[#7c2d12]">
                    Institusi:
                  </span>
                  <input
                    type="text"
                    value={draft.institution}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, institution: e.target.value }))
                    }
                    placeholder="Masukkan nama institusi"
                    className="w-full px-3 py-2 bg-white border-2 border-[#92400e] text-[#1c1917] font-semibold focus:outline-none focus:border-[#6d28d9]"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="font-pixel font-bold text-[11px] text-[#7c2d12]">
                    Tahun Pembangunan:
                  </span>
                  <input
                    type="text"
                    value={draft.developmentYear}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, developmentYear: e.target.value }))
                    }
                    placeholder="Masukkan tahun pembangunan"
                    className="w-full px-3 py-2 bg-white border-2 border-[#92400e] text-[#1c1917] font-semibold focus:outline-none focus:border-[#6d28d9]"
                  />
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playButtonClick();
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 pixel-btn-wood font-pixel font-bold text-xs cursor-pointer"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 pixel-btn-gold font-pixel font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4 shrink-0" />
                  <span>SIMPAN MAKLUMAT</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
