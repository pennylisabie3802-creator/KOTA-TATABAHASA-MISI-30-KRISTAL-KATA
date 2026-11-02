import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

const REF_PATH = 'public/assets/aistudio/file_00000000f8a882119cd8d547f7e47862_fc1aea17.png';
const MM_PATH = 'public/assets/ui/main-menu.png';
const OUT_SPRITES_DIR = 'public/assets/sprites';
const OUT_UI_DIR = 'public/assets/ui/menu';

fs.mkdirSync(OUT_SPRITES_DIR, { recursive: true });
fs.mkdirSync(OUT_UI_DIR, { recursive: true });

const refPng = PNG.sync.read(fs.readFileSync(REF_PATH));
const mmPng = PNG.sync.read(fs.readFileSync(MM_PATH));

function createPng(w, h) {
  return new PNG({ width: w, height: h });
}

function getPx(png, x, y) {
  if (x < 0 || x >= png.width || y < 0 || y >= png.height) return [0, 0, 0, 0];
  const i = (png.width * y + x) << 2;
  return [png.data[i], png.data[i + 1], png.data[i + 2], png.data[i + 3]];
}

function setPx(png, x, y, r, g, b, a = 255) {
  if (x < 0 || x >= png.width || y < 0 || y >= png.height) return;
  const i = (png.width * y + x) << 2;
  png.data[i] = r;
  png.data[i + 1] = g;
  png.data[i + 2] = b;
  png.data[i + 3] = a;
}

function blendPx(png, x, y, r, g, b, a = 255) {
  if (a <= 0 || x < 0 || x >= png.width || y < 0 || y >= png.height) return;
  const i = (png.width * y + x) << 2;
  const dstA = png.data[i + 3] / 255;
  const srcA = a / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA <= 0) return;
  png.data[i] = Math.round((r * srcA + png.data[i] * dstA * (1 - srcA)) / outA);
  png.data[i + 1] = Math.round((g * srcA + png.data[i + 1] * dstA * (1 - srcA)) / outA);
  png.data[i + 2] = Math.round((b * srcA + png.data[i + 2] * dstA * (1 - srcA)) / outA);
  png.data[i + 3] = Math.round(outA * 255);
}

// ============================================================================
// 1. EXTRACT 15 REFERENCE POSES WITH CLEAN TRANSPARENCY
// ============================================================================
function extractPoseFromRef(x0, x1, y0, y1) {
  const w = x1 - x0 + 1;
  const h = y1 - y0 + 1;
  const out = createPng(w, h);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b, a] = getPx(refPng, x0 + x, y0 + y);
      setPx(out, x, y, r, g, b, a);
    }
  }

  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let qH = 0;
  let qT = 0;

  function isCardBgColor(r, g, b) {
    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);
    const sat = maxC - minC;
    if (r > b + 10 || g > b + 10) return false;
    return r >= 188 && g >= 198 && b >= 220 && sat <= 48;
  }

  function colorDiff(xA, yA, xB, yB) {
    const [r1, g1, b1] = getPx(out, xA, yA);
    const [r2, g2, b2] = getPx(out, xB, yB);
    return Math.hypot(r1 - r2, g1 - g2, b1 - b2);
  }

  for (let x = 0; x < w; x++) {
    for (const y of [0, 1, h - 2, h - 1]) {
      const [r, g, b] = getPx(out, x, y);
      if (isCardBgColor(r, g, b) && !visited[y * w + x]) {
        visited[y * w + x] = 1;
        queue[qT++] = y * w + x;
      }
    }
  }
  for (let y = 0; y < h; y++) {
    for (const x of [0, 1, w - 2, w - 1]) {
      const [r, g, b] = getPx(out, x, y);
      if (isCardBgColor(r, g, b) && !visited[y * w + x]) {
        visited[y * w + x] = 1;
        queue[qT++] = y * w + x;
      }
    }
  }

  while (qH < qT) {
    const cur = queue[qH++];
    const cx = cur % w;
    const cy = Math.floor(cur / w);
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
      const ni = ny * w + nx;
      if (visited[ni]) continue;
      const [nr, ng, nb] = getPx(out, nx, ny);
      if (isCardBgColor(nr, ng, nb) && colorDiff(cx, cy, nx, ny) < 28) {
        visited[ni] = 1;
        queue[qT++] = ni;
      }
    }
  }

  // Clear enclosed card-background holes between boots/arms
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      if (visited[y * w + x]) continue;
      const [r, g, b] = getPx(out, x, y);
      if (r >= 208 && g >= 218 && b >= 242 && b - r >= 10 && b - g >= 6 && g >= r + 4) {
        visited[y * w + x] = 1;
      }
    }
  }

  // Clear any stray corner dots in top-right / top-left (within 10px of corners)
  for (let y = 0; y < 12; y++) {
    for (let x = 0; x < w; x++) {
      if (x < 8 || x > w - 10) {
        const [r, g, b] = getPx(out, x, y);
        if (b > r + 15 && r < 180) {
          visited[y * w + x] = 1;
        }
      }
    }
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (visited[y * w + x]) {
        setPx(out, x, y, 0, 0, 0, 0);
      }
    }
  }

  // Clean 1px pale cool fringe adjacent to transparency
  const fringeKill = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b, a] = getPx(out, x, y);
      if (a === 0) continue;
      let touchesTrans = false;
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        if (getPx(out, x + dx, y + dy)[3] === 0) touchesTrans = true;
      }
      if (touchesTrans && r >= 195 && g >= 205 && b >= 228 && b >= r && g >= r - 2) {
        fringeKill.push([x, y]);
      }
    }
  }
  for (const [x, y] of fringeKill) {
    setPx(out, x, y, 0, 0, 0, 0);
  }

  // Remove isolated tiny 1-3px specks disconnected from main art
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (getPx(out, x, y)[3] === 0) continue;
      let neighbors = 0;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          if ((dx !== 0 || dy !== 0) && getPx(out, x + dx, y + dy)[3] > 0) neighbors++;
        }
      }
      if (neighbors <= 2) setPx(out, x, y, 0, 0, 0, 0);
    }
  }

  let minX = w, maxX = -1, minY = h, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (getPx(out, x, y)[3] > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const tw = maxX - minX + 1;
  const th = maxY - minY + 1;
  const trimmed = createPng(tw, th);
  for (let y = 0; y < th; y++) {
    for (let x = 0; x < tw; x++) {
      const [r, g, b, a] = getPx(out, minX + x, minY + y);
      setPx(trimmed, x, y, r, g, b, a);
    }
  }
  return trimmed;
}

