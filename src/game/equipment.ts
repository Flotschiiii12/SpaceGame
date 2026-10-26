// Aether Void - 20 Lasers, 20 Shield Generators, 20 Drones, Multi-Slot Loadout & Stargates
import {
  EquipmentItem,
  PrimaryWeaponId,
  MissileWeaponId,
  ShieldCoreId,
  DroneTypeId,
  ShipEquipmentLoadout,
  ShipClassConfig,
  StargateSector,
  VoidDungeon,
} from './types.ts';
import { getShipConfig, SHIP_CLASSES } from './shipClasses.ts';

interface LaserSeed {
  name: string;
  desc: string;
  color: string;
  secondaryColor: string;
  visualPattern: EquipmentItem['visualPattern'];
  fireRateMult: number;
  projectileCount: number;
  pierceCount: number;
  blastRadius?: number;
}

const TWENTY_LASER_SEEDS: LaserSeed[] = [
  {
    name: 'Mk.I Tachyon Pulse Repeater',
    desc: 'Standard-Militärpulskanone mit hoher Mündungsgeschwindigkeit und stabiler Kadenz.',
    color: '#38bdf8',
    secondaryColor: '#e0f2fe',
    visualPattern: 'pulse',
    fireRateMult: 1.0,
    projectileCount: 1,
    pierceCount: 0,
  },
  {
    name: 'Mk.II Twin Ion Blaster',
    desc: 'Synchronisierte Zwillings-Ionenläufe für verdoppelte Trefferdichte.',
    color: '#22d3ee',
    secondaryColor: '#cffafe',
    visualPattern: 'twin_plasma',
    fireRateMult: 1.08,
    projectileCount: 2,
    pierceCount: 0,
  },
  {
    name: 'Mk.III Hyper-Rotary Plasma Gatling',
    desc: 'Rotierende 4-Lauf-Plasmagatling mit extrem hoher Schussfolge.',
    color: '#f59e0b',
    secondaryColor: '#fef3c7',
    visualPattern: 'gatling',
    fireRateMult: 1.65,
    projectileCount: 1,
    pierceCount: 0,
  },
  {
    name: 'Mk.IV Phase Tachyon Lance',
    desc: 'Linear gebündelter Phasenstrahl, der mehrere feindliche Rümpfe durchschlägt.',
    color: '#c084fc',
    secondaryColor: '#f3e8ff',
    visualPattern: 'lance',
    fireRateMult: 0.92,
    projectileCount: 1,
    pierceCount: 3,
  },
  {
    name: 'Mk.V Vortex Scatter Flak',
    desc: 'Fünfläufige Splitter-Flakkanone mit explosiven Mikro-Schockwellen.',
    color: '#f97316',
    secondaryColor: '#ffedd5',
    visualPattern: 'flak',
    fireRateMult: 1.05,
    projectileCount: 3,
    pierceCount: 0,
    blastRadius: 26,
  },
  {
    name: 'Mk.VI Cryo-Helix Emitter',
    desc: 'Verschießt spiralförmig verwobene Kryo-Energiestrahlen mit Panzerbrechung.',
    color: '#06b6d4',
    secondaryColor: '#a5f3fc',
    visualPattern: 'helix',
    fireRateMult: 1.18,
    projectileCount: 2,
    pierceCount: 1,
  },
  {
    name: 'Mk.VII Solar Flare Vulcan',
    desc: 'Überhitzte Fusions-Salvenkanone mit hoher kritischer Durchschlagskraft.',
    color: '#eab308',
    secondaryColor: '#fef08a',
    visualPattern: 'gatling',
    fireRateMult: 1.75,
    projectileCount: 2,
    pierceCount: 1,
  },
  {
    name: 'Mk.VIII Crimson Rail-Disruptor',
    desc: 'Magnetisch beschleunigte Hochgeschwindigkeits-Railgun gegen Großkampfschiffe.',
    color: '#ef4444',
    secondaryColor: '#fee2e2',
    visualPattern: 'lance',
    fireRateMult: 1.12,
    projectileCount: 2,
    pierceCount: 4,
  },
  {
    name: 'Mk.IX Aetheric Prism Array',
    desc: 'Bricht hochfrequentes Licht in ein tödliches 3-Wege-Prismenfeuer.',
    color: '#ec4899',
    secondaryColor: '#fce7f3',
    visualPattern: 'prism',
    fireRateMult: 1.24,
    projectileCount: 3,
    pierceCount: 2,
  },
  {
    name: 'Mk.X Void-Arc Tesla Cannon',
    desc: 'Entfesselt dunkle Blitzbögen, die Schilde und Hüllen gleichermaßen zerreißen.',
    color: '#a855f7',
    secondaryColor: '#e9d5ff',
    visualPattern: 'void_arc',
    fireRateMult: 1.32,
    projectileCount: 3,
    pierceCount: 2,
    blastRadius: 32,
  },
  {
    name: 'Mk.XI Neutron Star Repeater',
    desc: 'Komprimierte Neutronen-Geschosse mit gewaltiger kinetischer Wucht.',
    color: '#3b82f6',
    secondaryColor: '#dbeafe',
    visualPattern: 'twin_plasma',
    fireRateMult: 1.4,
    projectileCount: 3,
    pierceCount: 3,
  },
  {
    name: 'Mk.XII Emerald Quasar Lance',
    desc: 'Durchdringende Quasar-Lanze mit unaufhaltsamer Linien-Penetration.',
    color: '#10b981',
    secondaryColor: '#d1fae5',
    visualPattern: 'lance',
    fireRateMult: 1.35,
    projectileCount: 2,
    pierceCount: 6,
  },
  {
    name: 'Mk.XIII Chronos Rift Shredder',
    desc: 'Feuert zeitversetzte Tachyon-Garben mit extremer Kadenz ab.',
    color: '#d946ef',
    secondaryColor: '#fae8ff',
    visualPattern: 'helix',
    fireRateMult: 1.85,
    projectileCount: 3,
    pierceCount: 3,
  },
  {
    name: 'Mk.XIV Antimatter Hellstorm',
    desc: 'Verwandelt das Vorfeld in einen Teppich aus Antimaterie-Detonationen.',
    color: '#f43f5e',
    secondaryColor: '#ffe4e6',
    visualPattern: 'flak',
    fireRateMult: 1.48,
    projectileCount: 4,
    pierceCount: 2,
    blastRadius: 40,
  },
  {
    name: 'Mk.XV Celestial Sunbeam Core',
    desc: 'Bündelt stellare Korona-Energie in vierfache Hochleistungsstrahlen.',
    color: '#fbbf24',
    secondaryColor: '#ffffff',
    visualPattern: 'prism',
    fireRateMult: 1.55,
    projectileCount: 4,
    pierceCount: 5,
  },
  {
    name: 'Mk.XVI Abyssal Singularity Ray',
    desc: 'Schwarze-Loch-Partikelstrahler mit verheerender implosiver Wirkung.',
    color: '#8b5cf6',
    secondaryColor: '#ede9fe',
    visualPattern: 'singularity',
    fireRateMult: 1.62,
    projectileCount: 4,
    pierceCount: 6,
    blastRadius: 45,
  },
  {
    name: 'Mk.XVII Seraphim Light-Judge',
    desc: 'Heilige Photonen-Arsenale der 9. Generation mit nahezu perfekter Präzision.',
    color: '#00f2fe',
    secondaryColor: '#ffffff',
    visualPattern: 'prism',
    fireRateMult: 1.72,
    projectileCount: 4,
    pierceCount: 8,
  },
  {
    name: 'Mk.XVIII Dimensional Ripper',
    desc: 'Schneidet durch Raum und Zeit – ignoriert feindliche Panzerungsschichten.',
    color: '#ec4899',
    secondaryColor: '#ffffff',
    visualPattern: 'void_arc',
    fireRateMult: 1.82,
    projectileCount: 5,
    pierceCount: 10,
    blastRadius: 52,
  },
  {
    name: 'Mk.XIX Eternity Genesis Beam',
    desc: 'Vorletzte Evolutionsstufe kosmischer Energiewaffen mit 5-facher Salve.',
    color: '#34d399',
    secondaryColor: '#ffffff',
    visualPattern: 'omega',
    fireRateMult: 1.95,
    projectileCount: 5,
    pierceCount: 15,
  },
  {
    name: 'Mk.XX OMEGA SINGULARITY ANNIHILATOR',
    desc: 'Das ultimative Tier-20 Gott-Geschütz: 6-fache Omniversal-Strahlen mit unendlichem Durchschlag.',
    color: '#fde047',
    secondaryColor: '#00f2fe',
    visualPattern: 'omega',
    fireRateMult: 2.15,
    projectileCount: 6,
    pierceCount: 99,
    blastRadius: 64,
  },
];

