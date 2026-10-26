import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';

interface RawBuffer {
  width: number;
  height: number;
  data: Uint8Array;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  const num = parseInt(clean.substring(0, 6), 16);
  if (Number.isNaN(num)) return [56, 189, 248];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

// CRC32 for PNG encoding
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
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const rawScanlines = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    rawScanlines[rowStart] = 0;
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

function loadAIImage(relPath: string, width = 512, height = 512): RawBuffer {
  const fullPath = path.resolve(process.cwd(), relPath.replace(/^\//, ''));
  const raw = execFileSync(
    'ffmpeg',
    [
      '-v',
      'error',
      '-i',
      fullPath,
      '-vf',
      `scale=${width}:${height}`,
      '-f',
      'rawvideo',
      '-pix_fmt',
      'rgba',
      '-',
    ],
    { maxBuffer: 32 * 1024 * 1024 }
  );
  const out = new Uint8Array(width * height * 4);
  out.set(new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength));
  return { width, height, data: out };
}

function sampleBil(src: RawBuffer, u: number, v: number): [number, number, number, number] {
  const su = ((u % 1) + 1) % 1;
  const sv = ((v % 1) + 1) % 1;
  const x = Math.min(src.width - 1, Math.floor(su * (src.width - 1)));
  const y = Math.min(src.height - 1, Math.floor(sv * (src.height - 1)));
  const idx = (y * src.width + x) * 4;
  return [src.data[idx], src.data[idx + 1], src.data[idx + 2], src.data[idx + 3]];
}

// Signed distance to a chamfered octagon box centered at (width/2, height/2)
function sdChamferBox(
  px: number,
  py: number,
  halfW: number,
  halfH: number,
  cut: number
): number {
  const dx = Math.abs(px) - halfW;
  const dy = Math.abs(py) - halfH;
  const outside = Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0);
  // Chamfer plane at corners: (|px| - (halfW - cut)) + (|py| - (halfH - cut)) - cut
  const cornerDist = (Math.abs(px) - (halfW - cut) + (Math.abs(py) - (halfH - cut))) * 0.70710678;
  return Math.max(outside, cornerDist);
}

/**
 * Generates an ornate 3D AI-Textured Sci-Fi Panel Frame (RGBA PNG)
 * combining brushed starbase metal, dreadnought hull grooves, cosmic nebula glass,
 * 3D normal-mapped beveled armor rim, corner mechanical clamps, and glowing plasma conduits.
 */
function build3DPanelAsset(
  width: number,
  height: number,
  starbaseTex: RawBuffer,
  dreadnoughtTex: RawBuffer,
  nebulaTex: RawBuffer,
  primaryHex: string,
  accentHex: string,
  cutSize = 22,
  borderThick = 12
): Uint8Array {
  const out = new Uint8Array(width * height * 4);
  const [pR, pG, pB] = hexToRgb(primaryHex);
  const [aR, aG, aB] = hexToRgb(accentHex);

  const cx = width / 2;
  const cy = height / 2;
  const halfW = width / 2 - 4;
  const halfH = height / 2 - 4;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const px = x - cx;
      const py = y - cy;
      const d = sdChamferBox(px, py, halfW, halfH, cutSize);
      const idx = (y * width + x) * 4;

      if (d > 3.5) {
        // Outer soft neon aura
        if (d < 10) {
          const glowAlpha = Math.pow(1 - (d - 3.5) / 6.5, 2) * 0.45;
          out[idx] = pR;
          out[idx + 1] = pG;
          out[idx + 2] = pB;
          out[idx + 3] = Math.round(glowAlpha * 255);
        }
        continue;
      }

      const u = x / width;
      const v = y / height;

      // Sample real AI textures
      const [sbR, sbG, sbB] = sampleBil(starbaseTex, u * 1.35 + 0.12, v * 1.35 + 0.15);
      const [drR, drG, drB] = sampleBil(dreadnoughtTex, u * 1.6 + 0.08, v * 1.6 + 0.22);
      const [nbR, nbG, nbB] = sampleBil(nebulaTex, u * 0.9 + 0.05, v * 0.9 + 0.05);

      const sbLum = (0.299 * sbR + 0.587 * sbG + 0.114 * sbB) / 255;
      const drLum = (0.299 * drR + 0.587 * drG + 0.114 * drB) / 255;

      // Check if we are on the 3D armored border frame (-borderThick <= d <= 0)
      const isCornerClamp =
        (Math.abs(px) > halfW - cutSize * 2.1 && Math.abs(py) > halfH - cutSize * 1.2) ||
        (Math.abs(py) > halfH - cutSize * 2.1 && Math.abs(px) > halfW - cutSize * 1.2);

      const effectiveBorder = isCornerClamp ? borderThick + 5 : borderThick;

      if (d >= -effectiveBorder) {
        // 3D Armored Metallic Bevel Rim
        const rimT = (d + effectiveBorder) / Math.max(1, effectiveBorder); // 0 at inner edge, 1 at outer edge
        // Top-left directional lighting + bevel Ridge at rimT=0.55
        const lightDir = ((-px / halfW) * 0.45 + (-py / halfH) * 0.55) * 0.5 + 0.5;
        const ridge = 1 - Math.abs(rimT - 0.52) * 1.8;
        const metalBase = 0.28 + sbLum * 0.42 + drLum * 0.35 + ridge * 0.35 + lightDir * 0.22;

        // Glowing plasma conduit channel running inside the armor frame
        const isConduit =
          Math.abs(rimT - 0.32) < 0.14 &&
          (Math.abs(px) < halfW * 0.65 || Math.abs(py) < halfH * 0.65 || isCornerClamp);

        let r: number;
        let g: number;
        let b: number;

        if (isConduit) {
          const core = 1 - Math.abs(rimT - 0.32) / 0.14;
          r = pR * (0.65 + core * 0.35) + aR * core * 0.45 + 90 * core;
          g = pG * (0.65 + core * 0.35) + aG * core * 0.45 + 90 * core;
          b = pB * (0.65 + core * 0.35) + aB * core * 0.45 + 90 * core;
        } else {
          // Dark gunmetal + tinted specular highlight from AI starbase render
          r = 18 + metalBase * 46 + pR * (0.22 + Math.max(0, ridge) * 0.38);
          g = 24 + metalBase * 52 + pG * (0.22 + Math.max(0, ridge) * 0.38);
          b = 38 + metalBase * 66 + pB * (0.22 + Math.max(0, ridge) * 0.38);
        }

        // Specular outer edge highlight
        if (Math.abs(d + 1.5) < 1.6) {
          r += aR * 0.45 + 45;
          g += aG * 0.45 + 45;
          b += aB * 0.45 + 45;
        }

        const edgeAa = d > 0 ? Math.max(0, 1 - d / 3.5) : 1;
        out[idx] = Math.min(255, Math.round(r));
        out[idx + 1] = Math.min(255, Math.round(g));
        out[idx + 2] = Math.min(255, Math.round(b));
        out[idx + 3] = Math.round(edgeAa * 255);
      } else {
        // Interior Dark Armored Cockpit Glass with AI Starbase & Nebula Texture
        const innerDepth = Math.min(1, (-d - effectiveBorder) / 28);
        // Subtle hex/circuit micro-etching from AI textures
        const plateSeam =
          Math.abs(((x + y) % 48) - 24) < 1.2 || Math.abs(((x - y + 512) % 64) - 32) < 1.0
            ? 0.14
            : 0;
        const innerShadow = (1 - innerDepth) * 0.38;

        const baseR =
          6 +
          nbR * 0.14 +
          drLum * 22 +
          sbLum * 16 +
          pR * (0.07 + plateSeam * 0.5 + innerShadow * 0.22);
        const baseG =
          10 +
          nbG * 0.14 +
          drLum * 26 +
          sbLum * 20 +
          pG * (0.07 + plateSeam * 0.5 + innerShadow * 0.22);
        const baseB =
          20 +
          nbB * 0.18 +
          drLum * 34 +
          sbLum * 26 +
          pB * (0.09 + plateSeam * 0.5 + innerShadow * 0.22);

        // Top holographic reflection sheen
        const topSheen = Math.max(0, 1 - v * 2.1) * 0.16;

        out[idx] = Math.min(255, Math.round(baseR + pR * topSheen));
        out[idx + 1] = Math.min(255, Math.round(baseG + pG * topSheen));
        out[idx + 2] = Math.min(255, Math.round(baseB + pB * topSheen));
        out[idx + 3] = 242; // 95% opaque rich 3D panel body
      }
    }
  }
  return out;
}

