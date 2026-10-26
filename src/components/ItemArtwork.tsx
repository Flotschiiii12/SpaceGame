import React, { useEffect, useState } from 'react';
import { getShipConfig } from '../game/shipClasses.ts';
import { equipmentManager } from '../game/equipment.ts';
import {
  assetManager,
  GAME_ASSETS,
  UI_ASSETS,
  getIndividualShipSpriteUrl,
  getIndividualEquipmentSpriteUrl,
} from '../game/assets.ts';

interface ItemArtworkProps {
  id?: string;
  itemId?: string;
  item?: {
    id?: string;
    name?: string;
    tier?: number;
    primaryColor?: string;
    spriteAssetPath?: string;
    spriteUrl?: string;
  };
  animate?: boolean;
  category?:
    | 'ship'
    | 'skin'
    | 'laser'
    | 'trail'
    | 'hangar'
    | 'primary'
    | 'secondary'
    | 'weapon'
    | 'missile'
    | 'shield'
    | 'drone'
    | 'upgrade'
    | 'tech';
  color?: string;
  accentColor?: string;
  size?: number;
  className?: string;
}

export const CustomStarIcon: React.FC<{ className?: string; color?: string }> = ({
  className = 'w-4 h-4',
}) => (
  <img
    src={UI_ASSETS.icons.quantumShard}
    alt=""
    referrerPolicy="no-referrer"
    className={`object-contain select-none pointer-events-none shrink-0 ${className}`}
  />
);