interface ShieldSeed {
  name: string;
  desc: string;
  color: string;
  secondaryColor: string;
}

const TWENTY_SHIELD_SEEDS: ShieldSeed[] = [
  {
    name: 'Mk.I Aegis Deflector Matrix',
    desc: 'Solider militärischer Standard-Deflektor mit ausgewogener Kapazität.',
    color: '#38bdf8',
    secondaryColor: '#bae6fd',
  },
  {
    name: 'Mk.II Phase-Shift Capacitor',
    desc: 'Verkürzt die Verzögerung vor dem Schild-Wiederaufbau spürbar.',
    color: '#22d3ee',
    secondaryColor: '#a5f3fc',
  },
  {
    name: 'Mk.III Reactive Kinetic Bulwark',
    desc: 'Reflektiert einen Teil des eingehenden Projektil-Schadens zurück zum Angreifer.',
    color: '#10b981',
    secondaryColor: '#a7f3d0',
  },
  {
    name: 'Mk.IV Ion-Harmonic Barrier',
    desc: 'Harmonische Frequenzmodulation erhöht Schildstärke und Regeneration.',
    color: '#06b6d4',
    secondaryColor: '#cffafe',
  },
  {
    name: 'Mk.V Vanguard Fortress Core',
    desc: 'Verstärkter Kreuzer-Schildkern für schweres Dauerfeuer.',
    color: '#3b82f6',
    secondaryColor: '#dbeafe',
  },
  {
    name: 'Mk.VI Cryo-Stasis Deflector',
    desc: 'Kühlt überlastete Schildspulen sofort herunter für rasanten Aufbau.',
    color: '#0ea5e9',
    secondaryColor: '#e0f2fe',
  },
  {
    name: 'Mk.VII Prismatic Mirror Shield',
    desc: 'Spiegelnde Energiefelder mit erhöhter Schadensabsorption.',
    color: '#ec4899',
    secondaryColor: '#fbcfe8',
  },
  {
    name: 'Mk.VIII Obsidian Void-Ward',
    desc: 'Dunkle-Materie-Schildkern, der Void-Strahlung mühelos absorbiert.',
    color: '#a855f7',
    secondaryColor: '#e9d5ff',
  },
  {
    name: 'Mk.IX Solar Corona Aegis',
    desc: 'Hüllt das Schiff in eine glühende Sonnenkorona mit hoher Kapazität.',
    color: '#f59e0b',
    secondaryColor: '#fef3c7',
  },
  {
    name: 'Mk.X Quantum Lattice Generator',
    desc: 'Verschränktes Quantengitter verteilt Trefferenergie über den gesamten Rumpf.',
    color: '#14b8a6',
    secondaryColor: '#ccfbf1',
  },
  {
    name: 'Mk.XI Neutron Bastion Core',
    desc: 'Ultradichter Schildgenerator der Schlachtkreuzer-Klasse.',
    color: '#6366f1',
    secondaryColor: '#e0e7ff',
  },
  {
    name: 'Mk.XII Crimson Valkyrie Barrier',
    desc: 'Aggressiver Kampfschild mit starker kinetischer Rückstoß-Reflexion.',
    color: '#f43f5e',
    secondaryColor: '#ffe4e6',
  },
  {
    name: 'Mk.XIII Chronos Temporal Shield',
    desc: 'Dreht erlittene Schildschäden durch Mikro-Zeitschleifen teilweise zurück.',
    color: '#d946ef',
    secondaryColor: '#fae8ff',
  },
  {
    name: 'Mk.XIV Citadel Dreadnought Matrix',
    desc: 'Kapitaler Festungs-Generator für Schiffe mit vielen Schild-Slots.',
    color: '#34d399',
    secondaryColor: '#d1fae5',
  },
  {
    name: 'Mk.XV Hypernova Sanctuary',
    desc: 'Stellare Schutzsphäre mit gewaltiger Reservekapazität.',
    color: '#eab308',
    secondaryColor: '#fef9c3',
  },
  {
    name: 'Mk.XVI Singularity Horizon Core',
    desc: 'Krümmt feindliche Flugbahnen am Ereignishorizont des Schiffs vorbei.',
    color: '#8b5cf6',
    secondaryColor: '#ddd6fe',
  },
  {
    name: 'Mk.XVII Seraphim Halo Generator',
    desc: 'Sechsfach geschichteter Lichtschild der himmlischen Titanen-Klasse.',
    color: '#00f2fe',
    secondaryColor: '#ffffff',
  },
  {
    name: 'Mk.XVIII Dimensional Phase-Core',
    desc: 'Versetzt die Schiffshülle teilweise in den Hyperraum, um Schaden zu halbieren.',
    color: '#ec4899',
    secondaryColor: '#ffffff',
  },
  {
    name: 'Mk.XIX Ouroboros Immortal Core',
    desc: 'Nahezu unerschöpfliche Schildregeneration selbst im tiefsten Void Rift.',
    color: '#10b981',
    secondaryColor: '#ffffff',
  },
  {
    name: 'Mk.XX OMNIVERSAL EVENT-HORIZON CORE',
    desc: 'Der ultimative Tier-20 Schildgenerator: Gigantische Schildpunkte, Sofort-Regeneration & maximale Schadensreduktion.',
    color: '#fde047',
    secondaryColor: '#00f2fe',
  },
];