/**
 * Generates a 3D AI-Textured Tactile Button or Thumb Action Module
 */
function build3DButtonAsset(
  width: number,
  height: number,
  starbaseTex: RawBuffer,
  shieldTex: RawBuffer,
  primaryHex: string,
  accentHex: string,
  isActiveGlow = false,
  cutSize = 14
): Uint8Array {
  const out = new Uint8Array(width * height * 4);
  const [pR, pG, pB] = hexToRgb(primaryHex);
  const [aR, aG, aB] = hexToRgb(accentHex);

  const cx = width / 2;
  const cy = height / 2;
  const halfW = width / 2 - 3;
  const halfH = height / 2 - 3;
  const borderThick = Math.max(6, Math.round(Math.min(width, height) * 0.085));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const px = x - cx;
      const py = y - cy;
      const d = sdChamferBox(px, py, halfW, halfH, cutSize);
      const idx = (y * width + x) * 4;

      if (d > 2.5) continue;

      const u = x / width;
      const v = y / height;
      const [sbR, sbG, sbB] = sampleBil(starbaseTex, u * 1.2 + 0.18, v * 1.2 + 0.25);
      const [shR, shG, shB] = sampleBil(shieldTex, u * 0.85 + 0.07, v * 0.85 + 0.07);
      const sbLum = (0.299 * sbR + 0.587 * sbG + 0.114 * sbB) / 255;
      const shLum = (0.299 * shR + 0.587 * shG + 0.114 * shB) / 255;

      const bevelV = 1 - v; // top-lit 3D convex bevel

      if (d >= -borderThick) {
        const rimT = (d + borderThick) / borderThick;
        const spec = Math.max(0, 1 - Math.abs(rimT - 0.45) * 2.2) * (0.5 + bevelV * 0.5);
        const r = 24 + sbLum * 55 + pR * (0.45 + spec * 0.55) + aR * spec * 0.4;
        const g = 32 + sbLum * 60 + pG * (0.45 + spec * 0.55) + aG * spec * 0.4;
        const b = 48 + sbLum * 70 + pB * (0.45 + spec * 0.55) + aB * spec * 0.4;
        const aa = d > 0 ? Math.max(0, 1 - d / 2.5) : 1;
        out[idx] = Math.min(255, Math.round(r));
        out[idx + 1] = Math.min(255, Math.round(g));
        out[idx + 2] = Math.min(255, Math.round(b));
        out[idx + 3] = Math.round(aa * 255);
      } else {
        // Convex 3D actuator cap with AI reactor texture
        const radialGlow = Math.max(0, 1 - Math.hypot(px / halfW, py / halfH) * 0.95);
        const topHighlight = Math.pow(Math.max(0, 1 - v * 1.65), 2) * 0.35;
        const intensity = isActiveGlow ? 0.58 : 0.24;

        const r =
          12 +
          sbLum * 32 +
          shLum * 28 +
          pR * (intensity + radialGlow * 0.25 + topHighlight) +
          (isActiveGlow ? aR * 0.22 : 0);
        const g =
          18 +
          sbLum * 38 +
          shLum * 32 +
          pG * (intensity + radialGlow * 0.25 + topHighlight) +
          (isActiveGlow ? aG * 0.22 : 0);
        const b =
          30 +
          sbLum * 48 +
          shLum * 40 +
          pB * (intensity + radialGlow * 0.25 + topHighlight) +
          (isActiveGlow ? aB * 0.22 : 0);

        out[idx] = Math.min(255, Math.round(r));
        out[idx + 1] = Math.min(255, Math.round(g));
        out[idx + 2] = Math.min(255, Math.round(b));
        out[idx + 3] = 248;
      }
    }
  }
  return out;
}

