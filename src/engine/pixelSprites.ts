import {
  AvatarAnimState,
  AvatarId,
  BadgeId,
  Direction,
  ExplorationBadgeId,
  NpcSpriteKind,
  ObjectSpriteKind,
} from '../types/game';

function px(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  s = 1
) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x * s), Math.round(y * s), Math.round(w * s), Math.round(h * s));
}

export function drawAvatarSprite(
  ctx: CanvasRenderingContext2D,
  avatarId: AvatarId,
  dir: Direction,
  anim: AvatarAnimState,
  frame: number,
  offsetX = 0,
  offsetY = 0,
  scale = 2
) {
  ctx.save();
  ctx.translate(Math.round(offsetX), Math.round(offsetY));
  ctx.imageSmoothingEnabled = false;

  const s = scale;
  const bob =
    anim === 'idle'
      ? frame % 2 === 0
        ? 0
        : 1
      : anim === 'walk'
      ? frame % 2 === 0
        ? 0
        : -1
      : anim === 'happy' || anim === 'reward'
      ? frame % 2 === 0
        ? -3
        : 0
      : 0;

  const legStep = anim === 'walk' ? (frame % 4 === 1 ? -2 : frame % 4 === 3 ? 2 : 0) : 0;

  px(ctx, 8, 28, 16, 3, 'rgba(15, 10, 35, 0.38)', s);

  if (avatarId === 'wira_bahasa') {
    if (dir !== 'up') {
      px(ctx, 7, 13 + bob, 18, 12, '#b91c1c', s);
      px(ctx, 8, 14 + bob, 16, 10, '#ef4444', s);
    }

    px(ctx, 10, 24 + (legStep > 0 ? -1 : 0), 5, 4, '#5c2d16', s);
    px(ctx, 17, 24 + (legStep < 0 ? -1 : 0), 5, 4, '#5c2d16', s);
    px(ctx, 10, 24 + (legStep > 0 ? -1 : 0), 5, 1, '#854d27', s);
    px(ctx, 17, 24 + (legStep < 0 ? -1 : 0), 5, 1, '#854d27', s);

    px(ctx, 11, 21 + bob, 4, 4, '#1e3a8a', s);
    px(ctx, 17, 21 + bob, 4, 4, '#1e3a8a', s);

    px(ctx, 9, 13 + bob, 14, 9, '#1d4ed8', s);
    px(ctx, 10, 14 + bob, 12, 7, '#2563eb', s);
    px(ctx, 9, 19 + bob, 14, 2, '#5c2d16', s);
    px(ctx, 14, 19 + bob, 4, 2, '#facc15', s);

    if (dir !== 'up') {
      px(ctx, 14, 14 + bob, 4, 3, '#facc15', s);
      px(ctx, 15, 13 + bob, 2, 5, '#fde047', s);
    }

    const armRaise = anim === 'happy' || anim === 'reward' || anim === 'interact' ? -4 : 0;
    px(ctx, 6, 14 + bob + armRaise, 3, 6, '#2563eb', s);
    px(ctx, 6, 19 + bob + armRaise, 3, 2, '#fed7aa', s);
    px(ctx, 23, 14 + bob + armRaise, 3, 6, '#2563eb', s);
    px(ctx, 23, 19 + bob + armRaise, 3, 2, '#fed7aa', s);

    if (dir !== 'up' && (anim === 'interact' || anim === 'idle' || anim === 'reward')) {
      px(ctx, 22, 16 + bob + armRaise, 6, 5, '#7c2d12', s);
      px(ctx, 23, 17 + bob + armRaise, 4, 3, '#fef3c7', s);
      px(ctx, 24, 17 + bob + armRaise, 2, 3, '#facc15', s);
    }

    if (dir === 'up') {
      px(ctx, 7, 13 + bob, 18, 12, '#991b1b', s);
      px(ctx, 8, 13 + bob, 16, 11, '#dc2626', s);
      px(ctx, 10, 14 + bob, 12, 2, '#facc15', s);
    }

    px(ctx, 8, 3 + bob, 16, 11, '#3b1d0e', s);
    px(ctx, 9, 4 + bob, 14, 9, '#fed7aa', s);

    px(ctx, 7, 2 + bob, 18, 5, '#5c2d16', s);
    px(ctx, 8, 1 + bob, 16, 4, '#7c3f1d', s);
    px(ctx, 10, 2 + bob, 5, 2, '#9a5229', s);
    px(ctx, 6, 5 + bob, 3, 4, '#5c2d16', s);
    px(ctx, 23, 5 + bob, 3, 4, '#5c2d16', s);

    if (dir === 'up') {
      px(ctx, 8, 3 + bob, 16, 10, '#6b3417', s);
      px(ctx, 10, 4 + bob, 12, 4, '#854621', s);
    } else {
      const eyeShift = dir === 'left' ? -2 : dir === 'right' ? 2 : 0;
      px(ctx, 11 + eyeShift, 8 + bob, 2, 3, '#291509', s);
      px(ctx, 18 + eyeShift, 8 + bob, 2, 3, '#291509', s);
      px(ctx, 11 + eyeShift, 8 + bob, 1, 1, '#ffffff', s);
      px(ctx, 18 + eyeShift, 8 + bob, 1, 1, '#ffffff', s);
      px(ctx, 9 + eyeShift, 10 + bob, 2, 1, '#fda4af', s);
      px(ctx, 20 + eyeShift, 10 + bob, 2, 1, '#fda4af', s);
      px(ctx, 14 + eyeShift, 11 + bob, 4, anim === 'happy' || anim === 'reward' ? 2 : 1, '#be123c', s);
    }
  } else {
    if (dir !== 'up') {
      px(ctx, 7, 13 + bob, 18, 12, '#be185d', s);
      px(ctx, 8, 14 + bob, 16, 10, '#ec4899', s);
    }

    px(ctx, 10, 25 + (legStep > 0 ? -1 : 0), 5, 3, '#6b21a8', s);
    px(ctx, 17, 25 + (legStep < 0 ? -1 : 0), 5, 3, '#6b21a8', s);

    px(ctx, 8, 13 + bob, 16, 12, '#581c87', s);
    px(ctx, 9, 14 + bob, 14, 10, '#7e22ce', s);
    px(ctx, 9, 23 + bob, 14, 2, '#facc15', s);
    px(ctx, 10, 19 + bob, 12, 2, '#facc15', s);

    if (dir !== 'up') {
      px(ctx, 14, 15 + bob, 4, 3, '#fde047', s);
    }

    const armRaise = anim === 'happy' || anim === 'reward' || anim === 'interact' ? -4 : 0;
    px(ctx, 6, 14 + bob + armRaise, 3, 6, '#9333ea', s);
    px(ctx, 6, 19 + bob + armRaise, 3, 2, '#fed7aa', s);
    px(ctx, 23, 14 + bob + armRaise, 3, 6, '#9333ea', s);
    px(ctx, 23, 19 + bob + armRaise, 3, 2, '#fed7aa', s);

    if (dir !== 'up') {
      px(ctx, 21, 16 + bob + armRaise, 7, 5, '#6d28d9', s);
      px(ctx, 22, 16 + bob + armRaise, 5, 4, '#fde047', s);
      px(ctx, 23, 17 + bob + armRaise, 3, 2, '#fef9c3', s);
    }

    if (dir === 'up') {
      px(ctx, 7, 13 + bob, 18, 11, '#db2777', s);
      px(ctx, 8, 13 + bob, 16, 10, '#f472b6', s);
    }

    px(ctx, 7, 2 + bob, 18, 13, '#be185d', s);
    px(ctx, 8, 3 + bob, 16, 11, '#f472b6', s);
    px(ctx, 9, 3 + bob, 14, 3, '#f9a8d4', s);
    px(ctx, 10, 12 + bob, 12, 4, '#f472b6', s);

    if (dir !== 'up') {
      px(ctx, 10, 5 + bob, 12, 8, '#fed7aa', s);
      const eyeShift = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
      px(ctx, 11 + eyeShift, 8 + bob, 2, 3, '#3b0764', s);
      px(ctx, 18 + eyeShift, 8 + bob, 2, 3, '#3b0764', s);
      px(ctx, 11 + eyeShift, 8 + bob, 1, 1, '#ffffff', s);
      px(ctx, 18 + eyeShift, 8 + bob, 1, 1, '#ffffff', s);
      px(ctx, 10 + eyeShift, 10 + bob, 2, 1, '#fb7185', s);
      px(ctx, 19 + eyeShift, 10 + bob, 2, 1, '#fb7185', s);
      px(ctx, 14 + eyeShift, 11 + bob, 4, anim === 'happy' || anim === 'reward' ? 2 : 1, '#be123c', s);
    }
  }

  if (anim === 'reward') {
    drawCrystalSprite(ctx, 10 * s, (-8 + bob) * s, s * 0.75, true, frame);
  }

  ctx.restore();
}

