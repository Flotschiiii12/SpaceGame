import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { SHIP_CLASSES_LIST } from '../src/game/shipClasses.ts';
import {
  LASER_CATALOGUE,
  SHIELD_CATALOGUE,
  DRONE_CATALOGUE,
  EQUIPMENT_CATALOGUE,
} from '../src/game/equipment.ts';

const SIZE = 256;

interface RawImageBuffer {
  width: number;
  height: number;
  data: Uint8Array; // RGBA
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16) || 0,
      parseInt(clean[1] + clean[1], 16) || 0,
      parseInt(clean[2] + clean[2], 16) || 0,
    ];
  }
  const num = parseInt(clean.substring(0, 6), 16);
  if (Number.isNaN(num)) return [56, 189, 248];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

// CRC32 table for PNG encoding
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(width: number, height: number, rgba: Uint8Array): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const rawScanlines = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    rawScanlines[rowStart] = 0; // filter type 0
    rawScanlines.set(rgba.subarray(y * stride, (y + 1) * stride), rowStart + 1);
  }

  const compressed = zlib.deflateSync(rawScanlines, { level: 6 });
  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * Loads a .jpg from /src/assets/images/ into a 256x256 RGBA buffer using ffmpeg,
 * keying out the dark background AND applying a smooth circular radial vignette mask
 * so zero rectangular edges or corner noise ever appear when composited.
 */
function load3DSourceImage(
  relPath: string,
  blackThreshold = 28,
  radialMaskRadius = 0.47
): RawImageBuffer {
  const fullPath = path.resolve(process.cwd(), relPath.replace(/^\//, ''));
  const raw = execFileSync(
    'ffmpeg',
    [
      '-v',
      'error',
      '-i',
      fullPath,
      '-vf',
      `scale=${SIZE}:${SIZE}`,
      '-f',
      'rawvideo',
      '-pix_fmt',
      'rgba',
      '-',
    ],
    { maxBuffer: 16 * 1024 * 1024 }
  );

  const data = new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength);
  const out = new Uint8Array(data.length);
  out.set(data);

  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const maxR = SIZE * radialMaskRadius;
  const innerR = maxR * 0.78;

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = (y * SIZE + x) * 4;
      const r = out[i];
      const g = out[i + 1];
      const b = out[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const maxVal = Math.max(r, g, b);

      const dist = Math.hypot(x - cx, y - cy);
      if (dist >= maxR || maxVal < blackThreshold || lum < blackThreshold * 0.85) {
        out[i + 3] = 0;
        continue;
      }

      let alpha = 1.0;
      if (maxVal < blackThreshold + 32) {
        alpha *= (maxVal - blackThreshold) / 32;
      }
      if (dist > innerR) {
        alpha *= 1 - (dist - innerR) / (maxR - innerR);
      }
      out[i + 3] = Math.max(0, Math.min(255, Math.round(alpha * 255)));
    }
  }

  return { width: SIZE, height: SIZE, data: out };
}

function createEmptyBuffer(width = SIZE, height = SIZE): RawImageBuffer {
  return { width, height, data: new Uint8Array(width * height * 4) };
}

/**
 * Luminance-preserving PBR re-grading of a 3D source image buffer.
 */
function grade3DBuffer(
  src: RawImageBuffer,
  primaryHex: string,
  trimHex: string,
  glowHex: string,
  contrast = 1.15
): RawImageBuffer {
  const out = createEmptyBuffer(src.width, src.height);
  const [pR, pG, pB] = hexToRgb(primaryHex);
  const [tR, tG, tB] = hexToRgb(trimHex);
  const [gR, gG, gB] = hexToRgb(glowHex);

  const d = src.data;
  const o = out.data;
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3];
    if (a === 0) continue;
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];

    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);
    const sat = maxC > 0 ? (maxC - minC) / maxC : 0;
    const cLum = Math.max(0, Math.min(1, (lum - 0.5) * contrast + 0.5));

    let nr: number, ng: number, nb: number;
    if (cLum < 0.35) {
      const k = cLum / 0.35;
      nr = r * 0.22 + tR * k * 0.85;
      ng = g * 0.22 + tG * k * 0.85;
      nb = b * 0.22 + tB * k * 0.85;
    } else if (cLum < 0.76) {
      const k = (cLum - 0.35) / 0.41;
      const eMix = Math.min(1, sat * 1.45);
      const mR = pR * (1 - eMix * 0.45) + gR * (eMix * 0.45);
      const mG = pG * (1 - eMix * 0.45) + gG * (eMix * 0.45);
      const mB = pB * (1 - eMix * 0.45) + gB * (eMix * 0.45);
      nr = tR * (1 - k) * 0.65 + mR * (0.58 + k * 0.65);
      ng = tG * (1 - k) * 0.65 + mG * (0.58 + k * 0.65);
      nb = tB * (1 - k) * 0.65 + mB * (0.58 + k * 0.65);
    } else {
      const k = (cLum - 0.76) / 0.24;
      nr = gR * (1 - k) + 255 * k;
      ng = gG * (1 - k) + 255 * k;
      nb = gB * (1 - k) + 255 * k;
    }

    o[i] = Math.max(0, Math.min(255, Math.round(nr)));
    o[i + 1] = Math.max(0, Math.min(255, Math.round(ng)));
    o[i + 2] = Math.max(0, Math.min(255, Math.round(nb)));
    o[i + 3] = a;
  }

  return out;
}

