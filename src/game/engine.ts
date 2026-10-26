import { sound, haptics } from './audio.ts';
import { multiplayer } from './multiplayerClient.ts';
import {
  SHIP_CLASSES,
  getShipConfig,
  renderBespokeShipCanvas,
  renderVector3DDrone,
} from './shipClasses.ts';
import { cosmetics, COSMETIC_CATALOGUE } from './cosmetics.ts';
import { dailyMissions } from './missions.ts';
import { assetManager } from './assets.ts';
import { equipmentManager, VOID_DUNGEONS } from './equipment.ts';
import { paragonManager, VoidRiftMutator } from './paragon.ts';
import {
  metaProgression,
  PvpOpponent,
  DamageFilterMode,
} from './metaProgression.ts';
import { formatCompactNumber } from './formatters.ts';
import {
  Asteroid,
  BuyMultiplierMode,
  CommandAchievement,
  DropItem,
  Enemy,
  FloatingText,
  MissileWeaponId,
  OfflineRewardSummary,
  OverdriveBoosterId,
  OverdriveBoosterState,
  Particle,
  PlayerUpgrades,
  Projectile,
  ShipClassId,
  TechLabResearches,
  UpgradeMilestoneInfo,
  VoidDungeon,
} from './types.ts';

export interface GameStats {
  sector: number;
  wave: number;
  waveTimer: number;
  waveDuration: number;
  scrap: number;
  darkMatter: number;
  kills: number;
  bossesDefeated: number;
  damageDealt: number;
  playerHp: number;
  playerMaxHp: number;
  playerShield: number;
  playerMaxShield: number;
  abilityCooldownRemaining: number;
  abilityMaxCooldown: number;
  isAbilityActive: boolean;
  abilityActiveRemaining: number;
  dps: number;
  incomingDps: number;
  mitigationPct: number;
  damageMitigationPct: number;
  currentRunWavesCleared: number;
  setBonusName: string;
  currentBoss: {
    name: string;
    hp: number;
    maxHp: number;
    phase: number;
    shieldHp: number;
    maxShieldHp: number;
    shieldDronesAlive: number;
    isMiniBoss?: boolean;
    isPvpRival?: boolean;
    staggerTimer?: number;
    staggerRemaining: number;
  } | null;
  activeSquadSize: number;
  isAutoAim: boolean;
  score: number;
  missileReady: boolean;
  missileCooldownRemaining: number;
  missileMaxCooldown: number;
  missileName: string;
  paragonLevel: number;
  quantumShards: number;
  prestigeRank: number;
  isEndlessRift: boolean;
  endlessDepth: number;
  activeMutatorName?: string;
  isAutoPilot: boolean;
  autoPilotEnergyPct: number;
  isAutoPilotOverheated: boolean;
  autoPilotRechargeDelayRemaining: number;
  comboCount: number;
  comboMultiplier: number;
  comboTimerPct: number;
  phaseDashCooldownRemaining: number;
  phaseDashMaxCooldown: number;
  phaseDashActiveRemaining: number;
  shieldRegenPerSec: number;
  hullRegenPerSec: number;
  enemiesRemaining: number;
  gameSpeed: 1 | 2 | 3;
  bossAutoRetry: boolean;
  autoUpgradeEnabled: boolean;
  pendingOfflineReward: OfflineRewardSummary | null;
  activeBoosters: OverdriveBoosterState[];
  achievements: CommandAchievement[];
  claimableAchievementsCount: number;
  activePvpMatch: {
    opponentName: string;
    guildTag: string;
    rewardTrophies: number;
    rewardMedals: number;
  } | null;
  pvpLeagueName: string;
  pvpLeagueColor: string;
  pvpTrophies: number;
  arenaTickets: number;
  honorMedals: number;
  activeCommanderName: string;
  damageFilter: DamageFilterMode;
  metaClaimableCount: number;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationId: number = 0;
  private lastTime: number = 0;

  // Game state
  public isRunning: boolean = false;
  public isPaused: boolean = false;
  public shipClassId: ShipClassId = 'ship_01';

  // Player position & physics (Stationary Standoff Command Line)
  public playerX: number = 220;
  public playerY: number = 560;
  public playerAngle: number = -Math.PI / 2; // Facing straight up
  public playerVx: number = 0;
  public playerVy: number = 0;
  public playerHp: number = 120;
  public playerMaxHp: number = 120;
  public playerShield: number = 80;
  public playerMaxShield: number = 80;
  public shieldRegenDelayTimer: number = 0;
  public hitFlashTimer: number = 0;

  // Modular Equipment & Hardpoints
  public missileCooldownTimer: number = 0;
  public missileMaxCooldown: number = 5.0;
  public currentDungeon: VoidDungeon | null = null;
  public droneFormationSlots: Array<{ x: number; y: number; vx: number; vy: number }> = [];

  // Endless Void Rift, Live 1v1 PvP Arena & Cinematic Boss Alert State
  public isEndlessRift: boolean = false;
  public endlessRiftDepth: number = 1;
  public activePvpOpponent: PvpOpponent | null = null;
  public isPvpArenaMatch: boolean = false;
  public currentPvpRival: PvpOpponent | null = null;
  public bossWarningTimer: number = 0;
  public bossWarningName: string = '';

  // Upgrades & Tech
  public upgrades: PlayerUpgrades = {
    weaponLevel: 1,
    damageLevel: 1,
    fireRateLevel: 1,
    critChanceLevel: 1,
    critDamageLevel: 1,
    shieldCapacityLevel: 1,
    shieldRegenLevel: 1,
    hullArmorLevel: 1,
    droneCountLevel: 0,
    dronePowerLevel: 1,
    magnetLevel: 1,
    idleCollectorLevel: 0,
    aiPilotLevel: 1,
  };

  public tech: TechLabResearches = {
    warpDriveMastery: 0,
    plasmaOvercharge: 0,
    quantumScrapRefinery: 0,
    darkMatterAttunement: 0,
    bossVulnerabilityMatrix: 0,
  };

  public scrap: number = 150;
  public darkMatter: number = 10;
  public score: number = 0;
  public totalKills: number = 0;
  public totalBosses: number = 0;
  public totalDamageDealt: number = 0;

  // Sector & Waves
  public sector: number = 1;
  public wave: number = 1;
  public waveTimer: number = 0;
  public waveDuration: number = 28;
  public waveSpawnCooldown: number = 0;
  public isBossWave: boolean = false;

  // Special Ability & Tactical Standoff Auto-Battler Systems
  public specialCooldownTimer: number = 0;
  public specialActiveTimer: number = 0;
  public isAutoAim: boolean = true;
  public isAutoPilot: boolean = true; // Auto-Cast Skills enabled by default
  public gameSpeed: 1 | 2 | 3 = 1;
  public bossAutoRetry: boolean = true;
  public autoUpgradeEnabled: boolean = false;
  private autoUpgradeTimer: number = 0;
  private saveHeartbeatTimer: number = 0;
  public pendingOfflineReward: OfflineRewardSummary | null = null;
  public autoPilotEnergy: number = 100;
  public autoPilotMaxEnergy: number = 100;
  public autoPilotRechargeDelayTimer: number = 0;
  public isAutoPilotOverheated: boolean = false;
  private standoffTime: number = 0;
  private waveEnemyTotal: number = 6;
  private autoPilotTargetEnemyId: string | null = null;
  private autoPilotHasClearLOS: boolean = true;
  private autoPilotSafeStandoffRadius: number = 200;
  public phaseDashCooldownTimer: number = 0;
  public phaseDashMaxCooldown: number = 8.0; // Aegis Shield Overcharge cooldown
  public phaseDashActiveTimer: number = 0;
  public phaseAfterimages: Array<{ x: number; y: number; angle: number; alpha: number }> = [];
  public comboCount: number = 0;
  public comboTimer: number = 0;
  public comboMultiplier: number = 1.0;
  public cameraZoom: number = 1.0;

  // Drones
  private droneShootTimers: number[] = [0, 0, 0, 0];

  // Game entities
  public enemies: Enemy[] = [];
  public asteroids: Asteroid[] = [];
  public projectiles: Projectile[] = [];
  public particles: Particle[] = [];
  public drops: DropItem[] = [];
  public floatingTexts: FloatingText[] = [];
  private asteroidSpawnTimer: number = 1.5;

  // Hitstop & Camera shake
  private hitstopTimer: number = 0;
  private screenShakeMagnitude: number = 0;
  private primaryShootCooldown: number = 0;

  // Background Nebula
  private nebulaScrollY: number = 0;

  // Inputs (Smartphone 1-Finger Relative Drag + Optional Keyboard fallback)
  private keysHeld: Record<string, boolean> = {};
  private mousePos: { x: number; y: number; isDown: boolean } = { x: 200, y: 500, isDown: false };
  private dragState: {
    active: boolean;
    anchorX: number;
    anchorY: number;
    currentX: number;
    currentY: number;
    lastX: number;
    lastY: number;
  } = {
    active: false,
    anchorX: 0,
    anchorY: 0,
    currentX: 0,
    currentY: 0,
    lastX: 0,
    lastY: 0,
  };
  private dragDeltaX: number = 0;
  private dragDeltaY: number = 0;
  private lastTapTime: number = 0;
  private lastTapX: number = 0;
  private lastTapY: number = 0;

  // Idle Scrap accumulator & Live Combat Telemetry
  private idleScrapAcc: number = 0;
  private dpsMeasurement: { damageSum: number; timer: number; currentDps: number } = {
    damageSum: 0,
    timer: 0,
    currentDps: 0,
  };
  private incomingDpsMeasurement: { damageSum: number; timer: number; currentDps: number } = {
    damageSum: 0,
    timer: 0,
    currentDps: 0,
  };

  // Tactical Overdrive Boosters (45s active, 90s cooldown)
  public boosters: Record<
    OverdriveBoosterId,
    { activeRemaining: number; cooldownRemaining: number; duration: number; cooldown: number }
  > = {
    overclock: { activeRemaining: 0, cooldownRemaining: 0, duration: 45, cooldown: 90 },
    aegis_field: { activeRemaining: 0, cooldownRemaining: 0, duration: 45, cooldown: 90 },
    salvage_surge: { activeRemaining: 0, cooldownRemaining: 0, duration: 45, cooldown: 90 },
  };

  // Command Milestone Achievements (Claimed Tiers)
  public achievementTiers: Record<string, number> = {
    kills: 1,
    bosses: 1,
    sectors: 1,
    upgrades: 1,
    prestige: 1,
  };