interface DroneSeed {
  name: string;
  desc: string;
  color: string;
  secondaryColor: string;
  droneRole: NonNullable<EquipmentItem['droneRole']>;
}

const TWENTY_DRONE_SEEDS: DroneSeed[] = [
  {
    name: 'Mk.I Striker Wingman Drone',
    desc: 'Leichte Angriffsdrohne mit Zwillings-Plasmarepetierern.',
    color: '#38bdf8',
    secondaryColor: '#bae6fd',
    droneRole: 'striker',
  },
  {
    name: 'Mk.II Graviton Siphon Drone',
    desc: 'Feuert auf Feinde und zieht gleichzeitig Scrap & Dark Matter aus der Distanz an.',
    color: '#fbbf24',
    secondaryColor: '#fef3c7',
    droneRole: 'siphon',
  },
  {
    name: 'Mk.III Nanite Repair Tender',
    desc: 'Unterstützungsdrohne: Feuert Laser und repariert laufend Hülle & Schilde.',
    color: '#10b981',
    secondaryColor: '#d1fae5',
    droneRole: 'nanite',
  },
  {
    name: 'Mk.IV Viper Interceptor Drone',
    desc: 'Schnellfeuernde Jagddrohne zur Abwehr von Kamikaze-Schwärmen.',
    color: '#22d3ee',
    secondaryColor: '#cffafe',
    droneRole: 'striker',
  },
  {
    name: 'Mk.V Tachyon Beam Sentinel',
    desc: 'Schwere Kampfdrohne mit durchschlagendem Mini-Tachyonenstrahl.',
    color: '#c084fc',
    secondaryColor: '#f3e8ff',
    droneRole: 'orbital',
  },
  {
    name: 'Mk.VI Harvester Prime Drone',
    desc: 'Hochleistungs-Sammeldrohne mit verstärktem Angriffsgeschütz.',
    color: '#f59e0b',
    secondaryColor: '#fde68a',
    droneRole: 'siphon',
  },
  {
    name: 'Mk.VII Aegis Guardian Drone',
    desc: 'Rüstet das Mutterschiff mit zusätzlicher Schildregeneration und Sperrfeuer aus.',
    color: '#06b6d4',
    secondaryColor: '#a5f3fc',
    droneRole: 'nanite',
  },
  {
    name: 'Mk.VIII Hellfire Gunship Drone',
    desc: 'Schwere Waffenplattform im Taschenformat mit explosiven Plasmageschossen.',
    color: '#ef4444',
    secondaryColor: '#fecaca',
    droneRole: 'striker',
  },
  {
    name: 'Mk.IX Phantom Stealth Drone',
    desc: 'Feuert präzise Krit-Laser aus dem toten Winkel auf gepanzerte Ziele.',
    color: '#a855f7',
    secondaryColor: '#e9d5ff',
    droneRole: 'orbital',
  },
  {
    name: 'Mk.X Valkyrie Omni-Drone',
    desc: 'Kombiniert hohes Angriffstempo mit Schildreparatur und Beute-Magnet.',
    color: '#eab308',
    secondaryColor: '#fef08a',
    droneRole: 'omni',
  },
  {
    name: 'Mk.XI Cryo-Lancer Drone',
    desc: 'Verschießt unterkühlte Lanzenprojektile mit hoher Feuerrate.',
    color: '#3b82f6',
    secondaryColor: '#bfdbfe',
    droneRole: 'striker',
  },
  {
    name: 'Mk.XII Void-Siphon Archon',
    desc: 'Extrahiert zusätzliche Energie aus dem Riss und feuert dunkle Blitze.',
    color: '#9333ea',
    secondaryColor: '#f3e8ff',
    droneRole: 'siphon',
  },
  {
    name: 'Mk.XIII Immortal Nanite Swarm',
    desc: 'Hochdichte Naniten-Wolke zur massiven Gefechtsreparatur und Feuerunterstützung.',
    color: '#34d399',
    secondaryColor: '#a7f3d0',
    droneRole: 'nanite',
  },
  {
    name: 'Mk.XIV Nemesis Orbital Striker',
    desc: 'Umkreist das Schiff und schneidet mit Orbital-Lasern durch Gegnerwellen.',
    color: '#f43f5e',
    secondaryColor: '#fecdd3',
    droneRole: 'orbital',
  },
  {
    name: 'Mk.XV Helios Solar Wingman',
    desc: 'Stellare Begleitdrohne mit doppelläufigen Sonnenplasma-Kanonen.',
    color: '#fb923c',
    secondaryColor: '#ffedd5',
    droneRole: 'omni',
  },
  {
    name: 'Mk.XVI Quasar Annihilator Drone',
    desc: 'Entfesselt gebündelte Quasar-Impulse mit enormem Einzelschaden.',
    color: '#00f2fe',
    secondaryColor: '#e0f2fe',
    droneRole: 'striker',
  },
  {
    name: 'Mk.XVII Chronos Temporal Drone',
    desc: 'Überladene Zeit-Drohne mit verdoppelter Schussfrequenz.',
    color: '#e879f9',
    secondaryColor: '#fae8ff',
    droneRole: 'orbital',
  },
  {
    name: 'Mk.XVIII Seraphim Halo Wing',
    desc: 'Himmlische Kampfdrohne: Verbindet Heilung, Beute-Magnet und vernichtende Strahlen.',
    color: '#38bdf8',
    secondaryColor: '#fde047',
    droneRole: 'omni',
  },
  {
    name: 'Mk.XIX Genesis Void-Seraph',
    desc: 'Transzendente Begleitdrohne für Schiffe der höchsten Generationen.',
    color: '#ec4899',
    secondaryColor: '#ffffff',
    droneRole: 'omni',
  },
  {
    name: 'Mk.XX OMEGA SERAPHIM GOD-DRONE',
    desc: 'Die ultimative Tier-20 Kampfdrohne: Maximale Feuerkraft, permanente Reparatur & Vollbild-Vakuum.',
    color: '#fde047',
    secondaryColor: '#00f2fe',
    droneRole: 'omni',
  },
];