const wiraPoses = {
  idle: extractPoseFromRef(20, 113, 843, 969),
  blink: extractPoseFromRef(119, 210, 843, 969),
  wave: extractPoseFromRef(215, 316, 843, 969),
  cheer: extractPoseFromRef(319, 401, 842, 969),
  jump: extractPoseFromRef(406, 491, 842, 966),
};

const srikandiPoses = {
  idle: extractPoseFromRef(546, 627, 848, 969),
  blink: extractPoseFromRef(637, 715, 848, 969),
  read: extractPoseFromRef(723, 824, 848, 969),
  cast: extractPoseFromRef(827, 930, 843, 969),
  smile: extractPoseFromRef(934, 1012, 848, 969),
};

const owlPoses = {
  idle: extractPoseFromRef(1049, 1134, 850, 962),
  blink: extractPoseFromRef(1139, 1224, 850, 962),
  flap: extractPoseFromRef(1229, 1333, 847, 963),
  scroll: extractPoseFromRef(1335, 1425, 847, 965),
  cheer: extractPoseFromRef(1428, 1515, 842, 962),
};

// ============================================================================
// 2. INVERSE-MAPPED SEAM-FREE PIXEL POSE RENDERER (NO TEAR LINES!)
// ============================================================================
function renderPoseFrame(pose, cellW, cellH, opts = {}) {
  const {
    anchor = 'bottom',
    dx = 0,
    dy = 0,
    headDy = 0,       // integer px shift for head/upper torso
    headDx = 0,       // integer px horizontal tilt for head
    capeWave = 0,     // integer px shift for flowing left cape/hijab
    rightArmDy = 0,   // integer px shift for raised right arm / book / scroll
    wingFlapDy = 0,   // integer px shift for owl outer wings
    footSquash = 0,   // integer px crouch compression for upper body while boots stay planted
    halfBlink = false,// draw crisp half-closed eyelid intermediate frame
    bookGlow = 0,     // 0..3 magic sparkles
    goldBurst = 0,    // 0..2 celebratory stars
  } = opts;

  const frame = createPng(cellW, cellH);
  const baseX = Math.round((cellW - pose.width) / 2) + dx;
  const baseY =
    anchor === 'bottom'
      ? cellH - 6 - pose.height + dy
      : Math.round((cellH - pose.height) / 2) + dy;

  // Inverse mapping: for every destination pixel (fx, fy), compute source (px, py) cleanly!
  // Because we map destination -> source using smooth step zones, adjacent pixels NEVER leave 1px transparent cracks!
  for (let fy = 0; fy < cellH; fy++) {
    for (let fx = 0; fx < cellW; fx++) {
      const approxPy = fy - baseY;
      const approxPx = fx - baseX;
      const relY = approxPy / pose.height;
      const relX = approxPx / pose.width;

      let ox = 0;
      let oy = 0;

      if (relY < 0.46) {
        oy += headDy;
        ox += headDx;
      } else if (relY < 0.68 && headDy !== 0) {
        oy += Math.round(headDy * 0.5);
      }

      if (capeWave !== 0 && relX < 0.34 && relY > 0.42 && relY < 0.88) {
        ox += capeWave;
      }

      if (rightArmDy !== 0 && relX > 0.64 && relY > 0.24 && relY < 0.78) {
        oy += rightArmDy;
      }

      if (wingFlapDy !== 0 && (relX < 0.28 || relX > 0.72) && relY > 0.26 && relY < 0.82) {
        oy += wingFlapDy;
      }

      if (footSquash > 0 && relY < 0.82) {
        oy += footSquash;
      }

      const srcX = fx - baseX - ox;
      const srcY = fy - baseY - oy;
      if (srcX >= 0 && srcX < pose.width && srcY >= 0 && srcY < pose.height) {
        const [r, g, b, a] = getPx(pose, srcX, srcY);
        if (a > 0) {
          setPx(frame, fx, fy, r, g, b, a);
        }
      }
    }
  }

  // Optional half-blink: blend top half of closed-eye pose over open-eye pose in the eye band (relY 0.26..0.44)
  if (halfBlink && opts.blinkPose) {
    const bp = opts.blinkPose;
    const bx = Math.round((cellW - bp.width) / 2) + dx;
    const by =
      anchor === 'bottom'
        ? cellH - 6 - bp.height + dy
        : Math.round((cellH - bp.height) / 2) + dy;
    const yStart = Math.round(bp.height * 0.27);
    const yEnd = Math.round(bp.height * 0.37);
    for (let py = yStart; py <= yEnd; py++) {
      for (let px = Math.round(bp.width * 0.25); px <= Math.round(bp.width * 0.78); px++) {
        const [r, g, b, a] = getPx(bp, px, py);
        if (a > 0) {
          setPx(frame, bx + px, by + py, r, g, b, a);
        }
      }
    }
  }

  function drawPixelStar(cx, cy, mainCol, coreCol = [255, 255, 255]) {
    blendPx(frame, cx, cy, coreCol[0], coreCol[1], coreCol[2], 255);
    for (const [sx, sy] of [[1,0],[-1,0],[0,1],[0,-1],[2,0],[-2,0],[0,2],[0,-2]]) {
      const alpha = Math.abs(sx) + Math.abs(sy) === 1 ? 255 : 200;
      blendPx(frame, cx + sx, cy + sy, mainCol[0], mainCol[1], mainCol[2], alpha);
    }
  }

  if (bookGlow > 0) {
    const cx = Math.round(cellW * 0.62);
    const cy = Math.round(cellH * 0.54);
    const offsets = [
      [-14, -8 - bookGlow * 3, [253, 224, 71]],
      [12, -12 - bookGlow * 4, [192, 132, 252]],
      [-4, -18 - bookGlow * 4, [125, 211, 252]],
      [18, -2 - bookGlow * 3, [253, 224, 71]],
    ];
    for (let i = 0; i < Math.min(offsets.length, bookGlow + 1); i++) {
      const [ox, oy, col] = offsets[i];
      drawPixelStar(cx + ox, cy + oy, col);
    }
  }

  if (goldBurst > 0) {
    drawPixelStar(Math.round(cellW * 0.24), Math.round(cellH * 0.18 - goldBurst * 2), [253, 224, 71]);
    drawPixelStar(Math.round(cellW * 0.78), Math.round(cellH * 0.16 - goldBurst * 2), [125, 211, 252]);
  }

  return frame;
}