/**
 * Blits `src` onto `dst` with scaling, offset, rotation, and either 'normal' or 'screen' blending.
 */
function blitTransformed(
  dst: RawImageBuffer,
  src: RawImageBuffer,
  opts: {
    cx: number;
    cy: number;
    scaleX: number;
    scaleY: number;
    angleRad?: number;
    alpha?: number;
    blend?: 'normal' | 'screen';
  }
) {
  const { cx, cy, scaleX, scaleY, angleRad = 0, alpha = 1.0, blend = 'normal' } = opts;
  const cos = Math.cos(-angleRad);
  const sin = Math.sin(-angleRad);

  const halfW = (src.width * Math.abs(scaleX)) / 2;
  const halfH = (src.height * Math.abs(scaleY)) / 2;
  const maxR = Math.ceil(Math.hypot(halfW, halfH));

  const minX = Math.max(0, Math.floor(cx - maxR));
  const maxX = Math.min(dst.width - 1, Math.ceil(cx + maxR));
  const minY = Math.max(0, Math.floor(cy - maxR));
  const maxY = Math.min(dst.height - 1, Math.ceil(cy + maxR));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const rx = (dx * cos - dy * sin) / scaleX + src.width / 2;
      const ry = (dx * sin + dy * cos) / scaleY + src.height / 2;

      if (rx < 0 || rx >= src.width - 1 || ry < 0 || ry >= src.height - 1) continue;

      const sx = Math.floor(rx);
      const sy = Math.floor(ry);
      const sIdx = (sy * src.width + sx) * 4;
      const sa = (src.data[sIdx + 3] / 255) * alpha;
      if (sa <= 0.005) continue;

      const sr = src.data[sIdx];
      const sg = src.data[sIdx + 1];
      const sb = src.data[sIdx + 2];

      const dIdx = (y * dst.width + x) * 4;
      const dr = dst.data[dIdx];
      const dg = dst.data[dIdx + 1];
      const db = dst.data[dIdx + 2];
      const da = dst.data[dIdx + 3] / 255;

      if (blend === 'screen') {
        dst.data[dIdx] = Math.min(255, Math.round(dr + sr * sa * (1 - dr / 255)));
        dst.data[dIdx + 1] = Math.min(255, Math.round(dg + sg * sa * (1 - dg / 255)));
        dst.data[dIdx + 2] = Math.min(255, Math.round(db + sb * sa * (1 - db / 255)));
        dst.data[dIdx + 3] = Math.min(255, Math.round((da + sa * (1 - da)) * 255));
      } else {
        const outA = sa + da * (1 - sa);
        if (outA > 0) {
          dst.data[dIdx] = Math.round((sr * sa + dr * da * (1 - sa)) / outA);
          dst.data[dIdx + 1] = Math.round((sg * sa + dg * da * (1 - sa)) / outA);
          dst.data[dIdx + 2] = Math.round((sb * sa + db * da * (1 - sa)) / outA);
          dst.data[dIdx + 3] = Math.min(255, Math.round(outA * 255));
        }
      }
    }
  }
}

/**
 * Draws a 3D shaded glowing ring / holographic neon-cyan/amber energy torus onto `dst`.
 */
