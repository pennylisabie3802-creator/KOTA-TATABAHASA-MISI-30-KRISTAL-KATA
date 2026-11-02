import React, { useEffect, useRef } from 'react';
import { soundEngine } from '../audio/soundEngine';

interface PixelAudioVisualizerProps {
  soundEnabled: boolean;
  musicEnabled: boolean;
}

const CANVAS_W = 112;
const CANVAS_H = 44;
const BAR_COUNT = 8;
const MAX_SEGMENTS = 8;

/**
 * Draws a tiny crisp 8-bit eighth-note (`♪`) pixel sprite at integer coordinates.
 */
function drawPixelMusicNote(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  shadowColor: string
) {
  const pts: [number, number, number, number][] = [
    // Note stem & flag
    [5, 0, 2, 11],
    [7, 1, 2, 2],
    [9, 2, 2, 3],
    // Note head (oval pixel block)
    [1, 9, 5, 4],
    [2, 8, 4, 1],
    [2, 13, 3, 1],
  ];

  ctx.fillStyle = shadowColor;
  for (const [dx, dy, w, h] of pts) {
    ctx.fillRect(x + dx + 1, y + dy + 1, w, h);
  }

  ctx.fillStyle = color;
  for (const [dx, dy, w, h] of pts) {
    ctx.fillRect(x + dx, y + dy, w, h);
  }
}

/**
 * Non-interactive 2D Pixel-Art 8-Bit Audio Visualizer placed in the open sky
 * beside the top-right audio icon on the Main Menu.
 */