/**
 * Generates 3D Segmented Plasma Gauge Tube Track & Fill Bars
 */
function build3DBarAsset(
  width: number,
  height: number,
  starbaseTex: RawBuffer,
  primaryHex: string,
  accentHex: string,
  isTrackOnly = false
): Uint8Array {
  const out = new Uint8Array(width * height * 4);
  const [pR, pG, pB] = hexToRgb(primaryHex);
  const [aR, aG, aB] = hexToRgb(accentHex);

  const cx = width / 2;
  const cy = height / 2;
  const halfW = width / 2 - 2;
  const halfH = height / 2 - 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const px = x - cx;
      const py = y - cy;
      const d = sdChamferBox(px, py, halfW, halfH, Math.floor(halfH * 0.65));
      const idx = (y * width + x) * 4;
      if (d > 1.5) continue;

      const u = x / width;
      const v = y / height;
      const [sbR, sbG, sbB] = sampleBil(starbaseTex, u * 1.5, v * 1.5);
      const sbLum = (0.299 * sbR + 0.587 * sbG + 0.114 * sbB) / 255;

      // Cylindrical glass tube shading along Y
      const tubeNy = (y - cy) / halfH; // -1 at top, +1 at bottom
      const cylinderLight = Math.sqrt(Math.max(0, 1 - tubeNy * tubeNy));
      const specStreak = Math.pow(Math.max(0, 1 - Math.abs(tubeNy + 0.38) * 3.2), 3);

      // Segmented reactor ribs every 24px
      const isRib = x % 24 < 2;

      if (isTrackOnly) {
        const isBorder = d >= -4;
        const r = isBorder ? 38 + sbLum * 50 + pR * 0.25 : 8 + sbLum * 18;
        const g = isBorder ? 48 + sbLum * 55 + pG * 0.25 : 12 + sbLum * 22;
        const b = isBorder ? 66 + sbLum * 65 + pB * 0.25 : 22 + sbLum * 32;
        out[idx] = Math.min(255, Math.round(r + specStreak * 35));
        out[idx + 1] = Math.min(255, Math.round(g + specStreak * 40));
        out[idx + 2] = Math.min(255, Math.round(b + specStreak * 50));
        out[idx + 3] = 240;
      } else {
        // Glowing 3D Plasma Fill with rib segments & specular glass core
        const ribDim = isRib ? 0.62 : 1.0;
        const core = Math.pow(cylinderLight, 1.4);
        const r = (pR * (0.45 + core * 0.55) + aR * specStreak * 0.6 + 110 * specStreak) * ribDim;
        const g = (pG * (0.45 + core * 0.55) + aG * specStreak * 0.6 + 110 * specStreak) * ribDim;
        const b = (pB * (0.45 + core * 0.55) + aB * specStreak * 0.6 + 110 * specStreak) * ribDim;
        out[idx] = Math.min(255, Math.round(r));
        out[idx + 1] = Math.min(255, Math.round(g));
        out[idx + 2] = Math.min(255, Math.round(b));
        out[idx + 3] = 252;
      }
    }
  }
  return out;
}

