import React, { useState, useEffect, useRef } from 'react';
import { GuildData } from '../game/types.ts';
import { multiplayer } from '../game/multiplayerClient.ts';
import { sound } from '../game/audio.ts';
import { GAME_ASSETS, UI_ASSETS } from '../game/assets.ts';
import { SciFiFrame, SciFiButton, UI3DIcon } from './SciFiFrame.tsx';

interface GuildPanelProps {
  currentGuild: GuildData | null;
  scrap: number;
  darkMatter: number;
  onCurrencyChange: (newScrap: number, newDarkMatter: number) => void;
  onClose?: () => void;
}

export const GuildPanel: React.FC<GuildPanelProps> = ({
  currentGuild,
  scrap,
  darkMatter,
  onCurrencyChange,
}) => {
  const [activeTab, setActiveTab] = useState<'citadel' | 'roster' | 'chat' | 'settings'>('citadel');
  const [guildDirectory, setGuildDirectory] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [newGuildName, setNewGuildName] = useState('');
  const [newGuildTag, setNewGuildTag] = useState('');
  const [newGuildDesc, setNewGuildDesc] = useState('');
  const [isCreatingGuild, setIsCreatingGuild] = useState(false);
  const [inviteCallsign, setInviteCallsign] = useState('');
  const [inviteFeedback, setInviteFeedback] = useState('');

  // Settings form
  const [editMotd, setEditMotd] = useState(currentGuild?.motd || '');
  const [editDesc, setEditDesc] = useState(currentGuild?.description || '');

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch guilds list for directory
  useEffect(() => {
    fetch('/api/guilds')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.guilds)) {
          setGuildDirectory(data.guilds);
        }
      })
      .catch(() => {});
  }, [currentGuild]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTab, currentGuild?.chat]);

  const currentPlayerMember = currentGuild?.members.find((m) => m.id === multiplayer.playerId);
  const isLeader = currentPlayerMember?.role === 'leader';
  const isOfficer = currentPlayerMember?.role === 'officer' || isLeader;

  const handleCreateGuild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuildName.trim() || !newGuildTag.trim()) return;
    multiplayer.createGuild(newGuildName, newGuildTag, newGuildDesc);
    sound.playUpgrade();
    setIsCreatingGuild(false);
  };

  const handleJoinGuild = (guildId: string) => {
    multiplayer.joinGuild(guildId);
    sound.playUpgrade();
  };

  const handleLeaveGuild = () => {
    multiplayer.leaveGuild();
    sound.playHit(false);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    multiplayer.sendGuildChat(chatInput);
    setChatInput('');
    sound.playLaser('light');
  };

  const handleContribute = (module: 'reactor' | 'relay' | 'fabricator') => {
    const scrapCost = 500;
    const dmCost = 15;

    if (scrap >= scrapCost && darkMatter >= dmCost) {
      onCurrencyChange(scrap - scrapCost, darkMatter - dmCost);
      multiplayer.contributeToCitadel(module, scrapCost, dmCost);
      sound.playUpgrade();
    }
  };

  const handlePromote = (memberId: string) => {
    multiplayer.promoteMember(memberId);
    sound.playUpgrade();
  };

  const handleDemote = (memberId: string) => {
    multiplayer.demoteMember(memberId);
    sound.playHit(false);
  };

  const handleKick = (memberId: string) => {
    multiplayer.kickMember(memberId);
    sound.playExplosion('small');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    multiplayer.updateGuildSettings({
      motd: editMotd,
      description: editDesc,
    });
    sound.playUpgrade();
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCallsign.trim()) return;
    setInviteFeedback(`Fleet Dispatch Transmitted to Pilot "${inviteCallsign}".`);
    setInviteCallsign('');
    setTimeout(() => setInviteFeedback(''), 4000);
  };

  // -------------------------------------------------------------
  // NO GUILD VIEW: Directory & Creation
  // -------------------------------------------------------------
  if (!currentGuild) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 md:p-6 select-none animate-in fade-in duration-200">
        <SciFiFrame variant="cyan" className="p-6 shadow-2xl">
          <SciFiFrame variant="slate" className="relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 p-4">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-35 pointer-events-none overflow-hidden">
              <img
                src={GAME_ASSETS.environment.mothership}
                alt="Fleet Dreadnought Mothership"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent" />
            </div>
            <div className="relative z-10">
              <div className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold mb-1">
                Naval Command Registry
              </div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <UI3DIcon src={UI_ASSETS.icons.hq} size={22} />
                Interstellar Guild Fleets
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-md">
                Enlist in an established guild or commission your own sovereign battlefleet to pool resources and upgrade orbital citadels.
              </p>
            </div>

            <SciFiButton
              variant="cyan"
              active={isCreatingGuild}
              onClick={() => setIsCreatingGuild(!isCreatingGuild)}
              className="relative z-10 px-4 py-2 font-bold text-xs uppercase tracking-wider"
            >
              {isCreatingGuild ? 'View Guilds' : '+ Commission New Guild'}
            </SciFiButton>
          </SciFiFrame>

          {isCreatingGuild ? (
            /* Creation Form */
            <form onSubmit={handleCreateGuild} className="max-w-lg mx-auto space-y-4 text-left">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Guild Fleet Name</label>
                <input
                  type="text"
                  required
                  maxLength={28}
                  placeholder="e.g. Apex Armada"
                  value={newGuildName}
                  onChange={(e) => setNewGuildName(e.target.value)}
                  className="w-full px-3.5 py-2.5 ai-panel-slate text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Fleet Tag (2-5 Characters)</label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  placeholder="e.g. APEX"
                  value={newGuildTag}
                  onChange={(e) => setNewGuildTag(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 ai-panel-slate text-sm text-white focus:outline-none font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Mission Mandate & Description</label>
                <textarea
                  rows={3}
                  maxLength={160}
                  placeholder="Describe your guild's primary operational focus (e.g. Dreadnought boss farming, deep space scrap harvesting)..."
                  value={newGuildDesc}
                  onChange={(e) => setNewGuildDesc(e.target.value)}
                  className="w-full px-3.5 py-2 ai-panel-slate text-xs text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <SciFiButton
                  type="button"
                  variant="slate"
                  onClick={() => setIsCreatingGuild(false)}
                  className="px-4 py-2 text-xs font-mono"
                >
                  Cancel
                </SciFiButton>
                <SciFiButton
                  type="submit"
                  variant="cyan"
                  active
                  className="px-6 py-2 font-bold text-xs font-mono uppercase tracking-wider"
                >
                  Confirm Charter
                </SciFiButton>
              </div>
            </form>
          ) : (
            /* Guild Directory */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {guildDirectory.map((g) => (
                <SciFiFrame
                  key={g.id}
                  variant="slate"
                  className="p-4 flex flex-col justify-between text-left"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 ai-btn-cyan text-cyan-300 font-mono text-xs font-bold">
                          [{g.tag}]
                        </span>
                        <h3 className="text-sm font-bold text-white">{g.name}</h3>
                      </div>
                      <span className="text-xs font-mono text-slate-400">
                        Citadel Lv.{g.citadelLevel}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                      {g.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                    <span className="text-xs font-mono text-slate-500">
                      {g.memberCount} Pilots
                    </span>
                    <SciFiButton
                      variant="cyan"
                      onClick={() => handleJoinGuild(g.id)}
                      className="px-3.5 py-1.5 font-mono text-xs font-medium"
                    >
                      Enlist in Fleet
                    </SciFiButton>
                  </div>
                </SciFiFrame>
              ))}
            </div>
          )}
        </SciFiFrame>
      </div>
    );
  }

  // -------------------------------------------------------------
  // ACTIVE GUILD VIEW
  // -------------------------------------------------------------
  const citadel = currentGuild.citadel;

  return (
    <div className="w-full max-w-5xl mx-auto p-2 md:p-6 select-none animate-in fade-in duration-200">
      <SciFiFrame variant="cyan" className="shadow-2xl flex flex-col overflow-hidden">
        {/* Guild Banner Header */}
        <div className="p-5 border-b border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 ai-thumb-cyan flex items-center justify-center">
              <UI3DIcon src={UI_ASSETS.icons.hq} size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 ai-btn-cyan text-cyan-300 font-mono text-xs font-bold">
                  [{currentGuild.tag}]
                </span>
                <h1 className="text-lg font-bold text-white">{currentGuild.name}</h1>
                <span className="text-xs font-mono text-slate-400">
                  Citadel Rank {citadel.level}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {currentGuild.motd || currentGuild.description}
              </div>
            </div>
          </div>

          {/* Player Vault Balance & Leave */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-mono ai-panel-slate px-3 py-1.5">
              <UI3DIcon src={UI_ASSETS.icons.scrap} size={14} />
              <span className="text-amber-400">{scrap.toLocaleString()}</span>
              <span className="text-slate-600">·</span>
              <UI3DIcon src={UI_ASSETS.icons.darkMatter} size={14} />
              <span className="text-purple-400">{darkMatter} DM</span>
            </div>

            <SciFiButton
              variant="rose"
              onClick={handleLeaveGuild}
              title="Leave Guild Fleet"
              className="px-3 py-1.5 text-xs font-mono font-bold uppercase"
            >
              Leave
            </SciFiButton>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-slate-800/80 overflow-x-auto">
          <SciFiButton
            variant="cyan"
            active={activeTab === 'citadel'}
            onClick={() => setActiveTab('citadel')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium"
          >
            <UI3DIcon src={UI_ASSETS.icons.hq} size={14} />
            Citadel Base ({citadel.level})
          </SciFiButton>

          <SciFiButton
            variant="cyan"
            active={activeTab === 'roster'}
            onClick={() => setActiveTab('roster')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium"
          >
            <UI3DIcon src={UI_ASSETS.icons.hangar} size={14} />
            Fleet Roster ({currentGuild.members.length})
          </SciFiButton>

          <SciFiButton
            variant="cyan"
            active={activeTab === 'chat'}
            onClick={() => setActiveTab('chat')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium"
          >
            <UI3DIcon src={UI_ASSETS.icons.autopilot} size={14} />
            Guild Comm Channel ({currentGuild.chat.length})
          </SciFiButton>

          {isLeader && (
            <SciFiButton
              variant="amber"
              active={activeTab === 'settings'}
              onClick={() => setActiveTab('settings')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium"
            >
              <UI3DIcon src={UI_ASSETS.icons.upgrades} size={14} />
              Guild Settings
            </SciFiButton>
          )}
        </div>

        {/* ========================================================= */}
        {/* TAB 1: CITADEL / STARBASE UPGRADE HUB */}
        {/* ========================================================= */}
        {activeTab === 'citadel' && (
          <div className="p-5 space-y-4 overflow-y-auto max-h-[500px]">
            {/* Overview Card */}
            <SciFiFrame variant="cyan" className="relative overflow-hidden p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="absolute right-0 top-0 bottom-0 w-2/5 opacity-30 pointer-events-none overflow-hidden">
                <img
                  src={GAME_ASSETS.environment.starbase}
                  alt="Orbital Citadel Starbase"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent" />
              </div>

              <div className="relative z-10">
                <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <UI3DIcon src={UI_ASSETS.icons.quantumShard} size={14} />
                  Orbital Citadel Starbase
                </div>
                <h3 className="text-base font-bold text-white">Citadel Core Station</h3>
                <p className="text-xs text-slate-300 max-w-lg mt-0.5">
                  All guild members pool scrap and dark matter into the Citadel Treasury to upgrade defensive and industrial modules that grant passive combat perks to everyone in the guild.
                </p>
              </div>

              <div className="relative z-10 flex items-center gap-3 ai-panel-slate p-2.5 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">VAULT SCRAP</span>
                  <span className="text-amber-400 font-bold tabular-nums">{citadel.vaultScrap.toLocaleString()}</span>
                </div>
                <div className="w-px h-6 bg-slate-800" />
                <div>
                  <span className="text-slate-500 block text-[10px]">VAULT DARK MATTER</span>
                  <span className="text-purple-400 font-bold tabular-nums">{citadel.vaultDarkMatter} DM</span>
                </div>
              </div>
            </SciFiFrame>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Module 1: Reactor */}
              <SciFiFrame variant="amber" className="p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-white">Citadel Reactor</span>
                    <span className="text-xs font-mono text-amber-400 font-bold">Lv.{citadel.reactorLevel}</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                    Overcharges ship scrap collection grids across the star system.
                  </p>
                  <div className="text-xs font-mono text-emerald-400 mb-4">
                    Active Perk: +{citadel.reactorLevel * 5}% Starlight Scrap
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-mono text-slate-500 mb-2">
                    Upgrade Cost: {citadel.reactorLevel * 3000} Vault Scrap
                  </div>
                  <SciFiButton
                    variant="amber"
                    onClick={() => handleContribute('reactor')}
                    disabled={scrap < 500 || darkMatter < 15}
                    className="w-full py-2 font-mono text-xs font-bold"
                  >
                    Contribute (500 Scrap + 15 DM)
                  </SciFiButton>
                </div>
              </SciFiFrame>

              {/* Module 2: Tachyon Relay */}
              <SciFiFrame variant="cyan" className="p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-white">Tachyon Relay Station</span>
                    <span className="text-xs font-mono text-cyan-400 font-bold">Lv.{citadel.relayLevel}</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                    Subspace relay shortening quantum cooldown periods for special abilities.
                  </p>
                  <div className="text-xs font-mono text-emerald-400 mb-4">
                    Active Perk: -{citadel.relayLevel * 3}% Ability Cooldown
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-mono text-slate-500 mb-2">
                    Upgrade Cost: {citadel.relayLevel * 3500} Vault Scrap
                  </div>
                  <SciFiButton
                    variant="cyan"
                    onClick={() => handleContribute('relay')}
                    disabled={scrap < 500 || darkMatter < 15}
                    className="w-full py-2 font-mono text-xs font-bold"
                  >
                    Contribute (500 Scrap + 15 DM)
                  </SciFiButton>
                </div>
              </SciFiFrame>

              {/* Module 3: Fleet Fabricator */}
              <SciFiFrame variant="purple" className="p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-white">Fleet Fabricator</span>
                    <span className="text-xs font-mono text-purple-400 font-bold">Lv.{citadel.fabricatorLevel}</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                    Nanite foundries synthesizing enhanced deflector shielding for members.
                  </p>
                  <div className="text-xs font-mono text-emerald-400 mb-4">
                    Active Perk: +{citadel.fabricatorLevel * 25} Max Deflector Shields
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-mono text-slate-500 mb-2">
                    Upgrade Cost: {citadel.fabricatorLevel * 2500} Vault Scrap
                  </div>
                  <SciFiButton
                    variant="purple"
                    onClick={() => handleContribute('fabricator')}
                    disabled={scrap < 500 || darkMatter < 15}
                    className="w-full py-2 font-mono text-xs font-bold"
                  >
                    Contribute (500 Scrap + 15 DM)
                  </SciFiButton>
                </div>
              </SciFiFrame>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: ROSTER */}
        {/* ========================================================= */}
        {activeTab === 'roster' && (
          <div className="p-5 space-y-4 overflow-y-auto max-h-[500px]">
            {/* Invite Form */}
            {isOfficer && (
              <form onSubmit={handleSendInvite} className="flex gap-2 p-3 ai-panel-slate">
                <input
                  type="text"
                  placeholder="Enter pilot callsign to dispatch guild invite..."
                  value={inviteCallsign}
                  onChange={(e) => setInviteCallsign(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-950/90 border border-slate-700 text-xs text-white focus:outline-none font-mono"
                />
                <SciFiButton
                  type="submit"
                  variant="cyan"
                  active
                  className="px-4 py-1.5 font-mono text-xs font-semibold"
                >
                  + Invite
                </SciFiButton>
              </form>
            )}

            {inviteFeedback && (
              <div className="text-xs font-mono text-cyan-400 p-2 ai-panel-cyan text-center">
                {inviteFeedback}
              </div>
            )}

            {/* Member List */}
            <div className="space-y-2">
              {currentGuild.members.map((member) => {
                const isMemberLeader = member.role === 'leader';
                const isMemberOfficer = member.role === 'officer';
                const isSelf = member.id === multiplayer.playerId;

                return (
                  <SciFiFrame
                    key={member.id}
                    variant={isMemberLeader ? 'amber' : isMemberOfficer ? 'purple' : 'slate'}
                    className="p-3 flex items-center justify-between gap-3 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 ai-thumb-slate flex items-center justify-center font-mono font-bold text-xs text-white">
                        {member.callsign.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{member.callsign}</span>
                          {isSelf && <span className="text-[10px] font-mono text-cyan-400">(You)</span>}
                          <span
                            className={`px-1.5 py-0.2 text-[10px] font-mono uppercase font-bold ${
                              isMemberLeader
                                ? 'ai-btn-amber text-amber-300'
                                : isMemberOfficer
                                ? 'ai-btn-purple text-purple-300'
                                : 'ai-btn-slate text-slate-400'
                            }`}
                          >
                            {member.role}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          Contributed: {member.contributedScrap.toLocaleString()} Scrap · {member.contributedDarkMatter} DM
                        </div>
                      </div>
                    </div>

                    {/* Leader / Officer Controls */}
                    <div className="flex items-center gap-1.5">
                      {isLeader && !isSelf && (
                        <>
                          {member.role === 'member' ? (
                            <SciFiButton
                              variant="cyan"
                              onClick={() => handlePromote(member.id)}
                              title="Promote to Officer"
                              className="px-2 py-1 text-xs font-mono"
                            >
                              ▲
                            </SciFiButton>
                          ) : (
                            <SciFiButton
                              variant="amber"
                              onClick={() => handleDemote(member.id)}
                              title="Demote to Member"
                              className="px-2 py-1 text-xs font-mono"
                            >
                              ▼
                            </SciFiButton>
                          )}
                        </>
                      )}

                      {isOfficer && !isSelf && member.role !== 'leader' && (
                        <SciFiButton
                          variant="rose"
                          onClick={() => handleKick(member.id)}
                          title="Discharge from Fleet"
                          className="px-2 py-1 text-xs font-mono"
                        >
                          ✕
                        </SciFiButton>
                      )}
                    </div>
                  </SciFiFrame>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: LIVE GUILD CHAT */}
        {/* ========================================================= */}
        {activeTab === 'chat' && (
          <div className="p-4 flex flex-col h-[480px]">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 text-left mb-3">
              {currentGuild.chat.map((msg) => {
                const isLeaderMsg = msg.role === 'leader';
                const isOfficerMsg = msg.role === 'officer';
                const isSelf = msg.senderId === multiplayer.playerId;
                const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <SciFiFrame
                    key={msg.id}
                    variant={isSelf ? 'cyan' : 'slate'}
                    className={`p-2.5 text-xs max-w-xl ${isSelf ? 'ml-auto' : ''}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-white font-mono">{msg.senderName}</span>
                      <span
                        className={`text-[9px] font-mono uppercase px-1 py-0.2 font-bold ${
                          isLeaderMsg
                            ? 'text-amber-400'
                            : isOfficerMsg
                            ? 'text-purple-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {msg.role}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 ml-auto">{timeStr}</span>
                    </div>
                    <div className="text-slate-200 break-words leading-relaxed">{msg.text}</div>
                  </SciFiFrame>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendChat} className="flex gap-2">
              <input
                type="text"
                placeholder="Broadcast to guild comms (Enter to send)..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                maxLength={200}
                className="flex-1 px-3.5 py-2.5 ai-panel-slate text-xs text-white focus:outline-none font-mono"
              />
              <SciFiButton
                type="submit"
                variant="cyan"
                active
                className="px-4 py-2.5 font-bold text-xs font-mono"
              >
                Transmit
              </SciFiButton>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: GUILD SETTINGS (Leader Only) */}
        {/* ========================================================= */}
        {activeTab === 'settings' && isLeader && (
          <form onSubmit={handleSaveSettings} className="p-5 space-y-4 max-w-lg mx-auto text-left">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Guild Fleet MotD / Broadcast</label>
              <input
                type="text"
                value={editMotd}
                onChange={(e) => setEditMotd(e.target.value)}
                maxLength={100}
                className="w-full px-3.5 py-2.5 ai-panel-slate text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Guild Description</label>
              <textarea
                rows={3}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                maxLength={160}
                className="w-full px-3.5 py-2 ai-panel-slate text-xs text-white focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <SciFiButton
                type="submit"
                variant="cyan"
                active
                className="px-5 py-2 font-bold text-xs font-mono uppercase tracking-wider"
              >
                Update Guild Directives
              </SciFiButton>
            </div>
          </form>
        )}
      </SciFiFrame>
    </div>
  );
};
