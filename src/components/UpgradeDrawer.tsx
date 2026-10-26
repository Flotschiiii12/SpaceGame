import React, { useState } from 'react';
import {
  BuyMultiplierMode,
  CommandAchievement,
  OverdriveBoosterId,
  OverdriveBoosterState,
  PlayerUpgrades,
  TechLabResearches,
  UpgradeMilestoneInfo,
} from '../game/types.ts';
import { UI_ASSETS } from '../game/assets.ts';
import { formatCompactNumber } from '../game/formatters.ts';
import { ItemArtwork } from './ItemArtwork.tsx';
import { SciFiFrame, SciFiButton, SciFiProgressBar, UI3DIcon } from './SciFiFrame.tsx';

interface UpgradeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  scrap: number;
  darkMatter: number;
  upgrades: PlayerUpgrades;
  tech: TechLabResearches;
  getUpgradeCost: (key: keyof PlayerUpgrades) => number;
  getBulkUpgradeQuote?: (
    key: keyof PlayerUpgrades,
    mode: BuyMultiplierMode
  ) => { levels: number; cost: number; isMaxed: boolean };
  getMilestoneInfo?: (key: keyof PlayerUpgrades) => UpgradeMilestoneInfo;
  onPurchaseUpgrade: (key: keyof PlayerUpgrades, mode?: BuyMultiplierMode) => void;
  onPurchaseTech: (key: keyof TechLabResearches) => void;
  autoUpgradeEnabled?: boolean;
  onToggleAutoUpgrade?: () => void;
  achievements?: CommandAchievement[];
  onClaimAchievement?: (id: string) => void;
  activeBoosters?: OverdriveBoosterState[];
  onActivateBooster?: (id: OverdriveBoosterId) => void;
}