function packSpriteSheet(rowsSpec, cellW, cellH, outFile) {
  const maxCols = Math.max(...rowsSpec.map((r) => r.frames.length));
  const sheet = createPng(maxCols * cellW, rowsSpec.length * cellH);
  rowsSpec.forEach((row, rIdx) => {
    row.frames.forEach((frm, cIdx) => {
      for (let y = 0; y < cellH; y++) {
        for (let x = 0; x < cellW; x++) {
          const [r, g, b, a] = getPx(frm, x, y);
          setPx(sheet, cIdx * cellW + x, rIdx * cellH + y, r, g, b, a);
        }
      }
    });
  });
  fs.writeFileSync(outFile, PNG.sync.write(sheet));
  console.log('Wrote seam-free sprite sheet:', outFile, sheet.width + 'x' + sheet.height);
}

const WIRA_W = 120, WIRA_H = 148;
packSpriteSheet(
  [
    {
      name: 'IDLE',
      frames: [
        renderPoseFrame(wiraPoses.idle, WIRA_W, WIRA_H, { headDy: 0, capeWave: 0 }),
        renderPoseFrame(wiraPoses.idle, WIRA_W, WIRA_H, { headDy: -1, capeWave: -1 }),
        renderPoseFrame(wiraPoses.idle, WIRA_W, WIRA_H, { headDy: -2, capeWave: -2 }),
        renderPoseFrame(wiraPoses.idle, WIRA_W, WIRA_H, { headDy: -1, capeWave: -1 }),
      ],
    },
    {
      name: 'BLINK', // open -> half-closed -> closed -> open
      frames: [
        renderPoseFrame(wiraPoses.idle, WIRA_W, WIRA_H, { headDy: 0 }),
        renderPoseFrame(wiraPoses.idle, WIRA_W, WIRA_H, { halfBlink: true, blinkPose: wiraPoses.blink }),
        renderPoseFrame(wiraPoses.blink, WIRA_W, WIRA_H, { headDy: 1, capeWave: -1 }),
        renderPoseFrame(wiraPoses.idle, WIRA_W, WIRA_H, { headDy: 0 }),
      ],
    },
    {
      name: 'WAVE',
      frames: [
        renderPoseFrame(wiraPoses.idle, WIRA_W, WIRA_H, { headDy: -1 }),
        renderPoseFrame(wiraPoses.wave, WIRA_W, WIRA_H, { rightArmDy: 1, headDx: 0, capeWave: -1 }),
        renderPoseFrame(wiraPoses.wave, WIRA_W, WIRA_H, { rightArmDy: -2, headDx: 1, headDy: -1, capeWave: -2 }),
        renderPoseFrame(wiraPoses.wave, WIRA_W, WIRA_H, { rightArmDy: 1, headDx: 0, capeWave: -1 }),
        renderPoseFrame(wiraPoses.wave, WIRA_W, WIRA_H, { rightArmDy: -2, headDx: 1, headDy: -1, capeWave: -2 }),
        renderPoseFrame(wiraPoses.idle, WIRA_W, WIRA_H, { headDy: 0 }),
      ],
    },
    {
      name: 'CHEER',
      frames: [
        renderPoseFrame(wiraPoses.idle, WIRA_W, WIRA_H, { footSquash: 2 }),
        renderPoseFrame(wiraPoses.cheer, WIRA_W, WIRA_H, { dy: -3, capeWave: -1, goldBurst: 1 }),
        renderPoseFrame(wiraPoses.cheer, WIRA_W, WIRA_H, { dy: -7, rightArmDy: -2, capeWave: -2, goldBurst: 2 }),
        renderPoseFrame(wiraPoses.cheer, WIRA_W, WIRA_H, { dy: -4, capeWave: -1, goldBurst: 1 }),
        renderPoseFrame(wiraPoses.cheer, WIRA_W, WIRA_H, { dy: -1, capeWave: 0 }),
        renderPoseFrame(wiraPoses.idle, WIRA_W, WIRA_H, { headDy: 0 }),
      ],
    },
    {
      name: 'JUMP',
      frames: [
        renderPoseFrame(wiraPoses.idle, WIRA_W, WIRA_H, { footSquash: 2, headDy: 1 }),
        renderPoseFrame(wiraPoses.idle, WIRA_W, WIRA_H, { footSquash: 3, headDy: 2, capeWave: 1 }),
        renderPoseFrame(wiraPoses.jump, WIRA_W, WIRA_H, { dy: -6, capeWave: -1 }),
        renderPoseFrame(wiraPoses.jump, WIRA_W, WIRA_H, { dy: -13, rightArmDy: -2, capeWave: -2, goldBurst: 1 }),
        renderPoseFrame(wiraPoses.jump, WIRA_W, WIRA_H, { dy: -15, rightArmDy: -2, capeWave: -2, goldBurst: 2 }),
        renderPoseFrame(wiraPoses.jump, WIRA_W, WIRA_H, { dy: -8, capeWave: -1 }),
        renderPoseFrame(wiraPoses.idle, WIRA_W, WIRA_H, { footSquash: 2, headDy: 1 }),
        renderPoseFrame(wiraPoses.idle, WIRA_W, WIRA_H, { headDy: 0 }),
      ],
    },
  ],
  WIRA_W,
  WIRA_H,
  path.join(OUT_SPRITES_DIR, 'wira-bahasa-sheet.png')
);

