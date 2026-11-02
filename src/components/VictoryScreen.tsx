import React, { useEffect, useRef, useState } from 'react';
import { Award, BookOpen, Home, Map as MapIcon, RotateCcw, Sparkles } from 'lucide-react';
import { AvatarId, GameLogoConfig } from '../types/game';
import { drawAvatarSprite, drawCrystalSprite, drawOwlMascot } from '../engine/pixelSprites';
import { PixelPortrait } from './PixelPortrait';
import { GameLogo } from './GameLogo';
import { soundEngine } from '../audio/soundEngine';

interface VictoryScreenProps {
  logoConfig: GameLogoConfig;
  avatarId: AvatarId;
  playerName: string;
  score: number;
  crystalsCount: number;
  onBackToWorldMap: () => void;
  onOpenJournal: () => void;
  onOpenCredits?: () => void;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({
  logoConfig,
  avatarId,
  playerName,
  score,
  crystalsCount,
  onBackToWorldMap,
  onOpenJournal,
  onOpenCredits,
  onPlayAgain,
  onBackToMenu,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showAchievementsDetail, setShowAchievementsDetail] = useState(false);

  useEffect(() => {
    soundEngine.playVictoryFanfare();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let tick = 0;

    // Pixel confetti & sparkling star particles
    const confetti = Array.from({ length: 48 }, (_, i) => ({
      x: (i * 37) % 900,
      y: (i * 29) % 500,
      vy: 1.4 + (i % 4) * 0.5,
      color: ['#fde047', '#f472b6', '#38bdf8', '#34d399', '#c084fc'][i % 5],
    }));

    const render = () => {
      tick++;
      const frame = Math.floor(tick / 14) % 4;
      const w = canvas.width;
      const h = canvas.height;
      ctx.imageSmoothingEnabled = false;

      // Golden Radiant Sky!
      const sky = ['#1e3a8a', '#2563eb', '#f59e0b', '#fbbf24', '#fef08a'];
      sky.forEach((col, i) => {
        ctx.fillStyle = col;
        ctx.fillRect(0, (i * h * 0.65) / sky.length, w, (h * 0.65) / sky.length + 2);
      });

      // Golden Aura Rays behind Castle
      ctx.fillStyle = 'rgba(254, 240, 138, 0.35)';
      ctx.fillRect(w / 2 - 150, h * 0.06, 300, 210);

      // Istana Kota Tatabahasa Shining in Golden Light
      const cx = w / 2 - 105;
      const cy = h * 0.16;
      ctx.fillStyle = '#fffbeb';
      ctx.fillRect(cx + 20, cy + 42, 170, 130);
      ctx.fillStyle = '#7e22ce';
      ctx.fillRect(cx + 8, cy + 16, 48, 30);
      ctx.fillRect(cx + 154, cy + 16, 48, 30);
      ctx.fillStyle = '#6d28d9';
      ctx.fillRect(cx + 68, cy - 8, 74, 50);

      // Blazing Giant Crystal atop Castle!
      drawCrystalSprite(ctx, w / 2 - 22, cy - 44, 2.8, true, frame);

      // Green Lawn + Colorful Pixel Flowers
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(0, h * 0.65, w, h * 0.35);
      for (let fx = 24; fx < w; fx += 44) {
        ctx.fillStyle = fx % 88 === 0 ? '#f472b6' : '#fde047';
        ctx.fillRect(fx, h * 0.72 + ((fx * 7) % 45), 8, 8);
      }

      // Both Main Heroes Celebrating + Owl Flying Around Castle!
      drawAvatarSprite(ctx, 'wira_bahasa', 'down', 'reward', frame, w * 0.12, h * 0.56, 3.2);
      drawAvatarSprite(
        ctx,
        'wira_tatabahasa',
        'down',
        'reward',
        (frame + 1) % 4,
        w * 0.76,
        h * 0.56,
        3.2
      );

      const owlX = w / 2 - 24 + Math.cos(tick * 0.03) * 165;
      const owlY = h * 0.24 + Math.sin(tick * 0.06) * 24;
      drawOwlMascot(ctx, owlX, owlY, 2.4, frame);

      // Pixel Confetti & Sparkling Stars
      confetti.forEach((p) => {
        p.y = (p.y + p.vy) % h;
        ctx.fillStyle = p.color;
        ctx.fillRect((p.x / 900) * w, p.y, 7, 7);
      });

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div className="relative w-full h-full overflow-y-auto flex items-center justify-center p-4 bg-[#16122b]">
      <canvas
        ref={canvasRef}
        width={960}
        height={540}
        className="fixed inset-0 w-full h-full object-cover pixelated pointer-events-none"
      />

      <div className="relative z-10 w-full max-w-3xl pixel-panel-purple p-5 md:p-7 text-center my-auto space-y-3.5">
        {/* TOP: OFFICIAL GAME LOGO (Section 8) */}
        <div className="flex flex-col items-center justify-center">
          <GameLogo
            config={logoConfig}
            size="md"
            fadeIn
            floating
            softGlow
            sparkles
          />
          <div className="mt-2 inline-block px-3.5 py-0.5 bg-[#facc15] text-[#261505] font-pixel font-bold text-xs">
            KEMENANGAN AGUNG · {playerName.toUpperCase()}
          </div>
        </div>

        {/* REQUIRED HEADING */}
        <h1 className="font-pixel font-bold text-2xl sm:text-4xl text-[#fde047] drop-shadow-[0_4px_0_#4a1d05]">
          TAHNIAH, WIRA BAHASA!
        </h1>

        {/* CENTER: MAIN CHARACTER ILLUSTRATION + GLOWING KRISTAL KATA */}
        <div className="relative mx-auto max-w-md p-3.5 bg-[#1b1036]/95 border-3 border-[#facc15] shadow-[0_0_24px_rgba(250,204,21,0.35)] flex items-center justify-center gap-5">
          <div className="flex flex-col items-center">
            <div className="w-18 h-18 bg-[#120a26] border-2 border-[#fde047] flex items-center justify-center">
              <PixelPortrait mode="avatar" avatarId={avatarId} anim="reward" size={62} />
            </div>
            <span className="mt-1 font-pixel font-bold text-[11px] text-[#fef08a]">
              {playerName}
            </span>
          </div>

          <div className="flex flex-col items-center logo-anim-float">
            <div className="relative p-2 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.45)_0%,rgba(250,204,21,0.25)_60%,transparent_80%)]">
              <PixelPortrait mode="crystal" lit size={56} />
            </div>
            <span className="font-mono-num font-bold text-xs text-[#7dd3fc]">
              {crystalsCount} / 30 Kristal Kata
            </span>
          </div>
        </div>

        {/* BELOW: REQUIRED VICTORY MESSAGE */}
        <p className="font-pixel font-bold text-sm sm:text-lg text-[#fef3c7] drop-shadow-[0_2px_0_#1e1b4b]">
          KAMU TELAH BERJAYA MENYELAMATKAN KOTA TATABAHASA!
        </p>

        {/* Stats & 3 Mission Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-2.5 bg-[#1e143b] border-2 border-[#38bdf8] flex flex-col items-center justify-center">
            <PixelPortrait mode="crystal" lit size={36} />
            <span className="mt-1 text-xs text-[#bae6fd]">Kristal Kata Dipulihkan</span>
            <span className="font-mono-num font-bold text-xl text-white">
              {crystalsCount} / 30
            </span>
          </div>

          <div className="p-2.5 bg-[#1e143b] border-2 border-[#facc15] flex flex-col items-center justify-center">
            <span className="text-xl font-pixel text-[#fde047]">★</span>
            <span className="mt-1 text-xs text-[#fef08a]">Jumlah Markah Keseluruhan</span>
            <span className="font-mono-num font-bold text-xl text-[#fde047]">
              {score} Mata
            </span>
          </div>

          <div className="p-2.5 bg-[#1e143b] border-2 border-[#c084fc] flex flex-col items-center justify-center">
            <div className="flex items-center gap-1">
              <PixelPortrait mode="badge" badgeId="lencana_detektif" unlocked size={34} />
              <PixelPortrait mode="badge" badgeId="lencana_pemburu" unlocked size={34} />
              <PixelPortrait mode="badge" badgeId="lencana_wira" unlocked size={34} />
            </div>
            <span className="mt-1 text-xs text-[#e9d5ff]">Tiga Lencana Misi</span>
            <span className="font-pixel font-bold text-xs text-[#34d399]">LENGKAP 3 / 3</span>
          </div>
        </div>

        {/* Achievements Breakdown Drawer */}
        {showAchievementsDetail && (
          <div className="p-4 pixel-panel-parchment text-left space-y-2">
            <h3 className="font-pixel font-bold text-base text-[#581c87]">
              Rekod Pencapaian Wira Bahasa ({playerName}):
            </h3>
            <ul className="text-xs sm:text-sm space-y-1 font-medium text-[#2d1e12]">
              <li>
                ✓ Lencana Misi 1: Detektif Bahasa — Menyelesaikan Soalan 1 hingga 10 di Taman Sakura
                Bahasa.
              </li>
              <li>
                ✓ Lencana Misi 2: Pemburu Kesalahan — Menyelesaikan Soalan 11 hingga 20 di Pasar
                Perkataan & Menara Media.
              </li>
              <li>
                ✓ Lencana Misi 3: Wira Tatabahasa — Menyelesaikan Soalan 21 hingga 30 di Benteng Wira
                Bahasa.
              </li>
              <li>
                ✓ Gelaran Tertinggi:{' '}
                <strong className="text-[#6d28d9]">
                  {score >= 2700
                    ? 'Cendekiawan Agung Tatabahasa'
                    : score >= 2000
                    ? 'Pendekar Bahasa Cemerlang'
                    : 'Wira Penyelamat Kota Tatabahasa'}
                </strong>
              </li>
            </ul>
          </div>
        )}

        {/* PRIMARY 3 REQUIRED BUTTONS (Section 8) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => {
              soundEngine.playButtonClick();
              onBackToWorldMap();
            }}
            className="py-3 px-3.5 pixel-btn-blue font-pixel font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <MapIcon className="w-4 h-4 shrink-0" />
            <span>KEMBALI KE PETA DUNIA</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playButtonClick();
              setShowAchievementsDetail((v) => !v);
            }}
            className="py-3 px-3.5 pixel-btn-gold font-pixel font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <Award className="w-4 h-4 shrink-0" />
            <span>{showAchievementsDetail ? 'TUTUP PENCAPAIAN' : 'LIHAT PENCAPAIAN'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playButtonClick();
              onPlayAgain();
            }}
            className="py-3 px-3.5 pixel-btn-emerald font-pixel font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4 shrink-0" />
            <span>MAIN SEMULA</span>
          </button>
        </div>

        {/* Secondary Helpful Links: Jurnal Bahasa, Kredit Permainan & Menu Utama */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              soundEngine.playBookOpen();
              onOpenJournal();
            }}
            className="py-2 px-3.5 pixel-btn-purple font-pixel font-bold text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>JURNAL BAHASA</span>
          </button>

          {onOpenCredits && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playButtonClick();
                onOpenCredits();
              }}
              className="py-2 px-3.5 pixel-btn-wood font-pixel font-bold text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>KREDIT PERMAINAN</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              soundEngine.playButtonClick();
              onBackToMenu();
            }}
            className="py-2 px-3.5 pixel-btn-purple font-pixel font-bold text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Home className="w-4 h-4 shrink-0" />
            <span>MENU UTAMA</span>
          </button>
        </div>
      </div>
    </div>
  );
};
