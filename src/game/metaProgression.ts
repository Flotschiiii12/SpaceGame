import { ShipClassId } from './types.ts';

export type DamageFilterMode = 'all' | 'crit' | 'off';

export interface PvpLeagueTier {
  id: string;
  name: string;
  minTrophies: number;
  badgeColor: string;
  color: string;
  damageMult: number;
  shieldMult: number;
  dailyMedals: number;
}

export const PVP_LEAGUES: PvpLeagueTier[] = [
  {
    id: 'bronze',
    name: 'Bronze-Division',
    minTrophies: 0,
    badgeColor: '#d97706',
    color: '#d97706',
    damageMult: 1.0,
    shieldMult: 1.0,
    dailyMedals: 40,
  },
  {
    id: 'silver',
    name: 'Silber-Division',
    minTrophies: 1200,
    badgeColor: '#94a3b8',
    color: '#94a3b8',
    damageMult: 1.12,
    shieldMult: 1.12,
    dailyMedals: 75,
  },
  {
    id: 'gold',
    name: 'Gold-Division',
    minTrophies: 1500,
    badgeColor: '#fbbf24',
    color: '#fbbf24',
    damageMult: 1.28,
    shieldMult: 1.25,
    dailyMedals: 120,
  },
  {
    id: 'platinum',
    name: 'Platin-Division',
    minTrophies: 1850,
    badgeColor: '#22d3ee',
    color: '#22d3ee',
    damageMult: 1.48,
    shieldMult: 1.42,
    dailyMedals: 180,
  },
  {
    id: 'diamond',
    name: 'Diamant-Division',
    minTrophies: 2250,
    badgeColor: '#c084fc',
    color: '#c084fc',
    damageMult: 1.75,
    shieldMult: 1.65,
    dailyMedals: 260,
  },
  {
    id: 'grandmaster',
    name: 'Großmeister-Liga',
    minTrophies: 2700,
    badgeColor: '#f43f5e',
    color: '#f43f5e',
    damageMult: 2.15,
    shieldMult: 2.0,
    dailyMedals: 400,
  },
];

export interface PvpOpponent {
  id: string;
  callsign: string;
  guildTag: string;
  title: string;
  difficulty: 'easy' | 'equal' | 'elite';
  trophies: number;
  shipClassId: ShipClassId;
  shipTier: number;
  commanderName: string;
  powerRating: number;
  hp: number;
  shield: number;
  hullMax: number;
  shieldMax: number;
  dps: number;
  droneCount: number;
  primaryColor: string;
  accentColor: string;
  rewardTrophies: number;
  rewardMedals: number;
  rewardDarkMatter: number;
  rewardScrap: number;
}

export interface HonorShopItem {
  id: string;
  name: string;
  category: 'relic' | 'weapon_mod' | 'shield_mod' | 'resource';
  desc: string;
  bonusText: string;
  baseCostMedals: number;
  maxLevel: number;
}

export const HONOR_SHOP_ITEMS: HonorShopItem[] = [
  {
    id: 'arena_plasma_core',
    name: 'Gladiatoren-Plasmakern',
    category: 'weapon_mod',
    desc: 'Exklusiver Arena-Waffenverstärker für alle ausgerüsteten Laser- und Raketen-Slots.',
    bonusText: '+22% Globaler Waffenschaden pro Rang',
    baseCostMedals: 60,
    maxLevel: 15,
  },
  {
    id: 'arena_aegis_matrix',
    name: 'Zitadellen-Deflektorspule',
    category: 'shield_mod',
    desc: 'Hochfrequenz-Schildmatrix aus der Großmeister-Arena.',
    bonusText: '+25% Max. Schild & Schild-Regeneration pro Rang',
    baseCostMedals: 60,
    maxLevel: 15,
  },
  {
    id: 'arena_chrono_injector',
    name: 'Chrono-Skill-Injektor',
    category: 'relic',
    desc: 'Verkürzt die Abklingzeit von Ultimate, Aegis-Schild und Raketen dauerhaft.',
    bonusText: '-6% Skill-Cooldown pro Rang (Max 10)',
    baseCostMedals: 85,
    maxLevel: 10,
  },
  {
    id: 'arena_bounty_scanner',
    name: 'Imperiales Beute-Dekret',
    category: 'relic',
    desc: 'Steigert Schrott-, Dark-Matter- und Ehren-Medaillen-Ausbeute in allen Modi.',
    bonusText: '+25% Scrap & Dark Matter pro Rang',
    baseCostMedals: 75,
    maxLevel: 15,
  },
];