const SRI_W = 120, SRI_H = 144;
packSpriteSheet(
  [
    {
      name: 'IDLE',
      frames: [
        renderPoseFrame(srikandiPoses.idle, SRI_W, SRI_H, { headDy: 0, capeWave: 0 }),
        renderPoseFrame(srikandiPoses.idle, SRI_W, SRI_H, { headDy: -1, capeWave: -1 }),
        renderPoseFrame(srikandiPoses.idle, SRI_W, SRI_H, { headDy: -2, capeWave: -2 }),
        renderPoseFrame(srikandiPoses.idle, SRI_W, SRI_H, { headDy: -1, capeWave: -1 }),
      ],
    },
    {
      name: 'BLINK',
      frames: [
        renderPoseFrame(srikandiPoses.idle, SRI_W, SRI_H, { headDy: 0 }),
        renderPoseFrame(srikandiPoses.idle, SRI_W, SRI_H, { halfBlink: true, blinkPose: srikandiPoses.blink, headDy: 1 }),
        renderPoseFrame(srikandiPoses.blink, SRI_W, SRI_H, { headDy: 2, capeWave: -1 }),
        renderPoseFrame(srikandiPoses.idle, SRI_W, SRI_H, { headDy: 0 }),
      ],
    },
    {
      name: 'READ',
      frames: [
        renderPoseFrame(srikandiPoses.idle, SRI_W, SRI_H, { headDy: 1 }),
        renderPoseFrame(srikandiPoses.read, SRI_W, SRI_H, { rightArmDy: 1, headDy: 0 }),
        renderPoseFrame(srikandiPoses.read, SRI_W, SRI_H, { rightArmDy: -1, headDx: 1, bookGlow: 1 }),
        renderPoseFrame(srikandiPoses.read, SRI_W, SRI_H, { rightArmDy: 0, headDx: 0, bookGlow: 2 }),
        renderPoseFrame(srikandiPoses.read, SRI_W, SRI_H, { rightArmDy: -1, headDx: 1, bookGlow: 1 }),
        renderPoseFrame(srikandiPoses.idle, SRI_W, SRI_H, { headDy: 0 }),
      ],
    },
    {
      name: 'CAST_MAGIC',
      frames: [
        renderPoseFrame(srikandiPoses.read, SRI_W, SRI_H, { bookGlow: 1 }),
        renderPoseFrame(srikandiPoses.cast, SRI_W, SRI_H, { dy: -1, rightArmDy: 0, bookGlow: 1 }),
        renderPoseFrame(srikandiPoses.cast, SRI_W, SRI_H, { dy: -2, rightArmDy: -2, capeWave: -1, bookGlow: 2 }),
        renderPoseFrame(srikandiPoses.cast, SRI_W, SRI_H, { dy: -3, rightArmDy: -3, capeWave: -2, bookGlow: 3 }),
        renderPoseFrame(srikandiPoses.cast, SRI_W, SRI_H, { dy: -3, rightArmDy: -2, capeWave: -2, bookGlow: 3 }),
        renderPoseFrame(srikandiPoses.cast, SRI_W, SRI_H, { dy: -1, rightArmDy: -1, capeWave: -1, bookGlow: 2 }),
        renderPoseFrame(srikandiPoses.smile, SRI_W, SRI_H, { headDy: -1, bookGlow: 1 }),
        renderPoseFrame(srikandiPoses.idle, SRI_W, SRI_H, { headDy: 0 }),
      ],
    },
    {
      name: 'SMILE',
      frames: [
        renderPoseFrame(srikandiPoses.idle, SRI_W, SRI_H, { headDy: 0 }),
        renderPoseFrame(srikandiPoses.blink, SRI_W, SRI_H, { headDy: 1 }),
        renderPoseFrame(srikandiPoses.smile, SRI_W, SRI_H, { headDy: -1, headDx: 1 }),
        renderPoseFrame(srikandiPoses.smile, SRI_W, SRI_H, { headDy: -2, headDx: 1, capeWave: -1 }),
        renderPoseFrame(srikandiPoses.smile, SRI_W, SRI_H, { headDy: -1, headDx: 0 }),
        renderPoseFrame(srikandiPoses.idle, SRI_W, SRI_H, { headDy: 0 }),
      ],
    },
  ],
  SRI_W,
  SRI_H,
  path.join(OUT_SPRITES_DIR, 'srikandi-bahasa-sheet.png')
);

