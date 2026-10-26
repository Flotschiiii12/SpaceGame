import React, { useState, useEffect } from 'react';
import { GameStats } from '../game/engine.ts';
import { OverdriveBoosterId, ShipClassId, WorldBossState } from '../game/types.ts';
import { getShipConfig } from '../game/shipClasses.ts';
import { multiplayer } from '../game/multiplayerClient.ts';
import { sound } from '../game/audio.ts';
import { UI_ASSETS } from '../game/assets.ts';
import { formatCompactNumber, formatDurationCompact } from '../game/formatters.ts';
import { SciFiProgressBar, UI3DIcon } from './SciFiFrame.tsx';

interface GameHudProps {
  stats: GameStats | null;
  shipClassId: ShipClassId;
  onToggleUpgrades: () => void;
  isUpgradeOpen: boolean;
  onPause: () => void;
  onTriggerSpecial: () => void;
  onTriggerMissile?: () => void;
  onTriggerPhaseDash?: () => void;
  onToggleAutoPilot?: () => void;
  onCycleGameSpeed?: () => void;
  onToggleBossAutoRetry?: () => void;
  onChallengeBossNow?: () => void;
  onToggleAutoUpgrade?: () => void;
  onClaimOfflineReward?: () => void;
  onActivateBooster?: (id: OverdriveBoosterId) => void;
  onOpenCommandDeck?: (tab?: 'arena' | 'honor_shop' | 'pilots' | 'expeditions' | 'codex') => void;
  onCycleDamageFilter?: () => void;
  hasAffordableUpgrade?: boolean;
}

