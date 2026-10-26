import { ShipClassConfig, ShipClassId } from './types.ts';
import { GAME_ASSETS, assetManager } from './assets.ts';

interface ShipBlueprintSeed {
  name: string;
  role: string;
  tagline: string;
  specialName: string;
  specialAbilityType: ShipClassConfig['specialAbilityType'];
  primaryColor: string;
  engineGlow: string;
  bulletColor: string;
  trimColor: string;
  coreGlowColor: string;
  finSweep: number;
}

const GENERATION_NAMES: string[] = [
  'Gen I · Scout Interceptors',
  'Gen II · Strike Corvettes',
  'Gen III · Assault Frigates',
  'Gen IV · Tactical Destroyers',
  'Gen V · Heavy Cruisers',
  'Gen VI · Star Battlecruisers',
  'Gen VII · Carrier Dreadnoughts',
  'Gen VIII · Void Juggernauts',
  'Gen IX · Celestial Titans',
  'Gen X · Omega God-Ships',
];

const FIFTY_SHIP_SEEDS: ShipBlueprintSeed[] = [
  // GEN I: SCOUT INTERCEPTORS (Tier 1 - 5)
  {
    name: 'Aether Dart Mk.I',
    role: 'Light Recon Interceptor',
    tagline: 'Wendiger Starter-Jäger der Orion-Flotte',
    specialName: 'Tachyon Overdrive',
    specialAbilityType: 'overdrive',
    primaryColor: '#38bdf8',
    engineGlow: '#00f2fe',
    bulletColor: '#38bdf8',
    trimColor: '#0284c7',
    coreGlowColor: '#e0f2fe',
    finSweep: 0.25,
  },
  {
    name: 'Vanguard Talon Mk.II',
    role: 'Twin-Pulse Skirmisher',
    tagline: 'Verstärkte Frontpanzerung & Doppel-Reaktor',
    specialName: 'Hyper-Pulse Surge',
    specialAbilityType: 'overdrive',
    primaryColor: '#22d3ee',
    engineGlow: '#38bdf8',
    bulletColor: '#67e8f9',
    trimColor: '#0891b2',
    coreGlowColor: '#cffafe',
    finSweep: 0.4,
  },
  {
    name: 'Zephyr Viper Mk.III',
    role: 'High-Velocity Interceptor',
    tagline: 'Überschall-Abfangjäger mit Pfeilflügeln',
    specialName: 'Ion Afterburner',
    specialAbilityType: 'overdrive',
    primaryColor: '#06b6d4',
    engineGlow: '#22d3ee',
    bulletColor: '#22d3ee',
    trimColor: '#0e7490',
    coreGlowColor: '#a5f3fc',
    finSweep: 0.65,
  },
  {
    name: 'Kestrel Razor Mk.IV',
    role: 'Precision Strike Fighter',
    tagline: 'Schneidet mit fokussierten Lasern durch Schwärme',
    specialName: 'Razor Salvo',
    specialAbilityType: 'overdrive',
    primaryColor: '#0ea5e9',
    engineGlow: '#7dd3fc',
    bulletColor: '#38bdf8',
    trimColor: '#0369a1',
    coreGlowColor: '#bae6fd',
    finSweep: -0.35,
  },
  {
    name: 'Apex Horizon Mk.V',
    role: 'Elite Recon Command Fighter',
    tagline: 'Spitzenmodell der 1. Interceptor-Generation',
    specialName: 'Horizon Overclock',
    specialAbilityType: 'overdrive',
    primaryColor: '#3b82f6',
    engineGlow: '#60a5fa',
    bulletColor: '#93c5fd',
    trimColor: '#1d4ed8',
    coreGlowColor: '#dbeafe',
    finSweep: 0.5,
  },

  // GEN II: STRIKE CORVETTES (Tier 6 - 10)
  {
    name: 'lynx Corvette Mk.VI',
    role: 'Light Escort Corvette',
    tagline: 'Erste Korvette mit erweiterten Schild-Kondensatoren',
    specialName: 'Aegis Deflection',
    specialAbilityType: 'aegis',
    primaryColor: '#10b981',
    engineGlow: '#34d399',
    bulletColor: '#34d399',
    trimColor: '#047857',
    coreGlowColor: '#d1fae5',
    finSweep: 0.2,
  },
  {
    name: 'Sabre Fang Mk.VII',
    role: 'Twin-Hull Strike Corvette',
    tagline: 'Doppelrumpf-Konstruktion für hohe Waffenstabilität',
    specialName: 'Kinetic Barrier',
    specialAbilityType: 'aegis',
    primaryColor: '#34d399',
    engineGlow: '#6ee7b7',
    bulletColor: '#10b981',
    trimColor: '#059669',
    coreGlowColor: '#ecfdf5',
    finSweep: -0.4,
  },
  {
    name: 'Tempest Stalker Mk.VIII',
    role: 'Ion Storm Corvette',
    tagline: 'Entlädt elektrostatische Schockwellen im Gefecht',
    specialName: 'EMP Tempest',
    specialAbilityType: 'emp_nova',
    primaryColor: '#14b8a6',
    engineGlow: '#2dd4bf',
    bulletColor: '#5eead4',
    trimColor: '#0f766e',
    coreGlowColor: '#ccfbf1',
    finSweep: 0.55,
  },
  {
    name: 'Nightshade Phantom Mk.IX',
    role: 'Stealth Infiltration Corvette',
    tagline: 'Tarnkappen-Legierung & Phasen-Disruptoren',
    specialName: 'Phantom EMP Pulse',
    specialAbilityType: 'emp_nova',
    primaryColor: '#a855f7',
    engineGlow: '#c084fc',
    bulletColor: '#d8b4fe',
    trimColor: '#7e22ce',
    coreGlowColor: '#f3e8ff',
    finSweep: 0.75,
  },
  {
    name: 'Valkyrie Prime Mk.X',
    role: 'Command Strike Corvette',
    tagline: 'Flaggschiff der 2. Korvetten-Generation',
    specialName: 'Valkyrie Overdrive',
    specialAbilityType: 'overdrive',
    primaryColor: '#eab308',
    engineGlow: '#facc15',
    bulletColor: '#fde047',
    trimColor: '#a16207',
    coreGlowColor: '#fef9c3',
    finSweep: 0.35,
  },

  // GEN III: ASSAULT FRIGATES (Tier 11 - 15)
  {
    name: 'Centurion Frigate Mk.XI',
    role: 'Armored Line Frigate',
    tagline: 'Schwere Titan-Schotten & Mehrfach-Geschütze',
    specialName: 'Centurion Bulwark',
    specialAbilityType: 'aegis',
    primaryColor: '#f97316',
    engineGlow: '#fb923c',
    bulletColor: '#fdba74',
    trimColor: '#c2410c',
    coreGlowColor: '#ffedd5',
    finSweep: 0.15,
  },
  {
    name: 'Halberd Striker Mk.XII',
    role: 'Broadside Assault Frigate',
    tagline: 'Ausgelegt auf vernichtendes Sperrfeuer',
    specialName: 'Orbital Lance',
    specialAbilityType: 'orbital_lance',
    primaryColor: '#ef4444',
    engineGlow: '#f87171',
    bulletColor: '#fca5a5',
    trimColor: '#b91c1c',
    coreGlowColor: '#fee2e2',
    finSweep: 0.45,
  },
  {
    name: 'Aegis Sentinel Mk.XIII',
    role: 'Fleet Shield Frigate',
    tagline: 'Projiziert mehrschichtige Deflektor-Kuppeln',
    specialName: 'Fortress Matrix',
    specialAbilityType: 'aegis',
    primaryColor: '#00f2fe',
    engineGlow: '#38bdf8',
    bulletColor: '#7dd3fc',
    trimColor: '#0284c7',
    coreGlowColor: '#e0f2fe',
    finSweep: -0.25,
  },
  {
    name: 'Maelstrom Raider Mk.XIV',
    role: 'Deep-Rift Raider Frigate',
    tagline: 'Modifiziert mit erbeuteter Void-Reaktortechnik',
    specialName: 'Maelstrom Nova',
    specialAbilityType: 'emp_nova',
    primaryColor: '#ec4899',
    engineGlow: '#f472b6',
    bulletColor: '#f9a8d4',
    trimColor: '#be185d',
    coreGlowColor: '#fce7f3',
    finSweep: 0.6,
  },
  {
    name: 'Hyperion Vanguard Mk.XV',
    role: 'Heavy Command Frigate',
    tagline: 'Meisterwerk der 3. Fregatten-Generation',
    specialName: 'Hyperion Beam',
    specialAbilityType: 'orbital_lance',
    primaryColor: '#f59e0b',
    engineGlow: '#fbbf24',
    bulletColor: '#fde68a',
    trimColor: '#b45309',
    coreGlowColor: '#fef3c7',
    finSweep: 0.3,
  },

  // GEN IV: TACTICAL DESTROYERS (Tier 16 - 20)
  {
    name: 'Glaive Destroyer Mk.XVI',
    role: 'Hunter-Killer Destroyer',
    tagline: 'Spezialisiert auf das Brechen schwerer Kreuzer',
    specialName: 'Tachyon Barrage',
    specialAbilityType: 'overdrive',
    primaryColor: '#6366f1',
    engineGlow: '#818cf8',
    bulletColor: '#a5b4fc',
    trimColor: '#4338ca',
    coreGlowColor: '#e0e7ff',
    finSweep: 0.5,
  },
  {
    name: 'Obsidian Wraith Mk.XVII',
    role: 'Phase-Cloak Destroyer',
    tagline: 'Dunkle Materie-Hülle absorbiert feindliches Feuer',
    specialName: 'Wraith Singularity',
    specialAbilityType: 'emp_nova',
    primaryColor: '#9333ea',
    engineGlow: '#c084fc',
    bulletColor: '#e9d5ff',
    trimColor: '#6b21a8',
    coreGlowColor: '#faf5ff',
    finSweep: -0.55,
  },
  {
    name: 'Paladin Bastion Mk.XVIII',
    role: 'Siege Defense Destroyer',
    tagline: 'Unerschütterliches Bollwerk im Asteroidengürtel',
    specialName: 'Paladin Aegis',
    specialAbilityType: 'aegis',
    primaryColor: '#2dd4bf',
    engineGlow: '#5eead4',
    bulletColor: '#99f6e4',
    trimColor: '#0f766e',
    coreGlowColor: '#f0fdfa',
    finSweep: 0.1,
  },
  {
    name: 'Hellfire Punisher Mk.XIX',
    role: 'Heavy Ordnance Destroyer',
    tagline: 'Massiver Waffenträger mit Plasma-Kanonenbatterien',
    specialName: 'Hellfire Lance',
    specialAbilityType: 'orbital_lance',
    primaryColor: '#f43f5e',
    engineGlow: '#fb7185',
    bulletColor: '#fda4af',
    trimColor: '#be123c',
    coreGlowColor: '#ffe4e6',
    finSweep: 0.4,
  },
  {
    name: 'Nemesis的执行者 Mk.XX',
    role: 'Apex Fleet Destroyer',
    tagline: 'Gefürchtetes Flaggschiff der 4. Zerstörer-Generation',
    specialName: 'Nemesis Cataclysm',
    specialAbilityType: 'singularity_storm',
    primaryColor: '#d946ef',
    engineGlow: '#e879f9',
    bulletColor: '#f5d0fe',
    trimColor: '#a21caf',
    coreGlowColor: '#fdf4ff',
    finSweep: 0.7,
  },

  // GEN V: HEAVY CRUISERS (Tier 21 - 25)
  {
    name: 'Aethelgard Cruiser Mk.XXI',
    role: 'Armored Heavy Cruiser',
    tagline: 'Schwerer Flottenkreuzer mit 5-Kern-Schildmatrix',
    specialName: 'Aethelgard Shield',
    specialAbilityType: 'aegis',
    primaryColor: '#0ea5e9',
    engineGlow: '#38bdf8',
    bulletColor: '#7dd3fc',
    trimColor: '#0369a1',
    coreGlowColor: '#e0f2fe',
    finSweep: 0.25,
  },
  {
    name: 'Solaris Crusader Mk.XXII',
    role: 'Fusion Lance Cruiser',
    tagline: 'Kanalisiert die Hitze einer Sonneneruption',
    specialName: 'Solaris Lance',
    specialAbilityType: 'orbital_lance',
    primaryColor: '#f59e0b',
    engineGlow: '#facc15',
    bulletColor: '#fef08a',
    trimColor: '#b45309',
    coreGlowColor: '#ffffff',
    finSweep: 0.35,
  },
  {
    name: 'Cryo-Vortex Cruiser Mk.XXIII',
    role: 'Sub-Zero Control Cruiser',
    tagline: 'Friert feindliche Zielsysteme mit Kryo-Impulsen ein',
    specialName: 'Absolute Zero Nova',
    specialAbilityType: 'emp_nova',
    primaryColor: '#38bdf8',
    engineGlow: '#67e8f9',
    bulletColor: '#a5f3fc',
    trimColor: '#0284c7',
    coreGlowColor: '#ecfeff',
    finSweep: -0.3,
  },
  {
    name: 'Draco Sovereign Mk.XXIV',
    role: 'Dragon-Class Strike Cruiser',
    tagline: 'Aggressiver Angriffs-Kreuzer mit Zwillings-Lanzen',
    specialName: 'Dragon Overdrive',
    specialAbilityType: 'overdrive',
    primaryColor: '#ef4444',
    engineGlow: '#f97316',
    bulletColor: '#fde047',
    trimColor: '#991b1b',
    coreGlowColor: '#fef2f2',
    finSweep: 0.65,
  },
  {
    name: 'Imperator Prime Mk.XXV',
    role: 'Grand Command Cruiser',
    tagline: 'Meilenstein-Schiff zur Halbzeit der 50er Flotte',
    specialName: 'Imperial Singularity',
    specialAbilityType: 'singularity_storm',
    primaryColor: '#eab308',
    engineGlow: '#fde047',
    bulletColor: '#fef9c3',
    trimColor: '#ca8a04',
    coreGlowColor: '#ffffff',
    finSweep: 0.45,
  },

  // GEN VI: STAR BATTLECRUISERS (Tier 26 - 30)
  {
    name: 'Excalibur Battlecruiser Mk.XXVI',
    role: 'Linebreaker Battlecruiser',
    tagline: 'Spaltet feindliche Schlachtreihen mit Tachyon-Klingen',
    specialName: 'Excalibur Slash',
    specialAbilityType: 'orbital_lance',
    primaryColor: '#22d3ee',
    engineGlow: '#67e8f9',
    bulletColor: '#cffafe',
    trimColor: '#0891b2',
    coreGlowColor: '#ffffff',
    finSweep: 0.55,
  },
  {
    name: 'Acheron Void-Cruiser Mk.XXVII',
    role: 'Abyssal Battlecruiser',
    tagline: 'Geschmiedet am Rand des Kuiper-Abgrunds',
    specialName: 'Abyssal Storm',
    specialAbilityType: 'singularity_storm',
    primaryColor: '#a855f7',
    engineGlow: '#d8b4fe',
    bulletColor: '#f3e8ff',
    trimColor: '#6b21a8',
    coreGlowColor: '#ffffff',
    finSweep: -0.45,
  },
  {
    name: 'Colossus Citadel Mk.XXVIII',
    role: 'Fortress Battlecruiser',
    tagline: 'Fliegende Zitadelle mit massiven Schildgeneratoren',
    specialName: 'Citadel Invulnerability',
    specialAbilityType: 'aegis',
    primaryColor: '#10b981',
    engineGlow: '#6ee7b7',
    bulletColor: '#a7f3d0',
    trimColor: '#047857',
    coreGlowColor: '#ffffff',
    finSweep: 0.1,
  },
  {
    name: 'Ragnarok Bringer Mk.XXIX',
    role: 'Apocalypse Battlecruiser',
    tagline: 'Entfesselt gewaltige Feuerstürme über das gesamte Feld',
    specialName: 'Ragnarok Barrage',
    specialAbilityType: 'overdrive',
    primaryColor: '#f43f5e',
    engineGlow: '#fb923c',
    bulletColor: '#fed7aa',
    trimColor: '#9f1239',
    coreGlowColor: '#ffffff',
    finSweep: 0.5,
  },
  {
    name: 'Zenith Archon Mk.XXX',
    role: 'Supreme Battlecruiser',
    tagline: 'Krönung der 6. Schlachtkreuzer-Generation',
    specialName: 'Archon Convergence',
    specialAbilityType: 'singularity_storm',
    primaryColor: '#c084fc',
    engineGlow: '#38bdf8',
    bulletColor: '#e0f2fe',
    trimColor: '#7e22ce',
    coreGlowColor: '#ffffff',
    finSweep: 0.4,
  },

  // GEN VII: CARRIER DREADNOUGHTS (Tier 31 - 35)
  {
    name: 'Hive Sovereign Mk.XXXI',
    role: 'Swarm Carrier Dreadnought',
    tagline: 'Trägerschiff für große autonome Drohnen-Geschwader',
    specialName: 'Swarm Overclock',
    specialAbilityType: 'overdrive',
    primaryColor: '#34d399',
    engineGlow: '#10b981',
    bulletColor: '#6ee7b7',
    trimColor: '#065f46',
    coreGlowColor: '#ffffff',
    finSweep: 0.2,
  },
  {
    name: 'Leviathan Dreadnought Mk.XXXII',
    role: 'Deep-Space Capital Ship',
    tagline: 'Gigantisches Großkampfschiff mit dreifachem Reaktorkern',
    specialName: 'Leviathan Lance',
    specialAbilityType: 'orbital_lance',
    primaryColor: '#3b82f6',
    engineGlow: '#38bdf8',
    bulletColor: '#bae6fd',
    trimColor: '#1e40af',
    coreGlowColor: '#ffffff',
    finSweep: 0.3,
  },
  {
    name: 'Helios Sunbreaker Mk.XXXIII',
    role: 'Stellar Dreadnought',
    tagline: 'Fusionsreaktor mit der Leuchtkraft eines jungen Sterns',
    specialName: 'Supernova Pulse',
    specialAbilityType: 'emp_nova',
    primaryColor: '#fbbf24',
    engineGlow: '#f97316',
    bulletColor: '#fef08a',
    trimColor: '#b45309',
    coreGlowColor: '#ffffff',
    finSweep: 0.45,
  },
  {
    name: 'Chronos Paradox Mk.XXXIV',
    role: 'Temporal Carrier Dreadnought',
    tagline: 'Krümmt die Raumzeit zur Beschleunigung aller Waffensysteme',
    specialName: 'Temporal Distortion',
    specialAbilityType: 'singularity_storm',
    primaryColor: '#e879f9',
    engineGlow: '#c084fc',
    bulletColor: '#fae8ff',
    trimColor: '#86198f',
    coreGlowColor: '#ffffff',
    finSweep: -0.5,
  },
  {
    name: 'Overlord Prime Mk.XXXV',
    role: 'Grand Fleet Carrier',
    tagline: 'Kommandoträger der 7. Dreadnought-Generation',
    specialName: 'Overlord Annihilation',
    specialAbilityType: 'orbital_lance',
    primaryColor: '#f43f5e',
    engineGlow: '#facc15',
    bulletColor: '#fef9c3',
    trimColor: '#9f1239',
    coreGlowColor: '#ffffff',
    finSweep: 0.35,
  },

  // GEN VIII: VOID JUGGERNAUTS (Tier 36 - 40)
  {
    name: 'Behemoth Juggernaut Mk.XXXVI',
    role: 'Super-Heavy Juggernaut',
    tagline: 'Nahezu unzerstörbarer Rumpf aus Neutronen-Stahl',
    specialName: 'Neutron Fortress',
    specialAbilityType: 'aegis',
    primaryColor: '#fb923c',
    engineGlow: '#facc15',
    bulletColor: '#fed7aa',
    trimColor: '#9a3412',
    coreGlowColor: '#ffffff',
    finSweep: 0.15,
  },
  {
    name: 'Abyssal Harbinger Mk.XXXVII',
    role: 'Void-Rift Juggernaut',
    tagline: 'Nutzt schwarze Miniatur-Löcher als Energiequelle',
    specialName: 'Harbinger Collapse',
    specialAbilityType: 'singularity_storm',
    primaryColor: '#8b5cf6',
    engineGlow: '#ec4899',
    bulletColor: '#ddd6fe',
    trimColor: '#5b21b6',
    coreGlowColor: '#ffffff',
    finSweep: 0.55,
  },
  {
    name: 'Quasar Obliterator Mk.XXXVIII',
    role: 'Quasar Beam Juggernaut',
    tagline: 'Bündelt relativistische Jets in 9 Laser-Batterien',
    specialName: 'Quasar Deathbeam',
    specialAbilityType: 'orbital_lance',
    primaryColor: '#00f2fe',
    engineGlow: '#a855f7',
    bulletColor: '#cffafe',
    trimColor: '#0369a1',
    coreGlowColor: '#ffffff',
    finSweep: 0.4,
  },
  {
    name: 'Thanatos Reaper Mk.XXXIX',
    role: 'Executioner Juggernaut',
    tagline: 'Erntet ganze Boss-Flotten im endlosen Riss',
    specialName: 'Reaper Overdrive',
    specialAbilityType: 'overdrive',
    primaryColor: '#e11d48',
    engineGlow: '#f43f5e',
    bulletColor: '#fecdd3',
    trimColor: '#881337',
    coreGlowColor: '#ffffff',
    finSweep: -0.6,
  },
  {
    name: 'Singularity Monarch Mk.XL',
    role: 'Apex Void Juggernaut',
    tagline: 'Herrscher über den Ereignishorizont (Stufe 40)',
    specialName: 'Monarch Horizon',
    specialAbilityType: 'singularity_storm',
    primaryColor: '#c084fc',
    engineGlow: '#facc15',
    bulletColor: '#fef08a',
    trimColor: '#6b21a8',
    coreGlowColor: '#ffffff',
    finSweep: 0.5,
  },

  // GEN IX: CELESTIAL TITANS (Tier 41 - 45)
  {
    name: 'Hypernova Titan Mk.XLI',
    role: 'Celestial War Titan',
    tagline: 'Kriegsschiff von planetarem Maßstab',
    specialName: 'Hypernova Eruption',
    specialAbilityType: 'singularity_storm',
    primaryColor: '#f59e0b',
    engineGlow: '#38bdf8',
    bulletColor: '#fef08a',
    trimColor: '#b45309',
    coreGlowColor: '#ffffff',
    finSweep: 0.35,
  },
  {
    name: 'Astral Seraphim Mk.XLII',
    role: 'Six-Winged Celestial Titan',
    tagline: 'Sechs energetische Lichtflügel & heilige Schildbarriere',
    specialName: 'Seraphim Sanctuary',
    specialAbilityType: 'aegis',
    primaryColor: '#38bdf8',
    engineGlow: '#fde047',
    bulletColor: '#e0f2fe',
    trimColor: '#0284c7',
    coreGlowColor: '#ffffff',
    finSweep: 0.75,
  },
  {
    name: 'Galactic Arbiter Mk.XLIII',
    role: 'Judgement Titan',
    tagline: 'Vollstreckt das Urteil mit 11 synchronen Hauptlasern',
    specialName: 'Arbiter Judgement',
    specialAbilityType: 'orbital_lance',
    primaryColor: '#a855f7',
    engineGlow: '#00f2fe',
    bulletColor: '#f3e8ff',
    trimColor: '#6b21a8',
    coreGlowColor: '#ffffff',
    finSweep: 0.45,
  },
  {
    name: 'Nebula Sovereign Mk.XLIV',
    role: 'Cosmic Storm Titan',
    tagline: 'Geboren im Herzen eines kollabierenden Sternennebels',
    specialName: 'Cosmic Overdrive',
    specialAbilityType: 'overdrive',
    primaryColor: '#ec4899',
    engineGlow: '#38bdf8',
    bulletColor: '#fbcfe8',
    trimColor: '#9d174d',
    coreGlowColor: '#ffffff',
    finSweep: -0.45,
  },
  {
    name: 'Eternity Celestia Mk.XLV',
    role: 'Supreme Celestial Titan',
    tagline: 'Unsterblicher Titan der 9. Generation',
    specialName: 'Eternity Cataclysm',
    specialAbilityType: 'singularity_storm',
    primaryColor: '#fde047',
    engineGlow: '#22d3ee',
    bulletColor: '#ffffff',
    trimColor: '#ca8a04',
    coreGlowColor: '#ffffff',
    finSweep: 0.6,
  },

  // GEN X: OMEGA GOD-SHIPS (Tier 46 - 50)
  {
    name: 'Dimensional Genesis Mk.XLVI',
    role: 'Multiversal God-Ship',
    tagline: 'Reißt Risse zwischen den Dimensionen auf',
    specialName: 'Genesis Rift',
    specialAbilityType: 'singularity_storm',
    primaryColor: '#00f2fe',
    engineGlow: '#f43f5e',
    bulletColor: '#ffffff',
    trimColor: '#0284c7',
    coreGlowColor: '#ffffff',
    finSweep: 0.55,
  },
  {
    name: 'Void Divinity Mk.XLVII',
    role: 'Transcendent God-Ship',
    tagline: 'Verschmilzt Reine Leere mit Quanten-Singularitäten',
    specialName: 'Divine Obliteration',
    specialAbilityType: 'orbital_lance',
    primaryColor: '#d946ef',
    engineGlow: '#fde047',
    bulletColor: '#fae8ff',
    trimColor: '#86198f',
    coreGlowColor: '#ffffff',
    finSweep: 0.65,
  },
  {
    name: 'Infinity Ouroboros Mk.XLVIII',
    role: 'Eternal Cycle God-Ship',
    tagline: 'Unendlicher Energiefluss für 12 Laser & 14 Drohnen',
    specialName: 'Ouroboros Ascendance',
    specialAbilityType: 'overdrive',
    primaryColor: '#10b981',
    engineGlow: '#a855f7',
    bulletColor: '#d1fae5',
    trimColor: '#047857',
    coreGlowColor: '#ffffff',
    finSweep: -0.55,
  },
  {
    name: 'Alpha & Omega Prime Mk.XLIX',
    role: 'Omnipotent God-Ship',
    tagline: 'Die vorletzte Stufe kosmischer Überlegenheit',
    specialName: 'Omnipotent Nova',
    specialAbilityType: 'singularity_storm',
    primaryColor: '#f43f5e',
    engineGlow: '#00f2fe',
    bulletColor: '#ffe4e6',
    trimColor: '#be123c',
    coreGlowColor: '#ffffff',
    finSweep: 0.7,
  },
  {
    name: 'AETHER OMNIVERSE GOD-TITAN Mk.L',
    role: 'Ultimate Tier-50 God-Titan',
    tagline: 'Das 50. Schiff: 12 Laser, 12 Generatoren, 15 Drohnen — Absolute Herrschaft',
    specialName: 'OMNIVERSE BIG BANG',
    specialAbilityType: 'singularity_storm',
    primaryColor: '#fde047',
    engineGlow: '#00f2fe',
    bulletColor: '#ffffff',
    trimColor: '#f59e0b',
    coreGlowColor: '#ffffff',
    finSweep: 0.85,
  },
];