export interface CommanderPilot {
  id: string;
  name: string;
  role: string;
  specialty: string;
  accentColor: string;
  unlockCostDm: number;
  baseUpgradeCostDm: number;
  passiveDesc: string;
}

export const COMMANDER_PILOTS: CommanderPilot[] = [
  {
    id: 'cmd_vance',
    name: 'Admiral Kaelen Vance',
    role: 'Flotten-Taktiker',
    specialty: 'Waffenschaden & Krit-Salven',
    accentColor: '#38bdf8',
    unlockCostDm: 0,
    baseUpgradeCostDm: 15,
    passiveDesc: '+18% Waffenschaden & +4% Krit-Chance pro Piloten-Stufe',
  },
  {
    id: 'cmd_voss',
    name: 'Kommandantin Lyra Voss',
    role: 'Aegis-Bollwerk',
    specialty: 'Schild-Festung & Rüstung',
    accentColor: '#10b981',
    unlockCostDm: 35,
    baseUpgradeCostDm: 20,
    passiveDesc: '+24% Schild-/Hüllen-Kapazität & +3% Schadensreduktion pro Stufe',
  },
  {
    id: 'cmd_nyx',
    name: 'Nyx „Voidwalker“ Chronos',
    role: 'Singularitäts-Assassine',
    specialty: 'Boss-Schaden & Skill-Tempo',
    accentColor: '#c084fc',
    unlockCostDm: 65,
    baseUpgradeCostDm: 25,
    passiveDesc: '+28% Schaden gegen Bosse/PvP-Rivalen & -5% Skill-Cooldown pro Stufe',
  },
  {
    id: 'cmd_solaris',
    name: 'Archon Valerius Solaris',
    role: 'Orbital-Großmeister',
    specialty: 'Drohnen-Schwarm & Wirtschaft',
    accentColor: '#fbbf24',
    unlockCostDm: 95,
    baseUpgradeCostDm: 30,
    passiveDesc: '+30% Drohnen-Feuerkraft & +25% Scrap-/Dark-Matter-Ertrag pro Stufe',
  },
];

export interface FleetExpeditionSlot {
  id: string;
  title: string;
  sectorName: string;
  durationSeconds: number;
  assignedShipId: string | null;
  startedAt: number | null;
  baseScrapReward: number;
  baseDmReward: number;
  baseMedalsReward: number;
}

export interface BossCodexEntry {
  id: string;
  name: string;
  title: string;
  sectorUnlocked: number;
  isMiniBoss: boolean;
  weakness: string;
  lore: string;
  accentColor: string;
  rewardDm: number;
  rewardMedals: number;
  bossDmgBonusPct: number;
}

export const BOSS_CODEX_ENTRIES: BossCodexEntry[] = [
  {
    id: 'boss_vanguard_mini',
    name: 'Vanguard Belagerungs-Kreuzer',
    title: 'Welle-5 Sektor-Wächter',
    sectorUnlocked: 1,
    isMiniBoss: true,
    weakness: 'Schild-Koppler zuerst zerstören (+50% Stagger-Schaden)',
    lore: 'Schwer gepanzerter Vorposten-Kreuzer, der die mittlere Sektor-Route blockiert.',
    accentColor: '#f97316',
    rewardDm: 25,
    rewardMedals: 40,
    bossDmgBonusPct: 10,
  },
  {
    id: 'boss_goliath',
    name: 'Goliath Siege Dreadnought',
    title: 'Welle-10 Kapitel-Titan (Sektor 1)',
    sectorUnlocked: 1,
    isMiniBoss: false,
    weakness: 'Aegis-Schild bei Radial-Salven aktivieren',
    lore: 'Kapitales Schlachtschiff der Orion-Piratenflotte mit Zwillings-Schildkopplern.',
    accentColor: '#ef4444',
    rewardDm: 50,
    rewardMedals: 75,
    bossDmgBonusPct: 15,
  },
  {
    id: 'boss_eclipse',
    name: 'Eclipse Void Colossus',
    title: 'Welle-10 Kapitel-Titan (Sektor 2)',
    sectorUnlocked: 2,
    isMiniBoss: false,
    weakness: 'Durchschlagende Lanzen- & Prismen-Waffen',
    lore: 'Aus dunkler Materie geformter Koloss aus dem tiefen Kuiper-Abgrund.',
    accentColor: '#a855f7',
    rewardDm: 85,
    rewardMedals: 110,
    bossDmgBonusPct: 20,
  },
  {
    id: 'boss_aegis_hive',
    name: 'Aegis Hive Core',
    title: 'Welle-10 Kapitel-Titan (Sektor 3)',
    sectorUnlocked: 3,
    isMiniBoss: false,
    weakness: 'EMP-Raketen & hohe Krit-Salven',
    lore: 'Zentraler KI-Schwarmkern mit regenerativen Deflektor-Schichten.',
    accentColor: '#eab308',
    rewardDm: 130,
    rewardMedals: 160,
    bossDmgBonusPct: 25,
  },
  {
    id: 'boss_singularity_sovereign',
    name: 'Singularity Sovereign',
    title: 'Endgame Rift-Herrscher',
    sectorUnlocked: 4,
    isMiniBoss: false,
    weakness: 'Maximale ★5 Stern-Fusion & Großmeister-Aura',
    lore: 'Transzendenter Wächter am Ereignishorizont des Tachyon-Kerns.',
    accentColor: '#22d3ee',
    rewardDm: 200,
    rewardMedals: 250,
    bossDmgBonusPct: 30,
  },
];

