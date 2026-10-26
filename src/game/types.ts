export type ShipClassId = string;

export interface ShipUnlockRequirement {
  unlockedByDefault: boolean;
  prestigeRequired: number;
  sectorRequired: number;
  costScrap: number;
  costDarkMatter: number;
  costQuantumShards: number;
}

export interface ShipSlotConfig {
  lasers: number;
  generators: number;
  drones: number;
  missiles: number;
}

export interface ShipVisualAssetConfig {
  chassisType: number; // 0..9 (10 generation archetypes)
  wingStyle: number; // 0..4 (5 intra-generation wing variants)
  engineCount: number; // 1..7 thruster nozzles
  turretCount: number; // 1..12 visible hardpoint mounts
  coreGlowColor: string;
  trimColor: string;
  finSweep: number; // -1..1 wing sweep geometry
  hullScale: number; // 0.95..1.45 size progression
}

export interface ShipClassConfig {
  id: ShipClassId;
  tier: number; // 1..50
  generation: number; // 1..10
  generationName: string;
  name: string;
  role: string;
  tagline: string;
  hullMax: number;
  shieldMax: number;
  baseDps: number;
  baseDamage: number;
  speed: number;
  slots: ShipSlotConfig;
  specialName: string;
  specialDescription: string;
  specialCooldown: number; // in seconds
  specialAbilityType: 'overdrive' | 'aegis' | 'emp_nova' | 'orbital_lance' | 'singularity_storm';
  primaryColor: string;
  engineGlow: string;
  bulletColor: string;
  spriteUrl: string;
  visualAsset: ShipVisualAssetConfig;
  unlockRequirement: ShipUnlockRequirement;
}

// -------------------------------------------------------------
// MODULAR HARDPOINT EQUIPMENT SYSTEM (20 LASERS, 20 GENERATORS, 20 DRONES)
// -------------------------------------------------------------
export type PrimaryWeaponId = string;
export type MissileWeaponId = string;
export type ShieldCoreId = string;
export type DroneTypeId = string;

export interface ShipEquipmentLoadout {
  primaryWeapon: PrimaryWeaponId;
  missileWeapon: MissileWeaponId;
  shieldCore: ShieldCoreId;
  droneType: DroneTypeId;
  laserSlots: string[];
  generatorSlots: string[];
  droneSlots: string[];
  missileSlots: string[];
}

export interface EquipmentItem {
  id: string;
  tier: number; // 1..20
  name: string;
  category: 'weapon' | 'missile' | 'shield' | 'drone';
  desc: string;
  costScrap: number;
  costDarkMatter: number;
  costQuantumShards: number;
  prestigeRequired: number;
  sectorRequired: number;
  statsText: string;
  iconType: string;
  color: string;
  secondaryColor: string;
  visualPattern: 'pulse' | 'twin_plasma' | 'gatling' | 'lance' | 'flak' | 'helix' | 'prism' | 'void_arc' | 'singularity' | 'omega';
  // Weapon numeric stats
  damageMult?: number;
  fireRateMult?: number;
  projectileCount?: number;
  pierceCount?: number;
  blastRadius?: number;
  critBonus?: number;
  // Shield generator numeric stats
  shieldBonus?: number;
  shieldRegenBonus?: number;
  damageReductionPct?: number;
  reflectChance?: number;
  // Drone numeric stats
  droneDamage?: number;
  droneFireRate?: number;
  droneRole?: 'striker' | 'siphon' | 'nanite' | 'orbital' | 'omni';
}

// -------------------------------------------------------------
// STARGATE SECTOR WAYPOINTS & VOID DUNGEONS
// -------------------------------------------------------------
export interface StargateSector {
  sectorNumber: number;
  name: string;
  description: string;
  hazardName: string;
  hazardColor: string;
  recommendedDps: number;
}

export interface VoidDungeon {
  id: string;
  name: string;
  sector: number;
  sectorOverride?: number;
  description: string;
  difficulty: 'normal' | 'heroic' | 'mythic';
  wavesCount: number;
  rewardScrap: number;
  rewardDarkMatter: number;
  blueprintReward: string;
}

// -------------------------------------------------------------
// WORLD BOSS & GLOBAL COMMS
// -------------------------------------------------------------
export interface WorldBossState {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  active: boolean;
  isActive?: boolean;
  timeLeft: number;
  participantsCount: number;
  playerDamage: number;
  status: 'dormant' | 'active' | 'defeated';
}

export interface GlobalChatMessage {
  id: string;
  senderId: string;
  senderCallsign: string;
  guildTag?: string;
  text: string;
  timestamp: number;
  channel: 'global' | 'guild' | 'system';
}

export interface PlayerUpgrades {
  weaponLevel: number; // Multishot 1 -> 5
  damageLevel: number; // +20% damage per level
  fireRateLevel: number; // +15% rpm per level
  critChanceLevel: number; // +3% per level
  critDamageLevel: number; // +25% per level
  shieldCapacityLevel: number; // +30 shield per level
  shieldRegenLevel: number; // +20% regen speed
  hullArmorLevel: number; // +40 max hp
  droneCountLevel: number; // 0 -> 5 bonus upgrade drones
  dronePowerLevel: number; // +25% drone dps
  magnetLevel: number; // +35px pickup magnet radius
  idleCollectorLevel: number; // Generates scrap per second even while idle
  aiPilotLevel: number; // Neural AI Copilot capacitor & reaction upgrade
}

export interface TechLabResearches {
  warpDriveMastery: number; // +10% move speed
  plasmaOvercharge: number; // +15% global damage
  quantumScrapRefinery: number; // +25% scrap drops
  darkMatterAttunement: number; // +20% dark matter drops
  bossVulnerabilityMatrix: number; // +25% damage to Bosses
}

