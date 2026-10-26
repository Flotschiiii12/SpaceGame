import { ShipClassId, SquadRemotePilot, GuildData, GuildChatMessage, GlobalChatMessage, WorldBossState } from './types.ts';
import { cosmetics } from './cosmetics.ts';

export interface SquadPingEvent {
  playerId: string;
  callsign: string;
  message: string;
  icon: string;
}

export interface BossSyncEvent {
  bossState: {
    id: string;
    name: string;
    hp: number;
    maxHp: number;
    phase: number;
    active: boolean;
  };
  damagedBy?: string;
  damage?: number;
}

export class MultiplayerClient {
  private ws: WebSocket | null = null;
  public playerId: string = '';
  public roomCode: string = 'PUBLIC-FLEET';
  public callsign: string = 'Vanguard-1';
  public shipClass: ShipClassId = 'interceptor';
  public remotePilots: Map<string, SquadRemotePilot> = new Map();
  public isConnected: boolean = false;
  private lastUpdateSent: number = 0;

  // Guild State
  public currentGuild: GuildData | null = null;

  // Global Comms & World Boss State
  public globalChat: GlobalChatMessage[] = [];
  public worldBoss: WorldBossState | null = null;

  // Callbacks
  public onMembersChanged?: (pilots: SquadRemotePilot[]) => void;
  public onBossSynced?: (event: BossSyncEvent) => void;
  public onSquadPing?: (ping: SquadPingEvent) => void;
  public onRemoteLaserFired?: (laser: { playerId: string; x: number; y: number; angle: number; laserType: string; laserColor?: string }) => void;
  public onGuildSynced?: (guild: GuildData | null) => void;
  public onGuildChatMessage?: (message: GuildChatMessage) => void;
  public onGuildError?: (error: string) => void;
  public onGlobalChatReceived?: (message: GlobalChatMessage) => void;
  public onGlobalChatHistory?: (messages: GlobalChatMessage[]) => void;
  public onWorldBossUpdated?: (worldBoss: WorldBossState) => void;
  public onWorldBossDefeated?: (event: { worldBoss: WorldBossState; slayer: string }) => void;

  constructor() {
    try {
      const savedCallsign = localStorage.getItem('aether_callsign');
      if (savedCallsign) {
        this.callsign = savedCallsign;
      } else {
        const randNum = Math.floor(10 + Math.random() * 89);
        this.callsign = `Wing-${randNum}`;
      }
    } catch (e) {}
  }

  public setCallsign(name: string) {
    this.callsign = name.trim() || 'Pilot';
    try {
      localStorage.setItem('aether_callsign', this.callsign);
    } catch (e) {}
  }