function buildTwentyLasers(): EquipmentItem[] {
  return TWENTY_LASER_SEEDS.map((seed, idx) => {
    const tier = idx + 1;
    const isStarter = tier === 1;
    const prestigeRequired = isStarter ? 0 : Math.max(1, Math.floor((tier - 1) * 3.5));
    const costScrap = isStarter ? 0 : Math.round(650 * Math.pow(1.75, idx));
    const costDarkMatter = isStarter ? 0 : Math.round(8 * Math.pow(1.62, idx));
    const costQuantumShards = tier <= 3 ? 0 : Math.round(3 * Math.pow(1.52, idx - 2));

    // Exponential damage multiplier so each of the 20 lasers is much stronger than the previous
    const damageMult = Number((Math.pow(1.38, idx) * (1 + idx * 0.15)).toFixed(2));
    const critBonus = Number((idx * 0.015).toFixed(3));

    return {
      id: `laser_${String(tier).padStart(2, '0')}`,
      tier,
      name: seed.name,
      category: 'weapon',
      desc: seed.desc,
      costScrap,
      costDarkMatter,
      costQuantumShards,
      prestigeRequired,
      sectorRequired: Math.min(4, 1 + Math.floor(idx / 5)),
      statsText: `Tier ${tier}/20 · DMG: ${Math.round(damageMult * 100)}% · Salve: ${seed.projectileCount}x · Kadenz: ${Math.round(seed.fireRateMult * 100)}%`,
      iconType: 'crosshair',
      color: seed.color,
      secondaryColor: seed.secondaryColor,
      visualPattern: seed.visualPattern,
      damageMult,
      fireRateMult: seed.fireRateMult,
      projectileCount: seed.projectileCount,
      pierceCount: seed.pierceCount,
      blastRadius: seed.blastRadius,
      critBonus,
    };
  });
}

function buildTwentyShields(): EquipmentItem[] {
  return TWENTY_SHIELD_SEEDS.map((seed, idx) => {
    const tier = idx + 1;
    const isStarter = tier === 1;
    const prestigeRequired = isStarter ? 0 : Math.max(1, Math.floor((tier - 1) * 3.5));
    const costScrap = isStarter ? 0 : Math.round(600 * Math.pow(1.74, idx));
    const costDarkMatter = isStarter ? 0 : Math.round(7 * Math.pow(1.61, idx));
    const costQuantumShards = tier <= 3 ? 0 : Math.round(3 * Math.pow(1.5, idx - 2));

    const shieldBonus = Math.round(45 * Math.pow(1.36, idx) + idx * 35);
    const shieldRegenBonus = Math.round(8 * Math.pow(1.32, idx) + idx * 5);
    const damageReductionPct = Math.min(45, Number((1.5 + idx * 2.1).toFixed(1)));
    const reflectChance = Math.min(0.6, Number((0.05 + idx * 0.028).toFixed(2)));

    return {
      id: `shield_${String(tier).padStart(2, '0')}`,
      tier,
      name: seed.name,
      category: 'shield',
      desc: seed.desc,
      costScrap,
      costDarkMatter,
      costQuantumShards,
      prestigeRequired,
      sectorRequired: Math.min(4, 1 + Math.floor(idx / 5)),
      statsText: `Tier ${tier}/20 · +${shieldBonus.toLocaleString()} Schild · +${shieldRegenBonus}/s Regen · -${damageReductionPct}% DMG`,
      iconType: 'shield',
      color: seed.color,
      secondaryColor: seed.secondaryColor,
      visualPattern: 'pulse',
      shieldBonus,
      shieldRegenBonus,
      damageReductionPct,
      reflectChance,
    };
  });
}

function buildTwentyDrones(): EquipmentItem[] {
  return TWENTY_DRONE_SEEDS.map((seed, idx) => {
    const tier = idx + 1;
    const isStarter = tier === 1;
    const prestigeRequired = isStarter ? 0 : Math.max(1, Math.floor((tier - 1) * 3.5));
    const costScrap = isStarter ? 0 : Math.round(680 * Math.pow(1.76, idx));
    const costDarkMatter = isStarter ? 0 : Math.round(9 * Math.pow(1.63, idx));
    const costQuantumShards = tier <= 3 ? 0 : Math.round(3 * Math.pow(1.53, idx - 2));

    const droneDamage = Math.round(16 * Math.pow(1.37, idx) + idx * 14);
    const droneFireRate = Number((1.4 + idx * 0.16).toFixed(2));

    const roleLabel =
      seed.droneRole === 'omni'
        ? 'Omni-Kampf & Heilung'
        : seed.droneRole === 'nanite'
        ? 'Kampf & Naniten-Reparatur'
        : seed.droneRole === 'siphon'
        ? 'Kampf & Beute-Traktor'
        : seed.droneRole === 'orbital'
        ? 'Durchschlag-Laser'
        : 'Schnellfeuer-Jäger';

    return {
      id: `drone_${String(tier).padStart(2, '0')}`,
      tier,
      name: seed.name,
      category: 'drone',
      desc: seed.desc,
      costScrap,
      costDarkMatter,
      costQuantumShards,
      prestigeRequired,
      sectorRequired: Math.min(4, 1 + Math.floor(idx / 5)),
      statsText: `Tier ${tier}/20 · ${droneDamage.toLocaleString()} DMG/Schuss · ${droneFireRate}/s · ${roleLabel}`,
      iconType: 'bot',
      color: seed.color,
      secondaryColor: seed.secondaryColor,
      visualPattern: 'pulse',
      droneDamage,
      droneFireRate,
      droneRole: seed.droneRole,
    };
  });
}