const OWL_W = 120, OWL_H = 136;
packSpriteSheet(
  [
    {
      name: 'IDLE',
      frames: [
        renderPoseFrame(owlPoses.idle, OWL_W, OWL_H, { anchor: 'center', dy: 2, wingFlapDy: 0 }),
        renderPoseFrame(owlPoses.idle, OWL_W, OWL_H, { anchor: 'center', dy: -1, wingFlapDy: -1 }),
        renderPoseFrame(owlPoses.idle, OWL_W, OWL_H, { anchor: 'center', dy: -3, wingFlapDy: -2 }),
        renderPoseFrame(owlPoses.idle, OWL_W, OWL_H, { anchor: 'center', dy: 0, wingFlapDy: -1 }),
      ],
    },
    {
      name: 'BLINK',
      frames: [
        renderPoseFrame(owlPoses.idle, OWL_W, OWL_H, { anchor: 'center', dy: 0 }),
        renderPoseFrame(owlPoses.idle, OWL_W, OWL_H, { anchor: 'center', halfBlink: true, blinkPose: owlPoses.blink, dy: 1 }),
        renderPoseFrame(owlPoses.blink, OWL_W, OWL_H, { anchor: 'center', dy: 1, headDy: 1 }),
        renderPoseFrame(owlPoses.idle, OWL_W, OWL_H, { anchor: 'center', dy: 0 }),
      ],
    },
    {
      name: 'FLAP',
      frames: [
        renderPoseFrame(owlPoses.idle, OWL_W, OWL_H, { anchor: 'center', dy: 3, wingFlapDy: 2 }),
        renderPoseFrame(owlPoses.flap, OWL_W, OWL_H, { anchor: 'center', dy: -2, wingFlapDy: -2 }),
        renderPoseFrame(owlPoses.flap, OWL_W, OWL_H, { anchor: 'center', dy: -6, wingFlapDy: -4 }),
        renderPoseFrame(owlPoses.idle, OWL_W, OWL_H, { anchor: 'center', dy: -2, wingFlapDy: 1 }),
        renderPoseFrame(owlPoses.flap, OWL_W, OWL_H, { anchor: 'center', dy: -5, wingFlapDy: -3 }),
        renderPoseFrame(owlPoses.idle, OWL_W, OWL_H, { anchor: 'center', dy: 1, wingFlapDy: 0 }),
      ],
    },
    {
      name: 'LIFT_SCROLL',
      frames: [
        renderPoseFrame(owlPoses.idle, OWL_W, OWL_H, { anchor: 'center', dy: 1 }),
        renderPoseFrame(owlPoses.scroll, OWL_W, OWL_H, { anchor: 'center', dy: -1, rightArmDy: 1 }),
        renderPoseFrame(owlPoses.scroll, OWL_W, OWL_H, { anchor: 'center', dy: -3, rightArmDy: -2, headDx: 1 }),
        renderPoseFrame(owlPoses.scroll, OWL_W, OWL_H, { anchor: 'center', dy: -4, rightArmDy: -3, headDx: 1, goldBurst: 1 }),
        renderPoseFrame(owlPoses.scroll, OWL_W, OWL_H, { anchor: 'center', dy: -2, rightArmDy: -1 }),
        renderPoseFrame(owlPoses.idle, OWL_W, OWL_H, { anchor: 'center', dy: 0 }),
      ],
    },
    {
      name: 'CHEER',
      frames: [
        renderPoseFrame(owlPoses.idle, OWL_W, OWL_H, { anchor: 'center', dy: 2 }),
        renderPoseFrame(owlPoses.cheer, OWL_W, OWL_H, { anchor: 'center', dy: -4, wingFlapDy: -2, goldBurst: 1 }),
        renderPoseFrame(owlPoses.cheer, OWL_W, OWL_H, { anchor: 'center', dy: -9, wingFlapDy: -4, goldBurst: 2 }),
        renderPoseFrame(owlPoses.flap, OWL_W, OWL_H, { anchor: 'center', dy: -5, wingFlapDy: -2 }),
        renderPoseFrame(owlPoses.cheer, OWL_W, OWL_H, { anchor: 'center', dy: -8, wingFlapDy: -3, goldBurst: 2 }),
        renderPoseFrame(owlPoses.idle, OWL_W, OWL_H, { anchor: 'center', dy: 0 }),
      ],
    },
  ],
  OWL_W,
  OWL_H,
  path.join(OUT_SPRITES_DIR, 'burung-hantu-sheet.png')
);

// ============================================================================
// 3. EXTRACT CLEAN OCTAGONAL PIXEL BUTTONS + SEPARATE ICON CROPS
// ============================================================================
function extractCleanButton(x0, x1, y0, y1, outName) {
  const w = x1 - x0 + 1;
  const h = y1 - y0 + 1;
  const out = createPng(w, h);

  // For each row y, find leftmost and rightmost dark outline pixel so everything outside the octagonal button border is 100% transparent!
  const maskInside = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    let leftEdge = -1;
    let rightEdge = -1;
    for (let x = 0; x < Math.floor(w * 0.35); x++) {
      const [r, g, b] = getPx(mmPng, x0 + x, y0 + y);
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum < 78) {
        leftEdge = x;
        break;
      }
    }
    for (let x = w - 1; x >= Math.floor(w * 0.65); x--) {
      const [r, g, b] = getPx(mmPng, x0 + x, y0 + y);
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum < 78) {
        rightEdge = x;
        break;
      }
    }
    if (leftEdge !== -1 && rightEdge !== -1 && rightEdge - leftEdge > w * 0.5) {
      for (let x = leftEdge; x <= rightEdge; x++) {
        const [r, g, b, a] = getPx(mmPng, x0 + x, y0 + y);
        setPx(out, x, y, r, g, b, a);
        maskInside[y * w + x] = 1;
      }
    }
  }

  fs.writeFileSync(path.join(OUT_UI_DIR, outName), PNG.sync.write(out));
  console.log('Wrote clean button:', outName, w + 'x' + h);
  return { x0, y0, x1, y1, w, h, maskInside };
}

const btnMula = extractCleanButton(585, 935, 385, 473, 'btn-mula.png');
const btnBahan = extractCleanButton(614, 930, 476, 546, 'btn-bahan.png');
const btnInventori = extractCleanButton(614, 930, 548, 614, 'btn-inventori.png');
const btnPeta = extractCleanButton(614, 932, 616, 688, 'btn-peta.png');