const SPRITE_POOL = [
  GAME_ASSETS.ships.interceptor,
  GAME_ASSETS.ships.cruiser,
  GAME_ASSETS.ships.phantom,
  GAME_ASSETS.ships.dreadnought,
];

function buildShipConfig(seed: ShipBlueprintSeed, index: number): ShipClassConfig {
  const tier = index + 1; // 1..50
  const generation = Math.floor(index / 5) + 1; // 1..10
  const generationName = GENERATION_NAMES[generation - 1];
  const id = `ship_${String(tier).padStart(2, '0')}`;

  // Strictly increasing stats for every single ship (1 -> 50)
  // Exponential + linear growth so each ship feels substantially stronger than the previous one
  const hullMax = Math.round(120 * Math.pow(1.135, index) + index * 45);
  const shieldMax = Math.round(90 * Math.pow(1.14, index) + index * 38);
  const baseDps = Math.round(45 * Math.pow(1.125, index) + index * 18);
  const baseDamage = Math.round(baseDps * 0.85);
  const speed = Math.round(360 + Math.min(180, index * 3.6));
  const specialCooldown = Math.max(10, Math.round((22 - index * 0.22) * 10) / 10);

  // Progressive Multi-Slot Expansion from Ship #1 (1/1/1/1) up to Ship #50 (12/12/15/6)
  const lasers = Math.min(12, 1 + Math.floor((index * 11) / 49));
  const generators = Math.min(12, 1 + Math.floor(((index + 1) * 11) / 50));
  const drones = Math.min(15, 1 + Math.floor((index * 14) / 49));
  const missiles = Math.min(6, 1 + Math.floor((index * 5) / 49));

  // Long-term AAA Endgame Unlock Curve (Ship #1 is free; Ship #50 requires Prestige 73 & massive exponential currencies)
  const isStarter = tier === 1;
  const prestigeRequired = isStarter ? 0 : Math.max(1, Math.floor((tier - 1) * 1.5));
  const sectorRequired = Math.min(4, 1 + Math.floor(index / 6));

  const costScrap = isStarter
    ? 0
    : Math.round(1200 * Math.pow(1.34, index));
  const costDarkMatter = isStarter
    ? 0
    : Math.round(15 * Math.pow(1.28, index));
  const costQuantumShards =
    tier <= 3
      ? 0
      : Math.round(4 * Math.pow(1.23, index - 2));

  const specialDescriptions: Record<ShipClassConfig['specialAbilityType'], string> = {
    overdrive: `Lädt Schilde sofort auf 100% und entfesselt für 6s +250% Feuerrate auf allen ${lasers} Laser-Slots.`,
    aegis: `Erzeugt für 6s eine unverwundbare Deflektor-Kuppel, die feindliche Projektile mit ${150 + tier * 12}% Schaden reflektiert.`,
    emp_nova: `Entlädt eine elektromagnetische Schockwelle über das gesamte Feld, betäubt Feinde für 3.5s und verursacht massiven Flächenschaden.`,
    orbital_lance: `Feuert einen durchdringenden Orbital-Tachyonenstrahl ab, der alle Ziele vor dem Schiff verdampft.`,
    singularity_storm: `Zündet eine Raumzeit-Singularität: Volle Schilde, +200% Feuerrate, 3.5s Feind-Stun und verheerender Void-Flächenschaden!`,
  };

  return {
    id,
    tier,
    generation,
    generationName,
    name: seed.name,
    role: seed.role,
    tagline: seed.tagline,
    hullMax,
    shieldMax,
    baseDps,
    baseDamage,
    speed,
    slots: {
      lasers,
      generators,
      drones,
      missiles,
    },
    specialName: seed.specialName,
    specialDescription: specialDescriptions[seed.specialAbilityType],
    specialCooldown,
    specialAbilityType: seed.specialAbilityType,
    primaryColor: seed.primaryColor,
    engineGlow: seed.engineGlow,
    bulletColor: seed.bulletColor,
    spriteUrl: `/assets/sprites/ships/${id}.png`,
    spriteAssetPath: `/assets/sprites/ships/${id}.png`,
    visualAsset: {
      chassisType: generation - 1, // 0..9
      wingStyle: index % 5, // 0..4
      engineCount: Math.min(7, 1 + Math.floor(generation / 2)),
      turretCount: lasers,
      coreGlowColor: seed.coreGlowColor,
      trimColor: seed.trimColor,
      finSweep: seed.finSweep,
      hullScale: 0.96 + (index / 49) * 0.36,
    },
    unlockRequirement: {
      unlockedByDefault: isStarter,
      prestigeRequired,
      sectorRequired,
      costScrap,
      costDarkMatter,
      costQuantumShards,
    },
  };
}