export type NpcAnimMode = 'idle' | 'talk' | 'react';

const NPC_CELL = 32;
const NPC_SHEET_COLS = 8;
const NPC_SHEET_ROWS = 3; // Row 0 = idle, Row 1 = talk, Row 2 = react

type VisemeKind = 'closed' | 'half' | 'open' | 'wide';

const npcSpriteSheetCache = new Map<NpcSpriteKind, HTMLCanvasElement>();

const NPC_STYLE_CONFIG: Record<
  Exclude<NpcSpriteKind, 'owl'>,
  {
    hat: string;
    hairOrHijab: string;
    isHijab: boolean;
    outfit: string;
    outfitShade: string;
    trim: string;
    prop: 'magnifier' | 'newspaper' | 'scroll' | 'book' | 'menu' | 'shield';
  }
> = {
  cikgu_salmah: {
    hat: '',
    hairOrHijab: '#7e22ce',
    isHijab: true,
    outfit: '#4c1d95',
    outfitShade: '#3b0764',
    trim: '#facc15',
    prop: 'magnifier',
  },
  encik_hakim: {
    hat: '#1d4ed8',
    hairOrHijab: '#451a03',
    isHijab: false,
    outfit: '#0369a1',
    outfitShade: '#075985',
    trim: '#fef08a',
    prop: 'newspaper',
  },
  profesor_bahasa: {
    hat: '#581c87',
    hairOrHijab: '#e2e8f0',
    isHijab: false,
    outfit: '#6b21a8',
    outfitShade: '#4c1d95',
    trim: '#facc15',
    prop: 'scroll',
  },
  detektif_muda: {
    hat: '#b45309',
    hairOrHijab: '#451a03',
    isHijab: false,
    outfit: '#92400e',
    outfitShade: '#78350f',
    trim: '#fde047',
    prop: 'magnifier',
  },
  pustakawan: {
    hat: '',
    hairOrHijab: '#db2777',
    isHijab: true,
    outfit: '#0f766e',
    outfitShade: '#115e59',
    trim: '#fde047',
    prop: 'book',
  },
  peniaga_mi: {
    hat: '#ffffff',
    hairOrHijab: '#451a03',
    isHijab: false,
    outfit: '#ea580c',
    outfitShade: '#c2410c',
    trim: '#fff7ed',
    prop: 'menu',
  },
  peniaga_buku: {
    hat: '',
    hairOrHijab: '#0284c7',
    isHijab: true,
    outfit: '#be185d',
    outfitShade: '#9d174d',
    trim: '#fde047',
    prop: 'book',
  },
  editor_media: {
    hat: '',
    hairOrHijab: '#9333ea',
    isHijab: true,
    outfit: '#1e40af',
    outfitShade: '#1e3a8a',
    trim: '#38bdf8',
    prop: 'newspaper',
  },
  pengawal_istana: {
    hat: '#facc15',
    hairOrHijab: '#334155',
    isHijab: false,
    outfit: '#1d4ed8',
    outfitShade: '#1e3a8a',
    trim: '#facc15',
    prop: 'shield',
  },
  peri_perkataan: {
    hat: '#fde047',
    hairOrHijab: '#f472b6',
    isHijab: false,
    outfit: '#10b981',
    outfitShade: '#059669',
    trim: '#fef08a',
    prop: 'book',
  },
  ketua_kampung: {
    hat: '#1e293b',
    hairOrHijab: '#cbd5e1',
    isHijab: false,
    outfit: '#b45309',
    outfitShade: '#92400e',
    trim: '#fde68a',
    prop: 'scroll',
  },
  pak_cik_rahman: {
    hat: '#15803d',
    hairOrHijab: '#451a03',
    isHijab: false,
    outfit: '#d97706',
    outfitShade: '#b45309',
    trim: '#fef3c7',
    prop: 'book',
  },
};

