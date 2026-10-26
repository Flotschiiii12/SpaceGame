import React, { useState, useEffect } from 'react';
import { dailyMissions, DailyMission, DailyMissionsState } from '../game/missions.ts';
import { sound } from '../game/audio.ts';
import { UI_ASSETS } from '../game/assets.ts';
import { SciFiFrame, SciFiButton, SciFiProgressBar, UI3DIcon } from './SciFiFrame.tsx';

interface DailyMissionsProps {
  scrap: number;
  darkMatter: number;
  onCurrencyChange: (newScrap: number, newDarkMatter: number) => void;
  onClose?: () => void;
}

export const DailyMissions: React.FC<DailyMissionsProps> = ({
  scrap,
  darkMatter,
  onCurrencyChange,
}) => {
  const [missionsState, setMissionsState] = useState<DailyMissionsState>(dailyMissions.state);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(dailyMissions.getSecondsUntilReset());
  const [claimCelebration, setClaimCelebration] = useState<string | null>(null);

  useEffect(() => {
    dailyMissions.initOrRefresh();
    setMissionsState({ ...dailyMissions.state });

    const handleStateChange = (newState: DailyMissionsState) => {
      setMissionsState({ ...newState });
    };
    dailyMissions.onStateChanged = handleStateChange;

    const timer = setInterval(() => {
      setSecondsRemaining(dailyMissions.getSecondsUntilReset());
    }, 1000);

    return () => {
      clearInterval(timer);
      dailyMissions.onStateChanged = undefined;
    };
  }, []);

  const formatCountdown = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleClaim = (mission: DailyMission) => {
    const reward = dailyMissions.claimReward(mission.id);
    if (reward) {
      onCurrencyChange(scrap + reward.scrap, darkMatter + reward.darkMatter);
      sound.playUpgrade();
      setClaimCelebration(`+${reward.scrap} Scrap · +${reward.darkMatter} Dark Matter Claimed!`);
      setTimeout(() => setClaimCelebration(null), 3500);
    }
  };

  const handleClaimDailyBonus = () => {
    const bonus = dailyMissions.claimDailyBonus();
    if (bonus) {
      onCurrencyChange(scrap + bonus.scrap, darkMatter + bonus.darkMatter);
      sound.playUpgrade();
      setClaimCelebration(`+${bonus.scrap} Scrap · +${bonus.darkMatter} Dark Matter Daily Sweep Bonus Claimed!`);
      setTimeout(() => setClaimCelebration(null), 3500);
    }
  };

  const getMissionIcon = (iconName: string) => {
    switch (iconName) {
      case 'Crosshair':
        return <UI3DIcon src={UI_ASSETS.icons.missile} size={26} />;
      case 'Flame':
        return <UI3DIcon src={UI_ASSETS.icons.bossSkull} size={26} />;
      case 'Shield':
        return <UI3DIcon src={UI_ASSETS.icons.shield} size={26} />;
      case 'Zap':
        return <UI3DIcon src={UI_ASSETS.icons.ultimate} size={26} />;
      case 'Award':
      default:
        return <UI3DIcon src={UI_ASSETS.icons.darkMatter} size={26} />;
    }
  };

  const completedCount = missionsState.missions.filter((m) => m.completed).length;
  const allCompleted = completedCount === 3;

  return (
    <div className="w-full max-w-4xl mx-auto p-1 select-none">
      <SciFiFrame variant="amber" className="p-4">
        {/* Header & Reset Countdown */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-300 font-bold mb-1">
              <UI3DIcon src={UI_ASSETS.icons.scrap} size={16} />
              <span>Daily Flight Directives</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-300">{missionsState.date}</span>
            </div>
            <h2 className="text-lg font-black text-white flex items-center gap-2 uppercase">
              Reconnaissance Protocols
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Complete the three daily missions during combat runs to unlock high-yield scrap & dark matter caches.
            </p>
          </div>

          <div className="ai-panel-cyan px-3.5 py-2 flex items-center gap-2 text-xs font-mono">
            <UI3DIcon src={UI_ASSETS.icons.autopilot} size={20} />
            <div>
              <span className="text-[9px] text-cyan-300 block leading-none">CYCLE RESET IN</span>
              <span className="text-white font-black tabular-nums text-sm">
                {formatCountdown(secondsRemaining)}
              </span>
            </div>
          </div>
        </div>

        {/* Floating Celebration Toast */}
        {claimCelebration && (
          <div className="my-2 p-3 ai-panel-amber text-center text-xs font-mono font-bold text-amber-200 flex items-center justify-center gap-2">
            <UI3DIcon src={UI_ASSETS.icons.quantumShard} size={18} />
            <span>{claimCelebration}</span>
          </div>
        )}

        {/* 3 Mission Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-3">
          {missionsState.missions.map((mission) => {
            const isCompleted = mission.completed;
            const isClaimed = mission.claimed;
            const pct = Math.min(100, Math.round((mission.progress / mission.target) * 100));

            return (
              <SciFiFrame
                key={mission.id}
                variant={isClaimed ? 'slate' : isCompleted ? 'cyan' : 'amber'}
                className={`p-3.5 flex flex-col justify-between ${isClaimed ? 'opacity-75' : ''}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="w-11 h-11 ai-thumb-cyan flex items-center justify-center">
                      {getMissionIcon(mission.icon)}
                    </div>
                    {isClaimed ? (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-300 ai-btn-emerald px-2.5 py-0.5 font-bold">
                        Claimed
                      </span>
                    ) : isCompleted ? (
                      <span className="text-[10px] font-mono font-black text-cyan-100 ai-btn-active-cyan px-2.5 py-0.5 animate-pulse">
                        Ready!
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-300 ai-btn-slate px-2.5 py-0.5">
                        In Flight
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-black text-white mb-1">{mission.title}</h3>
                  <p className="text-xs text-slate-300 mb-3 leading-relaxed">{mission.description}</p>
                </div>

                <div>
                  {/* 3D Progress Bar & Value */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs font-mono mb-1">
                      <span className="text-slate-300">Progress</span>
                      <span className="text-white font-bold tabular-nums">
                        {Math.floor(mission.progress).toLocaleString()} / {mission.target.toLocaleString()}
                      </span>
                    </div>
                    <SciFiProgressBar
                      percent={pct}
                      variant={isCompleted ? 'emerald' : 'cyan'}
                      heightClass="h-2.5"
                    />
                  </div>

                  {/* Rewards & Claim Button */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="flex items-center gap-1 text-amber-300 font-bold">
                        <UI3DIcon src={UI_ASSETS.icons.scrap} size={14} />
                        +{mission.rewardScrap}
                      </span>
                      <span className="flex items-center gap-1 text-purple-300 font-bold">
                        <UI3DIcon src={UI_ASSETS.icons.darkMatter} size={14} />
                        +{mission.rewardDarkMatter}
                      </span>
                    </div>

                    {isCompleted && !isClaimed && (
                      <SciFiButton
                        variant="cyan"
                        size="sm"
                        active
                        onClick={() => handleClaim(mission)}
                      >
                        <span>Claim</span>
                      </SciFiButton>
                    )}
                  </div>
                </div>
              </SciFiFrame>
            );
          })}
        </div>

        {/* Daily Sweep Complete Bonus */}
        <SciFiFrame
          variant={allCompleted ? 'amber' : 'slate'}
          className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 ai-thumb-active-amber flex items-center justify-center">
              <UI3DIcon src={UI_ASSETS.icons.hq} size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white">Full Sector Recon Sweep</span>
                <span className="text-xs font-mono text-cyan-300 font-bold">
                  ({completedCount}/3 Directives)
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Complete all 3 missions before the cycle resets to unlock the grand bonus (+1,200 Scrap · +35 Dark Matter).
              </p>
            </div>
          </div>

          <div>
            {missionsState.bonusClaimed ? (
              <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-300 font-bold ai-btn-emerald px-3 py-2">
                Grand Bonus Claimed
              </span>
            ) : allCompleted ? (
              <SciFiButton
                variant="amber"
                size="md"
                active
                onClick={handleClaimDailyBonus}
              >
                <span>Claim Grand Bonus (+1,200 SCR + 35 DM)</span>
              </SciFiButton>
            ) : (
              <div className="text-xs font-mono text-slate-300 ai-btn-slate px-3 py-2">
                Complete all 3 missions to unlock
              </div>
            )}
          </div>
        </SciFiFrame>
      </SciFiFrame>
    </div>
  );
};