export const SHIP_CLASSES_LIST: ShipClassConfig[] = FIFTY_SHIP_SEEDS.map((seed, idx) =>
  buildShipConfig(seed, idx)
);

export const SHIP_CLASSES: Record<string, ShipClassConfig> = {};
for (const ship of SHIP_CLASSES_LIST) {
  SHIP_CLASSES[ship.id] = ship;
}

// Legacy aliases so old saves/multiplayer references never crash
SHIP_CLASSES['interceptor'] = SHIP_CLASSES['ship_01'];
SHIP_CLASSES['cruiser'] = SHIP_CLASSES['ship_06'];
SHIP_CLASSES['phantom'] = SHIP_CLASSES['ship_09'];
SHIP_CLASSES['dreadnought'] = SHIP_CLASSES['ship_32'];

export function getShipConfig(shipId?: string): ShipClassConfig {
  if (!shipId) return SHIP_CLASSES_LIST[0];
  return SHIP_CLASSES[shipId] || SHIP_CLASSES_LIST[0];
}

/**
 * Renders the bespoke AI-generated 3D spacecraft sprite for any of the 50 ships onto a 2D Canvas context.
 * Uses corner-sampled flood-fill alpha background removal (zero blue boxes, zero simple triangles).
 * Centered at (0, 0) facing UPWARD (-Y).
 */
