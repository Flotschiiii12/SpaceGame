import React, { useState } from 'react';
import {
  paragonManager,
  PARAGON_CONSTELLATION_NODES,
  VOID_RIFT_MUTATORS,
  SINGULARITY_RELIC_CARDS,
  ParagonBranch,
  ParagonNodeDef,
  VoidRiftMutator,
} from '../game/paragon.ts';
import { UI_ASSETS } from '../game/assets.ts';
import { formatCompactNumber } from '../game/formatters.ts';
import {
  SciFiFrame,
  SciFiButton,
  SciFiProgressBar,
  SingularityCoreGraphic,
  VoidRiftPortalGraphic,
  UI3DIcon,
} from './SciFiFrame.tsx';
import { sound } from '../game/audio.ts';

interface ParagonMatrixModalProps {
  highestSectorReached: number;
  currentScrap: number;
  isEndlessRiftActive: boolean;
  onClose?: () => void;
  onTriggerPrestige: (shardsEarned: number) => void;
  onLaunchEndlessRift: (depth: number, mutator: VoidRiftMutator) => void;
  onStatsUpdated: () => void;
  isEmbedded?: boolean;
}

export const ParagonMatrixModal: React.FC<ParagonMatrixModalProps> = ({
  highestSectorReached,
  currentScrap,
  isEndlessRiftActive,
  onClose,
  onTriggerPrestige,
  onLaunchEndlessRift,
  onStatsUpdated,
  isEmbedded = false,
}) => {
  const [paragonState, setParagonState] = useState(() => paragonManager.getState());
  const [activeTab, setActiveTab] = useState<'constellation' | 'endless_rift' | 'prestige'>(
    'constellation'
  );
  const [selectedBranch, setSelectedBranch] = useState<ParagonBranch>('vanguard');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('van_kinetic_amp');
  const [prestigeMessage, setPrestigeMessage] = useState<string | null>(null);

  const refresh = () => {
    setParagonState(paragonManager.getState());
    onStatsUpdated();
  };

  const bonuses = paragonManager.getComputedBonuses();
  const branchNodes = PARAGON_CONSTELLATION_NODES.filter(
    (n) => n.branch === selectedBranch
  );
  const selectedNode =
    PARAGON_CONSTELLATION_NODES.find((n) => n.id === selectedNodeId) ||
    branchNodes[0];

  const handleSelectBranch = (b: ParagonBranch) => {
    sound.playUiClick();
    setSelectedBranch(b);
    const first = PARAGON_CONSTELLATION_NODES.find((n) => n.branch === b);
    if (first) setSelectedNodeId(first.id);
  };

  const handleUpgradeNode = (nodeId: string) => {
    if (paragonManager.upgradeNode(nodeId)) {
      sound.playUpgrade();
      refresh();
    }
  };

  const handleUpgradeRelic = (relicId: string) => {
    if (paragonManager.upgradeRelic(relicId)) {
      sound.playUpgrade();
      refresh();
    }
  };

  const handlePrestige = () => {
    const reqStatus = paragonManager.getPrestigeRequirementStatus(currentScrap);
    const reward = paragonManager.performSingularityPrestige(
      highestSectorReached,
      currentScrap
    );
    if (reward > 0) {
      sound.playPrestige();
      refresh();
      setPrestigeMessage(
        `SINGULARITÄTS-TRANSMUTATION ABGESCHLOSSEN! +${reward} Quantum Shards, +${reqStatus.relicFragmentsReward} Relikt-Fragmente & Prestige-Rang ${
          paragonState.prestigeRank + 1
        } erreicht!`
      );
      onTriggerPrestige(reward);
    }
  };

  const renderNode3DIcon = (icon: ParagonNodeDef['icon'], size = 20) => {
    switch (icon) {
      case 'sword':
      case 'crosshair':
        return <UI3DIcon src={UI_ASSETS.icons.missile} size={size} />;
      case 'zap':
      case 'flame':
        return <UI3DIcon src={UI_ASSETS.icons.ultimate} size={size} />;
      case 'shield':
        return <UI3DIcon src={UI_ASSETS.icons.shield} size={size} />;
      case 'heart':
        return <UI3DIcon src={UI_ASSETS.icons.hull} size={size} />;
      case 'cpu':
      case 'refresh':
        return <UI3DIcon src={UI_ASSETS.icons.autopilot} size={size} />;
      case 'coins':
      case 'magnet':
        return <UI3DIcon src={UI_ASSETS.icons.scrap} size={size} />;
      case 'sparkles':
      case 'infinity':
      default:
        return <UI3DIcon src={UI_ASSETS.icons.quantumShard} size={size} />;
    }
  };

  const branchVariant: Record<ParagonBranch, 'amber' | 'cyan' | 'purple'> = {
    vanguard: 'amber',
    bulwark: 'cyan',
    synthesizer: 'purple',
  };

  const prestigeReq = paragonManager.getPrestigeRequirementStatus(currentScrap);
  const potentialPrestigeShards = prestigeReq.shardReward;
  const activeMutator = paragonManager.getActiveMutator();
  const xpReq = paragonManager.getXpRequiredForNextLevel();
  const xpPct = Math.min(100, Math.round((paragonState.paragonXp / xpReq) * 100));

  return (
    <div
      className={
        isEmbedded
          ? 'w-full'
          : 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto'
      }
    >
      <SciFiFrame
        variant="purple"
        glowIntensity="high"
        className={
          isEmbedded
            ? 'w-full flex flex-col p-3.5'
            : 'w-full max-w-5xl max-h-[92vh] flex flex-col p-5 sm:p-7'
        }
      >
        {/* TOP HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 ai-thumb-active-purple flex items-center justify-center">
              <UI3DIcon src={UI_ASSETS.icons.rifts} size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-xl font-black tracking-wider text-white uppercase">
                  PARAGON ASCENSION & VOID RIFTS
                </h2>
                <span className="ai-btn-active-amber px-2.5 py-0.5 text-[10px] font-black tracking-widest uppercase text-amber-100">
                  PRESTIGE RANG {paragonState.prestigeRank}
                </span>
              </div>
              <p className="text-xs text-slate-300 tracking-wide mt-0.5">
                Konstellations-Talente • Void Rift Mutatoren • Singularitäts-Relikte
              </p>
            </div>
          </div>

          {/* CURRENCY & PARAGON LEVEL BAR */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="ai-panel-cyan px-3.5 py-2 flex items-center gap-3">
              <div>
                <div className="text-[10px] font-bold tracking-widest text-cyan-300 uppercase">
                  PARAGON LV.{paragonState.paragonLevel}
                </div>
                <div className="w-24 mt-1">
                  <SciFiProgressBar percent={xpPct} variant="cyan" heightClass="h-2" />
                </div>
              </div>
              <span className="text-xs font-mono text-slate-200">
                {formatCompactNumber(paragonState.paragonXp)}/{formatCompactNumber(xpReq)} XP
              </span>
            </div>

            <div className="ai-panel-purple px-3.5 py-2 flex items-center gap-2">
              <UI3DIcon src={UI_ASSETS.icons.quantumShard} size={20} />
              <div>
                <div className="text-[9px] uppercase tracking-widest text-purple-200 font-bold">
                  QUANTUM SHARDS
                </div>
                <div className="text-sm font-black font-mono text-white">
                  {formatCompactNumber(paragonState.quantumShards)}
                </div>
              </div>
            </div>

            {!isEmbedded && onClose && (
              <SciFiButton variant="rose" size="sm" onClick={onClose}>
                <span>X</span>
              </SciFiButton>
            )}
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex flex-wrap items-center gap-2 my-3">
          <SciFiButton
            variant="purple"
            size="sm"
            active={activeTab === 'constellation'}
            onClick={() => setActiveTab('constellation')}
          >
            <UI3DIcon src={UI_ASSETS.icons.quantumShard} size={15} />
            <span>CONSTELLATION TREE</span>
          </SciFiButton>

          <SciFiButton
            variant="cyan"
            size="sm"
            active={activeTab === 'endless_rift'}
            onClick={() => setActiveTab('endless_rift')}
          >
            <UI3DIcon src={UI_ASSETS.icons.rifts} size={15} />
            <span>VOID RIFTS (D{paragonState.currentEndlessDepth})</span>
          </SciFiButton>

          <SciFiButton
            variant="amber"
            size="sm"
            active={activeTab === 'prestige'}
            onClick={() => setActiveTab('prestige')}
          >
            <UI3DIcon src={UI_ASSETS.icons.hq} size={15} />
            <span>
              PRESTIGE & RELIKTE (
              {prestigeReq.canPrestige
                ? `+${potentialPrestigeShards} QS`
                : `${prestigeReq.currentWaves}/${prestigeReq.requiredWaves} W.`}
              )
            </span>
          </SciFiButton>
        </div>

        {/* TAB 1: CONSTELLATION TALENT TREE */}
        {activeTab === 'constellation' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 overflow-y-auto pr-1">
            <div className="lg:col-span-7 flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-2">
                <SciFiButton
                  variant="amber"
                  size="sm"
                  active={selectedBranch === 'vanguard'}
                  onClick={() => handleSelectBranch('vanguard')}
                  className="w-full"
                >
                  <UI3DIcon src={UI_ASSETS.icons.ultimate} size={14} />
                  <span>VANGUARD</span>
                </SciFiButton>
                <SciFiButton
                  variant="cyan"
                  size="sm"
                  active={selectedBranch === 'bulwark'}
                  onClick={() => handleSelectBranch('bulwark')}
                  className="w-full"
                >
                  <UI3DIcon src={UI_ASSETS.icons.shield} size={14} />
                  <span>BULWARK</span>
                </SciFiButton>
                <SciFiButton
                  variant="purple"
                  size="sm"
                  active={selectedBranch === 'synthesizer'}
                  onClick={() => handleSelectBranch('synthesizer')}
                  className="w-full"
                >
                  <UI3DIcon src={UI_ASSETS.icons.quantumShard} size={14} />
                  <span>SYNTHESIZER</span>
                </SciFiButton>
              </div>

              {/* INTERACTIVE 3D CONSTELLATION MAP */}
              <SciFiFrame
                variant={branchVariant[selectedBranch]}
                className="relative h-80 sm:h-96 flex-1 overflow-hidden p-4 ai-drydock-bay"
              >
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {branchNodes.map((node) => {
                    if (!node.parentNodeId) return null;
                    const parent = branchNodes.find((p) => p.id === node.parentNodeId);
                    if (!parent) return null;
                    const unlocked = paragonManager.getNodeLevel(parent.id) > 0;
                    const strokeColor =
                      selectedBranch === 'vanguard'
                        ? '#f59e0b'
                        : selectedBranch === 'bulwark'
                        ? '#00f2fe'
                        : '#a855f7';
                    return (
                      <g key={`${parent.id}-${node.id}`}>
                        <line
                          x1={`${parent.x}%`}
                          y1={`${parent.y}%`}
                          x2={`${node.x}%`}
                          y2={`${node.y}%`}
                          stroke={unlocked ? strokeColor : '#475569'}
                          strokeWidth={unlocked ? 3 : 1.5}
                          strokeDasharray={unlocked ? 'none' : '5 5'}
                          opacity={unlocked ? 0.9 : 0.5}
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* 3D Socket Constellation Nodes */}
                {branchNodes.map((node) => {
                  const lv = paragonManager.getNodeLevel(node.id);
                  const isSelected = selectedNode.id === node.id;
                  const check = paragonManager.canUpgradeNode(node.id);

                  const thumbClass =
                    lv > 0
                      ? selectedBranch === 'vanguard'
                        ? 'ai-thumb-active-amber'
                        : selectedBranch === 'bulwark'
                        ? 'ai-thumb-active-cyan'
                        : 'ai-thumb-active-purple'
                      : check.allowed
                      ? 'ai-thumb-cyan'
                      : 'ai-thumb-slate opacity-75';

                  return (
                    <button
                      key={node.id}
                      onClick={() => {
                        sound.playUiClick();
                        setSelectedNodeId(node.id);
                      }}
                      onMouseEnter={() => sound.playUiHover()}
                      style={{ left: `${node.x}%`, top: `${node.y}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer transition-transform duration-200 ${
                        isSelected ? 'scale-115 z-20' : 'hover:scale-105 z-10'
                      }`}
                    >
                      <div
                        className={`w-14 h-14 ${thumbClass} flex flex-col items-center justify-center transition-all ${
                          isSelected ? 'brightness-125' : ''
                        }`}
                      >
                        {renderNode3DIcon(node.icon, 20)}
                        <span className="text-[9px] font-black font-mono text-white">
                          Lv.{lv}
                        </span>
                      </div>
                      <div className="mt-1 px-2 py-0.5 ai-btn-slate whitespace-nowrap text-[9px] font-bold tracking-wider text-slate-100 uppercase">
                        {node.name}
                      </div>
                    </button>
                  );
                })}
              </SciFiFrame>
            </div>

            {/* RIGHT: NODE INSPECTOR & GLOBAL PARAGON BONUSES */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <SciFiFrame
                variant={branchVariant[selectedBranch]}
                className="p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black tracking-widest uppercase text-cyan-300">
                      {selectedNode.subtitle}
                    </span>
                    <span className="px-2.5 py-0.5 text-xs font-mono font-bold ai-btn-cyan text-white">
                      RANK {paragonManager.getNodeLevel(selectedNode.id)} / ∞
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-white tracking-wider mt-1">
                    {selectedNode.name}
                  </h3>
                  <p className="text-xs text-slate-200 leading-relaxed mt-2">
                    {selectedNode.description}
                  </p>

                  <div className="mt-4 p-3 ai-panel-slate space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-300">Current Bonus:</span>
                      <span className="font-mono font-bold text-emerald-300">
                        +{paragonManager.getNodeLevel(selectedNode.id) * selectedNode.bonusPerLevel}
                        {selectedNode.unit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Next Level Bonus:</span>
                      <span className="font-mono font-bold text-cyan-300">
                        +
                        {(paragonManager.getNodeLevel(selectedNode.id) + 1) *
                          selectedNode.bonusPerLevel}
                        {selectedNode.unit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Infusion Cost:</span>
                      <span className="font-mono font-bold text-purple-300">
                        {formatCompactNumber(paragonManager.getNodeUpgradeCost(selectedNode.id))} Quantum Shards
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  {(() => {
                    const check = paragonManager.canUpgradeNode(selectedNode.id);
                    return (
                      <SciFiButton
                        variant={branchVariant[selectedBranch]}
                        size="lg"
                        active={check.allowed}
                        disabled={!check.allowed}
                        onClick={() => handleUpgradeNode(selectedNode.id)}
                        className="w-full"
                      >
                        <UI3DIcon src={UI_ASSETS.icons.quantumShard} size={18} />
                        <span>
                          {check.allowed
                            ? `INFUSE NODE (${formatCompactNumber(
                                paragonManager.getNodeUpgradeCost(selectedNode.id)
                              )} SHARDS)`
                            : check.reason}
                        </span>
                      </SciFiButton>
                    );
                  })()}
                </div>
              </SciFiFrame>

              {/* TOTAL PARAGON SYNERGY READOUT */}
              <SciFiFrame variant="slate" className="p-4 flex-1">
                <h4 className="text-xs font-black tracking-widest uppercase text-slate-200 mb-3 flex items-center gap-2">
                  <UI3DIcon src={UI_ASSETS.icons.ultimate} size={16} />
                  ACTIVE ASCENSION MULTIPLIERS
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 ai-btn-amber flex justify-between">
                    <span className="text-slate-200">All Damage:</span>
                    <span className="font-mono font-bold text-amber-200">
                      +{formatCompactNumber(Math.round((bonuses.allDamageMult - 1) * 100))}%
                    </span>
                  </div>
                  <div className="p-2 ai-btn-rose flex justify-between">
                    <span className="text-slate-200">Boss Damage:</span>
                    <span className="font-mono font-bold text-rose-200">
                      +{formatCompactNumber(Math.round((bonuses.bossDamageMult - 1) * 100))}%
                    </span>
                  </div>
                  <div className="p-2 ai-btn-cyan flex justify-between">
                    <span className="text-slate-200">Hull & Shield:</span>
                    <span className="font-mono font-bold text-cyan-200">
                      +{formatCompactNumber(Math.round((bonuses.hullAndShieldMult - 1) * 100))}%
                    </span>
                  </div>
                  <div className="p-2 ai-btn-emerald flex justify-between">
                    <span className="text-slate-200">Scrap Salvage:</span>
                    <span className="font-mono font-bold text-emerald-200">
                      +{formatCompactNumber(Math.round((bonuses.scrapYieldMult - 1) * 100))}%
                    </span>
                  </div>
                  <div className="p-2 ai-btn-amber flex justify-between">
                    <span className="text-slate-200">Fire Rate:</span>
                    <span className="font-mono font-bold text-amber-200">
                      +{formatCompactNumber(Math.round((bonuses.fireRateMult - 1) * 100))}%
                    </span>
                  </div>
                  <div className="p-2 ai-btn-purple flex justify-between">
                    <span className="text-slate-200">Dmg Mitigation:</span>
                    <span className="font-mono font-bold text-purple-200">
                      {bonuses.damageReductionPct}%
                    </span>
                  </div>
                </div>
              </SciFiFrame>
            </div>
          </div>
        )}

        {/* TAB 2: ENDLESS VOID RIFT LAUNCHER */}
        {activeTab === 'endless_rift' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 overflow-y-auto pr-1">
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <SciFiFrame
                variant="cyan"
                className="w-full p-6 flex flex-col items-center text-center"
              >
                <VoidRiftPortalGraphic depth={paragonState.currentEndlessDepth} className="mb-3" />
                <div className="text-[11px] font-black tracking-widest uppercase text-cyan-300">
                  DIMENSIONAL ANOMALY GATE
                </div>
                <h3 className="text-2xl font-black text-white tracking-wider mt-1">
                  VOID RIFT DEPTH {paragonState.currentEndlessDepth}
                </h3>
                <p className="text-xs text-slate-300 mt-2 max-w-sm">
                  Enter an endlessly scaling pocket dimension where enemy fleets adapt with unstable mutators. Defeat the Rift Guardian Boss to unlock deeper layers and earn massive Quantum Shards!
                </p>

                {/* Depth Selector */}
                <div className="flex items-center gap-3 mt-4 ai-hud-top px-4 py-2">
                  <SciFiButton
                    variant="cyan"
                    size="sm"
                    onClick={() => {
                      paragonManager.setEndlessDepth(paragonState.currentEndlessDepth - 1);
                      refresh();
                    }}
                    disabled={paragonState.currentEndlessDepth <= 1}
                  >
                    <span>-1</span>
                  </SciFiButton>
                  <div className="text-xs font-mono text-white">
                    DEPTH{' '}
                    <span className="font-black text-cyan-300">
                      {paragonState.currentEndlessDepth}
                    </span>{' '}
                    / MAX {paragonState.highestEndlessDepth}
                  </div>
                  <SciFiButton
                    variant="cyan"
                    size="sm"
                    onClick={() => {
                      paragonManager.setEndlessDepth(paragonState.currentEndlessDepth + 1);
                      refresh();
                    }}
                    disabled={
                      paragonState.currentEndlessDepth >= paragonState.highestEndlessDepth
                    }
                  >
                    <span>+1</span>
                  </SciFiButton>
                </div>

                {/* Exponential Rift Scaling Readout */}
                {(() => {
                  const riftScale = paragonManager.getEndlessRiftScaling(
                    paragonState.currentEndlessDepth,
                    1
                  );
                  return (
                    <div className="w-full grid grid-cols-2 gap-2 mt-4 text-left text-[11px] font-mono">
                      <div className="p-2.5 ai-btn-rose flex justify-between items-center">
                        <span className="text-slate-200">Hostile HP:</span>
                        <span className="font-bold text-rose-200">
                          {formatCompactNumber(riftScale.enemyHpMult, true)}x
                        </span>
                      </div>
                      <div className="p-2.5 ai-btn-amber flex justify-between items-center">
                        <span className="text-slate-200">Hostile Dmg:</span>
                        <span className="font-bold text-amber-200">
                          {formatCompactNumber(riftScale.enemyDamageMult, true)}x
                        </span>
                      </div>
                      <div className="p-2.5 ai-btn-purple flex justify-between items-center">
                        <span className="text-slate-200">Paragon XP:</span>
                        <span className="font-bold text-purple-200">
                          {formatCompactNumber(riftScale.paragonXpMult, true)}x
                        </span>
                      </div>
                      <div className="p-2.5 ai-btn-emerald flex justify-between items-center">
                        <span className="text-slate-200">Loot Yield:</span>
                        <span className="font-bold text-emerald-200">
                          {formatCompactNumber(riftScale.lootYieldMult, true)}x
                        </span>
                      </div>
                    </div>
                  );
                })()}

                <div className="w-full mt-5">
                  <SciFiButton
                    variant="cyan"
                    size="lg"
                    active
                    onClick={() => {
                      onLaunchEndlessRift(
                        paragonState.currentEndlessDepth,
                        activeMutator
                      );
                      if (onClose) onClose();
                    }}
                    className="w-full"
                  >
                    <UI3DIcon src={UI_ASSETS.icons.rifts} size={18} />
                    <span>
                      {isEndlessRiftActive
                        ? `WARP TO RIFT DEPTH ${paragonState.currentEndlessDepth}`
                        : `LAUNCH ENDLESS VOID RIFT`}
                    </span>
                  </SciFiButton>
                </div>
              </SciFiFrame>
            </div>

            <div className="lg:col-span-7 flex flex-col gap-3">
              <div className="text-xs font-black uppercase tracking-widest text-cyan-300">
                SELECT ACTIVE RIFT ANOMALY MUTATOR
              </div>
              <div className="space-y-2.5">
                {VOID_RIFT_MUTATORS.map((mut) => {
                  const isSelected = activeMutator.id === mut.id;
                  return (
                    <SciFiFrame
                      key={mut.id}
                      variant={isSelected ? 'cyan' : 'slate'}
                      className="p-3.5 cursor-pointer transition-all"
                      onClick={() => {
                        sound.playUiClick();
                        paragonManager.setActiveMutator(mut.id);
                        refresh();
                      }}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <UI3DIcon src={UI_ASSETS.icons.rifts} size={18} />
                            <h4 className="text-sm font-black tracking-wider text-white">
                              {mut.name}
                            </h4>
                            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold ai-btn-emerald text-emerald-200">
                              +{mut.rewardBonusPct}% LOOT & SHARDS
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1">
                            {mut.description}
                          </p>
                        </div>
                        <div
                          className={`px-3 py-1.5 text-[10px] font-black tracking-widest uppercase ${
                            isSelected
                              ? 'ai-btn-active-cyan text-white'
                              : 'ai-btn-slate text-slate-300'
                          }`}
                        >
                          {isSelected ? 'ACTIVE' : 'SELECT'}
                        </div>
                      </div>
                    </SciFiFrame>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SINGULARITY TRANSMUTATION (PRESTIGE) & RELIC CARDS */}
        {activeTab === 'prestige' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 overflow-y-auto pr-1">
            <div className="lg:col-span-5 flex flex-col items-center justify-start">
              <SciFiFrame
                variant="amber"
                className="w-full p-5 flex flex-col items-center text-center"
              >
                <SingularityCoreGraphic rank={paragonState.prestigeRank} className="mb-3" />
                <div className="text-[11px] font-black tracking-widest uppercase text-amber-300">
                  TIMELINE COLLAPSE PROTOCOL
                </div>
                <h3 className="text-xl font-black text-white tracking-wider mt-1">
                  SINGULARITY RANG {paragonState.prestigeRank}
                </h3>
                <p className="text-xs text-slate-300 mt-2">
                  Schließe mindestens <strong className="text-amber-300">10 Wellen</strong> (1 Sektor-Kapitel) in deinem <strong className="text-white">aktuellen Run</strong> ab, um eine Singularitäts-Transmutation durchzuführen.
                </p>

                {/* Active Run Wave Requirement Bar */}
                <div className="w-full mt-3 p-3 ai-panel-slate text-left">
                  <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                    <span className="text-slate-300">Aktueller Run-Fortschritt:</span>
                    <span
                      className={`font-bold ${
                        prestigeReq.canPrestige ? 'text-emerald-300' : 'text-amber-300'
                      }`}
                    >
                      {prestigeReq.currentWaves} / {prestigeReq.requiredWaves} Wellen
                    </span>
                  </div>
                  <SciFiProgressBar
                    percent={Math.min(
                      100,
                      Math.round((prestigeReq.currentWaves / prestigeReq.requiredWaves) * 100)
                    )}
                    variant={prestigeReq.canPrestige ? 'emerald' : 'amber'}
                    heightClass="h-2"
                  />
                  {prestigeReq.canPrestige && (
                    <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-purple-200">
                      <span>Beute bei Transmutation:</span>
                      <span className="font-bold">
                        +{potentialPrestigeShards} QS · +{prestigeReq.relicFragmentsReward} Fragmente
                      </span>
                    </div>
                  )}
                </div>

                {prestigeMessage && (
                  <div className="mt-3 p-2.5 ai-panel-emerald text-emerald-200 text-xs font-bold w-full">
                    {prestigeMessage}
                  </div>
                )}

                <div className="w-full mt-4">
                  <SciFiButton
                    variant="amber"
                    size="lg"
                    active={prestigeReq.canPrestige}
                    disabled={!prestigeReq.canPrestige}
                    onClick={handlePrestige}
                    className="w-full"
                  >
                    <UI3DIcon src={UI_ASSETS.icons.quantumShard} size={18} />
                    <span>
                      {prestigeReq.canPrestige
                        ? `PRESTIGE STARTEN (+${potentialPrestigeShards} QS)`
                        : `NOCH ${Math.max(
                            0,
                            prestigeReq.requiredWaves - prestigeReq.currentWaves
                          )} WELLEN IM RUN BENÖTIGT`}
                    </span>
                  </SciFiButton>
                </div>

                <div className="w-full grid grid-cols-2 gap-2 mt-4 text-left text-xs font-mono">
                  <div className="p-2.5 ai-panel-amber">
                    <div className="text-[10px] text-slate-300">Aktueller Bonus</div>
                    <div className="font-black text-amber-300 mt-0.5">
                      +{paragonState.prestigeRank * 15}% DMG & Scrap
                    </div>
                  </div>
                  <div className="p-2.5 ai-panel-cyan">
                    <div className="text-[10px] text-slate-300">Schild & Hülle</div>
                    <div className="font-black text-cyan-300 mt-0.5">
                      +{paragonState.prestigeRank * 8}% Kapazität
                    </div>
                  </div>
                </div>
              </SciFiFrame>
            </div>

            {/* RIGHT: 4 PERMANENT SINGULARITY RELIC CARDS */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              <SciFiFrame variant="purple" className="p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <h4 className="text-sm font-black tracking-wider text-purple-200 uppercase">
                      PERMANENTE SINGULARITÄTS-RELIKTE
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Relikt-Karten bleiben über jeden Prestige-Reset hinweg dauerhaft aktiv.
                    </p>
                  </div>
                  <div className="px-3 py-1.5 ai-panel-amber text-xs font-mono font-bold text-amber-200 flex items-center gap-1.5">
                    <UI3DIcon src={UI_ASSETS.icons.quantumShard} size={15} />
                    <span>{paragonState.relicFragments} Fragmente</span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {SINGULARITY_RELIC_CARDS.map((relic) => {
                    const lv = paragonManager.getRelicLevel(relic.id);
                    const cost = paragonManager.getRelicUpgradeCost(relic.id);
                    const isMax = lv >= relic.maxLevel;
                    const canAfford = !isMax && paragonState.relicFragments >= cost;

                    return (
                      <div
                        key={relic.id}
                        className="p-3.5 ai-panel-slate flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-bold text-white">
                              {relic.name}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-amber-300">
                              · St.{lv}/{relic.maxLevel}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-0.5">{relic.description}</p>
                          <div className="text-[11px] font-mono font-bold text-emerald-300 mt-1">
                            Aktiver Bonus: +{lv * relic.bonusPerLevel}
                            {relic.unit}
                          </div>
                        </div>

                        <SciFiButton
                          variant={canAfford ? 'amber' : 'slate'}
                          size="sm"
                          active={canAfford}
                          disabled={!canAfford}
                          onClick={() => handleUpgradeRelic(relic.id)}
                          className="shrink-0"
                        >
                          <span>
                            {isMax ? 'MAX' : `${cost} Frag.`}
                          </span>
                        </SciFiButton>
                      </div>
                    );
                  })}
                </div>
              </SciFiFrame>
            </div>
          </div>
        )}
      </SciFiFrame>
    </div>
  );
};
