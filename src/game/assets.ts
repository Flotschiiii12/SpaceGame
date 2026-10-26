// Aether Void - Real 3D Asset Manager, Sprite Sheet Atlas Loader & PBR Runtime Baker
// Loads individual 256x256 3D PNG sprites (/assets/sprites/...),
// 4 comprehensive 3D sprite sheet atlases (/assets/sprites/sheets/*_3d_spritesheet.png),
// 3D AI-generated UI/HUD assets (/assets/ui/*.png),
// and the 18 raw 3D renders in /src/assets/images/.

import { ShipClassConfig, EquipmentItem } from './types.ts';

export const SPRITE_SHEET_ATLASES = {
  ships: '/assets/sprites/sheets/ships_3d_spritesheet.png',
  lasers: '/assets/sprites/sheets/lasers_3d_spritesheet.png',
  shields: '/assets/sprites/sheets/shields_3d_spritesheet.png',
  drones: '/assets/sprites/sheets/drones_3d_spritesheet.png',
  manifest: '/assets/sprites/sheets/sprite_atlas_manifest.json',
} as const;

export const UI_ASSETS = {
  panels: {
    cyan: '/assets/ui/panel_frame_cyan.png',
    amber: '/assets/ui/panel_frame_amber.png',
    purple: '/assets/ui/panel_frame_purple.png',
    rose: '/assets/ui/panel_frame_rose.png',
    emerald: '/assets/ui/panel_frame_emerald.png',
    slate: '/assets/ui/panel_frame_slate.png',
  },
  hud: {
    topBar: '/assets/ui/hud_top_bar.png',
    vitalsConsole: '/assets/ui/hud_vitals_console.png',
    bottomNav: '/assets/ui/hud_bottom_nav.png',
    bossFrame: '/assets/ui/hud_boss_frame.png',
    drydockBay: '/assets/ui/drydock_bay_3d.png',
    singularityCore: '/assets/ui/singularity_core_3d.png',
    voidRiftPortal: '/assets/ui/void_rift_portal_3d.png',
    joystickBase: '/assets/ui/touch_joystick_base_3d.png',
    joystickKnob: '/assets/ui/touch_joystick_knob_3d.png',
  },
  bars: {
    track: '/assets/ui/bar_track_3d.png',
    cyan: '/assets/ui/bar_fill_cyan.png',
    emerald: '/assets/ui/bar_fill_emerald.png',
    amber: '/assets/ui/bar_fill_amber.png',
    rose: '/assets/ui/bar_fill_rose.png',
    purple: '/assets/ui/bar_fill_purple.png',
    slate: '/assets/ui/bar_fill_slate.png',
  },
  icons: {
    scrap: '/assets/ui/icon_scrap_3d.png',
    darkMatter: '/assets/ui/icon_dark_matter_3d.png',
    quantumShard: '/assets/ui/icon_quantum_shard_3d.png',
    shield: '/assets/ui/icon_shield_3d.png',
    hull: '/assets/ui/icon_hull_3d.png',
    autopilot: '/assets/ui/icon_autopilot_3d.png',
    dash: '/assets/ui/icon_dash_3d.png',
    missile: '/assets/ui/icon_missile_3d.png',
    ultimate: '/assets/ui/icon_ultimate_3d.png',
    upgrades: '/assets/ui/icon_upgrades_3d.png',
    hangar: '/assets/ui/icon_hangar_3d.png',
    armory: '/assets/ui/icon_armory_3d.png',
    rifts: '/assets/ui/icon_rifts_3d.png',
    shop: '/assets/ui/icon_shop_3d.png',
    hq: '/assets/ui/icon_hq_3d.png',
    audioOn: '/assets/ui/icon_audio_on_3d.png',
    audioOff: '/assets/ui/icon_audio_off_3d.png',
    pause: '/assets/ui/icon_pause_3d.png',
    lock: '/assets/ui/icon_lock_3d.png',
    bossSkull: '/assets/ui/icon_boss_skull_3d.png',
  },
} as const;

export function getStargateSectorBannerUrl(sectorNumber: number): string {
  const clamped = Math.max(1, Math.min(8, sectorNumber));
  return `/assets/ui/stargate_sector_0${clamped}.png`;
}