export const ItemArtwork: React.FC<ItemArtworkProps> = ({
  id: rawId,
  itemId,
  item,
  category,
  color = '#22d3ee',
  accentColor = '#f59e0b',
  size = 52,
  className = '',
}) => {
  const [, setAssetTick] = useState(0);

  useEffect(() => {
    return assetManager.onReadyChange(() => {
      setAssetTick((t) => t + 1);
    });
  }, []);

  const id = rawId || itemId || item?.id || 'default';
  const eqItem = equipmentManager.getEquipmentItem(id);

  const getPrimaryColor = (): string => {
    if (item?.primaryColor) return item.primaryColor;
    if (eqItem?.color) return eqItem.color;
    if (id.includes('obsidian') || id.includes('void') || id.includes('darkMatter')) return '#a855f7';
    if (id.includes('aurum') || id.includes('solar') || id.includes('critDamage') || id.includes('scrap')) return '#fbbf24';
    if (id.includes('crimson') || id.includes('ember') || id.includes('damage') || id.includes('boss') || id.includes('plasma')) return '#ef4444';
    if (id.includes('frostbite') || id.includes('shield') || id.includes('aegis') || id.includes('aiPilot')) return '#38bdf8';
    if (id.includes('cyber') || id.includes('warp') || id.includes('tachyon') || id.includes('phase')) return '#ec4899';
    if (id.includes('emerald') || id.includes('matrix') || id.includes('nanite') || id.includes('hull')) return '#10b981';
    if (id.includes('smoke')) return '#94a3b8';
    return color;
  };

  const c1 = getPrimaryColor();
  const c2 = eqItem?.secondaryColor || accentColor || '#ffffff';

  // 1. REAL 3D RENDERED INDIVIDUAL PNG SPRITES FOR ALL 50 SHIPS (ship_01 .. ship_50) WITH CLEAN ALPHA BACKGROUND REMOVAL
  if (category === 'ship' || id.startsWith('ship_') || item?.id?.startsWith('ship_')) {
    const ship = getShipConfig(id);
    const sc1 = ship.primaryColor;
    const spriteUrl =
      assetManager.getShipDataUrl(ship) ||
      item?.spriteAssetPath ||
      item?.spriteUrl ||
      ship.spriteAssetPath ||
      getIndividualShipSpriteUrl(ship.id);

    return (
      <div
        className={`relative flex items-center justify-center select-none overflow-hidden rounded-xl bg-slate-950/90 border border-slate-800/90 shadow-inner ${className}`}
        style={{
          width: size,
          height: size,
          borderColor: `${sc1}40`,
        }}
      >
        <img
          src={spriteUrl}
          alt={ship.name}
          referrerPolicy="no-referrer"
          className="w-[82%] h-[82%] object-contain pointer-events-none select-none"
          style={{
            filter: `drop-shadow(0 0 5px ${ship.engineGlow}75)`,
          }}
        />
        {size >= 34 && (
          <span
            className="absolute bottom-0.5 right-1 text-[8px] font-mono font-bold px-1 rounded bg-slate-950/85 leading-tight"
            style={{ color: sc1 }}
          >
            T{ship.tier}
          </span>
        )}
      </div>
    );
  }

  // 2. REAL 3D RENDERED INDIVIDUAL PNG SPRITES FOR ALL 20 LASERS, 20 SHIELDS, 20 DRONES & 4 MISSILES
  if (
    eqItem ||
    category === 'primary' ||
    category === 'weapon' ||
    category === 'shield' ||
    category === 'drone' ||
    category === 'missile' ||
    category === 'secondary' ||
    id.startsWith('laser_') ||
    id.startsWith('shield_') ||
    id.startsWith('drone_')
  ) {
    const resolvedItem =
      eqItem ||
      equipmentManager.getEquipmentItem(
        category === 'shield'
          ? 'shield_01'
          : category === 'drone'
          ? 'drone_01'
          : category === 'missile' || category === 'secondary'
          ? 'valkyrie_swarm_pods'
          : 'laser_01'
      )!;

    const eqSpriteUrl =
      assetManager.getEquipmentDataUrl(resolvedItem) ||
      getIndividualEquipmentSpriteUrl(resolvedItem);

    return (
      <div
        className={`relative flex items-center justify-center select-none overflow-hidden rounded-xl bg-slate-950/90 border border-slate-800/90 shadow-inner ${className}`}
        style={{
          width: size,
          height: size,
          borderColor: `${c1}40`,
        }}
      >
        <img
          src={eqSpriteUrl}
          alt={resolvedItem.name}
          referrerPolicy="no-referrer"
          className="w-[80%] h-[80%] object-contain pointer-events-none select-none"
          style={{
            filter: `drop-shadow(0 0 5px ${c1}75)`,
          }}
        />
        {size >= 34 && (
          <span
            className="absolute bottom-0.5 right-1 text-[8px] font-mono font-bold px-1 rounded bg-slate-950/85 leading-tight"
            style={{ color: c1 }}
          >
            T{resolvedItem.tier}
          </span>
        )}
      </div>
    );
  }

  // 3. COSMETIC HULL SKINS, LASER CRYSTALS, TRAILS, HANGAR RELICS & ENGINEERING UPGRADES
  let base3DAsset: string = '/assets/sprites/shields/shield_12.png';
  if (category === 'skin' || id.startsWith('skin-')) {
    base3DAsset = '/assets/sprites/ships/ship_18.png';
  } else if (category === 'laser' || id.startsWith('laser-') || id.includes('weapon') || id.includes('fireRate')) {
    base3DAsset = '/assets/sprites/lasers/laser_14.png';
  } else if (category === 'trail' || id.startsWith('trail-') || id.includes('warp')) {
    base3DAsset = '/assets/sprites/ships/ship_05.png';
  } else if (category === 'hangar' || id.startsWith('hangar-')) {
    base3DAsset = GAME_ASSETS.environment.starbase;
  } else if (id.includes('shield') || id.includes('hull') || id.includes('aegis')) {
    base3DAsset = '/assets/sprites/shields/shield_15.png';
  } else if (id.includes('drone') || id.includes('aiPilot')) {
    base3DAsset = '/assets/sprites/drones/drone_15.png';
  } else if (id.includes('scrap') || id.includes('magnet')) {
    base3DAsset = UI_ASSETS.icons.scrap;
  } else if (id.includes('darkMatter')) {
    base3DAsset = UI_ASSETS.icons.darkMatter;
  } else if (id.includes('boss') || id.includes('damage') || id.includes('crit')) {
    base3DAsset = '/assets/sprites/lasers/laser_19.png';
  }

  return (
    <div
      className={`relative flex items-center justify-center select-none overflow-hidden rounded-xl bg-slate-950/90 border border-slate-800/90 shadow-inner ${className}`}
      style={{
        width: size,
        height: size,
        borderColor: `${c1}40`,
      }}
    >
      <img
        src={base3DAsset}
        alt={id}
        referrerPolicy="no-referrer"
        className="w-[80%] h-[80%] object-contain pointer-events-none select-none"
        style={{
          filter: `drop-shadow(0 0 6px ${c1}80) drop-shadow(0 0 2px ${c2}60)`,
        }}
      />
    </div>
  );
};