export function renderBespokeShipCanvas(
  ctx: CanvasRenderingContext2D,
  shipOrId: ShipClassConfig | string,
  options?: {
    scale?: number;
    size?: number;
    time?: number;
    timeMs?: number;
    overridePrimary?: string;
    overrideAccent?: string;
    overrideHullColor?: string;
    overrideGlowColor?: string;
    weaponLevel?: number;
    isFiring?: boolean;
    hitFlash?: boolean;
  }
) {
  const ship = typeof shipOrId === 'string' ? getShipConfig(shipOrId) : shipOrId;
  const baseScale = options?.size
    ? options.size / 64
    : (options?.scale ?? 1.0) * ship.visualAsset.hullScale;
  const t = options?.time ?? (options?.timeMs ? options.timeMs * 0.003 : Date.now() * 0.003);
  const primary = options?.overridePrimary || options?.overrideHullColor || ship.primaryColor;
  const trim = options?.overrideAccent || ship.visualAsset.trimColor;
  const glow = options?.overrideGlowColor || ship.engineGlow;
  const gen = ship.generation; // 1..10

  ctx.save();
  ctx.scale(baseScale, baseScale);

  // 1. Subtle High-Tier Quantum Halo Ring behind the 3D hull (Tier 12+)
  if (ship.tier >= 12 && !options?.hitFlash) {
    ctx.save();
    ctx.strokeStyle = glow;
    ctx.lineWidth = ship.tier >= 36 ? 1.8 : 1.2;
    ctx.globalAlpha = 0.34 + Math.sin(t * 2.5) * 0.1;
    ctx.setLineDash(ship.tier >= 30 ? [6, 4] : [4, 4]);
    ctx.beginPath();
    ctx.arc(0, 2, 26 + Math.min(10, gen * 1.1), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 2. Render Real AI-Generated 3D Spacecraft Sprite (Background-Removed)
  const sprite3D = assetManager.getShip3DSprite(ship, {
    overridePrimary: options?.overridePrimary || options?.overrideHullColor,
    overrideAccent: options?.overrideAccent,
    hitFlash: options?.hitFlash,
  });

  const drawSize = 66 + Math.min(18, gen * 1.6);
  if (sprite3D) {
    ctx.save();
    ctx.shadowColor = options?.hitFlash ? '#ffffff' : glow;
    ctx.shadowBlur = options?.hitFlash ? 14 : 8;
    ctx.drawImage(sprite3D, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
    ctx.restore();
  } else {
    // Immediate fallback using preloaded 3D core ship sprite
    const rawFallback =
      assetManager.getSprite('ship_interceptor') ||
      assetManager.getRawImage('ship_interceptor');
    if (rawFallback) {
      ctx.drawImage(rawFallback, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
    }
  }

  // 3. Subtle pulsing reactor core highlight on the 3D hull
  if (!options?.hitFlash) {
    const corePulse = 2.4 + Math.sin(t * 4) * 0.5;
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = primary;
    ctx.shadowBlur = 6;
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.arc(0, 4, corePulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Renders a real AI-generated 3D Escort Drone sprite (background-removed, zero boxes, zero simple triangles)
 * centered at (0,0) facing UPWARD (-Y).
 */
export function renderVector3DDrone(
  ctx: CanvasRenderingContext2D,
  tier: number,
  primaryColor: string,
  secondaryColor: string,
  size: number = 28
) {
  ctx.save();

  // Outer energy ring for higher tier drones
  if (tier >= 5) {
    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 1.1;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.52, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  }

  const droneSprite =
    assetManager.getDrone3DSprite(tier, primaryColor, secondaryColor) ||
    assetManager.getSprite('ally_drone');

  if (droneSprite) {
    ctx.shadowColor = primaryColor;
    ctx.shadowBlur = 6;
    ctx.drawImage(droneSprite, -size / 2, -size / 2, size, size);
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}



