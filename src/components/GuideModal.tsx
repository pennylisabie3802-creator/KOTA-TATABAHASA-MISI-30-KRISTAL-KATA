import React from 'react';
import { X } from 'lucide-react';
import { GameLogoConfig } from '../types/game';
import { GameLogo } from './GameLogo';
import { soundEngine } from '../audio/soundEngine';

interface GuideModalProps {
  isOpen: boolean;
  logoConfig: GameLogoConfig;
  onClose: () => void;
}

interface GuideTopic {
  id: string;
  number: string;
  title: string;
  description: string;
  accentBorder: string;
  icon: React.ReactNode;
}

const PixelMoveIcon: React.FC = () => (
  <svg viewBox="0 0 16 16" className="w-7 h-7 shrink-0 pixelated" aria-hidden="true">
    <rect x="6" y="1" width="4" height="4" fill="#fde047" />
    <rect x="1" y="6" width="4" height="4" fill="#38bdf8" />
    <rect x="6" y="6" width="4" height="4" fill="#a855f7" />
    <rect x="11" y="6" width="4" height="4" fill="#38bdf8" />
    <rect x="6" y="11" width="4" height="4" fill="#38bdf8" />
  </svg>
);

const PixelInteractIcon: React.FC = () => (
  <svg viewBox="0 0 16 16" className="w-7 h-7 shrink-0 pixelated" aria-hidden="true">
    <rect x="2" y="2" width="12" height="9" fill="#f8fafc" />
    <rect x="3" y="3" width="10" height="7" fill="#fef08a" />
    <rect x="5" y="11" width="3" height="3" fill="#fde047" />
    <rect x="5" y="5" width="6" height="1" fill="#581c87" />
    <rect x="5" y="7" width="4" height="1" fill="#581c87" />
  </svg>
);

const PixelQuizIcon: React.FC = () => (
  <svg viewBox="0 0 16 16" className="w-7 h-7 shrink-0 pixelated" aria-hidden="true">
    <rect x="3" y="1" width="10" height="14" fill="#fef3c7" />
    <rect x="4" y="3" width="8" height="2" fill="#7c3aed" />
    <rect x="4" y="7" width="2" height="2" fill="#22c55e" />
    <rect x="7" y="7" width="5" height="2" fill="#334155" />
    <rect x="4" y="11" width="2" height="2" fill="#f59e0b" />
    <rect x="7" y="11" width="5" height="2" fill="#334155" />
  </svg>
);

const PixelCrystalIcon: React.FC = () => (
  <svg viewBox="0 0 16 16" className="w-7 h-7 shrink-0 pixelated" aria-hidden="true">
    <rect x="7" y="1" width="2" height="2" fill="#e0f2fe" />
    <rect x="5" y="3" width="6" height="3" fill="#38bdf8" />
    <rect x="4" y="6" width="8" height="4" fill="#0284c7" />
    <rect x="5" y="10" width="6" height="3" fill="#0369a1" />
    <rect x="7" y="13" width="2" height="2" fill="#fde047" />
    <rect x="6" y="4" width="2" height="3" fill="#ffffff" />
  </svg>
);

const PixelBagIcon: React.FC = () => (
  <svg viewBox="0 0 16 16" className="w-7 h-7 shrink-0 pixelated" aria-hidden="true">
    <rect x="5" y="2" width="6" height="2" fill="#b45309" />
    <rect x="3" y="4" width="10" height="10" fill="#d97706" />
    <rect x="4" y="5" width="8" height="4" fill="#fbbf24" />
    <rect x="7" y="7" width="2" height="3" fill="#fef08a" />
    <rect x="4" y="10" width="8" height="3" fill="#92400e" />
  </svg>
);

const PixelWorldMapIcon: React.FC = () => (
  <svg viewBox="0 0 16 16" className="w-7 h-7 shrink-0 pixelated" aria-hidden="true">
    <rect x="1" y="3" width="4" height="11" fill="#4ade80" />
    <rect x="6" y="2" width="4" height="11" fill="#86efac" />
    <rect x="11" y="3" width="4" height="11" fill="#22c55e" />
    <rect x="7" y="4" width="2" height="3" fill="#ef4444" />
    <rect x="7" y="7" width="2" height="1" fill="#fde047" />
  </svg>
);

