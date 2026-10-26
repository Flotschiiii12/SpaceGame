import React, { useEffect } from 'react';
import { equipmentManager, STARGATE_SECTORS } from '../game/equipment.ts';
import { paragonManager } from '../game/paragon.ts';
import { UI_ASSETS } from '../game/assets.ts';
import { formatCompactNumber } from '../game/formatters.ts';
import { SciFiFrame, SciFiButton, UI3DIcon } from './SciFiFrame.tsx';

interface GameOverModalProps {
  stats: {
    score: number;
    kills: number;
    sector: number;
    wave: number;
    scrap: number;
  };
  onPlayAgain: (startSector?: number) => void;
  onReturnToHangar: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  onPlayAgain,
  onReturnToHangar,
}) => {
  const unlocked = Array.from(equipmentManager.unlockedSectors);
  const highestSector = Math.max(...unlocked, 1);
  const checkpointSector =
    stats.sector > 1 && unlocked.includes(stats.sector) ? stats.sector : highestSector;
  const sectorInfo = STARGATE_SECTORS.find((s) => s.sectorNumber === checkpointSector);
  const pState = paragonManager.getState();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onPlayAgain(checkpointSector);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onPlayAgain, checkpointSector]);

  return (
    <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-6 select-none">
      <SciFiFrame
        variant="rose"
        glowIntensity="high"
        className="w-full max-w-md p-6 text-center"
      >
        <div className="w-16 h-16 mx-auto mb-3 ai-thumb-active-rose flex items-center justify-center">
          <UI3DIcon src={UI_ASSETS.icons.bossSkull} size={36} />
        </div>

        <h2 className="text-xs font-mono uppercase tracking-widest text-rose-300 font-bold mb-1">
          HULL BREACH DETECTED
        </h2>
        <h3 className="text-2xl font-black tracking-wider text-white mb-5 uppercase">
          MISSION DEBRIEF
        </h3>

        {/* 3D Telemetry Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5 text-left">
          <div className="ai-panel-cyan p-3">
            <span className="text-[10px] font-mono text-cyan-200/80 block mb-1">FINAL SCORE</span>
            <span className="text-lg font-black text-white tabular-nums font-mono">
              {formatCompactNumber(stats.score)}
            </span>
          </div>

          <div className="ai-panel-rose p-3">
            <span className="text-[10px] font-mono text-rose-200/80 block mb-1">
              HOSTILES VAPORIZED
            </span>
            <span className="text-lg font-black text-rose-200 tabular-nums font-mono">
              {formatCompactNumber(stats.kills)}
            </span>
          </div>

          <div className="ai-panel-amber p-3">
            <span className="text-[10px] font-mono text-amber-200/80 block mb-1">SECTOR REACHED</span>
            <span className="text-base font-black text-amber-200 tabular-nums font-mono">
              Sector {stats.sector} · Wave {stats.wave}
            </span>
          </div>

          <div className="ai-panel-purple p-3">
            <span className="text-[10px] font-mono text-purple-200/80 block mb-1">
              PARAGON & SHARDS
            </span>
            <span className="text-base font-black text-purple-200 tabular-nums font-mono flex items-center gap-1.5">
              <UI3DIcon src={UI_ASSETS.icons.quantumShard} size={16} />
              Lv.{pState.paragonLevel} ({formatCompactNumber(pState.quantumShards)})
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {checkpointSector > 1 ? (
            <>
              <SciFiButton
                variant="cyan"
                size="lg"
                active
                onClick={() => onPlayAgain(checkpointSector)}
                className="w-full"
              >
                <UI3DIcon src={UI_ASSETS.icons.hangar} size={18} />
                <span>
                  Resume Sector {checkpointSector} ({sectorInfo?.name || 'Waypoint'})
                </span>
              </SciFiButton>
              <SciFiButton
                variant="slate"
                size="md"
                onClick={() => onPlayAgain(1)}
                className="w-full"
              >
                <UI3DIcon src={UI_ASSETS.icons.rifts} size={16} />
                <span>Restart Run from Sector 1</span>
              </SciFiButton>
            </>
          ) : (
            <SciFiButton
              variant="cyan"
              size="lg"
              active
              onClick={() => onPlayAgain(1)}
              className="w-full"
            >
              <UI3DIcon src={UI_ASSETS.icons.hangar} size={18} />
              <span>Erneut Starten (Sektor 1)</span>
            </SciFiButton>
          )}

          <SciFiButton
            variant="amber"
            size="md"
            onClick={onReturnToHangar}
            className="w-full"
          >
            <UI3DIcon src={UI_ASSETS.icons.hq} size={18} />
            <span>Zurück zur Sternenbasis</span>
          </SciFiButton>
        </div>
      </SciFiFrame>
    </div>
  );
};