function renderOwlCell(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  mode: NpcAnimMode,
  col: number
) {
  ctx.save();
  ctx.translate(ox, oy);

  // Smooth 8-frame hover wave
  const hoverTable =
    mode === 'react'
      ? [-1, -3, -4, -2, -1, -3, -2, 0]
      : mode === 'talk'
      ? [0, -1, -2, -1, 0, -2, -1, 0]
      : [0, 0, -1, -2, -2, -1, 0, 0];
  const wingTable =
    mode === 'react'
      ? [-2, -4, -1, -4, -2, -3, -1, 0]
      : mode === 'talk'
      ? [0, -3, -1, -2, 0, -3, -1, 0]
      : [0, -1, -2, -3, -2, -1, 0, 0];

  const hover = hoverTable[col % 8];
  const wingFlap = wingTable[col % 8];
  const isBlink = (mode === 'idle' && col === 5) || (mode === 'talk' && col === 7);
  const happyEyes = mode === 'react' && (col === 1 || col === 2 || col === 5);
  const beakOpen =
    mode === 'talk'
      ? [1, 2, 2, 0, 2, 1, 2, 0][col % 8]
      : mode === 'react' && col % 2 === 1
      ? 2
      : 0;
  const tasselSway = col % 4 === 1 ? -1 : col % 4 === 3 ? 1 : 0;

  // Ground shadow scales subtly with hover height
  const shadowW = hover <= -2 ? 10 : 12;
  px(ctx, 16 - shadowW / 2, 28, shadowW, 2, 'rgba(15,10,35,0.32)');

  // Left & Right Wings
  px(ctx, 3, 13 + hover + wingFlap, 6, 8, '#5b21b6');
  px(ctx, 4, 14 + hover + wingFlap, 4, 6, '#a78bfa');
  px(ctx, 23, 13 + hover + wingFlap, 6, 8, '#5b21b6');
  px(ctx, 24, 14 + hover + wingFlap, 4, 6, '#a78bfa');

  // Plump Owl Torso & Belly Feathers
  px(ctx, 8, 8 + hover, 16, 17, '#4c1d95');
  px(ctx, 9, 9 + hover, 14, 15, '#8b5cf6');
  px(ctx, 11, 15 + hover, 10, 8, '#fef3c7');
  px(ctx, 12, 17 + hover, 2, 2, '#d97706');
  px(ctx, 16, 18 + hover, 2, 2, '#d97706');
  px(ctx, 18, 16 + hover, 2, 2, '#d97706');

  // Eyes (Blink, Happy Arc, or Wise Gaze)
  px(ctx, 10, 10 + hover, 5, 5, '#ffffff');
  px(ctx, 17, 10 + hover, 5, 5, '#ffffff');
  if (isBlink) {
    px(ctx, 10, 10 + hover, 5, 5, '#8b5cf6');
    px(ctx, 17, 10 + hover, 5, 5, '#8b5cf6');
    px(ctx, 10, 12 + hover, 5, 1, '#1e1b4b');
    px(ctx, 17, 12 + hover, 5, 1, '#1e1b4b');
  } else if (happyEyes) {
    px(ctx, 10, 10 + hover, 5, 5, '#fef9c3');
    px(ctx, 17, 10 + hover, 5, 5, '#fef9c3');
    px(ctx, 11, 11 + hover, 3, 1, '#1e1b4b');
    px(ctx, 10, 12 + hover, 1, 1, '#1e1b4b');
    px(ctx, 14, 12 + hover, 1, 1, '#1e1b4b');
    px(ctx, 18, 11 + hover, 3, 1, '#1e1b4b');
    px(ctx, 17, 12 + hover, 1, 1, '#1e1b4b');
    px(ctx, 21, 12 + hover, 1, 1, '#1e1b4b');
  } else {
    const gazeX = mode === 'idle' && (col === 2 || col === 3) ? 1 : 0;
    px(ctx, 11 + gazeX, 11 + hover, 2, 3, '#1e1b4b');
    px(ctx, 18 + gazeX, 11 + hover, 2, 3, '#1e1b4b');
    px(ctx, 11 + gazeX, 11 + hover, 1, 1, '#ffffff');
    px(ctx, 18 + gazeX, 11 + hover, 1, 1, '#ffffff');
  }

  // Articulated Beak (opens when talking!)
  px(ctx, 15, 13 + hover, 2, 2, '#f59e0b');
  if (beakOpen > 0) {
    px(ctx, 15, 15 + hover, 2, beakOpen, '#7f1d1d');
    px(ctx, 15, 15 + hover + beakOpen, 2, 1, '#fbbf24');
  } else {
    px(ctx, 15, 15 + hover, 2, 1, '#d97706');
  }

  // Talons
  px(ctx, 11, 24 + hover, 3, 2, '#f59e0b');
  px(ctx, 18, 24 + hover, 3, 2, '#f59e0b');

  // Mortarboard Scholar Cap + Swaying Gold Tassel
  px(ctx, 6, 5 + hover, 20, 2, '#1e1b4b');
  px(ctx, 9, 3 + hover, 14, 3, '#312e81');
  px(ctx, 6 + tasselSway, 6 + hover, 2, 4, '#facc15');

  // Royal Scroll in Right Wing
  const scrollLift = mode === 'talk' && col % 2 === 1 ? -1 : mode === 'react' ? -2 : 0;
  px(ctx, 24, 17 + hover + scrollLift, 6, 8, '#d97706');
  px(ctx, 25, 18 + hover + scrollLift, 4, 6, '#fef3c7');
  px(ctx, 26, 20 + hover + scrollLift, 2, 2, '#16a34a');

  if (mode === 'react' || (mode === 'talk' && (col === 2 || col === 6))) {
    px(ctx, 27, 13 + hover, 2, 2, '#fde047');
  }

  ctx.restore();
}