const MISSILE_ITEMS: EquipmentItem[] = [
  {
    id: 'micro_swarm',
    tier: 1,
    name: 'Mk.I Valkyrie Micro-Swarm Pods',
    category: 'missile',
    desc: 'Startet Salven aus 4 wendigen Zielsuch-Mikroraketen pro Raketen-Slot.',
    costScrap: 1200,
    costDarkMatter: 8,
    costQuantumShards: 0,
    prestigeRequired: 0,
    sectorRequired: 1,
    statsText: 'Tier 1 · Salve: 4 Zielsuch-Raketen · Cooldown: 4.5s',
    iconType: 'rocket',
    color: '#38bdf8',
    secondaryColor: '#bae6fd',
    visualPattern: 'pulse',
    damageMult: 1.0,
  },
  {
    id: 'heavy_torpedo',
    tier: 2,
    name: 'Mk.II Antimatter Siege Torpedo',
    category: 'missile',
    desc: 'Schwerer Antimaterie-Gefechtskopf mit gewaltiger kinetischer Druckwelle.',
    costScrap: 4800,
    costDarkMatter: 30,
    costQuantumShards: 2,
    prestigeRequired: 3,
    sectorRequired: 2,
    statsText: 'Tier 2 · Schockwelle: 90px AoE · Schaden: 450% · Cooldown: 6.5s',
    iconType: 'bomb',
    color: '#f97316',
    secondaryColor: '#fed7aa',
    visualPattern: 'flak',
    damageMult: 2.4,
  },
  {
    id: 'emp_disruptor',
    tier: 3,
    name: 'Mk.III Zeus EMP Disruptor Rocket',
    category: 'missile',
    desc: 'Lähmt feindliche Waffensysteme für 3.5s und zerstört Energieschilde.',
    costScrap: 14500,
    costDarkMatter: 85,
    costQuantumShards: 8,
    prestigeRequired: 8,
    sectorRequired: 3,
    statsText: 'Tier 3 · EMP-Stun: 3.5s · Radius: 130px · Schaden: 650%',
    iconType: 'radio',
    color: '#a855f7',
    secondaryColor: '#e9d5ff',
    visualPattern: 'void_arc',
    damageMult: 4.2,
  },
  {
    id: 'omega_nova_warhead',
    tier: 4,
    name: 'Mk.IV Omega Singularity Warhead',
    category: 'missile',
    desc: 'Endgame-Singularitätsrakete: Verursacht extremen Flächenschaden und 4s Stun.',
    costScrap: 85000,
    costDarkMatter: 420,
    costQuantumShards: 35,
    prestigeRequired: 20,
    sectorRequired: 4,
    statsText: 'Tier 4 · Singularitäts-AoE: 165px · Schaden: 1800% · Stun: 4.0s',
    iconType: 'bomb',
    color: '#fde047',
    secondaryColor: '#00f2fe',
    visualPattern: 'omega',
    damageMult: 11.5,
  },
];

export const LASER_CATALOGUE: EquipmentItem[] = buildTwentyLasers();
export const SHIELD_CATALOGUE: EquipmentItem[] = buildTwentyShields();
export const DRONE_CATALOGUE: EquipmentItem[] = buildTwentyDrones();

export const EQUIPMENT_CATALOGUE: EquipmentItem[] = [
  ...LASER_CATALOGUE,
  ...SHIELD_CATALOGUE,
  ...DRONE_CATALOGUE,
  ...MISSILE_ITEMS,
];

// Legacy ID map so older save states map cleanly to the new 20-tier catalogue
const LEGACY_ITEM_MAP: Record<string, string> = {
  pulse_repeater: 'laser_01',
  gatling_plasma: 'laser_03',
  tachyon_lance: 'laser_04',
  scatter_flak: 'laser_05',
  aegis_deflector: 'shield_01',
  phase_barrier: 'shield_02',
  reactive_bulwark: 'shield_03',
  striker: 'drone_01',
  siphon: 'drone_02',
  nanite: 'drone_03',
};

// -------------------------------------------------------------
// STARGATE SECTOR WAYPOINTS
// -------------------------------------------------------------
export const STARGATE_SECTORS: StargateSector[] = [
  {
    sectorNumber: 1,
    name: 'Sector 01: Orion Verge',
    description: 'Asteroid mining outpost plagued by pirate swarmers and iron frigates.',
    hazardName: 'Kinetic Debris Field',
    hazardColor: '#38bdf8',
    recommendedDps: 45,
  },
  {
    sectorNumber: 2,
    name: 'Sector 02: Kuiper Abyss',
    description: 'Deep frozen rim where cloaked kamikazes and heavy railgun mortar cruisers lurk.',
    hazardName: 'Cryo Ion Storms',
    hazardColor: '#c084fc',
    recommendedDps: 240,
  },
  {
    sectorNumber: 3,
    name: 'Sector 03: Omega Singularity',
    description: 'Event horizon zone guarded by the Eclipse Void Colossus and elite capital dreadnoughts.',
    hazardName: 'Graviton Tidal Shear',
    hazardColor: '#f43f5e',
    recommendedDps: 1200,
  },
  {
    sectorNumber: 4,
    name: 'Sector 04: Tachyon Core',
    description: 'Ancient alien superstructure containing infinite dark matter and mythic guardians.',
    hazardName: 'Tachyon Overload',
    hazardColor: '#facc15',
    recommendedDps: 6500,
  },
];

// -------------------------------------------------------------
// DERELICT DUNGEONS & INCURSIONS
// -------------------------------------------------------------
export const VOID_DUNGEONS: VoidDungeon[] = [
  {
    id: 'dungeon-alien-vault',
    name: 'Derelict Vault of Aethelgard',
    sector: 1,
    sectorOverride: 1,
    description: 'Abandoned orbital station overrun by hostile void sentinels. Deep loot cache guaranteed.',
    difficulty: 'normal',
    wavesCount: 6,
    rewardScrap: 2800,
    rewardDarkMatter: 25,
    blueprintReward: 'Mk.I Valkyrie Micro-Swarm Pods',
  },
  {
    id: 'dungeon-singularity-rift',
    name: 'Singularity Rift Anomaly',
    sector: 2,
    sectorOverride: 2,
    description: 'Dimensional fissure spawning elite berserk hostiles. High dark matter yield.',
    difficulty: 'heroic',
    wavesCount: 8,
    rewardScrap: 9500,
    rewardDarkMatter: 80,
    blueprintReward: 'Mk.IV Phase Tachyon Lance',
  },
  {
    id: 'dungeon-colossus-citadel',
    name: 'Citadel of the Void Titan',
    sector: 3,
    sectorOverride: 3,
    description: 'The inner sanctum of the ancient dread fleet. Maximum difficulty raid dungeon.',
    difficulty: 'mythic',
    wavesCount: 10,
    rewardScrap: 32000,
    rewardDarkMatter: 240,
    blueprintReward: 'Mk.III Zeus EMP Disruptor Rocket',
  },
];

const STORAGE_KEY_V2 = 'aether_progression_v2';

