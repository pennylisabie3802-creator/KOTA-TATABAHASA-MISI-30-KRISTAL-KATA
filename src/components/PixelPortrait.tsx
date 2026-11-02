import React, { useEffect, useRef } from 'react';
import {
  AvatarAnimState,
  AvatarId,
  BadgeId,
  Direction,
  ExplorationBadgeId,
  NpcSpriteKind,
  ObjectSpriteKind,
} from '../types/game';
import {
  drawAvatarSprite,
  drawBadgeSprite,
  drawCrystalSprite,
  drawNpcSprite,
  drawQuestObjectSprite,
  NpcAnimMode,
  pickNpcTalkFrame,
} from '../engine/pixelSprites';

type PortraitProps =
  | {
      mode: 'avatar';
      avatarId: AvatarId;
      anim?: AvatarAnimState;
      dir?: Direction;
      size?: number;
      className?: string;
    }
  | {
      mode: 'npc';
      npcKind: NpcSpriteKind;
      talking?: boolean;
      activeChar?: string;
      reactNonce?: number;
      interactiveStage?: boolean;
      size?: number;
      className?: string;
    }
  | {
      mode: 'object';
      objectKind: ObjectSpriteKind;
      solved?: boolean;
      size?: number;
      className?: string;
    }
  | {
      mode: 'crystal';
      lit?: boolean;
      size?: number;
      className?: string;
    }
  | {
      mode: 'badge';
      badgeId: BadgeId | ExplorationBadgeId;
      unlocked?: boolean;
      size?: number;
      className?: string;
    };

export const PixelPortrait: React.FC<PortraitProps> = (props) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const size = props.size ?? 96;

  // Store latest live props in ref so the smooth animation loop never resets its frame counter when activeChar changes!
  const latestPropsRef = useRef<PortraitProps>(props);
  latestPropsRef.current = props;

  const npcAnimStateRef = useRef({
    idleStep: 0,
    talkStep: 0,
    reactFramesLeft: 0,
    lastReactNonce: props.mode === 'npc' ? props.reactNonce ?? 0 : 0,
    lastStepMs: 0,
  });

  useEffect(() => {
    if (props.mode === 'npc' && props.reactNonce !== undefined) {
      if (props.reactNonce !== npcAnimStateRef.current.lastReactNonce) {
        npcAnimStateRef.current.lastReactNonce = props.reactNonce;
        npcAnimStateRef.current.reactFramesLeft = 6;
      }
    }
  }, [props]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let genericFrame = 0;
    let lastGenericTime = performance.now();

    const loop = (now: number) => {
      const p = latestPropsRef.current;
      ctx.clearRect(0, 0, size, size);
      ctx.imageSmoothingEnabled = false;

      if (p.mode === 'npc') {
        const st = npcAnimStateRef.current;
        const intervalMs =
          st.reactFramesLeft > 0 ? 85 : p.talking ? 92 : 175;

        if (now - st.lastStepMs >= intervalMs) {
          st.lastStepMs = now;
          if (st.reactFramesLeft > 0) {
            st.reactFramesLeft--;
          }
          st.idleStep = (st.idleStep + 1) % 8;
          st.talkStep = st.talkStep + 1;
        }

        // Optional RPG Dialogue Stage Backdrop
        if (p.interactiveStage) {
          ctx.fillStyle = '#1e133d';
          ctx.fillRect(0, 0, size, size);
          // Soft royal spotlight behind NPC
          ctx.fillStyle = p.talking
            ? 'rgba(250, 204, 21, 0.16)'
            : 'rgba(167, 139, 250, 0.12)';
          const pad = Math.round(size * 0.14);
          ctx.fillRect(pad, pad, size - pad * 2, size - pad * 2);

          // Ambient floating pixel stars
          const twinkle = st.idleStep % 4;
          ctx.fillStyle = p.talking ? '#fde047' : '#c4b5fd';
          ctx.fillRect(8, 10 + (twinkle % 2) * 2, 3, 3);
          ctx.fillRect(size - 12, 14 - (twinkle % 2) * 2, 3, 3);
          if (p.talking) {
            ctx.fillStyle = '#7dd3fc';
            ctx.fillRect(size - 14, size - 22 + (st.talkStep % 2) * 2, 2, 2);
          }

          // Stage floor platform
          ctx.fillStyle = '#311f63';
          ctx.fillRect(0, Math.round(size * 0.84), size, Math.round(size * 0.16));
          ctx.fillStyle = '#5b3ea8';
          ctx.fillRect(0, Math.round(size * 0.84), size, 2);
        }

        let animMode: NpcAnimMode = 'idle';
        let frameIdx = st.idleStep;

        if (st.reactFramesLeft > 0) {
          animMode = 'react';
          frameIdx = (6 - st.reactFramesLeft) % 8;
        } else if (p.talking) {
          animMode = 'talk';
          frameIdx = pickNpcTalkFrame(p.activeChar, st.talkStep);
        } else {
          animMode = 'idle';
          frameIdx = st.idleStep;
        }

        const scale = size / 32;
        drawNpcSprite(ctx, p.npcKind, 0, 0, scale, frameIdx, animMode);
      } else {
        if (now - lastGenericTime >= 200) {
          lastGenericTime = now;
          genericFrame = (genericFrame + 1) % 4;
        }

        if (p.mode === 'avatar') {
          const scale = size / 32;
          drawAvatarSprite(
            ctx,
            p.avatarId,
            p.dir ?? 'down',
            p.anim ?? 'idle',
            genericFrame,
            0,
            p.anim === 'reward' ? size * 0.14 : 0,
            p.anim === 'reward' ? scale * 0.85 : scale
          );
        } else if (p.mode === 'object') {
          const scale = size / 32;
          drawQuestObjectSprite(
            ctx,
            p.objectKind,
            0,
            0,
            scale,
            p.solved ?? false,
            genericFrame
          );
        } else if (p.mode === 'crystal') {
          const scale = size / 16;
          drawCrystalSprite(ctx, 0, 0, scale, p.lit ?? true, genericFrame);
        } else if (p.mode === 'badge') {
          const scale = size / 32;
          drawBadgeSprite(ctx, p.badgeId, 0, 0, scale, p.unlocked ?? true);
        }
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={`pixelated shrink-0 ${props.className ?? ''}`}
    />
  );
};
