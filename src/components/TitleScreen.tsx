import React, { useState, useEffect, useRef } from 'react';
import { ShipClassId, GuildData, VoidDungeon } from '../game/types.ts';
import {
  SHIP_CLASSES_LIST,
  getShipConfig,
  renderBespokeShipCanvas,
  renderVector3DDrone,
} from '../game/shipClasses.ts';
import {
  assetManager,
  GAME_ASSETS,
  UI_ASSETS,
  getStargateSectorBannerUrl,
} from '../game/assets.ts';
import { sound } from '../game/audio.ts';
import { COSMETIC_CATALOGUE, cosmetics } from '../game/cosmetics.ts';
import { dailyMissions } from '../game/missions.ts';
import { equipmentManager, STARGATE_SECTORS } from '../game/equipment.ts';
import { paragonManager, VoidRiftMutator } from '../game/paragon.ts';
import { metaProgression } from '../game/metaProgression.ts';
import { GuildPanel } from './GuildPanel.tsx';
import { CosmeticShop } from './CosmeticShop.tsx';
import { DailyMissions } from './DailyMissions.tsx';
import { GlobalLeaderboard } from './GlobalLeaderboard.tsx';
import { ArmoryFittingModal } from './ArmoryFittingModal.tsx';
import { VoidDungeonsModal } from './VoidDungeonsModal.tsx';
import { ParagonMatrixModal } from './ParagonMatrixModal.tsx';
import { SciFiFrame, SciFiButton, UI3DIcon } from './SciFiFrame.tsx';
import { ItemArtwork } from './ItemArtwork.tsx';
import { formatCompactNumber } from '../game/formatters.ts';

interface TitleScreenProps {
  selectedShip: ShipClassId;
  onSelectShip: (ship: ShipClassId) => void;
  roomCode: string;
  onChangeRoomCode: (code: string) => void;
  callsign: string;
  onChangeCallsign: (name: string) => void;
  onStartGame: (
    ship: ShipClassId,
    room: string,
    name: string,
    startSector?: number,
    endlessRift?: { depth: number; mutator: VoidRiftMutator }
  ) => void;
  currentGuild: GuildData | null;
  scrap: number;
  darkMatter: number;
  onCurrencyChange: (newScrap: number, newDarkMatter: number) => void;
  onTriggerPrestige?: () => void;
  onOpenCommandDeck?: (tab?: 'arena' | 'honor_shop' | 'pilots' | 'expeditions' | 'codex') => void;
}

type MobileBaseTab = 'hangar' | 'armory' | 'rifts' | 'shop' | 'hq';
type HqSubTab = 'missions' | 'guild' | 'rankings' | 'squad';
type RiftSubTab = 'paragon' | 'dungeons';