// -------------------------------------------------------------
// EQUIPMENT & MULTI-SLOT CAREER MANAGER CLASS
// -------------------------------------------------------------
class EquipmentManager {
  public unlockedItems: Set<string> = new Set(['laser_01', 'shield_01', 'drone_01']);
  public unlockedShips: Set<string> = new Set(['ship_01']);
  public unlockedSectors: Set<number> = new Set([1]);
  public itemStars: Record<string, number> = {
    laser_01: 1,
    shield_01: 1,
    drone_01: 1,
  };
  public loadout: ShipEquipmentLoadout = {
    primaryWeapon: 'laser_01',
    missileWeapon: 'none',
    shieldCore: 'shield_01',
    droneType: 'drone_01',
    laserSlots: ['laser_01'],
    generatorSlots: ['shield_01'],
    droneSlots: ['drone_01'],
    missileSlots: ['none'],
  };

  constructor() {
    this.loadState();
  }

  private normalizeItemId(id: string): string {
    return LEGACY_ITEM_MAP[id] || id;
  }

  public loadState() {
    try {
      const savedV2 = localStorage.getItem(STORAGE_KEY_V2);
      if (savedV2) {
        const parsed = JSON.parse(savedV2);
        if (Array.isArray(parsed.unlockedItems)) {
          this.unlockedItems = new Set(parsed.unlockedItems.map((id: string) => this.normalizeItemId(id)));
        }
        if (Array.isArray(parsed.unlockedShips)) {
          this.unlockedShips = new Set(
            parsed.unlockedShips.filter((id: string) => id.startsWith('ship_') && Boolean(SHIP_CLASSES[id]))
          );
        }
        if (Array.isArray(parsed.unlockedSectors)) {
          this.unlockedSectors = new Set(parsed.unlockedSectors);
        }
        if (parsed.itemStars && typeof parsed.itemStars === 'object') {
          this.itemStars = { ...this.itemStars, ...parsed.itemStars };
        }
        if (parsed.loadout) {
          this.loadout = {
            ...this.loadout,
            ...parsed.loadout,
            primaryWeapon: this.normalizeItemId(parsed.loadout.primaryWeapon || 'laser_01'),
            shieldCore: this.normalizeItemId(parsed.loadout.shieldCore || 'shield_01'),
            droneType: this.normalizeItemId(parsed.loadout.droneType || 'drone_01'),
          };
        }
      } else {
        this.unlockedItems = new Set(['laser_01', 'shield_01', 'drone_01']);
        this.unlockedShips = new Set(['ship_01']);
        this.unlockedSectors = new Set([1]);
      }

      this.unlockedItems.add('laser_01');
      this.unlockedItems.add('shield_01');
      this.unlockedItems.add('drone_01');
      this.unlockedShips.add('ship_01');
      this.unlockedSectors.add(1);
    } catch {
      this.unlockedItems = new Set(['laser_01', 'shield_01', 'drone_01']);
      this.unlockedShips = new Set(['ship_01']);
      this.unlockedSectors = new Set([1]);
    }
  }

  public saveState() {
    try {
      localStorage.setItem(
        STORAGE_KEY_V2,
        JSON.stringify({
          unlockedItems: Array.from(this.unlockedItems),
          unlockedShips: Array.from(this.unlockedShips),
          unlockedSectors: Array.from(this.unlockedSectors),
          itemStars: this.itemStars,
          loadout: this.loadout,
        })
      );
    } catch {}
  }

  public getItemStarLevel(itemId: string): number {
    const norm = this.normalizeItemId(itemId);
    return Math.max(1, Math.min(5, this.itemStars[norm] || 1));
  }

  public getStarMultiplier(itemId: string): number {
    const stars = this.getItemStarLevel(itemId);
    // ★1 = 1.0x, ★2 = 1.35x, ★3 = 1.82x, ★4 = 2.46x, ★5 = 3.32x
    return Number(Math.pow(1.35, stars - 1).toFixed(2));
  }

  public getStarFusionCost(itemId: string): { scrap: number; darkMatter: number; isMaxed: boolean } {
    const norm = this.normalizeItemId(itemId);
    const stars = this.getItemStarLevel(norm);
    if (stars >= 5) {
      return { scrap: 0, darkMatter: 0, isMaxed: true };
    }
    const item = this.getEquipmentItem(norm);
    const tier = item?.tier || 1;
    const baseScrap = Math.max(450, item?.costScrap || 450);
    const baseDm = Math.max(6, item?.costDarkMatter || 6);
    const scrap = Math.round(baseScrap * 0.85 * Math.pow(1.85, stars - 1) + tier * 200);
    const darkMatter = Math.round(baseDm * 0.75 * Math.pow(1.7, stars - 1) + stars * 5);
    return { scrap, darkMatter, isMaxed: false };
  }

  public upgradeItemStar(itemId: string): boolean {
    const norm = this.normalizeItemId(itemId);
    if (!this.isItemUnlocked(norm)) return false;
    const current = this.getItemStarLevel(norm);
    if (current >= 5) return false;
    this.itemStars[norm] = current + 1;
    this.saveState();
    return true;
  }

  public isShipUnlocked(shipId: string, currentPrestigeRank?: number): boolean {
    const config = getShipConfig(shipId);
    if (config.tier === 1) return true;
    const isPurchased = this.unlockedShips.has(config.id);
    if (!isPurchased) return false;
    if (typeof currentPrestigeRank === 'number' && currentPrestigeRank < config.unlockRequirement.prestigeRequired) {
      return false;
    }
    return true;
  }

  public unlockShip(shipId: string): boolean {
    const config = getShipConfig(shipId);
    this.unlockedShips.add(config.id);
    this.syncSlotsForShip(config);
    this.saveState();
    return true;
  }

  public isItemUnlocked(itemId: string): boolean {
    const norm = this.normalizeItemId(itemId);
    if (norm === 'laser_01' || norm === 'shield_01' || norm === 'drone_01') return true;
    return this.unlockedItems.has(norm);
  }

  public unlockItem(itemId: string): boolean {
    const norm = this.normalizeItemId(itemId);
    this.unlockedItems.add(norm);
    if (!this.itemStars[norm]) {
      this.itemStars[norm] = 1;
    }
    this.saveState();
    return true;
  }

  public getEquipmentItem(id: string): EquipmentItem | undefined {
    const norm = this.normalizeItemId(id);
    return EQUIPMENT_CATALOGUE.find((item) => item.id === norm);
  }

  public getItem(id: string): EquipmentItem | undefined {
    return this.getEquipmentItem(id);
  }