/**
 * Generates a 128x128 3D Armored Hexagonal Emblem Icon from real AI source renders
 */
function build3DEmblemIcon(
  srcTex: RawBuffer,
  frameTex: RawBuffer,
  primaryHex: string,
  accentHex: string,
  zoom = 1.0,
  angleRad = 0
): Uint8Array {
  const size = 128;
  const out = new Uint8Array(size * size * 4);
  const [pR, pG, pB] = hexToRgb(primaryHex);
  const [aR, aG, aB] = hexToRgb(accentHex);

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.45;
  const cosA = Math.cos(angleRad);
  const sinA = Math.sin(angleRad);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      // Signed distance to regular hexagon
      const ax = Math.abs(dx);
      const ay = Math.abs(dy);
      const hexDist = Math.max(ax * 0.866025 + ay * 0.5, ay) - radius;
      const idx = (y * size + x) * 4;

      if (hexDist > 3.0) {
        if (hexDist < 8.0) {
          const glow = Math.pow(1 - (hexDist - 3.0) / 5.0, 2) * 0.5;
          out[idx] = pR;
          out[idx + 1] = pG;
          out[idx + 2] = pB;
          out[idx + 3] = Math.round(glow * 255);
        }
        continue;
      }

      // Sample rotated & zoomed AI render for interior 3D object
      const rx = (dx * cosA - dy * sinA) / (radius * 2 * zoom) + 0.5;
      const ry = (dx * sinA + dy * cosA) / (radius * 2 * zoom) + 0.5;
      const [sR, sG, sB] = sampleBil(srcTex, rx, ry);
      const [fR, fG, fB] = sampleBil(frameTex, x / size, y / size);
      const fLum = (0.299 * fR + 0.587 * fG + 0.114 * fB) / 255;
      const sLum = (0.299 * sR + 0.587 * sG + 0.114 * sB) / 255;

      if (hexDist >= -7.5) {
        // 3D Beveled Hexagonal Metallic Rim
        const rimT = (hexDist + 7.5) / 7.5;
        const spec = Math.max(0, 1 - Math.abs(rimT - 0.5) * 2.2);
        const light = ((-dx - dy) / (radius * 1.4)) * 0.5 + 0.5;
        const r = 24 + fLum * 55 + pR * (0.4 + spec * 0.6) + aR * light * 0.35;
        const g = 32 + fLum * 60 + pG * (0.4 + spec * 0.6) + aG * light * 0.35;
        const b = 46 + fLum * 70 + pB * (0.4 + spec * 0.6) + aB * light * 0.35;
        const aa = hexDist > 0 ? Math.max(0, 1 - hexDist / 3.0) : 1;
        out[idx] = Math.min(255, Math.round(r));
        out[idx + 1] = Math.min(255, Math.round(g));
        out[idx + 2] = Math.min(255, Math.round(b));
        out[idx + 3] = Math.round(aa * 255);
      } else {
        // 3D AI Object Graded & Lit Inside Hex Medallion
        const vignette = Math.max(0, 1 - Math.hypot(dx, dy) / radius);
        const objWeight = Math.min(1, Math.max(0, (sLum - 0.08) * 1.45));
        const r =
          10 +
          sR * 0.65 * objWeight +
          pR * (sLum * 0.65 + vignette * 0.2) +
          aR * Math.pow(sLum, 2) * 0.45;
        const g =
          14 +
          sG * 0.65 * objWeight +
          pG * (sLum * 0.65 + vignette * 0.2) +
          aG * Math.pow(sLum, 2) * 0.45;
        const b =
          24 +
          sB * 0.65 * objWeight +
          pB * (sLum * 0.65 + vignette * 0.2) +
          aB * Math.pow(sLum, 2) * 0.45;

        out[idx] = Math.min(255, Math.round(r));
        out[idx + 1] = Math.min(255, Math.round(g));
        out[idx + 2] = Math.min(255, Math.round(b));
        out[idx + 3] = 255;
      }
    }
  }
  return out;
}