const GUIDE_TOPICS: GuideTopic[] = [
  {
    id: 'bergerak',
    number: '01',
    title: 'Cara Bergerak',
    description:
      'Gunakan kekunci W, A, S, D, Anak Panah, atau Kayu Ria Maya pada skrin mudah alih. Anda juga boleh menekan terus mana-mana lokasi pada peta (Click-to-Move) dan avatar akan mengikut garis laluan bernombor secara automatik mengelakkan bangunan serta sungai.',
    accentBorder: 'border-[#38bdf8]',
    icon: <PixelMoveIcon />,
  },
  {
    id: 'berinteraksi',
    number: '02',
    title: 'Cara Berinteraksi',
    description:
      'Hampiri NPC, papan tanda, buku ajaib, atau objek bercahaya dan tekan kekunci E / Ruang (atau butang SIASAT). Dengan Click-to-Move, menekan NPC akan membuka dialog automatik apabila tiba, manakala menekan pintu memaparkan pilihan MASUK.',
    accentBorder: 'border-[#fde047]',
    icon: <PixelInteractIcon />,
  },
  {
    id: 'kuiz',
    number: '03',
    title: 'Cara Menjawab Kuiz',
    description:
      'Setiap objek siasatan mengandungi cabaran aneka pilihan (A, B, C, D) atau isi tempat kosong. Gunakan butang PETUNJUK jika memerlukan bimbingan, dan baca panel Ilmu Bahasa Diperoleh untuk memahami kesalahan asal, pembetulan, serta justifikasi tatabahasa.',
    accentBorder: 'border-[#c084fc]',
    icon: <PixelQuizIcon />,
  },
  {
    id: 'kristal',
    number: '04',
    title: 'Cara Mengumpul Kristal Kata',
    description:
      'Terdapat 30 Kristal Kata yang perlu dipulihkan mengikut urutan misi: Misi 1 Detektif Bahasa (Soalan 1–10), Misi 2 Pemburu Kesalahan (Soalan 11–20), dan Misi 3 Wira Tatabahasa (Soalan 21–30). Setiap jawapan tepat menyalakan satu Kristal Kata!',
    accentBorder: 'border-[#38bdf8]',
    icon: <PixelCrystalIcon />,
  },
  {
    id: 'inventori',
    number: '05',
    title: 'Cara Membuka Inventori',
    description:
      'Tekan butang INVENTORI pada Menu Utama atau bar navigasi bawah permainan untuk menyemak jumlah Kristal Kata yang dikumpul, tahap wira, tiga Lencana Misi Utama, serta lima Lencana Penerokaan sampingan.',
    accentBorder: 'border-[#f59e0b]',
    icon: <PixelBagIcon />,
  },
  {
    id: 'peta_dunia',
    number: '06',
    title: 'Cara Menggunakan Peta Dunia',
    description:
      'Tekan butang PETA KOTA / PETA DUNIA untuk melihat kesemua lapan lokasi Kerajaan Tatabahasa, menyemak status penerokaan setiap kawasan (Belum Dilawati, Sedang Diterokai, atau Telah Diterokai), dan mengembara terus ke lokasi pilihan.',
    accentBorder: 'border-[#4ade80]',
    icon: <PixelWorldMapIcon />,
  },
];

/**
 * MENU PANDUAN / "PANDUAN PENGEMBARAAN" (Section 6)
 * - Displays the official logo at the top in moderate size (not oversized).
 * - Heading "PANDUAN PENGEMBARAAN" below the logo.
 * - Covers all 6 core gameplay mechanics with pixel-art icons.
 */
export const GuideModal: React.FC<GuideModalProps> = ({
  isOpen,
  logoConfig,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-55 bg-black/75 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-4xl max-h-[90vh] pixel-panel-purple flex flex-col overflow-hidden my-auto">
        {/* Top Bar with Moderate Official Logo & Title */}
        <div className="relative p-4 sm:p-5 bg-[#231547] border-b-3 border-[#f6c445] flex flex-col items-center text-center">
          <button
            type="button"
            onClick={() => {
              soundEngine.playButtonClick();
              onClose();
            }}
            className="absolute top-3.5 right-3.5 w-10 h-10 pixel-btn-purple flex items-center justify-center cursor-pointer"
            aria-label="Tutup Panduan Pengembaraan"
          >
            <X className="w-5 h-5" />
          </button>

          <GameLogo
            config={logoConfig}
            size="sm"
            softGlow
            sparkles
          />

          <h2 className="mt-2.5 font-pixel font-bold text-xl sm:text-2xl text-[#fde047] drop-shadow-[0_2px_0_#1e1b4b]">
            PANDUAN PENGEMBARAAN
          </h2>
          <p className="text-xs sm:text-sm text-[#e9d5ff] mt-0.5">
            Rujukan Lengkap Wira Bahasa untuk Menyelamatkan Kota Tatabahasa
          </p>
        </div>

        {/* 6 Guide Cards Grid */}
        <div className="p-4 sm:p-5 overflow-y-auto pixel-scroll bg-[#1c1138] grid grid-cols-1 md:grid-cols-2 gap-3.5 flex-1">
          {GUIDE_TOPICS.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 bg-[#130b29] border-2 ${item.accentBorder} flex items-start gap-3`}
            >
              <div className="w-12 h-12 bg-[#231547] border-2 border-[#facc15] flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono-num text-[11px] font-bold px-1.5 py-0.5 bg-[#2b1d52] text-[#fde047] border border-[#7c3aed]">
                    {item.number}
                  </span>
                  <h3 className="font-pixel font-bold text-sm sm:text-base text-white">
                    {item.title}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-[#e2e8f0] leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-[#170e30] border-t-2 border-[#5b3ea8] flex justify-end">
          <button
            type="button"
            onClick={() => {
              soundEngine.playButtonClick();
              onClose();
            }}
            className="px-5 py-2 pixel-btn-gold font-pixel font-bold text-xs sm:text-sm cursor-pointer"
          >
            FAHAM & TERUSKAN PENGEMBARAAN
          </button>
        </div>
      </div>
    </div>
  );
};