const STORAGE_KEY_META = 'aether_meta_progression_v1';

class MetaProgressionManager {
  // PvP Arena State
  public trophies: number = 1000;
  public honorMedals: number = 120;
  public arenaTickets: number = 5;
  public maxArenaTickets: number = 5;
  public lastTicketResetDay: string = '';
  public pvpWins: number = 0;
  public pvpMatches: number = 0;
  public honorShopLevels: Record<string, number> = {};
  public dailyLeagueClaimedDay: string = '';

  public get pvpTrophies(): number {
    return this.trophies;
  }

  public set pvpTrophies(val: number) {
    this.trophies = val;
  }

  // Commander Pilots State
  public activeCommanderId: string = 'cmd_vance';
  public commanderLevels: Record<string, number> = {
    cmd_vance: 1,
    cmd_voss: 0,
    cmd_nyx: 0,
    cmd_solaris: 0,
  };

  // Fleet Expeditions State
  public expeditions: FleetExpeditionSlot[] = [
    {
      id: 'exp_patrol',
      title: 'Orion-Sektor Patrouille',
      sectorName: '15 Min. Schnell-Einsatz',
      durationSeconds: 15 * 60,
      assignedShipId: 'ship_01',
      startedAt: Date.now() - 15 * 60 * 1000, // Ready to claim immediately on first visit!
      baseScrapReward: 1200,
      baseDmReward: 15,
      baseMedalsReward: 25,
    },
    {
      id: 'exp_nebula',
      title: 'Kuiper-Nebel Bergung',
      sectorName: '1 Std. Tiefen-Bergung',
      durationSeconds: 60 * 60,
      assignedShipId: null,
      startedAt: null,
      baseScrapReward: 4800,
      baseDmReward: 45,
      baseMedalsReward: 65,
    },
    {
      id: 'exp_void',
      title: 'Singularitäts-Flotten-Raid',
      sectorName: '4 Std. Groß-Expedition',
      durationSeconds: 4 * 3600,
      assignedShipId: null,
      startedAt: null,
      baseScrapReward: 18500,
      baseDmReward: 140,
      baseMedalsReward: 180,
    },
  ];

  // Boss Codex State
  public bossKillCounts: Record<string, number> = {
    boss_vanguard_mini: 0,
    boss_goliath: 0,
    boss_eclipse: 0,
    boss_aegis_hive: 0,
    boss_singularity_sovereign: 0,
  };
  public claimedBossBounties: Record<string, boolean> = {};

  // Visual Comfort Filter
  public damageFilter: DamageFilterMode = 'all';

  constructor() {
    this.loadState();
    this.checkDailyTicketRefresh();
  }

