import { CosmeticItem, EquippedCosmetics } from './types.ts';

export const COSMETIC_CATALOGUE: CosmeticItem[] = [
  // ==========================================
  // HULL SKINS
  // ==========================================
  {
    id: 'skin-default',
    name: 'Standard Fleet Alloy',
    category: 'skin',
    rarity: 'standard',
    costScrap: 0,
    costDarkMatter: 0,
    description: 'Factory standard hardened titanium alloy hull configuration.',
    perkText: 'Standard flight profile',
    primaryColor: '#00f2fe',
    accentColor: '#0284c7',
  },
  {
    id: 'skin-obsidian',
    name: 'Void Obsidian Stealth',
    category: 'skin',
    rarity: 'rare',
    costScrap: 600,
    costDarkMatter: 15,
    description: 'Matte obsidian radar-absorbent hull with low-signature dark purple lighting.',
    perkText: '+3% Evasive Maneuver Speed',
    primaryColor: '#1e1b4b',
    accentColor: '#a855f7',
  },
  {
    id: 'skin-aurum',
    name: 'Solar Aurum Sovereign',
    category: 'skin',
    rarity: 'epic',
    costScrap: 1400,
    costDarkMatter: 35,
    description: 'Gleaming celestial gold hull awarded to decorated fleet champions.',
    perkText: '+4% Starlight Scrap Salvage Yield',
    primaryColor: '#fbbf24',
    accentColor: '#f59e0b',
  },
  {
    id: 'skin-crimson',
    name: 'Crimson Vengeance',
    category: 'skin',
    rarity: 'rare',
    costScrap: 750,
    costDarkMatter: 20,
    description: 'Aggressive arterial red war plating with high-contrast hazard chevron markings.',
    perkText: '+3% Critical Strike Multiplier',
    primaryColor: '#ef4444',
    accentColor: '#991b1b',
  },
  {
    id: 'skin-frostbite',
    name: 'Frostbite Titanium',
    category: 'skin',
    rarity: 'epic',
    costScrap: 1200,
    costDarkMatter: 30,
    description: 'Cryogenic ceramic plating with arctic crystalline cyan thermal baffles.',
    perkText: '+4% Shield Recharge Rate',
    primaryColor: '#e0f2fe',
    accentColor: '#06b6d4',
  },
  {
    id: 'skin-cyber',
    name: 'Cyberpunk Neon Matrix',
    category: 'skin',
    rarity: 'legendary',
    costScrap: 2500,
    costDarkMatter: 60,
    description: 'Hyper-responsive illuminated hull with pulsating electro-luminescent circuit pathways.',
    perkText: '+5% Deflector Shield Capacity',
    primaryColor: '#ec4899',
    accentColor: '#8b5cf6',
  },

  // ==========================================
  // CUSTOM LASER COLORS & FX
  // ==========================================
  {
    id: 'laser-default',
    name: 'Classic Ion Beam',
    category: 'laser',
    rarity: 'standard',
    costScrap: 0,
    costDarkMatter: 0,
    description: 'Standard military issue charged ion particle blaster.',
    perkText: 'Standard projectile profile',
    primaryColor: '#38bdf8',
    accentColor: '#0284c7',
  },
  {
    id: 'laser-emerald',
    name: 'Emerald Plasma Burst',
    category: 'laser',
    rarity: 'rare',
    costScrap: 450,
    costDarkMatter: 10,
    description: 'High-density ionized green plasma discharges.',
    perkText: '+2% Primary Blaster Damage',
    primaryColor: '#10b981',
    accentColor: '#059669',
  },
  {
    id: 'laser-void',
    name: 'Violet Voidfire',
    category: 'laser',
    rarity: 'epic',
    costScrap: 950,
    costDarkMatter: 25,
    description: 'Unstable singularity-charged violet tachyon rays.',
    perkText: '+3% Critical Strike Probability',
    primaryColor: '#c084fc',
    accentColor: '#9333ea',
  },
  {
    id: 'laser-solar',
    name: 'Solar Radiant Lance',
    category: 'laser',
    rarity: 'epic',
    costScrap: 1100,
    costDarkMatter: 28,
    description: 'Blinding white-gold concentrated photon beams.',
    perkText: '+3% Projectile Flight Velocity',
    primaryColor: '#fde047',
    accentColor: '#eab308',
  },
  {
    id: 'laser-crimson',
    name: 'Ruby Incinerator',
    category: 'laser',
    rarity: 'rare',
    costScrap: 500,
    costDarkMatter: 12,
    description: 'Hyper-thermal red laser pulses that scorch armor.',
    perkText: '+2% Firing Rate (RPM)',
    primaryColor: '#f43f5e',
    accentColor: '#e11d48',
  },

  // ==========================================
  // ENGINE EXHAUST TRAILS
  // ==========================================
  {
    id: 'trail-default',
    name: 'Standard Ion Stream',
    category: 'trail',
    rarity: 'standard',
    costScrap: 0,
    costDarkMatter: 0,
    description: 'Conventional blue ion engine discharge.',
    perkText: 'Standard thrust emission',
    primaryColor: '#38bdf8',
    accentColor: '#0284c7',
    trailType: 'spark',
  },
  {
    id: 'trail-ember',
    name: 'Solar Flare Embers',
    category: 'trail',
    rarity: 'rare',
    costScrap: 450,
    costDarkMatter: 12,
    description: 'Turbulent fiery orange and yellow afterburner embers.',
    perkText: '+2% Thruster Velocity',
    primaryColor: '#f97316',
    accentColor: '#eab308',
    trailType: 'ember',
  },
  {
    id: 'trail-warp',
    name: 'Hyperdrive Warp Dust',
    category: 'trail',
    rarity: 'epic',
    costScrap: 900,
    costDarkMatter: 25,
    description: 'Prismatic micro-singularity sparkles trailing the vessel.',
    perkText: '+3% Gravitational Scrap Magnet Radius',
    primaryColor: '#67e8f9',
    accentColor: '#c084fc',
    trailType: 'warp',
  },
  {
    id: 'trail-smoke',
    name: 'Void Nebula Drift',
    category: 'trail',
    rarity: 'rare',
    costScrap: 550,
    costDarkMatter: 15,
    description: 'Ethereal dark violet nebular mist billowing from thruster cowlings.',
    perkText: '+2% Shield Regeneration Delay Reduction',
    primaryColor: '#a855f7',
    accentColor: '#3b0764',
    trailType: 'smoke',
  },
  {
    id: 'trail-matrix',
    name: 'Digital Cyber Bits',
    category: 'trail',
    rarity: 'legendary',
    costScrap: 1600,
    costDarkMatter: 45,
    description: 'Floating neon cyber matrix bits dissolving into the vacuum.',
    perkText: '+4% Idle Nanite Harvester Yield',
    primaryColor: '#06b6d4',
    accentColor: '#3b82f6',
    trailType: 'matrix',
  },

  // ==========================================
  // HANGAR CITADEL RELICS
  // ==========================================
  {
    id: 'hangar-trophy',
    name: 'Celestial Sovereign Star',
    category: 'hangar',
    rarity: 'rare',
    costScrap: 500,
    costDarkMatter: 15,
    description: 'Gilded navigational star relic suspended in your hangar docking bay.',
    perkText: '+2% Mission Score Multiplier',
    primaryColor: '#facc15',
    accentColor: '#ca8a04',
  },
  {
    id: 'hangar-core',
    name: 'Tachyon Reactor Model',
    category: 'hangar',
    rarity: 'epic',
    costScrap: 1200,
    costDarkMatter: 35,
    description: 'Rotating miniaturized tachyon reactor core casting ambient light over the hangar.',
    perkText: '+3% Special Ability Recharge Rate',
    primaryColor: '#38bdf8',
    accentColor: '#6366f1',
  },
  {
    id: 'hangar-dreadnought',
    name: 'Dreadnought Armor Trophy',
    category: 'hangar',
    rarity: 'legendary',
    costScrap: 2200,
    costDarkMatter: 55,
    description: 'Vanquished Capital Dreadnought bow insignia mounted on the hangar bulkhead.',
    perkText: '+5% Damage Dealt to Capital Bosses',
    primaryColor: '#ef4444',
    accentColor: '#7f1d1d',
  },
];