  public syncSlotsForShip(ship: ShipClassConfig) {
    const defaultLaser = this.loadout.primaryWeapon || 'laser_01';
    const defaultShield = this.loadout.shieldCore || 'shield_01';
    const defaultDrone = this.loadout.droneType || 'drone_01';
    const defaultMissile = this.loadout.missileWeapon || 'none';

    if (!Array.isArray(this.loadout.laserSlots)) this.loadout.laserSlots = [];
    if (!Array.isArray(this.loadout.generatorSlots)) this.loadout.generatorSlots = [];
    if (!Array.isArray(this.loadout.droneSlots)) this.loadout.droneSlots = [];
    if (!Array.isArray(this.loadout.missileSlots)) this.loadout.missileSlots = [];

    while (this.loadout.laserSlots.length < ship.slots.lasers) {
      this.loadout.laserSlots.push(defaultLaser);
    }
    while (this.loadout.generatorSlots.length < ship.slots.generators) {
      this.loadout.generatorSlots.push(defaultShield);
    }
    while (this.loadout.droneSlots.length < ship.slots.drones) {
      this.loadout.droneSlots.push(defaultDrone);
    }
    while (this.loadout.missileSlots.length < ship.slots.missiles) {
      this.loadout.missileSlots.push(defaultMissile);
    }

    this.loadout.laserSlots = this.loadout.laserSlots.map((id) =>
      this.isItemUnlocked(id) ? this.normalizeItemId(id) : 'laser_01'
    );
    this.loadout.generatorSlots = this.loadout.generatorSlots.map((id) =>
      this.isItemUnlocked(id) ? this.normalizeItemId(id) : 'shield_01'
    );
    this.loadout.droneSlots = this.loadout.droneSlots.map((id) =>
      this.isItemUnlocked(id) ? this.normalizeItemId(id) : 'drone_01'
    );
    this.loadout.missileSlots = this.loadout.missileSlots.map((id) =>
      id === 'none' || this.isItemUnlocked(id) ? id : 'none'
    );

    this.loadout.primaryWeapon = this.loadout.laserSlots[0] || 'laser_01';
    this.loadout.shieldCore = this.loadout.generatorSlots[0] || 'shield_01';
    this.loadout.droneType = this.loadout.droneSlots[0] || 'drone_01';
    this.loadout.missileWeapon = this.loadout.missileSlots[0] || 'none';
  }

  public equipSlot(
    category: 'weapon' | 'shield' | 'drone' | 'missile',
    slotIndex: number,
    itemId: string,
    ship?: ShipClassConfig
  ) {
    if (ship) this.syncSlotsForShip(ship);
    const norm = this.normalizeItemId(itemId);
    if (norm !== 'none' && !this.isItemUnlocked(norm)) return;

    if (category === 'weapon') {
      this.loadout.laserSlots[slotIndex] = norm;
      if (slotIndex === 0) this.loadout.primaryWeapon = norm;
    } else if (category === 'shield') {
      this.loadout.generatorSlots[slotIndex] = norm;
      if (slotIndex === 0) this.loadout.shieldCore = norm;
    } else if (category === 'drone') {
      this.loadout.droneSlots[slotIndex] = norm;
      if (slotIndex === 0) this.loadout.droneType = norm;
    } else if (category === 'missile') {
      this.loadout.missileSlots[slotIndex] = norm;
      if (slotIndex === 0) this.loadout.missileWeapon = norm;
    }
    this.saveState();
  }

  public autoFillCategory(
    category: 'weapon' | 'shield' | 'drone' | 'missile',
    itemId: string,
    maxSlots: number = 15
  ) {
    const norm = this.normalizeItemId(itemId);
    if (norm !== 'none' && !this.isItemUnlocked(norm)) return;

    const count = Math.max(maxSlots, 15);
    if (category === 'weapon') {
      this.loadout.primaryWeapon = norm;
      this.loadout.laserSlots = Array(count).fill(norm);
    } else if (category === 'shield') {
      this.loadout.shieldCore = norm;
      this.loadout.generatorSlots = Array(count).fill(norm);
    } else if (category === 'drone') {
      this.loadout.droneType = norm;
      this.loadout.droneSlots = Array(count).fill(norm);
    } else if (category === 'missile') {
      this.loadout.missileWeapon = norm;
      this.loadout.missileSlots = Array(count).fill(norm);
    }
    this.saveState();
  }

  public autoFillAllBest(ship: ShipClassConfig) {
    this.syncSlotsForShip(ship);

    const bestLaser =
      [...LASER_CATALOGUE].reverse().find((it) => this.isItemUnlocked(it.id))?.id || 'laser_01';
    const bestShield =
      [...SHIELD_CATALOGUE].reverse().find((it) => this.isItemUnlocked(it.id))?.id || 'shield_01';
    const bestDrone =
      [...DRONE_CATALOGUE].reverse().find((it) => this.isItemUnlocked(it.id))?.id || 'drone_01';
    const bestMissile =
      [...MISSILE_ITEMS].reverse().find((it) => this.isItemUnlocked(it.id))?.id || 'none';

    this.autoFillCategory('weapon', bestLaser, ship.slots.lasers);
    this.autoFillCategory('shield', bestShield, ship.slots.generators);
    this.autoFillCategory('drone', bestDrone, ship.slots.drones);
    this.autoFillCategory('missile', bestMissile, ship.slots.missiles);
  }

  public equipPrimary(id: PrimaryWeaponId) {
    this.autoFillCategory('weapon', id);
  }

  public equipMissile(id: MissileWeaponId) {
    this.autoFillCategory('missile', id);
  }

  public equipShield(id: ShieldCoreId) {
    this.autoFillCategory('shield', id);
  }

  public equipDrone(id: DroneTypeId) {
    this.autoFillCategory('drone', id);
  }

