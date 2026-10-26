/**
 * Infinite Paragon Constellation Tree, Singularity Transmutation Prestige System,
 * and Endless Void Rift Mutator Engine.
 */

export type ParagonBranch = 'vanguard' | 'bulwark' | 'synthesizer';

export interface ParagonNodeDef {
  id: string;
  branch: ParagonBranch;
  name: string;
  subtitle: string;
  description: string;
  icon: 'sword' | 'crosshair' | 'zap' | 'flame' | 'shield' | 'heart' | 'cpu' | 'refresh' | 'coins' | 'sparkles' | 'magnet' | 'infinity';
  baseCost: number;
  costScaling: number;
  bonusPerLevel: number;
  unit: '%' | 'flat';
  // Coordinates inside the branch constellation (0-100%, 0-100%)
  x: number;
  y: number;
  parentNodeId?: string;
}

export interface VoidRiftMutator {
  id: 'solar_flare' | 'berserk_swarm' | 'gravity_well' | 'aegis_armada' | 'quantum_jackpot';
  name: string;
  description: string;
  rewardBonusPct: number;
  accentColor: string;
}

export const VOID_RIFT_MUTATORS: VoidRiftMutator[] = [
  {
    id: 'solar_flare',
    name: 'CORONAL MASS EJECTION',
    description: 'Periodic solar plasma storms sweep the rift, boosting weapon crit damage by +45% while increasing projectile velocity.',
    rewardBonusPct: 35,
    accentColor: '#f59e0b',
  },
  {
    id: 'berserk_swarm',
    name: 'HYPER-SWARM OVERDRIVE',
    description: 'Hostile fleet engines and fire-rates surge by +30%, but every enemy ship drops +50% more Scrap and Paragon XP.',
    rewardBonusPct: 50,
    accentColor: '#f43f5e',
  },
  {
    id: 'gravity_well',
    name: 'SINGULARITY SHEAR',
    description: 'Micro-singularities pull loose Scrap and Dark Matter directly toward your hull and amplify explosive AoE radius by +40%.',
    rewardBonusPct: 30,
    accentColor: '#a855f7',
  },
  {
    id: 'aegis_armada',
    name: 'FORTIFIED PHALANX',
    description: 'Enemy flagships deploy reinforced energy barriers (+35% HP), guaranteeing bonus Dark Matter & Quantum Shard drops on kill.',
    rewardBonusPct: 60,
    accentColor: '#00f2fe',
  },
  {
    id: 'quantum_jackpot',
    name: 'AETHERIC CONVERGENCE',
    description: 'High-density anomaly sector! Elite and Boss spawn rates increased, with +75% Scrap & Dark Matter yield.',
    rewardBonusPct: 75,
    accentColor: '#10b981',
  },
];