/**
 * Generates a circular 3D Singularity Core / Void Rift Portal / Joystick Reticle
 */
function build3DCircularReactor(
  size: number,
  coreTex: RawBuffer,
  ringTex: RawBuffer,
  primaryHex: string,
  secondaryHex: string,
  coreHex: string
): Uint8Array {
  const out = new Uint8Array(size * size * 4);
  const [pR, pG, pB] = hexToRgb(primaryHex);
  const [sR, sG, sB] = hexToRgb(secondaryHex);
  const [cR, cG, cB] = hexToRgb(coreHex);

  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.47;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const rDist = Math.hypot(dx, dy);
      const normR = rDist / maxR;
      if (normR > 1.05) continue;

      const angle = Math.atan2(dy, dx);
      const u = x / size;
      const v = y / size;

      // Swirl UV for core
      const swirlAngle = angle + (1 - normR) * 2.2;
      const su = 0.5 + Math.cos(swirlAngle) * normR * 0.45;
      const sv = 0.5 + Math.sin(swirlAngle) * normR * 0.45;

      const [tR, tG, tB] = sampleBil(coreTex, su, sv);
      const [rgR, rgG, rgB] = sampleBil(ringTex, u, v);
      const tLum = (0.299 * tR + 0.587 * tG + 0.114 * tB) / 255;
      const rgLum = (0.299 * rgR + 0.587 * rgG + 0.114 * rgB) / 255;

      // 3D Outer Gyroscopic Ring (0.76 <= normR <= 0.94)
      const isOuterRing = normR >= 0.76 && normR <= 0.94;
      const isInnerRing = normR >= 0.48 && normR <= 0.58;
      const segNotch = Math.sin(angle * 12) > -0.35;

      let r = 0;
      let g = 0;
      let b = 0;
      let alpha = 0;

      if (isOuterRing && segNotch) {
        const ringBevel = 1 - Math.abs(normR - 0.85) / 0.09;
        r = 30 + rgLum * 85 + pR * (0.45 + ringBevel * 0.55);
        g = 38 + rgLum * 90 + pG * (0.45 + ringBevel * 0.55);
        b = 52 + rgLum * 100 + pB * (0.45 + ringBevel * 0.55);
        alpha = 0.96;
      } else if (isInnerRing) {
        const ringBevel = 1 - Math.abs(normR - 0.53) / 0.05;
        r = 25 + rgLum * 70 + sR * (0.5 + ringBevel * 0.5) + 60 * ringBevel;
        g = 30 + rgLum * 75 + sG * (0.5 + ringBevel * 0.5) + 60 * ringBevel;
        b = 45 + rgLum * 85 + sB * (0.5 + ringBevel * 0.5) + 60 * ringBevel;
        alpha = 0.92;
      } else if (normR < 0.76) {
        const coreGlow = Math.pow(Math.max(0, 1 - normR / 0.76), 1.35);
        r = tR * 0.55 + pR * tLum * 0.75 + sR * coreGlow * 0.55 + cR * Math.pow(coreGlow, 2.5);
        g = tG * 0.55 + pG * tLum * 0.75 + sG * coreGlow * 0.55 + cG * Math.pow(coreGlow, 2.5);
        b = tB * 0.55 + pB * tLum * 0.75 + sB * coreGlow * 0.55 + cB * Math.pow(coreGlow, 2.5);
        alpha = Math.min(1, coreGlow * 1.35 + tLum * 0.45);
      } else {
        const halo = Math.max(0, 1 - Math.abs(normR - 0.85) / 0.2);
        r = pR;
        g = pG;
        b = pB;
        alpha = halo * 0.38;
      }

      const idx = (y * size + x) * 4;
      out[idx] = Math.min(255, Math.round(r));
      out[idx + 1] = Math.min(255, Math.round(g));
      out[idx + 2] = Math.min(255, Math.round(b));
      out[idx + 3] = Math.min(255, Math.round(alpha * 255));
    }
  }
  return out;
}