  private getTodayKey(): string {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  public checkDailyTicketRefresh() {
    const today = this.getTodayKey();
    if (this.lastTicketResetDay !== today) {
      this.lastTicketResetDay = today;
      this.arenaTickets = Math.max(this.arenaTickets, this.maxArenaTickets);
      this.saveState();
    }
  }

  public loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_META);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (typeof parsed.trophies === 'number' && !Number.isNaN(parsed.trophies))
        this.trophies = parsed.trophies;
      if (typeof parsed.honorMedals === 'number' && !Number.isNaN(parsed.honorMedals))
        this.honorMedals = parsed.honorMedals;
      if (typeof parsed.arenaTickets === 'number' && !Number.isNaN(parsed.arenaTickets))
        this.arenaTickets = parsed.arenaTickets;
      if (typeof parsed.lastTicketResetDay === 'string')
        this.lastTicketResetDay = parsed.lastTicketResetDay;
      if (typeof parsed.pvpWins === 'number') this.pvpWins = parsed.pvpWins;
      if (typeof parsed.pvpMatches === 'number') this.pvpMatches = parsed.pvpMatches;
      if (parsed.honorShopLevels) this.honorShopLevels = { ...parsed.honorShopLevels };
      if (typeof parsed.dailyLeagueClaimedDay === 'string')
        this.dailyLeagueClaimedDay = parsed.dailyLeagueClaimedDay;
      if (typeof parsed.activeCommanderId === 'string')
        this.activeCommanderId = parsed.activeCommanderId;
      if (parsed.commanderLevels)
        this.commanderLevels = { ...this.commanderLevels, ...parsed.commanderLevels };
      if (Array.isArray(parsed.expeditions) && parsed.expeditions.length === 3) {
        this.expeditions = parsed.expeditions;
      }
      if (parsed.bossKillCounts)
        this.bossKillCounts = { ...this.bossKillCounts, ...parsed.bossKillCounts };
      if (parsed.claimedBossBounties)
        this.claimedBossBounties = { ...parsed.claimedBossBounties };
      if (
        parsed.damageFilter === 'all' ||
        parsed.damageFilter === 'crit' ||
        parsed.damageFilter === 'off'
      ) {
        this.damageFilter = parsed.damageFilter;
      }
    } catch {}
  }

  public saveState() {
    try {
      localStorage.setItem(
        STORAGE_KEY_META,
        JSON.stringify({
          trophies: this.trophies,
          honorMedals: this.honorMedals,
          arenaTickets: this.arenaTickets,
          lastTicketResetDay: this.lastTicketResetDay,
          pvpWins: this.pvpWins,
          pvpMatches: this.pvpMatches,
          honorShopLevels: this.honorShopLevels,
          dailyLeagueClaimedDay: this.dailyLeagueClaimedDay,
          activeCommanderId: this.activeCommanderId,
          commanderLevels: this.commanderLevels,
          expeditions: this.expeditions,
          bossKillCounts: this.bossKillCounts,
          claimedBossBounties: this.claimedBossBounties,
          damageFilter: this.damageFilter,
        })
      );
    } catch {}
  }

  public cycleDamageFilter(): DamageFilterMode {
    this.damageFilter =
      this.damageFilter === 'all' ? 'crit' : this.damageFilter === 'crit' ? 'off' : 'all';
    this.saveState();
    return this.damageFilter;
  }

  public getCurrentLeague(): PvpLeagueTier {
    let current = PVP_LEAGUES[0];
    for (const league of PVP_LEAGUES) {
      if (this.trophies >= league.minTrophies) {
        current = league;
      }
    }
    return current;
  }

  public getNextLeague(): PvpLeagueTier | null {
    for (const league of PVP_LEAGUES) {
      if (league.minTrophies > this.trophies) {
        return league;
      }
    }
    return null;
  }

  public canClaimDailyLeagueReward(): boolean {
    return this.dailyLeagueClaimedDay !== this.getTodayKey();
  }

  public claimDailyLeagueReward(): number {
    if (!this.canClaimDailyLeagueReward()) return 0;
    const league = this.getCurrentLeague();
    this.dailyLeagueClaimedDay = this.getTodayKey();
    this.honorMedals += league.dailyMedals;
    this.saveState();
    return league.dailyMedals;
  }

  public generateOpponents(playerPower: number = 1200, playerSector: number = 1): PvpOpponent[] {
    const safePower = Number.isFinite(playerPower) && playerPower > 0 ? playerPower : 1200;
    const safeSector = Number.isFinite(playerSector) && playerSector > 0 ? playerSector : 1;
    const baseHp = Math.max(650, Math.round(safePower * 3.2 + safeSector * 450));
    const baseShield = Math.max(420, Math.round(safePower * 2.1 + safeSector * 300));
    const baseDps = Math.max(35, Math.round(safePower * 0.14 + safeSector * 18));

    const easyHp = Math.round(baseHp * 0.78);
    const easyShield = Math.round(baseShield * 0.78);
    const equalHp = Math.round(baseHp * 1.05);
    const equalShield = Math.round(baseShield * 1.05);
    const eliteHp = Math.round(baseHp * 1.38);
    const eliteShield = Math.round(baseShield * 1.38);

    return [
      {
        id: 'opp_easy',
        callsign: 'Kpt. Thorne',
        guildTag: 'ORION',
        title: 'Vorhut-Patrouille',
        difficulty: 'easy',
        trophies: Math.max(850, this.trophies - 90),
        shipClassId: 'ship_04',
        shipTier: Math.max(2, safeSector * 2),
        commanderName: 'Admiral Vance',
        powerRating: Math.round(safePower * 0.82),
        hp: easyHp,
        shield: easyShield,
        hullMax: easyHp,
        shieldMax: easyShield,
        dps: Math.round(baseDps * 0.75),
        droneCount: 2,
        primaryColor: '#38bdf8',
        accentColor: '#22d3ee',
        rewardTrophies: 18,
        rewardMedals: 35,
        rewardDarkMatter: 12,
        rewardScrap: Math.round(1400 * safeSector),
      },
      {
        id: 'opp_equal',
        callsign: 'Kommandantin Vex',
        guildTag: 'AEGIS',
        title: 'Sektor-Duellantin',
        difficulty: 'equal',
        trophies: this.trophies + 15,
        shipClassId: 'ship_12',
        shipTier: Math.max(6, safeSector * 4),
        commanderName: 'Lyra Voss',
        powerRating: Math.round(safePower * 1.05),
        hp: equalHp,
        shield: equalShield,
        hullMax: equalHp,
        shieldMax: equalShield,
        dps: Math.round(baseDps * 0.95),
        droneCount: 3,
        primaryColor: '#c084fc',
        accentColor: '#e879f9',
        rewardTrophies: 28,
        rewardMedals: 55,
        rewardDarkMatter: 22,
        rewardScrap: Math.round(2600 * safeSector),
      },
      {
        id: 'opp_elite',
        callsign: 'Lord Sovereign Kael',
        guildTag: 'APEX',
        title: 'Großmeister-Champion',
        difficulty: 'elite',
        trophies: this.trophies + 140,
        shipClassId: 'ship_25',
        shipTier: Math.max(12, safeSector * 6),
        commanderName: 'Nyx Chronos',
        powerRating: Math.round(safePower * 1.35),
        hp: eliteHp,
        shield: eliteShield,
        hullMax: eliteHp,
        shieldMax: eliteShield,
        dps: Math.round(baseDps * 1.18),
        droneCount: 4,
        primaryColor: '#f43f5e',
        accentColor: '#fbbf24',
        rewardTrophies: 42,
        rewardMedals: 85,
        rewardDarkMatter: 38,
        rewardScrap: Math.round(4500 * safeSector),
      },
    ];
  }

  public recordPvpMatchResult(
    won: boolean,
    rival: PvpOpponent
  ): {
    trophyDelta: number;
    honorAwarded: number;
    scrapAwarded: number;
    dmAwarded: number;
  } {
    this.pvpMatches++;
    if (won) {
      this.pvpWins++;
      const trophyDelta = rival.rewardTrophies;
      const honorAwarded = rival.rewardMedals;
      const scrapAwarded = rival.rewardScrap || 2500;
      const dmAwarded = rival.rewardDarkMatter || 20;
      this.trophies += trophyDelta;
      this.honorMedals += honorAwarded;
      this.saveState();
      return { trophyDelta, honorAwarded, scrapAwarded, dmAwarded };
    } else {
      const trophyDelta = -Math.min(12, Math.max(5, Math.round(rival.rewardTrophies * 0.35)));
      const honorAwarded = Math.max(10, Math.round(rival.rewardMedals * 0.3));
      const scrapAwarded = Math.max(400, Math.round((rival.rewardScrap || 1500) * 0.35));
      this.trophies = Math.max(800, this.trophies + trophyDelta);
      this.honorMedals += honorAwarded;
      this.saveState();
      return { trophyDelta, honorAwarded, scrapAwarded, dmAwarded: 5 };
    }
  }

  public getArenaLeaderboard(playerCallsign: string = 'Kommandant', playerPower: number = 1200) {
    const safePower = Number.isFinite(playerPower) && playerPower > 0 ? playerPower : 1200;
    const rivals = [
      { callsign: 'Imperator_Zero', guildTag: 'OMEGA', trophies: 3120, shipTier: 50, power: Math.max(95000, Math.round(safePower * 3.4)), isPlayer: false },
      { callsign: 'Nyx_Valerie', guildTag: 'VOID', trophies: 2790, shipTier: 44, power: Math.max(64000, Math.round(safePower * 2.5)), isPlayer: false },
      { callsign: 'Archon_Solaris', guildTag: 'SUN', trophies: 2380, shipTier: 36, power: Math.max(42000, Math.round(safePower * 1.9)), isPlayer: false },
      { callsign: 'Aegis_Kaelen', guildTag: 'AEGIS', trophies: 1940, shipTier: 28, power: Math.max(24000, Math.round(safePower * 1.4)), isPlayer: false },
      { callsign: 'Valkyrie_Nova', guildTag: 'STAR', trophies: 1560, shipTier: 19, power: Math.max(12500, Math.round(safePower * 1.15)), isPlayer: false },
      { callsign: 'Draco_Slayer', guildTag: 'CORE', trophies: 1240, shipTier: 12, power: Math.max(6200, Math.round(safePower * 0.92)), isPlayer: false },
      { callsign: 'Orion_Scout', guildTag: 'RIFT', trophies: 960, shipTier: 6, power: Math.max(2800, Math.round(safePower * 0.65)), isPlayer: false },
      {
        callsign: playerCallsign || 'Kommandant',
        guildTag: 'YOU',
        trophies: this.trophies,
        shipTier: Math.max(1, Math.min(50, Math.round(this.trophies / 65))),
        power: Math.round(safePower),
        isPlayer: true,
      },
    ];
    return rivals.sort((a, b) => b.trophies - a.trophies);
  }

  public getHonorShopCost(itemId: string): number {
    const item = HONOR_SHOP_ITEMS.find((i) => i.id === itemId);
    if (!item) return 9999;
    const lvl = this.honorShopLevels[itemId] || 0;
    return Math.round(item.baseCostMedals * Math.pow(1.35, lvl));
  }

  public purchaseHonorShopItem(itemId: string): boolean {
    const item = HONOR_SHOP_ITEMS.find((i) => i.id === itemId);
    if (!item) return false;
    const lvl = this.honorShopLevels[itemId] || 0;
    if (lvl >= item.maxLevel) return false;
    const cost = this.getHonorShopCost(itemId);
    if (this.honorMedals < cost) return false;
    this.honorMedals -= cost;
    this.honorShopLevels[itemId] = lvl + 1;
    this.saveState();
    return true;
  }

  // Commander Pilot Management
  public getActiveCommander(): CommanderPilot {
    return (
      COMMANDER_PILOTS.find((c) => c.id === this.activeCommanderId) || COMMANDER_PILOTS[0]
    );
  }

  public getCommanderLevel(id: string): number {
    return this.commanderLevels[id] || 0;
  }

  public getCommanderUpgradeCost(id: string): number {
    const cmd = COMMANDER_PILOTS.find((c) => c.id === id);
    if (!cmd) return 999;
    const lvl = this.getCommanderLevel(id);
    if (lvl === 0) return cmd.unlockCostDm;
    return Math.round(cmd.baseUpgradeCostDm * Math.pow(1.42, lvl - 1));
  }

  // Record Boss Kill for Codex
  public recordBossDefeated(isMiniBoss: boolean, sector: number, isEndlessRift: boolean = false) {
    if (isMiniBoss) {
      this.bossKillCounts.boss_vanguard_mini = (this.bossKillCounts.boss_vanguard_mini || 0) + 1;
    } else if (isEndlessRift || sector >= 4) {
      this.bossKillCounts.boss_singularity_sovereign =
        (this.bossKillCounts.boss_singularity_sovereign || 0) + 1;
    } else if (sector % 3 === 1) {
      this.bossKillCounts.boss_goliath = (this.bossKillCounts.boss_goliath || 0) + 1;
    } else if (sector % 3 === 2) {
      this.bossKillCounts.boss_eclipse = (this.bossKillCounts.boss_eclipse || 0) + 1;
    } else {
      this.bossKillCounts.boss_aegis_hive = (this.bossKillCounts.boss_aegis_hive || 0) + 1;
    }
    this.saveState();
  }

  public recordBossKill(sector: number, isMiniBoss: boolean) {
    this.recordBossDefeated(isMiniBoss, sector, false);
  }

  public getClaimableCount(): number {
    let count = 0;
    if (this.canClaimDailyLeagueReward()) count++;
    for (const exp of this.expeditions) {
      if (exp.startedAt && Date.now() - exp.startedAt >= exp.durationSeconds * 1000) {
        count++;
      }
    }
    for (const entry of BOSS_CODEX_ENTRIES) {
      if ((this.bossKillCounts[entry.id] || 0) > 0 && !this.claimedBossBounties[entry.id]) {
        count++;
      }
    }
    return count;
  }

  public getClaimableNotificationCount(): number {
    return this.getClaimableCount();
  }

  // Aggregated Combat Multipliers for GameEngine & UI
  public getComputedMultipliers() {
    const league = this.getCurrentLeague();
    const activeCmd = this.getActiveCommander();
    const cmdLvl = Math.max(1, this.getCommanderLevel(activeCmd.id));

    // All unlocked commanders contribute 35% of their passive aura even when on bridge reserve, 100% when active!
    const vanceLvl = this.getCommanderLevel('cmd_vance') * (this.activeCommanderId === 'cmd_vance' ? 1 : 0.35);
    const vossLvl = this.getCommanderLevel('cmd_voss') * (this.activeCommanderId === 'cmd_voss' ? 1 : 0.35);
    const nyxLvl = this.getCommanderLevel('cmd_nyx') * (this.activeCommanderId === 'cmd_nyx' ? 1 : 0.35);
    const solarisLvl =
      this.getCommanderLevel('cmd_solaris') * (this.activeCommanderId === 'cmd_solaris' ? 1 : 0.35);

    const shopWeaponLvl = this.honorShopLevels['arena_plasma_core'] || 0;
    const shopShieldLvl = this.honorShopLevels['arena_aegis_matrix'] || 0;
    const shopChronoLvl = this.honorShopLevels['arena_chrono_injector'] || 0;
    const shopBountyLvl = this.honorShopLevels['arena_bounty_scanner'] || 0;

    let codexBossBonusPct = 0;
    for (const entry of BOSS_CODEX_ENTRIES) {
      if (this.claimedBossBounties[entry.id]) {
        codexBossBonusPct += entry.bossDmgBonusPct;
      }
    }

    const damageMult =
      league.damageMult *
      (1 + vanceLvl * 0.18) *
      (1 + shopWeaponLvl * 0.22);
    const shieldAndHullMult =
      league.shieldMult *
      (1 + vossLvl * 0.24) *
      (1 + shopShieldLvl * 0.25);
    const regenMult = 1 + vossLvl * 0.15 + shopShieldLvl * 0.18;
    const critChanceBonus = vanceLvl * 0.04;
    const critChanceBonusPct = vanceLvl * 4;
    const critDamageBonusPct = vanceLvl * 12;
    const damageReductionBonusPct = Math.min(25, vossLvl * 3);
    const bossAndPvpDamageMult =
      (1 + nyxLvl * 0.28) * (1 + codexBossBonusPct / 100);
    const cooldownReductionMult = Math.max(
      0.45,
      1 - nyxLvl * 0.04 - shopChronoLvl * 0.05
    );
    const droneDamageMult = 1 + solarisLvl * 0.3;
    const lootYieldMult =
      (1 + solarisLvl * 0.25) * (1 + shopBountyLvl * 0.25);

    return {
      damageMult,
      allDamageMult: damageMult,
      shieldAndHullMult,
      shieldMult: shieldAndHullMult,
      regenMult,
      critChanceBonus,
      critChanceBonusPct,
      critDamageBonusPct,
      damageReductionBonusPct,
      bossAndPvpDamageMult,
      bossDamageMult: bossAndPvpDamageMult,
      cooldownReductionMult,
      droneDamageMult,
      lootYieldMult,
      lootMult: lootYieldMult,
      scrapYieldMult: lootYieldMult,
      darkMatterYieldMult: lootYieldMult,
      activeCommanderName: activeCmd.name,
      activeCommanderLevel: cmdLvl,
      leagueName: league.name,
      leagueColor: league.badgeColor,
    };
  }

  public getComputedBonuses() {
    return this.getComputedMultipliers();
  }
}

export const metaProgression = new MetaProgressionManager();