const DEFAULT_EQUIPPED: EquippedCosmetics = {
  skinId: 'skin-default',
  laserColor: 'laser-default',
  trailEffect: 'trail-default',
  hangarDeco: 'hangar-trophy',
};

export class CosmeticsManager {
  private ownedIds: Set<string> = new Set(['skin-default', 'laser-default', 'trail-default']);
  public equipped: EquippedCosmetics = { ...DEFAULT_EQUIPPED };

  constructor() {
    this.load();
  }

  public isOwned(itemId: string): boolean {
    return this.ownedIds.has(itemId);
  }

  public isEquipped(item: CosmeticItem): boolean {
    if (item.category === 'skin') return this.equipped.skinId === item.id;
    if (item.category === 'laser') return this.equipped.laserColor === item.id;
    if (item.category === 'trail') return this.equipped.trailEffect === item.id;
    if (item.category === 'hangar') return this.equipped.hangarDeco === item.id;
    return false;
  }

  public equip(item: CosmeticItem) {
    if (!this.isOwned(item.id)) return;
    if (item.category === 'skin') this.equipped.skinId = item.id;
    if (item.category === 'laser') this.equipped.laserColor = item.id;
    if (item.category === 'trail') this.equipped.trailEffect = item.id;
    if (item.category === 'hangar') this.equipped.hangarDeco = item.id;
    this.save();
  }

  public buyItem(item: CosmeticItem, availableScrap: number, availableDarkMatter: number): boolean {
    if (this.isOwned(item.id)) return true;
    if (availableScrap >= item.costScrap && availableDarkMatter >= item.costDarkMatter) {
      this.ownedIds.add(item.id);
      this.equip(item);
      this.save();
      return true;
    }
    return false;
  }

  public getEquippedSkinItem(): CosmeticItem {
    return COSMETIC_CATALOGUE.find((c) => c.id === this.equipped.skinId) || COSMETIC_CATALOGUE[0];
  }

  public getEquippedLaserItem(): CosmeticItem {
    return COSMETIC_CATALOGUE.find((c) => c.id === this.equipped.laserColor) || COSMETIC_CATALOGUE[6];
  }

  public getEquippedTrailItem(): CosmeticItem {
    return COSMETIC_CATALOGUE.find((c) => c.id === this.equipped.trailEffect) || COSMETIC_CATALOGUE[11];
  }

  public save() {
    try {
      localStorage.setItem('aether_owned_cosmetics', JSON.stringify(Array.from(this.ownedIds)));
      localStorage.setItem('aether_equipped_cosmetics', JSON.stringify(this.equipped));
    } catch (e) {}
  }

  public load() {
    try {
      const owned = localStorage.getItem('aether_owned_cosmetics');
      if (owned) {
        const arr = JSON.parse(owned);
        if (Array.isArray(arr)) {
          this.ownedIds = new Set(arr);
        }
      }
      const eq = localStorage.getItem('aether_equipped_cosmetics');
      if (eq) {
        this.equipped = { ...DEFAULT_EQUIPPED, ...JSON.parse(eq) };
      }
    } catch (e) {}
  }
}

export const cosmetics = new CosmeticsManager();
