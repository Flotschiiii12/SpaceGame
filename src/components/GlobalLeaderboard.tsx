import React, { useState, useEffect } from 'react';
import { leaderboardClient, LeaderboardEntry, PersonalBest } from '../game/leaderboard.ts';
import { SHIP_CLASSES } from '../game/shipClasses.ts';
import { sound } from '../game/audio.ts';
import { UI_ASSETS } from '../game/assets.ts';
import { SciFiFrame, SciFiButton, UI3DIcon } from './SciFiFrame.tsx';
import { ItemArtwork } from './ItemArtwork.tsx';

interface GlobalLeaderboardProps {
  onClose?: () => void;
  currentCallsign?: string;
}

export const GlobalLeaderboard: React.FC<GlobalLeaderboardProps> = ({
  onClose,
  currentCallsign,
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(leaderboardClient.entries);
  const [personalBest, setPersonalBest] = useState<PersonalBest | null>(leaderboardClient.personalBest);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async (shipClass: string = selectedClass, timeframe: string = selectedTimeframe) => {
    setIsRefreshing(true);
    const data = await leaderboardClient.fetchLeaderboard({
      shipClass,
      timeframe,
    });
    setEntries([...data]);
    setPersonalBest(leaderboardClient.personalBest);
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadData(selectedClass, selectedTimeframe);

    const handleUpdate = (updated: LeaderboardEntry[]) => {
      setEntries([...updated]);
      setPersonalBest(leaderboardClient.personalBest);
    };

    leaderboardClient.onUpdated = handleUpdate;
    return () => {
      leaderboardClient.onUpdated = undefined;
    };
  }, [selectedClass, selectedTimeframe]);

  const handleClassChange = (cls: string) => {
    setSelectedClass(cls);
    sound.playUpgrade();
  };

  const handleTimeframeChange = (tf: string) => {
    setSelectedTimeframe(tf);
    sound.playUpgrade();
  };

  const filteredEntries = entries.filter((e) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      e.callsign.toLowerCase().includes(term) ||
      (e.guildTag && e.guildTag.toLowerCase().includes(term))
    );
  });

  const topThree = filteredEntries.slice(0, 3);

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="flex items-center gap-1 px-2.5 py-1 ai-btn-amber-active text-amber-200 text-xs font-mono font-bold">
          <UI3DIcon src={UI_ASSETS.icons.quantumShard} size={14} />
          <span>1ST</span>
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="flex items-center gap-1 px-2.5 py-1 ai-btn-cyan text-cyan-200 text-xs font-mono font-bold">
          <span>2ND</span>
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="flex items-center gap-1 px-2.5 py-1 ai-btn-amber text-amber-300 text-xs font-mono font-bold">
          <span>3RD</span>
        </span>
      );
    }
    return (
      <span className="text-xs font-mono text-slate-400 font-semibold px-2">
        #{String(rank).padStart(2, '0')}
      </span>
    );
  };

  const formatTimestamp = (ts: number) => {
    const diff = Date.now() - ts;
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-2 md:p-4 select-none animate-in fade-in duration-200">
      <SciFiFrame variant="cyan" className="shadow-2xl p-5 md:p-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold mb-1">
              <UI3DIcon src={UI_ASSETS.icons.quantumShard} size={16} />
              <span>Universal Combat Rankings</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">Live Global Synchronization</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2.5">
              <span>Galactic Ace High Scores</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Top surviving fleet captains ranked by highest mission score, deep-sector penetration, and kill counts.
            </p>
          </div>

          {/* Action controls (Refresh & Close) */}
          <div className="flex items-center gap-2.5">
            <SciFiButton
              variant="cyan"
              onClick={() => loadData()}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono"
            >
              <UI3DIcon src={UI_ASSETS.icons.autopilot} size={14} className={isRefreshing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </SciFiButton>
            {onClose && (
              <SciFiButton
                variant="rose"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-mono font-bold uppercase"
              >
                ESC
              </SciFiButton>
            )}
          </div>
        </div>

        {/* Top 3 Podium Highlights with Real 3D Ship Sprite Artwork */}
        {topThree.length >= 3 && !searchTerm && selectedClass === 'all' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-5">
            {/* 2nd Place */}
            {(() => {
              const shipMeta = SHIP_CLASSES[topThree[1].shipClass as keyof typeof SHIP_CLASSES] || SHIP_CLASSES.vanguard_mk1;
              return (
                <SciFiFrame variant="cyan" className="order-2 md:order-1 p-4 flex flex-col justify-between relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono text-cyan-300 font-bold flex items-center gap-1.5">
                      2ND PLACE ACE
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      {formatTimestamp(topThree[1].timestamp)}
                    </span>
                  </div>
                  <div className="my-2 flex items-center gap-3">
                    <ItemArtwork item={shipMeta} size={48} animate />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-white truncate">{topThree[1].callsign}</span>
                        {topThree[1].guildTag && (
                          <span className="px-1.5 py-0.5 ai-btn-slate text-slate-300 text-[10px] font-mono">
                            [{topThree[1].guildTag}]
                          </span>
                        )}
                      </div>
                      <div className="text-xl font-bold font-mono text-slate-200 mt-0.5 tabular-nums">
                        {topThree[1].score.toLocaleString()}{' '}
                        <span className="text-xs text-slate-400 font-normal">PTS</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <span>Sector 0{topThree[1].sector} · Wave {topThree[1].wave}</span>
                    <span className="text-cyan-400">{topThree[1].kills} kills</span>
                  </div>
                </SciFiFrame>
              );
            })()}

            {/* 1st Place Champion */}
            {(() => {
              const shipMeta = SHIP_CLASSES[topThree[0].shipClass as keyof typeof SHIP_CLASSES] || SHIP_CLASSES.vanguard_mk1;
              return (
                <SciFiFrame variant="amber" className="order-1 md:order-2 p-4.5 flex flex-col justify-between relative transform md:-translate-y-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-amber-300 font-extrabold flex items-center gap-1.5">
                      <UI3DIcon src={UI_ASSETS.icons.quantumShard} size={16} /> SUPREME CHAMPION
                    </span>
                    <span className="text-xs font-mono text-amber-400/70">
                      {formatTimestamp(topThree[0].timestamp)}
                    </span>
                  </div>
                  <div className="my-2 flex items-center gap-3">
                    <ItemArtwork item={shipMeta} size={56} animate />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-amber-100 truncate">{topThree[0].callsign}</span>
                        {topThree[0].guildTag && (
                          <span className="px-1.5 py-0.5 ai-btn-amber text-amber-300 text-[10px] font-mono">
                            [{topThree[0].guildTag}]
                          </span>
                        )}
                      </div>
                      <div className="text-2xl font-black font-mono text-amber-400 mt-0.5 tabular-nums">
                        {topThree[0].score.toLocaleString()}{' '}
                        <span className="text-xs text-amber-300/80 font-normal">PTS</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-mono text-slate-300 flex items-center justify-between pt-2 border-t border-amber-500/20">
                    <span>Sector 0{topThree[0].sector} · Wave {topThree[0].wave}</span>
                    <span className="text-amber-300 font-bold">{topThree[0].kills} kills</span>
                  </div>
                </SciFiFrame>
              );
            })()}

            {/* 3rd Place */}
            {(() => {
              const shipMeta = SHIP_CLASSES[topThree[2].shipClass as keyof typeof SHIP_CLASSES] || SHIP_CLASSES.vanguard_mk1;
              return (
                <SciFiFrame variant="purple" className="order-3 md:order-3 p-4 flex flex-col justify-between relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono text-purple-300 font-bold flex items-center gap-1.5">
                      3RD PLACE ACE
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      {formatTimestamp(topThree[2].timestamp)}
                    </span>
                  </div>
                  <div className="my-2 flex items-center gap-3">
                    <ItemArtwork item={shipMeta} size={48} animate />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-white truncate">{topThree[2].callsign}</span>
                        {topThree[2].guildTag && (
                          <span className="px-1.5 py-0.5 ai-btn-slate text-slate-300 text-[10px] font-mono">
                            [{topThree[2].guildTag}]
                          </span>
                        )}
                      </div>
                      <div className="text-xl font-bold font-mono text-amber-300/90 mt-0.5 tabular-nums">
                        {topThree[2].score.toLocaleString()}{' '}
                        <span className="text-xs text-slate-400 font-normal">PTS</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <span>Sector 0{topThree[2].sector} · Wave {topThree[2].wave}</span>
                    <span className="text-cyan-400">{topThree[2].kills} kills</span>
                  </div>
                </SciFiFrame>
              );
            })()}
          </div>
        )}

        {/* Filter Toolbar & Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-4">
          {/* Class Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {['all', 'interceptor', 'cruiser', 'phantom', 'dreadnought'].map((cls) => {
              const isActive = selectedClass === cls;
              return (
                <SciFiButton
                  key={cls}
                  variant="cyan"
                  active={isActive}
                  onClick={() => handleClassChange(cls)}
                  className="px-3 py-1 text-xs font-mono capitalize whitespace-nowrap"
                >
                  {cls === 'all' ? 'All Hulls' : cls}
                </SciFiButton>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {/* Timeframe switch */}
            <div className="flex items-center gap-1">
              <SciFiButton
                variant="slate"
                active={selectedTimeframe === 'all'}
                onClick={() => handleTimeframeChange('all')}
                className="px-2.5 py-1 text-xs font-mono"
              >
                All-Time
              </SciFiButton>
              <SciFiButton
                variant="cyan"
                active={selectedTimeframe === 'today'}
                onClick={() => handleTimeframeChange('today')}
                className="px-2.5 py-1 text-xs font-mono"
              >
                Today
              </SciFiButton>
            </div>

            {/* Pilot Callsign Search */}
            <input
              type="text"
              placeholder="Filter pilot / guild..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1.5 ai-panel-slate text-xs font-mono text-white placeholder-slate-500 focus:outline-none w-36 sm:w-44"
            />
          </div>
        </div>

        {/* High Scores Leaderboard Table */}
        <SciFiFrame variant="slate" className="overflow-hidden max-h-80 overflow-y-auto p-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-950/90 text-slate-400 text-[11px] font-mono uppercase tracking-wider sticky top-0 border-b border-slate-800 z-10">
              <tr>
                <th className="py-2.5 px-4 w-16">Rank</th>
                <th className="py-2.5 px-4">Pilot Callsign</th>
                <th className="py-2.5 px-4 hidden sm:table-cell">Ship Class</th>
                <th className="py-2.5 px-4 hidden md:table-cell">Sector & Wave</th>
                <th className="py-2.5 px-4 hidden sm:table-cell">Kills</th>
                <th className="py-2.5 px-4 text-right">Score</th>
                <th className="py-2.5 px-4 text-right hidden lg:table-cell">Achieved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
              {filteredEntries.map((entry) => {
                const isCurrentPlayer =
                  currentCallsign &&
                  entry.callsign.toLowerCase() === currentCallsign.toLowerCase();
                const shipMeta = SHIP_CLASSES[entry.shipClass as keyof typeof SHIP_CLASSES] || SHIP_CLASSES.vanguard_mk1;

                return (
                  <tr
                    key={entry.id}
                    className={`transition-colors ${
                      isCurrentPlayer
                        ? 'bg-cyan-950/40 hover:bg-cyan-950/60 ring-1 ring-inset ring-cyan-500/30'
                        : 'hover:bg-slate-900/50'
                    }`}
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getRankBadge(entry.rank || 0)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${isCurrentPlayer ? 'text-cyan-300 font-bold' : 'text-white'}`}>
                          {entry.callsign}
                        </span>
                        {entry.guildTag && (
                          <span className="px-1.5 py-0.2 ai-btn-slate text-slate-300 text-[10px]">
                            [{entry.guildTag}]
                          </span>
                        )}
                        {isCurrentPlayer && (
                          <span className="text-[10px] ai-btn-cyan text-cyan-300 px-1.5 py-0.2 font-sans font-medium">
                            YOU
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <ItemArtwork item={shipMeta} size={28} />
                        <span className="text-slate-300 capitalize text-xs">
                          {shipMeta?.name || entry.shipClass}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell text-slate-300">
                      Sector 0{entry.sector} <span className="text-slate-600">·</span> Wave {entry.wave}
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell text-slate-400 tabular-nums">
                      {entry.kills.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-bold text-white tabular-nums text-sm">
                        {entry.score.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 hidden lg:table-cell text-[11px]">
                      {formatTimestamp(entry.timestamp)}
                    </td>
                  </tr>
                );
              })}
              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500 text-xs font-mono">
                    No flight records found matching the active filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </SciFiFrame>

        {/* Personal Best Sticky Bar */}
        <SciFiFrame variant="cyan" className="mt-4 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 ai-thumb-cyan flex items-center justify-center">
              <UI3DIcon src={UI_ASSETS.icons.quantumShard} size={18} />
            </div>
            <div>
              <div className="text-xs font-mono font-semibold text-white flex items-center gap-2">
                <span>Personal Best Combat Record</span>
                {personalBest?.rank && (
                  <span className="px-1.5 py-0.2 ai-btn-cyan text-cyan-300 text-[10px]">
                    Global Rank #{personalBest.rank}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                {personalBest
                  ? `Achieved in Sector 0${personalBest.sector} · Wave ${personalBest.wave} (${personalBest.kills} hostiles vaporized)`
                  : 'No combat runs recorded yet. Launch your ship to set a personal high score!'}
              </div>
            </div>
          </div>

          <div className="text-right self-end sm:self-auto font-mono">
            <span className="text-xs text-slate-400 block sm:inline mr-2">High Score:</span>
            <span className="text-base font-bold text-amber-400 tabular-nums">
              {personalBest ? personalBest.score.toLocaleString() : 0} PTS
            </span>
          </div>
        </SciFiFrame>
      </SciFiFrame>
    </div>
  );
};
