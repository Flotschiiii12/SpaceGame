import React, { useState } from 'react';
import {
  equipmentManager,
  EQUIPMENT_CATALOGUE,
} from '../game/equipment.ts';
import { getShipConfig } from '../game/shipClasses.ts';
import { paragonManager } from '../game/paragon.ts';
import { EquipmentItem, ShipClassId } from '../game/types.ts';
import { sound } from '../game/audio.ts';
import { UI_ASSETS } from '../game/assets.ts';
import { formatCompactNumber } from '../game/formatters.ts';
import { SciFiFrame, SciFiButton, UI3DIcon } from './SciFiFrame.tsx';
import { ItemArtwork } from './ItemArtwork.tsx';

interface ArmoryFittingModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  selectedShipId?: ShipClassId;
  scrap: number;
  darkMatter: number;
  onCurrencyChange: (newScrap: number, newDarkMatter: number) => void;
  onParagonChange?: () => void;
  isEmbedded?: boolean;
}

export const ArmoryFittingModal: React.FC<ArmoryFittingModalProps> = ({
  isOpen = true,
  onClose,
  selectedShipId = 'ship_01',
  scrap,
  darkMatter,
  onCurrencyChange,
  onParagonChange,
  isEmbedded = false,
}) => {
  const [activeCategory, setActiveCategory] = useState<'weapon' | 'shield' | 'drone' | 'missile'>('weapon');
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(0);
  const [salvageFeedback, setSalvageFeedback] = useState<string | null>(null);
  const [, setRefresh] = useState(0);

  if (!isEmbedded && !isOpen) return null;

  const shipConfig = getShipConfig(selectedShipId);
  equipmentManager.syncSlotsForShip(shipConfig);
  const paragonState = paragonManager.getState();

  const getActiveSlotsArray = (): string[] => {
    if (activeCategory === 'weapon') return equipmentManager.loadout.laserSlots.slice(0, shipConfig.slots.lasers);
    if (activeCategory === 'shield') return equipmentManager.loadout.generatorSlots.slice(0, shipConfig.slots.generators);
    if (activeCategory === 'drone') return equipmentManager.loadout.droneSlots.slice(0, shipConfig.slots.drones);
    return equipmentManager.loadout.missileSlots.slice(0, shipConfig.slots.missiles);
  };

  const activeSlots = getActiveSlotsArray();
  const safeSlotIdx = Math.min(selectedSlotIndex, Math.max(0, activeSlots.length - 1));

  const handleCategorySwitch = (cat: 'weapon' | 'shield' | 'drone' | 'missile') => {
    sound.playUiClick();
    setActiveCategory(cat);
    setSelectedSlotIndex(0);
  };

  const handleUnlock = (item: EquipmentItem) => {
    const pState = paragonManager.getState();
    if (
      pState.prestigeRank < item.prestigeRequired ||
      scrap < item.costScrap ||
      darkMatter < item.costDarkMatter ||
      pState.quantumShards < item.costQuantumShards
    ) {
      return;
    }

    if (item.costQuantumShards > 0) {
      if (!paragonManager.spendQuantumShards(item.costQuantumShards)) return;
    }

    const newScrap = scrap - item.costScrap;
    const newDarkMatter = darkMatter - item.costDarkMatter;
    equipmentManager.unlockItem(item.id);
    onCurrencyChange(newScrap, newDarkMatter);
    if (onParagonChange) onParagonChange();
    sound.playUpgrade();
    setRefresh((r) => r + 1);
  };

  const handleEquipSingleSlot = (item: EquipmentItem) => {
    equipmentManager.equipSlot(item.category, safeSlotIdx, item.id, shipConfig);
    sound.playLaser('plasma');
    if (activeSlots.length > 1) {
      setSelectedSlotIndex((safeSlotIdx + 1) % activeSlots.length);
    }
    setRefresh((r) => r + 1);
  };

  const handleAutoFillCategory = (item: EquipmentItem) => {
    equipmentManager.autoFillCategory(item.category, item.id, activeSlots.length);
    sound.playUpgrade();
    setRefresh((r) => r + 1);
  };

  const handleOptimalAutoFitAll = () => {
    equipmentManager.autoFillAllBest(shipConfig);
    sound.playUpgrade();
    setRefresh((r) => r + 1);
  };

  const handleSalvageSurplus = () => {
    const result = equipmentManager.salvageSurplusItems(shipConfig);
    if (result.itemsCount > 0) {
      onCurrencyChange(scrap + result.scrapRefund, darkMatter + result.dmRefund);
      sound.playUpgrade();
      setSalvageFeedback(
        `${result.itemsCount} überschüssige Module verwertet: +${formatCompactNumber(
          result.scrapRefund
        )} SCR & +${formatCompactNumber(result.dmRefund)} DM!`
      );
      setRefresh((r) => r + 1);
    }
  };

  const items = EQUIPMENT_CATALOGUE.filter((it) => it.category === activeCategory);
  const aggregated = equipmentManager.getAggregatedLoadoutStats(shipConfig);
  const salvageQuote = equipmentManager.getSalvageQuote(shipConfig);

  const containerClasses = isEmbedded
    ? 'w-full text-left'
    : 'fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none';

  return (
    <div className={containerClasses}>
      <SciFiFrame
        variant="cyan"
        className={
          isEmbedded
            ? 'w-full p-4 sm:p-5 space-y-4'
            : 'w-full max-w-4xl p-5 sm:p-6 relative max-h-[90vh] overflow-y-auto text-left space-y-4'
        }
      >
        {!isEmbedded && (
          <SciFiButton
            variant="rose"
            size="sm"
            onClick={onClose}
            className="absolute top-4 right-4"
          >
            <span>ESC</span>
          </SciFiButton>
        )}

        {/* Header + 1-Click Global Auto-Fit & Surplus Salvage */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-300">
                <span>MULTI-SLOT ARMORY</span>
                <span className="text-slate-500">·</span>
                <span>{shipConfig.name} (Tier #{shipConfig.tier})</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider mt-0.5">
                Hardpoints & Set-Synergien
              </h2>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <SciFiButton
                variant="cyan"
                size="sm"
                active
                onClick={handleOptimalAutoFitAll}
                className="shrink-0"
              >
                <UI3DIcon src={UI_ASSETS.icons.quantumShard} size={15} />
                <span>Auto-Fit Alle Slots</span>
              </SciFiButton>

              <SciFiButton
                variant={salvageQuote.itemsCount > 0 ? 'amber' : 'slate'}
                size="sm"
                active={salvageQuote.itemsCount > 0}
                disabled={salvageQuote.itemsCount <= 0}
                onClick={handleSalvageSurplus}
                className="shrink-0"
              >
                <UI3DIcon src={UI_ASSETS.icons.scrap} size={15} />
                <span>
                  {salvageQuote.itemsCount > 0
                    ? `Verwerten (${salvageQuote.itemsCount} · +${formatCompactNumber(
                        salvageQuote.scrapRefund
                      )} SCR)`
                    : 'Kein Überschuss'}
                </span>
              </SciFiButton>
            </div>
          </div>

          {salvageFeedback && (
            <div className="ai-panel-emerald px-3 py-2 text-xs font-mono font-bold text-emerald-200">
              {salvageFeedback}
            </div>
          )}

          {/* Set Synergy Banner */}
          <div className="ai-panel-amber px-3.5 py-2 flex items-center justify-between gap-2 text-xs font-mono">
            <span className="text-amber-200 font-bold">
              AUSRÜSTUNGS-RESONANZ (2er / 4er Set-Bonus):
            </span>
            <span className="text-white font-bold">
              {aggregated.setBonusName || 'Rüste 2+ Module derselben Generation für Set-Bonus aus'}
            </span>
          </div>

          {/* Aggregated Multi-Slot Power Telemetry (2x2 on mobile, 4 cols on sm+) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
            <div className="ai-panel-slate px-3.5 py-2.5">
              <span className="text-slate-400 block text-[10px]">LASER-SLOTS</span>
              <span className="text-cyan-300 font-bold text-sm">{shipConfig.slots.lasers} Aktiv</span>
            </div>
            <div className="ai-panel-slate px-3.5 py-2.5">
              <span className="text-slate-400 block text-[10px]">SCHILD-BONUS</span>
              <span className="text-emerald-300 font-bold text-sm">
                +{formatCompactNumber(aggregated.totalShieldBonus)}
              </span>
            </div>
            <div className="ai-panel-slate px-3.5 py-2.5">
              <span className="text-slate-400 block text-[10px]">SET-SCHADEN</span>
              <span className="text-purple-300 font-bold text-sm">
                x{aggregated.setDamageMult.toFixed(2)} DMG
              </span>
            </div>
            <div className="ai-panel-slate px-3.5 py-2.5">
              <span className="text-slate-400 block text-[10px]">PRESTIGE-RANG</span>
              <span className="text-amber-300 font-bold text-sm">Rang {paragonState.prestigeRank}</span>
            </div>
          </div>
        </div>

        {/* Category Switcher (20 Lasers, 20 Shields, 20 Drones, Missiles) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <SciFiButton
            variant="cyan"
            size="sm"
            active={activeCategory === 'weapon'}
            onClick={() => handleCategorySwitch('weapon')}
          >
            <span>Laser ({shipConfig.slots.lasers})</span>
          </SciFiButton>
          <SciFiButton
            variant="emerald"
            size="sm"
            active={activeCategory === 'shield'}
            onClick={() => handleCategorySwitch('shield')}
          >
            <span>Schilde ({shipConfig.slots.generators})</span>
          </SciFiButton>
          <SciFiButton
            variant="purple"
            size="sm"
            active={activeCategory === 'drone'}
            onClick={() => handleCategorySwitch('drone')}
          >
            <span>Drohnen ({shipConfig.slots.drones})</span>
          </SciFiButton>
          <SciFiButton
            variant="amber"
            size="sm"
            active={activeCategory === 'missile'}
            onClick={() => handleCategorySwitch('missile')}
          >
            <span>Raketen ({shipConfig.slots.missiles})</span>
          </SciFiButton>
        </div>

        {/* Interactive Individual Multi-Slot Board */}
        <SciFiFrame variant="slate" className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-300 font-bold flex items-center gap-2">
              <UI3DIcon src={UI_ASSETS.icons.armory} size={16} />
              AKTIVE SCHIFFS-SLOTS ({activeSlots.length} VERFÜGBAR)
            </span>
            <span className="text-xs font-mono text-slate-300">
              Ausgewählt: <strong className="text-white">Slot #{safeSlotIdx + 1}</strong>
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {activeSlots.map((equippedId, idx) => {
              const eqItem = equipmentManager.getEquipmentItem(equippedId);
              const isSelectedSlot = idx === safeSlotIdx;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    sound.playUiClick();
                    setSelectedSlotIndex(idx);
                  }}
                  className={`p-2.5 flex flex-col items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                    isSelectedSlot ? 'ai-thumb-active-cyan' : 'ai-thumb-slate'
                  }`}
                >
                  <div className="flex items-center justify-between w-full text-[10px] font-mono">
                    <span className={isSelectedSlot ? 'text-cyan-200 font-bold' : 'text-slate-400'}>
                      #{idx + 1}
                    </span>
                    <span className="text-amber-300 font-bold">
                      {eqItem ? `T${eqItem.tier}` : '--'}
                    </span>
                  </div>
                  <ItemArtwork
                    id={equippedId === 'none' ? 'micro_swarm' : equippedId}
                    category={activeCategory}
                    size={38}
                  />
                  <span className="text-[10px] font-mono text-slate-200 truncate w-full text-center">
                    {equippedId === 'none'
                      ? 'Leer'
                      : eqItem?.name.replace(/^Mk\.[IVXLCDM]+\s*/, '') || equippedId}
                  </span>
                </button>
              );
            })}
          </div>
        </SciFiFrame>

        {/* 20-Tier Equipment Catalogue List */}
        <div className="space-y-3">
          {items.map((item) => {
            const unlocked = equipmentManager.isItemUnlocked(item.id);
            const equippedCount = activeSlots.filter((id) => id === item.id).length;
            const isAllSlotsEquipped = equippedCount === activeSlots.length && activeSlots.length > 0;
            const isEquippedInSelectedSlot = activeSlots[safeSlotIdx] === item.id;
            const starLevel = equipmentManager.getItemStarLevel(item.id);
            const starMult = equipmentManager.getStarMultiplier(item.id);
            const starCost = equipmentManager.getStarFusionCost(item.id);
            const canAffordStar =
              unlocked &&
              !starCost.isMaxed &&
              scrap >= starCost.scrap &&
              darkMatter >= starCost.darkMatter;

            const meetsPrestige = paragonState.prestigeRank >= item.prestigeRequired;
            const canAfford =
              meetsPrestige &&
              scrap >= item.costScrap &&
              darkMatter >= item.costDarkMatter &&
              paragonState.quantumShards >= item.costQuantumShards;

            const handleStarUpgrade = () => {
              if (!canAffordStar) return;
              const nextScrap = scrap - starCost.scrap;
              const nextDm = darkMatter - starCost.darkMatter;
              if (equipmentManager.upgradeItemStar(item.id)) {
                onCurrencyChange(nextScrap, nextDm);
                sound.playUpgrade();
                setSalvageFeedback(
                  `${item.name} auf ★${starLevel + 1} STERN-FUSION überladen (x${equipmentManager
                    .getStarMultiplier(item.id)
                    .toFixed(2)} Gesamtkraft)!`
                );
                setRefresh((r) => r + 1);
              }
            };

            return (
              <SciFiFrame
                key={item.id}
                variant={isAllSlotsEquipped ? 'cyan' : unlocked ? 'slate' : 'amber'}
                className="p-4 flex flex-col gap-3 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <ItemArtwork
                      id={item.id}
                      category={item.category}
                      size={52}
                      className="shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-amber-300">
                          TIER {item.tier}
                        </span>
                        <span className="text-slate-600">·</span>
                        <h4 className="text-sm font-bold text-white">{item.name}</h4>
                        {unlocked && (
                          <span className="px-2 py-0.5 rounded bg-amber-950/90 border border-amber-500/40 text-[11px] font-mono font-bold text-amber-300">
                            {'★'.repeat(starLevel)}
                            {'☆'.repeat(Math.max(0, 5 - starLevel))} (x{starMult.toFixed(2)})
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono text-cyan-300 block mt-1">
                        {item.statsText}
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed mt-1">{item.desc}</p>
                    </div>
                  </div>

                  {equippedCount > 0 && (
                    <span className="shrink-0 flex items-center gap-1.5 text-[11px] font-mono font-bold text-cyan-200 ai-btn-cyan px-3 py-1">
                      <UI3DIcon src={UI_ASSETS.icons.shield} size={13} />
                      <span>
                        {equippedCount}/{activeSlots.length} Slots
                      </span>
                    </span>
                  )}
                </div>

                {/* Unlock Requirements or Multi-Slot Equip + Star-Fusion Controls */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                  {!unlocked ? (
                    <>
                      <div className="flex items-center gap-2.5 text-xs font-mono flex-wrap">
                        <span
                          className={`font-bold ${
                            meetsPrestige ? 'text-emerald-300' : 'text-rose-300'
                          }`}
                        >
                          Prestige {item.prestigeRequired} (Aktuell: P.{paragonState.prestigeRank})
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className={scrap >= item.costScrap ? 'text-amber-300 font-bold' : 'text-slate-400'}>
                          {formatCompactNumber(item.costScrap)} SCR
                        </span>
                        {item.costDarkMatter > 0 && (
                          <span className={darkMatter >= item.costDarkMatter ? 'text-purple-300 font-bold' : 'text-slate-400'}>
                            {formatCompactNumber(item.costDarkMatter)} DM
                          </span>
                        )}
                        {item.costQuantumShards > 0 && (
                          <span className={paragonState.quantumShards >= item.costQuantumShards ? 'text-cyan-300 font-bold' : 'text-slate-400'}>
                            {formatCompactNumber(item.costQuantumShards)} QS
                          </span>
                        )}
                      </div>

                      <SciFiButton
                        variant={canAfford ? 'amber' : 'slate'}
                        size="sm"
                        active={canAfford}
                        disabled={!canAfford}
                        onClick={() => handleUnlock(item)}
                      >
                        <UI3DIcon src={UI_ASSETS.icons.lock} size={14} />
                        <span>
                          {!meetsPrestige
                            ? `P.${item.prestigeRequired} benötigt`
                            : 'Freischalten'}
                        </span>
                      </SciFiButton>
                    </>
                  ) : (
                    <div className="flex items-center justify-between w-full gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <SciFiButton
                          variant={starCost.isMaxed ? 'emerald' : canAffordStar ? 'amber' : 'slate'}
                          size="sm"
                          active={canAffordStar}
                          disabled={starCost.isMaxed || !canAffordStar}
                          onClick={handleStarUpgrade}
                        >
                          <span>
                            {starCost.isMaxed
                              ? '★5 MAX FUSION'
                              : `★${starLevel + 1} Fusion (${formatCompactNumber(
                                  starCost.scrap
                                )} SCR · ${formatCompactNumber(starCost.darkMatter)} DM)`}
                          </span>
                        </SciFiButton>
                      </div>

                      <div className="flex items-center gap-2">
                        <SciFiButton
                          variant={isEquippedInSelectedSlot ? 'slate' : 'cyan'}
                          size="sm"
                          active={!isEquippedInSelectedSlot}
                          onClick={() => handleEquipSingleSlot(item)}
                        >
                          <span>In Slot #{safeSlotIdx + 1}</span>
                        </SciFiButton>

                        {activeSlots.length > 1 && (
                          <SciFiButton
                            variant={isAllSlotsEquipped ? 'slate' : 'purple'}
                            size="sm"
                            active={!isAllSlotsEquipped}
                            disabled={isAllSlotsEquipped}
                            onClick={() => handleAutoFillCategory(item)}
                          >
                            <UI3DIcon src={UI_ASSETS.icons.ultimate} size={13} />
                            <span>Alle {activeSlots.length} Slots</span>
                          </SciFiButton>
                        )}
                      </div>
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