export const PARAGON_CONSTELLATION_NODES: ParagonNodeDef[] = [
  // --- BRANCH 1: OFFENSIVE VANGUARD (Crimson / Amber) ---
  {
    id: 'van_kinetic_amp',
    branch: 'vanguard',
    name: 'PHOTON OVERCHARGE',
    subtitle: 'Core Weapon Output',
    description: 'Increases all Primary Weapon, Missile, and Wingman Drone damage output.',
    icon: 'sword',
    baseCost: 1,
    costScaling: 1.25,
    bonusPerLevel: 8,
    unit: '%',
    x: 50,
    y: 82,
  },
  {
    id: 'van_crit_matrix',
    branch: 'vanguard',
    name: 'LETHAL PRECISION',
    subtitle: 'Critical Strike Multiplier',
    description: 'Amplifies Critical Hit Damage multiplier and weakpoint armor penetration.',
    icon: 'crosshair',
    baseCost: 2,
    costScaling: 1.35,
    bonusPerLevel: 12,
    unit: '%',
    x: 26,
    y: 54,
    parentNodeId: 'van_kinetic_amp',
  },
  {
    id: 'van_ordnance_cycle',
    branch: 'vanguard',
    name: 'CYCLIC ACCELERATOR',
    subtitle: 'Fire Rate & Missile Reload',
    description: 'Accelerates primary turret cycling and reduces secondary missile reload cooldowns.',
    icon: 'zap',
    baseCost: 2,
    costScaling: 1.35,
    bonusPerLevel: 5,
    unit: '%',
    x: 74,
    y: 54,
    parentNodeId: 'van_kinetic_amp',
  },
  {
    id: 'van_boss_slayer',
    branch: 'vanguard',
    name: 'TITANBANE PROTOCOL',
    subtitle: 'Boss & Dreadnought Damage',
    description: 'Inflicts massive bonus damage against Sector Bosses, Dungeon Anomalies, and World Raid Titans.',
    icon: 'flame',
    baseCost: 4,
    costScaling: 1.45,
    bonusPerLevel: 15,
    unit: '%',
    x: 50,
    y: 22,
    parentNodeId: 'van_crit_matrix',
  },

  // --- BRANCH 2: AEGIS BULWARK (Cyan / Emerald) ---
  {
    id: 'bul_shield_cap',
    branch: 'bulwark',
    name: 'AETHERIC CAPACITOR',
    subtitle: 'Hull & Shield Integrity',
    description: 'Expands maximum Hull Integrity and Energy Shield Core capacity.',
    icon: 'shield',
    baseCost: 1,
    costScaling: 1.25,
    bonusPerLevel: 10,
    unit: '%',
    x: 50,
    y: 82,
  },
  {
    id: 'bul_nano_regen',
    branch: 'bulwark',
    name: 'NANITE HARMONICS',
    subtitle: 'Shield & Hull Regeneration',
    description: 'Boosts passive energy shield recharge rate and combat nanite hull repair.',
    icon: 'heart',
    baseCost: 2,
    costScaling: 1.35,
    bonusPerLevel: 9,
    unit: '%',
    x: 26,
    y: 54,
    parentNodeId: 'bul_shield_cap',
  },
  {
    id: 'bul_thruster_flux',
    branch: 'bulwark',
    name: 'VECTOR HYPERDRIVE',
    subtitle: 'Evasion & Thruster Velocity',
    description: 'Enhances ship maneuverability, top speed, and phase-dash cooldown recovery.',
    icon: 'cpu',
    baseCost: 2,
    costScaling: 1.35,
    bonusPerLevel: 4,
    unit: '%',
    x: 74,
    y: 54,
    parentNodeId: 'bul_shield_cap',
  },
  {
    id: 'bul_reactive_nova',
    branch: 'bulwark',
    name: 'IMMORTAL BASTION',
    subtitle: 'Damage Mitigation Matrix',
    description: 'Reduces all incoming projectile and collision damage through phase-harmonic deflection.',
    icon: 'refresh',
    baseCost: 4,
    costScaling: 1.45,
    bonusPerLevel: 4,
    unit: '%',
    x: 50,
    y: 22,
    parentNodeId: 'bul_nano_regen',
  },

  // --- BRANCH 3: QUANTUM SYNTHESIZER (Purple / Gold) ---
  {
    id: 'syn_scrap_yield',
    branch: 'synthesizer',
    name: 'MATTER EXTRACTOR',
    subtitle: 'Scrap Salvage Multiplier',
    description: 'Increases Scrap yielded from all destroyed enemy vessels and asteroid caches.',
    icon: 'coins',
    baseCost: 1,
    costScaling: 1.25,
    bonusPerLevel: 12,
    unit: '%',
    x: 50,
    y: 82,
  },
  {
    id: 'syn_dark_matter',
    branch: 'synthesizer',
    name: 'DARK MATTER SIPHON',
    subtitle: 'Dark Matter & Shard Yield',
    description: 'Amplifies Dark Matter and Quantum Shard synthesis from Elite & Boss kills.',
    icon: 'sparkles',
    baseCost: 2,
    costScaling: 1.35,
    bonusPerLevel: 10,
    unit: '%',
    x: 26,
    y: 54,
    parentNodeId: 'syn_scrap_yield',
  },
  {
    id: 'syn_grav_magnet',
    branch: 'synthesizer',
    name: 'GRAVITON TRACTOR',
    subtitle: 'Loot Vacuum & XP Gain',
    description: 'Expands cargo tractor beam radius and accelerates Paragon Ascension XP gain.',
    icon: 'magnet',
    baseCost: 2,
    costScaling: 1.35,
    bonusPerLevel: 15,
    unit: '%',
    x: 74,
    y: 54,
    parentNodeId: 'syn_scrap_yield',
  },
  {
    id: 'syn_singularity_echo',
    branch: 'synthesizer',
    name: 'SINGULARITY RESONANCE',
    subtitle: 'Global Prestige Synergy',
    description: 'Multiplies the effectiveness of each Singularity Prestige Rank by an additional compound factor.',
    icon: 'infinity',
    baseCost: 5,
    costScaling: 1.5,
    bonusPerLevel: 10,
    unit: '%',
    x: 50,
    y: 22,
    parentNodeId: 'syn_dark_matter',
  },
];