function draw3DGlowRing(
  dst: RawImageBuffer,
  cx: number,
  cy: number,
  radius: number,
  thickness: number,
  colorHex: string,
  alpha = 0.85,
  dashCount = 0
) {
  const [rC, gC, bC] = hexToRgb(colorHex);
  const minX = Math.max(0, Math.floor(cx - radius - thickness * 2));
  const maxX = Math.min(dst.width - 1, Math.ceil(cx + radius + thickness * 2));
  const minY = Math.max(0, Math.floor(cy - radius - thickness * 2));
  const maxY = Math.min(dst.height - 1, Math.ceil(cy + radius + thickness * 2));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.hypot(dx, dy);
      const diff = Math.abs(dist - radius);
      if (diff > thickness * 1.8) continue;

      if (dashCount > 0) {
        const angle = Math.atan2(dy, dx) + Math.PI;
        const sector = (angle / (Math.PI * 2)) * dashCount;
        if (sector - Math.floor(sector) > 0.62) continue;
      }

      const norm = Math.max(0, 1 - diff / (thickness * 1.6));
      const spec = Math.pow(norm, 2.4);
      const sa = norm * alpha;

      const dIdx = (y * dst.width + x) * 4;
      const sr = Math.min(255, rC + spec * 150);
      const sg = Math.min(255, gC + spec * 150);
      const sb = Math.min(255, bC + spec * 150);

      const dr = dst.data[dIdx];
      const dg = dst.data[dIdx + 1];
      const db = dst.data[dIdx + 2];
      const da = dst.data[dIdx + 3] / 255;

      const outA = sa + da * (1 - sa);
      if (outA > 0) {
        dst.data[dIdx] = Math.min(255, Math.round((sr * sa + dr * da * (1 - sa)) / outA));
        dst.data[dIdx + 1] = Math.min(255, Math.round((sg * sa + dg * da * (1 - sa)) / outA));
        dst.data[dIdx + 2] = Math.min(255, Math.round((sb * sa + db * da * (1 - sa)) / outA));
        dst.data[dIdx + 3] = Math.min(255, Math.round(outA * 255));
      }
    }
  }
}

/**
 * Draws a 3D Phong-shaded spherical singularity reactor core orb with smooth circular falloff.
 */
function draw3DReactorSphere(
  dst: RawImageBuffer,
  cx: number,
  cy: number,
  radius: number,
  outerHex: string,
  innerHex: string
) {
  const [oR, oG, oB] = hexToRgb(outerHex);
  const [iR, iG, iB] = hexToRgb(innerHex);
  const minX = Math.max(0, Math.floor(cx - radius * 1.5));
  const maxX = Math.min(dst.width - 1, Math.ceil(cx + radius * 1.5));
  const minY = Math.max(0, Math.floor(cy - radius * 1.5));
  const maxY = Math.min(dst.height - 1, Math.ceil(cy + radius * 1.5));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > radius * 1.45) continue;

      const norm = Math.max(0, 1 - dist / (radius * 1.45));
      const coreMix = Math.pow(norm, 2.2);
      const spec = Math.pow(Math.max(0, 1 - Math.hypot(dx + radius * 0.22, dy + radius * 0.22) / radius), 4);

      const sr = Math.min(255, oR * (1 - coreMix) + iR * coreMix + spec * 180);
      const sg = Math.min(255, oG * (1 - coreMix) + iG * coreMix + spec * 180);
      const sb = Math.min(255, oB * (1 - coreMix) + iB * coreMix + spec * 180);
      const sa = Math.pow(norm, 1.35) * 0.95;

      const dIdx = (y * dst.width + x) * 4;
      const dr = dst.data[dIdx];
      const dg = dst.data[dIdx + 1];
      const db = dst.data[dIdx + 2];
      const da = dst.data[dIdx + 3] / 255;

      const outA = sa + da * (1 - sa);
      if (outA > 0) {
        dst.data[dIdx] = Math.min(255, Math.round((sr * sa + dr * da * (1 - sa)) / outA));
        dst.data[dIdx + 1] = Math.min(255, Math.round((sg * sa + dg * da * (1 - sa)) / outA));
        dst.data[dIdx + 2] = Math.min(255, Math.round((sb * sa + db * da * (1 - sa)) / outA));
        dst.data[dIdx + 3] = Math.min(255, Math.round(outA * 255));
      }
    }
  }
}

/**
 * Draws a 3D Phong-shaded cylindrical metallic barrel or energy lance.
 */