  // Callbacks to UI
  public onGameOver?: (stats: { score: number; kills: number; sector: number; wave: number; scrap: number }) => void;
  public onSectorCleared?: (sector: number) => void;
  public onStatsUpdate?: (stats: GameStats) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.bindEvents();
    this.loadSavedProgress();
  }

  public resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  private bindEvents() {
    window.addEventListener('keydown', (e) => {
      this.keysHeld[e.code] = true;
      if (e.code === 'KeyE' && this.specialCooldownTimer <= 0) {
        this.triggerSpecialAbility();
      }
      if ((e.code === 'KeyF' || e.code === 'Space') && this.missileCooldownTimer <= 0) {
        this.fireMissileSalvo();
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.triggerPhaseDash();
      }
      if (e.code === 'KeyQ') {
        this.isAutoAim = !this.isAutoAim;
      }
      if (e.code === 'KeyV') {
        this.toggleAutoPilot();
      }
      if (e.code === 'Escape') {
        this.isPaused = !this.isPaused;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keysHeld[e.code] = false;
    });

    window.addEventListener('blur', () => {
      this.keysHeld = {};
    });

    const handleTapTarget = (clientX: number, clientY: number) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / Math.max(1, rect.width);
      const scaleY = this.canvas.height / Math.max(1, rect.height);
      const x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;

      this.mousePos.x = x;
      this.mousePos.y = y;

      // Tap on an enemy to lock Priority Focus Fire onto that target
      let tappedEnemy: Enemy | null = null;
      let minTapDist = 64;
      for (const e of this.enemies) {
        const d = Math.hypot(e.x - x, e.y - y);
        if (d < e.radius + 36 && d < minTapDist) {
          minTapDist = d;
          tappedEnemy = e;
        }
      }

      if (tappedEnemy) {
        this.autoPilotTargetEnemyId = tappedEnemy.id;
        sound.playUiClick();
        this.addFloatingText('ZIEL-FOKUS!', tappedEnemy.x, tappedEnemy.y - tappedEnemy.radius - 14, '#22d3ee', true);
      }
    };

    this.canvas.addEventListener('mousedown', (e) => {
      handleTapTarget(e.clientX, e.clientY);
    });

    this.canvas.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches.length > 0) {
          handleTapTarget(e.touches[0].clientX, e.touches[0].clientY);
        }
      },
      { passive: true }
    );

    // Hook multiplayer remote laser firing
    multiplayer.onRemoteLaserFired = (data) => {
      this.spawnRemoteLaser(data.x, data.y, data.angle, data.laserType, data.laserColor);
    };

    // Hook multiplayer boss synchronization
    multiplayer.onBossSynced = (event) => {
      const currentBoss = this.enemies.find((e) => e.type === 'boss');
      if (currentBoss && event.bossState) {
        currentBoss.hp = Math.min(currentBoss.hp, event.bossState.hp);
        if (event.damage && event.damagedBy !== multiplayer.playerId) {
          this.addFloatingText(`-${event.damage}`, currentBoss.x + (Math.random() * 40 - 20), currentBoss.y, '#38bdf8');
          this.addParticles(currentBoss.x, currentBoss.y, 4, '#38bdf8');
        }
      }
    };
  }

  public setShipClass(shipId: ShipClassId) {
    const config = getShipConfig(shipId);
    this.shipClassId = config.id;
    equipmentManager.syncSlotsForShip(config);
    this.applyUpgradesToShip();
    this.playerHp = this.playerMaxHp;
    this.playerShield = this.playerMaxShield;
    multiplayer.shipClass = config.id;
  }

  public getMilestoneMultiplier(level: number): number {
    const tier = Math.floor(Math.max(1, level) / 10);
    return Math.pow(1.35, tier);
  }

  public getMilestoneInfo(statKey: keyof PlayerUpgrades): UpgradeMilestoneInfo {
    const level = Math.max(1, this.upgrades[statKey] ?? 1);
    const tier = Math.floor(level / 10);
    const multiplier = this.getMilestoneMultiplier(level);
    const nextMilestoneLevel = (tier + 1) * 10;
    const progressPct = ((level % 10) / 10) * 100;
    return {
      tier,
      multiplier,
      nextMilestoneLevel,
      progressPct,
    };
  }

  public applyUpgradesToShip() {
    const config = getShipConfig(this.shipClassId);
    const paragonBonuses = paragonManager.getComputedBonuses();
    const eqStats = equipmentManager.getAggregatedLoadoutStats(config);
    const metaMults = metaProgression.getComputedMultipliers();

    const armorLevel = Math.max(1, this.upgrades.hullArmorLevel);
    const shieldLevel = Math.max(1, this.upgrades.shieldCapacityLevel);
    const aegisCoreLevel = Math.max(1, this.upgrades.aiPilotLevel || 1);

    const armorMilestone = this.getMilestoneMultiplier(armorLevel);
    const shieldMilestone = this.getMilestoneMultiplier(shieldLevel);
    const coreMilestone = this.getMilestoneMultiplier(aegisCoreLevel);

    // Strong HP & Shield progression for Standoff Idle Auto-Battler tanking + 10-Level Milestone Perks + Set Synergy + Pilot & Honor Shop
    const baseHp =
      (config.hullMax + (armorLevel - 1) * 75 + (aegisCoreLevel - 1) * 40) *
      (1 + (armorLevel - 1) * 0.08) *
      armorMilestone *
      Math.sqrt(coreMilestone) *
      (eqStats.setShieldMult || 1.0) *
      metaMults.shieldMult;
    const prevMaxHp = this.playerMaxHp || baseHp;
    this.playerMaxHp = Math.round(baseHp * paragonBonuses.hullAndShieldMult);
    if (this.playerHp > 0 && this.playerMaxHp > prevMaxHp) {
      this.playerHp = Math.min(this.playerMaxHp, this.playerHp + (this.playerMaxHp - prevMaxHp));
    }

    // Guild Citadel Fleet Fabricator bonus + Multi-Slot Shield Generators + 10-Level Milestone Perks
    const guildFabricatorShields = (multiplayer.currentGuild?.citadel.fabricatorLevel || 0) * 35;
    const skinShieldBonus = cosmetics.equipped.skinId === 'skin-cyber' ? 1.05 : 1.0;

    const prevMaxShield = this.playerMaxShield || config.shieldMax;
    this.playerMaxShield = Math.round(
      (config.shieldMax +
        eqStats.totalShieldBonus +
        (shieldLevel - 1) * 65 +
        (aegisCoreLevel - 1) * 35 +
        guildFabricatorShields) *
        (1 + (shieldLevel - 1) * 0.08) *
        shieldMilestone *
        Math.sqrt(coreMilestone) *
        skinShieldBonus *
        metaMults.shieldMult *
        paragonBonuses.hullAndShieldMult
    );
    if (this.playerMaxShield > prevMaxShield) {
      this.playerShield = Math.min(
        this.playerMaxShield,
        this.playerShield + (this.playerMaxShield - prevMaxShield)
      );
    }
  }

  private getPan(x: number): number {
    if (!this.canvas.width) return 0;
    return Math.max(-0.85, Math.min(0.85, (x / this.canvas.width) * 1.7 - 0.85));
  }

  public startEndlessRift(depth: number, mutator: VoidRiftMutator) {
    paragonManager.setEndlessDepth(depth);
    paragonManager.setActiveMutator(mutator.id);
    this.isEndlessRift = true;
    this.activePvpOpponent = null;
    this.isPvpArenaMatch = false;
    this.currentPvpRival = null;
    this.endlessRiftDepth = depth;
    this.enemies = [];
    this.projectiles = [];
    this.wave = 1;
    this.waveTimer = 0;
    this.isBossWave = false;
    this.applyUpgradesToShip();
    this.playerHp = this.playerMaxHp;
    this.playerShield = this.playerMaxShield;
    this.addFloatingText(
      `VOID RIFT DEPTH ${depth}: ${mutator.name}`,
      this.playerX,
      this.playerY - 50,
      '#00f2fe',
      true
    );
    this.emitStatsNow();
  }

  public startPvpMatch(opponent: PvpOpponent) {
    this.activePvpOpponent = opponent;
    this.isPvpArenaMatch = true;
    this.currentPvpRival = opponent;
    this.isEndlessRift = false;
    this.enemies = [];
    this.projectiles = [];
    this.drops = [];
    this.isBossWave = true;
    this.applyUpgradesToShip();
    this.playerHp = this.playerMaxHp;
    this.playerShield = this.playerMaxShield;
    this.specialCooldownTimer = 0;
    this.phaseDashCooldownTimer = 0;
    this.missileCooldownTimer = 0;

    const rivalX = (this.canvas.width || 400) / 2;
    const rivalY = Math.max(215, Math.round((this.canvas.height || 760) * 0.275));
    const rivalHp = opponent.hullMax || opponent.hp || 2400;
    const rivalShield = opponent.shieldMax || opponent.shield || 1500;

    const rivalEnemy: Enemy = {
      id: `pvp-rival-${Date.now()}`,
      type: 'boss',
      name: `[${opponent.guildTag}] ${opponent.callsign}`,
      x: rivalX,
      y: rivalY,
      formationX: rivalX,
      formationY: rivalY,
      vx: 0,
      vy: 0,
      hp: rivalHp,
      maxHp: rivalHp,
      shieldHp: rivalShield,
      maxShieldHp: rivalShield,
      shieldArc: Math.PI * 2,
      radius: 44,
      color: '#f43f5e',
      glowColor: '#fbbf24',
      scoreValue: 5000,
      scrapValue: opponent.rewardScrap || 2500,
      darkMatterValue: opponent.rewardDarkMatter || Math.max(10, Math.round(opponent.rewardMedals * 0.5)),
      shootCooldown: 1.05,
      shootTimer: 1.0,
      patternTimer: 0,
      telegraphTimer: 0,
      isTelegraphing: false,
      bossPhase: 1,
      isPvpRival: true,
      rivalShipClassId: opponent.shipClassId,
      rivalCallsign: opponent.callsign,
      rivalGuildTag: opponent.guildTag,
      warpInTimer: 0.3,
      staggerTimer: 0,
    };

    this.enemies.push(rivalEnemy);
    this.spawnBossShieldDrones(rivalEnemy, 2);
    this.waveEnemyTotal = this.enemies.length;
    this.bossWarningTimer = 1.6;
    this.bossWarningName = `PVP-DUELL: [${opponent.guildTag}] ${opponent.callsign}`;
    sound.playBossAlert();
    this.emitStatsNow();
  }

  public cycleDamageFilter(): DamageFilterMode {
    const mode = metaProgression.cycleDamageFilter();
    sound.playUiClick();
    this.emitStatsNow();
    return mode;
  }

  public performPrestigeReset() {
    this.scrap = 150;
    this.sector = 1;
    this.wave = 1;
    this.isEndlessRift = false;
    this.activePvpOpponent = null;
    this.isPvpArenaMatch = false;
    this.currentPvpRival = null;
    this.enemies = [];
    this.projectiles = [];
    // Reset run-specific upgrades to level 1 while keeping permanent Paragon, Relics, Tech Lab & Ships
    this.upgrades = {
      weaponLevel: 1,
      damageLevel: 1,
      fireRateLevel: 1,
      critChanceLevel: 1,
      critDamageLevel: 1,
      shieldCapacityLevel: 1,
      shieldRegenLevel: 1,
      hullArmorLevel: 1,
      droneCountLevel: 0,
      dronePowerLevel: 1,
      magnetLevel: 1,
      idleCollectorLevel: 0,
      aiPilotLevel: 1,
    };
    this.applyUpgradesToShip();
    this.playerHp = this.playerMaxHp;
    this.playerShield = this.playerMaxShield;
    this.saveProgress();
    this.addFloatingText(
      'SINGULARITÄTS-PRESTIGE ABGESCHLOSSEN!',
      this.playerX,
      this.playerY - 45,
      '#f59e0b',
      true
    );
    this.addParticles(this.playerX, this.playerY, 32, '#a855f7', 'ring');
  }

  public start(shipId?: ShipClassId, startSector?: number) {
    if (shipId) {
      this.setShipClass(shipId);
    }
    if (startSector && startSector >= 1) {
      this.sector = startSector;
    }
    this.playerX = (this.canvas.width || 400) * 0.5;
    this.playerY = (this.canvas.height || 760) * 0.72;
    this.playerAngle = -Math.PI / 2;
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    sound.startAtmosphere();
    this.loop(this.lastTime);
  }

  public stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    sound.stopAtmosphere();
  }

  private loop = (currentTime: number) => {
    if (!this.isRunning) return;

    const rawDt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    const baseDt = Math.min(rawDt, 0.05); // Frame delta time clamp
    const simDt = baseDt * this.gameSpeed;

    if (!this.isPaused) {
      if (this.hitstopTimer > 0) {
        this.hitstopTimer -= baseDt;
      } else {
        this.update(simDt);
      }
    }

    this.render();
    this.animationId = requestAnimationFrame(this.loop);
  };

  public activateBooster(id: OverdriveBoosterId): boolean {
    const b = this.boosters[id];
    if (!b || b.activeRemaining > 0 || b.cooldownRemaining > 0) return false;
    b.activeRemaining = b.duration;
    b.cooldownRemaining = b.cooldown;

    if (id === 'aegis_field') {
      this.playerShield = this.playerMaxShield;
      this.playerHp = Math.min(this.playerMaxHp, this.playerHp + Math.round(this.playerMaxHp * 0.35));
    }

    sound.playUpgrade();
    const label =
      id === 'overclock'
        ? 'OVERDRIVE: +50% DPS AKTIV!'
        : id === 'aegis_field'
        ? 'AEGIS-FESTUNG: +60% REGEN AKTIV!'
        : 'BEUTE-SCANNER: +100% SCRAP AKTIV!';
    this.addFloatingText(label, this.playerX, this.playerY - 46, '#fbbf24', true);
    this.addParticles(this.playerX, this.playerY, 22, '#22d3ee', 'ring');
    return true;
  }

  public getActiveBoosterStates(): OverdriveBoosterState[] {
    return [
      {
        id: 'overclock',
        name: 'Waffen-Übertaktung',
        shortLabel: '+50% DPS',
        desc: '+50% Waffenschaden & +25% Feuerrate für 45s',
        activeRemaining: this.boosters.overclock.activeRemaining,
        cooldownRemaining: this.boosters.overclock.cooldownRemaining,
        duration: this.boosters.overclock.duration,
        cooldown: this.boosters.overclock.cooldown,
      },
      {
        id: 'aegis_field',
        name: 'Aegis-Festung',
        shortLabel: '+60% REGEN',
        desc: '+60% Schild-/Hüllen-Regeneration & Sofort-Schild für 45s',
        activeRemaining: this.boosters.aegis_field.activeRemaining,
        cooldownRemaining: this.boosters.aegis_field.cooldownRemaining,
        duration: this.boosters.aegis_field.duration,
        cooldown: this.boosters.aegis_field.cooldown,
      },
      {
        id: 'salvage_surge',
        name: 'Beute-Scanner',
        shortLabel: '+100% BEUTE',
        desc: '+100% Scrap- & +50% Dark-Matter-Ertrag für 45s',
        activeRemaining: this.boosters.salvage_surge.activeRemaining,
        cooldownRemaining: this.boosters.salvage_surge.cooldownRemaining,
        duration: this.boosters.salvage_surge.duration,
        cooldown: this.boosters.salvage_surge.cooldown,
      },
    ];
  }

  public getBoostersState(): OverdriveBoosterState[] {
    return this.getActiveBoosterStates();
  }

  public getCommandAchievements(): CommandAchievement[] {
    const pState = paragonManager.getState();
    const highestUpgradeLvl = Math.max(...Object.values(this.upgrades));
    const highestSector = Math.max(this.sector, ...Array.from(equipmentManager.unlockedSectors));

    const defs = [
      {
        id: 'kills',
        title: 'Flotten-Dezimierung',
        desc: 'Zerstöre feindliche Schiffe in der Standoff-Formation',
        val: this.totalKills,
        step: 40,
        dmBase: 15,
        qsBase: 2,
      },
      {
        id: 'bosses',
        title: 'Titanen-Jäger',
        desc: 'Besiege Mini-Bosse (Welle 5) und Sektor-Bosse (Welle 10)',
        val: this.totalBosses,
        step: 2,
        dmBase: 20,
        qsBase: 3,
      },
      {
        id: 'upgrades',
        title: 'System-Meisterschaft',
        desc: 'Erreiche hohe Upgrade-Stufen auf deinen Schiffssystemen',
        val: highestUpgradeLvl,
        step: 10,
        dmBase: 25,
        qsBase: 3,
      },
      {
        id: 'sectors',
        title: 'Sektor-Pionier',
        desc: 'Schalte neue Stargate-Sektoren frei',
        val: highestSector,
        step: 1,
        dmBase: 30,
        qsBase: 4,
      },
      {
        id: 'prestige',
        title: 'Singularitäts-Aufstieg',
        desc: 'Steige im Prestige-Rang durch abgeschlossene Runs auf',
        val: pState.prestigeRank,
        step: 1,
        dmBase: 40,
        qsBase: 5,
      },
    ];

    return defs.map((d) => {
      const tier = Math.max(1, this.achievementTiers[d.id] || 1);
      const targetValue =
        d.id === 'sectors'
          ? tier + 1
          : d.id === 'upgrades'
          ? tier * 10
          : d.step * Math.round(Math.pow(1.6, tier - 1));
      const rewardDarkMatter = d.dmBase * tier;
      const rewardQuantumShards = d.qsBase * tier;
      const canClaim = d.val >= targetValue;
      return {
        id: d.id,
        title: `${d.title} (Rang ${tier})`,
        desc: d.desc,
        currentValue: d.val,
        targetValue,
        current: d.val,
        target: targetValue,
        tier,
        rewardDarkMatter,
        rewardQuantumShards,
        canClaim,
        unlocked: canClaim,
        claimed: false,
      };
    });
  }

  public claimAchievement(id: string): boolean {
    const list = this.getCommandAchievements();
    const item = list.find((a) => a.id === id);
    if (!item || !item.canClaim) return false;

    this.darkMatter += item.rewardDarkMatter;
    paragonManager.addQuantumShards(item.rewardQuantumShards);
    this.achievementTiers[id] = (this.achievementTiers[id] || 1) + 1;
    sound.playUpgrade();
    this.saveProgress();
    this.addFloatingText(
      `ERFOLG! +${item.rewardDarkMatter} DM & +${item.rewardQuantumShards} QS`,
      this.playerX,
      this.playerY - 48,
      '#c084fc',
      true
    );
    return true;
  }

  // -----------------------------------------------------------
  // UPDATE SIMULATION
  // -----------------------------------------------------------
  private update(dt: number) {
    const config = getShipConfig(this.shipClassId);
    const paragonBonuses = paragonManager.getComputedBonuses();
    const eqStats = equipmentManager.getAggregatedLoadoutStats(config);
    const metaMults = metaProgression.getComputedMultipliers();

    // Update Tactical Overdrive Boosters
    for (const key of ['overclock', 'aegis_field', 'salvage_surge'] as OverdriveBoosterId[]) {
      const b = this.boosters[key];
      if (b.activeRemaining > 0) {
        b.activeRemaining = Math.max(0, b.activeRemaining - dt);
      } else if (b.cooldownRemaining > 0) {
        b.cooldownRemaining = Math.max(0, b.cooldownRemaining - dt);
      }
    }

    const isAegisBoosterActive = this.boosters.aegis_field.activeRemaining > 0;
    const isOverclockBoosterActive = this.boosters.overclock.activeRemaining > 0;

    // Adaptive 4-State Multi-Track Synthwave Intensity
    const hasBossActive = this.enemies.some((e) => e.type === 'boss');
    if (hasBossActive || this.bossWarningTimer > 0) {
      sound.setCombatIntensity('boss');
    } else if (
      this.specialActiveTimer > 0 ||
      this.comboMultiplier >= 2.5 ||
      this.isEndlessRift
    ) {
      sound.setCombatIntensity('overdrive');
    } else if (this.enemies.length > 0) {
      sound.setCombatIntensity('combat');
    } else {
      sound.setCombatIntensity('exploration');
    }

    if (this.bossWarningTimer > 0) {
      this.bossWarningTimer = Math.max(0, this.bossWarningTimer - dt);
    }

    // Zero screen shake (always 0)
    this.screenShakeMagnitude = 0;

    // Hit flash decay
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
    }

    // Continuous In-Combat Shield Regeneration & Nanite Hull Repair (Core Idle Tanking Loop + 10-Level Milestones + Pilot Aura)
    const aegisCoreLevel = Math.max(1, this.upgrades.aiPilotLevel || 1);
    const shieldRegenMilestone = this.getMilestoneMultiplier(this.upgrades.shieldRegenLevel);
    const hullArmorMilestone = this.getMilestoneMultiplier(this.upgrades.hullArmorLevel);
    const coreMilestone = this.getMilestoneMultiplier(aegisCoreLevel);
    const aegisBoosterMult = isAegisBoosterActive ? 1.6 : 1.0;

    const fullShieldRegenRate =
      (22 +
        eqStats.totalShieldRegen +
        (this.upgrades.shieldRegenLevel - 1) * 14 +
        (aegisCoreLevel - 1) * 8) *
      (1 + (this.upgrades.shieldRegenLevel - 1) * 0.22) *
      shieldRegenMilestone *
      paragonBonuses.regenMult *
      metaMults.regenMult *
      aegisBoosterMult;

    if (this.shieldRegenDelayTimer > 0) {
      this.shieldRegenDelayTimer = Math.max(0, this.shieldRegenDelayTimer - dt);
      if (this.playerShield < this.playerMaxShield) {
        this.playerShield = Math.min(
          this.playerMaxShield,
          this.playerShield + fullShieldRegenRate * 0.45 * dt
        );
      }
    } else if (this.playerShield < this.playerMaxShield) {
      this.playerShield = Math.min(
        this.playerMaxShield,
        this.playerShield + fullShieldRegenRate * dt
      );
    }

    // Continuous Nanite Hull Repair
    const hullRegenRate =
      (5 +
        (this.upgrades.hullArmorLevel - 1) * 5.5 +
        (aegisCoreLevel - 1) * 6.5) *
      hullArmorMilestone *
      Math.sqrt(coreMilestone) *
      paragonBonuses.regenMult *
      metaMults.regenMult *
      aegisBoosterMult;
    if (this.playerHp > 0 && this.playerHp < this.playerMaxHp) {
      this.playerHp = Math.min(this.playerMaxHp, this.playerHp + hullRegenRate * dt);
    }

    // Special Ability & Aegis Barrier Timers
    if (this.specialCooldownTimer > 0) {
      this.specialCooldownTimer = Math.max(0, this.specialCooldownTimer - dt);
    }
    if (this.specialActiveTimer > 0) {
      this.specialActiveTimer = Math.max(0, this.specialActiveTimer - dt);
    }
    if (this.phaseDashCooldownTimer > 0) {
      this.phaseDashCooldownTimer = Math.max(0, this.phaseDashCooldownTimer - dt);
    }
    if (this.phaseDashActiveTimer > 0) {
      this.phaseDashActiveTimer = Math.max(0, this.phaseDashActiveTimer - dt);
    }

    // Kill-Combo Overdrive Timer Decay
    if (this.comboTimer > 0) {
      this.comboTimer = Math.max(0, this.comboTimer - dt);
      if (this.comboTimer === 0) {
        this.comboCount = 0;
        this.comboMultiplier = 1.0;
      }
    }

    // Fixed 1.0 Camera Zoom (no dizzying zoom/shake)
    this.cameraZoom = 1.0;

    // -----------------------------------------------------------
    // 100% STATIONARY COMMAND FLAGSHIP POSITIONING (NO MOVEMENT)
    // -----------------------------------------------------------
    this.standoffTime += dt;
    const w = this.canvas.width || 400;
    const h = this.canvas.height || 760;

    this.playerX = w * 0.5;
    this.playerY = h * 0.72;
    this.playerVx = 0;
    this.playerVy = 0;
    this.playerAngle = -Math.PI / 2;

    // Priority Target Lock & Automated Turret Aiming
    let targetEnemy = this.enemies.find((e) => e.id === this.autoPilotTargetEnemyId) || null;
    if (!targetEnemy) {
      targetEnemy = this.getOptimalWeaponTarget();
      this.autoPilotTargetEnemyId = targetEnemy ? targetEnemy.id : null;
    }

    let fireAngle = -Math.PI / 2;
    if (targetEnemy) {
      fireAngle = Math.atan2(targetEnemy.y - this.playerY, targetEnemy.x - this.playerX);
    }

    // Auto-Cast Skills when AUTO-CAST (isAutoPilot) is enabled
    if (this.isAutoPilot && this.enemies.length > 0) {
      if (this.specialCooldownTimer <= 0) {
        this.triggerSpecialAbility();
      }
      if (
        this.phaseDashCooldownTimer <= 0 &&
        (this.playerShield < this.playerMaxShield * 0.75 || hasBossActive)
      ) {
        this.triggerPhaseDash();
      }
    }

    // Calm, Deliberate AAA Tactical Fire Cadence (with higher per-shot impact)
    this.primaryShootCooldown -= dt;

    const baseInterval = 0.44 / Math.max(0.5, eqStats.avgFireRateMult);
    const overdriveCadence = this.comboMultiplier >= 3.0 ? 1.18 : 1.0;
    const boosterCadence = isOverclockBoosterActive ? 1.25 : 1.0;
    const specialCadence =
      this.specialActiveTimer > 0 &&
      (config.specialAbilityType === 'overdrive' ||
        config.specialAbilityType === 'singularity_storm')
        ? 1.65
        : 1.0;
    const fireRateMulti =
      (1 + (this.upgrades.fireRateLevel - 1) * 0.12) *
      this.getMilestoneMultiplier(this.upgrades.fireRateLevel) *
      paragonBonuses.fireRateMult *
      overdriveCadence *
      boosterCadence *
      specialCadence;
    const fireInterval = Math.max(0.11, baseInterval / fireRateMulti);

    if (this.primaryShootCooldown <= 0 && this.enemies.length > 0) {
      this.firePrimaryWeapons(fireAngle);
      this.primaryShootCooldown = fireInterval;
    }

    // Modular Multi-Slot Missile Launcher Subsystem
    if (this.missileCooldownTimer > 0) {
      this.missileCooldownTimer = Math.max(0, this.missileCooldownTimer - dt);
    } else if (eqStats.activeMissiles.length > 0 && this.enemies.length > 0) {
      this.fireMissileSalvo();
    }

    // Escort Drones (Tactical Wingman Formations)
    this.updateDrones(dt);

    // Passive Automated Salvage Income
    if (this.upgrades.idleCollectorLevel > 0) {
      const collectorMilestone = this.getMilestoneMultiplier(this.upgrades.idleCollectorLevel);
      const salvageBoost = this.boosters.salvage_surge.activeRemaining > 0 ? 2.0 : 1.0;
      this.idleScrapAcc +=
        this.upgrades.idleCollectorLevel *
        3.5 *
        collectorMilestone *
        salvageBoost *
        metaMults.lootMult *
        dt;
      if (this.idleScrapAcc >= 1) {
        const add = Math.floor(this.idleScrapAcc);
        this.scrap += add;
        this.idleScrapAcc -= add;
      }
    }

    // Background Auto-Upgrade System
    if (this.autoUpgradeEnabled) {
      this.autoUpgradeTimer += dt;
      if (this.autoUpgradeTimer >= 0.45) {
        this.autoUpgradeTimer = 0;
        this.runAutoUpgradeStep();
      }
    }

    // Periodic save heartbeat
    this.saveHeartbeatTimer += dt;
    if (this.saveHeartbeatTimer >= 6.0) {
      this.saveHeartbeatTimer = 0;
      this.saveProgress();
    }

    // DPS & Incoming Tank Telemetry update
    this.dpsMeasurement.timer += dt;
    if (this.dpsMeasurement.timer >= 1.0) {
      this.dpsMeasurement.currentDps = Math.round(
        this.dpsMeasurement.damageSum / this.dpsMeasurement.timer
      );
      this.dpsMeasurement.damageSum = 0;
      this.dpsMeasurement.timer = 0;
    }

    this.incomingDpsMeasurement.timer += dt;
    if (this.incomingDpsMeasurement.timer >= 1.0) {
      this.incomingDpsMeasurement.currentDps = Math.round(
        this.incomingDpsMeasurement.damageSum / this.incomingDpsMeasurement.timer
      );
      this.incomingDpsMeasurement.damageSum = 0;
      this.incomingDpsMeasurement.timer = 0;
    }

    // Standoff Wave Progression & Direct Warp-In Spawning
    this.updateWave(dt);

    // Track Daily Mission Survival Time
    dailyMissions.recordProgress('survive_time', dt);

    // Update Entities (No drifting asteroids cluttering the stationary battlefield)
    this.asteroids = [];
    this.updateProjectiles(dt);
    this.updateEnemies(dt);
    this.updateDrops(dt);
    this.updateParticles(dt);
    this.updateFloatingTexts(dt);
    this.updateStars(dt);

    // Send state to multiplayer squad
    multiplayer.sendState(
      this.playerX,
      this.playerY,
      this.playerAngle,
      this.playerHp,
      this.playerMaxHp,
      true,
      this.score,
      this.totalKills
    );

    // Stats update callback for React HUD
    this.emitStatsNow();
  }

  public emitStatsNow() {
    if (!this.onStatsUpdate) return;
    const config = getShipConfig(this.shipClassId);
    const paragonBonuses = paragonManager.getComputedBonuses();
    const eqStats = equipmentManager.getAggregatedLoadoutStats(config);
    const metaMults = metaProgression.getComputedMultipliers();
    const isAegisBoosterActive = this.boosters.aegis_field.activeRemaining > 0;
    const aegisCoreLevel = Math.max(1, this.upgrades.aiPilotLevel || 1);
    const shieldRegenMilestone = this.getMilestoneMultiplier(this.upgrades.shieldRegenLevel);
    const hullArmorMilestone = this.getMilestoneMultiplier(this.upgrades.hullArmorLevel);
    const coreMilestone = this.getMilestoneMultiplier(aegisCoreLevel);
    const aegisBoosterMult = isAegisBoosterActive ? 1.6 : 1.0;

    const fullShieldRegenRate =
      (22 +
        eqStats.totalShieldRegen +
        (this.upgrades.shieldRegenLevel - 1) * 14 +
        (aegisCoreLevel - 1) * 8) *
      (1 + (this.upgrades.shieldRegenLevel - 1) * 0.22) *
      shieldRegenMilestone *
      paragonBonuses.regenMult *
      metaMults.regenMult *
      aegisBoosterMult;

    const hullRegenRate =
      (5 +
        (this.upgrades.hullArmorLevel - 1) * 5.5 +
        (aegisCoreLevel - 1) * 6.5) *
      hullArmorMilestone *
      Math.sqrt(coreMilestone) *
      paragonBonuses.regenMult *
      metaMults.regenMult *
      aegisBoosterMult;

    const activeBoss = this.enemies.find((e) => e.type === 'boss');
    const bossShieldDronesAlive = this.enemies.filter(
      (e) => e.tacticalRole === 'boss_shield_drone'
    ).length;
    const missileEquipped = equipmentManager.loadout.missileWeapon;
    const missileItem = equipmentManager.getEquipmentItem(missileEquipped);
    const pState = paragonManager.getState();
    const activeMutator = paragonManager.getActiveMutator();

    const clearedInWave = Math.max(0, this.waveEnemyTotal - this.enemies.length);
    const armorReduction = Math.min(0.45, (this.upgrades.hullArmorLevel - 1) * 0.025);
    const aegisBarrierReduction = this.phaseDashActiveTimer > 0 ? 0.6 : 0;
    const totalMitigationPct = Math.round(
      Math.min(
        0.88,
        paragonBonuses.damageReductionPct / 100 +
          metaMults.damageReductionBonusPct / 100 +
          eqStats.damageReductionPct / 100 +
          armorReduction +
          aegisBarrierReduction
      ) * 100
    );

    const achievements = this.getCommandAchievements();
    const claimableAchievementsCount = achievements.filter((a) => a.canClaim).length;
    const pvpLeague = metaProgression.getCurrentLeague();
    const activeCmd = metaProgression.getActiveCommander();

    this.onStatsUpdate({
      sector: this.sector,
      wave: this.wave,
      waveTimer: clearedInWave,
      waveDuration: Math.max(1, this.waveEnemyTotal),
      scrap: this.scrap,
      darkMatter: this.darkMatter,
      kills: this.totalKills,
      bossesDefeated: this.totalBosses,
      damageDealt: this.totalDamageDealt,
      playerHp: Math.round(this.playerHp),
      playerMaxHp: this.playerMaxHp,
      playerShield: Math.round(this.playerShield),
      playerMaxShield: this.playerMaxShield,
      abilityCooldownRemaining: Math.max(0, this.specialCooldownTimer),
      abilityMaxCooldown: config.specialCooldown,
      isAbilityActive: this.specialActiveTimer > 0,
      abilityActiveRemaining: Math.max(0, this.specialActiveTimer),
      dps: this.dpsMeasurement.currentDps,
      incomingDps: this.incomingDpsMeasurement.currentDps,
      mitigationPct: totalMitigationPct,
      damageMitigationPct: totalMitigationPct,
      currentRunWavesCleared: pState.currentRunWavesCleared || 0,
      setBonusName: eqStats.setBonusName || 'Kein Set aktiv',
      currentBoss: activeBoss
        ? {
            name: activeBoss.name,
            hp: Math.max(0, activeBoss.hp),
            maxHp: activeBoss.maxHp,
            phase: activeBoss.bossPhase || 1,
            shieldHp: Math.round(activeBoss.shieldHp || 0),
            maxShieldHp: Math.round(activeBoss.maxShieldHp || Math.round(activeBoss.maxHp * 0.35)),
            shieldDronesAlive: bossShieldDronesAlive,
            isMiniBoss: activeBoss.isMiniBoss,
            isPvpRival: activeBoss.isPvpRival,
            staggerTimer: activeBoss.staggerTimer || 0,
            staggerRemaining: activeBoss.staggerTimer || 0,
          }
        : null,
      activeSquadSize: multiplayer.remotePilots.size + 1,
      isAutoAim: true,
      score: this.score,
      missileReady: this.missileCooldownTimer <= 0 && missileEquipped !== 'none',
      missileCooldownRemaining: Math.max(0, this.missileCooldownTimer),
      missileMaxCooldown: this.missileMaxCooldown,
      missileName: missileItem?.name || 'Missile Ordnance',
      paragonLevel: pState.paragonLevel,
      quantumShards: pState.quantumShards,
      prestigeRank: pState.prestigeRank,
      isEndlessRift: this.isEndlessRift,
      endlessDepth: pState.currentEndlessDepth,
      activeMutatorName: this.isEndlessRift ? activeMutator.name : undefined,
      isAutoPilot: this.isAutoPilot,
      autoPilotEnergyPct: 100,
      isAutoPilotOverheated: false,
      autoPilotRechargeDelayRemaining: 0,
      comboCount: this.comboCount,
      comboMultiplier: this.comboMultiplier,
      comboTimerPct: Math.min(100, (this.comboTimer / 4.2) * 100),
      phaseDashCooldownRemaining: this.phaseDashCooldownTimer,
      phaseDashMaxCooldown: this.phaseDashMaxCooldown,
      phaseDashActiveRemaining: Math.max(0, this.phaseDashActiveTimer),
      shieldRegenPerSec: Math.round(fullShieldRegenRate),
      hullRegenPerSec: Math.round(hullRegenRate),
      enemiesRemaining: this.enemies.length,
      gameSpeed: this.gameSpeed,
      bossAutoRetry: this.bossAutoRetry,
      autoUpgradeEnabled: this.autoUpgradeEnabled,
      pendingOfflineReward: this.pendingOfflineReward,
      activeBoosters: this.getActiveBoosterStates(),
      achievements,
      claimableAchievementsCount,
      activePvpMatch: this.activePvpOpponent
        ? {
            opponentName: this.activePvpOpponent.callsign,
            guildTag: this.activePvpOpponent.guildTag,
            rewardTrophies: this.activePvpOpponent.rewardTrophies,
            rewardMedals: this.activePvpOpponent.rewardMedals,
          }
        : null,
      pvpLeagueName: pvpLeague.name,
      pvpLeagueColor: pvpLeague.color,
      pvpTrophies: metaProgression.pvpTrophies,
      arenaTickets: metaProgression.arenaTickets,
      honorMedals: metaProgression.honorMedals,
      activeCommanderName: activeCmd.name,
      damageFilter: metaProgression.damageFilter,
      metaClaimableCount: metaProgression.getClaimableNotificationCount(),
    });
  }

  public cycleGameSpeed() {
    this.gameSpeed = this.gameSpeed === 1 ? 2 : this.gameSpeed === 2 ? 3 : 1;
    sound.playUiClick();
    this.saveProgress();
    this.addFloatingText(
      `KAMPF-TEMPO: ${this.gameSpeed}x`,
      this.playerX,
      this.playerY - 40,
      this.gameSpeed === 3 ? '#f59e0b' : this.gameSpeed === 2 ? '#22d3ee' : '#cbd5e1',
      true
    );
    this.emitStatsNow();
  }

  public toggleBossAutoRetry() {
    this.bossAutoRetry = !this.bossAutoRetry;
    sound.playUiClick();
    this.saveProgress();
    this.addFloatingText(
      this.bossAutoRetry ? 'BOSS-AUTO: AKTIV' : 'FARM-MODUS (SICHER)',
      this.playerX,
      this.playerY - 40,
      this.bossAutoRetry ? '#f43f5e' : '#10b981',
      true
    );
    this.emitStatsNow();
  }

  public challengeBossNow() {
    if (this.isBossWave) return;
    this.bossAutoRetry = true;
    this.enemies = [];
    this.projectiles = [];
    const displayWave = ((this.wave - 1) % 10) + 1;
    if (displayWave < 5) {
      this.wave += 5 - displayWave;
    } else if (displayWave < 10) {
      this.wave += 10 - displayWave;
    }
    this.waveEnemyTotal = 0;
    this.waveSpawnCooldown = 0.15;
    sound.playUiClick();
    this.saveProgress();
    this.emitStatsNow();
  }

  public toggleAutoUpgrade() {
    this.autoUpgradeEnabled = !this.autoUpgradeEnabled;
    sound.playUiClick();
    this.saveProgress();
    this.addFloatingText(
      this.autoUpgradeEnabled ? 'AUTO-UPGRADE: AKTIV' : 'AUTO-UPGRADE: AUS',
      this.playerX,
      this.playerY - 40,
      this.autoUpgradeEnabled ? '#fbbf24' : '#94a3b8',
      true
    );
    this.emitStatsNow();
  }

  private runAutoUpgradeStep() {
    const priorityOrder: Array<keyof PlayerUpgrades> = [
      'shieldCapacityLevel',
      'shieldRegenLevel',
      'hullArmorLevel',
      'aiPilotLevel',
      'damageLevel',
      'fireRateLevel',
      'weaponLevel',
      'critChanceLevel',
      'critDamageLevel',
      'droneCountLevel',
      'dronePowerLevel',
      'idleCollectorLevel',
      'magnetLevel',
    ];

    let bestKey: keyof PlayerUpgrades | null = null;
    let lowestCost = Infinity;

    for (const key of priorityOrder) {
      if (this.isUpgradeMaxed(key)) continue;
      const cost = this.getUpgradeCost(key);
      if (cost <= this.scrap && cost < lowestCost) {
        lowestCost = cost;
        bestKey = key;
      }
    }

    if (bestKey && this.scrap >= lowestCost) {
      const oldLevel = this.upgrades[bestKey] ?? 1;
      const newLevel = oldLevel + 1;
      this.scrap -= lowestCost;
      this.upgrades[bestKey] = newLevel;
      this.applyUpgradesToShip();
      this.saveProgress();

      if (Math.floor(newLevel / 10) > Math.floor(oldLevel / 10)) {
        sound.playUpgrade();
        this.addFloatingText(
          `MEILENSTEIN LV.${Math.floor(newLevel / 10) * 10}: +35% SYNERGIE!`,
          this.playerX,
          this.playerY - 46,
          '#fbbf24',
          true
        );
      }
    }
  }

  public claimOfflineRewards(multiplier: number = 1): boolean {
    if (!this.pendingOfflineReward) return false;
    const scrapGain = Math.round(this.pendingOfflineReward.scrapEarned * multiplier);
    const dmGain = Math.round(this.pendingOfflineReward.darkMatterEarned * multiplier);
    this.scrap += scrapGain;
    this.darkMatter += dmGain;
    this.pendingOfflineReward = null;
    sound.playUpgrade();
    this.saveProgress();
    this.addFloatingText(
      `AFK-BEUTE: +${formatCompactNumber(scrapGain)} SCRAP`,
      this.playerX,
      this.playerY - 44,
      '#fbbf24',
      true
    );
    return true;
  }

  public toggleAutoPilot() {
    this.isAutoPilot = !this.isAutoPilot;
    sound.playUiClick();
    this.addFloatingText(
      this.isAutoPilot ? 'AUTO-SKILLS: AKTIV' : 'MANUELLE SKILLS',
      this.playerX,
      this.playerY - 38,
      this.isAutoPilot ? '#22d3ee' : '#94a3b8',
      true
    );
  }

  public triggerPhaseDash() {
    if (this.phaseDashCooldownTimer > 0) return;
    this.phaseDashCooldownTimer = this.phaseDashMaxCooldown;
    this.phaseDashActiveTimer = 3.8; // 3.8s of Aegis Deflector Barrier Overcharge

    // Instant 35% Shield Capacity Surge + Barrier Reflection
    const surgeAmount = Math.round(this.playerMaxShield * 0.35);
    this.playerShield = Math.min(this.playerMaxShield, this.playerShield + surgeAmount);
    this.shieldRegenDelayTimer = 0;

    sound.playEmp(this.getPan(this.playerX));
    this.addParticles(this.playerX, this.playerY, 22, '#22d3ee', 'ring');
    this.addFloatingText(
      `AEGIS BARRIERE +${surgeAmount} SCHILD!`,
      this.playerX,
      this.playerY - 32,
      '#22d3ee',
      true
    );
  }

  private pointToSegmentDistance(
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq <= 0.0001) return Math.hypot(px - x1, py - y1);
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    return Math.hypot(px - projX, py - projY);
  }

  /**
   * Evaluates whether weapons fired from (fromX, fromY) have an unobstructed
   * Line-of-Sight (LOS) corridor to targetEnemy without being absorbed by
   * asteroids, intervening non-target hulls, or frontal deflector shields.
   */
  public hasWeaponLineOfSight(
    fromX: number,
    fromY: number,
    targetEnemy: Enemy
  ): { clear: boolean; penalty: number } {
    const primaryType = equipmentManager.loadout.primaryWeapon;
    const isPiercing = primaryType === 'tachyon_lance';
    const corridorWidth = primaryType === 'scatter_flak' ? 18 : 12;
    let penalty = 0;

    // 1. Check asteroid obstructions along the firing vector
    for (const ast of this.asteroids) {
      if (ast.y < -ast.radius) continue;
      const distToRay = this.pointToSegmentDistance(
        ast.x,
        ast.y,
        fromX,
        fromY,
        targetEnemy.x,
        targetEnemy.y
      );
      if (distToRay < ast.radius + corridorWidth) {
        penalty += 240;
      }
    }

    // 2. Check intervening non-target enemies blocking non-piercing projectiles
    if (!isPiercing) {
      for (const other of this.enemies) {
        if (other.id === targetEnemy.id || other.y < 0) continue;
        const distToRay = this.pointToSegmentDistance(
          other.x,
          other.y,
          fromX,
          fromY,
          targetEnemy.x,
          targetEnemy.y
        );
        if (distToRay < other.radius + corridorWidth * 0.75) {
          penalty += other.shieldHp && other.shieldHp > 0 ? 150 : 65;
        }
      }
    }

    // 3. Check frontal directional shield arc on the target enemy itself
    // Shielded enemies project their deflector arc downward (centered at +PI/2).
    // Flanking laterally reduces shield deflection and establishes superior LOS.
    if (targetEnemy.shieldHp && targetEnemy.shieldHp > 0) {
      const incomingAngleFromEnemy = Math.atan2(fromY - targetEnemy.y, fromX - targetEnemy.x);
      const frontalAngleDiff = Math.abs(incomingAngleFromEnemy - Math.PI / 2);
      const halfArc = (targetEnemy.shieldArc || Math.PI * 0.5) * 0.5;
      if (frontalAngleDiff < halfArc * 0.85) {
        penalty += 95;
      }
    }

    return {
      clear: penalty < 100,
      penalty,
    };
  }

  /**
   * Selects the optimal weapon target prioritizing high-threat enemies
   * that currently have (or can be flanked for) clear weapon Line-of-Sight.
   */
  private getOptimalWeaponTarget(fromX: number = this.playerX, fromY: number = this.playerY): Enemy | null {
    let bestEnemy: Enemy | null = null;
    let bestScore = -Infinity;

    for (const e of this.enemies) {
      if (e.y < -15) continue;
      const dist = Math.hypot(e.x - fromX, e.y - fromY);
      const los = this.hasWeaponLineOfSight(fromX, fromY, e);

      let threatBonus = 0;
      if (e.tacticalRole === 'boss_shield_drone') threatBonus = 620;
      else if (e.type === 'boss') threatBonus = 520;
      else if (e.tacticalRole === 'healer') threatBonus = 360;
      else if (e.tacticalRole === 'sniper') threatBonus = e.isTelegraphing ? 450 : 340;
      else if (e.tacticalRole === 'commander') threatBonus = 320;
      else if (e.type === 'stalker_kamikaze') threatBonus = e.isTelegraphing ? 420 : 310;
      else if (e.isElite) threatBonus = 260;
      else if (e.type === 'mortar') threatBonus = 210;
      else if (e.type === 'frigate') threatBonus = 150;
      else threatBonus = 90;

      // Prefer finishing low-HP enemies that are in clear LOS
      const finishBonus = (1 - e.hp / Math.max(1, e.maxHp)) * 85;
      const score = threatBonus + finishBonus - dist * 0.55 - los.penalty;

      if (score > bestScore) {
        bestScore = score;
        bestEnemy = e;
      }
    }

    return bestEnemy || this.getNearestEnemy(fromX, fromY);
  }

  // -----------------------------------------------------------
  // MULTI-SLOT WEAPONS, MISSILES, DRONES & SPECIAL ABILITIES
  // -----------------------------------------------------------
  private firePrimaryWeapons(angle: number) {
    const config = getShipConfig(this.shipClassId);
    const eqStats = equipmentManager.getAggregatedLoadoutStats(config);
    const paragonBonuses = paragonManager.getComputedBonuses();
    const metaBonuses = metaProgression.getComputedBonuses();
    const mutator = paragonManager.getActiveMutator();

    const overclockMult = this.boosters.overclock.activeRemaining > 0 ? 1.5 : 1.0;
    const evoWeaponBonus = 1 + (this.upgrades.weaponLevel - 1) * 0.35;

    // Compensate calmer AAA fire cadence with 1.85x higher per-volley damage + Set Synergy + Overclock + Meta Bonuses
    const dmgMulti =
      1.85 *
      (1 + (this.upgrades.damageLevel - 1) * 0.2) *
      evoWeaponBonus *
      this.getMilestoneMultiplier(this.upgrades.damageLevel) *
      this.getMilestoneMultiplier(this.upgrades.weaponLevel) *
      (1 + this.tech.plasmaOvercharge * 0.15) *
      (eqStats.setDamageMult || 1.0) *
      overclockMult *
      paragonBonuses.allDamageMult *
      metaBonuses.allDamageMult;

    const solarFlareBonus =
      this.isEndlessRift && mutator.id === 'solar_flare' ? 0.45 : 0;
    const critDamageMulti =
      (1.5 +
        (this.upgrades.critDamageLevel - 1) * 0.25 +
        paragonBonuses.critDamageBonusPct / 100 +
        metaBonuses.critDamageBonusPct / 100 +
        solarFlareBonus) *
      this.getMilestoneMultiplier(this.upgrades.critDamageLevel);

    const laserCosmetic = cosmetics.getEquippedLaserItem();
    const pan = this.getPan(this.playerX);

    const activeLasers =
      eqStats.activeLasers.length > 0
        ? eqStats.activeLasers
        : [equipmentManager.getEquipmentItem('laser_01')!];
    // Consolidate multi-slot firing into at most 4 clean visual hardpoint streams so the screen never clutters
    const rawSlotCount = activeLasers.length;
    const visualStreamCount = Math.min(4, rawSlotCount);
    const streamConsolidationMult = rawSlotCount / Math.max(1, visualStreamCount);

    const fx = Math.cos(angle);
    const fy = Math.sin(angle);
    const rx = -Math.sin(angle);
    const ry = Math.cos(angle);

    if (this.projectiles.length > 140) {
      this.projectiles.splice(0, 25);
    }

    let anyCrit = false;
    let highestTier = 1;
    const playedStyles = new Set<string>();
    const evoRadiusBoost = Math.min(4.5, Math.floor(this.upgrades.weaponLevel / 3) * 0.85);

    for (let sIdx = 0; sIdx < visualStreamCount; sIdx++) {
      const laserItem = activeLasers[sIdx % activeLasers.length];
      const starMult = equipmentManager.getStarMultiplier(laserItem.id);
      highestTier = Math.max(highestTier, laserItem.tier);

      const critChance =
        0.05 +
        (this.upgrades.critChanceLevel - 1) * 0.03 +
        metaBonuses.critChanceBonusPct / 100 +
        (laserItem.critBonus || 0);
      const isCrit = Math.random() < critChance;
      if (isCrit) anyCrit = true;

      const normalizedPos =
        visualStreamCount === 1 ? 0 : (sIdx / (visualStreamCount - 1)) * 2 - 1;
      const lateralOffset = normalizedPos * Math.min(22, 6 + visualStreamCount * 3.5);
      const forwardOffset = 20 - Math.abs(normalizedPos) * 5;

      const hardpointX = this.playerX + fx * forwardOffset + rx * lateralOffset;
      const hardpointY = this.playerY + fy * forwardOffset + ry * lateralOffset;

      const beamStyle = laserItem.visualPattern || 'pulse';
      if (playedStyles.size < 2 && (!playedStyles.has(beamStyle) || sIdx === visualStreamCount - 1)) {
        playedStyles.add(beamStyle);
        const hardpointPan = Math.max(
          -1,
          Math.min(1, this.getPan(hardpointX) + normalizedPos * 0.25)
        );
        sound.playWeaponFire(beamStyle, {
          pan: hardpointPan,
          isCrit,
          tier: laserItem.tier,
        });
      }

      // Consolidated Evo-Laser: 1 clean hyper-beam per hardpoint stream (no bullet spam)
      const slotDpsShare =
        (config.baseDps / Math.max(1, Math.pow(rawSlotCount, 0.52))) *
        streamConsolidationMult *
        (laserItem.damageMult || 1) *
        starMult *
        0.38 *
        dmgMulti *
        (isCrit ? critDamageMulti : 1);

      const speed =
        beamStyle === 'lance' || beamStyle === 'omega'
          ? 920
          : beamStyle === 'flak'
            ? 700
            : 820;

      const primaryColor = isCrit
        ? '#fef08a'
        : laserCosmetic.id !== 'laser-default' && laserCosmetic.primaryColor
          ? laserCosmetic.primaryColor
          : laserItem.color || config.bulletColor;

      const shotAngle = angle + normalizedPos * 0.015;

      this.projectiles.push({
        id: Math.random().toString(),
        x: hardpointX,
        y: hardpointY,
        vx: Math.cos(shotAngle) * speed,
        vy: Math.sin(shotAngle) * speed,
        damage: slotDpsShare,
        radius:
          (isCrit
            ? 5.5 + Math.min(3.5, laserItem.tier * 0.14)
            : 4.0 + Math.min(2.8, laserItem.tier * 0.12)) + evoRadiusBoost,
        color: primaryColor,
        secondaryColor: laserItem.secondaryColor,
        isPlayer: true,
        isCrit,
        pierce: laserItem.pierceCount && laserItem.pierceCount > 0 ? laserItem.pierceCount : undefined,
        blastRadius: laserItem.blastRadius && laserItem.blastRadius > 0 ? laserItem.blastRadius : undefined,
        weaponTier: Math.min(20, laserItem.tier + Math.floor(this.upgrades.weaponLevel / 4)),
        beamStyle,
        lifetime: 2.0,
      });
    }

    const fireSoundMode = highestTier >= 12 ? 'heavy' : highestTier >= 5 ? 'plasma' : 'light';
    if (playedStyles.size === 0) {
      sound.playWeaponFire(fireSoundMode, { pan, isCrit: anyCrit, tier: highestTier });
    }
    haptics.vibrateWeaponFire(anyCrit ? 'crit' : fireSoundMode);

    multiplayer.broadcastLaser(this.playerX, this.playerY, angle, config.id, laserCosmetic.primaryColor);
  }

  public fireMissileSalvo() {
    if (this.missileCooldownTimer > 0) return;
    const config = getShipConfig(this.shipClassId);
    const eqStats = equipmentManager.getAggregatedLoadoutStats(config);
    if (eqStats.activeMissiles.length === 0) return;

    haptics.vibrateWeaponFire('missile');
    const paragonBonuses = paragonManager.getComputedBonuses();
    const metaBonuses = metaProgression.getComputedBonuses();
    const dmgScale =
      (1 + (this.upgrades.damageLevel - 1) * 0.2) *
      paragonBonuses.allDamageMult *
      metaBonuses.allDamageMult *
      Math.max(1, config.baseDps / 95);

    this.missileMaxCooldown = Math.max(3.2, 5.8 - eqStats.activeMissiles.length * 0.35);
    this.missileCooldownTimer = this.missileMaxCooldown;

    eqStats.activeMissiles.forEach((missileItem, slotIdx) => {
      const mType = missileItem.id as MissileWeaponId;
      const starMult = equipmentManager.getStarMultiplier(missileItem.id);
      const sideOffset =
        (slotIdx - (eqStats.activeMissiles.length - 1) / 2) * 18;
      if (slotIdx < 2) {
        sound.playMissileLaunch(mType, this.getPan(this.playerX + sideOffset));
      }
      const nearest = this.getNearestEnemy();

      if (mType === 'micro_swarm') {
        for (let i = 0; i < 3; i++) {
          const angleOffset = (i - 1) * 0.25;
          const launchAngle = -Math.PI / 2 + angleOffset;
          this.projectiles.push({
            id: Math.random().toString(),
            x: this.playerX + sideOffset,
            y: this.playerY - 8,
            vx: Math.cos(launchAngle) * 370,
            vy: Math.sin(launchAngle) * 370,
            damage: 52 * dmgScale * starMult,
            radius: 5,
            color: '#38bdf8',
            isPlayer: true,
            isMissile: true,
            missileType: 'micro_swarm',
            homingTargetId: nearest?.id,
            lifetime: 3.5,
          });
        }
      } else if (mType === 'heavy_torpedo') {
        this.projectiles.push({
          id: Math.random().toString(),
          x: this.playerX + sideOffset,
          y: this.playerY - 22,
          vx: sideOffset * 1.5,
          vy: -330,
          damage: 240 * dmgScale * starMult,
          radius: 8,
          color: '#f97316',
          isPlayer: true,
          isMissile: true,
          missileType: 'heavy_torpedo',
          homingTargetId: nearest?.id,
          blastRadius: 95,
          lifetime: 4.0,
        });
      } else if (mType === 'emp_disruptor') {
        this.projectiles.push({
          id: Math.random().toString(),
          x: this.playerX + sideOffset,
          y: this.playerY - 20,
          vx: sideOffset * 1.5,
          vy: -390,
          damage: 135 * dmgScale * starMult,
          radius: 7,
          color: '#a855f7',
          isPlayer: true,
          isMissile: true,
          missileType: 'emp_disruptor',
          homingTargetId: nearest?.id,
          blastRadius: 135,
          lifetime: 3.5,
        });
      } else if (mType === 'omega_nova_warhead') {
        this.projectiles.push({
          id: Math.random().toString(),
          x: this.playerX + sideOffset,
          y: this.playerY - 24,
          vx: sideOffset * 1.2,
          vy: -420,
          damage: 580 * dmgScale * starMult,
          radius: 9.5,
          color: '#fbbf24',
          secondaryColor: '#f43f5e',
          isPlayer: true,
          isMissile: true,
          missileType: 'omega_nova_warhead',
          homingTargetId: nearest?.id,
          blastRadius: 185,
          lifetime: 4.2,
        });
      }
    });
  }

  private updateDrones(dt: number) {
    const config = getShipConfig(this.shipClassId);
    const eqStats = equipmentManager.getAggregatedLoadoutStats(config);
    const activeDrones = eqStats.activeDrones;
    const totalDrones = Math.min(
      18,
      activeDrones.length + Math.max(0, this.upgrades.droneCountLevel)
    );
    if (totalDrones <= 0) return;

    while (this.droneFormationSlots.length < totalDrones) {
      this.droneFormationSlots.push({ x: this.playerX, y: this.playerY, vx: 0, vy: 0 });
    }

    const nowSec = Date.now() * 0.0018;
    const paragonBonuses = paragonManager.getComputedBonuses();
    const metaBonuses = metaProgression.getComputedBonuses();
    const powerScale =
      (1 + (this.upgrades.dronePowerLevel - 1) * 0.25) *
      this.getMilestoneMultiplier(this.upgrades.dronePowerLevel) *
      paragonBonuses.allDamageMult *
      metaBonuses.allDamageMult *
      metaBonuses.droneDamageMult;

    for (let i = 0; i < totalDrones; i++) {
      const droneItem =
        activeDrones[i % Math.max(1, activeDrones.length)] ||
        equipmentManager.getItem('drone_01')!;
      const starMult = equipmentManager.getStarMultiplier(droneItem.id);

      // Dual-ring orbital escort formation around player ship
      const isOuterRing = i >= 8;
      const ringIndex = isOuterRing ? i - 8 : i;
      const ringTotal = isOuterRing ? Math.max(1, totalDrones - 8) : Math.min(8, totalDrones);
      const orbitRadius = isOuterRing ? 76 : 48;
      const orbitAngle =
        (ringIndex / ringTotal) * Math.PI * 2 + nowSec * (isOuterRing ? -0.85 : 1.15);

      const targetX = this.playerX + Math.cos(orbitAngle) * orbitRadius;
      const targetY = this.playerY + Math.sin(orbitAngle) * orbitRadius;

      const slot = this.droneFormationSlots[i];
      slot.x += (targetX - slot.x) * Math.min(1, dt * 14);
      slot.y += (targetY - slot.y) * Math.min(1, dt * 14);

      const role = droneItem.droneRole || 'striker';

      // Combat firing (striker, orbital, omni, or high-tier support drones)
      if (role === 'striker' || role === 'orbital' || role === 'omni' || droneItem.tier >= 3) {
        this.droneShootTimers[i] = (this.droneShootTimers[i] || 0) - dt;
        if (this.droneShootTimers[i] <= 0) {
          const nearest = this.getNearestEnemy(slot.x, slot.y);
          if (nearest) {
            const aimAngle = Math.atan2(nearest.y - slot.y, nearest.x - slot.x);
            const droneDmg = (droneItem.droneDamage || 16) * powerScale * starMult;
            this.projectiles.push({
              id: Math.random().toString(),
              x: slot.x,
              y: slot.y,
              vx: Math.cos(aimAngle) * 740,
              vy: Math.sin(aimAngle) * 740,
              damage: droneDmg,
              radius: 3 + Math.min(2.5, droneItem.tier * 0.1),
              color: droneItem.color || '#38bdf8',
              secondaryColor: droneItem.secondaryColor,
              isPlayer: true,
              pierce: droneItem.tier >= 14 ? 2 : undefined,
              weaponTier: droneItem.tier,
              beamStyle: droneItem.tier >= 15 ? 'lance' : 'pulse',
              lifetime: 1.8,
            });
            if (i === 0) {
              const droneSoundStyle =
                droneItem.tier >= 15
                  ? 'lance'
                  : droneItem.tier >= 9
                    ? 'helix'
                    : 'twin_plasma';
              sound.playWeaponFire(droneSoundStyle, {
                pan: this.getPan(slot.x),
                tier: droneItem.tier,
              });
            }
          }
          const fireRate = droneItem.droneFireRate || 1.8;
          this.droneShootTimers[i] = Math.max(0.2, 1 / fireRate);
        }
      }

      // Nanite / Omni: continuous hull & shield restoration
      if (role === 'nanite' || role === 'omni') {
        const healRate = (4 + droneItem.tier * 2.5) * starMult * dt;
        this.playerHp = Math.min(this.playerMaxHp, this.playerHp + healRate);
        this.playerShield = Math.min(this.playerMaxShield, this.playerShield + healRate * 1.4);
        if (Math.random() < 0.06) {
          this.addParticles(slot.x, slot.y, 1, droneItem.color || '#10b981', 'spark');
        }
      }
    }
  }

  public triggerSpecialAbility() {
    const config = getShipConfig(this.shipClassId);
    if (this.specialCooldownTimer > 0) return;

    this.specialCooldownTimer = config.specialCooldown;
    this.specialActiveTimer = 6;
    dailyMissions.recordProgress('trigger_special', 1);
    haptics.vibrateCombatEvent('special');

    const pan = this.getPan(this.playerX);
    const abilityType = config.specialAbilityType || 'overdrive';
    // Exponential ability damage scaling matching the 50-ship progression
    const abilityDamageScale =
      Math.pow(1.16, config.tier - 1) *
      (1 + (this.upgrades.damageLevel - 1) * 0.2) *
      metaProgression.getComputedBonuses().allDamageMult;

    if (abilityType === 'overdrive') {
      this.playerShield = this.playerMaxShield;
      this.addFloatingText(`${config.specialName.toUpperCase()}!`, this.playerX, this.playerY - 20, '#00f2fe', true);
      this.addParticles(this.playerX, this.playerY, 24, '#00f2fe');
      sound.playUpgrade();
    } else if (abilityType === 'aegis') {
      this.playerShield = this.playerMaxShield;
      this.addFloatingText(`${config.specialName.toUpperCase()}!`, this.playerX, this.playerY - 20, '#10b981', true);
      this.addParticles(this.playerX, this.playerY, 28, '#10b981', 'ring');
      sound.playEmp(pan);
    } else if (abilityType === 'emp_nova') {
      const novaDmg = Math.round(350 * abilityDamageScale);
      this.addFloatingText(`${config.specialName.toUpperCase()}!`, this.playerX, this.playerY - 20, '#c084fc', true);
      sound.playEmp(pan);
      this.enemies.forEach((enemy) => {
        enemy.hp -= novaDmg;
        enemy.shootTimer += 3.2; // Stun
        this.addParticles(enemy.x, enemy.y, 8, '#c084fc');
        this.addFloatingText(`-${formatCompactNumber(novaDmg)}`, enemy.x, enemy.y, '#c084fc', true);
      });
    } else if (abilityType === 'orbital_lance') {
      const lanceDmg = Math.round(650 * abilityDamageScale);
      this.addFloatingText(`${config.specialName.toUpperCase()}!`, this.playerX, this.playerY - 20, '#f59e0b', true);
      sound.playExplosion('boss', pan);

      this.enemies.forEach((enemy) => {
        if (Math.abs(enemy.x - this.playerX) < 140 && enemy.y < this.playerY) {
          enemy.hp -= lanceDmg;
          this.addParticles(enemy.x, enemy.y, 16, '#fde047');
          this.addFloatingText(`-${formatCompactNumber(lanceDmg)}`, enemy.x, enemy.y, '#f59e0b', true);
        }
      });
    } else if (abilityType === 'singularity_storm') {
      const stormDmg = Math.round(920 * abilityDamageScale);
      this.playerShield = this.playerMaxShield;
      this.addFloatingText(`${config.specialName.toUpperCase()}!`, this.playerX, this.playerY - 20, '#f43f5e', true);
      sound.playExplosion('boss', pan);
      this.enemies.forEach((enemy) => {
        enemy.hp -= stormDmg;
        enemy.shootTimer += 2.5;
        this.addParticles(enemy.x, enemy.y, 14, '#f43f5e', 'ring');
        this.addFloatingText(`-${formatCompactNumber(stormDmg)}`, enemy.x, enemy.y, '#fbbf24', true);
      });
    }
  }

  // -----------------------------------------------------------
  // 10-WAVE CHAPTER STRUCTURE & DIRECT WARP-IN STANDOFF FORMATION
  // -----------------------------------------------------------
  private updateWave(dt: number) {
    if (this.isPvpArenaMatch) {
      return;
    }

    this.waveTimer += dt;
    this.waveSpawnCooldown -= dt;

    if (this.enemies.length > 0) {
      return;
    }

    // All enemies in the current wave have been defeated!
    if (this.waveEnemyTotal > 0 && this.waveTimer > 0.35) {
      this.waveEnemyTotal = 0;
      this.waveSpawnCooldown = 0.45; // Crisp 0.45s pause before next wave warps in directly on grid

      // Record wave cleared for current-run Prestige milestone requirement
      paragonManager.recordWaveCleared(this.sector);

      const displayWave = ((this.wave - 1) % 10) + 1;

      if (displayWave === 10) {
        // Wave 10 Chapter Boss defeated -> Advance to Next Sector!
        this.isBossWave = false;
        if (!this.isEndlessRift) {
          this.sector++;
          this.wave = 1;
          if (this.onSectorCleared) this.onSectorCleared(this.sector);
        } else {
          this.wave++;
        }
      } else {
        this.isBossWave = false;
        // Hold before Wave 5 (Mini-Boss) or Wave 10 (Chapter Boss) if in Safe Farm Mode
        if ((displayWave === 4 || displayWave === 9) && !this.bossAutoRetry) {
          // Stay on current farming wave until player toggles BOSS-AUTO or clicks BOSS STARTEN
        } else {
          this.wave++;
        }
      }
      return;
    }

    // Spawn the next complete Standoff Wave Formation directly onto fixed grid slots
    if (this.waveSpawnCooldown <= 0) {
      this.waveTimer = 0;
      const displayWave = ((this.wave - 1) % 10) + 1;
      if (displayWave === 10) {
        this.isBossWave = true;
        this.spawnBoss(false);
        this.waveEnemyTotal = this.enemies.length;
      } else if (displayWave === 5) {
        this.isBossWave = true;
        this.spawnBoss(true);
        this.waveEnemyTotal = this.enemies.length;
      } else {
        this.isBossWave = false;
        this.spawnProceduralWavePack();
        this.waveEnemyTotal = this.enemies.length;
      }
    }
  }

  private spawnProceduralWavePack() {
    const riftScaling = this.isEndlessRift
      ? paragonManager.getEndlessRiftScaling(this.endlessRiftDepth, this.wave)
      : null;
    const activeMutator = paragonManager.getActiveMutator();

    const displayWave = ((this.wave - 1) % 10) + 1;
    const sectorExpScale =
      Math.pow(1.26, Math.max(0, this.sector - 1)) *
      Math.pow(1.09, Math.max(0, displayWave - 1));
    const hpMult = riftScaling ? riftScaling.enemyHpMult : sectorExpScale;
    const shieldMult = riftScaling ? riftScaling.enemyShieldMult : sectorExpScale;
    const fireRateMult = riftScaling
      ? riftScaling.enemyFireRateMult * 0.72
      : Math.min(2.0, Math.pow(1.05, Math.max(0, this.sector - 1)) * Math.pow(1.02, Math.max(0, displayWave - 1)));
    const rewardMult = riftScaling
      ? riftScaling.lootYieldMult
      : Math.pow(1.25, Math.max(0, this.sector - 1)) * Math.pow(1.08, Math.max(0, displayWave - 1));
    const eliteChance = riftScaling
      ? riftScaling.eliteSpawnChance
      : Math.min(0.75, 0.2 + (this.sector - 1) * 0.05 + displayWave * 0.02);
    const isFortifiedArmada =
      this.isEndlessRift && (activeMutator.id === 'aegis_armada' || this.endlessRiftDepth >= 5);

    const w = this.canvas.width || 400;
    const h = this.canvas.height || 760;
    const marginX = 56;
    const usableW = Math.max(180, w - marginX * 2);

    // Fixed, Stationary 2-Row Tactical Grid in the clear arena:
    const backRowBaseY = Math.max(195, Math.round(h * 0.255));
    const frontRowBaseY = Math.max(275, Math.round(h * 0.36));
    const backRowCount = Math.min(4, 2 + Math.floor((displayWave + this.sector) / 4));
    const frontRowCount = Math.min(4, 2 + Math.floor(displayWave / 3));

    // 1. Spawn Back Row directly at (formX, formY) with holographic warp-in flash
    for (let i = 0; i < backRowCount; i++) {
      const normX = backRowCount === 1 ? 0.5 : i / (backRowCount - 1);
      const formX = marginX + normX * usableW;
      const formY = backRowBaseY;
      const centerIndex = Math.floor(backRowCount / 2);

      let tacticalRole: Enemy['tacticalRole'] = 'standard';
      if (i === 0 && backRowCount >= 2) {
        tacticalRole = 'healer';
      } else if (i === backRowCount - 1 && backRowCount >= 2 && (displayWave >= 2 || this.sector >= 2)) {
        tacticalRole = 'sniper';
      } else if (i === centerIndex) {
        tacticalRole = 'commander';
      }

      const isElite = tacticalRole === 'commander' || Math.random() < eliteChance;

      if (tacticalRole === 'healer') {
        const healerHp = Math.round(165 * hpMult);
        const healerShield = Math.round(70 * shieldMult);
        this.enemies.push({
          id: Math.random().toString(),
          type: 'frigate',
          name: 'Aegis Schild-Heiler',
          x: formX,
          y: formY,
          formationX: formX,
          formationY: formY,
          vx: 0,
          vy: 0,
          hp: healerHp,
          maxHp: healerHp,
          radius: 21,
          color: '#10b981',
          glowColor: '#34d399',
          scoreValue: Math.round(190 * rewardMult),
          scrapValue: Math.round(45 * rewardMult),
          darkMatterValue: 3,
          shootCooldown: Math.max(1.4, 2.4 / fireRateMult),
          shootTimer: 1.4,
          patternTimer: 0,
          telegraphTimer: 0,
          isTelegraphing: false,
          isElite: true,
          shieldArc: Math.PI * 0.65,
          shieldHp: healerShield,
          maxShieldHp: healerShield,
          tacticalRole: 'healer',
          healBeamTimer: 0,
          warpInTimer: 0.3,
        });
      } else if (tacticalRole === 'sniper') {
        const sniperHp = Math.round(150 * hpMult);
        this.enemies.push({
          id: Math.random().toString(),
          type: 'stalker_kamikaze',
          name: 'Void Laser-Sniper',
          x: formX,
          y: formY,
          formationX: formX,
          formationY: formY,
          vx: 0,
          vy: 0,
          hp: sniperHp,
          maxHp: sniperHp,
          radius: 19,
          color: '#f43f5e',
          glowColor: '#fb7185',
          scoreValue: Math.round(210 * rewardMult),
          scrapValue: Math.round(48 * rewardMult),
          darkMatterValue: 4,
          shootCooldown: Math.max(2.1, 3.4 / fireRateMult),
          shootTimer: 1.6,
          patternTimer: 0,
          telegraphTimer: 1.5,
          isTelegraphing: true,
          isElite: true,
          tacticalRole: 'sniper',
          warpInTimer: 0.3,
        });
      } else if (tacticalRole === 'commander') {
        const cmdHp = Math.round(270 * hpMult);
        const cmdShield = Math.round(150 * shieldMult);
        this.enemies.push({
          id: Math.random().toString(),
          type: 'mortar',
          name: 'Flotten-Kommandant',
          x: formX,
          y: formY,
          formationX: formX,
          formationY: formY,
          vx: 0,
          vy: 0,
          hp: cmdHp,
          maxHp: cmdHp,
          radius: 26,
          color: '#f59e0b',
          glowColor: '#fbbf24',
          scoreValue: Math.round(320 * rewardMult),
          scrapValue: Math.round(88 * rewardMult),
          darkMatterValue: 6,
          shootCooldown: Math.max(1.5, 2.8 / fireRateMult),
          shootTimer: 1.3,
          patternTimer: 0,
          telegraphTimer: 0,
          isTelegraphing: false,
          isElite: true,
          shieldArc: Math.PI * 0.82,
          shieldHp: cmdShield,
          maxShieldHp: cmdShield,
          tacticalRole: 'commander',
          warpInTimer: 0.3,
        });
      } else {
        const frigateHp = Math.round(145 * hpMult * (isElite ? 1.65 : 1));
        const frigateShield = isFortifiedArmada ? Math.round(75 * shieldMult) : undefined;
        this.enemies.push({
          id: Math.random().toString(),
          type: 'frigate',
          name: isElite ? 'Rift Aegis Frigate' : 'Iron Frigate',
          x: formX,
          y: formY,
          formationX: formX,
          formationY: formY,
          vx: 0,
          vy: 0,
          hp: frigateHp,
          maxHp: frigateHp,
          radius: 21,
          color: isElite ? '#06b6d4' : '#3b82f6',
          glowColor: isElite ? '#22d3ee' : '#60a5fa',
          scoreValue: Math.round(130 * rewardMult),
          scrapValue: Math.round(30 * rewardMult * (isElite ? 1.5 : 1)),
          darkMatterValue: isElite ? 3 : 2,
          shootCooldown: Math.max(1.4, 2.6 / fireRateMult),
          shootTimer: (0.9 + i * 0.3) / fireRateMult,
          patternTimer: 0,
          telegraphTimer: 0,
          isTelegraphing: false,
          isElite,
          shieldArc: frigateShield ? Math.PI * 0.65 : undefined,
          shieldHp: frigateShield,
          maxShieldHp: frigateShield,
          tacticalRole: 'standard',
          warpInTimer: 0.3,
        });
      }
    }

    // 2. Spawn Front Vanguard Row directly at (formX, formY)
    for (let j = 0; j < frontRowCount; j++) {
      const normX = frontRowCount === 1 ? 0.5 : j / (frontRowCount - 1);
      const formX = marginX + normX * usableW;
      const formY = frontRowBaseY;
      const isStalker = (j === 0 || j === frontRowCount - 1) && displayWave >= 2;
      const isElite = Math.random() < eliteChance * 0.5;

      if (isStalker) {
        const stalkerHp = Math.round(95 * hpMult * (isElite ? 1.5 : 1));
        this.enemies.push({
          id: Math.random().toString(),
          type: 'stalker_kamikaze',
          name: 'Plasma Interceptor',
          x: formX,
          y: formY,
          formationX: formX,
          formationY: formY,
          vx: 0,
          vy: 0,
          hp: stalkerHp,
          maxHp: stalkerHp,
          radius: 15,
          color: '#ef4444',
          glowColor: '#dc2626',
          scoreValue: Math.round(110 * rewardMult),
          scrapValue: Math.round(26 * rewardMult),
          darkMatterValue: 2,
          shootCooldown: Math.max(1.9, 3.2 / fireRateMult),
          shootTimer: 1.6,
          patternTimer: 0,
          telegraphTimer: 1.6,
          isTelegraphing: true,
          isElite,
          tacticalRole: 'standard',
          warpInTimer: 0.3,
        });
      } else {
        const swarmerHp = Math.round(62 * hpMult * (isElite ? 1.65 : 1));
        this.enemies.push({
          id: Math.random().toString(),
          type: 'swarmer',
          name: isElite ? 'Apex Rift Swarmer' : 'Void Swarmer',
          x: formX,
          y: formY,
          formationX: formX,
          formationY: formY,
          vx: 0,
          vy: 0,
          hp: swarmerHp,
          maxHp: swarmerHp,
          radius: isElite ? 15 : 13,
          color: isElite ? '#f43f5e' : '#ec4899',
          glowColor: isElite ? '#fb7185' : '#f43f5e',
          scoreValue: Math.round(65 * rewardMult),
          scrapValue: Math.round(16 * rewardMult * (isElite ? 1.5 : 1)),
          darkMatterValue: isElite ? 2 : 1,
          shootCooldown: Math.max(1.4, 2.7 / fireRateMult),
          shootTimer: (1.0 + j * 0.25) / fireRateMult,
          patternTimer: 0,
          telegraphTimer: 0,
          isTelegraphing: false,
          isElite,
          tacticalRole: 'standard',
          warpInTimer: 0.3,
        });
      }
    }
  }

  private spawnBossShieldDrones(boss: Enemy, count: 1 | 2 = 2) {
    const existingDrones = this.enemies.filter((e) => e.tacticalRole === 'boss_shield_drone');
    if (existingDrones.length > 0) return;

    const droneHp = Math.max(90, Math.round(boss.maxHp * 0.14));
    const bossFormY = boss.formationY ?? Math.max(218, Math.round((this.canvas.height || 760) * 0.285));
    const centerX = this.canvas.width / 2;
    const sides = count === 1 ? [1] : [-1, 1];

    for (const side of sides) {
      const formX = Math.max(48, Math.min(this.canvas.width - 48, centerX + side * 112));
      const formY = bossFormY + 34;
      this.enemies.push({
        id: `boss-drone-${Date.now()}-${side}`,
        type: 'frigate',
        name: 'Aegis Schild-Koppler',
        x: formX,
        y: formY,
        formationX: formX,
        formationY: formY,
        vx: 0,
        vy: 0,
        hp: droneHp,
        maxHp: droneHp,
        radius: 19,
        color: '#06b6d4',
        glowColor: '#22d3ee',
        scoreValue: Math.round(boss.scoreValue * 0.12),
        scrapValue: Math.round(boss.scrapValue * 0.15),
        darkMatterValue: Math.max(2, Math.round(boss.darkMatterValue * 0.15)),
        shootCooldown: Math.max(1.6, boss.shootCooldown * 1.35),
        shootTimer: 1.5,
        patternTimer: 0,
        telegraphTimer: 0,
        isTelegraphing: false,
        isElite: true,
        tacticalRole: 'boss_shield_drone',
        healTargetId: boss.id,
        warpInTimer: 0.3,
      });
    }

    const shieldCap = Math.round(boss.maxHp * (count === 1 ? 0.22 : 0.35));
    boss.maxShieldHp = shieldCap;
    boss.shieldHp = shieldCap;
    boss.shieldArc = Math.PI * 2;
  }

  private spawnBoss(isMiniBoss: boolean = false) {
    sound.playBossAlert();

    const riftScaling = this.isEndlessRift
      ? paragonManager.getEndlessRiftScaling(this.endlessRiftDepth, this.wave)
      : null;

    const displayWave = ((this.wave - 1) % 10) + 1;
    const bossIndex = this.sector % 3;
    let bossName = isMiniBoss
      ? `Vanguard Mini-Boss [S${this.sector} • W5]`
      : this.isEndlessRift
      ? `RIFT TITAN [DEPTH ${this.endlessRiftDepth} • W${this.wave}]`
      : `Goliath Siege Dreadnought [S${this.sector} • W10]`;

    const sectorBossMult =
      Math.pow(1.32, Math.max(0, this.sector - 1)) *
      Math.pow(1.09, Math.max(0, displayWave - 1));
    const baseBossHp = isMiniBoss ? 1450 : 3200;
    let maxHp = Math.round(
      baseBossHp * (riftScaling ? riftScaling.enemyHpMult : sectorBossMult)
    );
    let color = isMiniBoss ? '#f97316' : '#ef4444';

    if (!isMiniBoss && bossIndex === 2) {
      bossName = this.isEndlessRift
        ? `VOID ARCHON [DEPTH ${this.endlessRiftDepth} • W${this.wave}]`
        : `Eclipse Void Colossus [S${this.sector} • W10]`;
      maxHp = Math.round(maxHp * 1.25);
      color = '#a855f7';
    } else if (!isMiniBoss && bossIndex === 0) {
      bossName = this.isEndlessRift
        ? `SINGULARITY SOVEREIGN [DEPTH ${this.endlessRiftDepth} • W${this.wave}]`
        : `Aegis Hive Core [S${this.sector} • W10]`;
      maxHp = Math.round(maxHp * 1.4);
      color = '#f59e0b';
    }

    this.bossWarningTimer = 1.8;
    this.bossWarningName = bossName;

    const fireRateMult = riftScaling
      ? riftScaling.enemyFireRateMult * 0.72
      : Math.min(2.2, Math.pow(1.05, Math.max(0, this.sector - 1)) * Math.pow(1.02, Math.max(0, displayWave - 1)));
    const lootMult = riftScaling
      ? riftScaling.lootYieldMult
      : Math.pow(1.24, Math.max(0, this.sector - 1)) * Math.pow(1.08, Math.max(0, displayWave - 1));

    const bossFormX = (this.canvas.width || 400) / 2;
    const bossFormY = Math.max(218, Math.round((this.canvas.height || 760) * 0.285));
    const bossShieldCap = Math.round(maxHp * (isMiniBoss ? 0.22 : 0.35));

    const boss: Enemy = {
      id: `boss-${Date.now()}`,
      type: 'boss',
      name: bossName,
      x: bossFormX,
      y: bossFormY,
      formationX: bossFormX,
      formationY: bossFormY,
      vx: 0,
      vy: 0,
      hp: maxHp,
      maxHp,
      radius: isMiniBoss ? 42 : 52,
      color,
      glowColor: '#dc2626',
      scoreValue: Math.round((isMiniBoss ? 900 : 2000) * lootMult),
      scrapValue: Math.round((isMiniBoss ? 240 : 520) * lootMult),
      darkMatterValue: Math.round((isMiniBoss ? 12 : 26) * Math.pow(lootMult, 0.85)),
      shootCooldown: Math.max(1.25, 2.3 / fireRateMult),
      shootTimer: 1.6,
      patternTimer: 0,
      telegraphTimer: 0,
      isTelegraphing: false,
      bossPhase: 1,
      bossAbilitiesTimer: 0,
      shieldArc: Math.PI * 2,
      shieldHp: bossShieldCap,
      maxShieldHp: bossShieldCap,
      isMiniBoss,
      warpInTimer: 0.32,
      staggerTimer: 0,
    };

    this.enemies.push(boss);
    this.spawnBossShieldDrones(boss, isMiniBoss ? 1 : 2);

    multiplayer.broadcastBossSpawn({
      id: boss.id,
      name: boss.name,
      hp: boss.hp,
      maxHp: boss.maxHp,
    });
  }

  // -----------------------------------------------------------
  // COSMIC ASTEROIDS (Daily Missions & Mineral Harvesting)
  // -----------------------------------------------------------
  private spawnAsteroid() {
    const radius = 18 + Math.random() * 20;
    const sides = 7;
    const points: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < sides; i++) {
      const angle = (i * Math.PI * 2) / sides;
      const r = radius * (0.75 + Math.random() * 0.5);
      points.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
    }

    const riftHpMult = this.isEndlessRift
      ? paragonManager.getEndlessRiftScaling(this.endlessRiftDepth, this.wave).enemyHpMult * 0.65
      : 1;
    const astHp = Math.round((35 + radius * 2.5) * riftHpMult);

    this.asteroids.push({
      id: Math.random().toString(),
      x: 30 + Math.random() * (this.canvas.width - 60),
      y: -radius - 20,
      vx: (Math.random() - 0.5) * 45,
      vy: 45 + Math.random() * 55,
      rot: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 1.4,
      radius,
      hp: astHp,
      maxHp: astHp,
      points,
    });
  }

  private updateAsteroids(dt: number) {
    this.asteroidSpawnTimer -= dt;
    if (this.asteroidSpawnTimer <= 0 && this.asteroids.length < 6) {
      this.spawnAsteroid();
      this.asteroidSpawnTimer = 3.2 + Math.random() * 2.5;
    }

    for (let i = this.asteroids.length - 1; i >= 0; i--) {
      const ast = this.asteroids[i];
      ast.x += ast.vx * dt;
      ast.y += ast.vy * dt;
      ast.rot += ast.vRot * dt;

      // Projectiles hitting asteroid
      for (let j = this.projectiles.length - 1; j >= 0; j--) {
        const p = this.projectiles[j];
        if (!p.isPlayer) continue;

        const dist = Math.hypot(p.x - ast.x, p.y - ast.y);
        if (dist < p.radius + ast.radius) {
          ast.hp -= p.damage;
          this.addHitSparks(p.x, p.y, p.vx, p.vy, '#94a3b8', false, false, false, true);
          sound.playHit(false);
          this.projectiles.splice(j, 1);

          if (ast.hp <= 0) {
            this.destroyAsteroid(ast, i);
            break;
          }
        }
      }

      // Check collision with player
      if (Math.hypot(ast.x - this.playerX, ast.y - this.playerY) < ast.radius + 18) {
        this.damagePlayer(25);
        this.destroyAsteroid(ast, i);
        continue;
      }

      // Out of bounds
      if (ast.y > this.canvas.height + 80) {
        this.asteroids.splice(i, 1);
      }
    }
  }

  private destroyAsteroid(ast: Asteroid, index: number) {
    this.asteroids.splice(index, 1);
    sound.playExplosion('small');
    this.addParticles(ast.x, ast.y, 14, '#64748b');

    // Spawn mineral scrap fragments (scaled in Endless Void Rifts)
    const riftLootMult = this.isEndlessRift
      ? paragonManager.getEndlessRiftScaling(this.endlessRiftDepth, this.wave).lootYieldMult
      : 1;
    const scrapVal = Math.round((18 + ast.radius * 0.9) * riftLootMult);
    this.spawnDrop('scrap', ast.x, ast.y, scrapVal);

    if (Math.random() < 0.25) {
      this.spawnDrop('darkmatter', ast.x + 5, ast.y, Math.max(1, Math.round(riftLootMult * 0.5)));
    }

    // Daily mission objective progress
    dailyMissions.recordProgress('destroy_asteroids', 1);
  }

  // -----------------------------------------------------------
  // ENTITY UPDATES
  // -----------------------------------------------------------
  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.lifetime -= dt;

      // Homing for missiles
      if (p.homingTargetId) {
        const target = this.enemies.find((e) => e.id === p.homingTargetId);
        if (target) {
          const angle = Math.atan2(target.y - p.y, target.x - p.x);
          p.vx += Math.cos(angle) * 800 * dt;
          p.vy += Math.sin(angle) * 800 * dt;
        }
      }

      // Check boundary or expiry
      if (
        p.lifetime <= 0 ||
        p.x < -40 ||
        p.x > this.canvas.width + 40 ||
        p.y < -40 ||
        p.y > this.canvas.height + 40
      ) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Player projectiles hit enemies
      if (p.isPlayer) {
        let hit = false;
        for (let j = 0; j < this.enemies.length; j++) {
          const enemy = this.enemies[j];
          const dist = Math.hypot(p.x - enemy.x, p.y - enemy.y);
          if (dist < p.radius + enemy.radius) {
            hit = true;

            // Damage calculation with boss matrix, Paragon Titanbane, Boss Codex & Boss Shield-Break Stagger (+50% DMG)
            const paragonBonuses = paragonManager.getComputedBonuses();
            const metaBonuses = metaProgression.getComputedBonuses();
            let effectiveDmg = p.damage;
            if (enemy.type === 'boss') {
              effectiveDmg *=
                (1 + this.tech.bossVulnerabilityMatrix * 0.25) *
                paragonBonuses.bossDamageMult *
                metaBonuses.bossDamageMult;
              if (enemy.staggerTimer && enemy.staggerTimer > 0) {
                effectiveDmg *= 1.5; // +50% Bonus Damage during Shield-Break Stagger!
              }
            }

            // Missile or Flak Cannon splash explosion check
            if (p.blastRadius && p.blastRadius > 0) {
              sound.playExplosion(
                p.blastRadius > 100 ? 'medium' : 'small',
                this.getPan(p.x)
              );
              this.addParticles(p.x, p.y, p.isMissile ? 16 : 10, p.color, 'ring');

              for (const otherEnemy of this.enemies) {
                if (otherEnemy === enemy) continue;
                const splashDist = Math.hypot(otherEnemy.x - p.x, otherEnemy.y - p.y);
                if (splashDist < p.blastRadius) {
                  const falloff = 1 - splashDist / p.blastRadius;
                  const splashDmg = Math.round(effectiveDmg * falloff);
                  otherEnemy.hp -= splashDmg;
                  this.addFloatingText(
                    formatCompactNumber(splashDmg),
                    otherEnemy.x,
                    otherEnemy.y,
                    p.color
                  );
                  this.addHitSparks(otherEnemy.x, otherEnemy.y, 0, 0, p.color, false, false, otherEnemy.hp < otherEnemy.maxHp * 0.35, false);
                  if (p.missileType === 'emp_disruptor') {
                    otherEnemy.shootTimer = Math.max(otherEnemy.shootTimer, 3.2);
                  }
                }
              }
            }

            if (p.isMissile && p.missileType === 'emp_disruptor') {
              enemy.shootTimer = Math.max(enemy.shootTimer, 3.5);
            }

            // Directional shield check for shielded cruisers OR Boss Shield Coupler protection
            const hitAngleFromEnemy = Math.atan2(p.y - enemy.y, p.x - enemy.x);
            const halfShieldArc = (enemy.shieldArc || Math.PI * 0.5) * 0.5;
            const isBossWithShield = enemy.type === 'boss' && (enemy.shieldHp || 0) > 0;
            const hitFrontalShield =
              !isBossWithShield &&
              enemy.shieldHp &&
              enemy.shieldHp > 0 &&
              Math.abs(hitAngleFromEnemy - Math.PI / 2) <= halfShieldArc;

            const hitPan = this.getPan(enemy.x);
            if (isBossWithShield && enemy.shieldHp) {
              const absorbed = Math.min(enemy.shieldHp, Math.round(effectiveDmg * 0.65));
              const bleedThrough = Math.max(1, Math.round(effectiveDmg - absorbed));
              enemy.shieldHp = Math.max(0, enemy.shieldHp - absorbed);
              enemy.hp -= bleedThrough;
              this.dpsMeasurement.damageSum += bleedThrough;
              this.totalDamageDealt += bleedThrough;
              this.addHitSparks(p.x, p.y, p.vx, p.vy, '#22d3ee', false, true, false, false);
              sound.playHit(false, hitPan);
            } else if (hitFrontalShield && enemy.shieldHp) {
              enemy.shieldHp -= effectiveDmg;
              this.addFloatingText(`DEFLECT`, enemy.x, enemy.y - 15, '#38bdf8');
              this.addHitSparks(p.x, p.y, p.vx, p.vy, '#38bdf8', false, true, false, false);
              sound.playHit(false, hitPan);
            } else {
              enemy.hp -= effectiveDmg;
              this.dpsMeasurement.damageSum += effectiveDmg;
              this.totalDamageDealt += effectiveDmg;
              dailyMissions.recordProgress('deal_damage', Math.round(effectiveDmg));

              if (enemy.type === 'boss') {
                multiplayer.broadcastBossDamage(effectiveDmg);
              }

              this.addFloatingText(
                formatCompactNumber(effectiveDmg),
                enemy.x + (Math.random() * 18 - 9),
                enemy.y + (Math.random() * 14 - 7),
                p.isCrit ? '#fde047' : '#ffffff',
                p.isCrit
              );

              const isHullCritical = enemy.hp < enemy.maxHp * 0.35;
              this.addHitSparks(p.x, p.y, p.vx, p.vy, p.color, p.isCrit || false, false, isHullCritical, false);
              sound.playHit(p.isCrit, hitPan);
            }

            if (p.isCrit) {
              dailyMissions.recordProgress('execute_criticals', 1);
            }

            if (enemy.hp <= 0) {
              this.destroyEnemy(enemy, j);
            }

            if (p.pierce && p.pierce > 0) {
              p.pierce--;
              p.damage *= 0.85;
              hit = false;
            }
            break;
          }
        }

        if (hit) {
          this.projectiles.splice(i, 1);
        }
      } else {
        // Enemy projectiles hit player
        const dist = Math.hypot(p.x - this.playerX, p.y - this.playerY);
        if (dist < p.radius + 18) {
          const config = getShipConfig(this.shipClassId);
          const eqStats = equipmentManager.getAggregatedLoadoutStats(config);
          if (
            (this.specialActiveTimer > 0 && config.specialAbilityType === 'aegis') ||
            (this.playerShield > 0 && Math.random() < eqStats.reflectChance)
          ) {
            p.isPlayer = true;
            p.vx = -p.vx * 1.6;
            p.vy = -p.vy * 1.6;
            p.color = '#10b981';
            sound.playHit(true);
            this.addFloatingText('REFLECTED', this.playerX, this.playerY - 20, '#10b981', true);
            continue;
          }

          this.damagePlayer(p.damage);
          this.projectiles.splice(i, 1);
        }
      }
    }
  }

  private updateEnemies(dt: number) {
    const riftScaling = this.isEndlessRift
      ? paragonManager.getEndlessRiftScaling(this.endlessRiftDepth, this.wave)
      : null;
    const displayWave = ((this.wave - 1) % 10) + 1;
    const sectorDamageExp =
      Math.pow(1.2, Math.max(0, this.sector - 1)) *
      Math.pow(1.06, Math.max(0, displayWave - 1));
    const damageMult = riftScaling ? riftScaling.enemyDamageMult : sectorDamageExp;
    const projSpeedMult = riftScaling
      ? Math.min(1.6, riftScaling.enemySpeedMult)
      : Math.min(1.5, 1 + (this.sector - 1) * 0.04);

    const activeCommander = this.enemies.find((e) => e.tacticalRole === 'commander' && e.y > 0);
    const commanderFireRateBoost = activeCommander ? 1.22 : 1.0;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.patternTimer += dt;
      if (e.warpInTimer && e.warpInTimer > 0) {
        e.warpInTimer = Math.max(0, e.warpInTimer - dt);
      }
      if (e.staggerTimer && e.staggerTimer > 0) {
        e.staggerTimer = Math.max(0, e.staggerTimer - dt);
      }
      e.shootTimer -= dt * (e.tacticalRole !== 'commander' ? commanderFireRateBoost : 1);
      if (e.healBeamTimer && e.healBeamTimer > 0) {
        e.healBeamTimer = Math.max(0, e.healBeamTimer - dt);
      }

      // 100% Stationary Standoff Formation: lock every enemy at its exact formationX/formationY!
      e.x = e.formationX ?? e.x;
      e.y = e.formationY ?? e.y;
      e.vx = 0;
      e.vy = 0;

      // Dynamic Boss Phase Transitions (Phases 1 -> 2 -> 3) & Shield Coupler Recharge
      if (e.type === 'boss') {
        const hpRatio = e.hp / Math.max(1, e.maxHp);
        const targetPhase = hpRatio <= 0.33 ? 3 : hpRatio <= 0.66 ? 2 : 1;
        if ((e.bossPhase || 1) < targetPhase) {
          e.bossPhase = targetPhase;
          e.staggerTimer = 0;
          this.addParticles(e.x, e.y, 24, e.color, 'ring');
          this.addFloatingText(
            `BOSS PHASE ${targetPhase}: NEUE SCHILD-KOPPLER!`,
            e.x,
            e.y - 40,
            '#22d3ee',
            true
          );
          this.spawnBossShieldDrones(e, e.isMiniBoss ? 1 : 2);
        }

        const activeShieldDrones = this.enemies.filter((d) => d.tacticalRole === 'boss_shield_drone');
        if (activeShieldDrones.length > 0 && e.maxShieldHp) {
          e.shieldHp = Math.min(
            e.maxShieldHp,
            (e.shieldHp || 0) + e.maxShieldHp * 0.032 * activeShieldDrones.length * dt
          );
        }

        if (e.shootTimer <= 0 && (!e.staggerTimer || e.staggerTimer <= 0)) {
          this.fireBossAttackPattern(e);
          e.shootTimer = Math.max(0.95, e.shootCooldown - (e.bossPhase || 1) * 0.12);
        }
      } else {
        // 1. Tactical Role: Shield-Healer (Aegis Weaver)
        if (e.tacticalRole === 'healer') {
          if (e.shootTimer <= 0) {
            let mostDamagedAlly: Enemy | null = null;
            let lowestHpRatio = 0.98;
            for (const ally of this.enemies) {
              if (ally.id === e.id) continue;
              const ratio = ally.hp / Math.max(1, ally.maxHp);
              if (ratio < lowestHpRatio) {
                lowestHpRatio = ratio;
                mostDamagedAlly = ally;
              }
            }

            if (mostDamagedAlly) {
              const healAmount = Math.round(mostDamagedAlly.maxHp * 0.16 + 25 * damageMult);
              mostDamagedAlly.hp = Math.min(mostDamagedAlly.maxHp, mostDamagedAlly.hp + healAmount);
              const shieldGrant = Math.round(mostDamagedAlly.maxHp * 0.12);
              mostDamagedAlly.shieldHp = Math.min(
                mostDamagedAlly.maxShieldHp || Math.round(mostDamagedAlly.maxHp * 0.4),
                (mostDamagedAlly.shieldHp || 0) + shieldGrant
              );
              mostDamagedAlly.shieldArc = mostDamagedAlly.shieldArc || Math.PI * 0.65;
              e.healTargetId = mostDamagedAlly.id;
              e.healBeamTimer = 0.85;
              this.addFloatingText(
                `+${formatCompactNumber(healAmount)} HP`,
                mostDamagedAlly.x,
                mostDamagedAlly.y - 18,
                '#10b981'
              );
              this.addParticles(mostDamagedAlly.x, mostDamagedAlly.y, 6, '#10b981', 'ring');
            } else {
              const aimAngle = Math.atan2(this.playerY - e.y, this.playerX - e.x);
              const projSpeed = 230 * projSpeedMult;
              this.projectiles.push({
                id: Math.random().toString(),
                x: e.x,
                y: e.y + e.radius,
                vx: Math.cos(aimAngle) * projSpeed,
                vy: Math.sin(aimAngle) * projSpeed,
                damage: Math.round((15 + displayWave * 2) * damageMult),
                radius: 4.5,
                color: '#10b981',
                isPlayer: false,
                lifetime: 4.5,
              });
            }
            e.shootTimer = e.shootCooldown;
          }
        }
        // 2. Tactical Role: Laser-Sniper or Vanguard Stalker
        else if (e.tacticalRole === 'sniper' || e.type === 'stalker_kamikaze') {
          if (e.isTelegraphing) {
            e.telegraphTimer -= dt;
            if (e.telegraphTimer <= 0) {
              e.isTelegraphing = false;
              const aimAngle = Math.atan2(this.playerY - e.y, this.playerX - e.x);
              const isSniper = e.tacticalRole === 'sniper';
              const projSpeed = (isSniper ? 420 : 320) * projSpeedMult;
              const projDamage = Math.round(
                (isSniper ? 38 + displayWave * 4 : 28 + displayWave * 3) * damageMult
              );
              this.projectiles.push({
                id: Math.random().toString(),
                x: e.x,
                y: e.y + e.radius,
                vx: Math.cos(aimAngle) * projSpeed,
                vy: Math.sin(aimAngle) * projSpeed,
                damage: projDamage,
                radius: isSniper ? 6.5 : 5.5,
                color: isSniper ? '#f43f5e' : '#ef4444',
                isPlayer: false,
                lifetime: 4.5,
              });
              e.shootTimer = e.shootCooldown;
            }
          } else if (e.shootTimer <= 0) {
            e.isTelegraphing = true;
            e.telegraphTimer = e.tacticalRole === 'sniper' ? 1.5 : 1.4;
          }
        }
        // 3. Tactical Role: Fleet Commander & Standard Standoff Ships
        else if (e.shootTimer <= 0) {
          const aimAngle = Math.atan2(this.playerY - e.y, this.playerX - e.x);
          const projSpeed = 240 * projSpeedMult;
          const projDamage = Math.round(
            (16 + displayWave * 2) * damageMult * (e.isElite ? 1.25 : 1)
          );

          if (e.tacticalRole === 'commander') {
            for (const spread of [-0.09, 0.09]) {
              const sAngle = aimAngle + spread;
              this.projectiles.push({
                id: Math.random().toString(),
                x: e.x,
                y: e.y + e.radius,
                vx: Math.cos(sAngle) * projSpeed * 1.05,
                vy: Math.sin(sAngle) * projSpeed * 1.05,
                damage: projDamage,
                radius: 5.2,
                color: '#fbbf24',
                isPlayer: false,
                lifetime: 4.5,
              });
            }
          } else {
            this.projectiles.push({
              id: Math.random().toString(),
              x: e.x,
              y: e.y + e.radius,
              vx: Math.cos(aimAngle) * projSpeed,
              vy: Math.sin(aimAngle) * projSpeed,
              damage: projDamage,
              radius: e.isElite ? 4.8 : 4,
              color: e.glowColor,
              isPlayer: false,
              lifetime: 4.5,
            });
          }
          e.shootTimer = e.shootCooldown;
        }
      }
    }
  }

  private fireBossAttackPattern(boss: Enemy) {
    const riftScaling = this.isEndlessRift
      ? paragonManager.getEndlessRiftScaling(this.endlessRiftDepth, this.wave)
      : null;
    const damageMult = riftScaling ? riftScaling.enemyDamageMult : 1 + (this.sector - 1) * 0.2;
    const speedMult = riftScaling ? Math.min(1.4, riftScaling.enemySpeedMult) : 1;

    const pattern = Math.floor(Math.random() * 2);

    if (pattern === 0) {
      // Calm, readable radial burst
      const bulletCount = 6 + (boss.bossPhase || 1) * 2;
      for (let i = 0; i < bulletCount; i++) {
        const angle = (i * Math.PI * 2) / bulletCount + boss.patternTimer;
        this.projectiles.push({
          id: Math.random().toString(),
          x: boss.x,
          y: boss.y,
          vx: Math.cos(angle) * 185 * speedMult,
          vy: Math.sin(angle) * 185 * speedMult,
          damage: Math.round(22 * damageMult),
          radius: 5,
          color: '#ef4444',
          isPlayer: false,
          lifetime: 5,
        });
      }
      sound.playLaser('heavy');
    } else {
      // Targeted spread toward player
      const aimAngle = Math.atan2(this.playerY - boss.y, this.playerX - boss.x);
      const spreadRadius = (boss.bossPhase || 1) >= 3 ? 2 : 1;
      for (let i = -spreadRadius; i <= spreadRadius; i++) {
        const angle = aimAngle + i * 0.18;
        this.projectiles.push({
          id: Math.random().toString(),
          x: boss.x,
          y: boss.y + boss.radius * 0.7,
          vx: Math.cos(angle) * 250 * speedMult,
          vy: Math.sin(angle) * 250 * speedMult,
          damage: Math.round(26 * damageMult),
          radius: 6,
          color: '#f97316',
          isPlayer: false,
          lifetime: 4,
        });
      }
      sound.playLaser('plasma');
    }
  }

  private destroyEnemy(enemy: Enemy, index: number) {
    this.enemies.splice(index, 1);
    this.totalKills++;
    this.score += enemy.scoreValue;

    const pan = this.getPan(enemy.x);
    const paragonBonuses = paragonManager.getComputedBonuses();
    const metaBonuses = metaProgression.getComputedBonuses();
    const riftScaling = this.isEndlessRift
      ? paragonManager.getEndlessRiftScaling(this.endlessRiftDepth, this.wave)
      : null;

    // ---------------------------------------------------------
    // LIVE 1v1 PVP ARENA STANDOFF VICTORY CHECK
    // ---------------------------------------------------------
    if (this.isPvpArenaMatch && enemy.isPvpRival) {
      sound.playExplosion('boss', pan);
      haptics.vibrateCombatEvent('boss_kill');
      this.addParticles(enemy.x, enemy.y, 35, '#fbbf24', 'ring');

      // Eliminate any escort drones
      this.enemies = [];
      this.projectiles = [];

      const rival = this.currentPvpRival;
      const result = rival
        ? metaProgression.recordPvpMatchResult(true, rival)
        : { trophyDelta: 28, honorAwarded: 45, scrapAwarded: 8500, dmAwarded: 120 };

      this.scrap += result.scrapAwarded;
      this.darkMatter += result.dmAwarded;
      this.isPvpArenaMatch = false;
      this.currentPvpRival = null;
      this.activePvpOpponent = null;
      this.isBossWave = false;
      this.waveEnemyTotal = 0;
      this.waveSpawnCooldown = 1.4;

      this.addFloatingText(
        `PVP SIEG! +${result.trophyDelta} TROPHÄEN | +${result.honorAwarded} EHREN-MEDAILLEN`,
        this.playerX,
        this.playerY - 62,
        '#fbbf24',
        true
      );
      this.addFloatingText(
        `+${formatCompactNumber(result.scrapAwarded)} SCRAP | +${formatCompactNumber(result.dmAwarded)} DM`,
        this.playerX,
        this.playerY - 38,
        '#34d399',
        true
      );
      return;
    }

    // Kill-Combo & Overdrive Escalation
    this.comboCount++;
    this.comboTimer = 4.2;
    this.comboMultiplier = Math.min(5.0, 1.0 + Math.floor(this.comboCount / 5) * 0.25);

    // Award Paragon Ascension XP on every kill
    const baseXpGain = enemy.type === 'boss' ? 220 : enemy.isElite ? 52 : 18;
    const riftXpMult = riftScaling ? riftScaling.paragonXpMult : 1 + (this.sector - 1) * 0.25;
    const xpGain = Math.round(baseXpGain * riftXpMult * this.comboMultiplier);
    const xpResult = paragonManager.addParagonXp(xpGain);
    if (xpResult.leveledUp) {
      sound.playUpgrade();
      haptics.vibrateLevelUp('paragon');
      this.addFloatingText(
        `PARAGON LV.${xpResult.newLevel}! +${xpResult.shardsAwarded} SHARDS`,
        this.playerX,
        this.playerY - 65,
        '#c084fc',
        true
      );
    }

    dailyMissions.recordProgress('destroy_enemies', 1);
    if (enemy.type === 'boss') {
      dailyMissions.recordProgress('defeat_bosses', 1);
    }

    if (enemy.type === 'boss') {
      this.totalBosses++;
      sound.playExplosion('boss', pan);
      haptics.vibrateCombatEvent('boss_kill');

      // Record Boss Kill in Boss Encyclopedia (Boss-Kodex)
      metaProgression.recordBossKill(this.sector, Boolean(enemy.isMiniBoss));

      // Also eliminate any remaining shield drones when the Boss itself is destroyed
      for (let k = this.enemies.length - 1; k >= 0; k--) {
        if (this.enemies[k].tacticalRole === 'boss_shield_drone') {
          this.enemies.splice(k, 1);
        }
      }

      if (enemy.isMiniBoss) {
        const miniShards = 1 + Math.floor(this.sector * 0.35);
        paragonManager.addQuantumShards(miniShards);
        this.addFloatingText(
          `MINI-BOSS BESIEGT! +${miniShards} SHARDS`,
          this.playerX,
          this.playerY - 45,
          '#fbbf24',
          true
        );
      } else if (this.isEndlessRift) {
        const riftAdv = paragonManager.advanceEndlessDepth();
        this.endlessRiftDepth = riftAdv.newDepth;
        const nextMutator = paragonManager.getActiveMutator();
        haptics.vibrateLevelUp('rift_clear');
        this.addFloatingText(
          `DEPTH ${riftAdv.newDepth - 1} CLEARED! +${riftAdv.bonusShards} SHARDS!`,
          this.playerX,
          this.playerY - 52,
          '#00f2fe',
          true
        );
        this.addFloatingText(
          `ENTERING DEPTH ${riftAdv.newDepth}: ${nextMutator.name}`,
          this.playerX,
          this.playerY - 28,
          nextMutator.accentColor,
          true
        );
      } else {
        equipmentManager.unlockSector(this.sector + 1);
        const bossShards = 3 + Math.floor(this.sector * 0.6);
        paragonManager.addQuantumShards(bossShards);
        haptics.vibrateLevelUp('rift_clear');
        this.addFloatingText(
          `SEKTOR ${this.sector + 1} FREIGESCHALTET! (+${bossShards} SHARDS)`,
          this.playerX,
          this.playerY - 45,
          '#38bdf8',
          true
        );
      }
    } else {
      sound.playExplosion(enemy.radius > 20 ? 'medium' : 'small', pan);

      // Check if destroyed enemy was a Boss Shield Coupler Drone -> Trigger 5s Stagger!
      if (enemy.tacticalRole === 'boss_shield_drone') {
        const remainingCouplers = this.enemies.filter((d) => d.tacticalRole === 'boss_shield_drone');
        const activeBoss = this.enemies.find((b) => b.type === 'boss');
        if (activeBoss) {
          if (remainingCouplers.length === 0) {
            activeBoss.shieldHp = 0;
            activeBoss.staggerTimer = 5.0; // 5s Boss Shield-Break Stagger (+50% Damage)
            sound.playEmp(this.getPan(activeBoss.x));
            this.addParticles(activeBoss.x, activeBoss.y, 24, '#22d3ee', 'ring');
            this.addFloatingText(
              'SCHILDBRUCH! 5s +50% SCHADEN!',
              activeBoss.x,
              activeBoss.y - 45,
              '#22d3ee',
              true
            );
          } else {
            activeBoss.shieldHp = Math.round((activeBoss.shieldHp || 0) * 0.45);
            this.addFloatingText(
              'KOPPLER ZERSTÖRT! (-55% BOSS-SCHILD)',
              activeBoss.x,
              activeBoss.y - 38,
              '#38bdf8',
              true
            );
          }
        }
      }

      if (enemy.isElite) {
        haptics.vibrateCombatEvent('enemy_kill');
        const shardDropChance = riftScaling ? riftScaling.shardDropChance : 0.35;
        if (Math.random() < shardDropChance) {
          const shardCount = this.isEndlessRift
            ? 1 + Math.floor(this.endlessRiftDepth / 6)
            : 1;
          paragonManager.addQuantumShards(shardCount);
          this.addFloatingText(
            `+${shardCount} QUANTUM SHARD${shardCount > 1 ? 'S' : ''}`,
            enemy.x,
            enemy.y - 24,
            '#c084fc',
            true
          );
        }
      }
    }

    this.addParticles(enemy.x, enemy.y, enemy.type === 'boss' ? 30 : 10, enemy.color);
    this.addHitSparks(enemy.x, enemy.y, 0, 0, enemy.glowColor || enemy.color, true, false, true, false);

    // ---------------------------------------------------------
    // DIRECT LOOT TRANSFER (NO GIANT CRYSTALS COVERING THE PLAYER SHIP!)
    // ---------------------------------------------------------
    const scrapRefinery = 1 + this.tech.quantumScrapRefinery * 0.25;
    const dmBonus = 1 + this.tech.darkMatterAttunement * 0.2;
    const guildReactorBonus = 1 + (multiplayer.currentGuild?.citadel.reactorLevel || 0) * 0.05;
    const skinScrapBonus = cosmetics.equipped.skinId === 'skin-aurum' ? 1.04 : 1.0;
    const riftRewardMult = riftScaling ? riftScaling.lootYieldMult : 1.0;
    const salvageSurgeScrapMult = this.boosters.salvage_surge.activeRemaining > 0 ? 2.0 : 1.0;
    const salvageSurgeDmMult = this.boosters.salvage_surge.activeRemaining > 0 ? 1.5 : 1.0;

    const scrapAmount = Math.max(
      1,
      Math.round(
        enemy.scrapValue *
          scrapRefinery *
          guildReactorBonus *
          skinScrapBonus *
          paragonBonuses.scrapYieldMult *
          metaBonuses.scrapYieldMult *
          riftRewardMult *
          salvageSurgeScrapMult *
          this.comboMultiplier
      )
    );

    this.scrap += scrapAmount;
    dailyMissions.recordProgress('collect_scrap', scrapAmount);
    sound.playScrapChime();
    this.addParticles(enemy.x, enemy.y, 4, '#facc15', 'spark');

    if (Math.random() < 0.45 || enemy.type === 'boss' || enemy.isElite) {
      const dmAmount = Math.max(
        1,
        Math.round(
          enemy.darkMatterValue *
            dmBonus *
            paragonBonuses.darkMatterYieldMult *
            metaBonuses.darkMatterYieldMult *
            riftRewardMult *
            salvageSurgeDmMult
        )
      );
      this.darkMatter += dmAmount;
      this.addFloatingText(
        `+${formatCompactNumber(scrapAmount)} ⚙️  +${formatCompactNumber(dmAmount)} DM`,
        enemy.x,
        enemy.y - 12,
        '#c084fc',
        enemy.type === 'boss' || enemy.isElite
      );
    } else if (metaProgression.damageFilter !== 'off') {
      this.addFloatingText(`+${formatCompactNumber(scrapAmount)} ⚙️`, enemy.x, enemy.y - 12, '#facc15');
    }

    if (Math.random() < 0.14) {
      const shieldBoost = Math.round(this.playerMaxShield * 0.18);
      this.playerShield = Math.min(this.playerMaxShield, this.playerShield + shieldBoost);
    }
  }

  private spawnDrop(_type: DropItem['type'], x: number, y: number, value: number) {
    // Direct loot transfer without cluttering drops on the player ship
    this.scrap += value;
    this.addParticles(x, y, 3, '#facc15', 'spark');
  }

  private updateDrops(_dt: number) {
    if (this.drops.length > 0) {
      this.drops = [];
    }
  }

  private damagePlayer(rawAmount: number) {
    const config = getShipConfig(this.shipClassId);
    const eqStats = equipmentManager.getAggregatedLoadoutStats(config);
    const paragonBonuses = paragonManager.getComputedBonuses();
    const metaBonuses = metaProgression.getComputedBonuses();

    // Armor & Aegis Core Damage Reduction + Active Aegis Barrier (60% DR) + Meta Bonuses
    const armorReduction = Math.min(0.45, (this.upgrades.hullArmorLevel - 1) * 0.025);
    const aegisBarrierReduction = this.phaseDashActiveTimer > 0 ? 0.6 : 0;
    const totalReduction = Math.min(
      0.88,
      paragonBonuses.damageReductionPct / 100 +
        metaBonuses.damageReductionBonusPct / 100 +
        eqStats.damageReductionPct / 100 +
        armorReduction +
        aegisBarrierReduction
    );
    const amount = Math.max(1, Math.round(rawAmount * (1 - totalReduction)));

    this.incomingDpsMeasurement.damageSum += amount;
    this.hitFlashTimer = 0.14;
    this.shieldRegenDelayTimer = 1.1;
    sound.playHit(false, this.getPan(this.playerX));

    if (this.playerShield > 0) {
      if (this.playerShield >= amount) {
        this.playerShield -= amount;
        this.addHitSparks(this.playerX, this.playerY, 0, 160, '#38bdf8', false, true, false, false);
      } else {
        const leftover = amount - this.playerShield;
        this.playerShield = 0;
        this.playerHp -= leftover;
        this.addHitSparks(this.playerX, this.playerY, 0, 160, '#ef4444', true, false, true, false);
      }
    } else {
      this.playerHp -= amount;
      this.addHitSparks(this.playerX, this.playerY, 0, 160, '#ef4444', true, false, true, false);
    }

    if (this.playerHp <= 0) {
      this.onPlayerDeath();
    }
  }

  private onPlayerDeath() {
    sound.playEmp(0);
    this.addParticles(this.playerX, this.playerY, 28, '#38bdf8', 'ring');

    if (this.isPvpArenaMatch && this.currentPvpRival) {
      const result = metaProgression.recordPvpMatchResult(false, this.currentPvpRival);
      this.scrap += result.scrapAwarded;
      this.isPvpArenaMatch = false;
      this.currentPvpRival = null;
      this.activePvpOpponent = null;
      this.projectiles = [];
      this.enemies = [];
      this.isBossWave = false;
      this.waveEnemyTotal = 0;
      this.waveSpawnCooldown = 1.0;
      this.playerHp = this.playerMaxHp;
      this.playerShield = this.playerMaxShield;
      this.shieldRegenDelayTimer = 0;

      this.addFloatingText(
        `PVP NIEDERLAGE (${result.trophyDelta} TROPHÄEN) | +${result.honorAwarded} EHREN-MEDAILLEN`,
        this.playerX,
        this.playerY - 48,
        '#fb7185',
        true
      );
      return;
    }

    this.projectiles = [];
    this.enemies = [];
    this.isBossWave = false;
    if (this.wave > 1) {
      this.wave--;
    }
    this.waveEnemyTotal = 0;
    this.waveSpawnCooldown = 0.8;

    this.playerHp = this.playerMaxHp;
    this.playerShield = this.playerMaxShield;
    this.shieldRegenDelayTimer = 0;

    this.addFloatingText(
      'NOTFALL-WARP: SCHILD & HÜLLE 100% REPARIERT!',
      this.playerX,
      this.playerY - 48,
      '#38bdf8',
      true
    );
  }

  // -----------------------------------------------------------
  // HITSTOP & CAMERA SHAKE (SCREEN SHAKE PERMANENTLY DISABLED)
  // -----------------------------------------------------------
  private hitstop(duration: number) {
    this.hitstopTimer = Math.min(0.02, duration);
  }

  public screenShake(_magnitude: number) {
    this.screenShakeMagnitude = 0;
  }

  // -----------------------------------------------------------
  // VISUAL EFFECTS & PARTICLES
  // -----------------------------------------------------------
  public addParticles(x: number, y: number, count: number, color: string, shape: Particle['shape'] = 'circle') {
    const MAX_PARTICLES = 450;
    if (this.particles.length > MAX_PARTICLES) {
      this.particles.splice(0, count);
    }
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 220;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.5 + Math.random() * 3.5,
        color,
        alpha: 1.0,
        decay: 1.8 + Math.random() * 2.5,
        shape,
      });
    }
  }

  // -----------------------------------------------------------
  // ENEMY DAMAGE SPARKS & COMBAT IMPACT FX (Performance-Optimized)
  // -----------------------------------------------------------
  public addHitSparks(
    x: number,
    y: number,
    inVx: number,
    inVy: number,
    color: string,
    isCrit: boolean = false,
    isShieldDeflect: boolean = false,
    isHullBreach: boolean = false,
    isAsteroid: boolean = false
  ) {
    // Memory and performance safeguard during bullet-hell waves
    const MAX_PARTICLES = 450;
    if (this.particles.length >= MAX_PARTICLES) {
      this.particles.splice(0, 25);
    }

    // Determine deflection angle opposite to projectile vector
    const inSpeed = Math.hypot(inVx, inVy);
    const bounceAngle = inSpeed > 10 ? Math.atan2(-inVy, -inVx) : -Math.PI / 2;

    if (isShieldDeflect) {
      // Shield deflection: tangential spark spray along barrier curve
      const count = 7;
      for (let i = 0; i < count; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const angle = bounceAngle + side * (Math.PI / 2.2 + (Math.random() - 0.5) * 0.5);
        const speed = 140 + Math.random() * 240;
        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 1.6 + Math.random() * 2.2,
          color: Math.random() < 0.4 ? '#ffffff' : '#38bdf8',
          alpha: 1.0,
          decay: 5.5 + Math.random() * 3.5,
          shape: 'spark',
        });
      }
      // Expanding micro shield ripple ring
      this.particles.push({
        x,
        y,
        vx: 0,
        vy: 0,
        size: 3.5,
        color: '#67e8f9',
        alpha: 0.9,
        decay: 6.5,
        shape: 'ring',
      });
      return;
    }

    if (isAsteroid) {
      // Asteroid fracture sparks & mineral fragments
      const count = 5;
      for (let i = 0; i < count; i++) {
        const angle = bounceAngle + (Math.random() - 0.5) * 1.6;
        const speed = 90 + Math.random() * 210;
        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 1.2 + Math.random() * 2.2,
          color: Math.random() < 0.35 ? '#fde047' : '#94a3b8',
          alpha: 1.0,
          decay: 4.0 + Math.random() * 3.0,
          shape: Math.random() < 0.65 ? 'spark' : 'circle',
        });
      }
      return;
    }

    // Dynamic enemy hit sparks: fanning spray of energetic kinetic embers
    const sparkCount = isCrit ? 11 : 6;
    for (let i = 0; i < sparkCount; i++) {
      const spread = isCrit ? 1.7 : 1.1;
      const angle = bounceAngle + (Math.random() - 0.5) * spread;
      const speed = isCrit ? (240 + Math.random() * 380) : (140 + Math.random() * 240);
      const sparkColor = isCrit
        ? (i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? '#fde047' : '#fbbf24')
        : (i % 2 === 0 ? '#ffffff' : color);

      this.particles.push({
        x: x + (Math.random() * 4 - 2),
        y: y + (Math.random() * 4 - 2),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: isCrit ? 1.8 + Math.random() * 2.5 : 1.3 + Math.random() * 1.8,
        color: sparkColor,
        alpha: 1.0,
        decay: isCrit ? 4.5 + Math.random() * 3.0 : 6.0 + Math.random() * 3.5,
        shape: 'spark',
      });
    }

    // Critical impact shockwave ring
    if (isCrit) {
      this.particles.push({
        x,
        y,
        vx: 0,
        vy: 0,
        size: 4,
        color: '#fde047',
        alpha: 0.95,
        decay: 6.5,
        shape: 'ring',
      });
    }

    // Critical hull breach: molten shrapnel when enemy HP is critical (<35%)
    if (isHullBreach) {
      for (let i = 0; i < 3; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 70 + Math.random() * 170;
        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 2.0 + Math.random() * 2.0,
          color: Math.random() < 0.5 ? '#ff4500' : '#f97316',
          alpha: 1.0,
          decay: 3.0 + Math.random() * 2.0,
          shape: 'spark',
        });
      }
    }
  }

  public addFloatingText(text: string, x: number, y: number, color: string, isCrit: boolean = false) {
    const filter = metaProgression.damageFilter;
    const isNumericDamage = /^[+-]?\d/.test(text) && !text.includes('SHARDS') && !text.includes('TROPHÄEN');
    if (isNumericDamage) {
      if (filter === 'off') return;
      if (filter === 'crit' && !isCrit) return;
    }

    if (this.floatingTexts.length > 48) {
      this.floatingTexts.splice(0, 12);
    }

    this.floatingTexts.push({
      id: Math.random().toString(),
      text,
      x,
      y,
      vy: -55,
      alpha: 1.0,
      color,
      isCrit,
    });
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.shape === 'spark') {
        p.vx *= 0.95;
        p.vy *= 0.95;
      }
      p.alpha -= p.decay * dt;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateFloatingTexts(dt: number) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.alpha -= 1.3 * dt;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  private updateStars(dt: number) {
    const warpMulti = this.specialActiveTimer > 0 ? 2.5 : 1.0;
    const isThrusting = this.keysHeld['KeyW'] || this.keysHeld['ArrowUp'] || (this.mousePos.isDown && this.mousePos.y < this.playerY - 20);
    const isBraking = this.keysHeld['KeyS'] || this.keysHeld['ArrowDown'] || (this.mousePos.isDown && this.mousePos.y > this.playerY + 20);
    const thrustBoost = isThrusting ? 1.6 : isBraking ? 0.6 : 1.0;

    const h = this.canvas.height || 800;
    // Smooth deep cosmic nebula drift
    this.nebulaScrollY = (this.nebulaScrollY + 24 * warpMulti * thrustBoost * dt) % h;
  }

  private spawnRemoteLaser(x: number, y: number, angle: number, laserType: string, laserColor?: string) {
    const config = SHIP_CLASSES[laserType as ShipClassId] || SHIP_CLASSES.interceptor;
    this.projectiles.push({
      id: Math.random().toString(),
      x,
      y,
      vx: Math.cos(angle) * 700,
      vy: Math.sin(angle) * 700,
      damage: 0, // remote visual only; damage authoritatively handled
      radius: 3.5,
      color: laserColor || config.bulletColor,
      isPlayer: true,
      lifetime: 1.8,
    });
  }

  private getNearestEnemy(fromX: number = this.playerX, fromY: number = this.playerY): Enemy | null {
    let nearest: Enemy | null = null;
    let minDist = Infinity;

    for (const e of this.enemies) {
      if (e.y < 0) continue;
      const dist = Math.hypot(e.x - fromX, e.y - fromY);
      if (dist < minDist) {
        minDist = dist;
        nearest = e;
      }
    }
    return nearest;
  }

  // -----------------------------------------------------------
  // RENDERING ENGINE (ROCK-STEADY VIEWPORT, ZERO SCREEN SHAKE)
  // -----------------------------------------------------------
  private render() {
    const { ctx, canvas } = this;

    ctx.save();

    // Deep cosmic background clear
    ctx.fillStyle = '#050713';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Parallax Deep Space Nebula Backdrop
    const nebulaImg = assetManager.getRawImage('env_nebula');
    if (nebulaImg && nebulaImg.complete && nebulaImg.naturalWidth > 0) {
      ctx.save();
      ctx.globalAlpha = 0.38;
      const h = canvas.height;
      const w = canvas.width;
      const y1 = this.nebulaScrollY - h;
      const y2 = this.nebulaScrollY;
      ctx.drawImage(nebulaImg, 0, y1, w, h);
      ctx.drawImage(nebulaImg, 0, y2, w, h);
      ctx.restore();
    }

    // Render Drops
    this.renderDrops();

    // Render Remote Squadmates
    this.renderSquadmates();

    // Render Enemies
    this.renderEnemies();

    // Render Priority Target Focus Reticle & Aegis Barrier Aura
    this.renderAutoPilotOverlay();

    // Render Player Ship
    this.renderPlayerShip();

    // Render Escort Drones
    this.renderDrones();

    // Render Projectiles
    this.renderProjectiles();

    // Render Particles
    this.renderParticles();

    // Render Floating Damage Numbers
    this.renderFloatingTexts();

    // Compact Boss Warning Banner positioned at lower-mid arena (y = 0.48) so it NEVER covers the Boss ship
    if (this.bossWarningTimer > 0) {
      const alpha = Math.min(1, this.bossWarningTimer * 1.2) * (0.78 + Math.sin(Date.now() * 0.016) * 0.22);
      ctx.save();
      ctx.globalAlpha = alpha;
      const bannerY = canvas.height * 0.48;
      const bannerW = Math.min(380, canvas.width * 0.88);
      const bannerH = 54;
      const bannerX = canvas.width / 2 - bannerW / 2;

      ctx.fillStyle = 'rgba(28, 7, 16, 0.88)';
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(bannerX, bannerY - bannerH / 2, bannerW, bannerH, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fecdd3';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`WARNUNG: BOSS-FLOTTE IM ANFLUG`, canvas.width / 2, bannerY - 5);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(this.bossWarningName.toUpperCase(), canvas.width / 2, bannerY + 13);
      ctx.restore();
    }

    ctx.restore();
  }

  private renderAsteroids() {
    const { ctx } = this;
    const astSprite = assetManager.getSprite('env_asteroid');

    for (const ast of this.asteroids) {
      ctx.save();
      ctx.translate(ast.x, ast.y);
      ctx.rotate(ast.rot);

      if (astSprite) {
        const size = ast.radius * 2.3;
        ctx.drawImage(astSprite, -size / 2, -size / 2, size, size);
      } else {
        ctx.fillStyle = '#475569';
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.8;

        ctx.beginPath();
        if (ast.points.length > 0) {
          ctx.moveTo(ast.points[0].x, ast.points[0].y);
          for (let i = 1; i < ast.points.length; i++) {
            ctx.lineTo(ast.points[i].x, ast.points[i].y);
          }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Subtle surface crater detail
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(ast.radius * 0.25, -ast.radius * 0.2, Math.max(2, ast.radius * 0.2), 0, Math.PI * 2);
        ctx.fill();
      }

      // 3D Health bar if damaged
      if (ast.hp < ast.maxHp) {
        ctx.rotate(-ast.rot);
        const barW = ast.radius * 1.9;
        const hpPct = Math.max(0, ast.hp / ast.maxHp);
        const barTrack = assetManager.getSprite('ui_bar_track');
        const barFill = assetManager.getSprite('ui_bar_fill_cyan');
        if (barTrack && barFill) {
          ctx.drawImage(barTrack, -barW / 2, -ast.radius - 10, barW, 6);
          if (hpPct > 0) {
            ctx.drawImage(barFill, 0, 0, barFill.width * hpPct, barFill.height, -barW / 2, -ast.radius - 10, barW * hpPct, 6);
          }
        }
      }

      ctx.restore();
    }
  }

  private renderAutoPilotOverlay() {
    const { ctx } = this;
    const target = this.enemies.find((e) => e.id === this.autoPilotTargetEnemyId);

    ctx.save();

    // 1. Priority Target Focus Reticle on Locked Enemy
    if (target && target.y > 0) {
      const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.1;
      const reticleRadius = (target.radius + 11) * pulse;
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.75)';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.arc(target.x, target.y, reticleRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 2. Active Aegis Deflector Barrier Dome around Player Ship
    if (this.phaseDashActiveTimer > 0) {
      const aegisRadius = 46 + Math.sin(Date.now() * 0.015) * 3;
      ctx.strokeStyle = '#22d3ee';
      ctx.fillStyle = 'rgba(34, 211, 238, 0.12)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(this.playerX, this.playerY, aegisRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderPlayerShip() {
    const { ctx } = this;
    const config = getShipConfig(this.shipClassId);
    const eqStats = equipmentManager.getAggregatedLoadoutStats(config);

    ctx.save();
    ctx.translate(this.playerX, this.playerY);
    ctx.rotate(this.playerAngle + Math.PI / 2); // align forward facing

    // Multi-layered Shield Generator Aura (scales with equipped Shield Generators Tier 1-20)
    if (this.playerShield > 0) {
      const topGen = eqStats.activeGenerators[0];
      const shieldGlow =
        this.specialActiveTimer > 0 && config.specialAbilityType === 'aegis'
          ? '#10b981'
          : topGen?.color || '#38bdf8';
      const shieldSecondary = topGen?.secondaryColor || config.accentColor;
      const shieldRatio = Math.max(0.1, this.playerShield / Math.max(1, this.playerMaxShield));
      const baseRadius = 32 + Math.min(10, Math.floor(config.tier / 6));

      ctx.save();
      ctx.strokeStyle = shieldGlow;
      ctx.shadowColor = shieldGlow;
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2.2;
      ctx.globalAlpha = 0.3 + shieldRatio * 0.48;
      ctx.beginPath();
      ctx.arc(0, 0, baseRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Secondary harmonic barrier ring for high-tier or multi-generator loadouts
      if (eqStats.activeGenerators.length >= 2 || (topGen && topGen.tier >= 5)) {
        ctx.strokeStyle = shieldSecondary;
        ctx.lineWidth = 1.4;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, baseRadius + 4, Date.now() * 0.002, Date.now() * 0.002 + Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    }

    // Dynamic Engine Plasma Thrusters (Movement-Reactive + Multi-Nozzle per Ship Tier)
    ctx.save();
    const isShipAccelerating =
      this.keysHeld['KeyW'] ||
      this.keysHeld['ArrowUp'] ||
      (this.mousePos.isDown && this.mousePos.y < this.playerY - 20);
    const isShipBraking =
      this.keysHeld['KeyS'] ||
      this.keysHeld['ArrowDown'] ||
      (this.mousePos.isDown && this.mousePos.y > this.playerY + 20);
    const isShipOverdrive = this.specialActiveTimer > 0;
    const isShipLeft = this.keysHeld['KeyA'] || this.keysHeld['ArrowLeft'];
    const isShipRight = this.keysHeld['KeyD'] || this.keysHeld['ArrowRight'];

    const flameBaseLen = isShipOverdrive ? 36 : isShipAccelerating ? 24 : isShipBraking ? 7 : 15;
    const pulseAmount = isShipOverdrive ? 8 : isShipAccelerating ? 5 : 3;
    const flameLen = flameBaseLen + Math.sin(Date.now() * 0.04) * pulseAmount;
    const flameScale = isShipOverdrive ? 1.35 : isShipAccelerating ? 1.15 : isShipBraking ? 0.6 : 1.0;

    const nozzleCount = config.visualAsset?.nozzleCount || 2;
    const wingspan = config.visualAsset?.wingspan || 20;
    const shipNozzles: Array<{ x: number; y: number; w: number }> = [];
    for (let n = 0; n < nozzleCount; n++) {
      const norm = nozzleCount === 1 ? 0 : (n / (nozzleCount - 1)) * 2 - 1;
      shipNozzles.push({
        x: norm * (wingspan * 0.46),
        y: 20 + (1 - Math.abs(norm)) * 4,
        w: Math.max(3.2, 6.2 - nozzleCount * 0.35),
      });
    }

    for (const nz of shipNozzles) {
      const nw = nz.w * flameScale;
      const outerGrad = ctx.createLinearGradient(nz.x, nz.y, nz.x, nz.y + flameLen);
      outerGrad.addColorStop(0, '#ffffff');
      outerGrad.addColorStop(0.25, config.engineGlow);
      outerGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = outerGrad;
      ctx.beginPath();
      ctx.moveTo(nz.x - nw, nz.y);
      ctx.lineTo(nz.x, nz.y + flameLen);
      ctx.lineTo(nz.x + nw, nz.y);
      ctx.closePath();
      ctx.fill();

      const innerGrad = ctx.createLinearGradient(nz.x, nz.y, nz.x, nz.y + flameLen * 0.65);
      innerGrad.addColorStop(0, '#ffffff');
      innerGrad.addColorStop(0.7, '#ffffff');
      innerGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = innerGrad;
      ctx.beginPath();
      ctx.moveTo(nz.x - nw * 0.45, nz.y);
      ctx.lineTo(nz.x, nz.y + flameLen * 0.65);
      ctx.lineTo(nz.x + nw * 0.45, nz.y);
      ctx.closePath();
      ctx.fill();
    }

    if (isShipLeft) {
      ctx.fillStyle = '#67e8f9';
      ctx.beginPath();
      ctx.moveTo(20, 2);
      ctx.lineTo(28 + Math.random() * 5, 4);
      ctx.lineTo(20, 6);
      ctx.closePath();
      ctx.fill();
    } else if (isShipRight) {
      ctx.fillStyle = '#67e8f9';
      ctx.beginPath();
      ctx.moveTo(-20, 2);
      ctx.lineTo(-28 - Math.random() * 5, 4);
      ctx.lineTo(-20, 6);
      ctx.closePath();
      ctx.fill();
    }

    if (isShipBraking) {
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(-10, -8);
      ctx.lineTo(-14, -18);
      ctx.lineTo(-7, -10);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(10, -8);
      ctx.lineTo(14, -18);
      ctx.lineTo(7, -10);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();

    // Render Bespoke 50-Ship Multi-Layered Hull Asset
    const skin = cosmetics.getEquippedSkinItem();
    const overridePrimary =
      skin.id !== 'skin-default' && skin.primaryColor ? skin.primaryColor : undefined;
    const overrideAccent =
      skin.id !== 'skin-default' && skin.accentColor ? skin.accentColor : undefined;

    renderBespokeShipCanvas(ctx, config, {
      scale: 1.05,
      hitFlash: this.hitFlashTimer > 0,
      overridePrimary,
      overrideAccent,
      timeMs: Date.now(),
    });

    ctx.restore();
  }

  private renderSquadmates() {
    const { ctx } = this;

    for (const pilot of multiplayer.remotePilots.values()) {
      const config = getShipConfig(pilot.shipClass);
      const remoteSkin = pilot.skinId ? COSMETIC_CATALOGUE.find((c) => c.id === pilot.skinId) : undefined;

      ctx.save();
      ctx.translate(pilot.x, pilot.y);
      ctx.rotate(pilot.angle + Math.PI / 2);

      // Ghosted wingman shield
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.stroke();

      ctx.globalAlpha = 0.88;
      renderBespokeShipCanvas(ctx, config, {
        scale: 0.95,
        overridePrimary: remoteSkin?.primaryColor,
        overrideAccent: remoteSkin?.accentColor,
        timeMs: Date.now(),
      });

      ctx.restore();

      // Render Callsign and Guild Tag
      ctx.save();
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';

      if (pilot.guildTag) {
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`[${pilot.guildTag}] ${pilot.callsign}`, pilot.x, pilot.y + 34);
      } else {
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(pilot.callsign, pilot.x, pilot.y + 34);
      }
      ctx.restore();
    }
  }

  private renderDrones() {
    const { ctx } = this;
    const config = getShipConfig(this.shipClassId);
    const eqStats = equipmentManager.getAggregatedLoadoutStats(config);
    const activeDrones = eqStats.activeDrones;
    const totalDrones = Math.min(
      18,
      activeDrones.length + Math.max(0, this.upgrades.droneCountLevel)
    );
    if (totalDrones <= 0) return;

    for (let i = 0; i < totalDrones; i++) {
      const droneItem =
        activeDrones[i % Math.max(1, activeDrones.length)] ||
        equipmentManager.getItem('drone_01')!;
      const slot = this.droneFormationSlots[i];
      const dx = slot ? slot.x : this.playerX;
      const dy = slot ? slot.y : this.playerY;

      let targetAngle = -Math.PI / 2;
      let closestDistSq = 450 * 450;
      for (const e of this.enemies) {
        const dSq = (e.x - dx) * (e.x - dx) + (e.y - dy) * (e.y - dy);
        if (dSq < closestDistSq) {
          closestDistSq = dSq;
          targetAngle = Math.atan2(e.y - dy, e.x - dx);
        }
      }

      const dColor = droneItem.color || '#38bdf8';
      const dSecondary = droneItem.secondaryColor || '#67e8f9';

      ctx.save();
      ctx.translate(dx, dy);
      ctx.rotate(targetAngle + Math.PI / 2);

      // Clean Vector-3D Escort Drone (zero background box artifacts)
      const dSize = 24 + Math.min(8, droneItem.tier * 0.35);
      renderVector3DDrone(ctx, droneItem.tier, dColor, dSecondary, dSize);

      ctx.restore();
    }
  }

  private renderEnemies() {
    const { ctx } = this;

    for (const e of this.enemies) {
      // Render Healer Emerald Energy Tether to Ally before local ship transform
      if (e.tacticalRole === 'healer' && e.healBeamTimer && e.healBeamTimer > 0 && e.healTargetId) {
        const healTarget = this.enemies.find((ally) => ally.id === e.healTargetId);
        if (healTarget) {
          ctx.save();
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.78)';
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 8;
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          ctx.moveTo(e.x, e.y);
          ctx.lineTo(healTarget.x, healTarget.y);
          ctx.stroke();
          ctx.restore();
        }
      }

      // Render Boss Shield Coupler Drone Cyan-Violet Energy Beam to Boss
      if (e.tacticalRole === 'boss_shield_drone' && e.y > 0) {
        const activeBoss = this.enemies.find((b) => b.type === 'boss');
        if (activeBoss) {
          ctx.save();
          ctx.strokeStyle = 'rgba(34, 211, 238, 0.85)';
          ctx.shadowColor = '#22d3ee';
          ctx.shadowBlur = 10;
          ctx.lineWidth = 3.2;
          ctx.beginPath();
          ctx.moveTo(e.x, e.y);
          ctx.lineTo(activeBoss.x, activeBoss.y);
          ctx.stroke();

          // Traveling energy pulse along tether beam
          const t = (Date.now() * 0.0025) % 1;
          const px = e.x + (activeBoss.x - e.x) * t;
          const py = e.y + (activeBoss.y - e.y) * t;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(px, py, 3.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      ctx.save();
      ctx.translate(e.x, e.y);

      // Direct Warp-In Holographic Materialization Effect (no moving ships across screen)
      if (e.warpInTimer && e.warpInTimer > 0) {
        const warpProg = 1 - e.warpInTimer / 0.3;
        const scale = 0.72 + warpProg * 0.28;
        ctx.scale(scale, scale);
        ctx.globalAlpha = Math.max(0.25, warpProg);

        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, e.radius * (1.6 - warpProg * 0.5), 0, Math.PI * 2);
        ctx.stroke();
      }

      // Tactical Role Auras & Precision Laser Sights
      if (e.tacticalRole === 'commander') {
        const pulse = 1 + Math.sin(Date.now() * 0.006) * 0.08;
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.65)';
        ctx.fillStyle = 'rgba(245, 158, 11, 0.1)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, (e.radius + 11) * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (e.tacticalRole === 'healer') {
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.65)';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.arc(0, 0, e.radius + 8, Date.now() * 0.003, Date.now() * 0.003 + Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (e.tacticalRole === 'boss_shield_drone') {
        const pulse = 1 + Math.sin(Date.now() * 0.008) * 0.1;
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.85)';
        ctx.fillStyle = 'rgba(34, 211, 238, 0.14)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(0, 0, (e.radius + 9) * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Telegraph sights for Laser-Snipers and Vanguard Interceptors
      if (e.isTelegraphing) {
        const isSniper = e.tacticalRole === 'sniper';
        ctx.strokeStyle = isSniper ? 'rgba(244, 63, 94, 0.82)' : 'rgba(239, 68, 68, 0.55)';
        ctx.lineWidth = isSniper ? 2.4 : 1.8;
        if (!isSniper) {
          ctx.setLineDash([5, 5]);
        }
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(this.playerX - e.x, this.playerY - e.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // ---------------------------------------------------------
      // ISOLATED SHIP HULL ROTATION BLOCK (Real 3D AI-Generated Sprites, Zero Blue Boxes, Upright 0° Labels!)
      // ---------------------------------------------------------
      ctx.save();

      if (e.isPvpRival && e.rivalShipClassId) {
        // PvP Rival Commander Ship facing downward (Math.PI)
        ctx.rotate(Math.PI);
        renderBespokeShipCanvas(ctx, e.rivalShipClassId, {
          size: e.radius * 2.25,
          overrideHullColor: '#7f1d1d',
          overrideGlowColor: '#fbbf24',
          weaponLevel: 8,
          isFiring: e.shootTimer < 0.35,
        });
      } else if (e.type === 'boss') {
        const bossAngle = Math.sin(e.patternTimer * 1.5) * 0.05;
        ctx.rotate(bossAngle);

        const r = e.radius;
        // Menacing void aura glow behind boss
        const glow = ctx.createRadialGradient(0, 0, r * 0.25, 0, 0, r * 1.35);
        glow.addColorStop(0, 'rgba(192, 132, 252, 0.35)');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.35, 0, Math.PI * 2);
        ctx.fill();

        // Render Real AI-Generated 3D Boss Dreadnought Sprite (Background-Removed)
        const bossSpriteKey = e.isMiniBoss ? 'enemy_mortar' : 'enemy_boss';
        const bossSprite =
          assetManager.getSprite(bossSpriteKey) || assetManager.getSprite('enemy_boss');
        const bossSize = r * 2.45;
        if (bossSprite) {
          ctx.save();
          ctx.shadowColor = e.glowColor || '#c084fc';
          ctx.shadowBlur = 14;
          ctx.drawImage(bossSprite, -bossSize / 2, -bossSize / 2, bossSize, bossSize);
          ctx.restore();
        }

        // Boss Shield Ring (when shield is active)
        if ((e.shieldHp || 0) > 0) {
          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 2.8;
          ctx.globalAlpha = 0.65 + Math.sin(e.patternTimer * 4) * 0.25;
          ctx.beginPath();
          ctx.arc(0, 0, r * 1.08, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        }
      } else if (e.tacticalRole === 'boss_shield_drone') {
        // Real 3D AI-Generated Shield Coupler Drone Sprite
        ctx.rotate(Date.now() * 0.002);
        const r = e.radius;
        renderVector3DDrone(ctx, 14, '#22d3ee', '#38bdf8', r * 2.35);
      } else if (e.type === 'stalker_kamikaze') {
        // Real 3D AI-Generated Crimson Stalker Interceptor Sprite
        const aimAngle = Math.atan2(this.playerY - e.y, this.playerX - e.x) - Math.PI / 2;
        ctx.rotate(aimAngle);
        const r = e.radius;
        const size = r * 2.45;
        const stalkerSprite =
          assetManager.getSprite('enemy_stalker') || assetManager.getSprite('enemy_scout');
        if (stalkerSprite) {
          ctx.shadowColor = e.glowColor || '#f43f5e';
          ctx.shadowBlur = 8;
          ctx.drawImage(stalkerSprite, -size / 2, -size / 2, size, size);
          ctx.shadowBlur = 0;
        }
      } else if (e.type === 'mortar') {
        // Real 3D AI-Generated Heavy Siege Cruiser Sprite
        const r = e.radius;
        const size = r * 2.45;
        const mortarSprite =
          assetManager.getSprite('enemy_mortar') || assetManager.getSprite('enemy_frigate');
        if (mortarSprite) {
          ctx.shadowColor = e.glowColor || '#fbbf24';
          ctx.shadowBlur = 10;
          ctx.drawImage(mortarSprite, -size / 2, -size / 2, size, size);
          ctx.shadowBlur = 0;
        }

        // Active Frontal Deflector Shield Arc
        if (e.shieldHp && e.shieldHp > 0) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.8;
          ctx.beginPath();
          ctx.arc(0, 0, r + 7, Math.PI * 0.2, Math.PI * 0.8);
          ctx.stroke();
        }
      } else if (e.type === 'frigate') {
        // Real 3D AI-Generated Tactical Gunship Frigate Sprite
        const r = e.radius;
        const size = r * 2.45;
        const frigateSprite =
          assetManager.getSprite('enemy_frigate') || assetManager.getSprite('enemy_scout');
        if (frigateSprite) {
          ctx.shadowColor = e.glowColor || '#38bdf8';
          ctx.shadowBlur = 8;
          ctx.drawImage(frigateSprite, -size / 2, -size / 2, size, size);
          ctx.shadowBlur = 0;
        }
        if (e.shieldHp && e.shieldHp > 0) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.arc(0, 0, r + 5, Math.PI * 0.2, Math.PI * 0.8);
          ctx.stroke();
        }
      } else {
        // Real 3D AI-Generated Swarmer / Scout Fighter Sprite
        const r = e.radius;
        const size = r * 2.55;
        const swarmerSprite =
          assetManager.getSprite(e.isElite ? 'enemy_scout' : 'enemy_swarmer') ||
          assetManager.getSprite('enemy_swarmer');
        if (swarmerSprite) {
          ctx.shadowColor = e.glowColor || '#ec4899';
          ctx.shadowBlur = 7;
          ctx.drawImage(swarmerSprite, -size / 2, -size / 2, size, size);
          ctx.shadowBlur = 0;
        }
      }

      if (e.isElite && e.type !== 'boss') {
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(0, 0, e.radius + 5, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore(); // END ISOLATED HULL ROTATION BLOCK — All text & HP bars below are 100% upright (0°)!

      // ---------------------------------------------------------
      // UPRIGHT (0°) TACTICAL ROLE BADGE & CRISP VECTOR HP BAR
      // ---------------------------------------------------------
      if (e.isPvpRival && e.rivalCallsign) {
        const label = `${e.rivalGuildTag || '[PVP]'} ${e.rivalCallsign}`;
        ctx.font = 'bold 10px monospace';
        const textW = ctx.measureText(label).width + 12;
        ctx.fillStyle = 'rgba(5, 9, 20, 0.92)';
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1.2;
        ctx.fillRect(-textW / 2, -e.radius - 28, textW, 14);
        ctx.strokeRect(-textW / 2, -e.radius - 28, textW, 14);
        ctx.fillStyle = '#fde047';
        ctx.textAlign = 'center';
        ctx.fillText(label, 0, -e.radius - 18);
      } else if (e.type !== 'boss') {
        if (e.tacticalRole && e.tacticalRole !== 'standard') {
          const roleLabel =
            e.tacticalRole === 'boss_shield_drone'
              ? 'SCHILD-KOPPLER'
              : e.tacticalRole === 'healer'
                ? 'HEILER'
                : e.tacticalRole === 'sniper'
                  ? 'SNIPER'
                  : 'KOMMANDANT';
          const roleColor =
            e.tacticalRole === 'boss_shield_drone'
              ? '#22d3ee'
              : e.tacticalRole === 'healer'
                ? '#34d399'
                : e.tacticalRole === 'sniper'
                  ? '#fb7185'
                  : '#fbbf24';

          ctx.font = 'bold 9px monospace';
          const pillW = ctx.measureText(roleLabel).width + 10;
          ctx.fillStyle = 'rgba(5, 9, 20, 0.92)';
          ctx.strokeStyle = roleColor;
          ctx.lineWidth = 1;
          ctx.fillRect(-pillW / 2, -e.radius - 26, pillW, 12);
          ctx.strokeRect(-pillW / 2, -e.radius - 26, pillW, 12);

          ctx.fillStyle = roleColor;
          ctx.textAlign = 'center';
          ctx.fillText(roleLabel, 0, -e.radius - 17);
        }

        if (e.hp < e.maxHp || (e.tacticalRole && e.tacticalRole !== 'standard')) {
          const barW = Math.max(34, e.radius * 2.2);
          const hpPct = Math.max(0, Math.min(1, e.hp / Math.max(1, e.maxHp)));
          const barY = -e.radius - 12;

          ctx.fillStyle = 'rgba(5, 9, 20, 0.92)';
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
          ctx.lineWidth = 1;
          ctx.fillRect(-barW / 2, barY, barW, 5);
          ctx.strokeRect(-barW / 2, barY, barW, 5);

          if (hpPct > 0) {
            ctx.fillStyle =
              e.tacticalRole === 'healer' || e.tacticalRole === 'boss_shield_drone'
                ? '#22d3ee'
                : '#f43f5e';
            ctx.fillRect(-barW / 2 + 1, barY + 1, (barW - 2) * hpPct, 3);
          }
        }
      }

      ctx.restore();
    }
  }

  private renderProjectiles() {
    const { ctx } = this;
    for (const p of this.projectiles) {
      const angle = Math.atan2(p.vy, p.vx);
      const isPlayer = p.isPlayer;
      const isCrit = p.isCrit || false;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(angle);

      if (isPlayer) {
        if (p.isMissile) {
          // Draw preloaded 3D Missile / Torpedo Sprite
          const isOmega = p.missileType === 'omega_nova_warhead';
          const spriteKey = isOmega
            ? 'missile_omega'
            : p.missileType === 'emp_disruptor'
              ? 'missile_emp'
              : p.missileType === 'heavy_torpedo'
                ? 'missile_torpedo'
                : 'missile_swarm';
          const missileImg = assetManager.getSprite(spriteKey);
          const mSize = isOmega ? 38 : p.missileType === 'heavy_torpedo' ? 32 : 24;

          if (missileImg) {
            ctx.save();
            ctx.rotate(Math.PI / 2);
            ctx.drawImage(missileImg, -mSize / 2, -mSize / 2, mSize, mSize);
            ctx.restore();
          }
        } else if (
          p.beamStyle === 'lance' ||
          p.beamStyle === 'prism' ||
          p.beamStyle === 'omega' ||
          p.pierce !== undefined
        ) {
          // High-Energy Piercing Lance / Prism / Omega Beam
          const tier = p.weaponTier || 1;
          const lanceLen = 36 + Math.min(20, tier * 0.9);
          const lanceW = 5.5 + Math.min(4.5, tier * 0.2);
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 10;

          const beamGrad = ctx.createLinearGradient(-lanceLen * 0.5, 0, lanceLen * 0.5, 0);
          beamGrad.addColorStop(0, 'transparent');
          beamGrad.addColorStop(0.25, p.secondaryColor || p.color);
          beamGrad.addColorStop(0.65, p.color);
          beamGrad.addColorStop(1, '#ffffff');

          ctx.fillStyle = beamGrad;
          ctx.beginPath();
          ctx.moveTo(lanceLen * 0.5, 0);
          ctx.lineTo(lanceLen * 0.1, -lanceW * 0.5);
          ctx.lineTo(-lanceLen * 0.5, -lanceW * 0.2);
          ctx.lineTo(-lanceLen * 0.5, lanceW * 0.2);
          ctx.lineTo(lanceLen * 0.1, lanceW * 0.5);
          ctx.closePath();
          ctx.fill();

          // Helical / Omega energy ring around high-tier beams
          if (p.beamStyle === 'omega' || p.beamStyle === 'prism' || tier >= 12) {
            ctx.strokeStyle = p.secondaryColor || '#ffffff';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.ellipse(0, 0, lanceW * 1.4, lanceW * 0.65, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.shadowBlur = 0;
        } else {
          // High-velocity directional laser bolt (pulse, twin_plasma, gatling, flak, helix, void_arc, singularity)
          const tier = p.weaponTier || 1;
          const boltLen = (isCrit ? p.radius * 5.2 + 14 : p.radius * 3.8 + 10) + Math.min(10, tier * 0.4);
          const boltW = (isCrit ? p.radius * 2.1 : p.radius * 1.45) + Math.min(2, tier * 0.08);

          // Outer glow corona
          const glowGrad = ctx.createRadialGradient(0, 0, boltW * 0.3, 0, 0, boltW * 2.1);
          glowGrad.addColorStop(0, p.color);
          glowGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(0, 0, boltW * 2.1, 0, Math.PI * 2);
          ctx.fill();

          // Directional laser core blade
          const beamGrad = ctx.createLinearGradient(-boltLen * 0.6, 0, boltLen * 0.5, 0);
          beamGrad.addColorStop(0, 'transparent');
          beamGrad.addColorStop(0.25, p.secondaryColor || p.color);
          beamGrad.addColorStop(0.8, p.color);
          beamGrad.addColorStop(1, '#ffffff');

          ctx.fillStyle = beamGrad;
          ctx.beginPath();
          ctx.moveTo(boltLen * 0.5, 0);
          ctx.lineTo(boltLen * 0.2, -boltW * 0.6);
          ctx.lineTo(-boltLen * 0.5, -boltW * 0.25);
          ctx.lineTo(-boltLen * 0.6, 0);
          ctx.lineTo(-boltLen * 0.5, boltW * 0.25);
          ctx.lineTo(boltLen * 0.2, boltW * 0.6);
          ctx.closePath();
          ctx.fill();

          // White-hot incandescent spine
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(boltLen * 0.45, 0);
          ctx.lineTo(boltLen * 0.1, -boltW * 0.25);
          ctx.lineTo(-boltLen * 0.4, 0);
          ctx.lineTo(boltLen * 0.1, boltW * 0.25);
          ctx.closePath();
          ctx.fill();

          // Critical strike or high-tier singularity/helix ring
          if (isCrit || p.beamStyle === 'singularity' || p.beamStyle === 'helix') {
            ctx.strokeStyle = p.secondaryColor || '#ffffff';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.ellipse(0, 0, boltW * 1.5, boltW * 0.75, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      } else {
        // Enemy Plasma / Void Projectile
        const isBossOrb = p.radius > 8;

        if (isBossOrb) {
          // Boss Void Singularity Orb
          const orbR = p.radius;
          const outerGrad = ctx.createRadialGradient(0, 0, orbR * 0.4, 0, 0, orbR * 1.6);
          outerGrad.addColorStop(0, '#c084fc');
          outerGrad.addColorStop(0.6, '#ef4444');
          outerGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = outerGrad;
          ctx.beginPath();
          ctx.arc(0, 0, orbR * 1.6, 0, Math.PI * 2);
          ctx.fill();

          // Swirling dark matter core
          ctx.fillStyle = '#090d16';
          ctx.beginPath();
          ctx.arc(0, 0, orbR * 0.65, 0, Math.PI * 2);
          ctx.fill();

          // Accretion arc ring
          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, orbR * 0.8, Date.now() * 0.008, Date.now() * 0.008 + Math.PI * 1.5);
          ctx.stroke();
        } else {
          // Directional alien plasma dart
          const dartLen = p.radius * 3.6 + 8;
          const dartW = p.radius * 1.4;

          const enemyGrad = ctx.createLinearGradient(-dartLen * 0.6, 0, dartLen * 0.5, 0);
          enemyGrad.addColorStop(0, 'transparent');
          enemyGrad.addColorStop(0.3, p.color);
          enemyGrad.addColorStop(0.9, '#fef08a');
          enemyGrad.addColorStop(1, '#ffffff');

          ctx.fillStyle = enemyGrad;
          ctx.beginPath();
          ctx.moveTo(dartLen * 0.5, 0);
          ctx.lineTo(dartLen * 0.1, -dartW * 0.6);
          ctx.lineTo(-dartLen * 0.5, -dartW * 0.8); // flared barb fin
          ctx.lineTo(-dartLen * 0.3, 0);
          ctx.lineTo(-dartLen * 0.5, dartW * 0.8);
          ctx.lineTo(dartLen * 0.1, dartW * 0.6);
          ctx.closePath();
          ctx.fill();

          // Inner plasma spark
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.ellipse(0, 0, dartLen * 0.25, dartW * 0.25, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    }
  }

  private renderDrops() {
    const { ctx } = this;
    const scrapSprite = assetManager.getSprite('item_scrap');
    const shieldSprite = assetManager.getSprite('item_shield_boost');
    const dmSprite = assetManager.getSprite('item_dark_matter');

    const now = Date.now();

    for (const d of this.drops) {
      ctx.save();
      ctx.translate(d.x, d.y);

      // Gentle floating bob & rotation
      const floatAngle = (now * 0.0018 + d.x * 0.05) % (Math.PI * 2);
      const pulse = 1 + Math.sin(now * 0.006 + d.y * 0.03) * 0.12;

      if (d.type === 'scrap') {
        // Stardust Quantum Scrap Ore
        const size = (d.radius * 3.0) * pulse;

        // Golden stardust glow halo
        const halo = ctx.createRadialGradient(0, 0, size * 0.2, 0, 0, size * 1.2);
        halo.addColorStop(0, 'rgba(250, 204, 21, 0.45)');
        halo.addColorStop(1, 'transparent');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(0, 0, size * 1.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.rotate(floatAngle);

        if (scrapSprite) {
          ctx.drawImage(scrapSprite, -size / 2, -size / 2, size, size);
        } else {
          // Procedural Faceted Golden Crystal Fragment
          ctx.fillStyle = '#eab308';
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(0, -size * 0.45);
          ctx.lineTo(size * 0.38, -size * 0.18);
          ctx.lineTo(size * 0.28, size * 0.4);
          ctx.lineTo(-size * 0.25, size * 0.42);
          ctx.lineTo(-size * 0.4, -size * 0.1);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Inner facet reflection
          ctx.fillStyle = '#fef9c3';
          ctx.beginPath();
          ctx.moveTo(0, -size * 0.45);
          ctx.lineTo(size * 0.15, -size * 0.1);
          ctx.lineTo(0, size * 0.2);
          ctx.lineTo(-size * 0.15, -size * 0.1);
          ctx.closePath();
          ctx.fill();
        }
      } else if (d.type === 'shield_boost') {
        // Cyan Shield Boost Capacitor Cell
        const size = (d.radius * 3.2) * pulse;

        // Electric blue deflector halo
        const halo = ctx.createRadialGradient(0, 0, size * 0.2, 0, 0, size * 1.3);
        halo.addColorStop(0, 'rgba(56, 189, 248, 0.55)');
        halo.addColorStop(1, 'transparent');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(0, 0, size * 1.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.rotate(floatAngle * 0.8);

        if (shieldSprite) {
          ctx.drawImage(shieldSprite, -size / 2, -size / 2, size, size);
        } else {
          // Procedural Hexagonal Shield Cell
          ctx.fillStyle = '#0284c7';
          ctx.strokeStyle = '#67e8f9';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          for (let s = 0; s < 6; s++) {
            const ha = (s * Math.PI) / 3;
            const hx = Math.cos(ha) * (size * 0.45);
            const hy = Math.sin(ha) * (size * 0.45);
            if (s === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Central cyan power node
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, size * 0.16, 0, Math.PI * 2);
          ctx.fill();
        }

        // Rotating deflector ring
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.62, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (d.type === 'darkmatter') {
        // Dark Matter Core
        const size = (d.radius * 3.4) * pulse;

        // Void event horizon halo
        const halo = ctx.createRadialGradient(0, 0, size * 0.25, 0, 0, size * 1.3);
        halo.addColorStop(0, 'rgba(168, 85, 247, 0.55)');
        halo.addColorStop(0.7, 'rgba(126, 34, 206, 0.2)');
        halo.addColorStop(1, 'transparent');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(0, 0, size * 1.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.rotate(-floatAngle);

        if (dmSprite) {
          ctx.drawImage(dmSprite, -size / 2, -size / 2, size, size);
        } else {
          // Procedural Void Singularity Core
          ctx.fillStyle = '#1e1b4b';
          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Inner glowing singularity
          ctx.fillStyle = '#e9d5ff';
          ctx.beginPath();
          ctx.arc(0, 0, size * 0.18, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Overdrive surge / other pickup
        const size = (d.radius * 3.0) * pulse;
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#fed7aa';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.55, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  private renderParticles() {
    const { ctx } = this;
    const len = this.particles.length;
    if (len === 0) return;

    for (let i = 0; i < len; i++) {
      const p = this.particles[i];
      ctx.globalAlpha = Math.max(0, p.alpha);

      if (p.shape === 'spark') {
        // High-velocity directional kinetic spark streak
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.min(2.5, p.size * 0.75);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        // Motion streak trails backward along velocity vector
        ctx.lineTo(p.x - p.vx * 0.032, p.y - p.vy * 0.032);
        ctx.stroke();
      } else if (p.shape === 'ring') {
        // Expanding shockwave ripple
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        const r = p.size * (1 + (1 - p.alpha) * 3.5);
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.shape === 'square') {
        // Matrix data pixels
        ctx.fillStyle = p.color;
        const half = p.size;
        ctx.fillRect(p.x - half, p.y - half, half * 2, half * 2);
      } else {
        // Soft glowing particle circle
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1.0;
  }

  private renderFloatingTexts() {
    const { ctx } = this;
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.font = ft.isCrit ? 'bold 15px monospace' : '12px monospace';
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }

  // -----------------------------------------------------------
  // UPGRADES & PROGRESSION (SINGLE, x10 & MAX BULK BUY + AUTO-UPGRADE)
  // -----------------------------------------------------------
  public isUpgradeMaxed(statKey: keyof PlayerUpgrades, levelOverride?: number): boolean {
    const lvl = levelOverride ?? (this.upgrades[statKey] ?? 1);
    return statKey === 'droneCountLevel' && lvl >= 5;
  }

  public getUpgradeCostForLevel(statKey: keyof PlayerUpgrades, level: number): number {
    const baseCosts: Record<keyof PlayerUpgrades, number> = {
      weaponLevel: 150,
      damageLevel: 50,
      fireRateLevel: 60,
      critChanceLevel: 80,
      critDamageLevel: 75,
      shieldCapacityLevel: 45,
      shieldRegenLevel: 60,
      hullArmorLevel: 40,
      droneCountLevel: 250,
      dronePowerLevel: 100,
      magnetLevel: 30,
      idleCollectorLevel: 80,
      aiPilotLevel: 110,
    };
    return Math.round(baseCosts[statKey] * Math.pow(1.45, Math.max(0, level - 1)));
  }

  public getUpgradeCost(statKey: keyof PlayerUpgrades): number {
    const current = this.upgrades[statKey] ?? 1;
    return this.getUpgradeCostForLevel(statKey, current);
  }

  public getBulkUpgradeQuote(
    statKey: keyof PlayerUpgrades,
    mode: BuyMultiplierMode
  ): { levels: number; cost: number; isMaxed: boolean } {
    const currentLevel = this.upgrades[statKey] ?? 1;
    if (this.isUpgradeMaxed(statKey, currentLevel)) {
      return { levels: 0, cost: 0, isMaxed: true };
    }

    const maxAllowedLevel = statKey === 'droneCountLevel' ? 5 : currentLevel + 100;
    const maxPossibleLevels = Math.max(1, maxAllowedLevel - currentLevel);

    if (mode === '1x') {
      return {
        levels: 1,
        cost: this.getUpgradeCostForLevel(statKey, currentLevel),
        isMaxed: false,
      };
    }

    if (mode === '10x') {
      const targetLevels = Math.min(10, maxPossibleLevels);
      let totalCost = 0;
      for (let i = 0; i < targetLevels; i++) {
        totalCost += this.getUpgradeCostForLevel(statKey, currentLevel + i);
      }
      return {
        levels: targetLevels,
        cost: totalCost,
        isMaxed: false,
      };
    }

    // mode === 'max': compute maximum affordable levels >= 1
    let affordableLevels = 0;
    let runningCost = 0;
    for (let i = 0; i < maxPossibleLevels; i++) {
      const nextStepCost = this.getUpgradeCostForLevel(statKey, currentLevel + i);
      if (runningCost + nextStepCost <= this.scrap) {
        runningCost += nextStepCost;
        affordableLevels++;
      } else {
        break;
      }
    }

    if (affordableLevels === 0) {
      return {
        levels: 1,
        cost: this.getUpgradeCostForLevel(statKey, currentLevel),
        isMaxed: false,
      };
    }

    return {
      levels: affordableLevels,
      cost: runningCost,
      isMaxed: false,
    };
  }

  public purchaseUpgrade(statKey: keyof PlayerUpgrades, mode: BuyMultiplierMode = '1x'): boolean {
    const quote = this.getBulkUpgradeQuote(statKey, mode);
    if (quote.isMaxed || quote.levels <= 0) return false;
    if (this.scrap >= quote.cost) {
      const oldLevel = this.upgrades[statKey] ?? 1;
      const newLevel = oldLevel + quote.levels;
      this.scrap -= quote.cost;
      this.upgrades[statKey] = newLevel;
      this.applyUpgradesToShip();
      sound.playUpgrade();
      this.saveProgress();

      if (Math.floor(newLevel / 10) > Math.floor(oldLevel / 10)) {
        this.addFloatingText(
          `MEILENSTEIN LV.${Math.floor(newLevel / 10) * 10}: +35% SYNERGIE-SCHUB!`,
          this.playerX,
          this.playerY - 46,
          '#fbbf24',
          true
        );
        this.addParticles(this.playerX, this.playerY, 24, '#fbbf24', 'ring');
      }
      return true;
    }
    return false;
  }

  public purchaseTech(techKey: keyof TechLabResearches): boolean {
    const current = this.tech[techKey] ?? 0;
    const cost = (current + 1) * 8;
    if (this.darkMatter >= cost) {
      this.darkMatter -= cost;
      this.tech[techKey] = current + 1;
      sound.playUpgrade();
      this.saveProgress();
      return true;
    }
    return false;
  }

  public saveProgress() {
    try {
      localStorage.setItem('aether_upgrades', JSON.stringify(this.upgrades));
      localStorage.setItem('aether_tech', JSON.stringify(this.tech));
      localStorage.setItem('aether_achievements', JSON.stringify(this.achievementTiers));
      localStorage.setItem(
        'aether_currency',
        JSON.stringify({
          scrap: this.scrap,
          darkMatter: this.darkMatter,
          sector: this.sector,
          totalKills: this.totalKills,
          totalBosses: this.totalBosses,
        })
      );
      localStorage.setItem(
        'aether_idle_prefs',
        JSON.stringify({
          gameSpeed: this.gameSpeed,
          bossAutoRetry: this.bossAutoRetry,
          autoUpgradeEnabled: this.autoUpgradeEnabled,
          lastActiveTimestamp: Date.now(),
        })
      );
    } catch (e) {}
  }

  public loadSavedProgress() {
    try {
      const up = localStorage.getItem('aether_upgrades');
      if (up) {
        const parsedUp = JSON.parse(up);
        this.upgrades = { ...this.upgrades, ...parsedUp, aiPilotLevel: parsedUp.aiPilotLevel ?? 1 };
      }

      const tc = localStorage.getItem('aether_tech');
      if (tc) this.tech = { ...this.tech, ...JSON.parse(tc) };

      const ach = localStorage.getItem('aether_achievements');
      if (ach) {
        this.achievementTiers = { ...this.achievementTiers, ...JSON.parse(ach) };
      }

      const cur = localStorage.getItem('aether_currency');
      if (cur) {
        const parsed = JSON.parse(cur);
        this.scrap = parsed.scrap ?? this.scrap;
        this.darkMatter = parsed.darkMatter ?? this.darkMatter;
        if (parsed.sector && parsed.sector >= 1) {
          this.sector = parsed.sector;
        }
        if (typeof parsed.totalKills === 'number') {
          this.totalKills = parsed.totalKills;
        }
        if (typeof parsed.totalBosses === 'number') {
          this.totalBosses = parsed.totalBosses;
        }
      }

      const prefs = localStorage.getItem('aether_idle_prefs');
      if (prefs) {
        const parsedPrefs = JSON.parse(prefs);
        if (parsedPrefs.gameSpeed === 1 || parsedPrefs.gameSpeed === 2 || parsedPrefs.gameSpeed === 3) {
          this.gameSpeed = parsedPrefs.gameSpeed;
        }
        if (typeof parsedPrefs.bossAutoRetry === 'boolean') {
          this.bossAutoRetry = parsedPrefs.bossAutoRetry;
        }
        if (typeof parsedPrefs.autoUpgradeEnabled === 'boolean') {
          this.autoUpgradeEnabled = parsedPrefs.autoUpgradeEnabled;
        }

        // Compute Offline-AFK Rewards if player was away for >= 60 seconds
        if (typeof parsedPrefs.lastActiveTimestamp === 'number') {
          const elapsedSec = Math.floor((Date.now() - parsedPrefs.lastActiveTimestamp) / 1000);
          if (elapsedSec >= 60) {
            const cappedSec = Math.min(elapsedSec, 12 * 3600);
            const collectorLvl = Math.max(0, this.upgrades.idleCollectorLevel || 0);
            const dmgLvl = Math.max(1, this.upgrades.damageLevel || 1);
            const scrapPerSec =
              (2.8 + this.sector * 3.5 + collectorLvl * 3.8 + dmgLvl * 0.9) *
              this.getMilestoneMultiplier(Math.max(1, collectorLvl)) *
              (1 + (this.tech.quantumScrapRefinery || 0) * 0.25);
            const scrapEarned = Math.max(25, Math.round(cappedSec * scrapPerSec * 0.55));
            const darkMatterEarned = Math.max(
              1,
              Math.floor(cappedSec / 180) * Math.max(1, Math.floor(this.sector * 0.8))
            );
            this.pendingOfflineReward = {
              elapsedSeconds: cappedSec,
              awaySeconds: cappedSec,
              scrapEarned,
              darkMatterEarned,
            };
          }
        }
      }
    } catch (e) {}
  }

  public resetRun(startSector?: number) {
    this.enemies = [];
    this.asteroids = [];
    this.projectiles = [];
    this.particles = [];
    this.drops = [];
    this.floatingTexts = [];
    if (startSector && startSector >= 1) {
      this.sector = startSector;
    }
    this.wave = 1;
    this.waveTimer = 0;
    this.waveEnemyTotal = 0;
    this.waveSpawnCooldown = 0;
    this.isBossWave = false;
    this.applyUpgradesToShip();
    this.playerHp = this.playerMaxHp;
    this.playerShield = this.playerMaxShield;
    this.specialCooldownTimer = 0;
    this.specialActiveTimer = 0;
    this.phaseDashCooldownTimer = 0;
    this.phaseDashActiveTimer = 0;
  }
}