export const GAME_ASSETS = {
  spriteSheets: SPRITE_SHEET_ATLASES,
  ui: UI_ASSETS,
  ships: {
    interceptor: '/src/assets/images/player_interceptor_1792870491627.jpg',
    cruiser: '/src/assets/images/player_cruiser_1792870492703.jpg',
    phantom: '/src/assets/images/player_phantom_1792870492922.jpg',
    dreadnought: '/src/assets/images/player_dreadnought_1792870493185.jpg',
    quantum: '/src/assets/images/quantum_starfighter_1792868403409.jpg',
    mothership: '/src/assets/images/mothership_dreadnought_1792868402646.jpg',
  },
  allies: {
    drone: '/src/assets/images/combat_drone_1792916236798.jpg',
  },
  enemies: {
    swarmer: '/src/assets/images/enemy_swarmer_1792870507183.jpg',
    scout: '/src/assets/images/enemy_swarmer_1792870507183.jpg',
    frigate: '/src/assets/images/enemy_gunship_1792870507340.jpg',
    stalker: '/src/assets/images/enemy_stalker_1792916235614.jpg',
    mortar: '/src/assets/images/enemy_mortar_1792916236632.jpg',
    boss: '/src/assets/images/boss_void_leviathan_1792870506911.jpg',
  },
  environment: {
    asteroid: '/src/assets/images/space_asteroid_ore_1792870508639.jpg',
    nebula: '/src/assets/images/space_nebula_deep_1792868402686.jpg',
    starbase: '/src/assets/images/orbital_starbase_1792868403285.jpg',
    mothership: '/src/assets/images/mothership_dreadnought_1792868402646.jpg',
    quantumFighter: '/src/assets/images/quantum_starfighter_1792868403409.jpg',
  },
  items: {
    scrap: '/src/assets/images/item_scrap_1792916236014.jpg',
    shieldBoost: '/src/assets/images/item_shield_1792916236937.jpg',
    darkMatterCore: '/src/assets/images/item_dark_matter_core_1792870508673.jpg',
  },
} as const;

export type ShipAssetKey = keyof typeof GAME_ASSETS.ships;
export type EnemyAssetKey = keyof typeof GAME_ASSETS.enemies;

export function getIndividualShipSpriteUrl(shipId: string): string {
  const normalized = shipId.startsWith('ship_') ? shipId : 'ship_01';
  return `/assets/sprites/ships/${normalized}.png`;
}

export function getIndividualEquipmentSpriteUrl(item: EquipmentItem | string): string {
  const id = typeof item === 'string' ? item : item.id;
  if (id.startsWith('laser_')) return `/assets/sprites/lasers/${id}.png`;
  if (id.startsWith('shield_')) return `/assets/sprites/shields/${id}.png`;
  if (id.startsWith('drone_')) return `/assets/sprites/drones/${id}.png`;
  return `/assets/sprites/missiles/${id}.png`;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16) || 0;
    const g = parseInt(clean[1] + clean[1], 16) || 0;
    const b = parseInt(clean[2] + clean[2], 16) || 0;
    return [r, g, b];
  }
  const num = parseInt(clean.substring(0, 6), 16);
  if (Number.isNaN(num)) return [56, 189, 248];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

