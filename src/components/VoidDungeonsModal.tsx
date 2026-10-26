import React from 'react';
import { VOID_DUNGEONS, equipmentManager } from '../game/equipment.ts';
import { VoidDungeon } from '../game/types.ts';
import { sound } from '../game/audio.ts';
import { UI_ASSETS, getStargateSectorBannerUrl } from '../game/assets.ts';
import { SciFiFrame, SciFiButton, UI3DIcon } from './SciFiFrame.tsx';

interface VoidDungeonsModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onLaunchDungeon: (dungeon: VoidDungeon) => void;
  isEmbedded?: boolean;
}

export const VoidDungeonsModal: React.FC<VoidDungeonsModalProps> = ({
  isOpen = true,
  onClose,
  onLaunchDungeon,
  isEmbedded = false,
}) => {
  if (!isEmbedded && !isOpen) return null;

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'mythic':
        return (
          <span className="px-2.5 py-0.5 ai-btn-active-rose text-rose-100 font-mono text-[10px] font-black">
            MYTHIC RAID
          </span>
        );
      case 'heroic':
        return (
          <span className="px-2.5 py-0.5 ai-btn-active-purple text-purple-100 font-mono text-[10px] font-black">
            HEROIC
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 ai-btn-active-cyan text-cyan-100 font-mono text-[10px] font-black">
            NORMAL
          </span>
        );
    }
  };

  const containerClasses = isEmbedded
    ? 'w-full text-left'
    : 'fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none';

  return (
    <div className={containerClasses}>
      <SciFiFrame
        variant="rose"
        glowIntensity="medium"
        className={
          isEmbedded
            ? 'w-full p-3.5'
            : 'w-full max-w-4xl p-6 relative max-h-[90vh] overflow-y-auto text-left'
        }
      >
        {!isEmbedded && (
          <SciFiButton
            variant="rose"
            size="sm"
            onClick={onClose}
            className="absolute top-4 right-4"
          >
            <span>X</span>
          </SciFiButton>
        )}

        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-mono px-2.5 py-0.5 ai-btn-rose text-rose-200 font-bold">
              EXPEDITION PROTOCOL
            </span>
            <span className="text-xs text-slate-300 font-mono">Deep Space Void Rifts</span>
          </div>
          <h2 className="text-xl font-black text-white uppercase">
            Void Dungeons & Derelict Vaults
          </h2>
          <p className="text-xs text-slate-300">
            High-risk tactical incursions into corrupted derelict superstructures. Defeat fortified elite waves to extract rare blueprints and dark matter caches.
          </p>
        </div>

        {/* 3D Dungeon Cards */}
        <div className="space-y-3">
          {VOID_DUNGEONS.map((dungeon) => {
            const isSectorUnlocked = equipmentManager.isSectorUnlocked(dungeon.sector);

            return (
              <SciFiFrame
                key={dungeon.id}
                variant={isSectorUnlocked ? 'rose' : 'slate'}
                className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  !isSectorUnlocked ? 'opacity-65' : ''
                }`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <img
                    src={getStargateSectorBannerUrl(dungeon.sector)}
                    alt={dungeon.name}
                    referrerPolicy="no-referrer"
                    className="w-20 h-14 object-cover shrink-0"
                  />
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-sm font-black text-white">{dungeon.name}</span>
                      {getDifficultyBadge(dungeon.difficulty)}
                      <span className="text-[11px] font-mono text-slate-300">
                        Sector {dungeon.sector} Origin · {dungeon.wavesCount} Boss Waves
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{dungeon.description}</p>

                    <div className="flex items-center gap-4 text-xs font-mono pt-1 text-slate-200 flex-wrap">
                      <span className="flex items-center gap-1 text-amber-300 font-bold">
                        <UI3DIcon src={UI_ASSETS.icons.scrap} size={15} />
                        +{dungeon.rewardScrap.toLocaleString()} Scrap
                      </span>
                      <span className="flex items-center gap-1 text-purple-300 font-bold">
                        <UI3DIcon src={UI_ASSETS.icons.darkMatter} size={15} />
                        +{dungeon.rewardDarkMatter} Dark Matter
                      </span>
                      <span className="flex items-center gap-1 text-cyan-300 font-bold">
                        <UI3DIcon src={UI_ASSETS.icons.quantumShard} size={15} />
                        Blueprint: {dungeon.blueprintReward}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0 flex items-center gap-3">
                  {isSectorUnlocked ? (
                    <SciFiButton
                      variant="rose"
                      size="md"
                      active
                      onClick={() => {
                        sound.playUpgrade();
                        onLaunchDungeon(dungeon);
                      }}
                    >
                      <UI3DIcon src={UI_ASSETS.icons.bossSkull} size={18} />
                      <span>Launch Incursion</span>
                    </SciFiButton>
                  ) : (
                    <div className="text-xs font-mono text-slate-300 px-3 py-1.5 ai-btn-slate flex items-center gap-1.5">
                      <UI3DIcon src={UI_ASSETS.icons.lock} size={14} />
                      <span>Requires Sector {dungeon.sector}</span>
                    </div>
                  )}
                </div>
              </SciFiFrame>
            );
          })}
        </div>
      </SciFiFrame>
    </div>
  );
};