function renderHumanNpcCell(
  ctx: CanvasRenderingContext2D,
  kind: Exclude<NpcSpriteKind, 'owl'>,
  ox: number,
  oy: number,
  mode: NpcAnimMode,
  col: number
) {
  ctx.save();
  ctx.translate(ox, oy);

  const c = NPC_STYLE_CONFIG[kind];

  // 8-frame vertical breathing / expressive bounce
  const bobTable =
    mode === 'react'
      ? [0, -1, -2, -1, 0, -1, 0, 0]
      : mode === 'talk'
      ? [0, 0, -1, 0, 0, -1, 0, 0]
      : [0, 0, 1, 1, 1, 0, 0, 0];
  const bob = bobTable[col % 8];

  // Subtle head movement during speech / nod
  const headNod =
    mode === 'talk' && (col === 3 || col === 6)
      ? 1
      : mode === 'react' && (col === 1 || col === 2)
      ? -1
      : 0;
  const headY = bob + headNod;

  // Eye states: Blink, Happy Smile Eyes, or Gaze Shift
  const isBlink = (mode === 'idle' && col === 5) || (mode === 'talk' && col === 7);
  const happyEyes = mode === 'react' && (col === 1 || col === 2 || col === 5);
  const gazeX = mode === 'idle' && (col === 2 || col === 3) ? 1 : 0;

  // Viseme sequence across the 8 talk frames
  const talkVisemes: VisemeKind[] = [
    'half',
    'open',
    'wide',
    'closed',
    'open',
    'half',
    'wide',
    'half',
  ];
  const viseme: VisemeKind =
    mode === 'talk'
      ? talkVisemes[col % 8]
      : mode === 'react'
      ? col % 2 === 1
        ? 'wide'
        : 'half'
      : 'closed';

  // Left-hand gesture lift & right-hand prop lift
  const leftArmLift =
    mode === 'react'
      ? [-2, -4, -3, -4, -2, -3, -1, 0][col % 8]
      : mode === 'talk'
      ? [-1, -2, -3, -1, -2, -3, -1, 0][col % 8]
      : col === 3 || col === 4
      ? 1
      : 0;

  const propLift =
    mode === 'react'
      ? -2
      : mode === 'talk'
      ? [0, -1, -2, 0, -2, -1, -2, 0][col % 8]
      : col === 2 || col === 3
      ? -1
      : 0;

  // Fairy Wings + Magical Sparkles for Peri Perkataan
  if (kind === 'peri_perkataan') {
    const flap = [-2, -1, 1, 2, 1, -1, -2, 0][col % 8];
    px(ctx, 2, 9 + bob + flap, 7, 10, '#22d3ee');
    px(ctx, 23, 9 + bob + flap, 7, 10, '#22d3ee');
    px(ctx, 3, 10 + bob + flap, 5, 8, '#e0f2fe');
    px(ctx, 24, 10 + bob + flap, 5, 8, '#e0f2fe');
    // Twinkling pixie dust
    if (col % 2 === 0) {
      px(ctx, 2, 6 + (col % 4), 1, 1, '#fde047');
      px(ctx, 29, 8 + ((col + 2) % 4), 1, 1, '#f472b6');
    }
  }

  // Ground Shadow
  px(ctx, 8, 28, 16, 3, 'rgba(15,10,35,0.35)');

  // Boots / Feet
  px(ctx, 10, 25, 5, 3, '#3b1d0e');
  px(ctx, 17, 25, 5, 3, '#3b1d0e');
  px(ctx, 10, 25, 5, 1, '#5c2d16');
  px(ctx, 17, 25, 5, 1, '#5c2d16');

  // Torso / Robe / Uniform with shaded hem
  px(ctx, 8, 13 + bob, 16, 12, '#1e1b4b');
  px(ctx, 9, 14 + bob, 14, 10, c.outfit);
  px(ctx, 9, 22 + bob, 14, 2, c.outfitShade);
  px(ctx, 14, 14 + bob, 4, 10, c.trim);

  // Expressive Left Arm (gestures warmly while speaking or greeting!)
  px(ctx, 6, 14 + bob + leftArmLift, 3, 6, c.outfit);
  px(ctx, 6, 19 + bob + leftArmLift, 3, 2, '#fed7aa');
  if (leftArmLift <= -2) {
    // Open gesturing palm highlight
    px(ctx, 5, 18 + bob + leftArmLift, 1, 2, '#fed7aa');
  }

  // Right Arm (holding signature prop)
  px(ctx, 23, 14 + bob + Math.round(propLift * 0.5), 3, 6, c.outfit);
  px(ctx, 23, 19 + bob + Math.round(propLift * 0.5), 3, 2, '#fed7aa');

  // Head, Hair / Hijab & Hat
  if (c.isHijab) {
    const scarfSway = col % 4 === 2 ? 1 : 0;
    px(ctx, 7, 3 + headY, 18, 12, '#1e1b4b');
    px(ctx, 8, 4 + headY, 16, 10, c.hairOrHijab);
    // Soft hijab drape & brooch pin
    px(ctx, 9, 13 + headY, 14 + scarfSway, 2, c.hairOrHijab);
    px(ctx, 15, 13 + headY, 2, 1, '#fde047');
    px(ctx, 10, 6 + headY, 12, 7, '#fed7aa');
  } else {
    px(ctx, 8, 4 + headY, 16, 10, '#1e1b4b');
    px(ctx, 9, 5 + headY, 14, 8, '#fed7aa');
    px(ctx, 8, 3 + headY, 16, 4, c.hairOrHijab);
    if (c.hat) {
      px(ctx, 7, 1 + headY, 18, 3, c.hat);
      if (kind === 'pengawal_istana') {
        // Royal plume crest on helmet
        px(ctx, 14, 0 + headY, 4, 2, '#ef4444');
      } else if (kind === 'peri_perkataan') {
        // Crown gem
        px(ctx, 15, 0 + headY, 2, 2, '#f472b6');
      }
    }
  }

  // Eyebrows (lift slightly on open visemes & greetings!)
  const browLift = viseme === 'open' || mode === 'react' ? -1 : 0;
  px(ctx, 11, 7 + headY + browLift, 2, 1, '#3b1d0e');
  px(ctx, 19, 7 + headY + browLift, 2, 1, '#3b1d0e');

  // Eyes
  if (isBlink) {
    px(ctx, 11, 9 + headY, 2, 1, '#1e1b4b');
    px(ctx, 19, 9 + headY, 2, 1, '#1e1b4b');
  } else if (happyEyes) {
    px(ctx, 11, 8 + headY, 2, 1, '#1e1b4b');
    px(ctx, 10, 9 + headY, 1, 1, '#1e1b4b');
    px(ctx, 13, 9 + headY, 1, 1, '#1e1b4b');
    px(ctx, 19, 8 + headY, 2, 1, '#1e1b4b');
    px(ctx, 18, 9 + headY, 1, 1, '#1e1b4b');
    px(ctx, 21, 9 + headY, 1, 1, '#1e1b4b');
  } else {
    px(ctx, 11 + gazeX, 8 + headY, 2, 2, '#1e1b4b');
    px(ctx, 19 + gazeX, 8 + headY, 2, 2, '#1e1b4b');
    px(ctx, 11 + gazeX, 8 + headY, 1, 1, '#ffffff');
    px(ctx, 19 + gazeX, 8 + headY, 1, 1, '#ffffff');
  }

  // Rosy Cheeks when speaking or greeting
  if (mode === 'talk' || mode === 'react') {
    px(ctx, 10, 10 + headY, 2, 1, '#fda4af');
    px(ctx, 20, 10 + headY, 2, 1, '#fda4af');
  }

  // Spectacles for Encik Hakim & Profesor Bahasa (with animated lens glint!)
  if (kind === 'encik_hakim' || kind === 'profesor_bahasa') {
    const glint = col === 3 || col === 4 ? 'rgba(255,255,255,0.65)' : 'rgba(56,189,248,0.42)';
    px(ctx, 10, 7 + headY, 4, 4, glint);
    px(ctx, 18, 7 + headY, 4, 4, glint);
    px(ctx, 14, 8 + headY, 4, 1, '#334155');
  }

  // Mouth / Viseme Shapes + Profesor Bahasa's Animated Beard!
  if (kind === 'profesor_bahasa') {
    const beardDrop = viseme === 'open' ? 2 : viseme === 'wide' || viseme === 'half' ? 1 : 0;
    // Upper moustache
    px(ctx, 11, 11 + headY, 10, 2, '#f8fafc');
    if (beardDrop > 0) {
      px(ctx, 14, 12 + headY, 4, beardDrop, '#881337');
      if (viseme === 'open') {
        px(ctx, 15, 13 + headY, 2, 1, '#fb7185');
      }
    }
    // Lower white beard
    px(ctx, 12, 13 + headY + beardDrop, 8, 2, '#e2e8f0');
  } else {
    if (viseme === 'closed') {
      px(ctx, 14, 11 + headY, 4, 1, '#9f1239');
    } else if (viseme === 'half') {
      px(ctx, 14, 11 + headY, 4, 2, '#881337');
      px(ctx, 15, 12 + headY, 2, 1, '#fb7185');
    } else if (viseme === 'open') {
      px(ctx, 14, 10 + headY, 4, 3, '#4c0519');
      px(ctx, 15, 12 + headY, 2, 1, '#fb7185');
    } else if (viseme === 'wide') {
      px(ctx, 13, 11 + headY, 6, 2, '#881337');
      px(ctx, 14, 11 + headY, 4, 1, '#fff1f2');
    }
  }

  // Signature Prop with Idle Gleam & Speaking Lift
  const py = bob + propLift;
  const gleam = col === 3 || col === 4 || (mode === 'talk' && col % 3 === 1);

  if (c.prop === 'magnifier') {
    px(ctx, 24, 12 + py, 6, 6, '#facc15');
    px(ctx, 25, 13 + py, 4, 4, gleam ? '#e0f2fe' : '#7dd3fc');
    if (gleam) px(ctx, 25, 13 + py, 2, 2, '#ffffff');
    px(ctx, 26, 18 + py, 2, 4, '#78350f');
  } else if (c.prop === 'newspaper') {
    px(ctx, 22, 14 + py, 8, 7, '#cbd5e1');
    px(ctx, 23, 15 + py, 6, 5, '#f8fafc');
    px(ctx, 24, 16 + py, 4, 1, '#dc2626');
    px(ctx, 24, 18 + py, 4, 1, '#334155');
  } else if (c.prop === 'scroll') {
    px(ctx, 23, 13 + py, 6, 8, '#d97706');
    px(ctx, 24, 14 + py, 4, 6, '#fef3c7');
    px(ctx, 25, 16 + py, 2, 2, gleam ? '#fde047' : '#b45309');
  } else if (c.prop === 'book') {
    px(ctx, 22, 15 + py, 7, 6, '#6d28d9');
    px(ctx, 23, 16 + py, 5, 4, '#fde047');
    px(ctx, 24, 17 + py, 3, 2, gleam ? '#ffffff' : '#fef9c3');
  } else if (c.prop === 'menu') {
    px(ctx, 22, 14 + py, 7, 7, '#7c2d12');
    px(ctx, 23, 15 + py, 5, 5, '#fffbeb');
    px(ctx, 24, 16 + py, 3, 2, '#ea580c');
    // Warm rising noodle steam pixel!
    if (col % 2 === 0) {
      px(ctx, 25, 11 + py, 1, 2, 'rgba(255,255,255,0.75)');
    } else {
      px(ctx, 26, 10 + py, 1, 2, 'rgba(255,255,255,0.65)');
    }
  } else if (c.prop === 'shield') {
    px(ctx, 22, 13 + py, 8, 9, '#facc15');
    px(ctx, 23, 14 + py, 6, 7, '#1d4ed8');
    px(ctx, 25, 15 + py, 2, 5, gleam ? '#ffffff' : '#38bdf8');
  }

  // Cheerful Sparkle Accent on React or Emphatic Speech Frames
  if (mode === 'react' && (col === 1 || col === 2 || col === 5)) {
    px(ctx, 4, 6 + headY, 2, 2, '#fde047');
    px(ctx, 27, 7 + headY, 2, 2, '#fde047');
  }

  ctx.restore();
}

