import React, { useState, useEffect } from 'react';
import {
  metaProgression,
  COMMANDER_PILOTS,
  HONOR_SHOP_ITEMS,
  BOSS_CODEX_ENTRIES,
  PVP_LEAGUES,
  PvpOpponent,
} from '../game/metaProgression.ts';
import { equipmentManager } from '../game/equipment.ts';
import { SHIP_CLASSES_LIST } from '../game/shipClasses.ts';
import { sound } from '../game/audio.ts';
import { UI_ASSETS } from '../game/assets.ts';
import { formatCompactNumber, formatDurationCompact } from '../game/formatters.ts';
import { SciFiFrame, SciFiButton, SciFiProgressBar, UI3DIcon } from './SciFiFrame.tsx';
import { ItemArtwork } from './ItemArtwork.tsx';

export type CommandDeckTab = 'arena' | 'shop' | 'honor_shop' | 'pilots' | 'expeditions' | 'codex';

interface CommandDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: CommandDeckTab;
  scrap: number;
  darkMatter: number;
  playerPower?: number;
  playerPowerScore?: number;
  playerSector: number;
  callsign?: string;
  onCurrencyChange: (newScrap: number, newDarkMatter: number) => void;
  onStartPvpMatch: (opponent: PvpOpponent) => void;
  onMetaUpdated?: () => void;
}