export const UpgradeDrawer: React.FC<UpgradeDrawerProps> = ({
  isOpen,
  onClose,
  scrap,
  darkMatter,
  upgrades,
  tech,
  getUpgradeCost,
  getBulkUpgradeQuote,
  getMilestoneInfo,
  onPurchaseUpgrade,
  onPurchaseTech,
  autoUpgradeEnabled = false,
  onToggleAutoUpgrade,
  achievements = [],
  onClaimAchievement,
  activeBoosters = [],
  onActivateBooster,
}) => {
  const [activeTab, setActiveTab] = useState<'engineering' | 'tech' | 'achievements'>('engineering');
  const [buyMode, setBuyMode] = useState<BuyMultiplierMode>('1x');

  if (!isOpen) return null;

  const claimableCount = achievements.filter((a) => a.unlocked && !a.claimed).length;

  const upgradeItems: Array<{
    key: keyof PlayerUpgrades;
    title: string;
    subtitle: string;
    badge: string;
    color: string;
  }> = [
    {
      key: 'shieldCapacityLevel',
      title: 'Aegis Deflector Grid',
      subtitle: '+65 Max Schild-Kapazität & +8% Schild-Bonus pro Stufe',
      badge: `+${formatCompactNumber((upgrades.shieldCapacityLevel - 1) * 65)} SHD`,
      color: 'text-sky-300',
    },
    {
      key: 'shieldRegenLevel',
      title: 'Capacitor Recharge',
      subtitle: '+14/s & +22% permanente Schild-Regeneration im Kampf',
      badge: `+${formatCompactNumber((upgrades.shieldRegenLevel - 1) * 22)}% Regen`,
      color: 'text-teal-300',
    },
    {
      key: 'hullArmorLevel',
      title: 'Nanite Hull Plating',
      subtitle: '+75 Max Hülle, +5.5 HP/s Reparatur & +2.5% Rüstung',
      badge: `+${formatCompactNumber((upgrades.hullArmorLevel - 1) * 75)} HP`,
      color: 'text-emerald-300',
    },
    {
      key: 'aiPilotLevel',
      title: 'Aegis Nanite Core',
      subtitle: 'Verstärkt Schild (+35), Hülle (+40) & Kampf-Reparatur (+6.5/s)',
      badge: `Core St.${upgrades.aiPilotLevel || 1}`,
      color: 'text-cyan-200',
    },
    {
      key: 'damageLevel',
      title: 'Plasma Core Output',
      subtitle: '+20% Primärwaffen- & Raketen-Schaden pro Stufe',
      badge: `+${formatCompactNumber((upgrades.damageLevel - 1) * 20)}% DMG`,
      color: 'text-rose-300',
    },
    {
      key: 'fireRateLevel',
      title: 'Accelerator Coils',
      subtitle: '+15% Feuerrate aller Geschütztürme pro Stufe',
      badge: `+${formatCompactNumber((upgrades.fireRateLevel - 1) * 15)}% SPD`,
      color: 'text-cyan-300',
    },
    {
      key: 'weaponLevel',
      title: 'Weapon Evolution',
      subtitle: 'Bündelt Laser-Strahlen zu hochdichten Evo-Strahlen',
      badge: `Evo St.${upgrades.weaponLevel}`,
      color: 'text-amber-300',
    },
    {
      key: 'critChanceLevel',
      title: 'Tactical Targeting',
      subtitle: '+3% Kritische Trefferchance pro Stufe',
      badge: `${5 + (upgrades.critChanceLevel - 1) * 3}% CRIT`,
      color: 'text-yellow-300',
    },
    {
      key: 'critDamageLevel',
      title: 'Overcharged Lenses',
      subtitle: '+25% Kritischer Multiplikator pro Stufe',
      badge: `${(1.5 + (upgrades.critDamageLevel - 1) * 0.25).toFixed(2)}x`,
      color: 'text-orange-300',
    },
    {
      key: 'droneCountLevel',
      title: 'Autonomous Wingmen',
      subtitle: 'Schaltet autonome Kampf-Drohnen frei (Max 5)',
      badge: `${Math.min(5, upgrades.droneCountLevel)} / 5 Drohnen`,
      color: 'text-purple-300',
    },
    {
      key: 'dronePowerLevel',
      title: 'Drone Overclocking',
      subtitle: '+25% Drohnen-Schaden & Feuerrate',
      badge: `+${formatCompactNumber((upgrades.dronePowerLevel - 1) * 25)}% PWR`,
      color: 'text-indigo-300',
    },
    {
      key: 'idleCollectorLevel',
      title: 'Automated Salvage',
      subtitle: 'Generiert zusätzlich passiv Scrap pro Sekunde',
      badge: `+${formatCompactNumber(upgrades.idleCollectorLevel * 3.5, true)}/s`,
      color: 'text-amber-200',
    },
    {
      key: 'magnetLevel',
      title: 'Tractor Beam Amplifier',
      subtitle: 'Beschleunigt die automatische Beute-Erfassung',
      badge: `Stufe ${upgrades.magnetLevel}`,
      color: 'text-pink-300',
    },
  ];

  const techItems: Array<{
    key: keyof TechLabResearches;
    title: string;
    subtitle: string;
    bonusText: string;
  }> = [
    {
      key: 'quantumScrapRefinery',
      title: 'Quantum Scrap Refinery',
      subtitle: 'Erhöht alle Scrap-Beute dauerhaft um +25% pro Rang',
      bonusText: `+${(tech.quantumScrapRefinery || 0) * 25}% Scrap`,
    },
    {
      key: 'darkMatterAttunement',
      title: 'Dark Matter Attunement',
      subtitle: 'Erhöht Dark Matter Beute von Bossen & Eliten um +20%',
      bonusText: `+${(tech.darkMatterAttunement || 0) * 20}% DM`,
    },
    {
      key: 'plasmaOvercharge',
      title: 'Plasma Overcharge',
      subtitle: 'Erhöht den globalen Waffenschaden dauerhaft um +15% pro Rang',
      bonusText: `+${(tech.plasmaOvercharge || 0) * 15}% Global DMG`,
    },
    {
      key: 'bossVulnerabilityMatrix',
      title: 'Boss Vulnerability Matrix',
      subtitle: 'Erhöht den Schaden gegen Sektor- & Rift-Bosse um +25% pro Rang',
      bonusText: `+${(tech.bossVulnerabilityMatrix || 0) * 25}% Boss DMG`,
    },
    {
      key: 'warpDriveMastery',
      title: 'Warp Drive Thrusters',
      subtitle: 'Erhöht die Manövriergeschwindigkeit um +10% pro Rang',
      bonusText: `+${(tech.warpDriveMastery || 0) * 10}% Speed`,
    },
  ];

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/75 backdrop-blur-sm flex flex-col justify-end select-none p-2 sm:p-4">
      <div className="flex-1" onClick={onClose} />

      <SciFiFrame
        variant="cyan"
        className="w-full max-w-lg mx-auto max-h-[84dvh] flex flex-col overflow-hidden p-4 sm:p-5"
      >
        {/* Header */}
        <div className="pb-3 border-b border-slate-800/80">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-wider text-white uppercase">
                IN-FLIGHT UPGRADE DECK
              </h2>
              <p className="text-xs font-mono text-cyan-300 mt-0.5">
                Alle 10 Stufen: +35% Meilenstein-Synergie
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-slate-950/85 border border-slate-800 rounded-lg px-3 py-1.5 flex items-center gap-2 font-mono text-xs">
                <span className="flex items-center gap-1 text-amber-300 font-bold tabular-nums">
                  <UI3DIcon src={UI_ASSETS.icons.scrap} size={14} />
                  {formatCompactNumber(scrap)}
                </span>
                <span className="text-slate-700">·</span>
                <span className="flex items-center gap-1 text-purple-300 font-bold tabular-nums">
                  <UI3DIcon src={UI_ASSETS.icons.darkMatter} size={14} />
                  {formatCompactNumber(darkMatter)}
                </span>
              </div>
              <SciFiButton variant="slate" size="sm" onClick={onClose}>
                <span>ESC</span>
              </SciFiButton>
            </div>
          </div>

          {/* 3-Tab Selector */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            <SciFiButton
              variant="amber"
              size="sm"
              active={activeTab === 'engineering'}
              onClick={() => setActiveTab('engineering')}
            >
              <UI3DIcon src={UI_ASSETS.icons.upgrades} size={15} />
              <span>Upgrades</span>
            </SciFiButton>

            <SciFiButton
              variant="purple"
              size="sm"
              active={activeTab === 'tech'}
              onClick={() => setActiveTab('tech')}
            >
              <UI3DIcon src={UI_ASSETS.icons.darkMatter} size={15} />
              <span>Tech Lab</span>
            </SciFiButton>

            <SciFiButton
              variant="cyan"
              size="sm"
              active={activeTab === 'achievements'}
              onClick={() => setActiveTab('achievements')}
            >
              <UI3DIcon src={UI_ASSETS.icons.quantumShard} size={15} />
              <span>
                Erfolge{claimableCount > 0 ? ` (${claimableCount})` : ''}
              </span>
            </SciFiButton>
          </div>

          {/* Bulk Buy Multiplier (x1 / x10 / MAX) & Auto-Upgrade Toggle Bar */}
          {activeTab === 'engineering' && (
            <div className="flex items-center justify-between gap-2 mt-2.5 pt-2.5 border-t border-slate-800/70">
              <div className="flex items-center gap-1 bg-slate-950/85 border border-slate-800 rounded-lg p-1">
                {(['1x', '10x', 'max'] as BuyMultiplierMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setBuyMode(mode)}
                    className={`px-3 py-1 rounded-md text-xs font-mono font-bold uppercase transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      buyMode === mode
                        ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/50'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {mode === 'max' ? 'MAX' : mode}
                  </button>
                ))}
              </div>

              <button
                onClick={onToggleAutoUpgrade}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0 ${
                  autoUpgradeEnabled
                    ? 'ai-btn-active-amber text-amber-100'
                    : 'ai-panel-slate text-slate-300'
                }`}
              >
                AUTO-UPGRADE: {autoUpgradeEnabled ? 'AN' : 'AUS'}
              </button>
            </div>
          )}
        </div>

        {/* Scrollable 1-Column Upgrade Cards */}
        <div className="flex-1 overflow-y-auto pt-3 space-y-2.5 pr-1">
          {activeTab === 'engineering' &&
            upgradeItems.map((item) => {
              const level = upgrades[item.key] ?? 1;
              const quote = getBulkUpgradeQuote
                ? getBulkUpgradeQuote(item.key, buyMode)
                : {
                    levels: 1,
                    cost: getUpgradeCost(item.key),
                    isMaxed: item.key === 'droneCountLevel' && level >= 5,
                  };
              const milestone = getMilestoneInfo
                ? getMilestoneInfo(item.key)
                : {
                    tier: Math.floor(level / 10),
                    multiplier: Math.pow(1.35, Math.floor(level / 10)),
                    nextMilestoneLevel: (Math.floor(level / 10) + 1) * 10,
                    progressPct: (level % 10) * 10,
                  };
              const canAfford = scrap >= quote.cost && !quote.isMaxed;
              const isDroneCount = item.key === 'droneCountLevel';

              return (
                <div
                  key={item.key}
                  className="ai-panel-slate p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <ItemArtwork id={item.key} size={42} className="shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xs sm:text-sm font-bold text-white">{item.title}</h3>
                        <span className="text-[10px] font-mono text-cyan-300 font-bold">
                          · Lv.{level}
                        </span>
                        {!isDroneCount && milestone.tier > 0 && (
                          <span className="text-[10px] font-mono font-bold text-amber-300">
                            · M.{milestone.tier} (x{milestone.multiplier.toFixed(2)})
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-snug mt-0.5">{item.subtitle}</p>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className={`text-[11px] font-mono font-bold ${item.color}`}>
                          {item.badge}
                        </span>
                        {!isDroneCount && (
                          <span className="text-[10px] font-mono text-slate-400">
                            Perk Lv.{milestone.nextMilestoneLevel} (+35%)
                          </span>
                        )}
                      </div>
                      {!isDroneCount && (
                        <div className="mt-1">
                          <SciFiProgressBar
                            percent={milestone.progressPct}
                            variant={milestone.tier > 0 ? 'amber' : 'cyan'}
                            heightClass="h-1"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <SciFiButton
                    variant={canAfford ? 'amber' : 'slate'}
                    size="sm"
                    active={canAfford}
                    disabled={!canAfford}
                    onClick={() => onPurchaseUpgrade(item.key, buyMode)}
                    className="shrink-0"
                  >
                    <div className="flex flex-col items-end leading-tight">
                      {!quote.isMaxed && quote.levels > 1 && (
                        <span className="text-[10px] font-mono text-amber-200 tabular-nums">
                          +{quote.levels} Stufen
                        </span>
                      )}
                      <span className="tabular-nums">
                        {quote.isMaxed ? 'MAX' : `${formatCompactNumber(quote.cost)} SCR`}
                      </span>
                    </div>
                  </SciFiButton>
                </div>
              );
            })}

          {activeTab === 'tech' &&
            techItems.map((item) => {
              const rank = tech[item.key] ?? 0;
              const cost = (rank + 1) * 8;
              const canAfford = darkMatter >= cost;

              return (
                <div
                  key={item.key}
                  className="ai-panel-purple p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ItemArtwork id={item.key} size={42} className="shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xs sm:text-sm font-bold text-white">{item.title}</h3>
                        <span className="text-[10px] font-mono text-purple-300 font-bold">
                          · Rang {rank}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-snug mt-0.5">{item.subtitle}</p>
                      <span className="text-[11px] font-mono font-bold text-purple-200 block mt-0.5">
                        {item.bonusText}
                      </span>
                    </div>
                  </div>

                  <SciFiButton
                    variant={canAfford ? 'purple' : 'slate'}
                    size="sm"
                    active={canAfford}
                    disabled={!canAfford}
                    onClick={() => onPurchaseTech(item.key)}
                    className="shrink-0"
                  >
                    <span>{formatCompactNumber(cost)} DM</span>
                  </SciFiButton>
                </div>
              );
            })}

          {activeTab === 'achievements' && (
            <div className="space-y-3">
              {/* Tactical Overdrive Boosters */}
              {activeBoosters.length > 0 && onActivateBooster && (
                <div className="ai-panel-cyan p-3 space-y-2">
                  <div className="text-xs font-mono font-bold text-cyan-300 uppercase">
                    Taktische Flotten-Direktiven (45s Boosts)
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {activeBoosters.map((b) => {
                      const isActive = b.activeRemaining > 0;
                      const isReady = b.cooldownRemaining <= 0 && !isActive;
                      return (
                        <button
                          key={b.id}
                          disabled={!isReady}
                          onClick={() => onActivateBooster(b.id)}
                          className={`p-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer active:scale-95 flex flex-col items-center gap-1 ${
                            isActive
                              ? 'ai-btn-active-amber text-white'
                              : isReady
                              ? 'ai-btn-cyan text-cyan-100'
                              : 'ai-panel-slate text-slate-400 opacity-70'
                          }`}
                        >
                          <span className="text-[11px] truncate w-full text-center">{b.name}</span>
                          <span className="text-[10px] text-amber-200">{b.shortLabel}</span>
                          <span className="text-[10px] tabular-nums">
                            {isActive
                              ? `Aktiv (${Math.ceil(b.activeRemaining)}s)`
                              : isReady
                              ? 'AKTIVIEREN'
                              : `${Math.ceil(b.cooldownRemaining)}s CD`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Command Milestone Achievements */}
              {achievements.map((ach) => {
                const pct = Math.min(100, Math.round((ach.current / Math.max(1, ach.target)) * 100));
                const canClaim = ach.unlocked && !ach.claimed;
                return (
                  <div
                    key={ach.id}
                    className={`p-3.5 flex items-center justify-between gap-3 ${
                      ach.claimed
                        ? 'ai-panel-slate opacity-75'
                        : canClaim
                        ? 'ai-panel-amber'
                        : 'ai-panel-slate'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-xs sm:text-sm font-bold text-white">{ach.title}</h3>
                        <span className="text-[10px] font-mono text-cyan-300 tabular-nums">
                          {formatCompactNumber(ach.current)} / {formatCompactNumber(ach.target)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">{ach.desc}</p>
                      <div className="mt-1.5">
                        <SciFiProgressBar
                          percent={pct}
                          variant={ach.claimed ? 'emerald' : canClaim ? 'amber' : 'cyan'}
                          heightClass="h-1.5"
                        />
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] font-mono font-bold">
                        <span className="text-purple-300">+{ach.rewardDarkMatter} DM</span>
                        {ach.rewardQuantumShards > 0 && (
                          <span className="text-cyan-300">+{ach.rewardQuantumShards} QS</span>
                        )}
                      </div>
                    </div>

                    <SciFiButton
                      variant={ach.claimed ? 'slate' : canClaim ? 'amber' : 'slate'}
                      size="sm"
                      active={canClaim}
                      disabled={!canClaim}
                      onClick={() => onClaimAchievement && onClaimAchievement(ach.id)}
                      className="shrink-0"
                    >
                      <span>
                        {ach.claimed ? 'ERHALTEN' : canClaim ? 'ABHOLEN' : `${pct}%`}
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
