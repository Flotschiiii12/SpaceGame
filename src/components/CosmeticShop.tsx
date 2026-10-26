import React, { useState, useEffect, useRef } from 'react';
import { CosmeticCategory, CosmeticItem, ShipClassId } from '../game/types.ts';
import { COSMETIC_CATALOGUE, cosmetics } from '../game/cosmetics.ts';
import { getShipConfig, renderBespokeShipCanvas } from '../game/shipClasses.ts';
import { sound } from '../game/audio.ts';
import { assetManager, UI_ASSETS } from '../game/assets.ts';
import { SciFiFrame, SciFiButton, UI3DIcon } from './SciFiFrame.tsx';
import { ItemArtwork, CustomStarIcon } from './ItemArtwork.tsx';

interface CosmeticShopProps {
  currentShipId: ShipClassId;
  scrap: number;
  darkMatter: number;
  onCurrencyChange: (newScrap: number, newDarkMatter: number) => void;
  onEquippedChange?: () => void;
}

export const CosmeticShop: React.FC<CosmeticShopProps> = ({
  currentShipId,
  scrap,
  darkMatter,
  onCurrencyChange,
  onEquippedChange,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CosmeticCategory>('skin');
  const [previewItem, setPreviewItem] = useState<CosmeticItem>(cosmetics.getEquippedSkinItem());
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const filteredItems = COSMETIC_CATALOGUE.filter((item) => item.category === selectedCategory);
  const shipConfig = getShipConfig(currentShipId);

  // 60FPS Live Drydock Simulator inside Cosmetic Shop
  useEffect(() => {
    let animId: number;
    let time = 0;

    const renderPreview = () => {
      const canvas = previewCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      time += 0.035;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2 + Math.sin(time * 1.4) * 5 + 10;

      const activeSkin = previewItem.category === 'skin' ? previewItem : cosmetics.getEquippedSkinItem();
      const activeTrail = previewItem.category === 'trail' ? previewItem : cosmetics.getEquippedTrailItem();
      const activeLaser = previewItem.category === 'laser' ? previewItem : cosmetics.getEquippedLaserItem();
      const activeRelic = previewItem.category === 'hangar' ? previewItem : undefined;

      const skinGlowColor =
        activeSkin.id === 'skin-default' ? shipConfig.primaryColor : activeSkin.accentColor || activeSkin.primaryColor;

      // 3D Turntable Ring
      const turntable = assetManager.getRawImage('ui_joystick_base');
      if (turntable && turntable.complete && turntable.naturalWidth > 0) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(time * 0.25);
        ctx.globalAlpha = 0.55;
        ctx.drawImage(turntable, -86, -86, 172, 172);
        ctx.restore();
      }

      // Hangar Relic 3D Sprite Orbit
      if (activeRelic) {
        const starbaseSprite = assetManager.getSprite('env_starbase');
        if (starbaseSprite) {
          ctx.save();
          ctx.translate(cx + 76, cy - 58 + Math.sin(time * 2.2) * 4);
          ctx.rotate(time * 0.6);
          ctx.drawImage(starbaseSprite, -22, -22, 44, 44);
          ctx.restore();
        }
      }

      // Continuous Live Laser Blaster Fire Simulation
      const laserColor = activeLaser.primaryColor || '#38bdf8';
      for (let b = 0; b < 2; b++) {
        const boltOffset = (time * 220 + b * 75) % 130;
        const laserY = cy - 30 - boltOffset;
        if (laserY > 10) {
          ctx.save();
          ctx.strokeStyle = laserColor;
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = laserColor;
          ctx.shadowBlur = 10;
          ctx.lineWidth = 3.5;

          for (const side of [-16, 16]) {
            ctx.beginPath();
            ctx.moveTo(cx + side, laserY + 14);
            ctx.lineTo(cx + side, laserY);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx + side, laserY, 2.2, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      }

      // Live Thruster Trail Plume Simulation
      const trailColor = activeTrail.primaryColor || '#38bdf8';
      const trailY = cy + 32;
      for (let i = 0; i < 7; i++) {
        const pOffset = (time * 75 + i * 9) % 58;
        const pY = trailY + pOffset;
        const pAlpha = Math.max(0, 1 - pOffset / 58);
        ctx.save();
        ctx.fillStyle = i % 2 === 0 ? '#ffffff' : trailColor;
        ctx.strokeStyle = trailColor;
        ctx.globalAlpha = pAlpha * 0.85;

        for (const nozzleX of [-11, 11]) {
          const xPos = cx + nozzleX + Math.sin(time * 7 + i) * 2;
          ctx.beginPath();
          ctx.arc(xPos, pY, Math.max(1.2, 4.2 - (pOffset / 58) * 3), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Render Real 3D Ship Sprite + Live Skin Shader
      ctx.save();
      ctx.translate(cx, cy);
      ctx.shadowColor = skinGlowColor;
      ctx.shadowBlur = 16;
      renderBespokeShipCanvas(ctx, shipConfig, {
        scale: 1.4,
        time,
        overridePrimary:
          activeSkin.id === 'skin-default' ? undefined : activeSkin.primaryColor,
        overrideAccent:
          activeSkin.id === 'skin-default' ? undefined : activeSkin.accentColor,
      });
      ctx.restore();

      animId = requestAnimationFrame(renderPreview);
    };

    animId = requestAnimationFrame(renderPreview);
    return () => cancelAnimationFrame(animId);
  }, [previewItem, currentShipId, shipConfig]);

  const handleSelectOrEquip = (item: CosmeticItem) => {
    setPreviewItem(item);
    const owned = cosmetics.isOwned(item.id);

    if (owned) {
      cosmetics.equip(item);
      sound.playUpgrade();
      if (onEquippedChange) onEquippedChange();
    }
  };

  const handlePurchase = (item: CosmeticItem) => {
    if (scrap >= item.costScrap && darkMatter >= item.costDarkMatter) {
      const newScrap = scrap - item.costScrap;
      const newDarkMatter = darkMatter - item.costDarkMatter;
      if (cosmetics.buyItem(item, scrap, darkMatter)) {
        onCurrencyChange(newScrap, newDarkMatter);
        sound.playUpgrade();
        if (onEquippedChange) onEquippedChange();
      }
    }
  };

  const getRarityBadge = (rarity: CosmeticItem['rarity']) => {
    switch (rarity) {
      case 'legendary':
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono uppercase ai-btn-active-amber text-amber-100 font-black">
            Legendary
          </span>
        );
      case 'epic':
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono uppercase ai-btn-active-purple text-purple-100 font-black">
            Epic
          </span>
        );
      case 'rare':
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono uppercase ai-btn-active-cyan text-cyan-100 font-black">
            Rare
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono uppercase ai-btn-slate text-slate-300 font-bold">
            Standard
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-4 p-1 select-none">
      {/* Left Column: Live 60FPS Starship Drydock Simulator */}
      <SciFiFrame variant="cyan" glowIntensity="medium" className="w-full md:w-82 shrink-0 flex flex-col items-center p-4">
        <div className="flex items-center justify-between w-full mb-2.5">
          <div className="text-xs font-mono uppercase tracking-wider text-cyan-300 font-bold">
            Drydock Hologram Sim
          </div>
          <div className="text-xs font-mono text-amber-300 font-bold">
            {shipConfig.name}
          </div>
        </div>

        {/* 60FPS 3D Drydock Bay Visualizer */}
        <div className="relative w-full aspect-square ai-drydock-bay overflow-hidden flex items-center justify-center mb-3.5">
          <canvas
            ref={previewCanvasRef}
            width={280}
            height={280}
            className="w-full h-full block"
          />
          <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-mono text-cyan-200 ai-btn-cyan px-2.5 py-0.5">
            <UI3DIcon src={UI_ASSETS.icons.autopilot} size={13} className="animate-spin" />
            <span>60FPS 3D</span>
          </div>
        </div>

        {/* Selected Preview Item Schematic & Specs */}
        <SciFiFrame variant="slate" glowIntensity="low" className="w-full p-3.5 text-left space-y-2.5">
          <div className="flex items-center gap-3">
            <ItemArtwork
              id={previewItem.id}
              category={previewItem.category}
              color={previewItem.primaryColor}
              accentColor={previewItem.accentColor}
              size={48}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-xs font-bold text-white truncate">{previewItem.name}</span>
                {getRarityBadge(previewItem.rarity)}
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">{previewItem.description}</p>
            </div>
          </div>
          <div className="pt-2 text-[11px] font-mono text-emerald-300 flex items-center gap-1.5">
            <CustomStarIcon className="w-4 h-4 shrink-0" />
            <span>{previewItem.perkText}</span>
          </div>
        </SciFiFrame>
      </SciFiFrame>

      {/* Right Column: Customization Shop Catalogue */}
      <SciFiFrame variant="cyan" glowIntensity="medium" className="flex-1 flex flex-col p-4">
        {/* Top Header & Currencies */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 pb-3">
          <div>
            <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2 font-mono">
              <UI3DIcon src={UI_ASSETS.icons.shop} size={20} />
              Cosmetic Fitting & Relic Vault
            </h2>
            <p className="text-xs text-slate-300">
              Bespoke 3D hull shaders, plasma blasters, ion wake trails, and trophy relics.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <div className="flex items-center gap-1.5 ai-btn-amber px-3 py-1.5">
              <UI3DIcon src={UI_ASSETS.icons.scrap} size={15} />
              <span className="text-amber-200 font-bold tabular-nums">{scrap.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 ai-btn-purple px-3 py-1.5">
              <UI3DIcon src={UI_ASSETS.icons.darkMatter} size={15} />
              <span className="text-purple-200 font-bold tabular-nums">{darkMatter.toLocaleString()} DM</span>
            </div>
          </div>
        </div>

        {/* Category Navigation */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
          <SciFiButton
            variant={selectedCategory === 'skin' ? 'cyan' : 'slate'}
            size="sm"
            active={selectedCategory === 'skin'}
            onClick={() => setSelectedCategory('skin')}
          >
            <UI3DIcon src={UI_ASSETS.icons.shield} size={14} />
            <span>Hull Skins</span>
          </SciFiButton>

          <SciFiButton
            variant={selectedCategory === 'laser' ? 'cyan' : 'slate'}
            size="sm"
            active={selectedCategory === 'laser'}
            onClick={() => setSelectedCategory('laser')}
          >
            <UI3DIcon src={UI_ASSETS.icons.missile} size={14} />
            <span>Laser Blasters</span>
          </SciFiButton>

          <SciFiButton
            variant={selectedCategory === 'trail' ? 'cyan' : 'slate'}
            size="sm"
            active={selectedCategory === 'trail'}
            onClick={() => setSelectedCategory('trail')}
          >
            <UI3DIcon src={UI_ASSETS.icons.dash} size={14} />
            <span>Engine Trails</span>
          </SciFiButton>

          <SciFiButton
            variant={selectedCategory === 'hangar' ? 'amber' : 'slate'}
            size="sm"
            active={selectedCategory === 'hangar'}
            onClick={() => setSelectedCategory('hangar')}
          >
            <UI3DIcon src={UI_ASSETS.icons.hq} size={14} />
            <span>Hangar Relics</span>
          </SciFiButton>
        </div>

        {/* Items Grid with 3D Artwork Schematics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto max-h-[450px] pr-1">
          {filteredItems.map((item) => {
            const isOwned = cosmetics.isOwned(item.id);
            const isEquipped = cosmetics.isEquipped(item);
            const isSelectedForPreview = previewItem.id === item.id;
            const canAfford = scrap >= item.costScrap && darkMatter >= item.costDarkMatter;

            return (
              <div
                key={item.id}
                onClick={() => {
                  sound.playUiClick();
                  setPreviewItem(item);
                }}
                onMouseEnter={() => sound.playUiHover()}
                className="cursor-pointer"
              >
                <SciFiFrame
                  variant={isSelectedForPreview ? 'cyan' : isEquipped ? 'emerald' : 'slate'}
                  glowIntensity={isSelectedForPreview ? 'medium' : 'low'}
                  className="p-3.5 h-full flex flex-col justify-between transition-transform hover:scale-[1.01]"
                >
                  <div>
                    <div className="flex items-start gap-3 mb-2">
                      <ItemArtwork
                        id={item.id}
                        category={item.category}
                        color={item.primaryColor}
                        accentColor={item.accentColor}
                        size={54}
                        className="shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-xs font-bold text-white truncate">{item.name}</span>
                          {getRarityBadge(item.rarity)}
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="text-[11px] font-mono text-emerald-200 mb-3 flex items-center gap-1.5 ai-btn-emerald px-2.5 py-1">
                      <CustomStarIcon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{item.perkText}</span>
                    </div>
                  </div>

                  {/* Footer Controls: Buy or Equip */}
                  <div className="flex items-center justify-between pt-2">
                    {isOwned ? (
                      isEquipped ? (
                        <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-300 font-bold uppercase">
                          <UI3DIcon src={UI_ASSETS.icons.shield} size={15} /> Active Loadout
                        </span>
                      ) : (
                        <SciFiButton
                          variant="cyan"
                          size="sm"
                          active
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectOrEquip(item);
                          }}
                        >
                          <span>Equip System</span>
                        </SciFiButton>
                      )
                    ) : (
                      <div className="flex items-center justify-between w-full gap-2">
                        <div className="flex items-center gap-2 text-xs font-mono">
                          {item.costScrap > 0 && (
                            <span className="text-amber-300 font-bold tabular-nums">
                              {item.costScrap.toLocaleString()} SCR
                            </span>
                          )}
                          {item.costDarkMatter > 0 && (
                            <span className="text-purple-300 font-bold tabular-nums">
                              {item.costDarkMatter} DM
                            </span>
                          )}
                        </div>

                        <SciFiButton
                          variant={canAfford ? 'amber' : 'slate'}
                          size="sm"
                          active={canAfford}
                          disabled={!canAfford}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePurchase(item);
                          }}
                        >
                          <span>Unlock</span>
                        </SciFiButton>
                      </div>
                    )}
                  </div>
                </SciFiFrame>
              </div>
            );
          })}
        </div>
      </SciFiFrame>
    </div>
  );
};