export const TitleScreen: React.FC<TitleScreenProps> = ({
  selectedShip,
  onSelectShip,
  roomCode,
  onChangeRoomCode,
  callsign,
  onChangeCallsign,
  onStartGame,
  currentGuild,
  scrap,
  darkMatter,
  onCurrencyChange,
  onTriggerPrestige,
  onOpenCommandDeck,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(sound.enabled);
  const [activeTab, setActiveTab] = useState<MobileBaseTab>('hangar');
  const [hqSubTab, setHqSubTab] = useState<HqSubTab>('missions');
  const [riftSubTab, setRiftSubTab] = useState<RiftSubTab>('paragon');
  const [equippedTick, setEquippedTick] = useState(0);
  const [claimableMissionsCount, setClaimableMissionsCount] = useState(0);
  const [testFireActive, setTestFireActive] = useState(false);

  const [paragonState, setParagonState] = useState(() => paragonManager.getState());
  const activeShipConfig = getShipConfig(selectedShip);
  const [previewShipId, setPreviewShipId] = useState<string>(activeShipConfig.id);
  const [selectedGeneration, setSelectedGeneration] = useState<number>(activeShipConfig.generation);

  const unlockedList = Array.from(equipmentManager.unlockedSectors);
  const highestUnlocked = Math.max(...unlockedList, 1);
  const [selectedSector, setSelectedSector] = useState<number>(highestUnlocked);

  const hangarCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const pState = paragonManager.getState();
    setParagonState(pState);
    const cfg = getShipConfig(selectedShip);
    if (!equipmentManager.isShipUnlocked(cfg.id, pState.prestigeRank)) {
      onSelectShip('ship_01');
      setPreviewShipId('ship_01');
    }
  }, [selectedShip, onSelectShip]);

  useEffect(() => {
    dailyMissions.initOrRefresh();
    const updateBadge = () => {
      setClaimableMissionsCount(dailyMissions.getClaimableCount());
    };
    updateBadge();
    dailyMissions.onStateChanged = updateBadge;
    return () => {
      dailyMissions.onStateChanged = undefined;
    };
  }, [activeTab]);

  const previewShipConfig = getShipConfig(previewShipId);
  const isPreviewUnlocked = equipmentManager.isShipUnlocked(
    previewShipConfig.id,
    paragonState.prestigeRank
  );

  // 60FPS Interactive Drydock Ship Preview Canvas (Renders all 50 bespoke ships + multi-slot weapon fire)
  useEffect(() => {
    if (activeTab !== 'hangar') return;
    let animId: number;
    let time = 0;

    const renderDrydock = () => {
      const canvas = hangarCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      time += 0.035;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2 + Math.sin(time * 1.5) * 4 + 4;

      const shipConfig = getShipConfig(previewShipId);
      const skin = cosmetics.getEquippedSkinItem();
      const trail = cosmetics.getEquippedTrailItem();
      const laser = cosmetics.getEquippedLaserItem();
      const relic = COSMETIC_CATALOGUE.find((i) => i.id === cosmetics.equipped.hangarId);

      const primaryColor =
        skin.id === 'skin-default' ? shipConfig.primaryColor : skin.primaryColor || shipConfig.primaryColor;
      const glowColor =
        skin.id === 'skin-default' ? shipConfig.engineGlow : skin.accentColor || shipConfig.engineGlow;

      // Ambient 3D Singularity Turntable Ring
      const turntableImg = assetManager.getRawImage('ui_joystick_base');
      if (turntableImg && turntableImg.complete && turntableImg.naturalWidth > 0) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(time * 0.25);
        ctx.globalAlpha = 0.4;
        ctx.drawImage(turntableImg, -72, -72, 144, 144);
        ctx.restore();
      }

      // Hangar Relic 3D Sprite Orbit
      if (relic && relic.id !== 'hangar-default') {
        const starbaseSprite = assetManager.getSprite('env_starbase');
        if (starbaseSprite) {
          ctx.save();
          ctx.translate(cx + Math.cos(time * 0.9) * 78, cy + Math.sin(time * 0.9) * 32);
          ctx.rotate(time * 0.5);
          ctx.drawImage(starbaseSprite, -18, -18, 36, 36);
          ctx.restore();
        }
      }

      // Live Multi-Slot Weapon Fire Preview
      if (testFireActive || Math.sin(time * 2.2) > 0.35) {
        const lColor =
          laser.id === 'laser-default' ? shipConfig.bulletColor : laser.primaryColor || shipConfig.bulletColor;
        const offset = (time * 250) % 75;
        const laserSlotsCount = Math.min(10, shipConfig.slots.lasers);

        ctx.save();
        ctx.strokeStyle = lColor;
        ctx.shadowColor = lColor;
        ctx.shadowBlur = 10;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        for (let s = 0; s < laserSlotsCount; s++) {
          const spreadX = (s - (laserSlotsCount - 1) / 2) * 8.5;
          const staggerY = Math.abs(s - (laserSlotsCount - 1) / 2) * 3;
          ctx.moveTo(cx + spreadX, cy - 22 - offset + staggerY);
          ctx.lineTo(cx + spreadX, cy - 42 - offset + staggerY);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Engine Trail Plume
      const tColor =
        trail.id === 'trail-default' ? shipConfig.engineGlow : trail.primaryColor || shipConfig.engineGlow;
      for (let i = 0; i < 6; i++) {
        const prog = (time * 2.4 + i * 0.17) % 1;
        const py = cy + 22 + prog * 40;
        const px = cx + Math.sin(time * 6 + i) * 3.5;
        const rad = (1 - prog) * 6;
        ctx.save();
        ctx.globalAlpha = (1 - prog) * 0.85;
        ctx.fillStyle = tColor;
        ctx.shadowColor = tColor;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(px, py, Math.max(1, rad), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Orbiting Vector-3D Drone Sprites in Drydock (Zero Background Box)
      const visibleDrones = Math.min(8, shipConfig.slots.drones);
      const eqStats = equipmentManager.getAggregatedLoadoutStats(shipConfig);
      for (let d = 0; d < visibleDrones; d++) {
        const da = time * 1.4 + (d * Math.PI * 2) / visibleDrones;
        const dx = cx + Math.cos(da) * 56;
        const dy = cy + Math.sin(da) * 28;
        const droneItem = eqStats.activeDrones[d % Math.max(1, eqStats.activeDrones.length)];
        const dTier = droneItem ? droneItem.tier : Math.max(1, Math.ceil(shipConfig.tier * 0.4));
        const dColor = droneItem?.color || shipConfig.primaryColor;
        const dSecondary = droneItem?.secondaryColor || shipConfig.engineGlow;

        ctx.save();
        ctx.translate(dx, dy);
        renderVector3DDrone(ctx, dTier, dColor, dSecondary, 18);
        ctx.restore();
      }

      // Real 3D AI-Generated Ship Sprite in Drydock
      ctx.save();
      ctx.translate(cx, cy);
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 16;
      renderBespokeShipCanvas(ctx, shipConfig, {
        scale: 1.32,
        time,
        overridePrimary: primaryColor,
      });
      ctx.restore();

      animId = requestAnimationFrame(renderDrydock);
    };

    renderDrydock();
    return () => cancelAnimationFrame(animId);
  }, [activeTab, previewShipId, equippedTick, testFireActive, isPreviewUnlocked]);

  const toggleSound = () => {
    const next = sound.toggleSound();
    setSoundEnabled(next);
    if (next) sound.playUiClick();
  };

  const handleUnlockShip = () => {
    const req = previewShipConfig.unlockRequirement;
    const pState = paragonManager.getState();
    if (
      pState.prestigeRank < req.prestigeRequired ||
      scrap < req.costScrap ||
      darkMatter < req.costDarkMatter ||
      pState.quantumShards < req.costQuantumShards
    ) {
      return;
    }

    if (req.costQuantumShards > 0) {
      if (!paragonManager.spendQuantumShards(req.costQuantumShards)) return;
    }

    const newScrap = scrap - req.costScrap;
    const newDm = darkMatter - req.costDarkMatter;
    equipmentManager.unlockShip(previewShipConfig.id);
    onCurrencyChange(newScrap, newDm);
    setParagonState(paragonManager.getState());
    onSelectShip(previewShipConfig.id);
    sound.playUpgrade();
    setEquippedTick((t) => t + 1);
  };

  const handleLaunchSector = () => {
    sound.playUiClick();
    const validShip = equipmentManager.isShipUnlocked(selectedShip, paragonState.prestigeRank)
      ? selectedShip
      : 'ship_01';
    onStartGame(
      validShip,
      roomCode.trim() || 'PUBLIC-FLEET',
      callsign.trim() || 'Vanguard',
      selectedSector
    );
  };

  const handleLaunchQuickRift = () => {
    sound.playUiClick();
    const mutator = paragonManager.getActiveMutator();
    const pState = paragonManager.getState();
    const validShip = equipmentManager.isShipUnlocked(selectedShip, pState.prestigeRank)
      ? selectedShip
      : 'ship_01';
    onStartGame(
      validShip,
      roomCode.trim() || 'PUBLIC-FLEET',
      callsign.trim() || 'Vanguard',
      1,
      { depth: pState.currentEndlessDepth, mutator }
    );
  };

  const handleLaunchDungeon = (dungeon: VoidDungeon) => {
    sound.playUiClick();
    const validShip = equipmentManager.isShipUnlocked(selectedShip, paragonState.prestigeRank)
      ? selectedShip
      : 'ship_01';
    onStartGame(
      validShip,
      roomCode.trim() || 'PUBLIC-FLEET',
      callsign.trim() || 'Vanguard',
      dungeon.sectorOverride || dungeon.sector
    );
  };

  const generationShips = SHIP_CLASSES_LIST.filter(
    (s) => s.generation === selectedGeneration
  );
  const unlockedShipsCount = SHIP_CLASSES_LIST.filter((s) =>
    equipmentManager.isShipUnlocked(s.id, paragonState.prestigeRank)
  ).length;

  const req = previewShipConfig.unlockRequirement;
  const meetsPrestige = paragonState.prestigeRank >= req.prestigeRequired;
  const canAffordShip =
    meetsPrestige &&
    scrap >= req.costScrap &&
    darkMatter >= req.costDarkMatter &&
    paragonState.quantumShards >= req.costQuantumShards;

  return (
    <div className="absolute inset-0 z-30 bg-[#040711] flex flex-col overflow-hidden select-none">
      {/* Real AI Cosmic Nebula Backdrop */}
      <img
        src={GAME_ASSETS.environment.nebula}
        alt=""
        referrerPolicy="no-referrer"
        className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-30"
      />

      {/* =========================================================
          TOP COMMAND HEADER BAR
      ========================================================= */}
      <header className="relative z-20 shrink-0 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-4 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <UI3DIcon src={UI_ASSETS.icons.hangar} size={28} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs sm:text-sm font-black tracking-wider text-white uppercase truncate">
                AETHER STRIKE
              </h1>
              <span className="text-[10px] font-mono font-bold text-amber-300 shrink-0">
                · P.{paragonState.prestigeRank}
              </span>
            </div>
            <p className="text-[10px] font-mono text-cyan-300 truncate">
              {callsign} · Paragon Lv.{paragonState.paragonLevel}
            </p>
          </div>
        </div>

        {/* Currencies (SCRAP, DM, QS) & Sound Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2.5 bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono">
            <div className="flex items-center gap-1" title="Scrap">
              <UI3DIcon src={UI_ASSETS.icons.scrap} size={14} />
              <span className="font-bold text-amber-300 tabular-nums">
                {formatCompactNumber(scrap)}
              </span>
            </div>
            <span className="text-slate-700">·</span>
            <div className="flex items-center gap-1" title="Dark Matter">
              <UI3DIcon src={UI_ASSETS.icons.darkMatter} size={14} />
              <span className="font-bold text-purple-300 tabular-nums">
                {formatCompactNumber(darkMatter)}
              </span>
            </div>
            <span className="text-slate-700">·</span>
            <div className="flex items-center gap-1" title="Quantum Shards">
              <UI3DIcon src={UI_ASSETS.icons.quantumShard} size={14} />
              <span className="font-bold text-cyan-300 tabular-nums">
                {formatCompactNumber(paragonState.quantumShards)}
              </span>
            </div>
          </div>

          <button
            onClick={toggleSound}
            className={`w-9 h-9 active:scale-95 flex items-center justify-center cursor-pointer ${
              soundEnabled ? 'ai-thumb-cyan' : 'ai-thumb-slate opacity-75'
            }`}
            aria-label="Audio umschalten"
          >
            <UI3DIcon
              src={soundEnabled ? UI_ASSETS.icons.audioOn : UI_ASSETS.icons.audioOff}
              size={18}
            />
          </button>
        </div>
      </header>

      {/* =========================================================
          SCROLLABLE MIDDLE VIEWPORT
      ========================================================= */}
      <main className="relative z-10 flex-1 overflow-y-auto px-3 sm:px-5 py-4">
        <div className="w-full max-w-4xl mx-auto space-y-4">
          {/* TAB 1: 50-SHIP HANGAR & LAUNCH */}
          {activeTab === 'hangar' && (
            <div className="space-y-4 pb-3">
              {/* Live Interactive 60FPS Ship Drydock Card */}
              <SciFiFrame
                variant={isPreviewUnlocked ? 'cyan' : 'amber'}
                className="p-4 sm:p-5 space-y-3.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider">
                      <span className="text-cyan-300 font-bold">
                        SCHIFF #{previewShipConfig.tier}/50
                      </span>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-300 truncate">
                        {previewShipConfig.generationName}
                      </span>
                    </div>
                    <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wide truncate mt-0.5">
                      {previewShipConfig.name}
                    </h2>
                  </div>

                  <SciFiButton
                    variant="cyan"
                    size="sm"
                    onTouchStart={() => setTestFireActive(true)}
                    onTouchEnd={() => setTestFireActive(false)}
                    onMouseDown={() => setTestFireActive(true)}
                    onMouseUp={() => setTestFireActive(false)}
                    onClick={() => sound.playLaser('plasma')}
                    className="shrink-0"
                  >
                    <UI3DIcon src={UI_ASSETS.icons.missile} size={15} />
                    <span>Salve Testen</span>
                  </SciFiButton>
                </div>

                {/* 3D Orbital Drydock Bay Viewport */}
                <div className="relative w-full h-44 sm:h-48 ai-drydock-bay overflow-hidden flex items-center justify-center">
                  <canvas
                    ref={hangarCanvasRef}
                    width={360}
                    height={180}
                    className="w-full h-full object-contain"
                  />

                  {/* Top Status Bar inside Drydock */}
                  <div className="absolute top-2.5 left-3 right-3 flex items-center justify-between gap-2 text-[10px] font-mono">
                    {isPreviewUnlocked ? (
                      <span className="px-2.5 py-1 rounded-md bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 font-bold flex items-center gap-1.5">
                        <UI3DIcon src={UI_ASSETS.icons.shield} size={13} />
                        {selectedShip === previewShipConfig.id
                          ? 'AKTIVES KAMPFSCHIFF'
                          : 'FREIGESCHALTET'}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-md bg-amber-950/90 border border-amber-500/40 text-amber-200 font-bold flex items-center gap-1.5">
                        <UI3DIcon src={UI_ASSETS.icons.lock} size={13} />
                        PRESTIGE {req.prestigeRequired} BENÖTIGT
                      </span>
                    )}

                    <span className="px-2.5 py-1 rounded-md bg-slate-950/85 border border-slate-700/80 text-cyan-200 font-semibold truncate">
                      {previewShipConfig.specialName}
                    </span>
                  </div>

                  {/* Bottom Multi-Slot Capacity Strip */}
                  <div className="absolute bottom-2 left-3 right-3 bg-slate-950/85 border border-slate-800/90 rounded-lg px-3 py-1.5 flex items-center justify-between flex-wrap gap-2 text-[11px] font-mono">
                    <span className="text-cyan-300 font-semibold">
                      Laser: <strong className="text-white">{previewShipConfig.slots.lasers}</strong>
                    </span>
                    <span className="text-sky-300 font-semibold">
                      Schilde: <strong className="text-white">{previewShipConfig.slots.generators}</strong>
                    </span>
                    <span className="text-purple-300 font-semibold">
                      Drohnen: <strong className="text-white">{previewShipConfig.slots.drones}</strong>
                    </span>
                    <span className="text-amber-300 font-semibold">
                      Raketen: <strong className="text-white">{previewShipConfig.slots.missiles}</strong>
                    </span>
                  </div>
                </div>

                {/* Airy Ship Telemetry Modules (2x2 on mobile, 4 cols on sm+) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                  <div className="ai-panel-slate px-3.5 py-2.5">
                    <span className="text-slate-400 block text-[10px]">HÜLLEN-STRUKTUR</span>
                    <span className="text-emerald-300 font-bold text-sm tabular-nums">
                      {formatCompactNumber(previewShipConfig.hullMax)}
                    </span>
                  </div>
                  <div className="ai-panel-slate px-3.5 py-2.5">
                    <span className="text-slate-400 block text-[10px]">SCHILD-KAPAZITÄT</span>
                    <span className="text-cyan-300 font-bold text-sm tabular-nums">
                      {formatCompactNumber(previewShipConfig.shieldMax)}
                    </span>
                  </div>
                  <div className="ai-panel-slate px-3.5 py-2.5">
                    <span className="text-slate-400 block text-[10px]">BASIS-FEUERKRAFT</span>
                    <span className="text-rose-300 font-bold text-sm tabular-nums">
                      {formatCompactNumber(previewShipConfig.baseDps)} DPS
                    </span>
                  </div>
                  <div className="ai-panel-slate px-3.5 py-2.5">
                    <span className="text-slate-400 block text-[10px]">SCHUB-TEMPO</span>
                    <span className="text-amber-300 font-bold text-sm tabular-nums">
                      {previewShipConfig.speed}
                    </span>
                  </div>
                </div>

                {/* Unlock Action Bar if Previewed Ship is Locked */}
                {!isPreviewUnlocked && (
                  <div className="pt-1 flex flex-col gap-2.5">
                    <div className="ai-panel-slate px-3.5 py-2.5 flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
                      <span
                        className={
                          meetsPrestige ? 'text-emerald-300 font-bold' : 'text-rose-300 font-bold'
                        }
                      >
                        Voraussetzung: Prestige {req.prestigeRequired} (Aktuell: P.{paragonState.prestigeRank})
                      </span>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={scrap >= req.costScrap ? 'text-amber-300 font-bold' : 'text-slate-400'}>
                          {formatCompactNumber(req.costScrap)} Scrap
                        </span>
                        <span className={darkMatter >= req.costDarkMatter ? 'text-purple-300 font-bold' : 'text-slate-400'}>
                          {formatCompactNumber(req.costDarkMatter)} DM
                        </span>
                        {req.costQuantumShards > 0 && (
                          <span
                            className={
                              paragonState.quantumShards >= req.costQuantumShards
                                ? 'text-cyan-300 font-bold'
                                : 'text-slate-400'
                            }
                          >
                            {formatCompactNumber(req.costQuantumShards)} QS
                          </span>
                        )}
                      </div>
                    </div>

                    <SciFiButton
                      variant={canAffordShip ? 'amber' : 'slate'}
                      size="md"
                      active={canAffordShip}
                      disabled={!canAffordShip}
                      onClick={handleUnlockShip}
                      className="w-full"
                    >
                      <UI3DIcon src={UI_ASSETS.icons.lock} size={16} />
                      <span>
                        {!meetsPrestige
                          ? `Prestige-Rang ${req.prestigeRequired} benötigt`
                          : `Schiff #${previewShipConfig.tier} freischalten & aktivieren`}
                      </span>
                    </SciFiButton>
                  </div>
                )}
              </SciFiFrame>

              {/* 50-Ship Generation Selector & Hangar Fleet List */}
              <SciFiFrame variant="cyan" className="p-4 sm:p-5 space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-cyan-300 font-bold flex items-center gap-2">
                    <UI3DIcon src={UI_ASSETS.icons.hangar} size={18} />
                    FLOTTEN-ARSENAL (50 SCHIFFE)
                  </span>
                  <span className="text-xs font-mono text-slate-300">
                    Freigeschaltet: <strong className="text-cyan-300">{unlockedShipsCount}/50</strong>
                  </span>
                </div>

                {/* 10 Generation Filter Buttons (Gen 1 .. Gen 10) */}
                <div className="grid grid-cols-5 gap-1.5">
                  {Array.from({ length: 10 }).map((_, gIdx) => {
                    const genNum = gIdx + 1;
                    const isGenActive = selectedGeneration === genNum;
                    const startTier = gIdx * 5 + 1;
                    const endTier = startTier + 4;
                    return (
                      <button
                        key={genNum}
                        onClick={() => {
                          sound.playUiClick();
                          setSelectedGeneration(genNum);
                        }}
                        className={`py-2 px-2 text-[11px] font-mono font-bold transition-all cursor-pointer active:scale-95 flex flex-col items-center justify-center ${
                          isGenActive
                            ? 'ai-btn-active-cyan text-white'
                            : 'ai-btn-slate text-slate-300 hover:text-white'
                        }`}
                      >
                        <span>GEN {genNum}</span>
                        <span className="text-[9px] text-slate-400 font-normal">
                          #{startTier}–{endTier}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* 5 Ships of the Selected Generation */}
                <div className="space-y-2">
                  {generationShips.map((ship) => {
                    const unlocked = equipmentManager.isShipUnlocked(
                      ship.id,
                      paragonState.prestigeRank
                    );
                    const isActiveShip = selectedShip === ship.id;
                    const isPreviewed = previewShipConfig.id === ship.id;

                    return (
                      <button
                        key={ship.id}
                        onClick={() => {
                          sound.playUiClick();
                          setPreviewShipId(ship.id);
                          if (unlocked) {
                            onSelectShip(ship.id);
                          }
                        }}
                        className={`w-full p-3.5 text-left transition-all flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] ${
                          isActiveShip
                            ? 'ai-panel-cyan'
                            : isPreviewed
                            ? 'ai-panel-amber'
                            : unlocked
                            ? 'ai-panel-slate'
                            : 'ai-panel-slate opacity-80'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <ItemArtwork id={ship.id} category="ship" size={48} className="shrink-0" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-amber-300 shrink-0">
                                #{ship.tier}
                              </span>
                              <span className="text-sm font-bold text-white truncate">
                                {ship.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-300 mt-1 flex-wrap">
                              <span className="text-cyan-300">Laser: {ship.slots.lasers}</span>
                              <span className="text-slate-600">·</span>
                              <span className="text-sky-300">Schild: {ship.slots.generators}</span>
                              <span className="text-slate-600">·</span>
                              <span className="text-purple-300">Drohnen: {ship.slots.drones}</span>
                              <span className="text-slate-600">·</span>
                              <span className="text-rose-300">{formatCompactNumber(ship.baseDps)} DPS</span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 text-right font-mono">
                          {unlocked ? (
                            <span
                              className={`text-xs font-bold px-3 py-1.5 inline-block ${
                                isActiveShip
                                  ? 'ai-btn-active-cyan text-white'
                                  : 'ai-btn-emerald text-emerald-200'
                              }`}
                            >
                              {isActiveShip ? 'AKTIV' : 'WÄHLEN'}
                            </span>
                          ) : (
                            <div className="flex flex-col items-end gap-0.5">
                              <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                                <UI3DIcon src={UI_ASSETS.icons.lock} size={13} />
                                P.{ship.unlockRequirement.prestigeRequired}
                              </span>
                              <span className="text-[11px] text-slate-400 tabular-nums">
                                {formatCompactNumber(ship.unlockRequirement.costScrap)} SCR
                              </span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </SciFiFrame>

              {/* Stargate Sector Warp Selector with Readability Scrim */}
              <SciFiFrame variant="cyan" className="p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-cyan-300 font-bold flex items-center gap-2">
                    <UI3DIcon src={UI_ASSETS.icons.rifts} size={18} />
                    STARGATE SEKTOR WÄHLEN
                  </span>
                  <span className="text-xs font-mono text-slate-300">
                    Freigeschaltet: {unlockedList.length}/{STARGATE_SECTORS.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {STARGATE_SECTORS.map((sec) => {
                    const isUnlocked = equipmentManager.unlockedSectors.has(sec.sectorNumber);
                    const isChosen = selectedSector === sec.sectorNumber;
                    const bannerUrl = getStargateSectorBannerUrl(sec.sectorNumber);
                    return (
                      <button
                        key={sec.sectorNumber}
                        disabled={!isUnlocked}
                        onClick={() => {
                          if (isUnlocked) {
                            sound.playUiClick();
                            setSelectedSector(sec.sectorNumber);
                          }
                        }}
                        style={{
                          backgroundImage: `url('${bannerUrl}')`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                        className={`relative p-3 rounded-xl text-left transition-all cursor-pointer overflow-hidden border ${
                          !isUnlocked
                            ? 'opacity-45 cursor-not-allowed grayscale border-slate-800'
                            : isChosen
                            ? 'border-cyan-400 ring-2 ring-cyan-400/40 shadow-lg'
                            : 'border-slate-700/80 hover:border-cyan-400/50 active:scale-[0.98]'
                        }`}
                      >
                        {/* Dark readability scrim so text never clashes with background art */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/75 to-slate-950/50 pointer-events-none" />

                        <div className="relative z-10 flex items-center justify-between text-[11px] font-mono font-bold">
                          <span className={isChosen ? 'text-cyan-300' : 'text-slate-300'}>
                            SEKTOR {sec.sectorNumber}
                          </span>
                          {!isUnlocked && <UI3DIcon src={UI_ASSETS.icons.lock} size={13} />}
                        </div>
                        <div className="relative z-10 text-xs font-bold text-white truncate mt-1">
                          {sec.name.replace(/^Sector 0\d:\s*/, '')}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </SciFiFrame>

              {/* Primary Launch Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <SciFiButton
                  variant="cyan"
                  size="lg"
                  active
                  onClick={handleLaunchSector}
                  className="w-full"
                >
                  <UI3DIcon src={UI_ASSETS.icons.hangar} size={20} />
                  <span>
                    Sektor {selectedSector} starten ({activeShipConfig.name})
                  </span>
                </SciFiButton>

                <SciFiButton
                  variant="purple"
                  size="lg"
                  active
                  onClick={handleLaunchQuickRift}
                  className="w-full"
                >
                  <UI3DIcon src={UI_ASSETS.icons.rifts} size={20} />
                  <span>
                    Void Rift (Stufe {paragonState.currentEndlessDepth}) starten
                  </span>
                </SciFiButton>
              </div>

              {/* Command Deck Quick-Access: Live 1v1 PvP Arena, Pilot Tree, Expeditions & Boss Codex */}
              {onOpenCommandDeck && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <button
                    onClick={() => onOpenCommandDeck('arena')}
                    className="ai-btn-active-rose p-2.5 rounded-xl text-left font-mono transition-all active:scale-95 cursor-pointer"
                  >
                    <div className="text-[11px] font-black text-white">⚔️ PVP-ARENA</div>
                    <div className="text-[10px] text-rose-200 mt-0.5">
                      {metaProgression.arenaTickets}/5 Tickets · {metaProgression.getCurrentLeague().name}
                    </div>
                  </button>

                  <button
                    onClick={() => onOpenCommandDeck('pilots')}
                    className="ai-btn-purple p-2.5 rounded-xl text-left font-mono transition-all active:scale-95 cursor-pointer"
                  >
                    <div className="text-[11px] font-black text-purple-100">👨‍✈️ PILOTENBAUM</div>
                    <div className="text-[10px] text-purple-300 mt-0.5 truncate">
                      {metaProgression.getActiveCommander().name}
                    </div>
                  </button>

                  <button
                    onClick={() => onOpenCommandDeck('expeditions')}
                    className="ai-btn-cyan p-2.5 rounded-xl text-left font-mono transition-all active:scale-95 cursor-pointer"
                  >
                    <div className="text-[11px] font-black text-cyan-100">🛰️ EXPEDITIONEN</div>
                    <div className="text-[10px] text-cyan-300 mt-0.5">
                      Flotten-Missionen
                    </div>
                  </button>

                  <button
                    onClick={() => onOpenCommandDeck('codex')}
                    className="ai-btn-amber p-2.5 rounded-xl text-left font-mono transition-all active:scale-95 cursor-pointer"
                  >
                    <div className="text-[11px] font-black text-amber-100">📖 BOSS-KODEX</div>
                    <div className="text-[10px] text-amber-300 mt-0.5">
                      Kopfgelder & Boni
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MULTI-SLOT ARMORY */}
          {activeTab === 'armory' && (
            <div className="pb-3">
              <ArmoryFittingModal
                isEmbedded
                selectedShipId={selectedShip}
                scrap={scrap}
                darkMatter={darkMatter}
                onCurrencyChange={onCurrencyChange}
                onParagonChange={() => setParagonState(paragonManager.getState())}
              />
            </div>
          )}

          {/* TAB 3: PARAGON & VOID RIFTS */}
          {activeTab === 'rifts' && (
            <div className="space-y-4 pb-3">
              <div className="grid grid-cols-2 gap-2.5 ai-panel-slate p-2">
                <SciFiButton
                  variant="purple"
                  size="md"
                  active={riftSubTab === 'paragon'}
                  onClick={() => setRiftSubTab('paragon')}
                >
                  <UI3DIcon src={UI_ASSETS.icons.quantumShard} size={16} />
                  <span>Paragon & Void Rifts</span>
                </SciFiButton>
                <SciFiButton
                  variant="rose"
                  size="md"
                  active={riftSubTab === 'dungeons'}
                  onClick={() => setRiftSubTab('dungeons')}
                >
                  <UI3DIcon src={UI_ASSETS.icons.bossSkull} size={16} />
                  <span>Boss Raids</span>
                </SciFiButton>
              </div>

              {riftSubTab === 'paragon' ? (
                <ParagonMatrixModal
                  isEmbedded
                  highestSectorReached={highestUnlocked}
                  currentScrap={scrap}
                  isEndlessRiftActive={false}
                  onTriggerPrestige={() => {
                    if (onTriggerPrestige) onTriggerPrestige();
                    setParagonState(paragonManager.getState());
                  }}
                  onLaunchEndlessRift={(depth, mutator) => {
                    onStartGame(
                      selectedShip,
                      roomCode.trim() || 'PUBLIC-FLEET',
                      callsign.trim() || 'Vanguard',
                      1,
                      { depth, mutator }
                    );
                  }}
                  onStatsUpdated={() => {
                    setParagonState(paragonManager.getState());
                  }}
                />
              ) : (
                <VoidDungeonsModal isEmbedded onLaunchDungeon={handleLaunchDungeon} />
              )}
            </div>
          )}

          {/* TAB 4: COSMETIC DESIGN SHOP */}
          {activeTab === 'shop' && (
            <div className="pb-3">
              <CosmeticShop
                currentShipId={selectedShip}
                scrap={scrap}
                darkMatter={darkMatter}
                onCurrencyChange={onCurrencyChange}
                onEquippedChange={() => setEquippedTick((t) => t + 1)}
              />
            </div>
          )}

          {/* TAB 5: COMMAND HQ */}
          {activeTab === 'hq' && (
            <div className="space-y-4 pb-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 ai-panel-slate p-2">
                <SciFiButton
                  variant="amber"
                  size="sm"
                  active={hqSubTab === 'missions'}
                  onClick={() => setHqSubTab('missions')}
                  className="relative"
                >
                  <UI3DIcon src={UI_ASSETS.icons.scrap} size={16} />
                  <span>Missionen</span>
                  {claimableMissionsCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold">
                      {claimableMissionsCount}
                    </span>
                  )}
                </SciFiButton>

                <SciFiButton
                  variant="purple"
                  size="sm"
                  active={hqSubTab === 'guild'}
                  onClick={() => setHqSubTab('guild')}
                >
                  <UI3DIcon src={UI_ASSETS.icons.shield} size={16} />
                  <span>Gilde</span>
                </SciFiButton>

                <SciFiButton
                  variant="cyan"
                  size="sm"
                  active={hqSubTab === 'rankings'}
                  onClick={() => setHqSubTab('rankings')}
                >
                  <UI3DIcon src={UI_ASSETS.icons.hq} size={16} />
                  <span>Rangliste</span>
                </SciFiButton>

                <SciFiButton
                  variant="emerald"
                  size="sm"
                  active={hqSubTab === 'squad'}
                  onClick={() => setHqSubTab('squad')}
                >
                  <UI3DIcon src={UI_ASSETS.icons.autopilot} size={16} />
                  <span>Squad</span>
                </SciFiButton>
              </div>

              {hqSubTab === 'missions' && (
                <DailyMissions
                  scrap={scrap}
                  darkMatter={darkMatter}
                  onCurrencyChange={onCurrencyChange}
                />
              )}

              {hqSubTab === 'guild' && (
                <GuildPanel
                  currentGuild={currentGuild}
                  scrap={scrap}
                  darkMatter={darkMatter}
                  onCurrencyChange={onCurrencyChange}
                />
              )}

              {hqSubTab === 'rankings' && <GlobalLeaderboard currentCallsign={callsign} />}

              {hqSubTab === 'squad' && (
                <SciFiFrame variant="cyan" className="p-5 space-y-4">
                  <div>
                    <h3 className="text-base font-bold uppercase tracking-wider text-white">
                      Piloten-Kennung & Koop-Frequenz
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Fliege mit anderen Piloten im gleichen Sektor-Kanal in Echtzeit.
                    </p>
                  </div>

                  <div className="space-y-3.5 max-w-md">
                    <div>
                      <label className="block text-xs font-mono text-cyan-300 mb-1.5">
                        Dein Piloten-Callsign
                      </label>
                      <input
                        type="text"
                        value={callsign}
                        maxLength={16}
                        onChange={(e) => onChangeCallsign(e.target.value)}
                        className="w-full px-4 py-2.5 ai-panel-slate text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                        placeholder="Vanguard"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-cyan-300 mb-1.5">
                        Flotten-Raumcode (Multiplayer)
                      </label>
                      <input
                        type="text"
                        value={roomCode}
                        maxLength={18}
                        onChange={(e) => onChangeRoomCode(e.target.value.toUpperCase())}
                        className="w-full px-4 py-2.5 ai-panel-slate text-cyan-200 font-mono text-sm uppercase focus:outline-none focus:border-cyan-400"
                        placeholder="PUBLIC-FLEET"
                      />
                    </div>
                  </div>
                </SciFiFrame>
              )}
            </div>
          )}
        </div>
      </main>

      {/* =========================================================
          FIXED 5-TAB BOTTOM NAVIGATION DOCK
      ========================================================= */}
      <nav className="relative z-20 shrink-0 h-16 ai-hud-nav px-2 py-1.5">
        <div className="w-full max-w-4xl mx-auto h-full grid grid-cols-5 gap-1.5">
          <button
            onClick={() => {
              sound.playUiClick();
              setActiveTab('hangar');
            }}
            className={`flex flex-col items-center justify-center gap-0.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'hangar'
                ? 'ai-btn-active-cyan text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UI3DIcon src={UI_ASSETS.icons.hangar} size={20} />
            <span className="text-[10px] font-mono font-bold uppercase whitespace-nowrap">
              Hangar
            </span>
          </button>

          <button
            onClick={() => {
              sound.playUiClick();
              setActiveTab('armory');
            }}
            className={`flex flex-col items-center justify-center gap-0.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'armory'
                ? 'ai-btn-active-cyan text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UI3DIcon src={UI_ASSETS.icons.armory} size={20} />
            <span className="text-[10px] font-mono font-bold uppercase whitespace-nowrap">
              Armory
            </span>
          </button>

          <button
            onClick={() => {
              sound.playUiClick();
              setActiveTab('rifts');
            }}
            className={`flex flex-col items-center justify-center gap-0.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'rifts'
                ? 'ai-btn-active-purple text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UI3DIcon src={UI_ASSETS.icons.rifts} size={20} />
            <span className="text-[10px] font-mono font-bold uppercase whitespace-nowrap">
              Rifts
            </span>
          </button>

          <button
            onClick={() => {
              sound.playUiClick();
              setActiveTab('shop');
            }}
            className={`flex flex-col items-center justify-center gap-0.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'shop'
                ? 'ai-btn-active-emerald text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UI3DIcon src={UI_ASSETS.icons.shop} size={20} />
            <span className="text-[10px] font-mono font-bold uppercase whitespace-nowrap">
              Shop
            </span>
          </button>

          <button
            onClick={() => {
              sound.playUiClick();
              setActiveTab('hq');
            }}
            className={`relative flex flex-col items-center justify-center gap-0.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'hq'
                ? 'ai-btn-active-amber text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UI3DIcon src={UI_ASSETS.icons.hq} size={20} />
            <span className="text-[10px] font-mono font-bold uppercase whitespace-nowrap">
              HQ
            </span>
            {claimableMissionsCount > 0 && (
              <span className="absolute top-1 right-2.5 px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-mono text-[9px] font-bold">
                {claimableMissionsCount}
              </span>
            )}
          </button>
        </div>
      </nav>
    </div>
  );
};