export interface SingularityRelicDef {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  bonusPerLevelPct: number;
  baseFragmentCost: number;
}

export const SINGULARITY_RELIC_CARDS: SingularityRelicDef[] = [
  {
    id: 'relic_aegis_reactor',
    name: 'AEGIS-SINGULARITÄTSKERN',
    subtitle: 'Schild & Hüllen-Kapazität',
    description: 'Erhöht dauerhaft deine maximale Schild- und Hüllen-Kapazität um +25% pro Relikt-Rang.',
    bonusPerLevelPct: 25,
    baseFragmentCost: 1,
  },
  {
    id: 'relic_chrono_coil',
    name: 'CHRONO-TACHYON-SPULE',
    subtitle: 'Gesamtschaden & Feuerrate',
    description: 'Verstärkt dauerhaft allen Waffenschaden um +20% und die Feuerrate um +8% pro Relikt-Rang.',
    bonusPerLevelPct: 20,
    baseFragmentCost: 1,
  },
  {
    id: 'relic_void_harvester',
    name: 'VOID-MATERIE-ERNTER',
    subtitle: 'Scrap- & Dark-Matter-Ertrag',
    description: 'Steigert dauerhaft alle Scrap- und Dark-Matter-Beute aus Wellen und AFK-Salvage um +30% pro Rang.',
    bonusPerLevelPct: 30,
    baseFragmentCost: 1,
  },
  {
    id: 'relic_titan_breaker',
    name: 'TITANEN-SPALTER-MATRIX',
    subtitle: 'Boss-Schaden & Schildbruch',
    description: 'Erhöht den Schaden gegen Mini-Bosse & Sektor-Bosse um +35% pro Rang.',
    bonusPerLevelPct: 35,
    baseFragmentCost: 2,
  },
];

export interface ParagonState {
  prestigeRank: number;
  quantumShards: number;
  totalShardsEarned: number;
  paragonLevel: number;
  paragonXp: number;
  nodeLevels: Record<string, number>;
  highestEndlessDepth: number;
  currentEndlessDepth: number;
  activeMutatorId: VoidRiftMutator['id'];
  currentRunWavesCleared: number;
  currentRunHighestSector: number;
  relicFragments: number;
  relicLevels: Record<string, number>;
}

export interface ComputedParagonBonuses {
  allDamageMult: number; // e.g., 1.35 = +35% all damage
  critDamageBonusPct: number; // e.g., 36 = +36% crit damage
  fireRateMult: number; // e.g., 1.15 = +15% faster fire rate
  bossDamageMult: number; // e.g., 1.45 = +45% boss damage
  hullAndShieldMult: number; // e.g., 1.30 = +30% hull & shield
  regenMult: number; // e.g., 1.27 = +27% shield regen
  speedMult: number; // e.g., 1.12 = +12% movement speed
  damageReductionPct: number; // capped at 65%
  scrapYieldMult: number; // e.g., 1.50 = +50% scrap
  darkMatterYieldMult: number; // e.g., 1.30 = +30% dark matter
  magnetRadiusMult: number; // e.g., 1.45 = +45% pickup radius
}