class AssetManager {
  private rawImages: Map<string, HTMLImageElement> = new Map();
  private transparentCanvases: Map<string, HTMLCanvasElement> = new Map();
  private proceduralSprites: Map<string, HTMLCanvasElement> = new Map();
  private sheetImages: Map<keyof typeof SPRITE_SHEET_ATLASES, HTMLImageElement> = new Map();
  private individualSprites: Map<string, HTMLImageElement> = new Map();
  private bakedShipSprites: Map<string, HTMLCanvasElement> = new Map();
  private bakedDroneSprites: Map<string, HTMLCanvasElement> = new Map();
  private bakedEquipmentSprites: Map<string, HTMLCanvasElement> = new Map();
  private bakedDataUrls: Map<string, string> = new Map();
  private loadedCount = 0;
  private totalCount = 0;
  public isReady = false;
  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof document !== 'undefined' && typeof Image !== 'undefined') {
      this.initProceduralSprites();
      this.preloadAll();
    }
  }

  public onReadyChange(listener: () => void): () => void {
    this.listeners.add(listener);
    if (this.isReady) {
      listener();
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch {}
    });
  }

  private initProceduralSprites() {
    this.proceduralSprites.set('laser_ion_cyan', this.createLaserBoltCanvas('#38bdf8', '#ffffff', 28, 8));
    this.proceduralSprites.set('laser_plasma_amber', this.createLaserBoltCanvas('#fbbf24', '#ffffff', 32, 9));
    this.proceduralSprites.set('laser_tachyon_purple', this.createLaserBoltCanvas('#c084fc', '#ffffff', 30, 8));
    this.proceduralSprites.set('laser_heavy_green', this.createLaserBoltCanvas('#34d399', '#ffffff', 34, 10));
    this.proceduralSprites.set('laser_enemy_red', this.createLaserBoltCanvas('#f43f5e', '#ffffff', 26, 7, true));
    this.proceduralSprites.set('laser_boss_void', this.createVoidOrbCanvas('#a855f7', '#f43f5e', 24));
  }

  private createLaserBoltCanvas(
    color: string,
    coreColor: string,
    length: number,
    width: number,
    isEnemy: boolean = false
  ): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = length + 16;
    c.height = width + 16;
    const ctx = c.getContext('2d');
    if (!ctx) return c;

    const cx = c.width / 2;
    const cy = c.height / 2;

    ctx.save();
    ctx.translate(cx, cy);

    const grad = ctx.createLinearGradient(-length / 2, 0, length / 2, 0);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(0.25, color);
    grad.addColorStop(0.85, coreColor);
    grad.addColorStop(1, color);

    ctx.shadowColor = color;
    ctx.shadowBlur = isEnemy ? 6 : 8;
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.moveTo(-length / 2, 0);
    ctx.lineTo(length / 2 - 4, -width / 2);
    ctx.lineTo(length / 2, 0);
    ctx.lineTo(length / 2 - 4, width / 2);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = coreColor;
    ctx.beginPath();
    ctx.moveTo(-length / 4, 0);
    ctx.lineTo(length / 2 - 3, -width / 4);
    ctx.lineTo(length / 2 - 1, 0);
    ctx.lineTo(length / 2 - 3, width / 4);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
    return c;
  }

  private createVoidOrbCanvas(outerColor: string, innerColor: string, radius: number): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = radius * 3;
    c.height = radius * 3;
    const ctx = c.getContext('2d');
    if (!ctx) return c;

    const cx = c.width / 2;
    const cy = c.height / 2;

    const outerGrad = ctx.createRadialGradient(cx, cy, radius * 0.4, cx, cy, radius * 1.4);
    outerGrad.addColorStop(0, outerColor);
    outerGrad.addColorStop(0.7, innerColor);
    outerGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = outerGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.55, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.58, 0, Math.PI * 2);
    ctx.stroke();

    return c;
  }

  private preloadAll() {
    // 1. Preload the 4 Comprehensive High-Resolution 3D Sprite Sheet Atlases
    const sheetEntries: Array<[keyof typeof SPRITE_SHEET_ATLASES, string]> = [
      ['ships', SPRITE_SHEET_ATLASES.ships],
      ['lasers', SPRITE_SHEET_ATLASES.lasers],
      ['shields', SPRITE_SHEET_ATLASES.shields],
      ['drones', SPRITE_SHEET_ATLASES.drones],
    ];

    for (const [sheetKey, sheetUrl] of sheetEntries) {
      const sImg = new Image();
      sImg.crossOrigin = 'anonymous';
      sImg.src = sheetUrl;
      sImg.onload = () => {
        this.sheetImages.set(sheetKey, sImg);
        this.bakedShipSprites.clear();
        this.bakedDroneSprites.clear();
        this.bakedEquipmentSprites.clear();
        this.bakedDataUrls.clear();
        this.notifyListeners();
      };
    }

    // 2. Preload the 18 base 3D renders + 3D Canvas HUD/Joystick/Gauge assets
    const urls: { key: string; url: string; makeTransparent: boolean; threshold?: number }[] = [
      { key: 'ship_interceptor', url: GAME_ASSETS.ships.interceptor, makeTransparent: true, threshold: 22 },
      { key: 'ship_cruiser', url: GAME_ASSETS.ships.cruiser, makeTransparent: true, threshold: 20 },
      { key: 'ship_phantom', url: GAME_ASSETS.ships.phantom, makeTransparent: true, threshold: 20 },
      { key: 'ship_dreadnought', url: GAME_ASSETS.ships.dreadnought, makeTransparent: true, threshold: 22 },
      { key: 'ship_quantum', url: GAME_ASSETS.ships.quantum, makeTransparent: true, threshold: 20 },
      { key: 'ship_mothership', url: GAME_ASSETS.ships.mothership, makeTransparent: true, threshold: 20 },
      { key: 'ally_drone', url: GAME_ASSETS.allies.drone, makeTransparent: true, threshold: 20 },
      { key: 'enemy_swarmer', url: GAME_ASSETS.enemies.swarmer, makeTransparent: true, threshold: 18 },
      { key: 'enemy_scout', url: GAME_ASSETS.enemies.scout, makeTransparent: true, threshold: 18 },
      { key: 'enemy_frigate', url: GAME_ASSETS.enemies.frigate, makeTransparent: true, threshold: 18 },
      { key: 'enemy_stalker', url: GAME_ASSETS.enemies.stalker, makeTransparent: true, threshold: 20 },
      { key: 'enemy_mortar', url: GAME_ASSETS.enemies.mortar, makeTransparent: true, threshold: 20 },
      { key: 'enemy_boss', url: GAME_ASSETS.enemies.boss, makeTransparent: true, threshold: 20 },
      { key: 'item_scrap', url: GAME_ASSETS.items.scrap, makeTransparent: true, threshold: 18 },
      { key: 'item_shield_boost', url: GAME_ASSETS.items.shieldBoost, makeTransparent: true, threshold: 18 },
      { key: 'item_dark_matter', url: GAME_ASSETS.items.darkMatterCore, makeTransparent: true, threshold: 15 },
      { key: 'env_asteroid', url: GAME_ASSETS.environment.asteroid, makeTransparent: true, threshold: 20 },
      { key: 'env_nebula', url: GAME_ASSETS.environment.nebula, makeTransparent: false },
      { key: 'env_starbase', url: GAME_ASSETS.environment.starbase, makeTransparent: true, threshold: 18 },
      { key: 'ui_joystick_base', url: UI_ASSETS.hud.joystickBase, makeTransparent: false },
      { key: 'ui_joystick_knob', url: UI_ASSETS.hud.joystickKnob, makeTransparent: false },
      { key: 'ui_boss_frame', url: UI_ASSETS.hud.bossFrame, makeTransparent: false },
      { key: 'ui_boss_skull', url: UI_ASSETS.icons.bossSkull, makeTransparent: false },
      { key: 'ui_bar_track', url: UI_ASSETS.bars.track, makeTransparent: false },
      { key: 'ui_bar_fill_rose', url: UI_ASSETS.bars.rose, makeTransparent: false },
      { key: 'ui_bar_fill_cyan', url: UI_ASSETS.bars.cyan, makeTransparent: false },
      { key: 'ui_bar_fill_emerald', url: UI_ASSETS.bars.emerald, makeTransparent: false },
      { key: 'ui_bar_fill_amber', url: UI_ASSETS.bars.amber, makeTransparent: false },
      { key: 'missile_swarm', url: '/assets/sprites/missiles/micro_swarm.png', makeTransparent: false },
      { key: 'missile_torpedo', url: '/assets/sprites/missiles/heavy_torpedo.png', makeTransparent: false },
      { key: 'missile_emp', url: '/assets/sprites/missiles/emp_disruptor.png', makeTransparent: false },
      { key: 'missile_omega', url: '/assets/sprites/missiles/omega_nova_warhead.png', makeTransparent: false },
    ];

    this.totalCount = urls.length;

    urls.forEach(({ key, url, makeTransparent, threshold = 20 }) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;

      img.onload = () => {
        this.rawImages.set(key, img);

        if (makeTransparent) {
          try {
            const canvas = this.createTransparentSprite(img, threshold);
            this.transparentCanvases.set(key, canvas);
          } catch {
            // fallback to raw image
          }
        }

        this.bakedShipSprites.clear();
        this.bakedDroneSprites.clear();
        this.bakedEquipmentSprites.clear();
        this.bakedDataUrls.clear();

        this.loadedCount++;
        if (this.loadedCount >= this.totalCount) {
          this.isReady = true;
        }
        this.notifyListeners();
      };

      img.onerror = () => {
        this.loadedCount++;
        if (this.loadedCount >= this.totalCount) {
          this.isReady = true;
          this.notifyListeners();
        }
      };
    });
  }

  private getOrLoadIndividualPng(id: string, url: string): HTMLImageElement | null {
    const existing = this.individualSprites.get(id);
    if (existing) {
      return existing.complete && existing.naturalWidth > 0 ? existing : null;
    }
    if (typeof Image === 'undefined') return null;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    this.individualSprites.set(id, img);
    img.onload = () => {
      this.bakedShipSprites.delete(id);
      this.bakedDroneSprites.delete(id);
      this.bakedEquipmentSprites.delete(id);
      this.notifyListeners();
    };
    return null;
  }

  private removeBackgroundFromCanvas(c: HTMLCanvasElement, threshold: number = 56): void {
    const w = c.width;
    const h = c.height;
    if (w <= 0 || h <= 0) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;

    // Sample corner & border pixels to capture the exact dark-blue/slate/black background color
    const sampleCoords = [
      [1, 1],
      [w - 2, 1],
      [1, h - 2],
      [w - 2, h - 2],
      [Math.floor(w / 2), 1],
      [Math.floor(w / 2), h - 2],
      [1, Math.floor(h / 2)],
      [w - 2, Math.floor(h / 2)],
    ];
    const bgSamples: Array<[number, number, number]> = [];
    for (const [sx, sy] of sampleCoords) {
      const idx = (Math.max(0, Math.min(h - 1, sy)) * w + Math.max(0, Math.min(w - 1, sx))) * 4;
      if (d[idx + 3] > 10) {
        bgSamples.push([d[idx], d[idx + 1], d[idx + 2]]);
      }
    }
    if (bgSamples.length === 0) {
      bgSamples.push([8, 14, 30]);
    }

    const isBackgroundColor = (r: number, g: number, b: number): boolean => {
      const maxVal = Math.max(r, g, b);
      if (maxVal < 26) return true;

      // Check dark navy/slate background characteristic of space sprite tiles
      if (r < 48 && g < 64 && b < 105 && b >= r && g >= r * 0.8) {
        return true;
      }

      // Check Euclidean RGB distance to sampled border pixels
      for (let s = 0; s < bgSamples.length; s++) {
        const [br, bg, bb] = bgSamples[s];
        const dr = r - br;
        const dg = g - bg;
        const db = b - bb;
        const distSq = dr * dr + dg * dg + db * db;
        if (distSq <= threshold * threshold && maxVal < 125) {
          return true;
        }
      }
      return false;
    };

    // 1. Flood-fill from all 4 edges to remove the connected rectangular background box
    const visited = new Uint8Array(w * h);
    const queue = new Int32Array(w * h);
    let head = 0;
    let tail = 0;

    const tryEnqueue = (x: number, y: number) => {
      const pIdx = y * w + x;
      if (visited[pIdx]) return;
      const i = pIdx * 4;
      if (d[i + 3] === 0 || isBackgroundColor(d[i], d[i + 1], d[i + 2])) {
        visited[pIdx] = 1;
        queue[tail++] = pIdx;
      }
    };

    for (let x = 0; x < w; x++) {
      tryEnqueue(x, 0);
      tryEnqueue(x, h - 1);
    }
    for (let y = 0; y < h; y++) {
      tryEnqueue(0, y);
      tryEnqueue(w - 1, y);
    }

    while (head < tail) {
      const pIdx = queue[head++];
      const i = pIdx * 4;
      d[i + 3] = 0;

      const x = pIdx % w;
      const y = (pIdx - x) / w;
      if (x > 0) tryEnqueue(x - 1, y);
      if (x < w - 1) tryEnqueue(x + 1, y);
      if (y > 0) tryEnqueue(x, y - 1);
      if (y < h - 1) tryEnqueue(x, y + 1);
    }

    // 2. Also clear any isolated dark background pockets & feather 1-2px silhouette edges
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const pIdx = y * w + x;
        const i = pIdx * 4;
        if (d[i + 3] === 0) continue;

        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];
        const maxVal = Math.max(r, g, b);

        if (maxVal < 22) {
          d[i + 3] = 0;
          visited[pIdx] = 1;
          continue;
        }

        // Check if adjacent to a flood-filled background pixel for smooth anti-aliased edge feathering
        let emptyNeighbors = 0;
        if (x > 0 && visited[pIdx - 1]) emptyNeighbors++;
        if (x < w - 1 && visited[pIdx + 1]) emptyNeighbors++;
        if (y > 0 && visited[pIdx - w]) emptyNeighbors++;
        if (y < h - 1 && visited[pIdx + w]) emptyNeighbors++;

        if (emptyNeighbors > 0) {
          if (isBackgroundColor(r, g, b) || (r < 62 && g < 78 && b < 120)) {
            const fade = Math.max(0, Math.min(1, (maxVal - 25) / 65));
            d[i + 3] = Math.floor(d[i + 3] * fade * (1 - emptyNeighbors * 0.2));
            // Despill blue halo on boundary pixels
            if (b > Math.max(r, g)) {
              d[i + 2] = Math.round((b + Math.max(r, g)) * 0.5);
            }
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }

  private createTransparentSprite(img: HTMLImageElement, blackThreshold: number): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = img.naturalWidth || img.width;
    c.height = img.naturalHeight || img.height;
    const ctx = c.getContext('2d');
    if (!ctx) return c;

    ctx.drawImage(img, 0, 0);
    this.removeBackgroundFromCanvas(c, Math.max(48, blackThreshold + 28));
    return c;
  }

  private createPbrGraded3DCanvas(
    source: HTMLCanvasElement,
    primaryHex: string,
    trimHex: string,
    glowHex: string,
    contrastBoost: number = 1.08
  ): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = source.width;
    c.height = source.height;
    const ctx = c.getContext('2d');
    if (!ctx) return c;

    ctx.drawImage(source, 0, 0);
    const imgData = ctx.getImageData(0, 0, c.width, c.height);
    const d = imgData.data;

    const [pR, pG, pB] = hexToRgb(primaryHex);
    const [tR, tG, tB] = hexToRgb(trimHex);
    const [gR, gG, gB] = hexToRgb(glowHex);

    for (let i = 0; i < d.length; i += 4) {
      const a = d[i + 3];
      if (a === 0) continue;

      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];

      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      const cLum = Math.max(0, Math.min(1, (lum - 0.5) * contrastBoost + 0.5));

      let nr: number;
      let ng: number;
      let nb: number;

      if (cLum < 0.35) {
        const k = cLum / 0.35;
        nr = r * 0.25 + tR * k * 0.85;
        ng = g * 0.25 + tG * k * 0.85;
        nb = b * 0.25 + tB * k * 0.85;
      } else if (cLum < 0.78) {
        const k = (cLum - 0.35) / 0.43;
        nr = tR * (1 - k) * 0.7 + pR * (0.55 + k * 0.65);
        ng = tG * (1 - k) * 0.7 + pG * (0.55 + k * 0.65);
        nb = tB * (1 - k) * 0.7 + pB * (0.55 + k * 0.65);
      } else {
        const k = (cLum - 0.78) / 0.22;
        nr = gR * (1 - k) + 255 * k;
        ng = gG * (1 - k) + 255 * k;
        nb = gB * (1 - k) + 255 * k;
      }

      d[i] = Math.max(0, Math.min(255, Math.round(nr)));
      d[i + 1] = Math.max(0, Math.min(255, Math.round(ng)));
      d[i + 2] = Math.max(0, Math.min(255, Math.round(nb)));
    }

    ctx.putImageData(imgData, 0, 0);
    return c;
  }

  private createHitFlashCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = source.width;
    c.height = source.height;
    const ctx = c.getContext('2d');
    if (!ctx) return c;
    ctx.drawImage(source, 0, 0);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
    ctx.fillRect(0, 0, c.width, c.height);
    return c;
  }

  public getShip3DSprite(
    ship: ShipClassConfig,
    options?: {
      overridePrimary?: string;
      overrideAccent?: string;
      hitFlash?: boolean;
    }
  ): HTMLCanvasElement | null {
    const primary = options?.overridePrimary || ship.primaryColor;
    const trim = options?.overrideAccent || ship.visualAsset.trimColor;
    const isCustomSkin = Boolean(options?.overridePrimary || options?.overrideAccent);
    const cacheKey = `${ship.id}_${primary}_${trim}_${options?.hitFlash ? 'hit' : 'norm'}`;

    if (this.bakedShipSprites.has(cacheKey)) {
      return this.bakedShipSprites.get(cacheKey)!;
    }

    const size = 256;
    const out = document.createElement('canvas');
    out.width = size;
    out.height = size;
    const ctx = out.getContext('2d');
    if (!ctx) return null;

    const idx = Math.max(0, Math.min(49, ship.tier - 1));
    const col = idx % 10;
    const row = Math.floor(idx / 10);

    const shipsSheet = this.sheetImages.get('ships');
    const indImg = this.getOrLoadIndividualPng(ship.id, getIndividualShipSpriteUrl(ship.id));

    if (indImg) {
      ctx.drawImage(indImg, 0, 0, size, size);
      this.removeBackgroundFromCanvas(out, 58);
    } else if (shipsSheet && shipsSheet.complete && shipsSheet.naturalWidth > 0) {
      ctx.drawImage(shipsSheet, col * 256, row * 256, 256, 256, 0, 0, size, size);
      this.removeBackgroundFromCanvas(out, 58);
    } else {
      const fallbackKey =
        ship.generation >= 8
          ? 'ship_mothership'
          : ship.generation >= 6
            ? 'ship_quantum'
            : ship.role === 'Fortress Tank' || ship.role === 'Siege Dreadnought'
              ? 'ship_dreadnought'
              : ship.role === 'Stealth Assassin'
                ? 'ship_phantom'
                : ship.role === 'Heavy Gunship'
                  ? 'ship_cruiser'
                  : 'ship_interceptor';
      const fallback =
        this.transparentCanvases.get(fallbackKey) ||
        this.transparentCanvases.get('ship_interceptor');
      if (!fallback) return null;
      ctx.drawImage(fallback, 0, 0, size, size);
    }

    let finalCanvas = out;
    if (isCustomSkin) {
      finalCanvas = this.createPbrGraded3DCanvas(out, primary, trim, ship.engineGlow, 1.08);
    }
    if (options?.hitFlash) {
      finalCanvas = this.createHitFlashCanvas(finalCanvas);
    }

    if (indImg || (shipsSheet && shipsSheet.complete)) {
      this.bakedShipSprites.set(cacheKey, finalCanvas);
      if (!isCustomSkin && !options?.hitFlash && !this.bakedDataUrls.has(ship.id)) {
        try {
          this.bakedDataUrls.set(ship.id, finalCanvas.toDataURL('image/png'));
        } catch {}
      }
    }
    return finalCanvas;
  }

  public getDrone3DSprite(
    droneTier: number,
    primaryColor: string,
    secondaryColor: string
  ): HTMLCanvasElement | null {
    const tierIdx = Math.max(0, Math.min(19, droneTier - 1));
    const droneId = `drone_${String(tierIdx + 1).padStart(2, '0')}`;
    const cacheKey = `drone_${droneId}_${primaryColor}_${secondaryColor}`;

    if (this.bakedDroneSprites.has(cacheKey)) {
      return this.bakedDroneSprites.get(cacheKey)!;
    }

    const size = 128;
    const out = document.createElement('canvas');
    out.width = size;
    out.height = size;
    const ctx = out.getContext('2d');
    if (!ctx) return null;

    const col = tierIdx % 5;
    const row = Math.floor(tierIdx / 5);
    const dronesSheet = this.sheetImages.get('drones');
    const indImg = this.getOrLoadIndividualPng(droneId, `/assets/sprites/drones/${droneId}.png`);

    if (indImg) {
      ctx.drawImage(indImg, 0, 0, size, size);
      this.removeBackgroundFromCanvas(out, 58);
      this.bakedDroneSprites.set(cacheKey, out);
      if (!this.bakedDataUrls.has(droneId)) {
        try {
          this.bakedDataUrls.set(droneId, out.toDataURL('image/png'));
        } catch {}
      }
      return out;
    }
    if (dronesSheet && dronesSheet.complete && dronesSheet.naturalWidth > 0) {
      ctx.drawImage(dronesSheet, col * 256, row * 256, 256, 256, 0, 0, size, size);
      this.removeBackgroundFromCanvas(out, 58);
      this.bakedDroneSprites.set(cacheKey, out);
      if (!this.bakedDataUrls.has(droneId)) {
        try {
          this.bakedDataUrls.set(droneId, out.toDataURL('image/png'));
        } catch {}
      }
      return out;
    }

    const baseDrone = this.transparentCanvases.get('ally_drone');
    if (!baseDrone) return null;
    ctx.drawImage(baseDrone, 0, 0, size, size);
    return out;
  }

  public getShipDataUrl(ship: ShipClassConfig): string {
    if (this.bakedDataUrls.has(ship.id)) {
      return this.bakedDataUrls.get(ship.id)!;
    }
    // Trigger background removal bake if sprite is ready
    this.getShip3DSprite(ship);
    if (this.bakedDataUrls.has(ship.id)) {
      return this.bakedDataUrls.get(ship.id)!;
    }
    return ship.spriteAssetPath || getIndividualShipSpriteUrl(ship.id);
  }

  public getEquipmentDataUrl(item: EquipmentItem): string {
    if (this.bakedDataUrls.has(item.id)) {
      return this.bakedDataUrls.get(item.id)!;
    }
    const url = getIndividualEquipmentSpriteUrl(item);
    const indImg = this.getOrLoadIndividualPng(item.id, url);
    if (indImg) {
      const c = document.createElement('canvas');
      c.width = 128;
      c.height = 128;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.drawImage(indImg, 0, 0, 128, 128);
        this.removeBackgroundFromCanvas(c, 58);
        try {
          const dataUrl = c.toDataURL('image/png');
          this.bakedDataUrls.set(item.id, dataUrl);
          return dataUrl;
        } catch {}
      }
    }
    return url;
  }

  public getSprite(key: string): CanvasImageSource | null {
    if (this.transparentCanvases.has(key)) {
      return this.transparentCanvases.get(key)!;
    }
    if (this.proceduralSprites.has(key)) {
      return this.proceduralSprites.get(key)!;
    }
    if (this.rawImages.has(key)) {
      const raw = this.rawImages.get(key)!;
      if (raw.complete && raw.naturalWidth > 0) return raw;
    }
    return null;
  }

  public getRawImage(key: string): HTMLImageElement | null {
    return this.rawImages.get(key) || null;
  }

  public drawSprite(
    ctx: CanvasRenderingContext2D,
    spriteKey: string,
    x: number,
    y: number,
    width: number,
    height: number,
    angle: number = 0,
    alpha: number = 1.0
  ): boolean {
    const sprite = this.getSprite(spriteKey);
    if (!sprite) return false;

    ctx.save();
    ctx.translate(x, y);
    if (angle !== 0) {
      ctx.rotate(angle);
    }
    if (alpha < 1.0) {
      ctx.globalAlpha = Math.max(0, Math.min(1, ctx.globalAlpha * alpha));
    }

    ctx.drawImage(sprite, -width / 2, -height / 2, width, height);
    ctx.restore();
    return true;
  }
}

export const assetManager = new AssetManager();