// ============================================================================
// 4. EXTRACT CLEAN TITLE EMBLEM (Connected Component from Center -> Zero Tree/Owl/Castle Bleed)
// ============================================================================
{
  const tx0 = 292, tx1 = 936, ty0 = 4, ty1 = 382;
  const tw = tx1 - tx0 + 1;
  const th = ty1 - ty0 + 1;
  const titlePng = createPng(tw, th);
  const bgVis = new Uint8Array(tw * th);
  const q = new Int32Array(tw * th);
  let qH = 0, qT = 0;

  function isTitleExterior(lx, ly) {
    const gx = tx0 + lx;
    const gy = ty0 + ly;
    // Hard geometric exclusion of owl scroll (bottom-left of box), top-left tree leaves, and right castle tower!
    if (lx < 48 && gy > 185 && gy < 275) return true; // Owl's scroll edge
    if (lx < 68 && gy < 72) return true;              // Tree leaves top-left
    if (lx > tw - 62 && gy > 185) return true;        // Right castle turret
    if (gy > 282 && (lx < 76 || lx > tw - 102)) return true; // Foliage left/right of parchment scroll

    const [r, g, b] = getPx(mmPng, gx, gy);
    const isBrightSky = b >= 200 && g >= 132 && r <= 215 && b > r + 22;
    const isCloud = r >= 192 && g >= 210 && b >= 236 && b >= r;
    const isMistyValley = gy > 245 && (lx < 95 || lx > tw - 115) && g >= 112 && r <= 178 && (g > r + 10 || b > r + 12);
    return isBrightSky || isCloud || isMistyValley;
  }

  for (let x = 0; x < tw; x++) {
    for (const y of [0, 1, th - 2, th - 1]) {
      if (isTitleExterior(x, y) && !bgVis[y * tw + x]) {
        bgVis[y * tw + x] = 1;
        q[qT++] = y * tw + x;
      }
    }
  }
  for (let y = 0; y < th; y++) {
    for (const x of [0, 1, tw - 2, tw - 1]) {
      if (isTitleExterior(x, y) && !bgVis[y * tw + x]) {
        bgVis[y * tw + x] = 1;
        q[qT++] = y * tw + x;
      }
    }
  }

  while (qH < qT) {
    const cur = q[qH++];
    const cx = cur % tw;
    const cy = Math.floor(cur / tw);
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || nx >= tw || ny < 0 || ny >= th) continue;
      const ni = ny * tw + nx;
      if (bgVis[ni]) continue;
      if (isTitleExterior(nx, ny)) {
        bgVis[ni] = 1;
        q[qT++] = ni;
      }
    }
  }

  // Keep ONLY the main connected component attached to the center of the title (tw/2, th/2)
  const keep = new Uint8Array(tw * th);
  const cq = new Int32Array(tw * th);
  let cH = 0, cT = 0;
  const seedX = Math.floor(tw / 2);
  const seedY = Math.floor(th * 0.45);
  keep[seedY * tw + seedX] = 1;
  cq[cT++] = seedY * tw + seedX;
  while (cH < cT) {
    const cur = cq[cH++];
    const cx = cur % tw;
    const cy = Math.floor(cur / tw);
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || nx >= tw || ny < 0 || ny >= th) continue;
        const ni = ny * tw + nx;
        if (keep[ni] || bgVis[ni]) continue;
        keep[ni] = 1;
        cq[cT++] = ni;
      }
    }
  }

  for (let y = 0; y < th; y++) {
    for (let x = 0; x < tw; x++) {
      if (keep[y * tw + x]) {
        const [r, g, b, a] = getPx(mmPng, tx0 + x, ty0 + y);
        setPx(titlePng, x, y, r, g, b, a);
      }
    }
  }

  fs.writeFileSync(path.join(OUT_UI_DIR, 'title-emblem.png'), PNG.sync.write(titlePng));
  console.log('Wrote clean title-emblem.png:', tw + 'x' + th);

  // Store title mask globally for cleanBg inpainting
  globalThis.__titleMask = { tx0, ty0, tw, th, keep };
}

// ============================================================================
// 5. BUILD NATURAL PIXEL-ART CLEAN BACKGROUND PLATE (1280x720)
//    Uses real pixel-art patches sampled from clean areas of main-menu.png
//    guided by smooth harmonic color fields so boundaries are 100% seamless!
// ============================================================================
const cleanBg = createPng(mmPng.width, mmPng.height);
for (let i = 0; i < mmPng.data.length; i++) {
  cleanBg.data[i] = mmPng.data[i];
}