export function getNpcSpriteSheet(kind: NpcSpriteKind): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const cached = npcSpriteSheetCache.get(kind);
  if (cached) return cached;

  const sheet = document.createElement('canvas');
  sheet.width = NPC_CELL * NPC_SHEET_COLS;
  sheet.height = NPC_CELL * NPC_SHEET_ROWS;
  const sCtx = sheet.getContext('2d');
  if (!sCtx) return null;
  sCtx.imageSmoothingEnabled = false;

  const modes: NpcAnimMode[] = ['idle', 'talk', 'react'];
  modes.forEach((mode, rowIdx) => {
    for (let col = 0; col < NPC_SHEET_COLS; col++) {
      const ox = col * NPC_CELL;
      const oy = rowIdx * NPC_CELL;
      if (kind === 'owl') {
        renderOwlCell(sCtx, ox, oy, mode, col);
      } else {
        renderHumanNpcCell(sCtx, kind, ox, oy, mode, col);
      }
    }
  });

  npcSpriteSheetCache.set(kind, sheet);
  return sheet;
}

export function pickNpcTalkFrame(activeChar: string | undefined, step: number): number {
  if (!activeChar) {
    return step % NPC_SHEET_COLS;
  }
  // Natural mid-sentence blink every 14th step
  if (step > 0 && step % 14 === 0) {
    return 7;
  }
  const ch = activeChar.toLowerCase();
  if (/[.,!?;:—\-]/.test(ch)) {
    return 3; // Closed pause on punctuation
  }
  if (ch === ' ') {
    return step % 2 === 0 ? 0 : 3;
  }
  if (/[aou]/.test(ch)) {
    return step % 2 === 0 ? 1 : 4; // Open vowel frames
  }
  if (/[eiy]/.test(ch)) {
    return step % 2 === 0 ? 2 : 6; // Wide vowel frames
  }
  // Consonants alternate half-open & closed syllables
  const consonantFrames = [0, 5, 3, 0];
  return consonantFrames[step % consonantFrames.length];
}