/**
 * Generates 3D Stargate Sector Preview Banners & 3D Drydock Hangar Bay Backdrop
 */
function build3DViewportBanner(
  width: number,
  height: number,
  bgTex: RawBuffer,
  fgTex: RawBuffer,
  frameTex: RawBuffer,
  primaryHex: string,
  accentHex: string
): Uint8Array {
  const out = new Uint8Array(width * height * 4);
  const [pR, pG, pB] = hexToRgb(primaryHex);
  const [aR, aG, aB] = hexToRgb(accentHex);

  const cx = width / 2;
  const cy = height / 2;
  const halfW = width / 2 - 2;
  const halfH = height / 2 - 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const px = x - cx;
      const py = y - cy;
      const d = sdChamferBox(px, py, halfW, halfH, 14);
      if (d > 2) continue;

      const u = x / width;
      const v = y / height;
      const [bR, bG, bB] = sampleBil(bgTex, u, v);
      const [fgR, fgG, fgB] = sampleBil(fgTex, (u - 0.5) * 0.9 + 0.5, (v - 0.5) * 0.9 + 0.5);
      const [frR, frG, frB] = sampleBil(frameTex, u * 1.4, v * 1.4);

      const fgLum = (0.299 * fgR + 0.587 * fgG + 0.114 * fgB) / 255;
      const frLum = (0.299 * frR + 0.587 * frG + 0.114 * frB) / 255;
      const idx = (y * width + x) * 4;

      if (d >= -7) {
        // 3D Armored Viewport Gantry Frame
        const rim = 1 - Math.abs(d + 3.5) / 3.5;
        out[idx] = Math.min(255, Math.round(22 + frLum * 60 + pR * (0.4 + rim * 0.5)));
        out[idx + 1] = Math.min(255, Math.round(30 + frLum * 65 + pG * (0.4 + rim * 0.5)));
        out[idx + 2] = Math.min(255, Math.round(45 + frLum * 75 + pB * (0.4 + rim * 0.5)));
        out[idx + 3] = 255;
      } else {
        // Deep Space AI Scene + Holographic Drydock/Stargate Ring
        const rDist = Math.hypot(px / (halfW * 0.75), py / (halfH * 0.75));
        const ringGlow = Math.max(0, 1 - Math.abs(rDist - 0.78) * 9.0);
        const fgWeight = Math.min(1, Math.max(0, (fgLum - 0.12) * 1.35));

        const r =
          bR * 0.45 +
          fgR * fgWeight * 0.65 +
          pR * (fgLum * 0.35 + ringGlow * 0.65) +
          aR * ringGlow * 0.4;
        const g =
          bG * 0.45 +
          fgG * fgWeight * 0.65 +
          pG * (fgLum * 0.35 + ringGlow * 0.65) +
          aG * ringGlow * 0.4;
        const b =
          bB * 0.5 +
          fgB * fgWeight * 0.65 +
          pB * (fgLum * 0.35 + ringGlow * 0.65) +
          aB * ringGlow * 0.4;

        out[idx] = Math.min(255, Math.round(r));
        out[idx + 1] = Math.min(255, Math.round(g));
        out[idx + 2] = Math.min(255, Math.round(b));
        out[idx + 3] = 250;
      }
    }
  }
  return out;
}