export const PixelAudioVisualizer: React.FC<PixelAudioVisualizerProps> = ({
  soundEnabled,
  musicEnabled,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const peakHoldRef = useRef<number[]>(new Array(BAR_COUNT).fill(1));
  const peakDecayTickRef = useRef<number[]>(new Array(BAR_COUNT).fill(0));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let rafId = 0;
    let frameCount = 0;

    const drawFrame = () => {
      frameCount++;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      const sample = soundEngine.sampleVisualizer();
      const active = soundEnabled && musicEnabled && sample.isAudioEnabled;

      // 1. Subtle Royal Pixel Badge Frame (matching top-right pixel icons in main-menu.png)
      const fx = 2;
      const fy = 4;
      const fw = CANVAS_W - 4;
      const fh = CANVAS_H - 8;

      // Drop shadow
      ctx.fillStyle = 'rgba(13, 10, 31, 0.55)';
      ctx.fillRect(fx + 2, fy + 3, fw - 2, fh - 1);

      // Outer dark pixel border (stepped pixel corners)
      ctx.fillStyle = '#1b0f36';
      ctx.fillRect(fx + 2, fy, fw - 4, fh);
      ctx.fillRect(fx, fy + 2, fw, fh - 4);

      // Golden pixel trim
      ctx.fillStyle = active ? '#f6c445' : '#64748b';
      ctx.fillRect(fx + 2, fy + 1, fw - 4, fh - 2);
      ctx.fillRect(fx + 1, fy + 2, fw - 2, fh - 4);

      // Deep royal violet inner well
      ctx.fillStyle = 'rgba(34, 20, 72, 0.92)';
      ctx.fillRect(fx + 3, fy + 3, fw - 6, fh - 6);

      // Subtle inner top highlight line
      ctx.fillStyle = active ? 'rgba(167, 139, 250, 0.35)' : 'rgba(148, 163, 184, 0.2)';
      ctx.fillRect(fx + 4, fy + 4, fw - 8, 1);

      // 2. Dancing 8-Bit Musical Note on Left Side of Frame
      const bounceOffset =
        active && !prefersReducedMotion ? Math.round(sample.beatPulse * 3) : 0;
      const noteX = fx + 8;
      const noteY = fy + 12 - bounceOffset;

      drawPixelMusicNote(
        ctx,
        noteX,
        noteY,
        active ? '#fde047' : '#94a3b8',
        '#140a29'
      );

      // Muted tiny pixel 'x' badge next to note when audio is off
      if (!active) {
        ctx.fillStyle = '#fb7185';
        const mx = noteX + 11;
        const my = fy + 20;
        ctx.fillRect(mx, my, 2, 2);
        ctx.fillRect(mx + 4, my, 2, 2);
        ctx.fillRect(mx + 2, my + 2, 2, 2);
        ctx.fillRect(mx, my + 4, 2, 2);
        ctx.fillRect(mx + 4, my + 4, 2, 2);
      } else if (!prefersReducedMotion && sample.melodyHz >= 650) {
        // Tiny pixel sparkle above the note on high melody notes
        const twinkle = Math.floor(frameCount / 6) % 2 === 0;
        ctx.fillStyle = twinkle ? '#fef08a' : '#7dd3fc';
        ctx.fillRect(noteX + 11, fy + 7, 2, 2);
        ctx.fillRect(noteX + 10, fy + 8, 4, 1);
      }

      // 3. 8 Stepped 8-Bit Crystal/Gold Equalizer Columns
      const startX = fx + 27;
      const baseBottomY = fy + fh - 6; // bottom baseline inside well
      const barWidth = 7;
      const barGap = 2;
      const segHeight = 2;
      const segGap = 1;
      const segStep = segHeight + segGap; // 3px per discrete 8-bit LED block

      for (let i = 0; i < BAR_COUNT; i++) {
        const bx = startX + i * (barWidth + barGap);

        // Background unlit LED track slots
        ctx.fillStyle = 'rgba(15, 9, 36, 0.72)';
        for (let s = 0; s < MAX_SEGMENTS; s++) {
          const sy = baseBottomY - (s + 1) * segStep + segGap;
          ctx.fillRect(bx, sy, barWidth, segHeight);
        }

        let litSegments = 1;
        if (active) {
          if (prefersReducedMotion) {
            // Static decorative chord silhouette when reduced motion is enabled
            const staticPattern = [3, 5, 4, 6, 5, 7, 4, 3];
            litSegments = staticPattern[i];
          } else {
            litSegments = Math.max(
              1,
              Math.min(MAX_SEGMENTS, Math.round(sample.bars[i] * MAX_SEGMENTS))
            );
          }
        }

        // Update classic 8-bit falling peak-hold cap
        if (litSegments >= peakHoldRef.current[i]) {
          peakHoldRef.current[i] = litSegments;
          peakDecayTickRef.current[i] = 0;
        } else {
          peakDecayTickRef.current[i]++;
          if (peakDecayTickRef.current[i] >= 9) {
            peakDecayTickRef.current[i] = 0;
            peakHoldRef.current[i] = Math.max(1, peakHoldRef.current[i] - 1);
          }
        }

        // Draw lit stepped segments from bottom to top
        for (let s = 0; s < litSegments; s++) {
          const sy = baseBottomY - (s + 1) * segStep + segGap;
          if (!active) {
            ctx.fillStyle = '#475569';
          } else if (s < 3) {
            // Crystal cyan-blue base
            ctx.fillStyle = s === 0 ? '#0284c7' : '#38bdf8';
          } else if (s < 6) {
            // Fantasy orchid-magenta middle
            ctx.fillStyle = s === 3 ? '#a855f7' : '#e879f9';
          } else {
            // Golden crown top
            ctx.fillStyle = '#fde047';
          }
          ctx.fillRect(bx, sy, barWidth, segHeight);

          // Crisp 1px left pixel highlight on each lit block
          if (active) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
            ctx.fillRect(bx, sy, 2, 1);
          }
        }

        // Draw floating golden peak-hold pixel cap above active bar
        if (active && !prefersReducedMotion && peakHoldRef.current[i] > litSegments) {
          const capSeg = peakHoldRef.current[i] - 1;
          const capY = baseBottomY - (capSeg + 1) * segStep + segGap;
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(bx, capY, barWidth, segHeight);
        }
      }

      if (!prefersReducedMotion) {
        rafId = window.requestAnimationFrame(drawFrame);
      }
    };

    drawFrame();

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [soundEnabled, musicEnabled]);

  return (
    <div
      aria-hidden="true"
      style={{
        left: '71.2%',
        top: '2.5%',
        width: '11.8%',
        height: '9.3%',
      }}
      className="pointer-events-none absolute select-none flex items-center justify-center"
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="w-full h-full object-contain pixelated block"
      />
    </div>
  );
};