// -------------------------------------------------------------
// COSMETICS & CUSTOMIZATION TYPES
// -------------------------------------------------------------
export type CosmeticCategory = 'skin' | 'laser' | 'trail' | 'hangar';
export type CosmeticRarity = 'standard' | 'rare' | 'epic' | 'legendary';

export interface CosmeticItem {
  id: string;
  name: string;
  category: CosmeticCategory;
  rarity: CosmeticRarity;
  costScrap: number;
  costDarkMatter: number;
  description: string;
  perkText: string;
  primaryColor: string;
  accentColor: string;
  trailType?: 'ember' | 'spark' | 'smoke' | 'matrix' | 'warp';
}

export interface EquippedCosmetics {
  skinId: string;
  laserColor: string;
  trailEffect: string;
  hangarDeco: string;
  hangarId?: string;
}

// -------------------------------------------------------------
// GUILD TYPES
// -------------------------------------------------------------
export type GuildRole = 'leader' | 'officer' | 'member';

export interface GuildMemberData {
  id: string;
  callsign: string;
  role: GuildRole;
  joinedAt: number;
  contributedScrap: number;
  contributedDarkMatter: number;
}

export interface GuildCitadelData {
  level: number;
  reactorLevel: number; // +5% scrap yield per level
  relayLevel: number; // -3% ability cooldown per level
  fabricatorLevel: number; // +25 max deflector shields per level
  vaultScrap: number;
  vaultDarkMatter: number;
}

export interface GuildChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  role: GuildRole;
  text: string;
  timestamp: number;
}

export interface GuildData {
  id: string;
  name: string;
  tag: string;
  description: string;
  motd: string;
  leaderId: string;
  members: GuildMemberData[];
  citadel: GuildCitadelData;
  chat: GuildChatMessage[];
  createdAt: number;
}

export interface Asteroid {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vRot: number;
  radius: number;
  hp: number;
  maxHp: number;
  points: Array<{ x: number; y: number }>;
}

export type BuyMultiplierMode = '1x' | '10x' | 'max';

export type EnemyTacticalRole =
  | 'standard'
  | 'healer'
  | 'sniper'
  | 'commander'
  | 'boss_shield_drone';

export interface OfflineRewardSummary {
  elapsedSeconds: number;
  awaySeconds: number;
  scrapEarned: number;
  darkMatterEarned: number;
}

export interface UpgradeMilestoneInfo {
  tier: number;
  multiplier: number;
  nextMilestoneLevel: number;
  progressPct: number;
}

export type OverdriveBoosterId = 'overclock' | 'aegis_field' | 'salvage_surge';

export interface OverdriveBoosterState {
  id: OverdriveBoosterId;
  name: string;
  shortLabel?: string;
  desc: string;
  activeRemaining: number;
  cooldownRemaining: number;
  duration: number;
  cooldown: number;
}

export interface CommandAchievement {
  id: string;
  title: string;
  desc: string;
  currentValue: number;
  targetValue: number;
  current: number;
  target: number;
  unlocked: boolean;
  claimed: boolean;
  tier: number;
  rewardDarkMatter: number;
  rewardQuantumShards: number;
  canClaim: boolean;
}

export interface Enemy {
  id: string;
  type: 'swarmer' | 'scout' | 'frigate' | 'stalker_kamikaze' | 'mortar' | 'boss';
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  radius: number;
  color: string;
  glowColor: string;
  scoreValue: number;
  scrapValue: number;
  darkMatterValue: number;
  shootCooldown: number;
  shootTimer: number;
  patternTimer: number;
  telegraphTimer: number;
  isTelegraphing: boolean;
  bossPhase?: number;
  bossAbilitiesTimer?: number;
  shieldArc?: number;
  shieldHp?: number;
  maxShieldHp?: number;
  isElite?: boolean;
  isMiniBoss?: boolean;
  isPvpRival?: boolean;
  rivalShipClassId?: ShipClassId;
  rivalCallsign?: string;
  rivalGuildTag?: string;
  warpInTimer?: number;
  staggerTimer?: number;
  affix?: 'berserk' | 'shielded' | 'vampiric' | 'split';
  formationX?: number;
  formationY?: number;
  tacticalRole?: EnemyTacticalRole;
  healTargetId?: string;
  healBeamTimer?: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  radius: number;
  color: string;
  secondaryColor?: string;
  weaponTier?: number;
  beamStyle?: EquipmentItem['visualPattern'];
  isPlayer: boolean;
  isCrit?: boolean;
  pierce?: number;
  homingTargetId?: string;
  lifetime: number;
  isMissile?: boolean;
  missileType?: MissileWeaponId;
  blastRadius?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  shape?: 'circle' | 'spark' | 'ring' | 'square';
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  vy: number;
  alpha: number;
  color: string;
  isCrit?: boolean;
}

export interface DropItem {
  id: string;
  type: 'scrap' | 'darkmatter' | 'shield_boost' | 'overdrive_surge';
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number;
  radius: number;
  magnetized: boolean;
}

export interface SquadRemotePilot {
  id: string;
  callsign: string;
  shipClass: ShipClassId;
  x: number;
  y: number;
  angle: number;
  health: number;
  maxHealth: number;
  isFiring: boolean;
  score: number;
  kills: number;
  guildTag?: string;
  skinId?: string;
  laserColor?: string;
  trailEffect?: string;
  lastActive: number;
}

export interface Drone {
  orbitAngle: number;
  distance: number;
  shootCooldown: number;
  shootTimer: number;
}
