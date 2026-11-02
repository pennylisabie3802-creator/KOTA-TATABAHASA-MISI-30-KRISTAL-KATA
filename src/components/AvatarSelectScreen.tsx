import React, { useState } from 'react';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';
import { AvatarAnimState, AvatarId } from '../types/game';
import { PixelPortrait } from './PixelPortrait';
import { soundEngine } from '../audio/soundEngine';

interface AvatarSelectScreenProps {
  initialAvatar: AvatarId;
  initialName: string;
  onBack: () => void;
  onConfirm: (avatarId: AvatarId, playerName: string) => void;
}

const ANIM_PREVIEWS: { id: AvatarAnimState; label: string }[] = [
  { id: 'idle', label: 'Sedia (Idle)' },
  { id: 'walk', label: 'Berjalan' },
  { id: 'interact', label: 'Berinteraksi' },
  { id: 'happy', label: 'Gembira' },
  { id: 'reward', label: 'Ganjaran' },
];

export const AvatarSelectScreen: React.FC<AvatarSelectScreenProps> = ({
  initialAvatar,
  initialName,
  onBack,
  onConfirm,
}) => {
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarId>(initialAvatar);
  const [nickname, setNickname] = useState<string>(
    initialName && initialName !== 'Wira Bahasa' ? initialName : ''
  );
  const [previewAnim, setPreviewAnim] = useState<AvatarAnimState>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playButtonClick();
    const cleanName =
      nickname.trim() ||
      (selectedAvatar === 'wira_bahasa' ? 'Wira Bahasa' : 'Wira Tatabahasa');
    onConfirm(selectedAvatar, cleanName.slice(0, 18));
  };

  return (
    <div className="w-full h-full bg-gradient-to-b from-[#1e1b4b] via-[#2b1d52] to-[#172554] flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-4xl pixel-panel-purple p-5 md:p-7 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b-2 border-[#5b3ea8]">
          <button
            type="button"
            onClick={() => {
              soundEngine.playButtonClick();
              onBack();
            }}
            className="px-3 py-1.5 pixel-btn-purple font-pixel font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>MENU UTAMA</span>
          </button>

          <div className="text-center">
            <h2 className="font-pixel font-bold text-2xl md:text-3xl text-[#fde047]">
              PEMILIHAN AVATAR WIRA
            </h2>
            <p className="text-xs sm:text-sm text-[#e9d5ff]">
              Pilih watak pengembara dan masukkan nama panggilan untuk memulakan misi!
            </p>
          </div>

          <div className="w-24 hidden sm:block" />
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Two Avatar Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Avatar 1: Wira Bahasa */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playButtonClick();
                setSelectedAvatar('wira_bahasa');
              }}
              className={`p-4 text-left transition-transform cursor-pointer border-4 ${
                selectedAvatar === 'wira_bahasa'
                  ? 'bg-[#3b2770] border-[#fde047] shadow-[0_0_0_3px_#9333ea]'
                  : 'bg-[#211540] border-[#4c3385] hover:border-[#a78bfa]'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-[#16122b] border-2 border-[#f6c445]">
                  <PixelPortrait
                    mode="avatar"
                    avatarId="wira_bahasa"
                    anim={selectedAvatar === 'wira_bahasa' ? previewAnim : 'idle'}
                    size={96}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-pixel font-bold text-xl text-[#fde047]">
                      1. Wira Bahasa
                    </h3>
                    {selectedAvatar === 'wira_bahasa' && (
                      <span className="px-2 py-0.5 bg-[#22c55e] text-[#052e16] font-pixel font-bold text-xs flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> DIPILIH
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs sm:text-sm text-[#f3e8ff] leading-relaxed">
                    Pengembara lelaki berambut coklat dengan pakaian biru diraja, jubah merah berkibar, dan buku siasatan bahasa.
                  </p>
                </div>
              </div>
            </button>

            {/* Avatar 2: Wira Tatabahasa */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playButtonClick();
                setSelectedAvatar('wira_tatabahasa');
              }}
              className={`p-4 text-left transition-transform cursor-pointer border-4 ${
                selectedAvatar === 'wira_tatabahasa'
                  ? 'bg-[#3b2770] border-[#fde047] shadow-[0_0_0_3px_#9333ea]'
                  : 'bg-[#211540] border-[#4c3385] hover:border-[#a78bfa]'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-[#16122b] border-2 border-[#f6c445]">
                  <PixelPortrait
                    mode="avatar"
                    avatarId="wira_tatabahasa"
                    anim={selectedAvatar === 'wira_tatabahasa' ? previewAnim : 'idle'}
                    size={96}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-pixel font-bold text-xl text-[#f9a8d4]">
                      2. Wira Tatabahasa
                    </h3>
                    {selectedAvatar === 'wira_tatabahasa' && (
                      <span className="px-2 py-0.5 bg-[#22c55e] text-[#052e16] font-pixel font-bold text-xs flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> DIPILIH
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs sm:text-sm text-[#f3e8ff] leading-relaxed">
                    Pengembara perempuan bertudung merah jambu ceria dengan persalinan ungu keemasan serta kitab tatabahasa ajaib.
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Animation Tester Strip */}
          <div className="p-3 bg-[#1d1338] border-2 border-[#5b3ea8] flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#fde047] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Uji Animasi Watak:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {ANIM_PREVIEWS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playButtonHover();
                    setPreviewAnim(item.id);
                  }}
                  className={`px-3 py-1 text-xs font-pixel font-bold cursor-pointer whitespace-nowrap border-2 ${
                    previewAnim === item.id
                      ? 'bg-[#facc15] text-[#261505] border-[#4a2806]'
                      : 'bg-[#2b1d52] text-[#e9d5ff] border-[#5b3ea8] hover:border-[#a78bfa]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Safe Nickname Input + Submit */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-7">
              <label
                htmlFor="nama-panggilan"
                className="block font-pixel font-bold text-sm text-[#fde047] mb-1.5"
              >
                Nama Panggilan Wira (Pilihan — Jangan masukkan maklumat peribadi):
              </label>
              <input
                id="nama-panggilan"
                type="text"
                maxLength={18}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={
                  selectedAvatar === 'wira_bahasa'
                    ? 'Contoh: Arif / Wira Bahasa'
                    : 'Contoh: Nurul / Wira Tatabahasa'
                }
                className="w-full px-4 py-3 bg-[#fff8e7] text-[#261505] font-body font-bold text-base border-4 border-[#7c4a21] focus:outline-none focus:border-[#facc15]"
              />
            </div>

            <div className="md:col-span-5">
              <button
                type="submit"
                className="w-full py-3.5 px-6 pixel-btn-gold font-pixel font-bold text-base sm:text-lg cursor-pointer whitespace-nowrap"
              >
                SIMPAN & MULAKAN PENGEMBARAAN
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