export function drawOwlMascot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale = 2,
  frame = 0,
  mode: NpcAnimMode = 'idle'
) {
  drawNpcSprite(ctx, 'owl', x, y, scale, frame, mode);
}

export function drawNpcSprite(
  ctx: CanvasRenderingContext2D,
  kind: NpcSpriteKind,
  x: number,
  y: number,
  scale = 2,
  frame = 0,
  talkingOrMode: boolean | NpcAnimMode = false
) {
  const mode: NpcAnimMode =
    typeof talkingOrMode === 'string' ? talkingOrMode : talkingOrMode ? 'talk' : 'idle';
  const rowIdx = mode === 'idle' ? 0 : mode === 'talk' ? 1 : 2;
  const colIdx = ((Math.floor(frame) % NPC_SHEET_COLS) + NPC_SHEET_COLS) % NPC_SHEET_COLS;

  const sheet = getNpcSpriteSheet(kind);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (sheet) {
    ctx.drawImage(
      sheet,
      colIdx * NPC_CELL,
      rowIdx * NPC_CELL,
      NPC_CELL,
      NPC_CELL,
      Math.round(x),
      Math.round(y),
      Math.round(NPC_CELL * scale),
      Math.round(NPC_CELL * scale)
    );
  }
  ctx.restore();
}