export interface EndlessRiftScalingProfile {
  depth: number;
  wave: number;
  enemyHpMult: number;
  enemyShieldMult: number;
  enemyDamageMult: number;
  enemySpeedMult: number;
  enemyFireRateMult: number;
  spawnIntervalMult: number;
  packSizeBonus: number;
  eliteSpawnChance: number;
  paragonXpMult: number;
  lootYieldMult: number;
  shardDropChance: number;
}

const STORAGE_KEY = 'aether_paragon_state_v1';

class ParagonManager {
  private state: ParagonState;

  constructor() {
    this.state = this.loadState();
  }

  private getDefaultState(): ParagonState {
    return {
      prestigeRank: 0,
      quantumShards: 5, // Starter Quantum Shards so players can immediately test the Constellation Tree!
      totalShardsEarned: 5,
      paragonLevel: 1,
      paragonXp: 0,
      nodeLevels: {},
      highestEndlessDepth: 1,
      currentEndlessDepth: 1,
      activeMutatorId: 'solar_flare',
      currentRunWavesCleared: 0,
      currentRunHighestSector: 1,
      relicFragments: 2,
      relicLevels: {},
    };
  }

  private loadState(): ParagonState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...this.getDefaultState(),
          ...parsed,
          nodeLevels: parsed.nodeLevels || {},
          relicLevels: parsed.relicLevels || {},
          currentRunWavesCleared:
            typeof parsed.currentRunWavesCleared === 'number' ? parsed.currentRunWavesCleared : 0,
          currentRunHighestSector:
            typeof parsed.currentRunHighestSector === 'number' ? parsed.currentRunHighestSector : 1,
          relicFragments:
            typeof parsed.relicFragments === 'number' ? parsed.relicFragments : 2,
        };
      }
    } catch (e) {
      // ignore storage errors
    }
    return this.getDefaultState();
  }

  private saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {}
  }

  public getState(): ParagonState {
    return {
      ...this.state,
      nodeLevels: { ...this.state.nodeLevels },
      relicLevels: { ...this.state.relicLevels },
    };
  }

  public recordWaveCleared(sector: number) {
    this.state.currentRunWavesCleared += 1;
    if (sector > this.state.currentRunHighestSector) {
      this.state.currentRunHighestSector = sector;
    }
    this.saveState();
  }

  public getRelicLevel(relicId: string): number {
    return this.state.relicLevels[relicId] || 0;
  }

  public getRelicUpgradeCost(relicId: string): number {
    const def = SINGULARITY_RELIC_CARDS.find((r) => r.id === relicId);
    if (!def) return 99;
    const lvl = this.getRelicLevel(relicId);
    return def.baseFragmentCost + lvl;
  }

  public upgradeRelic(relicId: string): boolean {
    const cost = this.getRelicUpgradeCost(relicId);
    if (this.state.relicFragments < cost) return false;
    this.state.relicFragments -= cost;
    this.state.relicLevels[relicId] = (this.state.relicLevels[relicId] || 0) + 1;
    this.saveState();
    return true;
  }

  public getNodeLevel(nodeId: string): number {
    return this.state.nodeLevels[nodeId] || 0;
  }

  public getNodeUpgradeCost(nodeId: string): number {
    const def = PARAGON_CONSTELLATION_NODES.find((n) => n.id === nodeId);
    if (!def) return 999;
    const lvl = this.getNodeLevel(nodeId);
    return Math.max(1, Math.floor(def.baseCost * Math.pow(def.costScaling, lvl)));
  }

  public canUpgradeNode(nodeId: string): { allowed: boolean; reason?: string } {
    const def = PARAGON_CONSTELLATION_NODES.find((n) => n.id === nodeId);
    if (!def) return { allowed: false, reason: 'Invalid Node' };

    if (def.parentNodeId && this.getNodeLevel(def.parentNodeId) < 1) {
      const parentDef = PARAGON_CONSTELLATION_NODES.find((n) => n.id === def.parentNodeId);
      return {
        allowed: false,
        reason: `Requires ${parentDef?.name || 'Parent Node'} Lv.1`,
      };
    }

    const cost = this.getNodeUpgradeCost(nodeId);
    if (this.state.quantumShards < cost) {
      return { allowed: false, reason: `Requires ${cost} Quantum Shards` };
    }

    return { allowed: true };
  }

  public upgradeNode(nodeId: string): boolean {
    const check = this.canUpgradeNode(nodeId);
    if (!check.allowed) return false;

    const cost = this.getNodeUpgradeCost(nodeId);
    this.state.quantumShards -= cost;
    this.state.nodeLevels[nodeId] = (this.state.nodeLevels[nodeId] || 0) + 1;
    this.saveState();
    return true;
  }

  public getXpRequiredForNextLevel(): number {
    return Math.floor(250 * Math.pow(1.18, this.state.paragonLevel - 1));
  }

  /**
   * Computes deterministic, purely exponential difficulty & reward multipliers for Endless Void Rifts.
   */
  public getEndlessRiftScaling(
    depth: number = this.state.currentEndlessDepth,
    wave: number = 1
  ): EndlessRiftScalingProfile {
    const d = Math.max(1, depth);
    const w = Math.max(1, wave);
    const mutator = this.getActiveMutator();

    const depthHpExp = Math.pow(1.42, d - 1);
    const waveHpExp = Math.pow(1.14, w - 1);
    const mutatorHpMult = mutator.id === 'aegis_armada' ? 1.35 : 1.0;

    const enemyHpMult = depthHpExp * waveHpExp * mutatorHpMult;
    const enemyShieldMult =
      Math.pow(1.44, d - 1) *
      Math.pow(1.15, w - 1) *
      (mutator.id === 'aegis_armada' ? 1.5 : 1.0);
    const enemyDamageMult = Math.pow(1.24, d - 1) * Math.pow(1.09, w - 1);

    const berserkMult = mutator.id === 'berserk_swarm' ? 1.2 : 1.0;
    const enemySpeedMult =
      (1 + (1 - Math.pow(0.95, d - 1)) * 1.2 + Math.min(0.35, (w - 1) * 0.015)) * berserkMult;
    const enemyFireRateMult =
      (1 + (1 - Math.pow(0.94, d - 1)) * 1.35 + Math.min(0.4, (w - 1) * 0.018)) * berserkMult;

    const spawnIntervalMult = Math.max(0.28, Math.pow(0.93, d - 1) * Math.pow(0.98, w - 1));
    const packSizeBonus = Math.min(16, Math.floor((d - 1) * 0.85) + Math.floor((w - 1) / 2));

    const baseEliteChance = 0.25 + (1 - Math.pow(0.89, d - 1)) * 0.65;
    const eliteSpawnChance = Math.min(
      0.95,
      baseEliteChance + (mutator.id === 'quantum_jackpot' ? 0.2 : 0)
    );

    const paragonXpMult =
      Math.pow(1.32, d - 1) *
      Math.pow(1.11, w - 1) *
      (mutator.id === 'berserk_swarm' ? 1.5 : 1.0) *
      (1 + mutator.rewardBonusPct / 200);

    const lootYieldMult =
      Math.pow(1.35, d - 1) *
      Math.pow(1.12, w - 1) *
      (1 + mutator.rewardBonusPct / 100);

    const shardDropChance = Math.min(
      0.95,
      0.3 + (d - 1) * 0.04 + (mutator.id === 'aegis_armada' || mutator.id === 'quantum_jackpot' ? 0.18 : 0)
    );

    return {
      depth: d,
      wave: w,
      enemyHpMult,
      enemyShieldMult,
      enemyDamageMult,
      enemySpeedMult,
      enemyFireRateMult,
      spawnIntervalMult,
      packSizeBonus,
      eliteSpawnChance,
      paragonXpMult,
      lootYieldMult,
      shardDropChance,
    };
  }

  /**
   * Grants Paragon XP during combat; every Paragon level-up awards scaling Quantum Shards!
   */
  public addParagonXp(amount: number): { leveledUp: boolean; shardsAwarded: number; newLevel: number } {
    const bonuses = this.getComputedBonuses();
    const scaledXp = Math.ceil(amount * bonuses.magnetRadiusMult);
    this.state.paragonXp += scaledXp;

    let leveledUp = false;
    let shardsAwarded = 0;

    while (this.state.paragonXp >= this.getXpRequiredForNextLevel()) {
      this.state.paragonXp -= this.getXpRequiredForNextLevel();
      this.state.paragonLevel += 1;
      const reward = Math.floor(2 + this.state.paragonLevel * 0.4 + Math.pow(1.09, Math.min(60, this.state.paragonLevel)));
      this.state.quantumShards += reward;
      this.state.totalShardsEarned += reward;
      shardsAwarded += reward;
      leveledUp = true;
    }

    this.saveState();
    return { leveledUp, shardsAwarded, newLevel: this.state.paragonLevel };
  }

  public addQuantumShards(amount: number) {
    if (amount <= 0) return;
    this.state.quantumShards += amount;
    this.state.totalShardsEarned += amount;
    this.saveState();
  }

  public spendQuantumShards(amount: number): boolean {
    if (amount <= 0) return true;
    if (this.state.quantumShards < amount) return false;
    this.state.quantumShards -= amount;
    this.saveState();
    return true;
  }

  public getPrestigeRequirementStatus(currentScrap: number = 0): {
    canPrestige: boolean;
    wavesCleared: number;
    wavesRequired: number;
    currentRunSector: number;
    shardsReward: number;
    fragmentsReward: number;
  } {
    const wavesRequired = 10;
    const wavesCleared = this.state.currentRunWavesCleared;
    const currentRunSector = this.state.currentRunHighestSector;
    const canPrestige = wavesCleared >= wavesRequired || currentRunSector >= 2;
    const shardsReward = this.calculatePrestigeReward(currentRunSector, currentScrap);
    const fragmentsReward = canPrestige ? Math.max(1, Math.floor(wavesCleared / 10) + (currentRunSector - 1)) : 0;

    return {
      canPrestige,
      wavesCleared,
      wavesRequired,
      currentRunSector,
      shardsReward,
      fragmentsReward,
    };
  }

  /**
   * Calculates how many Quantum Shards a player will receive if they trigger Singularity Transmutation (Prestige) now.
   * Requires clearing at least 10 waves (or reaching Sector 2) IN THE CURRENT RUN so Prestige cannot be spammed!
   */
  public calculatePrestigeReward(_highestSectorReached: number, currentScrap: number): number {
    const runWaves = this.state.currentRunWavesCleared;
    const runSector = this.state.currentRunHighestSector;

    if (runWaves < 10 && runSector < 2) {
      return 0;
    }

    const sectorShards = Math.max(2, (runSector - 1) * 6 + Math.floor(runWaves / 5) * 2);
    const scrapShards = Math.floor(Math.sqrt(Math.max(0, currentScrap) / 150));
    const bonuses = this.getComputedBonuses();
    return Math.max(4, Math.floor((sectorShards + scrapShards) * bonuses.darkMatterYieldMult));
  }

  /**
   * Performs Singularity Transmutation: requires active current-run milestone,
   * awards Quantum Shards + Relic Fragments, and resets current-run wave/sector counters!
   */
  public performSingularityPrestige(highestSectorReached: number, currentScrap: number): number {
    const status = this.getPrestigeRequirementStatus(currentScrap);
    if (!status.canPrestige || status.shardsReward <= 0) return 0;

    const reward = status.shardsReward;
    this.state.prestigeRank += 1;
    this.state.quantumShards += reward;
    this.state.totalShardsEarned += reward;
    this.state.relicFragments += status.fragmentsReward;

    // Reset current run progress so player must play a new run before prestiging again
    this.state.currentRunWavesCleared = 0;
    this.state.currentRunHighestSector = 1;

    this.saveState();
    return reward;
  }

  public getActiveMutator(): VoidRiftMutator {
    return (
      VOID_RIFT_MUTATORS.find((m) => m.id === this.state.activeMutatorId) ||
      VOID_RIFT_MUTATORS[0]
    );
  }

  public setActiveMutator(id: VoidRiftMutator['id']) {
    this.state.activeMutatorId = id;
    this.saveState();
  }

  public setEndlessDepth(depth: number) {
    this.state.currentEndlessDepth = Math.max(1, Math.min(this.state.highestEndlessDepth, depth));
    this.saveState();
  }

  public advanceEndlessDepth(): { newDepth: number; bonusShards: number } {
    const completedDepth = this.state.currentEndlessDepth;
    const bonuses = this.getComputedBonuses();
    const rawShards = (3 + completedDepth * 2.0) * Math.pow(1.18, completedDepth - 1);
    const bonusShards = Math.max(3, Math.floor(rawShards * bonuses.darkMatterYieldMult));
    this.state.quantumShards += bonusShards;
    this.state.totalShardsEarned += bonusShards;
    this.state.relicFragments += 1;

    this.state.currentEndlessDepth += 1;
    if (this.state.currentEndlessDepth > this.state.highestEndlessDepth) {
      this.state.highestEndlessDepth = this.state.currentEndlessDepth;
    }

    const nextMutatorIdx = this.state.currentEndlessDepth % VOID_RIFT_MUTATORS.length;
    this.state.activeMutatorId = VOID_RIFT_MUTATORS[nextMutatorIdx].id;

    this.saveState();
    return { newDepth: this.state.currentEndlessDepth, bonusShards };
  }

  public getComputedBonuses(): ComputedParagonBonuses {
    const getLv = (id: string) => this.getNodeLevel(id);
    const getRelic = (id: string) => this.getRelicLevel(id);

    // Prestige Rank compound multiplier (+15% all damage & +15% scrap yield per rank, boosted by syn_singularity_echo)
    const prestigeSynergy = 1 + getLv('syn_singularity_echo') * 0.1;
    const prestigeBonusPct = this.state.prestigeRank * 15 * prestigeSynergy;

    // Singularity Relic Card multipliers
    const relicDamagePct = getRelic('relic_chrono_coil') * 20;
    const relicFireRatePct = getRelic('relic_chrono_coil') * 8;
    const relicHullShieldPct = getRelic('relic_aegis_reactor') * 25;
    const relicHarvestPct = getRelic('relic_void_harvester') * 30;
    const relicBossPct = getRelic('relic_titan_breaker') * 35;

    const allDamagePct = getLv('van_kinetic_amp') * 8 + prestigeBonusPct + relicDamagePct;
    const critDamageBonusPct = getLv('van_crit_matrix') * 12;
    const fireRatePct = Math.min(85, getLv('van_ordnance_cycle') * 5 + relicFireRatePct);
    const bossDamagePct = getLv('van_boss_slayer') * 15 + relicBossPct;

    const hullAndShieldPct =
      getLv('bul_shield_cap') * 10 + this.state.prestigeRank * 8 + relicHullShieldPct;
    const regenPct = getLv('bul_nano_regen') * 9 + getRelic('relic_aegis_reactor') * 10;
    const speedPct = Math.min(45, getLv('bul_thruster_flux') * 4);
    const damageReductionPct = Math.min(60, getLv('bul_reactive_nova') * 4);

    const scrapYieldPct = getLv('syn_scrap_yield') * 12 + prestigeBonusPct + relicHarvestPct;
    const darkMatterYieldPct =
      getLv('syn_dark_matter') * 10 + this.state.prestigeRank * 10 + relicHarvestPct;
    const magnetRadiusPct = getLv('syn_grav_magnet') * 15;

    return {
      allDamageMult: 1 + allDamagePct / 100,
      critDamageBonusPct,
      fireRateMult: 1 + fireRatePct / 100,
      bossDamageMult: 1 + bossDamagePct / 100,
      hullAndShieldMult: 1 + hullAndShieldPct / 100,
      regenMult: 1 + regenPct / 100,
      speedMult: 1 + speedPct / 100,
      damageReductionPct,
      scrapYieldMult: 1 + scrapYieldPct / 100,
      darkMatterYieldMult: 1 + darkMatterYieldPct / 100,
      magnetRadiusMult: 1 + magnetRadiusPct / 100,
    };
  }
}

export const paragonManager = new ParagonManager();