function hash2d(x, y) {
  let h = (x * 374761393 + y * 668265263) ^ 0x5bd1e995;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

const W = mmPng.width;
const H = mmPng.height;
const erase = new Uint8Array(W * H);

// (A) Title mask (expanded to full title + ribbon + quill tips: x=284..946, y=4..382 where non-sky)
{
  const { tx0, ty0, tw, th, keep } = globalThis.__titleMask;
  for (let ly = 0; ly < th; ly++) {
    for (let lx = 0; lx < tw; lx++) {
      if (keep[ly * tw + lx]) {
        for (let dy = -6; dy <= 6; dy++) {
          for (let dx = -12; dx <= 12; dx++) {
            const gx = tx0 + lx + dx;
            const gy = ty0 + ly + dy;
            if (gx >= 0 && gx < W && gy >= 0 && gy < H) erase[gy * W + gx] = 1;
          }
        }
      }
    }
  }
  // Explicitly clear ribbon ends & exclamation quill tip on title emblem
  for (let y = 115; y <= 305; y++) {
    for (let x = 285; x <= 944; x++) {
      if (x < 915 || y < 235) erase[y * W + x] = 1;
    }
  }
}

// (B) Owl mask
for (let y = 132; y <= 312; y++) {
  const xMin = y < 178 ? 116 : 92;
  const xMax = y < 200 ? 288 : 316;
  for (let x = xMin; x <= xMax; x++) {
    erase[y * W + x] = 1;
  }
}

// (C) Wira & Srikandi mask (includes Srikandi's magic book & sparkles up to x=562!)
for (let y = 328; y <= 705; y++) {
  let xMin = 14;
  let xMax = 562;
  if (y < 385) {
    xMin = 98;
    xMax = 304;
  } else if (y < 435) {
    xMin = 74;
    xMax = 545;
  } else if (y < 515) {
    xMin = 76;
    xMax = 562;
  } else if (y < 555) {
    xMin = 24;
    xMax = 562;
  }
  for (let x = xMin; x <= xMax; x++) {
    erase[y * W + x] = 1;
  }
}

// (D) 4 Menu Buttons (+4px margin)
for (const [bx0, bx1, by0, by1] of [
  [580, 940, 381, 477],
  [608, 936, 472, 550],
  [608, 936, 544, 618],
  [608, 938, 612, 692],
]) {
  for (let y = by0; y <= by1; y++) {
    for (let x = bx0; x <= bx1; x++) {
      erase[y * W + x] = 1;
    }
  }
}

const DW = 320;
const DH = 180;
const dMask = new Uint8Array(DW * DH);
const dR = new Float32Array(DW * DH);
const dG = new Float32Array(DW * DH);
const dB = new Float32Array(DW * DH);

for (let dy = 0; dy < DH; dy++) {
  for (let dx = 0; dx < DW; dx++) {
    let rSum = 0, gSum = 0, bSum = 0, cnt = 0;
    for (let oy = 0; oy < 4; oy++) {
      for (let ox = 0; ox < 4; ox++) {
        const gx = dx * 4 + ox;
        const gy = dy * 4 + oy;
        if (!erase[gy * W + gx]) {
          const [r, g, b] = getPx(mmPng, gx, gy);
          rSum += r;
          gSum += g;
          bSum += b;
          cnt++;
        }
      }
    }
    const di = dy * DW + dx;
    if (cnt >= 10) {
      dMask[di] = 0;
      dR[di] = rSum / cnt;
      dG[di] = gSum / cnt;
      dB[di] = bSum / cnt;
    } else {
      dMask[di] = 1;
      const gy = dy * 4;
      if (gy < 220) { dR[di] = 75; dG[di] = 175; dB[di] = 248; }
      else if (gy < 360) { dR[di] = 105; dG[di] = 165; dB[di] = 215; }
      else if (gy < 535) { dR[di] = 78; dG[di] = 168; dB[di] = 105; }
      else if (gy < 650) { dR[di] = 95; dG[di] = 182; dB[di] = 75; }
      else { dR[di] = 175; dG[di] = 195; dB[di] = 95; }
    }
  }
}

const nR = new Float32Array(DW * DH);
const nG = new Float32Array(DW * DH);
const nB = new Float32Array(DW * DH);
for (let iter = 0; iter < 550; iter++) {
  for (let dy = 0; dy < DH; dy++) {
    for (let dx = 0; dx < DW; dx++) {
      const di = dy * DW + dx;
      if (!dMask[di]) {
        nR[di] = dR[di];
        nG[di] = dG[di];
        nB[di] = dB[di];
        continue;
      }
      let sr = 0, sg = 0, sb = 0, wSum = 0;
      for (const [ox, oy, w] of [[-1, 0, 1.8], [1, 0, 1.8], [0, -1, 1.0], [0, 1, 1.0]]) {
        const nx = dx + ox;
        const ny = dy + oy;
        if (nx < 0 || nx >= DW || ny < 0 || ny >= DH) continue;
        const ni = ny * DW + nx;
        sr += dR[ni] * w;
        sg += dG[ni] * w;
        sb += dB[ni] * w;
        wSum += w;
      }
      nR[di] = sr / wSum;
      nG[di] = sg / wSum;
      nB[di] = sb / wSum;
    }
  }
  dR.set(nR);
  dG.set(nG);
  dB.set(nB);
}

function sampleHarmonic(gx, gy) {
  const fx = Math.max(0, Math.min(DW - 1.001, gx / 4));
  const fy = Math.max(0, Math.min(DH - 1.001, gy / 4));
  const x0 = Math.floor(fx), y0 = Math.floor(fy);
  const tx = fx - x0, ty = fy - y0;
  const i00 = y0 * DW + x0;
  const i10 = y0 * DW + (x0 + 1);
  const i01 = (y0 + 1) * DW + x0;
  const i11 = (y0 + 1) * DW + (x0 + 1);
  const r = (dR[i00] * (1 - tx) + dR[i10] * tx) * (1 - ty) + (dR[i01] * (1 - tx) + dR[i11] * tx) * ty;
  const g = (dG[i00] * (1 - tx) + dG[i10] * tx) * (1 - ty) + (dG[i01] * (1 - tx) + dG[i11] * tx) * ty;
  const b = (dB[i00] * (1 - tx) + dB[i10] * tx) * (1 - ty) + (dB[i01] * (1 - tx) + dB[i11] * tx) * ty;
  return [r, g, b];
}

// Smooth non-periodic 2D value noise for organic pixel-art leaf/grass clusters (zero wavy grids!)
function valueNoise(fx, fy) {
  const x0 = Math.floor(fx), y0 = Math.floor(fy);
  const tx = fx - x0, ty = fy - y0;
  const sx = tx * tx * (3 - 2 * tx);
  const sy = ty * ty * (3 - 2 * ty);
  const v00 = (hash2d(x0, y0) & 1023) / 1023;
  const v10 = (hash2d(x0 + 1, y0) & 1023) / 1023;
  const v01 = (hash2d(x0, y0 + 1) & 1023) / 1023;
  const v11 = (hash2d(x0 + 1, y0 + 1) & 1023) / 1023;
  return (v00 * (1 - sx) + v10 * sx) * (1 - sy) + (v01 * (1 - sx) + v11 * sx) * sy;
}

function fbmPixel(bx, by) {
  return (
    (valueNoise(bx * 0.16, by * 0.2) - 0.5) * 1.3 +
    (valueNoise(bx * 0.37 + 17.3, by * 0.41 + 9.1) - 0.5) * 0.7
  );
}

for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    if (!erase[y * W + x]) continue;

    const px = x & ~1;
    const py = y & ~1;
    let [r, g, b] = sampleHarmonic(px, py);

    const bx = px >> 1;
    const by = py >> 1;
    const h = hash2d(bx, by);
    const nVal = fbmPixel(bx, by);

    if (py < 245) {
      r = Math.round(r / 5) * 5;
      g = Math.round(g / 5) * 5;
      b = Math.round(b / 4) * 4;
    } else if (py < 495) {
      const delta = nVal > 0.24 ? 13 : nVal < -0.24 ? -13 : (h % 3 - 1) * 4;
      r = Math.max(20, Math.min(245, Math.round((r + delta * 0.8) / 4) * 4));
      g = Math.max(35, Math.min(248, Math.round((g + delta * 1.1) / 4) * 4));
      b = Math.max(40, Math.min(252, Math.round((b + delta * 0.75) / 4) * 4));
    } else {
      const isWarmPath = r > g - 18 && py > 635;
      if (isWarmPath) {
        const cobble = (hash2d(Math.floor(bx / 3), Math.floor(by / 2)) % 5 - 2) * 8;
        r = Math.max(90, Math.min(250, Math.round(r + cobble)));
        g = Math.max(85, Math.min(235, Math.round(g + cobble * 0.85)));
        b = Math.max(60, Math.min(195, Math.round(b + cobble * 0.65)));
      } else {
        const leafDelta = nVal > 0.2 ? 16 : nVal < -0.2 ? -15 : (h % 3 - 1) * 5;
        r = Math.max(25, Math.min(230, Math.round(r + leafDelta * 0.85)));
        g = Math.max(65, Math.min(238, Math.round(g + leafDelta * 1.15)));
        b = Math.max(25, Math.min(180, Math.round(b + leafDelta * 0.45)));

        const fCellX = Math.floor(bx / 6);
        const fCellY = Math.floor(by / 5);
        const fh = hash2d(fCellX, fCellY);
        const fxOff = fh % 3;
        const fyOff = (fh >> 3) % 2;
        if (py >= 535 && py <= 675 && fh % 11 === 0) {
          const lx = (bx % 6) - fxOff;
          const ly = (by % 5) - fyOff;
          if (lx === 1 && ly === 1) {
            r = 253; g = 224; b = 71;
          } else if ((lx === 1 && (ly === 0 || ly === 2)) || (ly === 1 && (lx === 0 || lx === 2))) {
            if ((fh >> 5) % 2 === 0) { r = 244; g = 114; b = 182; }
            else { r = 232; g = 121; b = 249; }
          }
        }
      }
    }

    setPx(cleanBg, x, y, r, g, b, 255);
  }
}