export function drawCrystalSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale = 2,
  lit = true,
  frame = 0,
  golden = false
) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.imageSmoothingEnabled = false;
  const s = scale;
  const floatY = lit ? (frame % 2 === 0 ? 0 : -1) : 0;

  if (lit) {
    px(
      ctx,
      4,
      2 + floatY,
      8,
      12,
      golden ? 'rgba(250, 204, 21, 0.38)' : 'rgba(56, 189, 248, 0.32)',
      s
    );
  }

  const outer = !lit ? '#475569' : golden ? '#d97706' : '#0284c7';
  const mid = !lit ? '#64748b' : golden ? '#facc15' : '#38bdf8';
  const core = !lit ? '#94a3b8' : golden ? '#fef9c3' : '#e0f2fe';

  px(ctx, 7, 1 + floatY, 2, 14, outer, s);
  px(ctx, 5, 3 + floatY, 6, 10, outer, s);
  px(ctx, 4, 5 + floatY, 8, 6, outer, s);

  px(ctx, 6, 3 + floatY, 4, 10, mid, s);
  px(ctx, 5, 5 + floatY, 6, 6, mid, s);

  px(ctx, 6, 4 + floatY, 2, 5, core, s);

  if (lit && frame % 2 === 0) {
    px(ctx, 2, 2, 2, 1, '#fef08a', s);
    px(ctx, 12, 4, 1, 2, '#fef08a', s);
  }
  ctx.restore();
}