export const CommandDeckModal: React.FC<CommandDeckModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'arena',
  scrap,
  darkMatter,
  playerPower,
  playerPowerScore,
  playerSector,
  callsign = 'Kommandant',
  onCurrencyChange,
  onStartPvpMatch,
  onMetaUpdated,
}) => {
  const normalizedInitTab: CommandDeckTab =
    initialTab === 'honor_shop' ? 'shop' : initialTab;
  const [activeTab, setActiveTab] = useState<CommandDeckTab>(normalizedInitTab);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    setActiveTab(initialTab === 'honor_shop' ? 'shop' : initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!isOpen) return;
    metaProgression.checkDailyTicketRefresh();
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const effectivePower = playerPower ?? playerPowerScore ?? 1200;
  const currentLeague = metaProgression.getCurrentLeague();
  const nextLeague = metaProgression.getNextLeague();
  const opponents = metaProgression.generateOpponents(effectivePower, playerSector);
  const leaderboard = metaProgression.getArenaLeaderboard(callsign, effectivePower);
  const mults = metaProgression.getComputedMultipliers();

  const notifyUpdate = (msg?: string) => {
    if (msg) setFeedback(msg);
    setTick((t) => t + 1);
    if (onMetaUpdated) onMetaUpdated();
  };

  const handleClaimDailyLeague = () => {
    const medals = metaProgression.claimDailyLeagueReward();
    if (medals > 0) {
      sound.playUpgrade();
      notifyUpdate(`Tägliche ${currentLeague.name}-Belohnung: +${medals} Ehren-Medaillen erhalten!`);
    }
  };

  const handleBuyTickets = () => {
    if (darkMatter < 25) return;
    metaProgression.arenaTickets += 3;
    metaProgression.saveState();
    onCurrencyChange(scrap, darkMatter - 25);
    sound.playUpgrade();
    notifyUpdate('+3 Arena-Tickets für 25 Dark Matter freigeschaltet!');
  };

  const handleLaunchMatch = (opp: PvpOpponent) => {
    if (metaProgression.arenaTickets <= 0) {
      setFeedback('Keine Arena-Tickets mehr übrig! Lade +3 Tickets für 25 DM auf.');
      return;
    }
    metaProgression.arenaTickets = Math.max(0, metaProgression.arenaTickets - 1);
    metaProgression.saveState();
    sound.playBossAlert();
    if (onMetaUpdated) onMetaUpdated();
    onStartPvpMatch(opp);
    onClose();
  };

  const handleBuyHonorItem = (itemId: string) => {
    if (metaProgression.purchaseHonorShopItem(itemId)) {
      sound.playUpgrade();
      const item = HONOR_SHOP_ITEMS.find((i) => i.id === itemId);
      notifyUpdate(`${item?.name} auf Rang ${metaProgression.honorShopLevels[itemId]} verbessert!`);
    }
  };

  const handleUnlockOrUpgradePilot = (pilotId: string) => {
    const cost = metaProgression.getCommanderUpgradeCost(pilotId);
    if (darkMatter < cost) return;
    const curLvl = metaProgression.getCommanderLevel(pilotId);
    metaProgression.commanderLevels[pilotId] = curLvl + 1;
    metaProgression.activeCommanderId = pilotId;
    metaProgression.saveState();
    onCurrencyChange(scrap, darkMatter - cost);
    sound.playUpgrade();
    const pilot = COMMANDER_PILOTS.find((p) => p.id === pilotId);
    notifyUpdate(
      curLvl === 0
        ? `${pilot?.name} rekrutiert und als aktiver Flaggschiff-Pilot eingesetzt!`
        : `${pilot?.name} auf Stufe ${curLvl + 1} befördert!`
    );
  };

  const handleSelectPilot = (pilotId: string) => {
    if (metaProgression.getCommanderLevel(pilotId) <= 0) return;
    metaProgression.activeCommanderId = pilotId;
    metaProgression.saveState();
    sound.playUiClick();
    notifyUpdate();
  };

  const handleStartOrClaimExpedition = (slotIdx: number) => {
    const slot = metaProgression.expeditions[slotIdx];
    if (!slot) return;

    const now = Date.now();
    const isCompleted =
      slot.startedAt !== null && now - slot.startedAt >= slot.durationSeconds * 1000;

    if (isCompleted) {
      const sectorScale = Math.max(1, Math.pow(1.22, playerSector - 1));
      const scrapGain = Math.round(slot.baseScrapReward * sectorScale * mults.lootYieldMult);
      const dmGain = Math.round(slot.baseDmReward * Math.sqrt(sectorScale));
      const medalGain = slot.baseMedalsReward;

      metaProgression.honorMedals += medalGain;
      // Immediately relaunch the expedition automatically so idle income never stops!
      slot.startedAt = Date.now();
      metaProgression.saveState();
      onCurrencyChange(scrap + scrapGain, darkMatter + dmGain);
      sound.playUpgrade();
      notifyUpdate(
        `Expedition abgeschlossen: +${formatCompactNumber(scrapGain)} SCR, +${dmGain} DM & +${medalGain} Ehren-Medaillen! (Neu gestartet)`
      );
      return;
    }

    if (slot.startedAt === null) {
      const unlockedShips = SHIP_CLASSES_LIST.filter((s) =>
        equipmentManager.unlockedShips.has(s.id)
      );
      const chosenShip = unlockedShips[slotIdx % unlockedShips.length] || SHIP_CLASSES_LIST[0];
      slot.assignedShipId = chosenShip.id;
      slot.startedAt = Date.now();
      metaProgression.saveState();
      sound.playUiClick();
      notifyUpdate(`${chosenShip.name} auf Expedition "${slot.title}" entsandt!`);
    }
  };

  const handleClaimBossBounty = (entryId: string) => {
    const entry = BOSS_CODEX_ENTRIES.find((b) => b.id === entryId);
    if (!entry) return;
    const kills = metaProgression.bossKillCounts[entryId] || 0;
    if (kills <= 0 || metaProgression.claimedBossBounties[entryId]) return;

    metaProgression.claimedBossBounties[entryId] = true;
    metaProgression.honorMedals += entry.rewardMedals;
    metaProgression.saveState();
    onCurrencyChange(scrap, darkMatter + entry.rewardDm);
    sound.playUpgrade();
    notifyUpdate(
      `Kopfgeld für ${entry.name} eingelöst: +${entry.rewardDm} DM, +${entry.rewardMedals} Medaillen & dauerhaft +${entry.bossDmgBonusPct}% Boss-Schaden!`
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/88 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 select-none">
      <SciFiFrame
        variant="cyan"
        className="w-full max-w-2xl max-h-[92dvh] flex flex-col overflow-hidden p-4 sm:p-5 bg-[#050914]"
      >
        {/* Top Header */}
        <div className="pb-3 border-b border-slate-800 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border"
                style={{
                  color: currentLeague.badgeColor,
                  borderColor: `${currentLeague.badgeColor}66`,
                  backgroundColor: `${currentLeague.badgeColor}18`,
                }}
              >
                {currentLeague.name} · {metaProgression.trophies} 🏆
              </span>
              <span className="text-[11px] font-mono text-amber-300 font-bold">
                🎖️ {formatCompactNumber(metaProgression.honorMedals)} Medaillen
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-black tracking-wider text-white uppercase mt-1">
              KOMMANDO-ZENTRALE & PVP-ARENA
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono">
              <span className="text-amber-300 font-bold">{formatCompactNumber(scrap)} SCR</span>
              <span className="text-slate-600">·</span>
              <span className="text-purple-300 font-bold">{formatCompactNumber(darkMatter)} DM</span>
            </div>
            <SciFiButton variant="rose" size="sm" onClick={onClose}>
              <span>SCHLIESSEN</span>
            </SciFiButton>
          </div>
        </div>

        {/* 5-Tab Navigation Bar */}
        <div className="grid grid-cols-5 gap-1.5 py-2.5 border-b border-slate-800/80">
          <button
            onClick={() => {
              sound.playUiClick();
              setActiveTab('arena');
            }}
            className={`py-2 px-1.5 rounded-lg text-[10px] sm:text-xs font-mono font-bold uppercase cursor-pointer flex flex-col items-center gap-0.5 ${
              activeTab === 'arena'
                ? 'ai-btn-active-rose text-white'
                : 'ai-panel-slate text-slate-300'
            }`}
          >
            <span>⚔️ PvP-Arena</span>
            <span className="text-[9px] text-rose-200">{metaProgression.arenaTickets}/5 Tickets</span>
          </button>

          <button
            onClick={() => {
              sound.playUiClick();
              setActiveTab('shop');
            }}
            className={`py-2 px-1.5 rounded-lg text-[10px] sm:text-xs font-mono font-bold uppercase cursor-pointer flex flex-col items-center gap-0.5 ${
              activeTab === 'shop'
                ? 'ai-btn-active-amber text-white'
                : 'ai-panel-slate text-slate-300'
            }`}
          >
            <span>🏅 Ehren-Shop</span>
            <span className="text-[9px] text-amber-200">
              {formatCompactNumber(metaProgression.honorMedals)} 🎖️
            </span>
          </button>

          <button
            onClick={() => {
              sound.playUiClick();
              setActiveTab('pilots');
            }}
            className={`py-2 px-1.5 rounded-lg text-[10px] sm:text-xs font-mono font-bold uppercase cursor-pointer flex flex-col items-center gap-0.5 ${
              activeTab === 'pilots'
                ? 'ai-btn-active-cyan text-white'
                : 'ai-panel-slate text-slate-300'
            }`}
          >
            <span>👨‍✈️ Piloten</span>
            <span className="text-[9px] text-cyan-200">Lv.{mults.activeCommanderLevel}</span>
          </button>

          <button
            onClick={() => {
              sound.playUiClick();
              setActiveTab('expeditions');
            }}
            className={`py-2 px-1.5 rounded-lg text-[10px] sm:text-xs font-mono font-bold uppercase cursor-pointer flex flex-col items-center gap-0.5 ${
              activeTab === 'expeditions'
                ? 'ai-btn-active-emerald text-white'
                : 'ai-panel-slate text-slate-300'
            }`}
          >
            <span>🛰️ Expedition</span>
            <span className="text-[9px] text-emerald-200">3 Flotten</span>
          </button>

          <button
            onClick={() => {
              sound.playUiClick();
              setActiveTab('codex');
            }}
            className={`py-2 px-1.5 rounded-lg text-[10px] sm:text-xs font-mono font-bold uppercase cursor-pointer flex flex-col items-center gap-0.5 ${
              activeTab === 'codex'
                ? 'ai-btn-active-purple text-white'
                : 'ai-panel-slate text-slate-300'
            }`}
          >
            <span>📖 Boss-Kodex</span>
            <span className="text-[9px] text-purple-200">Kopfgelder</span>
          </button>
        </div>

        {feedback && (
          <div className="mt-2 px-3 py-2 rounded-lg bg-emerald-950/90 border border-emerald-500/50 text-xs font-mono font-bold text-emerald-200 flex items-center justify-between">
            <span>{feedback}</span>
            <button
              onClick={() => setFeedback(null)}
              className="text-emerald-400 hover:text-white ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pt-3 space-y-3 pr-1">
          {/* =========================================================
              TAB 1: LIVE 1v1 PVP ARENA & LEADERBOARD
          ========================================================= */}
          {activeTab === 'arena' && (
            <div className="space-y-3.5">
              {/* League Status & Daily Tickets Bar */}
              <div className="ai-panel-slate p-3.5 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="text-xs font-mono text-slate-400">AKTUELLE ARENA-DIVISION</div>
                    <div className="text-sm sm:text-base font-black text-white flex items-center gap-2 mt-0.5">
                      <span style={{ color: currentLeague.badgeColor }}>{currentLeague.name}</span>
                      <span className="text-xs font-mono text-amber-300">
                        ({metaProgression.trophies} Trophäen · {metaProgression.pvpWins} Siege)
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-cyan-300 mt-0.5">
                      Liga-Aura: +{Math.round((currentLeague.damageMult - 1) * 100)}% Schaden & +
                      {Math.round((currentLeague.shieldMult - 1) * 100)}% Schild in allen Modi
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {metaProgression.canClaimDailyLeagueReward() && (
                      <SciFiButton
                        variant="amber"
                        size="sm"
                        active
                        onClick={handleClaimDailyLeague}
                      >
                        <span>Tages-Sold (+{currentLeague.dailyMedals} 🎖️)</span>
                      </SciFiButton>
                    )}

                    <SciFiButton
                      variant={darkMatter >= 25 ? 'cyan' : 'slate'}
                      size="sm"
                      active={darkMatter >= 25}
                      disabled={darkMatter < 25}
                      onClick={handleBuyTickets}
                    >
                      <span>+3 Tickets (25 DM)</span>
                    </SciFiButton>
                  </div>
                </div>

                {nextLeague && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
                      <span>Aufstieg zu {nextLeague.name}</span>
                      <span>
                        {metaProgression.trophies} / {nextLeague.minTrophies} 🏆
                      </span>
                    </div>
                    <SciFiProgressBar
                      percent={Math.min(
                        100,
                        ((metaProgression.trophies - currentLeague.minTrophies) /
                          Math.max(1, nextLeague.minTrophies - currentLeague.minTrophies)) *
                          100
                      )}
                      variant="amber"
                      heightClass="h-1.5"
                    />
                  </div>
                )}
              </div>

              {/* 3 Matchmaking Rivals */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-rose-300 font-bold uppercase">
                    WÄHLE DEINEN LIVE 1v1 FLOTTEN-GEGNER
                  </span>
                  <span className="text-slate-300">
                    Tickets heute:{' '}
                    <strong className="text-amber-300">{metaProgression.arenaTickets}/5</strong>
                  </span>
                </div>

                {opponents.map((opp) => {
                  const diffLabel =
                    opp.difficulty === 'easy'
                      ? 'VORHUT (LEICHT)'
                      : opp.difficulty === 'equal'
                      ? 'RIVALE (EBENBÜRTIG)'
                      : 'CHAMPION (ELITE)';
                  const diffColor =
                    opp.difficulty === 'easy'
                      ? 'text-emerald-300'
                      : opp.difficulty === 'equal'
                      ? 'text-cyan-300'
                      : 'text-rose-300';

                  return (
                    <div
                      key={opp.id}
                      className="ai-panel-slate p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-800 hover:border-cyan-500/40"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <ItemArtwork id={opp.shipClassId} category="ship" size={48} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-mono font-bold ${diffColor}`}>
                              {diffLabel}
                            </span>
                            <span className="text-xs font-bold text-white">
                              [{opp.guildTag}] {opp.callsign}
                            </span>
                            <span className="text-[11px] font-mono text-amber-300">
                              {opp.trophies} 🏆
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-300 mt-1 flex items-center gap-2 flex-wrap">
                            <span className="text-cyan-300">
                              Schild: {formatCompactNumber(opp.shield)}
                            </span>
                            <span>·</span>
                            <span className="text-emerald-300">
                              Hülle: {formatCompactNumber(opp.hp)}
                            </span>
                            <span>·</span>
                            <span className="text-rose-300">
                              DPS: {formatCompactNumber(opp.dps)}
                            </span>
                            <span>·</span>
                            <span className="text-purple-300">Pilot: {opp.commanderName}</span>
                          </div>
                          <div className="text-[11px] font-mono text-amber-300 font-bold mt-1">
                            Sieg-Prämie: +{opp.rewardTrophies} 🏆 · +{opp.rewardMedals} 🎖️ Medaillen · +
                            {opp.rewardDarkMatter} DM
                          </div>
                        </div>
                      </div>

                      <SciFiButton
                        variant={
                          opp.difficulty === 'elite'
                            ? 'rose'
                            : opp.difficulty === 'equal'
                            ? 'cyan'
                            : 'emerald'
                        }
                        size="sm"
                        active={metaProgression.arenaTickets > 0}
                        disabled={metaProgression.arenaTickets <= 0}
                        onClick={() => handleLaunchMatch(opp)}
                        className="shrink-0"
                      >
                        <span>1v1 DUELL STARTEN</span>
                      </SciFiButton>
                    </div>
                  );
                })}
              </div>

              {/* Arena League Leaderboard */}
              <div className="ai-panel-slate p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-amber-300 font-bold uppercase">
                    🏆 AKTUELLE LIGA-RANGLISTE (SAISON 1)
                  </span>
                  <span className="text-slate-400">6 Divisionen bis Großmeister</span>
                </div>

                <div className="space-y-1.5">
                  {leaderboard.map((row, idx) => (
                    <div
                      key={row.callsign + idx}
                      className={`px-3 py-2 rounded-lg flex items-center justify-between text-xs font-mono ${
                        row.isPlayer
                          ? 'bg-cyan-950/80 border border-cyan-400/60 text-white font-bold'
                          : 'bg-slate-950/75 border border-slate-800/80 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-6 text-center font-black ${
                            idx === 0
                              ? 'text-amber-300'
                              : idx === 1
                              ? 'text-slate-200'
                              : idx === 2
                              ? 'text-amber-500'
                              : 'text-slate-400'
                          }`}
                        >
                          #{idx + 1}
                        </span>
                        <span className="text-cyan-400">[{row.guildTag}]</span>
                        <span className="truncate">{row.callsign}</span>
                        <span className="text-[10px] text-slate-400">Schiff #{row.shipTier}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-amber-300 font-bold tabular-nums">
                          {row.trophies} 🏆
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB 2: PVP HONOR SHOP
          ========================================================= */}
          {activeTab === 'shop' && (
            <div className="space-y-3">
              <div className="ai-panel-amber p-3.5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono font-bold text-amber-200 uppercase">
                    IMPERIALER PVP-EHREN-SHOP
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Tausche Ehren-Medaillen aus PvP-Duellen und Expeditionen gegen dauerhafte
                    Flotten-Artefakte.
                  </p>
                </div>
                <div className="text-right font-mono shrink-0">
                  <span className="text-xs text-slate-400 block">GUTHABEN</span>
                  <span className="text-base font-black text-amber-300">
                    {formatCompactNumber(metaProgression.honorMedals)} 🎖️
                  </span>
                </div>
              </div>

              {HONOR_SHOP_ITEMS.map((item) => {
                const lvl = metaProgression.honorShopLevels[item.id] || 0;
                const isMax = lvl >= item.maxLevel;
                const cost = metaProgression.getHonorShopCost(item.id);
                const canAfford = !isMax && metaProgression.honorMedals >= cost;

                return (
                  <div
                    key={item.id}
                    className="ai-panel-slate p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">{item.name}</h3>
                        <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-[10px] font-mono font-bold text-amber-300">
                          Rang {lvl}/{item.maxLevel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{item.desc}</p>
                      <div className="text-xs font-mono text-cyan-300 font-bold mt-1">
                        {item.bonusText}
                      </div>
                    </div>

                    <SciFiButton
                      variant={isMax ? 'emerald' : canAfford ? 'amber' : 'slate'}
                      size="sm"
                      active={canAfford}
                      disabled={isMax || !canAfford}
                      onClick={() => handleBuyHonorItem(item.id)}
                      className="shrink-0"
                    >
                      <span>{isMax ? 'MAXIMAL' : `${cost} 🎖️`}</span>
                    </SciFiButton>
                  </div>
                );
              })}
            </div>
          )}

          {/* =========================================================
              TAB 3: COMMANDER PILOTS
          ========================================================= */}
          {activeTab === 'pilots' && (
            <div className="space-y-3">
              <div className="ai-panel-cyan p-3.5">
                <div className="text-xs font-mono font-bold text-cyan-300 uppercase">
                  FLOTTEN-KOMMANDANTEN (100% AKTIV-BONUS + 35% RESERVE-AURA)
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Dein ausgewählter Haupt-Kommandant verleiht 100% seiner Passiv-Aura. Alle
                  weiteren freigeschalteten Piloten unterstützen dich zusätzlich mit 35% ihrer Kraft!
                </p>
              </div>

              {COMMANDER_PILOTS.map((pilot) => {
                const lvl = metaProgression.getCommanderLevel(pilot.id);
                const isUnlocked = lvl > 0;
                const isActive = metaProgression.activeCommanderId === pilot.id;
                const cost = metaProgression.getCommanderUpgradeCost(pilot.id);
                const canAfford = darkMatter >= cost;

                return (
                  <div
                    key={pilot.id}
                    className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isActive
                        ? 'bg-cyan-950/45 border-cyan-400'
                        : 'bg-slate-950/85 border-slate-800'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: pilot.accentColor }}
                        />
                        <h3 className="text-sm font-bold text-white">{pilot.name}</h3>
                        <span className="text-xs font-mono text-amber-300 font-bold">
                          {isUnlocked ? `Stufe ${lvl}` : 'Gesperrt'}
                        </span>
                        {isActive && (
                          <span className="px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/50 text-[10px] font-mono font-bold text-cyan-200">
                            AKTIVER PILOT
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        {pilot.role} · Spezialgebiet: {pilot.specialty}
                      </div>
                      <div className="text-xs font-mono text-emerald-300 font-bold mt-1">
                        {pilot.passiveDesc}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isUnlocked && !isActive && (
                        <SciFiButton
                          variant="cyan"
                          size="sm"
                          active
                          onClick={() => handleSelectPilot(pilot.id)}
                        >
                          <span>Einsetzen</span>
                        </SciFiButton>
                      )}

                      <SciFiButton
                        variant={canAfford ? 'purple' : 'slate'}
                        size="sm"
                        active={canAfford}
                        disabled={!canAfford}
                        onClick={() => handleUnlockOrUpgradePilot(pilot.id)}
                      >
                        <span>
                          {!isUnlocked
                            ? `Rekrutieren (${cost} DM)`
                            : `Aufwerten (${cost} DM)`}
                        </span>
                      </SciFiButton>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* =========================================================
              TAB 4: FLEET EXPEDITIONS
          ========================================================= */}
          {activeTab === 'expeditions' && (
            <div className="space-y-3">
              <div className="ai-panel-emerald p-3.5">
                <div className="text-xs font-mono font-bold text-emerald-300 uppercase">
                  AUTONOME FLOTTEN-EXPEDITIONEN
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Entsende deine Hangar-Schiffe auf zeitbasierte Bergungs-Missionen für Scrap, Dark
                  Matter und Ehren-Medaillen.
                </p>
              </div>

              {metaProgression.expeditions.map((slot, idx) => {
                const now = Date.now();
                const elapsedSec = slot.startedAt ? Math.floor((now - slot.startedAt) / 1000) : 0;
                const remainingSec = slot.startedAt
                  ? Math.max(0, slot.durationSeconds - elapsedSec)
                  : slot.durationSeconds;
                const isRunning = slot.startedAt !== null && remainingSec > 0;
                const isDone = slot.startedAt !== null && remainingSec <= 0;
                const pct = slot.startedAt
                  ? Math.min(100, (elapsedSec / slot.durationSeconds) * 100)
                  : 0;

                const sectorScale = Math.max(1, Math.pow(1.22, playerSector - 1));
                const scrapReward = Math.round(
                  slot.baseScrapReward * sectorScale * mults.lootYieldMult
                );
                const dmReward = Math.round(slot.baseDmReward * Math.sqrt(sectorScale));

                return (
                  <div
                    key={slot.id}
                    className="ai-panel-slate p-3.5 flex flex-col gap-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white">{slot.title}</h3>
                          <span className="text-xs font-mono text-cyan-300">
                            ({slot.sectorName})
                          </span>
                        </div>
                        <div className="text-xs font-mono text-amber-300 mt-1">
                          Ertrag: +{formatCompactNumber(scrapReward)} SCR · +{dmReward} DM · +
                          {slot.baseMedalsReward} 🎖️
                        </div>
                      </div>

                      <SciFiButton
                        variant={isDone ? 'amber' : isRunning ? 'slate' : 'emerald'}
                        size="sm"
                        active={isDone || !isRunning}
                        disabled={isRunning}
                        onClick={() => handleStartOrClaimExpedition(idx)}
                      >
                        <span>
                          {isDone
                            ? 'BEUTE ABHOLEN!'
                            : isRunning
                            ? `${formatDurationCompact(remainingSec)}`
                            : 'FLOTTE STARTEN'}
                        </span>
                      </SciFiButton>
                    </div>

                    <SciFiProgressBar
                      percent={pct}
                      variant={isDone ? 'amber' : 'emerald'}
                      heightClass="h-2"
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* =========================================================
              TAB 5: BOSS CODEX & FIRST-KILL BOUNTIES
          ========================================================= */}
          {activeTab === 'codex' && (
            <div className="space-y-3">
              <div className="ai-panel-purple p-3.5">
                <div className="text-xs font-mono font-bold text-purple-300 uppercase">
                  TAKTISCHE BOSS-ENZYKLOPÄDIE & KOPFGELDER
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Jeder besiegte Boss-Typ schaltet ein einmaliges Erstkill-Kopfgeld sowie einen
                  permanenten Schadensbonus gegen alle Bosse frei!
                </p>
              </div>

              {BOSS_CODEX_ENTRIES.map((entry) => {
                const kills = metaProgression.bossKillCounts[entry.id] || 0;
                const claimed = Boolean(metaProgression.claimedBossBounties[entry.id]);
                const canClaim = kills > 0 && !claimed;

                return (
                  <div
                    key={entry.id}
                    className="ai-panel-slate p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <UI3DIcon src={UI_ASSETS.icons.bossSkull} size={16} />
                        <h3 className="text-sm font-bold text-white">{entry.name}</h3>
                        <span className="text-[11px] font-mono text-rose-300">
                          ({entry.title})
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-cyan-300">
                          Kills: {kills}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{entry.lore}</p>
                      <div className="text-[11px] font-mono text-amber-300 mt-1">
                        Schwachstelle: {entry.weakness}
                      </div>
                      <div className="text-xs font-mono text-purple-300 font-bold mt-1">
                        Kopfgeld: +{entry.rewardDm} DM · +{entry.rewardMedals} 🎖️ · Dauerhaft +
                        {entry.bossDmgBonusPct}% Boss-DMG
                      </div>
                    </div>

                    <SciFiButton
                      variant={claimed ? 'emerald' : canClaim ? 'amber' : 'slate'}
                      size="sm"
                      active={canClaim}
                      disabled={!canClaim}
                      onClick={() => handleClaimBossBounty(entry.id)}
                      className="shrink-0"
                    >
                      <span>
                        {claimed
                          ? 'KOPFGELD AKTIV'
                          : canClaim
                          ? 'KOPFGELD ABHOLEN'
                          : 'NOCH NICHT BESIEGT'}
                      </span>
                    </SciFiButton>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SciFiFrame>
    </div>
  );
};