function draw3DCylinderBarrel(
  dst: RawImageBuffer,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  radius: number,
  metalHex: string,
  glowHex: string
) {
  const [mR, mG, mB] = hexToRgb(metalHex);
  const [gR, gG, gB] = hexToRgb(glowHex);
  const vx = x2 - x1;
  const vy = y2 - y1;
  const lenSq = vx * vx + vy * vy;
  if (lenSq < 1) return;

  const minX = Math.max(0, Math.floor(Math.min(x1, x2) - radius - 4));
  const maxX = Math.min(dst.width - 1, Math.ceil(Math.max(x1, x2) + radius + 4));
  const minY = Math.max(0, Math.floor(Math.min(y1, y2) - radius - 4));
  const maxY = Math.min(dst.height - 1, Math.ceil(Math.max(y1, y2) + radius + 4));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const t = Math.max(0, Math.min(1, ((x - x1) * vx + (y - y1) * vy) / lenSq));
      const px = x1 + t * vx;
      const py = y1 + t * vy;
      const dist = Math.hypot(x - px, y - py);
      if (dist > radius + 1.5) continue;

      const normDist = Math.min(1, dist / radius);
      const nz = Math.sqrt(Math.max(0, 1 - normDist * normDist));
      const spec = Math.pow(nz, 4.5);
      const edgeAlpha = dist > radius ? Math.max(0, 1 - (dist - radius) / 1.5) : 1;

      const isMuzzle = t > 0.84;
      const sr = isMuzzle
        ? Math.min(255, gR * 0.85 + spec * 180)
        : Math.min(255, 18 + mR * nz * 0.85 + spec * 150);
      const sg = isMuzzle
        ? Math.min(255, gG * 0.85 + spec * 180)
        : Math.min(255, 24 + mG * nz * 0.85 + spec * 150);
      const sb = isMuzzle
        ? Math.min(255, gB * 0.85 + spec * 180)
        : Math.min(255, 38 + mB * nz * 0.85 + spec * 150);

      const dIdx = (y * dst.width + x) * 4;
      const da = dst.data[dIdx + 3] / 255;
      const outA = edgeAlpha + da * (1 - edgeAlpha);
      if (outA > 0) {
        dst.data[dIdx] = Math.round((sr * edgeAlpha + dst.data[dIdx] * da * (1 - edgeAlpha)) / outA);
        dst.data[dIdx + 1] = Math.round((sg * edgeAlpha + dst.data[dIdx + 1] * da * (1 - edgeAlpha)) / outA);
        dst.data[dIdx + 2] = Math.round((sb * edgeAlpha + dst.data[dIdx + 2] * da * (1 - edgeAlpha)) / outA);
        dst.data[dIdx + 3] = Math.min(255, Math.round(outA * 255));
      }
    }
  }
}