export function drawQuestObjectSprite(
  ctx: CanvasRenderingContext2D,
  kind: ObjectSpriteKind,
  x: number,
  y: number,
  scale = 2,
  solved = false,
  frame = 0
) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.imageSmoothingEnabled = false;
  const s = scale;

  px(ctx, 4, 27, 24, 3, 'rgba(15,10,35,0.32)', s);

  switch (kind) {
    case 'notice_board': {
      px(ctx, 6, 18, 3, 10, '#5c2d16', s);
      px(ctx, 23, 18, 3, 10, '#5c2d16', s);
      px(ctx, 3, 4, 26, 16, '#5c2d16', s);
      px(ctx, 5, 6, 22, 12, '#9a5825', s);
      px(ctx, 7, 8, 8, 8, '#fef3c7', s);
      px(ctx, 10, 7, 2, 2, '#ef4444', s);
      px(ctx, 17, 9, 8, 7, '#fffbeb', s);
      px(ctx, 20, 8, 2, 2, '#22c55e', s);
      px(ctx, 8, 11, 6, 1, '#78350f', s);
      px(ctx, 18, 12, 6, 1, '#78350f', s);
      break;
    }
    case 'signpost': {
      px(ctx, 14, 14, 4, 14, '#5c2d16', s);
      px(ctx, 4, 6, 24, 10, '#5c2d16', s);
      px(ctx, 5, 7, 22, 8, '#b46521', s);
      px(ctx, 8, 9, 14, 2, '#fef3c7', s);
      px(ctx, 10, 12, 10, 1, '#fde68a', s);
      break;
    }
    case 'machine_sign': {
      px(ctx, 6, 5, 20, 23, '#334155', s);
      px(ctx, 7, 6, 18, 21, '#e2e8f0', s);
      px(ctx, 9, 8, 14, 4, '#0284c7', s);
      px(ctx, 11, 14, 10, 10, '#0f172a', s);
      px(ctx, 12, 15, 8, 8, '#38bdf8', s);
      px(ctx, 18, 8, 5, 4, '#fef08a', s);
      break;
    }
    case 'magic_book': {
      px(ctx, 10, 16, 12, 12, '#5c2d16', s);
      px(ctx, 12, 17, 8, 10, '#854d27', s);
      px(ctx, 4, 7, 24, 11, '#6d28d9', s);
      px(ctx, 6, 8, 9, 8, '#fef3c7', s);
      px(ctx, 17, 8, 9, 8, '#fffbeb', s);
      px(ctx, 15, 8, 2, 8, '#d97706', s);
      px(ctx, 8, 10, 5, 1, '#6b21a8', s);
      px(ctx, 19, 10, 5, 1, '#6b21a8', s);
      break;
    }
    case 'document': {
      px(ctx, 4, 14, 24, 13, '#6f4222', s);
      px(ctx, 5, 15, 22, 5, '#9c6234', s);
      px(ctx, 8, 8, 14, 10, '#fef3c7', s);
      px(ctx, 10, 10, 10, 1, '#dc2626', s);
      px(ctx, 10, 13, 8, 1, '#475569', s);
      px(ctx, 19, 11, 5, 5, '#facc15', s);
      px(ctx, 20, 12, 3, 3, '#7dd3fc', s);
      break;
    }
    case 'scroll': {
      px(ctx, 8, 5, 16, 3, '#b45309', s);
      px(ctx, 8, 22, 16, 3, '#b45309', s);
      px(ctx, 9, 8, 14, 14, '#fef3c7', s);
      px(ctx, 11, 11, 10, 1, '#7c2d12', s);
      px(ctx, 11, 14, 8, 1, '#7c2d12', s);
      px(ctx, 11, 17, 10, 1, '#9333ea', s);
      break;
    }
    case 'trolley_sign': {
      px(ctx, 5, 4, 12, 9, '#1d4ed8', s);
      px(ctx, 6, 5, 10, 7, '#eff6ff', s);
      px(ctx, 8, 7, 6, 2, '#ef4444', s);
      px(ctx, 10, 13, 2, 14, '#64748b', s);
      px(ctx, 15, 15, 12, 8, '#94a3b8', s);
      px(ctx, 16, 16, 10, 6, '#cbd5e1', s);
      px(ctx, 16, 24, 3, 3, '#1e293b', s);
      px(ctx, 23, 24, 3, 3, '#1e293b', s);
      break;
    }
    case 'food_menu': {
      px(ctx, 5, 5, 22, 18, '#7c2d12', s);
      px(ctx, 7, 7, 18, 14, '#1e293b', s);
      px(ctx, 9, 12, 14, 6, '#f97316', s);
      px(ctx, 10, 11, 12, 2, '#fde047', s);
      px(ctx, 12, 8, 2, 2, '#e2e8f0', s);
      px(ctx, 17, 8, 2, 2, '#e2e8f0', s);
      px(ctx, 8, 23, 3, 5, '#7c2d12', s);
      px(ctx, 21, 23, 3, 5, '#7c2d12', s);
      break;
    }
    case 'donation_box': {
      px(ctx, 7, 9, 18, 18, '#065f46', s);
      px(ctx, 8, 10, 16, 16, '#10b981', s);
      px(ctx, 12, 11, 8, 2, '#064e3b', s);
      px(ctx, 14, 6, 4, 4, '#facc15', s);
      px(ctx, 10, 16, 12, 6, '#ecfdf5', s);
      px(ctx, 12, 18, 8, 2, '#047857', s);
      break;
    }
    case 'stage_banner': {
      px(ctx, 4, 5, 3, 23, '#78350f', s);
      px(ctx, 25, 5, 3, 23, '#78350f', s);
      px(ctx, 5, 6, 22, 12, '#6d28d9', s);
      px(ctx, 6, 7, 20, 10, '#8b5cf6', s);
      px(ctx, 6, 6, 20, 2, '#facc15', s);
      px(ctx, 9, 10, 14, 2, '#fef08a', s);
      px(ctx, 11, 13, 10, 2, '#ffffff', s);
      break;
    }
    case 'newspaper': {
      px(ctx, 5, 8, 22, 19, '#1e3a8a', s);
      px(ctx, 7, 6, 18, 16, '#f8fafc', s);
      px(ctx, 9, 8, 14, 3, '#dc2626', s);
      px(ctx, 9, 13, 6, 6, '#38bdf8', s);
      px(ctx, 16, 13, 7, 1, '#334155', s);
      px(ctx, 16, 15, 7, 1, '#334155', s);
      px(ctx, 16, 17, 6, 1, '#334155', s);
      break;
    }
    case 'crystal_pedestal': {
      px(ctx, 7, 20, 18, 8, '#cbd5e1', s);
      px(ctx, 9, 15, 14, 6, '#e2e8f0', s);
      px(ctx, 8, 14, 16, 2, '#facc15', s);
      drawCrystalSprite(ctx, 8 * s, 1 * s, s, solved || frame % 2 === 0, frame, true);
      break;
    }
  }

  if (solved) {
    px(ctx, 22, 1, 9, 9, '#059669', s);
    px(ctx, 23, 2, 7, 7, '#34d399', s);
    px(ctx, 25, 5, 4, 2, '#ffffff', s);
  }

  ctx.restore();
}

export function drawBadgeSprite(
  ctx: CanvasRenderingContext2D,
  badgeId: BadgeId | ExplorationBadgeId,
  x: number,
  y: number,
  scale = 2,
  unlocked = true
) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.imageSmoothingEnabled = false;
  const s = scale;

  px(ctx, 10, 20, 5, 10, unlocked ? '#dc2626' : '#475569', s);
  px(ctx, 17, 20, 5, 10, unlocked ? '#dc2626' : '#475569', s);

  const rim = unlocked ? '#facc15' : '#64748b';
  const colorMap: Record<BadgeId | ExplorationBadgeId, string> = {
    lencana_detektif: '#2563eb',
    lencana_pemburu: '#d97706',
    lencana_wira: '#7e22ce',
    lencana_pencari_buku: '#db2777',
    lencana_penjelajah: '#059669',
    lencana_sahabat_bahasa: '#0284c7',
    lencana_pengumpul_ilmu: '#9333ea',
    lencana_peneroka_istana: '#ca8a04',
  };

  const inner = unlocked ? colorMap[badgeId] : '#334155';

  px(ctx, 6, 4, 20, 18, '#451a03', s);
  px(ctx, 7, 5, 18, 16, rim, s);
  px(ctx, 9, 7, 14, 12, inner, s);

  // Star / Emblem inside
  px(ctx, 14, 9, 4, 8, unlocked ? '#fef08a' : '#64748b', s);
  px(ctx, 12, 11, 8, 4, unlocked ? '#fef08a' : '#64748b', s);

  ctx.restore();
}