  public connect(roomCode: string = 'PUBLIC-FLEET', shipClass: ShipClassId = 'interceptor') {
    this.roomCode = roomCode.trim().toUpperCase() || 'PUBLIC-FLEET';
    this.shipClass = shipClass;

    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host || 'localhost:3000';
    const wsUrl = `${protocol}//${host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.send({
          type: 'join_room',
          code: this.roomCode,
          callsign: this.callsign,
          shipClass: this.shipClass,
          skinId: cosmetics.equipped.skinId,
          laserColor: cosmetics.equipped.laserColor,
          trailEffect: cosmetics.equipped.trailEffect,
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleMessage(msg);
        } catch (e) {}
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.remotePilots.clear();
        this.notifyMembers();
      };

      this.ws.onerror = () => {
        this.isConnected = false;
      };
    } catch (err) {
      console.warn('WebSocket connection not available; running in local fleet mode.', err);
      this.isConnected = false;
    }
  }

  private handleMessage(msg: any) {
    switch (msg.type) {
      case 'joined_room':
        this.playerId = msg.playerId;
        this.roomCode = msg.roomCode;
        this.remotePilots.clear();
        if (Array.isArray(msg.members)) {
          msg.members.forEach((m: SquadRemotePilot) => {
            if (m.id !== this.playerId) {
              this.remotePilots.set(m.id, m);
            }
          });
        }
        this.notifyMembers();
        if (msg.bossState && this.onBossSynced) {
          this.onBossSynced({ bossState: msg.bossState });
        }
        if (msg.worldBoss) {
          this.worldBoss = msg.worldBoss;
          if (this.onWorldBossUpdated) this.onWorldBossUpdated(msg.worldBoss);
        }
        if (Array.isArray(msg.globalChat)) {
          this.globalChat = msg.globalChat;
          if (this.onGlobalChatHistory) this.onGlobalChatHistory(msg.globalChat);
        }
        if (msg.guild) {
          this.currentGuild = msg.guild;
          if (this.onGuildSynced) this.onGuildSynced(msg.guild);
        }
        break;

      case 'global_chat_history':
        if (Array.isArray(msg.messages)) {
          this.globalChat = msg.messages;
          if (this.onGlobalChatHistory) this.onGlobalChatHistory(msg.messages);
        }
        break;

      case 'global_chat_message':
        if (msg.message) {
          this.globalChat.push(msg.message);
          if (this.globalChat.length > 80) this.globalChat.shift();
          if (this.onGlobalChatReceived) this.onGlobalChatReceived(msg.message);
        }
        break;

      case 'world_boss_synced':
        if (msg.worldBoss) {
          this.worldBoss = msg.worldBoss;
          if (this.onWorldBossUpdated) this.onWorldBossUpdated(msg.worldBoss);
        }
        break;

      case 'world_boss_defeated':
        if (this.onWorldBossDefeated) {
          this.onWorldBossDefeated(msg);
        }
        break;

      case 'member_joined':
        if (msg.member && msg.member.id !== this.playerId) {
          this.remotePilots.set(msg.member.id, msg.member);
          this.notifyMembers();
        }
        break;

      case 'member_left':
        if (msg.playerId) {
          this.remotePilots.delete(msg.playerId);
          this.notifyMembers();
        }
        break;

      case 'member_state':
        if (msg.member && msg.member.id !== this.playerId) {
          this.remotePilots.set(msg.member.id, msg.member);
          this.notifyMembers();
        }
        break;

      case 'member_fire':
        if (this.onRemoteLaserFired) {
          this.onRemoteLaserFired(msg);
        }
        break;

      case 'boss_synced':
        if (this.onBossSynced) {
          this.onBossSynced(msg);
        }
        break;

      case 'squad_ping':
        if (this.onSquadPing) {
          this.onSquadPing(msg);
        }
        break;

      // Guild real-time events
      case 'guild_synced':
        this.currentGuild = msg.guild;
        if (this.onGuildSynced) {
          this.onGuildSynced(msg.guild);
        }
        break;

      case 'guild_chat_message':
        if (this.currentGuild && msg.message) {
          this.currentGuild.chat.push(msg.message);
          if (this.currentGuild.chat.length > 50) this.currentGuild.chat.shift();
        }
        if (this.onGuildChatMessage) {
          this.onGuildChatMessage(msg.message);
        }
        break;

      case 'guild_error':
        if (this.onGuildError) {
          this.onGuildError(msg.message || 'Guild operation failed.');
        }
        break;
    }
  }

  public sendGlobalChat(text: string) {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.send({
      type: 'global_chat_send',
      text,
      guildTag: this.currentGuild?.tag,
    });
  }

  public attackWorldBoss(damage: number) {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.send({
      type: 'world_boss_damage',
      damage: Math.round(damage),
    });
  }

  private notifyMembers() {
    if (this.onMembersChanged) {
      this.onMembersChanged(Array.from(this.remotePilots.values()));
    }
  }

  public sendState(x: number, y: number, angle: number, health: number, maxHealth: number, isFiring: boolean, score: number, kills: number) {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const now = performance.now();
    if (now - this.lastUpdateSent < 50) return;
    this.lastUpdateSent = now;

    this.send({
      type: 'update_state',
      x: Math.round(x),
      y: Math.round(y),
      angle: Number(angle.toFixed(2)),
      health: Math.round(health),
      maxHealth: Math.round(maxHealth),
      isFiring,
      score,
      kills,
      skinId: cosmetics.equipped.skinId,
      laserColor: cosmetics.equipped.laserColor,
      trailEffect: cosmetics.equipped.trailEffect,
    });
  }

  public broadcastLaser(x: number, y: number, angle: number, laserType: string, laserColor?: string) {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.send({
      type: 'fire_laser',
      x: Math.round(x),
      y: Math.round(y),
      angle: Number(angle.toFixed(2)),
      laserType,
      laserColor,
    });
  }

  public broadcastBossDamage(damage: number) {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.send({
      type: 'boss_damage',
      damage: Math.round(damage),
    });
  }

  public broadcastBossSpawn(boss: { id: string; name: string; hp: number; maxHp: number }) {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.send({
      type: 'boss_spawn',
      ...boss,
    });
  }

  public sendPing(message: string, icon: string = '🎯') {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.send({
      type: 'ping_callout',
      callsign: this.callsign,
      message,
      icon,
    });
  }

  // -------------------------------------------------------------
  // GUILD ACTIONS
  // -------------------------------------------------------------
  public createGuild(name: string, tag: string, description: string) {
    this.send({
      type: 'guild_create',
      name,
      tag,
      description,
    });
  }

  public joinGuild(guildId: string) {
    this.send({
      type: 'guild_join',
      guildId,
    });
  }

  public leaveGuild() {
    this.send({
      type: 'guild_leave',
    });
  }

  public promoteMember(targetMemberId: string) {
    this.send({
      type: 'guild_promote',
      targetMemberId,
    });
  }

  public demoteMember(targetMemberId: string) {
    this.send({
      type: 'guild_demote',
      targetMemberId,
    });
  }

  public kickMember(targetMemberId: string) {
    this.send({
      type: 'guild_kick',
      targetMemberId,
    });
  }

  public updateGuildSettings(settings: { motd?: string; description?: string; tag?: string }) {
    this.send({
      type: 'guild_settings',
      ...settings,
    });
  }

  public sendGuildChat(text: string) {
    if (!text.trim()) return;
    this.send({
      type: 'guild_chat_send',
      text: text.trim(),
    });
  }

  public contributeToCitadel(module: 'reactor' | 'relay' | 'fabricator', scrap: number, darkMatter: number) {
    this.send({
      type: 'guild_contribute',
      module,
      scrap,
      darkMatter,
    });
  }

  private send(data: object) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  public disconnect() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }
    this.isConnected = false;
    this.remotePilots.clear();
  }
}

export const multiplayer = new MultiplayerClient();