// Also clean title-emblem.png to include the full ribbon & exclamation quill cleanly!
{
  const tx0 = 278, tx1 = 946, ty0 = 4, ty1 = 382;
  const tw = tx1 - tx0 + 1;
  const th = ty1 - ty0 + 1;
  const fullTitle = createPng(tw, th);
  const bgVis = new Uint8Array(tw * th);
  const q = new Int32Array(tw * th);
  let qH = 0, qT = 0;

  function isExterior(lx, ly) {
    const gx = tx0 + lx;
    const gy = ty0 + ly;
    if (gx < 312 && gy > 180 && gy < 276) return true; // Owl's scroll
    if (gx < 358 && gy < 72) return true;              // Top-left tree leaves
    if (gx > 892 && gy > 195) return true;             // Right castle turret
    if (gy > 282 && (gx < 368 || gx > 836)) return true; // Scenery left/right of parchment

    const [r, g, b] = getPx(mmPng, gx, gy);
    const isBrightSky = b >= 200 && g >= 132 && r <= 215 && b > r + 22;
    const isCloud = r >= 192 && g >= 210 && b >= 236 && b >= r;
    const isValley = gy > 245 && (gx < 375 || gx > 828) && g >= 112 && r <= 178 && (g > r + 10 || b > r + 12);
    return isBrightSky || isCloud || isValley;
  }

  for (let x = 0; x < tw; x++) {
    for (const y of [0, 1, th - 2, th - 1]) {
      if (isExterior(x, y) && !bgVis[y * tw + x]) {
        bgVis[y * tw + x] = 1;
        q[qT++] = y * tw + x;
      }
    }
  }
  for (let y = 0; y < th; y++) {
    for (const x of [0, 1, tw - 2, tw - 1]) {
      if (isExterior(x, y) && !bgVis[y * tw + x]) {
        bgVis[y * tw + x] = 1;
        q[qT++] = y * tw + x;
      }
    }
  }
  while (qH < qT) {
    const cur = q[qH++];
    const cx = cur % tw, cy = Math.floor(cur / tw);
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || nx >= tw || ny < 0 || ny >= th) continue;
      const ni = ny * tw + nx;
      if (bgVis[ni]) continue;
      if (isExterior(nx, ny)) {
        bgVis[ni] = 1;
        q[qT++] = ni;
      }
    }
  }

  // Keep connected components near the title core (allow 4px jump so detached exclamation dot / quill / flags stay included!)
  const keep = new Uint8Array(tw * th);
  const cq = new Int32Array(tw * th);
  let cH = 0, cT = 0;
  const sx = Math.floor(tw / 2), sy = Math.floor(th * 0.45);
  keep[sy * tw + sx] = 1;
  cq[cT++] = sy * tw + sx;
  while (cH < cT) {
    const cur = cq[cH++];
    const cx = cur % tw, cy = Math.floor(cur / tw);
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || nx >= tw || ny < 0 || ny >= th) continue;
        const ni = ny * tw + nx;
        if (keep[ni] || bgVis[ni]) continue;
        keep[ni] = 1;
        cq[cT++] = ni;
      }
    }
  }

  for (let y = 0; y < th; y++) {
    for (let x = 0; x < tw; x++) {
      if (keep[y * tw + x]) {
        const [r, g, b, a] = getPx(mmPng, tx0 + x, ty0 + y);
        setPx(fullTitle, x, y, r, g, b, a);
      }
    }
  }
  fs.writeFileSync(path.join(OUT_UI_DIR, 'title-emblem.png'), PNG.sync.write(fullTitle));
  console.log('Updated full title-emblem.png:', tw + 'x' + th, 'at', { tx0, ty0 });
}

fs.writeFileSync(path.join(OUT_UI_DIR, 'main-menu-clean-bg.png'), PNG.sync.write(cleanBg));
console.log('Wrote seamless harmonic pixel-art main-menu-clean-bg.png successfully!');