async function main() {
  console.log('Loading 3D AI-generated base renders from /src/assets/images/...');
  // Only use cleanly centered top-down vertical 3D spacecraft hulls & circular cores
  const baseModels = {
    interceptor: load3DSourceImage('/src/assets/images/player_interceptor_1792870491627.jpg', 28, 0.48),
    cruiser: load3DSourceImage('/src/assets/images/player_cruiser_1792870492703.jpg', 28, 0.48),
    phantom: load3DSourceImage('/src/assets/images/player_phantom_1792870492922.jpg', 28, 0.48),
    dreadnought: load3DSourceImage('/src/assets/images/player_dreadnought_1792870493185.jpg', 28, 0.48),
    drone: load3DSourceImage('/src/assets/images/combat_drone_1792916236798.jpg', 28, 0.46),
    stalker: load3DSourceImage('/src/assets/images/enemy_stalker_1792916235614.jpg', 28, 0.47),
    boss: load3DSourceImage('/src/assets/images/boss_void_leviathan_1792870506911.jpg', 28, 0.47),
    shield: load3DSourceImage('/src/assets/images/item_shield_1792916236937.jpg', 32, 0.39),
  };

  const outBase = path.resolve(process.cwd(), 'public/assets/sprites');
  for (const sub of ['ships', 'lasers', 'shields', 'drones', 'missiles', 'sheets']) {
    fs.mkdirSync(path.join(outBase, sub), { recursive: true });
  }

  const manifest: Record<string, any> = {
    version: '2.1-3D-PBR-UPRIGHT',
    cellSize: SIZE,
    sheets: {
      ships: '/assets/sprites/sheets/ships_3d_spritesheet.png',
      lasers: '/assets/sprites/sheets/lasers_3d_spritesheet.png',
      shields: '/assets/sprites/sheets/shields_3d_spritesheet.png',
      drones: '/assets/sprites/sheets/drones_3d_spritesheet.png',
    },
    items: {},
  };

  // ============================================================================
  // 1. GENERATE ALL 50 HIGH-RES 3D SHIP SPRITES + 10x5 3D SPRITE SHEET ATLAS
  // All 50 ships strictly oriented facing UPWARD (-Y)
  // ============================================================================
  const shipCols = 10;
  const shipRows = 5;
  const shipsSheet = createEmptyBuffer(shipCols * SIZE, shipRows * SIZE);

  // Upright top-down 3D spacecraft hulls
  const uprightHullPool: (keyof typeof baseModels)[] = [
    'interceptor',
    'phantom',
    'cruiser',
    'stalker',
    'dreadnought',
    'boss',
  ];
  const uprightWingPool: (keyof typeof baseModels)[] = [
    'interceptor',
    'phantom',
    'stalker',
    'cruiser',
    'dreadnought',
  ];

  for (let i = 0; i < SHIP_CLASSES_LIST.length; i++) {
    const ship = SHIP_CLASSES_LIST[i];
    const gen = ship.generation; // 1..10
    const tier = ship.tier; // 1..50
    const canvas = createEmptyBuffer(SIZE, SIZE);
    const cx = SIZE / 2;
    const cy = SIZE / 2;

    const mainKey = uprightHullPool[(tier - 1) % uprightHullPool.length];
    const wingKey = uprightWingPool[(tier + gen) % uprightWingPool.length];

    const gradedMain = grade3DBuffer(
      baseModels[mainKey],
      ship.primaryColor,
      ship.visualAsset.trimColor,
      ship.engineGlow,
      1.1 + gen * 0.02
    );
    const gradedWing = grade3DBuffer(
      baseModels[wingKey],
      ship.visualAsset.trimColor,
      ship.primaryColor,
      ship.engineGlow,
      1.15
    );

    // High-tier holographic neon-cyan/amber energy ring
    if (tier >= 12) {
      draw3DGlowRing(
        canvas,
        cx,
        cy + 4,
        92 + Math.min(20, gen * 1.8),
        tier >= 35 ? 3.0 : 2.0,
        ship.engineGlow,
        0.55,
        tier >= 30 ? 8 : 6
      );
    }

    // Multi-barrel 3D wing-mounted weapon hardpoints (scales with ship tier & laser slots)
    const barrelPairs = Math.min(4, Math.ceil(ship.slots.lasers / 2));
    for (let b = 1; b <= barrelPairs; b++) {
      const bx = 20 + b * 17;
      const by = cy - 26 + b * 11;
      draw3DCylinderBarrel(
        canvas,
        cx - bx,
        by + 28,
        cx - bx,
        by - 20,
        3.2 + gen * 0.16,
        ship.primaryColor,
        ship.engineGlow
      );
      draw3DCylinderBarrel(
        canvas,
        cx + bx,
        by + 28,
        cx + bx,
        by - 20,
        3.2 + gen * 0.16,
        ship.primaryColor,
        ship.engineGlow
      );
    }

    // Symmetrical 3D swept wing nacelles / outriggers (expands with ship generation)
    const wingSpread = 18 + gen * 3.8 + (ship.visualAsset.wingStyle % 3) * 5;
    const wingAngle = 0.14 + ship.visualAsset.finSweep * 0.34;
    const wingScale = 0.44 + gen * 0.025;

    blitTransformed(canvas, gradedWing, {
      cx: cx - wingSpread,
      cy: cy + 8,
      scaleX: -wingScale,
      scaleY: wingScale * 0.92,
      angleRad: -wingAngle,
      alpha: 0.95,
    });
    blitTransformed(canvas, gradedWing, {
      cx: cx + wingSpread,
      cy: cy + 8,
      scaleX: wingScale,
      scaleY: wingScale * 0.92,
      angleRad: wingAngle,
      alpha: 0.95,
    });

    // Gen VI+ Upper Seraphic 3D Wing Sponsons
    if (gen >= 6) {
      blitTransformed(canvas, gradedWing, {
        cx: cx - wingSpread * 1.18,
        cy: cy - 12,
        scaleX: -wingScale * 0.76,
        scaleY: wingScale * 0.76,
        angleRad: wingAngle * 0.85,
        alpha: 0.88,
      });
      blitTransformed(canvas, gradedWing, {
        cx: cx + wingSpread * 1.18,
        cy: cy - 12,
        scaleX: wingScale * 0.76,
        scaleY: wingScale * 0.76,
        angleRad: -wingAngle * 0.85,
        alpha: 0.88,
      });
    }

    // Central Upright 3D Hull Fuselage
    const stretchX = 0.76 + (ship.visualAsset.wingStyle % 3) * 0.06;
    const stretchY = 0.86 + Math.min(0.12, gen * 0.012);
    blitTransformed(canvas, gradedMain, {
      cx,
      cy,
      scaleX: stretchX,
      scaleY: stretchY,
      alpha: 1.0,
    });

    // Dorsal 3D Singularity Reactor Core Orb for Tier 6+ (smooth 3D sphere, zero square edges)
    if (tier >= 6) {
      draw3DReactorSphere(
        canvas,
        cx,
        cy + 6,
        10 + Math.min(12, gen * 1.1),
        ship.engineGlow,
        '#ffffff'
      );
    }

    // Save individual ship PNG
    const fileRel = `/assets/sprites/ships/${ship.id}.png`;
    fs.writeFileSync(
      path.join(outBase, 'ships', `${ship.id}.png`),
      encodePNG(SIZE, SIZE, canvas.data)
    );

    // Copy into 50-ship Sprite Sheet Atlas
    const col = i % shipCols;
    const row = Math.floor(i / shipCols);
    for (let y = 0; y < SIZE; y++) {
      const srcOffset = y * SIZE * 4;
      const dstOffset = ((row * SIZE + y) * (shipCols * SIZE) + col * SIZE) * 4;
      shipsSheet.data.set(canvas.data.subarray(srcOffset, srcOffset + SIZE * 4), dstOffset);
    }

    manifest.items[ship.id] = {
      id: ship.id,
      category: 'ship',
      tier,
      generation: gen,
      url: fileRel,
      sheet: 'ships',
      col,
      row,
      x: col * SIZE,
      y: row * SIZE,
      width: SIZE,
      height: SIZE,
    };
  }

  fs.writeFileSync(
    path.join(outBase, 'sheets', 'ships_3d_spritesheet.png'),
    encodePNG(shipsSheet.width, shipsSheet.height, shipsSheet.data)
  );
  console.log('✓ Generated 50 upright 3D Ship PNGs + ships_3d_spritesheet.png');

  // ============================================================================
  // 2. GENERATE ALL 20 HIGH-RES 3D LASER SPRITES + 5x4 3D SPRITE SHEET ATLAS
  // ============================================================================
  const eqCols = 5;
  const eqRows = 4;
  const lasersSheet = createEmptyBuffer(eqCols * SIZE, eqRows * SIZE);

  for (let i = 0; i < LASER_CATALOGUE.length; i++) {
    const laser = LASER_CATALOGUE[i];
    const tier = laser.tier; // 1..20
    const canvas = createEmptyBuffer(SIZE, SIZE);
    const cx = SIZE / 2;
    const cy = SIZE / 2;
    const c1 = laser.color || '#22d3ee';
    const c2 = laser.secondaryColor || '#f59e0b';

    // Holographic Neon-Cyan/Amber Tech Rings
    draw3DGlowRing(canvas, cx, cy, 94, 2.2, c1, 0.6, 8);
    if (tier >= 8) {
      draw3DGlowRing(canvas, cx, cy, 76, 1.8, c2, 0.5, 12);
    }

    // 3D Multi-Barrel Array (1 to 5 Phong-shaded metallic barrels angled at 45 deg)
    const barrelCount = Math.min(5, 1 + Math.floor((tier - 1) / 4));
    for (let b = 0; b < barrelCount; b++) {
      const offset = (b - (barrelCount - 1) / 2) * 19;
      const rad = barrelCount >= 4 ? 6.5 : 8.5;
      draw3DCylinderBarrel(
        canvas,
        cx - 46,
        cy + offset + 46,
        cx + 70,
        cy + offset - 70,
        rad,
        c1,
        c2
      );
    }

    // 3D Weapon Receiver Housing from graded Interceptor/Phantom/Cruiser 3D render
    const receiverSrc =
      tier % 3 === 0
        ? baseModels.cruiser
        : tier % 2 === 0
        ? baseModels.phantom
        : baseModels.interceptor;
    const gradedReceiver = grade3DBuffer(receiverSrc, c1, '#1e293b', c2, 1.2);
    blitTransformed(canvas, gradedReceiver, {
      cx: cx - 18,
      cy: cy + 18,
      scaleX: 0.62,
      scaleY: 0.68,
      angleRad: Math.PI / 4,
      alpha: 0.98,
    });

    // Smooth 3D Spherical Energy Chamber Core
    draw3DReactorSphere(canvas, cx - 14, cy + 14, 14 + tier * 0.45, c2, '#ffffff');

    const fileRel = `/assets/sprites/lasers/${laser.id}.png`;
    fs.writeFileSync(
      path.join(outBase, 'lasers', `${laser.id}.png`),
      encodePNG(SIZE, SIZE, canvas.data)
    );

    const col = i % eqCols;
    const row = Math.floor(i / eqCols);
    for (let y = 0; y < SIZE; y++) {
      const srcOffset = y * SIZE * 4;
      const dstOffset = ((row * SIZE + y) * (eqCols * SIZE) + col * SIZE) * 4;
      lasersSheet.data.set(canvas.data.subarray(srcOffset, srcOffset + SIZE * 4), dstOffset);
    }

    manifest.items[laser.id] = {
      id: laser.id,
      category: 'laser',
      tier,
      url: fileRel,
      sheet: 'lasers',
      col,
      row,
      x: col * SIZE,
      y: row * SIZE,
      width: SIZE,
      height: SIZE,
    };
  }

  fs.writeFileSync(
    path.join(outBase, 'sheets', 'lasers_3d_spritesheet.png'),
    encodePNG(lasersSheet.width, lasersSheet.height, lasersSheet.data)
  );
  console.log('✓ Generated 20 3D Laser PNGs + lasers_3d_spritesheet.png');

  // ============================================================================
  // 3. GENERATE ALL 20 HIGH-RES 3D SHIELD SPRITES + 5x4 3D SPRITE SHEET ATLAS
  // ============================================================================
  const shieldsSheet = createEmptyBuffer(eqCols * SIZE, eqRows * SIZE);

  for (let i = 0; i < SHIELD_CATALOGUE.length; i++) {
    const shield = SHIELD_CATALOGUE[i];
    const tier = shield.tier; // 1..20
    const canvas = createEmptyBuffer(SIZE, SIZE);
    const cx = SIZE / 2;
    const cy = SIZE / 2;
    const c1 = shield.color || '#38bdf8';
    const c2 = shield.secondaryColor || '#f59e0b';

    // Tier-scaled concentric 3D Harmonic Barrier Rings
    const ringCount = Math.min(4, 1 + Math.floor(tier / 5));
    for (let r = 0; r < ringCount; r++) {
      draw3DGlowRing(
        canvas,
        cx,
        cy,
        102 - r * 13,
        2.8 - r * 0.3,
        r % 2 === 0 ? c1 : c2,
        0.78 - r * 0.12,
        r % 2 === 1 ? 6 + r * 2 : 0
      );
    }

    // Symmetric 3D Projector Pylons for Tier 6+
    if (tier >= 6) {
      const pylonCount = tier >= 14 ? 6 : 4;
      for (let p = 0; p < pylonCount; p++) {
        const ang = (p * Math.PI * 2) / pylonCount;
        const px1 = cx + Math.cos(ang) * 42;
        const py1 = cy + Math.sin(ang) * 42;
        const px2 = cx + Math.cos(ang) * (76 + Math.min(18, tier * 0.7));
        const py2 = cy + Math.sin(ang) * (76 + Math.min(18, tier * 0.7));
        draw3DCylinderBarrel(canvas, px1, py1, px2, py2, 5.5, c1, c2);
      }
    }

    // 3D Shield Matrix Core (`item_shield`)
    const shieldGraded = grade3DBuffer(baseModels.shield, c1, '#0f172a', c2, 1.2);
    const mainScale = 0.72 + Math.min(0.16, tier * 0.008);
    blitTransformed(canvas, shieldGraded, {
      cx,
      cy,
      scaleX: mainScale,
      scaleY: mainScale,
      alpha: 0.98,
    });

    // Central 3D Singularity Sphere for Tier 5+
    if (tier >= 5) {
      draw3DReactorSphere(canvas, cx, cy, 12 + tier * 0.75, c2, '#ffffff');
    }

    const fileRel = `/assets/sprites/shields/${shield.id}.png`;
    fs.writeFileSync(
      path.join(outBase, 'shields', `${shield.id}.png`),
      encodePNG(SIZE, SIZE, canvas.data)
    );

    const col = i % eqCols;
    const row = Math.floor(i / eqCols);
    for (let y = 0; y < SIZE; y++) {
      const srcOffset = y * SIZE * 4;
      const dstOffset = ((row * SIZE + y) * (eqCols * SIZE) + col * SIZE) * 4;
      shieldsSheet.data.set(canvas.data.subarray(srcOffset, srcOffset + SIZE * 4), dstOffset);
    }

    manifest.items[shield.id] = {
      id: shield.id,
      category: 'shield',
      tier,
      url: fileRel,
      sheet: 'shields',
      col,
      row,
      x: col * SIZE,
      y: row * SIZE,
      width: SIZE,
      height: SIZE,
    };
  }

  fs.writeFileSync(
    path.join(outBase, 'sheets', 'shields_3d_spritesheet.png'),
    encodePNG(shieldsSheet.width, shieldsSheet.height, shieldsSheet.data)
  );
  console.log('✓ Generated 20 3D Shield Generator PNGs + shields_3d_spritesheet.png');

  // ============================================================================
  // 4. GENERATE ALL 20 HIGH-RES 3D DRONE SPRITES + 5x4 3D SPRITE SHEET ATLAS
  // ============================================================================
  const dronesSheet = createEmptyBuffer(eqCols * SIZE, eqRows * SIZE);

  for (let i = 0; i < DRONE_CATALOGUE.length; i++) {
    const drone = DRONE_CATALOGUE[i];
    const tier = drone.tier; // 1..20
    const canvas = createEmptyBuffer(SIZE, SIZE);
    const cx = SIZE / 2;
    const cy = SIZE / 2;
    const c1 = drone.color || '#38bdf8';
    const c2 = drone.secondaryColor || '#f59e0b';

    // Orbital Telemetry Halo
    draw3DGlowRing(canvas, cx, cy, 92, 2.0, c1, 0.58, 6);
    if (tier >= 12) {
      draw3DGlowRing(canvas, cx, cy, 76, 1.6, c2, 0.48, 8);
    }

    // Twin 3D Micro-Cannon Barrels
    const barrelSpread = 28 + Math.min(18, tier * 0.8);
    draw3DCylinderBarrel(canvas, cx - barrelSpread, cy + 10, cx - barrelSpread, cy - 68, 4.8, c1, c2);
    draw3DCylinderBarrel(canvas, cx + barrelSpread, cy + 10, cx + barrelSpread, cy - 68, 4.8, c1, c2);

    // High-tier 3D Outrigger Wing Blades (using upright interceptor/phantom wings)
    if (tier >= 5) {
      const wingGraded = grade3DBuffer(baseModels.phantom, c2, '#0f172a', c1, 1.16);
      const wSpan = 34 + Math.min(20, tier * 0.9);
      blitTransformed(canvas, wingGraded, {
        cx: cx - wSpan,
        cy: cy + 6,
        scaleX: -0.44,
        scaleY: 0.46,
        angleRad: -0.28,
        alpha: 0.92,
      });
      blitTransformed(canvas, wingGraded, {
        cx: cx + wSpan,
        cy: cy + 6,
        scaleX: 0.44,
        scaleY: 0.46,
        angleRad: 0.28,
        alpha: 0.92,
      });
    }

    // Core 3D Combat Drone Hull (`combat_drone`)
    const droneGraded = grade3DBuffer(baseModels.drone, c1, '#1e293b', c2, 1.18);
    const dScale = 0.74 + Math.min(0.14, tier * 0.007);
    blitTransformed(canvas, droneGraded, {
      cx,
      cy,
      scaleX: dScale,
      scaleY: dScale,
      alpha: 1.0,
    });

    // Dorsal 3D Sensor Sphere Eye (smooth circular falloff, no square box)
    if (tier >= 6) {
      draw3DReactorSphere(canvas, cx, cy - 2, 10 + tier * 0.55, c2, '#ffffff');
    }

    const fileRel = `/assets/sprites/drones/${drone.id}.png`;
    fs.writeFileSync(
      path.join(outBase, 'drones', `${drone.id}.png`),
      encodePNG(SIZE, SIZE, canvas.data)
    );

    const col = i % eqCols;
    const row = Math.floor(i / eqCols);
    for (let y = 0; y < SIZE; y++) {
      const srcOffset = y * SIZE * 4;
      const dstOffset = ((row * SIZE + y) * (eqCols * SIZE) + col * SIZE) * 4;
      dronesSheet.data.set(canvas.data.subarray(srcOffset, srcOffset + SIZE * 4), dstOffset);
    }

    manifest.items[drone.id] = {
      id: drone.id,
      category: 'drone',
      tier,
      url: fileRel,
      sheet: 'drones',
      col,
      row,
      x: col * SIZE,
      y: row * SIZE,
      width: SIZE,
      height: SIZE,
    };
  }

  fs.writeFileSync(
    path.join(outBase, 'sheets', 'drones_3d_spritesheet.png'),
    encodePNG(dronesSheet.width, dronesSheet.height, dronesSheet.data)
  );
  console.log('✓ Generated 20 3D Drone PNGs + drones_3d_spritesheet.png');

  // ============================================================================
  // 5. GENERATE 4 HIGH-RES 3D MISSILE SPRITES
  // ============================================================================
  const missileList = EQUIPMENT_CATALOGUE.filter((e) => e.category === 'missile');
  for (let i = 0; i < missileList.length; i++) {
    const missile = missileList[i];
    const canvas = createEmptyBuffer(SIZE, SIZE);
    const cx = SIZE / 2;
    const cy = SIZE / 2;
    const c1 = missile.color || '#f59e0b';
    const c2 = missile.secondaryColor || '#38bdf8';

    draw3DGlowRing(canvas, cx, cy, 90, 2.2, c1, 0.58, 6);
    draw3DCylinderBarrel(canvas, cx - 38, cy + 38, cx + 56, cy - 56, 11, c1, c2);
    const warheadGraded = grade3DBuffer(baseModels.interceptor, c1, '#1e293b', c2, 1.2);
    blitTransformed(canvas, warheadGraded, {
      cx,
      cy,
      scaleX: 0.68,
      scaleY: 0.76,
      angleRad: Math.PI / 4,
      alpha: 0.98,
    });
    draw3DReactorSphere(canvas, cx + 8, cy - 8, 14, c2, '#ffffff');

    const fileRel = `/assets/sprites/missiles/${missile.id}.png`;
    fs.writeFileSync(
      path.join(outBase, 'missiles', `${missile.id}.png`),
      encodePNG(SIZE, SIZE, canvas.data)
    );
    manifest.items[missile.id] = {
      id: missile.id,
      category: 'missile',
      tier: missile.tier,
      url: fileRel,
      width: SIZE,
      height: SIZE,
    };
  }

  fs.writeFileSync(
    path.join(outBase, 'sheets', 'sprite_atlas_manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  console.log('✓ Wrote sprite_atlas_manifest.json (114 individual 3D PNG assets + 4 3D Sprite Sheets)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