export const GameHud: React.FC<GameHudProps> = ({
  stats,
  shipClassId,
  onToggleUpgrades,
  isUpgradeOpen,
  onPause,
  onTriggerSpecial,
  onTriggerMissile,
  onTriggerPhaseDash,
  onToggleAutoPilot,
  onCycleGameSpeed,
  onToggleBossAutoRetry,
  onChallengeBossNow,
  onToggleAutoUpgrade,
  onClaimOfflineReward,
  onActivateBooster,
  onOpenCommandDeck,
  onCycleDamageFilter,
  hasAffordableUpgrade = false,
}) => {
  const [worldBoss, setWorldBoss] = useState<WorldBossState | null>(multiplayer.worldBoss);
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());
  const [showTelemetry, setShowTelemetry] = useState<boolean>(false);

  useEffect(() => {
    multiplayer.onWorldBossSynced = (wb) => {
      setWorldBoss({ ...wb });
    };
    return () => {
      multiplayer.onWorldBossSynced = undefined;
    };
  }, []);

  if (!stats) return null;

  const shipConfig = getShipConfig(shipClassId);
  const hpPercent = Math.max(0, Math.min(100, (stats.playerHp / stats.playerMaxHp) * 100));
  const shieldPercent = Math.max(
    0,
    Math.min(100, (stats.playerShield / stats.playerMaxShield) * 100)
  );
  const wavePercent = Math.max(0, Math.min(100, (stats.waveTimer / stats.waveDuration) * 100));
  const displayWave = ((stats.wave - 1) % 10) + 1;
  const isMiniBossWave = displayWave === 5 && !stats.currentBoss;

  const isSpecialReady = stats.abilityCooldownRemaining <= 0 && !stats.isAbilityActive;
  const isDashActive = (stats.phaseDashActiveRemaining || 0) > 0;
  const isDashReady = stats.phaseDashCooldownRemaining <= 0 && !isDashActive;
  const claimableAchCount =
    stats.claimableAchievementsCount ??
    stats.achievements?.filter((a) => a.canClaim || (a.unlocked && !a.claimed)).length ??
    0;

  // Skill Duration / Cooldown Progress Percentages for Bottom Progress Strips
  const dashBarPct = isDashActive
    ? ((stats.phaseDashActiveRemaining || 0) / 3.8) * 100
    : isDashReady
    ? 100
    : Math.max(
        0,
        100 -
          (stats.phaseDashCooldownRemaining / Math.max(1, stats.phaseDashMaxCooldown || 8)) * 100
      );

  const missileMaxCd = Math.max(1, stats.missileMaxCooldown || 5);
  const missileBarPct = stats.missileReady
    ? 100
    : stats.missileCooldownRemaining > 0
    ? Math.max(0, 100 - (stats.missileCooldownRemaining / missileMaxCd) * 100)
    : 0;

  const specialBarPct = stats.isAbilityActive
    ? (stats.abilityActiveRemaining / 6) * 100
    : isSpecialReady
    ? 100
    : Math.max(
        0,
        100 - (stats.abilityCooldownRemaining / Math.max(1, stats.abilityMaxCooldown || 12)) * 100
      );

  const handleWorldBossOrbitalStrike = () => {
    if (!worldBoss || !worldBoss.isActive) return;
    const strikeDmg = Math.max(250, Math.round(stats.dps * 3.5 + 450));
    multiplayer.sendWorldBossDamage(strikeDmg);
    sound.playWeaponFire('omega', { pan: 0, isCrit: true, tier: shipConfig.tier });
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-2.5 select-none overflow-hidden">
      {/* =========================================================
          TOP COCKPIT TELEMETRY HEADER (10-WAVE CHAPTER + BOSS / PVP BAR)
      ========================================================= */}
      <div className="flex flex-col gap-1.5 w-full max-w-4xl mx-auto">
        <div className="pointer-events-auto ai-hud-top flex flex-col px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            {/* Left: Sector / Rift / PvP + 10-Wave Chapter Progress + Paragon */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-36 sm:w-44">
                <div className="flex items-center justify-between gap-1.5 text-[11px] font-mono font-bold mb-1">
                  <span
                    className={
                      stats.activePvpMatch
                        ? 'text-rose-300'
                        : stats.isEndlessRift
                        ? 'text-purple-300'
                        : 'text-cyan-300'
                    }
                  >
                    {stats.activePvpMatch
                      ? '⚔️ PVP-ARENA'
                      : stats.isEndlessRift
                      ? `RIFT D${stats.endlessDepth}`
                      : `SEK 0${stats.sector}`}
                  </span>
                  <span
                    className={`whitespace-nowrap ${
                      stats.currentBoss
                        ? 'text-rose-300'
                        : isMiniBossWave
                        ? 'text-amber-300'
                        : 'text-slate-200'
                    }`}
                  >
                    {stats.activePvpMatch
                      ? '1v1 DUELL'
                      : stats.currentBoss
                      ? `BOSS · W.${displayWave}/10`
                      : isMiniBossWave
                      ? `ELITE · W.${displayWave}/10`
                      : `W.${displayWave}/10 · ${stats.enemiesRemaining} Gegn.`}
                  </span>
                </div>
                <SciFiProgressBar
                  percent={wavePercent}
                  variant={
                    stats.currentBoss
                      ? 'rose'
                      : isMiniBossWave
                      ? 'amber'
                      : stats.isEndlessRift
                      ? 'purple'
                      : 'cyan'
                  }
                  heightClass="h-1.5"
                />
              </div>

              <div className="hidden xs:flex items-center gap-1 text-xs font-mono font-bold text-purple-200 shrink-0 pl-2 border-l border-slate-800">
                <UI3DIcon src={UI_ASSETS.icons.quantumShard} size={14} />
                <span>P.{stats.paragonLevel}</span>
              </div>
            </div>

            {/* Right: Compact Currencies, Audio & Pause */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1">
                <div className="flex items-center gap-1">
                  <UI3DIcon src={UI_ASSETS.icons.scrap} size={13} />
                  <span className="text-xs font-mono font-bold text-amber-300 tabular-nums">
                    {formatCompactNumber(stats.scrap)}
                  </span>
                </div>
                <span className="text-slate-700">·</span>
                <div className="flex items-center gap-1">
                  <UI3DIcon src={UI_ASSETS.icons.darkMatter} size={13} />
                  <span className="text-xs font-mono font-bold text-purple-300 tabular-nums">
                    {formatCompactNumber(stats.darkMatter)}
                  </span>
                </div>
              </div>

              {/* Audio Toggle Button */}
              <button
                onClick={() => {
                  const muted = sound.toggleMute();
                  setIsMuted(muted);
                  if (!muted) {
                    sound.startAtmosphere();
                    sound.playUiClick();
                  }
                }}
                className={`w-8 h-8 active:scale-95 flex items-center justify-center cursor-pointer transition-transform ${
                  isMuted ? 'ai-thumb-slate' : 'ai-thumb-cyan'
                }`}
                aria-label="Audio umschalten"
              >
                <UI3DIcon
                  src={isMuted ? UI_ASSETS.icons.audioOff : UI_ASSETS.icons.audioOn}
                  size={18}
                />
              </button>

              {/* Pause Button */}
              <button
                onClick={onPause}
                className="w-8 h-8 ai-thumb-cyan active:scale-95 flex items-center justify-center cursor-pointer"
                aria-label="Spiel pausieren"
              >
                <UI3DIcon src={UI_ASSETS.icons.pause} size={18} />
              </button>
            </div>
          </div>

          {/* Integrated Compact Boss / PvP Rival Telemetry Strip */}
          {stats.currentBoss && (
            <div className="mt-1.5 pt-1.5 border-t border-rose-500/30 flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                <div className="flex items-center gap-1.5 min-w-0">
                  <UI3DIcon src={UI_ASSETS.icons.bossSkull} size={15} />
                  <span className="font-bold uppercase text-rose-100 truncate">
                    {stats.currentBoss.isPvpRival
                      ? `RIVALE: ${stats.currentBoss.name}`
                      : `${stats.currentBoss.name} · P${stats.currentBoss.phase}`}
                  </span>
                  {stats.currentBoss.staggerRemaining > 0 ? (
                    <span className="text-[10px] font-bold text-amber-300 shrink-0">
                      · 💥 SCHILDBRUCH +50% DMG ({stats.currentBoss.staggerRemaining.toFixed(1)}s)
                    </span>
                  ) : stats.currentBoss.shieldDronesAlive > 0 ? (
                    <span className="text-[10px] font-bold text-cyan-300 shrink-0">
                      · ⚡{stats.currentBoss.shieldDronesAlive} KOPPLER (-65% DMG)
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-300 shrink-0">
                      · SCHILD GEBROCHEN
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-mono text-amber-300 font-bold tabular-nums shrink-0">
                  {formatCompactNumber(stats.currentBoss.hp)} HP
                </span>
              </div>

              {stats.currentBoss.maxShieldHp > 0 && stats.currentBoss.shieldHp > 0 && (
                <SciFiProgressBar
                  percent={
                    (stats.currentBoss.shieldHp / Math.max(1, stats.currentBoss.maxShieldHp)) * 100
                  }
                  variant="cyan"
                  heightClass="h-1.5"
                />
              )}

              <SciFiProgressBar
                percent={(stats.currentBoss.hp / Math.max(1, stats.currentBoss.maxHp)) * 100}
                variant={stats.currentBoss.staggerRemaining > 0 ? 'amber' : 'rose'}
                heightClass="h-2"
              />
            </div>
          )}
        </div>

        {/* =========================================================
            IDLE COMMAND BAR: SPEED (1x/2x/3x), PVP-ARENA, KOMMANDO & AUTO-UPG
        ========================================================= */}
        <div className="pointer-events-auto flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 min-w-0">
            {/* 1x / 2x / 3x Battle Speed Toggle */}
            <button
              onClick={onCycleGameSpeed}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 ${
                stats.gameSpeed === 3
                  ? 'ai-btn-active-amber text-amber-100'
                  : stats.gameSpeed === 2
                  ? 'ai-btn-active-cyan text-cyan-100'
                  : 'ai-btn-slate text-slate-200'
              }`}
            >
              <span>TEMPO</span>
              <span className="tabular-nums font-black">{stats.gameSpeed}x</span>
            </button>

            {/* Live 1v1 PvP Arena Trigger */}
            {onOpenCommandDeck && (
              <button
                onClick={() => onOpenCommandDeck('arena')}
                className="relative ai-btn-active-rose px-2 py-1 rounded-lg text-[10px] font-mono font-bold text-rose-100 transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1"
              >
                <span>⚔️ PVP ({stats.arenaTickets ?? 5}/5)</span>
                {(stats.metaClaimableCount || 0) > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-300 animate-ping" />
                )}
              </button>
            )}

            {/* Pilots / Expeditions / Boss Codex Trigger */}
            {onOpenCommandDeck && (
              <button
                onClick={() => onOpenCommandDeck('pilots')}
                className="ai-btn-purple px-2 py-1 rounded-lg text-[10px] font-mono font-bold text-purple-200 transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
              >
                👨‍✈️ KOMMANDO
              </button>
            )}

            {/* Boss Auto-Retry vs Safe Farm Mode Toggle */}
            <button
              onClick={onToggleBossAutoRetry}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0 ${
                stats.bossAutoRetry
                  ? 'ai-btn-active-cyan text-cyan-100'
                  : 'ai-btn-slate text-emerald-300'
              }`}
            >
              {stats.bossAutoRetry ? 'BOSS: AN' : 'FARMEN'}
            </button>

            {!stats.bossAutoRetry && (displayWave === 4 || displayWave === 9) && (
              <button
                onClick={onChallengeBossNow}
                className="ai-btn-active-amber px-2 py-1 rounded-lg text-[10px] font-mono font-bold text-white transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
              >
                BOSS START
              </button>
            )}

            {/* Live Tactical Telemetry Toggle */}
            <button
              onClick={() => setShowTelemetry((prev) => !prev)}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0 ${
                showTelemetry
                  ? 'ai-btn-active-cyan text-cyan-100'
                  : 'ai-btn-slate text-slate-300'
              }`}
            >
              TAKTIK
            </button>
          </div>

          {/* Background Auto-Upgrade Quick Toggle */}
          <button
            onClick={onToggleAutoUpgrade}
            className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0 ${
              stats.autoUpgradeEnabled
                ? 'ai-btn-active-amber text-amber-100'
                : 'ai-btn-slate text-slate-300'
            }`}
          >
            AUTO-UPG: {stats.autoUpgradeEnabled ? 'AN' : 'AUS'}
          </button>
        </div>

        {/* Collapsible Live Combat Telemetry, Damage Filter & Overdrive Boosters Panel */}
        {showTelemetry && (
          <div className="pointer-events-auto ai-hud-vitals px-3 py-2 flex flex-col gap-2 text-[11px] font-mono">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1">
                <span className="text-[9px] text-slate-400 block">FEUERLEISTUNG</span>
                <span className="text-cyan-300 font-bold tabular-nums">
                  {formatCompactNumber(stats.dps)} DPS
                </span>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1">
                <span className="text-[9px] text-slate-400 block">GEGNER-DRUCK</span>
                <span className="text-rose-300 font-bold tabular-nums">
                  {formatCompactNumber(stats.incomingDps)}/s
                </span>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1">
                <span className="text-[9px] text-slate-400 block">ABSORPTION</span>
                <span className="text-emerald-300 font-bold tabular-nums">
                  {stats.damageMitigationPct ?? stats.mitigationPct ?? 0}% Rüst.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 text-[10px] bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5">
              <span className="text-amber-300 truncate">
                👨‍✈️ {stats.activeCommanderName || 'Vanguard'} · {stats.setBonusName}
              </span>
              {onCycleDamageFilter && (
                <button
                  onClick={onCycleDamageFilter}
                  className="px-2 py-0.5 rounded bg-slate-900 border border-cyan-500/40 text-cyan-300 font-bold cursor-pointer shrink-0"
                >
                  ZAHLEN:{' '}
                  {stats.damageFilter === 'off'
                    ? 'AUS'
                    : stats.damageFilter === 'crit'
                    ? 'NUR KRIT'
                    : 'ALLE'}
                </button>
              )}
            </div>

            {/* 3 Tactical Overdrive Boosters */}
            {stats.activeBoosters && onActivateBooster && (
              <div className="grid grid-cols-3 gap-1.5">
                {stats.activeBoosters.map((b) => {
                  const isActive = b.activeRemaining > 0;
                  const isReady = b.cooldownRemaining <= 0 && !isActive;
                  return (
                    <button
                      key={b.id}
                      disabled={!isReady}
                      onClick={() => onActivateBooster(b.id)}
                      className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer active:scale-95 flex flex-col items-center ${
                        isActive
                          ? 'ai-btn-active-amber text-white'
                          : isReady
                          ? 'ai-btn-cyan text-cyan-200'
                          : 'bg-slate-950 text-slate-400 border border-slate-800'
                      }`}
                    >
                      <span className="truncate w-full text-center">{b.name}</span>
                      <span className="text-[9px] tabular-nums">
                        {isActive
                          ? `${Math.ceil(b.activeRemaining)}s AKTIV`
                          : isReady
                          ? b.shortLabel || 'BEREIT'
                          : `${Math.ceil(b.cooldownRemaining)}s CD`}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Offline AFK Salvage Reward Banner */}
        {stats.pendingOfflineReward && (
          <div className="pointer-events-auto w-full ai-panel-amber px-3 py-2 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-amber-200">
                <UI3DIcon src={UI_ASSETS.icons.scrap} size={14} />
                <span>
                  AFK-SALVAGE ({formatDurationCompact(stats.pendingOfflineReward.awaySeconds)})
                </span>
              </div>
              <div className="text-xs font-mono font-bold text-white tabular-nums mt-0.5">
                +{formatCompactNumber(stats.pendingOfflineReward.scrapEarned)} SCR
                {stats.pendingOfflineReward.darkMatterEarned > 0 && (
                  <span className="text-purple-300 ml-2">
                    +{formatCompactNumber(stats.pendingOfflineReward.darkMatterEarned)} DM
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClaimOfflineReward}
              className="ai-btn-active-amber px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-white cursor-pointer active:scale-95 shrink-0"
            >
              EINSAMMELN
            </button>
          </div>
        )}

        {/* World Boss Co-Op Raid Housing */}
        {worldBoss && worldBoss.isActive && !stats.currentBoss && (
          <div className="pointer-events-auto w-full ai-panel-purple px-3.5 py-2 flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="text-purple-100 font-bold truncate flex items-center gap-1.5">
                  <UI3DIcon src={UI_ASSETS.icons.rifts} size={14} />
                  RAID: {worldBoss.name}
                </span>
                <span className="text-purple-200 font-bold tabular-nums">
                  {Math.round((worldBoss.hp / worldBoss.maxHp) * 100)}%
                </span>
              </div>
              <SciFiProgressBar
                percent={(worldBoss.hp / worldBoss.maxHp) * 100}
                variant="purple"
                heightClass="h-1.5"
              />
            </div>
            <button
              onClick={handleWorldBossOrbitalStrike}
              className="ai-btn-active-purple px-3 py-1.5 text-white font-mono text-xs font-bold shrink-0 cursor-pointer active:scale-95"
            >
              STRIKE
            </button>
          </div>
        )}
      </div>

      {/* =========================================================
          BOTTOM THUMB CONSOLE (100% OPAQUE VITALS + 5 HIGH-CONTRAST ACTUATORS)
      ========================================================= */}
      <div className="pointer-events-auto flex flex-col gap-2 w-full max-w-4xl mx-auto">
        {/* Collision-Free Vitals Console (2-Line Shield & Hull + Sub-Telemetry Bar) */}
        <div className="ai-hud-vitals px-3.5 py-2.5 flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-3">
            {/* Shield Column */}
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-1 text-[11px] font-mono mb-1">
                <span className="text-cyan-300 font-bold flex items-center gap-1 shrink-0">
                  <UI3DIcon src={UI_ASSETS.icons.shield} size={13} />
                  <span>SCHILD</span>
                </span>
                <span className="text-cyan-100 font-bold tabular-nums truncate">
                  {formatCompactNumber(stats.playerShield)}/{formatCompactNumber(stats.playerMaxShield)}
                </span>
              </div>
              <SciFiProgressBar percent={shieldPercent} variant="cyan" heightClass="h-2" />
              <div className="flex items-center justify-between text-[10px] font-mono text-cyan-300/90 mt-1">
                <span>+{formatCompactNumber(stats.shieldRegenPerSec)}/s</span>
                <span>{Math.round(shieldPercent)}%</span>
              </div>
            </div>

            {/* Hull Column */}
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-1 text-[11px] font-mono mb-1">
                <span className="text-emerald-300 font-bold flex items-center gap-1 shrink-0">
                  <UI3DIcon src={UI_ASSETS.icons.hull} size={13} />
                  <span>HÜLLE</span>
                </span>
                <span className="text-emerald-100 font-bold tabular-nums truncate">
                  {formatCompactNumber(stats.playerHp)}/{formatCompactNumber(stats.playerMaxHp)}
                </span>
              </div>
              <SciFiProgressBar
                percent={hpPercent}
                variant={hpPercent < 30 ? 'rose' : 'emerald'}
                heightClass="h-2"
              />
              <div className="flex items-center justify-between text-[10px] font-mono text-emerald-300/90 mt-1">
                <span>+{formatCompactNumber(stats.hullRegenPerSec)}/s</span>
                <span>Rüst. {stats.damageMitigationPct ?? stats.mitigationPct ?? 0}%</span>
              </div>
            </div>
          </div>

          {/* Compact Bottom Telemetry Footer (DPS, Incoming DPS, PvP League & Damage Filter) */}
          <div className="pt-1.5 border-t border-slate-800/90 flex items-center justify-between gap-2 text-[10px] font-mono">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-cyan-300 font-bold tabular-nums">
                DPS: {formatCompactNumber(stats.dps)}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-rose-300 tabular-nums">
                Gegn.: {formatCompactNumber(stats.incomingDps)}/s
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-amber-300 font-bold truncate max-w-[140px]">
                {stats.pvpLeagueName ? `🏆 ${stats.pvpLeagueName} (${stats.pvpTrophies})` : stats.setBonusName}
              </span>
              {onCycleDamageFilter && (
                <button
                  onClick={onCycleDamageFilter}
                  className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[9px] text-slate-300 hover:text-white cursor-pointer"
                  title="Schadenszahlen-Filter umschalten"
                >
                  {stats.damageFilter === 'off'
                    ? 'ZAHL: AUS'
                    : stats.damageFilter === 'crit'
                    ? 'ZAHL: KRIT'
                    : 'ZAHL: AN'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 5 Solid 100% Opaque Thumb Actuator Buttons with Integrated Timer Progress Bars */}
        <div className="grid grid-cols-5 gap-2">
          {/* 1. Auto-Skills Toggle */}
          <button
            onClick={onToggleAutoPilot}
            className={`relative overflow-hidden min-h-[68px] px-1.5 py-2 flex flex-col items-center justify-between transition-all active:scale-95 cursor-pointer ${
              stats.isAutoPilot
                ? 'ai-thumb-active-cyan text-cyan-100'
                : 'ai-thumb-slate text-slate-200'
            }`}
          >
            <UI3DIcon src={UI_ASSETS.icons.autopilot} size={20} />
            <span className="text-[10px] font-mono font-bold uppercase whitespace-nowrap">
              AUTO-CAST
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-black tabular-nums whitespace-nowrap ${
                stats.isAutoPilot
                  ? 'bg-cyan-950 text-cyan-200 border border-cyan-400/50'
                  : 'bg-slate-950 text-slate-400 border border-slate-700'
              }`}
            >
              {stats.isAutoPilot ? 'AKTIV' : 'MANUELL'}
            </span>
            <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden mt-0.5">
              <div
                className={`h-full ${stats.isAutoPilot ? 'bg-cyan-400' : 'bg-slate-700'}`}
                style={{ width: stats.isAutoPilot ? '100%' : '25%' }}
              />
            </div>
          </button>

          {/* 2. Aegis Shield Barrier Overcharge */}
          <button
            onClick={onTriggerPhaseDash}
            disabled={!isDashReady}
            className={`relative overflow-hidden min-h-[68px] px-1.5 py-2 flex flex-col items-center justify-between transition-all active:scale-95 cursor-pointer ${
              isDashActive
                ? 'ai-thumb-active-cyan text-white'
                : isDashReady
                ? 'ai-thumb-cyan text-cyan-100'
                : 'ai-thumb-slate text-slate-300'
            }`}
          >
            <UI3DIcon src={UI_ASSETS.icons.shield} size={20} />
            <span className="text-[10px] font-mono font-bold uppercase whitespace-nowrap">
              AEGIS-SCHILD
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-black tabular-nums whitespace-nowrap ${
                isDashActive
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-400/60'
                  : isDashReady
                  ? 'bg-cyan-950 text-cyan-200 border border-cyan-400/50'
                  : 'bg-slate-950 text-amber-300 border border-slate-700'
              }`}
            >
              {isDashActive
                ? `AKTIV ${(stats.phaseDashActiveRemaining || 0).toFixed(1)}s`
                : isDashReady
                ? '+35% SHD'
                : `CD ${stats.phaseDashCooldownRemaining.toFixed(1)}s`}
            </span>
            <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden mt-0.5">
              <div
                className={`h-full transition-all duration-100 ${
                  isDashActive
                    ? 'bg-emerald-400'
                    : isDashReady
                    ? 'bg-cyan-400'
                    : 'bg-amber-400/80'
                }`}
                style={{ width: `${Math.max(5, Math.min(100, dashBarPct))}%` }}
              />
            </div>
          </button>

          {/* 3. Secondary Missile Salvo */}
          <button
            onClick={onTriggerMissile}
            disabled={!stats.missileReady}
            className={`relative overflow-hidden min-h-[68px] px-1.5 py-2 flex flex-col items-center justify-between transition-all active:scale-95 cursor-pointer ${
              stats.missileReady
                ? 'ai-thumb-active-rose text-rose-100'
                : 'ai-thumb-slate text-slate-300'
            }`}
          >
            <UI3DIcon src={UI_ASSETS.icons.missile} size={20} />
            <span className="text-[10px] font-mono font-bold uppercase whitespace-nowrap">
              RAKETEN
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-black tabular-nums whitespace-nowrap ${
                stats.missileReady
                  ? 'bg-rose-950 text-rose-200 border border-rose-400/60'
                  : 'bg-slate-950 text-amber-300 border border-slate-700'
              }`}
            >
              {stats.missileReady
                ? 'FEUER!'
                : stats.missileCooldownRemaining > 0
                ? `CD ${stats.missileCooldownRemaining.toFixed(1)}s`
                : 'LEER'}
            </span>
            <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden mt-0.5">
              <div
                className={`h-full transition-all duration-100 ${
                  stats.missileReady ? 'bg-rose-400' : 'bg-amber-400/80'
                }`}
                style={{ width: `${Math.max(5, Math.min(100, missileBarPct))}%` }}
              />
            </div>
          </button>

          {/* 4. Ship Ultimate Special Ability */}
          <button
            onClick={onTriggerSpecial}
            disabled={!isSpecialReady}
            className={`relative overflow-hidden min-h-[68px] px-1.5 py-2 flex flex-col items-center justify-between transition-all active:scale-95 cursor-pointer ${
              stats.isAbilityActive
                ? 'ai-thumb-active-amber text-white'
                : isSpecialReady
                ? 'ai-thumb-amber text-amber-100'
                : 'ai-thumb-slate text-slate-300'
            }`}
          >
            <UI3DIcon src={UI_ASSETS.icons.ultimate} size={20} />
            <span className="text-[10px] font-mono font-bold uppercase whitespace-nowrap">
              ULTIMATE
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-black tabular-nums whitespace-nowrap ${
                stats.isAbilityActive
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-400/60'
                  : isSpecialReady
                  ? 'bg-amber-950 text-amber-200 border border-amber-400/60'
                  : 'bg-slate-950 text-amber-300 border border-slate-700'
              }`}
            >
              {stats.isAbilityActive
                ? `AKTIV ${stats.abilityActiveRemaining.toFixed(1)}s`
                : isSpecialReady
                ? 'BEREIT'
                : `CD ${stats.abilityCooldownRemaining.toFixed(1)}s`}
            </span>
            <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden mt-0.5">
              <div
                className={`h-full transition-all duration-100 ${
                  stats.isAbilityActive
                    ? 'bg-emerald-400'
                    : isSpecialReady
                    ? 'bg-amber-400'
                    : 'bg-cyan-400/80'
                }`}
                style={{ width: `${Math.max(5, Math.min(100, specialBarPct))}%` }}
              />
            </div>
          </button>

          {/* 5. In-Flight Tech, Upgrades & Achievements Bottom-Sheet Trigger */}
          <button
            onClick={onToggleUpgrades}
            className={`relative overflow-hidden min-h-[68px] px-1.5 py-2 flex flex-col items-center justify-between transition-all active:scale-95 cursor-pointer ${
              isUpgradeOpen
                ? 'ai-thumb-active-amber text-white'
                : 'ai-thumb-amber text-amber-200'
            }`}
          >
            <UI3DIcon src={UI_ASSETS.icons.upgrades} size={20} />
            <span className="text-[10px] font-mono font-bold uppercase whitespace-nowrap">
              UPGRADES
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-950/90 border border-amber-500/40 text-[9px] font-mono font-black text-amber-200 whitespace-nowrap">
              {claimableAchCount > 0 ? `${claimableAchCount} BONUS!` : 'SYSTEME'}
            </span>
            <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden mt-0.5">
              <div
                className="h-full bg-amber-400"
                style={{ width: hasAffordableUpgrade || claimableAchCount > 0 ? '100%' : '35%' }}
              />
            </div>
            {(hasAffordableUpgrade || claimableAchCount > 0) && !isUpgradeOpen && (
              <UI3DIcon
                src={UI_ASSETS.icons.quantumShard}
                size={14}
                className="absolute top-1.5 right-1.5 animate-bounce"
              />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
