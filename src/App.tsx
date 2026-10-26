import React, { useRef, useState, useEffect, useCallback } from 'react';
import { GameEngine, GameStats } from './game/engine.ts';
import { ShipClassId, GuildData, PlayerUpgrades, TechLabResearches } from './game/types.ts';
import { multiplayer } from './game/multiplayerClient.ts';
import { VoidRiftMutator } from './game/paragon.ts';
import { PvpOpponent } from './game/metaProgression.ts';
import { TitleScreen } from './components/TitleScreen.tsx';
import { GameHud } from './components/GameHud.tsx';
import { UpgradeDrawer } from './components/UpgradeDrawer.tsx';
import { CommandDeckModal } from './components/CommandDeckModal.tsx';
import { PauseModal } from './components/PauseModal.tsx';
import { GameOverModal } from './components/GameOverModal.tsx';
import { leaderboardClient } from './game/leaderboard.ts';

type AppState = 'TITLE' | 'PLAYING' | 'GAME_OVER';
type CommandDeckTab = 'arena' | 'honor_shop' | 'pilots' | 'expeditions' | 'codex';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<AppState>('TITLE');
  const [isPaused, setIsPaused] = useState(false);
  const [selectedShip, setSelectedShip] = useState<ShipClassId>('ship_01');
  const [roomCode, setRoomCode] = useState('PUBLIC-FLEET');
  const [callsign, setCallsign] = useState(multiplayer.callsign);
  const [gameStats, setGameStats] = useState<GameStats | null>(null);

  // Single In-Combat Bottom Sheet state + Command Deck Modal (PvP Arena, Pilots, Expeditions, Boss Codex)
  const [isUpgradeDrawerOpen, setIsUpgradeDrawerOpen] = useState(false);
  const [isCommandDeckOpen, setIsCommandDeckOpen] = useState(false);
  const [commandDeckTab, setCommandDeckTab] = useState<CommandDeckTab>('arena');
  const [currentGuild, setCurrentGuild] = useState<GuildData | null>(null);

  // Currency state (for Starbase Hub and Upgrade sync)
  const [currency, setCurrency] = useState({ scrap: 150, darkMatter: 10 });

  const [gameOverStats, setGameOverStats] = useState<{
    score: number;
    kills: number;
    sector: number;
    wave: number;
    scrap: number;
  } | null>(null);

  // Initialize Canvas & Engine inside the 9:16 Portrait Viewport
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const engine = new GameEngine(canvas);
    engineRef.current = engine;
    setCurrency({ scrap: engine.scrap, darkMatter: engine.darkMatter });

    const handleResize = () => {
      if (canvas.parentElement) {
        const { clientWidth, clientHeight } = canvas.parentElement;
        engine.resize(clientWidth, clientHeight);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Engine Callbacks
    engine.onStatsUpdate = (stats) => {
      setGameStats(stats);
      setCurrency({ scrap: stats.scrap, darkMatter: stats.darkMatter });
    };

    engine.onGameOver = (stats) => {
      setGameOverStats(stats);
      setGameState('GAME_OVER');
      setIsUpgradeDrawerOpen(false);

      // Auto-submit score to Global Leaderboard
      leaderboardClient.submitScore({
        callsign: multiplayer.callsign || callsign || 'Pilot',
        score: stats.score,
        sector: stats.sector,
        wave: stats.wave,
        kills: stats.kills,
        shipClass: selectedShip,
        guildTag: currentGuild?.tag,
      });
    };

    // Guild Synchronization
    multiplayer.onGuildSynced = (guild) => {
      setCurrentGuild(guild);
      if (engineRef.current) {
        engineRef.current.applyUpgradesToShip();
        engineRef.current.emitStatsNow();
      }
    };

    engine.emitStatsNow();

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.stop();
      multiplayer.disconnect();
    };
  }, []);

  // Start / Launch game
  const handleStartGame = useCallback(
    (
      shipId: ShipClassId,
      targetRoom: string,
      targetCallsign: string,
      startSector: number = 1,
      endlessRift?: { depth: number; mutator: VoidRiftMutator }
    ) => {
      setSelectedShip(shipId);
      setRoomCode(targetRoom);
      setCallsign(targetCallsign);

      multiplayer.setCallsign(targetCallsign);
      multiplayer.connect(targetRoom, shipId);

      if (engineRef.current) {
        if (canvasRef.current?.parentElement) {
          engineRef.current.resize(
            canvasRef.current.parentElement.clientWidth,
            canvasRef.current.parentElement.clientHeight
          );
        }
        engineRef.current.isEndlessRift = false;
        engineRef.current.resetRun(startSector);
        engineRef.current.start(shipId, startSector);
        if (endlessRift) {
          engineRef.current.startEndlessRift(endlessRift.depth, endlessRift.mutator);
        }
        engineRef.current.emitStatsNow();
      }
      setGameState('PLAYING');
      setIsPaused(false);
      setIsUpgradeDrawerOpen(false);
    },
    []
  );

  const handleOpenCommandDeck = (tab: CommandDeckTab = 'arena') => {
    setCommandDeckTab(tab);
    setIsCommandDeckOpen(true);
  };

  const handleStartPvpMatch = (opponent: PvpOpponent) => {
    setIsCommandDeckOpen(false);
    setIsUpgradeDrawerOpen(false);
    setIsPaused(false);

    if (engineRef.current) {
      if (canvasRef.current?.parentElement) {
        engineRef.current.resize(
          canvasRef.current.parentElement.clientWidth,
          canvasRef.current.parentElement.clientHeight
        );
      }
      if (!engineRef.current.isRunning) {
        engineRef.current.start(selectedShip, engineRef.current.sector);
      }
      engineRef.current.isPaused = false;
      engineRef.current.startPvpMatch(opponent);
      engineRef.current.emitStatsNow();
    }
    setGameState('PLAYING');
  };

  const handlePauseToggle = () => {
    setIsPaused((prev) => {
      const next = !prev;
      if (engineRef.current) {
        engineRef.current.isPaused = next;
      }
      return next;
    });
  };

  const handleRestart = (startSector?: number) => {
    if (engineRef.current) {
      engineRef.current.resetRun(startSector || 1);
      engineRef.current.start(selectedShip, startSector || 1);
      engineRef.current.emitStatsNow();
    }
    setGameState('PLAYING');
    setIsPaused(false);
    setIsUpgradeDrawerOpen(false);
  };

  const handleQuitToTitle = () => {
    if (engineRef.current) {
      engineRef.current.stop();
    }
    multiplayer.disconnect();
    setGameState('TITLE');
    setIsPaused(false);
    setIsUpgradeDrawerOpen(false);
  };

  const handleCurrencyChange = (newScrap: number, newDarkMatter: number) => {
    if (engineRef.current) {
      engineRef.current.scrap = newScrap;
      engineRef.current.darkMatter = newDarkMatter;
      engineRef.current.applyUpgradesToShip();
      engineRef.current.saveProgress();
      engineRef.current.emitStatsNow();
    }
    setCurrency({ scrap: newScrap, darkMatter: newDarkMatter });
  };

  const handleTriggerPrestige = () => {
    if (engineRef.current) {
      engineRef.current.performPrestigeReset();
      engineRef.current.emitStatsNow();
      setCurrency({
        scrap: engineRef.current.scrap,
        darkMatter: engineRef.current.darkMatter,
      });
    }
  };

  // Check if player can afford at least one ship upgrade for HUD badge
  const hasAffordableUpgrade = React.useMemo(() => {
    if (!engineRef.current) return false;
    const keys = Object.keys(engineRef.current.upgrades) as Array<keyof PlayerUpgrades>;
    return keys.some((k) => {
      if (k === 'droneCountLevel' && engineRef.current!.upgrades[k] >= 5) return false;
      return currency.scrap >= engineRef.current!.getUpgradeCost(k);
    });
  }, [currency.scrap, gameStats]);

  const computedPlayerPower = Math.max(
    450,
    Math.round((gameStats?.dps || 120) * 2.2 + (gameStats?.playerMaxShield || 150) * 1.4)
  );

  return (
    <div className="w-screen h-[100dvh] bg-[#02040a] flex justify-center overflow-hidden select-none">
      {/* 9:16 Portrait Smartphone Chassis */}
      <div className="relative w-full max-w-[440px] h-[100dvh] bg-[#040711] overflow-hidden touch-none select-none shadow-[0_0_80px_rgba(6,182,212,0.18)] border-x border-cyan-500/20">
        {/* Main 60FPS HTML5 Game Canvas */}
        <canvas ref={canvasRef} className="block w-full h-full touch-none" />

        {/* 1. Starbase Hub (Title Screen with 5-Tab Bottom Navigation Bar) */}
        {gameState === 'TITLE' && (
          <TitleScreen
            selectedShip={selectedShip}
            onSelectShip={(ship) => {
              setSelectedShip(ship);
              if (engineRef.current) {
                engineRef.current.setShipClass(ship);
                engineRef.current.emitStatsNow();
              }
            }}
            roomCode={roomCode}
            onChangeRoomCode={setRoomCode}
            callsign={callsign}
            onChangeCallsign={setCallsign}
            onStartGame={handleStartGame}
            currentGuild={currentGuild}
            scrap={currency.scrap}
            darkMatter={currency.darkMatter}
            onCurrencyChange={handleCurrencyChange}
            onTriggerPrestige={handleTriggerPrestige}
            onOpenCommandDeck={handleOpenCommandDeck}
          />
        )}

        {/* 2. One-Handed Smartphone Combat HUD */}
        {gameState === 'PLAYING' && (
          <GameHud
            stats={gameStats}
            shipClassId={selectedShip}
            onToggleUpgrades={() => setIsUpgradeDrawerOpen((prev) => !prev)}
            isUpgradeOpen={isUpgradeDrawerOpen}
            onPause={handlePauseToggle}
            onTriggerSpecial={() => {
              if (engineRef.current) {
                engineRef.current.triggerSpecialAbility();
                engineRef.current.emitStatsNow();
              }
            }}
            onTriggerMissile={() => {
              if (engineRef.current) {
                engineRef.current.fireMissileSalvo();
                engineRef.current.emitStatsNow();
              }
            }}
            onTriggerPhaseDash={() => {
              if (engineRef.current) {
                engineRef.current.triggerPhaseDash();
                engineRef.current.emitStatsNow();
              }
            }}
            onToggleAutoPilot={() => {
              if (engineRef.current) {
                engineRef.current.toggleAutoPilot();
              }
            }}
            onCycleGameSpeed={() => {
              if (engineRef.current) {
                engineRef.current.cycleGameSpeed();
              }
            }}
            onToggleBossAutoRetry={() => {
              if (engineRef.current) {
                engineRef.current.toggleBossAutoRetry();
              }
            }}
            onChallengeBossNow={() => {
              if (engineRef.current) {
                engineRef.current.challengeBossNow();
              }
            }}
            onToggleAutoUpgrade={() => {
              if (engineRef.current) {
                engineRef.current.toggleAutoUpgrade();
              }
            }}
            onClaimOfflineReward={() => {
              if (engineRef.current && engineRef.current.claimOfflineRewards(1)) {
                engineRef.current.emitStatsNow();
                setCurrency({
                  scrap: engineRef.current.scrap,
                  darkMatter: engineRef.current.darkMatter,
                });
              }
            }}
            onActivateBooster={(id) => {
              if (engineRef.current) {
                engineRef.current.activateBooster(id);
                engineRef.current.emitStatsNow();
              }
            }}
            onOpenCommandDeck={handleOpenCommandDeck}
            onCycleDamageFilter={() => {
              if (engineRef.current) {
                engineRef.current.cycleDamageFilter();
              }
            }}
            hasAffordableUpgrade={hasAffordableUpgrade}
          />
        )}

        {/* 3. Single Slide-Up Upgrade Bottom Sheet during Combat */}
        {gameState === 'PLAYING' && engineRef.current && (
          <UpgradeDrawer
            isOpen={isUpgradeDrawerOpen}
            onClose={() => setIsUpgradeDrawerOpen(false)}
            scrap={currency.scrap}
            darkMatter={currency.darkMatter}
            upgrades={engineRef.current.upgrades}
            tech={engineRef.current.tech}
            getUpgradeCost={(key: keyof PlayerUpgrades) =>
              engineRef.current ? engineRef.current.getUpgradeCost(key) : 999
            }
            getBulkUpgradeQuote={(key, mode) =>
              engineRef.current
                ? engineRef.current.getBulkUpgradeQuote(key, mode)
                : { levels: 1, cost: 999, isMaxed: false }
            }
            getMilestoneInfo={(key) =>
              engineRef.current
                ? engineRef.current.getMilestoneInfo(key)
                : {
                    tier: 0,
                    multiplier: 1,
                    nextMilestoneLevel: 10,
                    progressPct: 10,
                  }
            }
            onPurchaseUpgrade={(key: keyof PlayerUpgrades, mode = '1x') => {
              if (engineRef.current && engineRef.current.purchaseUpgrade(key, mode)) {
                engineRef.current.emitStatsNow();
                setCurrency({
                  scrap: engineRef.current.scrap,
                  darkMatter: engineRef.current.darkMatter,
                });
              }
            }}
            onPurchaseTech={(key: keyof TechLabResearches) => {
              if (engineRef.current && engineRef.current.purchaseTech(key)) {
                engineRef.current.emitStatsNow();
                setCurrency({
                  scrap: engineRef.current.scrap,
                  darkMatter: engineRef.current.darkMatter,
                });
              }
            }}
            autoUpgradeEnabled={gameStats?.autoUpgradeEnabled ?? engineRef.current.autoUpgradeEnabled}
            onToggleAutoUpgrade={() => {
              if (engineRef.current) {
                engineRef.current.toggleAutoUpgrade();
              }
            }}
            achievements={gameStats?.achievements ?? engineRef.current.getCommandAchievements()}
            onClaimAchievement={(id) => {
              if (engineRef.current && engineRef.current.claimAchievement(id)) {
                engineRef.current.emitStatsNow();
                setCurrency({
                  scrap: engineRef.current.scrap,
                  darkMatter: engineRef.current.darkMatter,
                });
              }
            }}
            activeBoosters={gameStats?.activeBoosters ?? engineRef.current.getBoostersState()}
            onActivateBooster={(id) => {
              if (engineRef.current) {
                engineRef.current.activateBooster(id);
                engineRef.current.emitStatsNow();
              }
            }}
          />
        )}

        {/* 4. Command Deck Modal (Live 1v1 PvP Arena, Honor Shop, Pilot Tree, Expeditions, Boss Codex) */}
        <CommandDeckModal
          isOpen={isCommandDeckOpen}
          initialTab={commandDeckTab}
          onClose={() => setIsCommandDeckOpen(false)}
          scrap={currency.scrap}
          darkMatter={currency.darkMatter}
          playerPower={computedPlayerPower}
          playerPowerScore={computedPlayerPower}
          playerSector={engineRef.current?.sector || 1}
          callsign={callsign}
          onCurrencyChange={handleCurrencyChange}
          onStartPvpMatch={handleStartPvpMatch}
          onMetaUpdated={() => {
            if (engineRef.current) {
              engineRef.current.applyUpgradesToShip();
              engineRef.current.emitStatsNow();
            }
          }}
        />

        {/* 5. Pause Modal */}
        {gameState === 'PLAYING' && isPaused && (
          <PauseModal
            onResume={handlePauseToggle}
            onRestart={() => handleRestart(1)}
            onQuitToTitle={handleQuitToTitle}
          />
        )}

        {/* 6. Game Over Debrief Modal */}
        {gameState === 'GAME_OVER' && gameOverStats && (
          <GameOverModal
            stats={gameOverStats}
            onPlayAgain={(sector) => handleRestart(sector)}
            onReturnToHangar={handleQuitToTitle}
          />
        )}
      </div>
    </div>
  );
}