  public getAggregatedLoadoutStats(ship: ShipClassConfig) {
    this.syncSlotsForShip(ship);

    const activeLasers = this.loadout.laserSlots
      .slice(0, ship.slots.lasers)
      .map((id) => {
        const base = this.getEquipmentItem(id) || LASER_CATALOGUE[0];
        const starMult = this.getStarMultiplier(base.id);
        return {
          ...base,
          damageMult: (base.damageMult || 1) * starMult,
        };
      });

    const activeGenerators = this.loadout.generatorSlots
      .slice(0, ship.slots.generators)
      .map((id) => {
        const base = this.getEquipmentItem(id) || SHIELD_CATALOGUE[0];
        const starMult = this.getStarMultiplier(base.id);
        return {
          ...base,
          shieldBonus: Math.round((base.shieldBonus || 45) * starMult),
          shieldRegenBonus: Math.round((base.shieldRegenBonus || 8) * starMult),
        };
      });

    const activeDrones = this.loadout.droneSlots
      .slice(0, ship.slots.drones)
      .map((id) => {
        const base = this.getEquipmentItem(id) || DRONE_CATALOGUE[0];
        const starMult = this.getStarMultiplier(base.id);
        return {
          ...base,
          droneDamage: Math.round((base.droneDamage || 16) * starMult),
        };
      });

    const activeMissiles = this.loadout.missileSlots
      .slice(0, ship.slots.missiles)
      .filter((id) => id !== 'none')
      .map((id) => this.getEquipmentItem(id))
      .filter((it): it is EquipmentItem => Boolean(it))
      .map((base) => ({
        ...base,
        damageMult: (base.damageMult || 1) * this.getStarMultiplier(base.id),
      }));

    let totalShieldBonus = 0;
    let totalShieldRegen = 0;
    let maxDamageReductionPct = 0;
    let maxReflectChance = 0;

    for (const gen of activeGenerators) {
      totalShieldBonus += gen.shieldBonus || 45;
      totalShieldRegen += gen.shieldRegenBonus || 8;
      maxDamageReductionPct = Math.max(maxDamageReductionPct, gen.damageReductionPct || 0);
      maxReflectChance = Math.max(maxReflectChance, gen.reflectChance || 0);
    }

    const multiGenDamageReduction = Math.min(
      68,
      maxDamageReductionPct + (activeGenerators.length - 1) * 1.6
    );

    const avgFireRateMult =
      activeLasers.reduce((sum, l) => sum + (l.fireRateMult || 1), 0) /
      Math.max(1, activeLasers.length);

    const allEquipped = [...activeLasers, ...activeGenerators, ...activeDrones];
    const minEquippedTier = allEquipped.reduce((min, it) => Math.min(min, it.tier), 20);
    const avgEquippedTier =
      allEquipped.reduce((sum, it) => sum + it.tier, 0) / Math.max(1, allEquipped.length);

    const tierCounts: Record<number, number> = {};
    let dominantTierCount = 0;
    let dominantTier = 1;
    for (const it of allEquipped) {
      tierCounts[it.tier] = (tierCounts[it.tier] || 0) + 1;
      if (tierCounts[it.tier] > dominantTierCount) {
        dominantTierCount = tierCounts[it.tier];
        dominantTier = it.tier;
      }
    }

    const setPieces = dominantTierCount;
    const tierScale = 1 + (dominantTier - 1) * 0.08;
    const has2Piece = setPieces >= 2;
    const has4Piece = setPieces >= 4;

    const setShieldMult = has2Piece ? +(1 + 0.25 * tierScale).toFixed(2) : 1.0;
    const setDamageMult = has4Piece
      ? +(1 + 0.35 * tierScale).toFixed(2)
      : has2Piece
      ? +(1 + 0.15 * tierScale).toFixed(2)
      : 1.0;
    const setRegenMult = has4Piece ? +(1 + 0.25 * tierScale).toFixed(2) : 1.0;

    const setBonusName = has4Piece
      ? `4er Mk.${dominantTier} Set (+${Math.round((setDamageMult - 1) * 100)}% DMG)`
      : has2Piece
      ? `2er Mk.${dominantTier} Set (+${Math.round((setShieldMult - 1) * 100)}% SHD)`
      : 'Kein Set aktiv';

    return {
      activeLasers,
      activeGenerators,
      activeDrones,
      activeMissiles,
      totalShieldBonus: Math.round(totalShieldBonus * setShieldMult),
      totalShieldRegen: Math.round(totalShieldRegen * setRegenMult),
      damageReductionPct: multiGenDamageReduction,
      reflectChance: maxReflectChance,
      avgFireRateMult,
      setPieces,
      dominantTier,
      minEquippedTier,
      avgEquippedTier,
      setShieldMult,
      setDamageMult,
      setRegenMult,
      setBonusName,
    };
  }

  public getSalvageQuote(ship: ShipClassConfig): {
    count: number;
    itemsCount: number;
    scrapRefund: number;
    dmRefund: number;
    itemIds: string[];
  } {
    this.syncSlotsForShip(ship);
    const equippedSet = new Set<string>([
      ...this.loadout.laserSlots.slice(0, ship.slots.lasers),
      ...this.loadout.generatorSlots.slice(0, ship.slots.generators),
      ...this.loadout.droneSlots.slice(0, ship.slots.drones),
      ...this.loadout.missileSlots.slice(0, ship.slots.missiles),
    ]);

    const bestLaserTier = Math.max(
      1,
      ...LASER_CATALOGUE.filter((i) => this.isItemUnlocked(i.id)).map((i) => i.tier)
    );
    const bestShieldTier = Math.max(
      1,
      ...SHIELD_CATALOGUE.filter((i) => this.isItemUnlocked(i.id)).map((i) => i.tier)
    );
    const bestDroneTier = Math.max(
      1,
      ...DRONE_CATALOGUE.filter((i) => this.isItemUnlocked(i.id)).map((i) => i.tier)
    );

    const itemIds: string[] = [];
    let scrapRefund = 0;
    let dmRefund = 0;

    for (const id of this.unlockedItems) {
      if (id === 'laser_01' || id === 'shield_01' || id === 'drone_01') continue;
      if (equippedSet.has(id)) continue;
      const item = this.getEquipmentItem(id);
      if (!item) continue;

      const isObsolete =
        (item.category === 'weapon' && item.tier < bestLaserTier) ||
        (item.category === 'shield' && item.tier < bestShieldTier) ||
        (item.category === 'drone' && item.tier < bestDroneTier);

      if (isObsolete) {
        itemIds.push(id);
        scrapRefund += Math.max(150, Math.round(item.costScrap * 0.65));
        dmRefund += Math.max(3, Math.round(item.costDarkMatter * 0.65 + item.tier * 2));
      }
    }

    return {
      count: itemIds.length,
      itemsCount: itemIds.length,
      scrapRefund,
      dmRefund,
      itemIds,
    };
  }

  public salvageSurplusItems(ship: ShipClassConfig): {
    count: number;
    itemsCount: number;
    scrapRefund: number;
    dmRefund: number;
  } {
    this.autoFillAllBest(ship);
    const quote = this.getSalvageQuote(ship);
    if (quote.count <= 0) {
      return { count: 0, itemsCount: 0, scrapRefund: 0, dmRefund: 0 };
    }

    for (const id of quote.itemIds) {
      this.unlockedItems.delete(id);
    }
    this.saveState();
    return {
      count: quote.count,
      itemsCount: quote.count,
      scrapRefund: quote.scrapRefund,
      dmRefund: quote.dmRefund,
    };
  }

  public unlockSector(sectorNum: number) {
    if (sectorNum >= 1 && sectorNum <= 4) {
      this.unlockedSectors.add(sectorNum);
      this.saveState();
    }
  }

  public isSectorUnlocked(sectorNum: number): boolean {
    return this.unlockedSectors.has(sectorNum);
  }
}

export const equipmentManager = new EquipmentManager();