async function main() {
  const outDir = path.resolve(process.cwd(), 'public/assets/ui');
  fs.mkdirSync(outDir, { recursive: true });

  console.log('Loading 18 AI 3D renders from /src/assets/images/...');
  const starbase = loadAIImage('src/assets/images/orbital_starbase_1792868403285.jpg', 512, 512);
  const dreadnought = loadAIImage('src/assets/images/mothership_dreadnought_1792868402646.jpg', 512, 512);
  const nebula = loadAIImage('src/assets/images/space_nebula_deep_1792868402686.jpg', 512, 512);
  const shield = loadAIImage('src/assets/images/item_shield_1792916236937.jpg', 256, 256);
  const darkMatter = loadAIImage('src/assets/images/item_dark_matter_core_1792870508673.jpg', 256, 256);
  const scrap = loadAIImage('src/assets/images/item_scrap_1792916236014.jpg', 256, 256);
  const interceptor = loadAIImage('src/assets/images/player_interceptor_1792870491627.jpg', 256, 256);
  const cruiser = loadAIImage('src/assets/images/player_cruiser_1792870492703.jpg', 256, 256);
  const phantom = loadAIImage('src/assets/images/player_phantom_1792870492922.jpg', 256, 256);
  const playerDread = loadAIImage('src/assets/images/player_dreadnought_1792870493185.jpg', 256, 256);
  const quantum = loadAIImage('src/assets/images/quantum_starfighter_1792868403409.jpg', 256, 256);
  const drone = loadAIImage('src/assets/images/combat_drone_1792916236798.jpg', 256, 256);
  const boss = loadAIImage('src/assets/images/boss_void_leviathan_1792870506911.jpg', 256, 256);
  const mortar = loadAIImage('src/assets/images/enemy_mortar_1792916236632.jpg', 256, 256);
  const gunship = loadAIImage('src/assets/images/enemy_gunship_1792870507340.jpg', 256, 256);
  const asteroid = loadAIImage('src/assets/images/space_asteroid_ore_1792870508639.jpg', 256, 256);

  const saveAsset = (filename: string, w: number, h: number, rgba: Uint8Array) => {
    const file = path.join(outDir, filename);
    fs.writeFileSync(file, encodePNG(w, h, rgba));
  };

  console.log('1. Generating 3D Sci-Fi Armored Panel Frames...');
  const panelVariants: Array<[string, string, string]> = [
    ['cyan', '#06b6d4', '#67e8f9'],
    ['amber', '#f59e0b', '#fde047'],
    ['purple', '#a855f7', '#e879f9'],
    ['rose', '#f43f5e', '#fda4af'],
    ['emerald', '#10b981', '#6ee7b7'],
    ['slate', '#475569', '#94a3b8'],
  ];

  for (const [name, pHex, aHex] of panelVariants) {
    saveAsset(
      `panel_frame_${name}.png`,
      512,
      320,
      build3DPanelAsset(512, 320, starbase, dreadnought, nebula, pHex, aHex, 20, 12)
    );
  }

  console.log('2. Generating 3D HUD Header, Vitals Console, Boss Frame & Bottom Nav Dock...');
  saveAsset(
    'hud_top_bar.png',
    640,
    112,
    build3DPanelAsset(640, 112, starbase, dreadnought, nebula, '#06b6d4', '#67e8f9', 16, 10)
  );
  saveAsset(
    'hud_vitals_console.png',
    640,
    112,
    build3DPanelAsset(640, 112, dreadnought, starbase, nebula, '#0ea5e9', '#34d399', 16, 10)
  );
  saveAsset(
    'hud_bottom_nav.png',
    640,
    112,
    build3DPanelAsset(640, 112, starbase, dreadnought, nebula, '#0284c7', '#38bdf8', 14, 10)
  );
  saveAsset(
    'hud_boss_frame.png',
    640,
    112,
    build3DPanelAsset(640, 112, dreadnought, boss, nebula, '#e11d48', '#fbbf24', 16, 11)
  );

  console.log('3. Generating 3D Tactile Buttons & Thumb Action Slots...');
  for (const [name, pHex, aHex] of panelVariants) {
    saveAsset(
      `btn_${name}.png`,
      320,
      96,
      build3DButtonAsset(320, 96, starbase, shield, pHex, aHex, false, 14)
    );
    saveAsset(
      `btn_active_${name}.png`,
      320,
      96,
      build3DButtonAsset(320, 96, starbase, shield, pHex, aHex, true, 14)
    );
    saveAsset(
      `thumb_slot_${name}.png`,
      160,
      160,
      build3DButtonAsset(160, 160, dreadnought, shield, pHex, aHex, false, 18)
    );
    saveAsset(
      `thumb_slot_active_${name}.png`,
      160,
      160,
      build3DButtonAsset(160, 160, dreadnought, shield, pHex, aHex, true, 18)
    );
  }

  console.log('4. Generating 3D Segmented Plasma Gauge Bars...');
  saveAsset('bar_track_3d.png', 384, 40, build3DBarAsset(384, 40, starbase, '#38bdf8', '#94a3b8', true));
  for (const [name, pHex, aHex] of panelVariants) {
    saveAsset(`bar_fill_${name}.png`, 384, 40, build3DBarAsset(384, 40, starbase, pHex, aHex, false));
  }

  console.log('5. Generating 3D Singularity Core, Void Rift Portal, Joystick & Drydock Viewports...');
  saveAsset(
    'singularity_core_3d.png',
    256,
    256,
    build3DCircularReactor(256, darkMatter, starbase, '#f59e0b', '#00f2fe', '#ffffff')
  );
  saveAsset(
    'void_rift_portal_3d.png',
    256,
    256,
    build3DCircularReactor(256, boss, darkMatter, '#a855f7', '#f43f5e', '#090d16')
  );
  saveAsset(
    'touch_joystick_base_3d.png',
    192,
    192,
    build3DCircularReactor(192, shield, starbase, '#06b6d4', '#38bdf8', '#040711')
  );
  saveAsset(
    'touch_joystick_knob_3d.png',
    96,
    96,
    build3DCircularReactor(96, shield, quantum, '#22d3ee', '#67e8f9', '#ffffff')
  );
  saveAsset(
    'drydock_bay_3d.png',
    512,
    256,
    build3DViewportBanner(512, 256, nebula, starbase, dreadnought, '#06b6d4', '#38bdf8')
  );

  // 8 Stargate Sector 3D Banners
  const sectorConfigs: Array<[number, RawBuffer, string, string]> = [
    [1, starbase, '#38bdf8', '#67e8f9'],
    [2, asteroid, '#f59e0b', '#fde047'],
    [3, gunship, '#10b981', '#6ee7b7'],
    [4, mortar, '#ec4899', '#f472b6'],
    [5, dreadnought, '#a855f7', '#c084fc'],
    [6, quantum, '#06b6d4', '#22d3ee'],
    [7, darkMatter, '#eab308', '#facc15'],
    [8, boss, '#f43f5e', '#fb7185'],
  ];
  for (const [secNum, fgTex, pHex, aHex] of sectorConfigs) {
    saveAsset(
      `stargate_sector_0${secNum}.png`,
      256,
      144,
      build3DViewportBanner(256, 144, nebula, fgTex, starbase, pHex, aHex)
    );
  }

  console.log('6. Generating 3D Hexagonal HUD & Navigation Emblem Icons...');
  const icons: Array<[string, RawBuffer, string, string, number, number]> = [
    ['icon_scrap_3d.png', scrap, '#f59e0b', '#fef08a', 0.95, 0],
    ['icon_dark_matter_3d.png', darkMatter, '#a855f7', '#f0abfc', 0.95, 0],
    ['icon_quantum_shard_3d.png', shield, '#06b6d4', '#c084fc', 0.9, 0.4],
    ['icon_shield_3d.png', shield, '#38bdf8', '#bae6fd', 0.92, 0],
    ['icon_hull_3d.png', playerDread, '#10b981', '#6ee7b7', 0.92, 0],
    ['icon_autopilot_3d.png', drone, '#22d3ee', '#a5f3fc', 0.9, 0],
    ['icon_dash_3d.png', quantum, '#38bdf8', '#ffffff', 0.9, -0.35],
    ['icon_missile_3d.png', mortar, '#f43f5e', '#fbbf24', 0.92, 0],
    ['icon_ultimate_3d.png', darkMatter, '#f59e0b', '#ffffff', 0.88, 0.5],
    ['icon_upgrades_3d.png', starbase, '#f59e0b', '#38bdf8', 0.9, 0],
    ['icon_hangar_3d.png', interceptor, '#06b6d4', '#67e8f9', 0.92, 0],
    ['icon_armory_3d.png', cruiser, '#38bdf8', '#f59e0b', 0.92, 0],
    ['icon_rifts_3d.png', boss, '#a855f7', '#f43f5e', 0.92, 0],
    ['icon_shop_3d.png', phantom, '#10b981', '#fde047', 0.92, 0],
    ['icon_hq_3d.png', starbase, '#f59e0b', '#fde047', 0.92, 0],
    ['icon_audio_on_3d.png', shield, '#22d3ee', '#ffffff', 0.85, 0.8],
    ['icon_audio_off_3d.png', asteroid, '#64748b', '#94a3b8', 0.85, 0],
    ['icon_pause_3d.png', dreadnought, '#38bdf8', '#e2e8f0', 0.9, 0],
    ['icon_lock_3d.png', mortar, '#f59e0b', '#fda4af', 0.88, 0],
    ['icon_boss_skull_3d.png', boss, '#f43f5e', '#fde047', 0.95, 0],
  ];

  for (const [file, tex, pHex, aHex, zoom, ang] of icons) {
    saveAsset(file, 128, 128, build3DEmblemIcon(tex, starbase, pHex, aHex, zoom, ang));
  }

  console.log('All 3D AI-Textured UI, HUD, Panel, Bar & Emblem assets generated in /public/assets/ui/!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
