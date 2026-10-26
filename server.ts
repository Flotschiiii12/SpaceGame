import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SquadMember {
  id: string;
  callsign: string;
  shipClass: string;
  x: number;
  y: number;
  angle: number;
  health: number;
  maxHealth: number;
  isFiring: boolean;
  score: number;
  kills: number;
  guildTag?: string;
  skinId?: string;
  laserColor?: string;
  trailEffect?: string;
  lastActive: number;
}

interface SquadRoom {
  code: string;
  members: Map<string, { ws: WebSocket; data: SquadMember }>;
  bossState?: {
    id: string;
    name: string;
    hp: number;
    maxHp: number;
    phase: number;
    active: boolean;
  };
}

// -------------------------------------------------------------
// GUILD TYPES & IN-MEMORY STORE
// -------------------------------------------------------------
export type GuildRole = 'leader' | 'officer' | 'member';

export interface GuildMemberData {
  id: string;
  callsign: string;
  role: GuildRole;
  joinedAt: number;
  contributedScrap: number;
  contributedDarkMatter: number;
}

export interface GuildCitadelData {
  level: number;
  reactorLevel: number; // +5% scrap yield per level
  relayLevel: number; // -3% ability cooldown per level
  fabricatorLevel: number; // +25 max deflector shields per level
  vaultScrap: number;
  vaultDarkMatter: number;
}

export interface GuildChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  role: GuildRole;
  text: string;
  timestamp: number;
}

export interface GuildData {
  id: string;
  name: string;
  tag: string;
  description: string;
  motd: string;
  leaderId: string;
  members: GuildMemberData[];
  citadel: GuildCitadelData;
  chat: GuildChatMessage[];
  createdAt: number;
}

const guilds = new Map<string, GuildData>();
const playerGuildMap = new Map<string, string>(); // playerId -> guildId
const connectedSockets = new Map<string, WebSocket>(); // playerId -> WebSocket

// -------------------------------------------------------------
// GLOBAL LEADERBOARD TYPES & IN-MEMORY STORE
// -------------------------------------------------------------
export interface LeaderboardEntry {
  id: string;
  rank?: number;
  callsign: string;
  score: number;
  sector: number;
  wave: number;
  kills: number;
  shipClass: string;
  guildTag?: string;
  timestamp: number;
}

const globalLeaderboard: LeaderboardEntry[] = [
  {
    id: 'lb-1',
    callsign: 'Commander Vex',
    score: 184200,
    sector: 8,
    wave: 4,
    kills: 412,
    shipClass: 'dreadnought',
    guildTag: 'NOVA',
    timestamp: Date.now() - 3600000 * 4,
  },
  {
    id: 'lb-2',
    callsign: 'Nyx Shadow',
    score: 156800,
    sector: 7,
    wave: 2,
    kills: 345,
    shipClass: 'phantom',
    guildTag: 'VOID',
    timestamp: Date.now() - 3600000 * 7,
  },
  {
    id: 'lb-3',
    callsign: 'Valkyrie-7',
    score: 128450,
    sector: 6,
    wave: 5,
    kills: 280,
    shipClass: 'cruiser',
    guildTag: 'NOVA',
    timestamp: Date.now() - 3600000 * 12,
  },
  {
    id: 'lb-4',
    callsign: 'Ghost-Echo',
    score: 94600,
    sector: 5,
    wave: 3,
    kills: 195,
    shipClass: 'interceptor',
    guildTag: 'APEX',
    timestamp: Date.now() - 3600000 * 18,
  },
  {
    id: 'lb-5',
    callsign: 'StarForge-X',
    score: 82100,
    sector: 4,
    wave: 5,
    kills: 168,
    shipClass: 'dreadnought',
    guildTag: 'NOVA',
    timestamp: Date.now() - 3600000 * 24,
  },
  {
    id: 'lb-6',
    callsign: 'Orion-Pulse',
    score: 71400,
    sector: 4,
    wave: 2,
    kills: 142,
    shipClass: 'phantom',
    guildTag: 'VOID',
    timestamp: Date.now() - 3600000 * 30,
  },
  {
    id: 'lb-7',
    callsign: 'CyberViper',
    score: 59850,
    sector: 3,
    wave: 4,
    kills: 115,
    shipClass: 'interceptor',
    guildTag: 'SOL',
    timestamp: Date.now() - 3600000 * 36,
  },
  {
    id: 'lb-8',
    callsign: 'SolarFlare',
    score: 44200,
    sector: 3,
    wave: 1,
    kills: 89,
    shipClass: 'cruiser',
    guildTag: 'SOL',
    timestamp: Date.now() - 3600000 * 42,
  },
  {
    id: 'lb-9',
    callsign: 'Aura-X',
    score: 36500,
    sector: 2,
    wave: 5,
    kills: 76,
    shipClass: 'cruiser',
    guildTag: 'NOVA',
    timestamp: Date.now() - 3600000 * 48,
  },
  {
    id: 'lb-10',
    callsign: 'ApexPredator',
    score: 28900,
    sector: 2,
    wave: 3,
    kills: 58,
    shipClass: 'interceptor',
    guildTag: 'APEX',
    timestamp: Date.now() - 3600000 * 54,
  },
];

// Pre-seed starter guilds for an active universe
function seedInitialGuilds() {
  const seed1: GuildData = {
    id: 'guild-nova-vanguard',
    name: 'Nova Vanguard',
    tag: 'NOVA',
    description: 'Elite deep-space strike division defending orbital relay stations against dreadnought incursions.',
    motd: 'Fleet raid scheduled at 20:00 UTC. Upgrade the Citadel Reactor for max scrap!',
    leaderId: 'PILOT-VEX',
    members: [
      {
        id: 'PILOT-VEX',
        callsign: 'Commander Vex',
        role: 'leader',
        joinedAt: Date.now() - 86400000 * 5,
        contributedScrap: 12500,
        contributedDarkMatter: 180,
      },
      {
        id: 'PILOT-AURA',
        callsign: 'Lt. Aura',
        role: 'officer',
        joinedAt: Date.now() - 86400000 * 3,
        contributedScrap: 8400,
        contributedDarkMatter: 95,
      },
      {
        id: 'PILOT-KAI',
        callsign: 'Ensign Kai',
        role: 'member',
        joinedAt: Date.now() - 86400000 * 1,
        contributedScrap: 3200,
        contributedDarkMatter: 30,
      },
    ],
    citadel: {
      level: 3,
      reactorLevel: 3,
      relayLevel: 2,
      fabricatorLevel: 2,
      vaultScrap: 4200,
      vaultDarkMatter: 65,
    },
    chat: [
      {
        id: 'chat-1',
        senderId: 'PILOT-VEX',
        senderName: 'Commander Vex',
        role: 'leader',
        text: 'Welcome to Nova Vanguard fleet channel. Coordinate boss raids here!',
        timestamp: Date.now() - 3600000 * 2,
      },
      {
        id: 'chat-2',
        senderId: 'PILOT-AURA',
        senderName: 'Lt. Aura',
        role: 'officer',
        text: 'Citadel Reactor upgraded to Level 3. All members get +15% scrap!',
        timestamp: Date.now() - 1800000,
      },
    ],
    createdAt: Date.now() - 86400000 * 5,
  };

  const seed2: GuildData = {
    id: 'guild-void-syndicate',
    name: 'Void Syndicate',
    tag: 'VOID',
    description: 'Black-market corsairs and stealth phantom pilots ruling the outer asteroid belts.',
    motd: 'Strike from the shadows. Collect Dark Matter at all costs.',
    leaderId: 'PILOT-NYX',
    members: [
      {
        id: 'PILOT-NYX',
        callsign: 'Nyx Shadow',
        role: 'leader',
        joinedAt: Date.now() - 86400000 * 4,
        contributedScrap: 9800,
        contributedDarkMatter: 240,
      },
      {
        id: 'PILOT-RAVEN',
        callsign: 'Raven-9',
        role: 'officer',
        joinedAt: Date.now() - 86400000 * 2,
        contributedScrap: 6100,
        contributedDarkMatter: 110,
      },
    ],
    citadel: {
      level: 2,
      reactorLevel: 2,
      relayLevel: 3,
      fabricatorLevel: 1,
      vaultScrap: 2900,
      vaultDarkMatter: 80,
    },
    chat: [
      {
        id: 'chat-3',
        senderId: 'PILOT-NYX',
        senderName: 'Nyx Shadow',
        role: 'leader',
        text: 'Focus on Phantom stealth micro-missiles against the Eclipse Colossus.',
        timestamp: Date.now() - 3600000 * 3,
      },
    ],
    createdAt: Date.now() - 86400000 * 4,
  };

  guilds.set(seed1.id, seed1);
  guilds.set(seed2.id, seed2);
  playerGuildMap.set('PILOT-VEX', seed1.id);
  playerGuildMap.set('PILOT-AURA', seed1.id);
  playerGuildMap.set('PILOT-KAI', seed1.id);
  playerGuildMap.set('PILOT-NYX', seed2.id);
  playerGuildMap.set('PILOT-RAVEN', seed2.id);
}

seedInitialGuilds();

function broadcastToGuild(guildId: string, message: object) {
  const guild = guilds.get(guildId);
  if (!guild) return;
  const payload = JSON.stringify(message);

  guild.members.forEach((member) => {
    const ws = connectedSockets.get(member.id);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  });
}

// -------------------------------------------------------------
// SQUAD ROOMS STORE
// -------------------------------------------------------------
const rooms = new Map<string, SquadRoom>();

function getOrCreateRoom(code: string): SquadRoom {
  const normalized = (code || 'PUBLIC-FLEET').trim().toUpperCase();
  let room = rooms.get(normalized);
  if (!room) {
    room = {
      code: normalized,
      members: new Map(),
    };
    rooms.set(normalized, room);
  }
  return room;
}

function broadcastToRoom(room: SquadRoom, message: object, senderId?: string) {
  const payload = JSON.stringify(message);
  for (const [id, member] of room.members.entries()) {
    if (id !== senderId && member.ws.readyState === WebSocket.OPEN) {
      member.ws.send(payload);
    }
  }
}

function broadcastToAll(message: object) {
  const payload = JSON.stringify(message);
  for (const ws of connectedSockets.values()) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

export interface GlobalChatMessage {
  id: string;
  senderId: string;
  senderCallsign: string;
  guildTag?: string;
  text: string;
  timestamp: number;
  channel: 'global' | 'guild' | 'system';
}

export interface WorldBossState {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  active: boolean;
  timeLeft: number;
  participantsCount: number;
  playerDamage: number;
  status: 'dormant' | 'active' | 'defeated';
}

const globalChat: GlobalChatMessage[] = [
  {
    id: 'gc-1',
    senderId: 'SYS',
    senderCallsign: 'FLEET-COMMAND',
    channel: 'system',
    text: 'Aether Fleet Stargate Network initialized. Sector Waypoints online.',
    timestamp: Date.now() - 3600000 * 2,
  },
  {
    id: 'gc-2',
    senderId: 'PILOT-VEX',
    senderCallsign: 'Commander Vex',
    guildTag: 'NOVA',
    channel: 'global',
    text: 'Equip EMP disruptor pods before jumping into Sector 3 Void Rifts. Frigate shields are brutal without EMP.',
    timestamp: Date.now() - 3600000,
  },
  {
    id: 'gc-3',
    senderId: 'PILOT-NYX',
    senderCallsign: 'Nyx Shadow',
    guildTag: 'VOID',
    channel: 'global',
    text: 'Phantom Tachyon Lance penetrates straight through carrier escort waves. Massive DPS boost!',
    timestamp: Date.now() - 1800000,
  },
];

let worldBoss: WorldBossState = {
  id: 'wb-leviathan',
  name: 'Void Leviathan Gorgon',
  hp: 220000,
  maxHp: 220000,
  active: true,
  timeLeft: 240,
  participantsCount: 3,
  playerDamage: 0,
  status: 'active',
};

let worldBossCooldown = 60; // seconds when dormant

async function startServer() {
  const app = express();
  app.use(express.json());

  const server = createServer(app);
  const wss = new WebSocketServer({ noServer: true });
  const viteHmrWss = new WebSocketServer({
    noServer: true,
    handleProtocols: (protocols) => {
      if (protocols.has('vite-hmr')) return 'vite-hmr';
      if (protocols.has('vite-ping')) return 'vite-ping';
      return false;
    },
  });

  viteHmrWss.on('connection', (ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'connected' }));
    }
    ws.on('message', () => {
      // Keep-alive for @vite/client ping frames
    });
    ws.on('error', () => {});
  });

  server.on('upgrade', (req, socket, head) => {
    const protocolHeader = String(req.headers['sec-websocket-protocol'] || '');
    if (protocolHeader.includes('vite-hmr') || protocolHeader.includes('vite-ping')) {
      viteHmrWss.handleUpgrade(req, socket, head, (ws) => {
        viteHmrWss.emit('connection', ws, req);
      });
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  });

  // REST endpoints for fleet telemetry & health
  app.get('/api/fleet/status', (req, res) => {
    let totalPilots = 0;
    const roomList = [];
    for (const [code, room] of rooms.entries()) {
      totalPilots += room.members.size;
      roomList.push({
        code,
        pilots: room.members.size,
        hasBoss: !!room.bossState?.active,
      });
    }
    res.json({
      status: 'active',
      activePilots: totalPilots,
      rooms: roomList,
      totalGuilds: guilds.size,
    });
  });

  // REST endpoint to get all guilds
  app.get('/api/guilds', (req, res) => {
    const list = Array.from(guilds.values()).map((g) => ({
      id: g.id,
      name: g.name,
      tag: g.tag,
      description: g.description,
      motd: g.motd,
      memberCount: g.members.length,
      citadelLevel: g.citadel.level,
      createdAt: g.createdAt,
    }));
    res.json({ guilds: list });
  });

  // REST endpoint to get specific guild
  app.get('/api/guilds/:id', (req, res) => {
    const g = guilds.get(req.params.id);
    if (!g) {
      res.status(404).json({ error: 'Guild not found' });
      return;
    }
    res.json({ guild: g });
  });

  // REST endpoints for Global Leaderboard
  app.get('/api/leaderboard', (req, res) => {
    const { shipClass, timeframe, limit } = req.query;
    let list = [...globalLeaderboard];

    if (shipClass && typeof shipClass === 'string' && shipClass !== 'all') {
      list = list.filter((item) => item.shipClass.toLowerCase() === shipClass.toLowerCase());
    }

    if (timeframe === 'today') {
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      list = list.filter((item) => item.timestamp >= oneDayAgo);
    }

    list.sort((a, b) => b.score - a.score);

    const maxLimit = Math.min(100, parseInt((limit as string) || '50', 10));
    const rankedList = list.slice(0, maxLimit).map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    res.json({
      entries: rankedList,
      totalEntries: list.length,
      topThree: rankedList.slice(0, 3),
      updatedAt: Date.now(),
    });
  });

  app.post('/api/leaderboard/submit', (req, res) => {
    const { callsign, score, sector, wave, kills, shipClass, guildTag } = req.body;

    if (!callsign || typeof score !== 'number' || score <= 0) {
      res.status(400).json({ error: 'Valid callsign and positive score required' });
      return;
    }

    const cleanCallsign = String(callsign).trim().substring(0, 20);
    const existingIndex = globalLeaderboard.findIndex(
      (entry) => entry.callsign.toLowerCase() === cleanCallsign.toLowerCase()
    );

    let isNewHighScore = false;
    let entryId = `lb-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    if (existingIndex >= 0) {
      const existing = globalLeaderboard[existingIndex];
      if (score > existing.score) {
        existing.score = score;
        existing.sector = Math.max(existing.sector, sector || 1);
        existing.wave = Math.max(existing.wave, wave || 1);
        existing.kills = Math.max(existing.kills, kills || 0);
        existing.shipClass = shipClass || existing.shipClass;
        if (guildTag) existing.guildTag = guildTag;
        existing.timestamp = Date.now();
        isNewHighScore = true;
        entryId = existing.id;
      }
    } else {
      const newEntry: LeaderboardEntry = {
        id: entryId,
        callsign: cleanCallsign,
        score,
        sector: sector || 1,
        wave: wave || 1,
        kills: kills || 0,
        shipClass: shipClass || 'interceptor',
        guildTag: guildTag || undefined,
        timestamp: Date.now(),
      };
      globalLeaderboard.push(newEntry);
      isNewHighScore = true;
    }

    // Keep sorted descending
    globalLeaderboard.sort((a, b) => b.score - a.score);
    if (globalLeaderboard.length > 200) {
      globalLeaderboard.length = 200;
    }

    const newRank = globalLeaderboard.findIndex((entry) => entry.id === entryId) + 1;

    res.json({
      success: true,
      rank: newRank,
      isNewHighScore,
      entry: globalLeaderboard.find((entry) => entry.id === entryId),
    });
  });

  wss.on('connection', (ws: WebSocket) => {
    let currentRoomCode: string | null = null;
    let playerId: string | null = null;
    let playerCallsign: string = 'Pilot';

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        switch (msg.type) {
          case 'join_room': {
            const { code, callsign, shipClass, skinId, laserColor, trailEffect } = msg;
            const rCode: string = (code || 'PUBLIC-FLEET').trim().toUpperCase();
            const pId: string = msg.playerId || `PILOT-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
            currentRoomCode = rCode;
            playerId = pId;
            playerCallsign = callsign || 'Pilot';

            connectedSockets.set(pId, ws);

            const room = getOrCreateRoom(rCode);

            // Lookup player's guild tag if member
            const guildId = playerGuildMap.get(pId);
            const userGuild = guildId ? guilds.get(guildId) : undefined;

            const memberData: SquadMember = {
              id: pId,
              callsign: playerCallsign,
              shipClass: shipClass || 'interceptor',
              x: msg.x ?? 400,
              y: msg.y ?? 600,
              angle: 0,
              health: 100,
              maxHealth: 100,
              isFiring: false,
              score: 0,
              kills: 0,
              guildTag: userGuild?.tag,
              skinId,
              laserColor,
              trailEffect,
              lastActive: Date.now(),
            };

            room.members.set(pId, { ws, data: memberData });

            const memberList: SquadMember[] = [];
            for (const [, val] of room.members.entries()) {
              memberList.push(val.data);
            }

            ws.send(JSON.stringify({
              type: 'joined_room',
              playerId: pId,
              roomCode: rCode,
              members: memberList,
              bossState: room.bossState,
              guild: userGuild,
              worldBoss,
              globalChat,
            }));

            // Broadcast new member to room
            broadcastToRoom(room, {
              type: 'member_joined',
              member: memberData,
            }, pId);
            break;
          }

          case 'update_state': {
            if (!currentRoomCode || !playerId) return;
            const room = rooms.get(currentRoomCode);
            if (!room) return;

            const existing = room.members.get(playerId);
            if (existing) {
              existing.data.x = msg.x ?? existing.data.x;
              existing.data.y = msg.y ?? existing.data.y;
              existing.data.angle = msg.angle ?? existing.data.angle;
              existing.data.health = msg.health ?? existing.data.health;
              existing.data.maxHealth = msg.maxHealth ?? existing.data.maxHealth;
              existing.data.isFiring = !!msg.isFiring;
              existing.data.score = msg.score ?? existing.data.score;
              existing.data.kills = msg.kills ?? existing.data.kills;
              existing.data.skinId = msg.skinId ?? existing.data.skinId;
              existing.data.laserColor = msg.laserColor ?? existing.data.laserColor;
              existing.data.trailEffect = msg.trailEffect ?? existing.data.trailEffect;
              existing.data.lastActive = Date.now();

              broadcastToRoom(room, {
                type: 'member_state',
                member: existing.data,
              }, playerId);
            }
            break;
          }

          case 'fire_laser': {
            if (!currentRoomCode || !playerId) return;
            const room = rooms.get(currentRoomCode);
            if (!room) return;

            broadcastToRoom(room, {
              type: 'member_fire',
              playerId,
              x: msg.x,
              y: msg.y,
              angle: msg.angle,
              laserType: msg.laserType,
              laserColor: msg.laserColor,
            }, playerId);
            break;
          }

          case 'boss_damage': {
            if (!currentRoomCode) return;
            const room = rooms.get(currentRoomCode);
            if (!room) return;

            if (room.bossState && room.bossState.active) {
              room.bossState.hp = Math.max(0, room.bossState.hp - (msg.damage || 0));
              if (room.bossState.hp <= 0) {
                room.bossState.active = false;
              }
              broadcastToRoom(room, {
                type: 'boss_synced',
                bossState: room.bossState,
                damagedBy: playerId,
                damage: msg.damage,
              });
            }
            break;
          }

          case 'boss_spawn': {
            if (!currentRoomCode) return;
            const room = rooms.get(currentRoomCode);
            if (!room) return;

            room.bossState = {
              id: msg.id || 'boss-1',
              name: msg.name || 'Dreadnought Prime',
              hp: msg.hp || 5000,
              maxHp: msg.maxHp || 5000,
              phase: 1,
              active: true,
            };

            broadcastToRoom(room, {
              type: 'boss_synced',
              bossState: room.bossState,
            });
            break;
          }

          case 'ping_callout': {
            if (!currentRoomCode || !playerId) return;
            const room = rooms.get(currentRoomCode);
            if (!room) return;

            broadcastToRoom(room, {
              type: 'squad_ping',
              playerId,
              callsign: msg.callsign || playerCallsign,
              message: msg.message,
              icon: msg.icon,
            });
            break;
          }

          case 'global_chat_send': {
            const rawText = String(msg.text || '').trim();
            if (!rawText) return;
            const newChat: GlobalChatMessage = {
              id: `gc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              senderId: playerId || 'ANON',
              senderCallsign: playerCallsign || 'Pilot',
              guildTag: msg.guildTag || undefined,
              text: rawText.substring(0, 180),
              timestamp: Date.now(),
              channel: 'global',
            };
            globalChat.push(newChat);
            if (globalChat.length > 80) globalChat.shift();
            broadcastToAll({
              type: 'global_chat_message',
              message: newChat,
            });
            break;
          }

          case 'world_boss_damage': {
            if (!worldBoss.active) return;
            const dmg = Math.max(0, Math.round(Number(msg.damage) || 0));
            worldBoss.hp = Math.max(0, worldBoss.hp - dmg);
            if (worldBoss.hp <= 0) {
              worldBoss.active = false;
              worldBoss.status = 'defeated';
              worldBossCooldown = 90;
              const rewardMsg: GlobalChatMessage = {
                id: `gc-${Date.now()}`,
                senderId: 'SYS',
                senderCallsign: 'FLEET-COMMAND',
                channel: 'system',
                text: `VICTORY! ${worldBoss.name} has been neutralized by fleet pilot ${playerCallsign}! +3500 Scrap & +40 Dark Matter awarded!`,
                timestamp: Date.now(),
              };
              globalChat.push(rewardMsg);
              broadcastToAll({ type: 'global_chat_message', message: rewardMsg });
              broadcastToAll({ type: 'world_boss_defeated', worldBoss, slayer: playerCallsign });
            } else {
              broadcastToAll({
                type: 'world_boss_synced',
                worldBoss,
                damage: dmg,
                damagedBy: playerId,
              });
            }
            break;
          }

          // =========================================================
          // GUILD ACTIONS
          // =========================================================
          case 'guild_create': {
            if (!playerId) return;
            const { name, tag, description } = msg;
            const cleanName = (name || 'New Fleet Guild').trim();
            const cleanTag = (tag || 'GUILD').trim().toUpperCase().substring(0, 5);

            const newGuildId = `guild-${Date.now()}`;
            const newGuild: GuildData = {
              id: newGuildId,
              name: cleanName,
              tag: cleanTag,
              description: description || 'A sovereign fleet collective.',
              motd: `Welcome to ${cleanName}! Upgrade the Citadel to unlock fleet perks.`,
              leaderId: playerId,
              members: [
                {
                  id: playerId,
                  callsign: playerCallsign,
                  role: 'leader',
                  joinedAt: Date.now(),
                  contributedScrap: 0,
                  contributedDarkMatter: 0,
                },
              ],
              citadel: {
                level: 1,
                reactorLevel: 1,
                relayLevel: 1,
                fabricatorLevel: 1,
                vaultScrap: 0,
                vaultDarkMatter: 0,
              },
              chat: [
                {
                  id: `chat-${Date.now()}`,
                  senderId: playerId,
                  senderName: playerCallsign,
                  role: 'leader',
                  text: `Guild ${cleanName} [${cleanTag}] commissioned! All systems online.`,
                  timestamp: Date.now(),
                },
              ],
              createdAt: Date.now(),
            };

            guilds.set(newGuildId, newGuild);
            playerGuildMap.set(playerId, newGuildId);

            ws.send(JSON.stringify({
              type: 'guild_synced',
              guild: newGuild,
            }));
            break;
          }

          case 'guild_join': {
            if (!playerId) return;
            const { guildId } = msg;
            const targetGuild = guilds.get(guildId);
            if (!targetGuild) {
              ws.send(JSON.stringify({ type: 'guild_error', message: 'Guild not found.' }));
              return;
            }

            // Remove from existing guild if any
            const oldGuildId = playerGuildMap.get(playerId);
            if (oldGuildId && oldGuildId !== guildId) {
              const oldGuild = guilds.get(oldGuildId);
              if (oldGuild) {
                oldGuild.members = oldGuild.members.filter((m) => m.id !== playerId);
                broadcastToGuild(oldGuildId, { type: 'guild_synced', guild: oldGuild });
              }
            }

            // Add to new guild if not already member
            const existingMember = targetGuild.members.find((m) => m.id === playerId);
            if (!existingMember) {
              targetGuild.members.push({
                id: playerId,
                callsign: playerCallsign,
                role: 'member',
                joinedAt: Date.now(),
                contributedScrap: 0,
                contributedDarkMatter: 0,
              });

              targetGuild.chat.push({
                id: `chat-${Date.now()}`,
                senderId: 'SYSTEM',
                senderName: 'Command',
                role: 'member',
                text: `${playerCallsign} joined the guild fleet!`,
                timestamp: Date.now(),
              });
            }

            playerGuildMap.set(playerId, guildId);

            broadcastToGuild(guildId, {
              type: 'guild_synced',
              guild: targetGuild,
            });
            break;
          }

          case 'guild_leave': {
            if (!playerId) return;
            const gId = playerGuildMap.get(playerId);
            if (!gId) return;
            const guild = guilds.get(gId);
            if (guild) {
              guild.members = guild.members.filter((m) => m.id !== playerId);
              playerGuildMap.delete(playerId);

              guild.chat.push({
                id: `chat-${Date.now()}`,
                senderId: 'SYSTEM',
                senderName: 'Command',
                role: 'member',
                text: `${playerCallsign} departed the guild.`,
                timestamp: Date.now(),
              });

              broadcastToGuild(gId, { type: 'guild_synced', guild });
            }

            ws.send(JSON.stringify({
              type: 'guild_synced',
              guild: null,
            }));
            break;
          }

          case 'guild_promote': {
            if (!playerId) return;
            const gId = playerGuildMap.get(playerId);
            if (!gId) return;
            const guild = guilds.get(gId);
            if (!guild) return;

            // Only leader can promote
            if (guild.leaderId !== playerId) {
              ws.send(JSON.stringify({ type: 'guild_error', message: 'Only Guild Leader can promote members.' }));
              return;
            }

            const target = guild.members.find((m) => m.id === msg.targetMemberId);
            if (target && target.role === 'member') {
              target.role = 'officer';
              guild.chat.push({
                id: `chat-${Date.now()}`,
                senderId: 'SYSTEM',
                senderName: 'Command',
                role: 'leader',
                text: `${target.callsign} has been promoted to Officer!`,
                timestamp: Date.now(),
              });
              broadcastToGuild(gId, { type: 'guild_synced', guild });
            }
            break;
          }

          case 'guild_demote': {
            if (!playerId) return;
            const gId = playerGuildMap.get(playerId);
            if (!gId) return;
            const guild = guilds.get(gId);
            if (!guild || guild.leaderId !== playerId) return;

            const target = guild.members.find((m) => m.id === msg.targetMemberId);
            if (target && target.role === 'officer') {
              target.role = 'member';
              guild.chat.push({
                id: `chat-${Date.now()}`,
                senderId: 'SYSTEM',
                senderName: 'Command',
                role: 'leader',
                text: `${target.callsign} has been demoted to Member.`,
                timestamp: Date.now(),
              });
              broadcastToGuild(gId, { type: 'guild_synced', guild });
            }
            break;
          }

          case 'guild_kick': {
            if (!playerId) return;
            const gId = playerGuildMap.get(playerId);
            if (!gId) return;
            const guild = guilds.get(gId);
            if (!guild) return;

            const requester = guild.members.find((m) => m.id === playerId);
            if (!requester || (requester.role !== 'leader' && requester.role !== 'officer')) {
              ws.send(JSON.stringify({ type: 'guild_error', message: 'Insufficient rank to kick members.' }));
              return;
            }

            const targetIndex = guild.members.findIndex((m) => m.id === msg.targetMemberId);
            if (targetIndex !== -1) {
              const kicked = guild.members[targetIndex];
              if (kicked.role === 'leader') return; // Cannot kick leader

              guild.members.splice(targetIndex, 1);
              playerGuildMap.delete(msg.targetMemberId);

              guild.chat.push({
                id: `chat-${Date.now()}`,
                senderId: 'SYSTEM',
                senderName: 'Command',
                role: 'leader',
                text: `${kicked.callsign} was discharged from the guild fleet.`,
                timestamp: Date.now(),
              });

              // Notify kicked player if connected
              const kickedWs = connectedSockets.get(msg.targetMemberId);
              if (kickedWs && kickedWs.readyState === WebSocket.OPEN) {
                kickedWs.send(JSON.stringify({ type: 'guild_synced', guild: null }));
              }

              broadcastToGuild(gId, { type: 'guild_synced', guild });
            }
            break;
          }

          case 'guild_settings': {
            if (!playerId) return;
            const gId = playerGuildMap.get(playerId);
            if (!gId) return;
            const guild = guilds.get(gId);
            if (!guild || guild.leaderId !== playerId) return;

            if (msg.motd !== undefined) guild.motd = String(msg.motd).trim();
            if (msg.description !== undefined) guild.description = String(msg.description).trim();
            if (msg.tag !== undefined) guild.tag = String(msg.tag).trim().toUpperCase().substring(0, 5);

            broadcastToGuild(gId, { type: 'guild_synced', guild });
            break;
          }

          case 'guild_chat_send': {
            if (!playerId) return;
            const gId = playerGuildMap.get(playerId);
            if (!gId) return;
            const guild = guilds.get(gId);
            if (!guild) return;

            const senderMember = guild.members.find((m) => m.id === playerId);
            const role = senderMember?.role || 'member';

            const newMsg: GuildChatMessage = {
              id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
              senderId: playerId,
              senderName: playerCallsign,
              role,
              text: String(msg.text || '').substring(0, 200),
              timestamp: Date.now(),
            };

            guild.chat.push(newMsg);
            if (guild.chat.length > 50) guild.chat.shift(); // retain last 50

            broadcastToGuild(gId, {
              type: 'guild_chat_message',
              message: newMsg,
            });
            break;
          }

          case 'guild_contribute': {
            if (!playerId) return;
            const gId = playerGuildMap.get(playerId);
            if (!gId) return;
            const guild = guilds.get(gId);
            if (!guild) return;

            const scrapAmount = Math.max(0, Math.floor(Number(msg.scrap) || 0));
            const dmAmount = Math.max(0, Math.floor(Number(msg.darkMatter) || 0));
            const targetModule = msg.module as 'reactor' | 'relay' | 'fabricator';

            guild.citadel.vaultScrap += scrapAmount;
            guild.citadel.vaultDarkMatter += dmAmount;

            const member = guild.members.find((m) => m.id === playerId);
            if (member) {
              member.contributedScrap += scrapAmount;
              member.contributedDarkMatter += dmAmount;
            }

            // Check if funds trigger level up on module
            const reactorCostScrap = guild.citadel.reactorLevel * 3000;
            const relayCostScrap = guild.citadel.relayLevel * 3500;
            const fabricatorCostScrap = guild.citadel.fabricatorLevel * 2500;

            if (targetModule === 'reactor' && guild.citadel.vaultScrap >= reactorCostScrap) {
              guild.citadel.vaultScrap -= reactorCostScrap;
              guild.citadel.reactorLevel++;
              guild.citadel.level = Math.max(guild.citadel.level, guild.citadel.reactorLevel);
              guild.chat.push({
                id: `chat-${Date.now()}`,
                senderId: 'SYSTEM',
                senderName: 'Citadel AI',
                role: 'leader',
                text: `Citadel Reactor upgraded to Lv.${guild.citadel.reactorLevel}! +${guild.citadel.reactorLevel * 5}% scrap bonus active for all guild members!`,
                timestamp: Date.now(),
              });
            } else if (targetModule === 'relay' && guild.citadel.vaultScrap >= relayCostScrap) {
              guild.citadel.vaultScrap -= relayCostScrap;
              guild.citadel.relayLevel++;
              guild.citadel.level = Math.max(guild.citadel.level, guild.citadel.relayLevel);
              guild.chat.push({
                id: `chat-${Date.now()}`,
                senderId: 'SYSTEM',
                senderName: 'Citadel AI',
                role: 'leader',
                text: `Tachyon Relay Station upgraded to Lv.${guild.citadel.relayLevel}! -${guild.citadel.relayLevel * 3}% ability cooldown active!`,
                timestamp: Date.now(),
              });
            } else if (targetModule === 'fabricator' && guild.citadel.vaultScrap >= fabricatorCostScrap) {
              guild.citadel.vaultScrap -= fabricatorCostScrap;
              guild.citadel.fabricatorLevel++;
              guild.citadel.level = Math.max(guild.citadel.level, guild.citadel.fabricatorLevel);
              guild.chat.push({
                id: `chat-${Date.now()}`,
                senderId: 'SYSTEM',
                senderName: 'Citadel AI',
                role: 'leader',
                text: `Fleet Fabricator upgraded to Lv.${guild.citadel.fabricatorLevel}! +${guild.citadel.fabricatorLevel * 25} shields for all guild members!`,
                timestamp: Date.now(),
              });
            }

            broadcastToGuild(gId, {
              type: 'guild_synced',
              guild,
            });
            break;
          }
        }
      } catch (err) {
        // Safe json handling
      }
    });

    ws.on('close', () => {
      if (playerId) {
        connectedSockets.delete(playerId);
      }
      if (currentRoomCode && playerId) {
        const room = rooms.get(currentRoomCode);
        if (room) {
          room.members.delete(playerId);
          broadcastToRoom(room, {
            type: 'member_left',
            playerId,
          });

          if (room.members.size === 0) {
            rooms.delete(currentRoomCode);
          }
        }
      }
    });
  });

  // Serve static files in production or mount Vite middleware in development
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  // 1-second World Boss Anomaly lifecycle ticker
  setInterval(() => {
    if (worldBoss.active) {
      worldBoss.timeLeft = Math.max(0, worldBoss.timeLeft - 1);
      worldBoss.participantsCount = Math.max(1, connectedSockets.size);

      if (worldBoss.timeLeft <= 0) {
        worldBoss.active = false;
        worldBoss.status = 'dormant';
        worldBossCooldown = 75;
        const escapeMsg: GlobalChatMessage = {
          id: `gc-${Date.now()}`,
          senderId: 'SYS',
          senderCallsign: 'FLEET-COMMAND',
          channel: 'system',
          text: `ANOMALY LOST: ${worldBoss.name} slipped through the event horizon into hyperspace. Sensor sweep initiating...`,
          timestamp: Date.now(),
        };
        globalChat.push(escapeMsg);
        broadcastToAll({ type: 'global_chat_message', message: escapeMsg });
        broadcastToAll({ type: 'world_boss_synced', worldBoss });
      } else if (worldBoss.timeLeft % 3 === 0) {
        broadcastToAll({ type: 'world_boss_synced', worldBoss });
      }
    } else {
      worldBossCooldown = Math.max(0, worldBossCooldown - 1);
      if (worldBossCooldown <= 0) {
        const bossPool = [
          'Void Leviathan Gorgon',
          'Eclipse Super-Colossus',
          'Chronos World-Eater',
          'Omega Sovereign Prime',
        ];
        const chosen = bossPool[Math.floor(Math.random() * bossPool.length)];
        const bossHp = 220000 + Math.floor(Math.random() * 60000);
        worldBoss = {
          id: `wb-${Date.now()}`,
          name: chosen,
          hp: bossHp,
          maxHp: bossHp,
          active: true,
          timeLeft: 240,
          participantsCount: Math.max(1, connectedSockets.size),
          playerDamage: 0,
          status: 'active',
        };
        const spawnMsg: GlobalChatMessage = {
          id: `gc-${Date.now()}`,
          senderId: 'SYS',
          senderCallsign: 'ALERT',
          channel: 'system',
          text: `CRITICAL ALERT: ${chosen} anomaly detected in Deep Void! All fleet battlecruisers scramble to intercept!`,
          timestamp: Date.now(),
        };
        globalChat.push(spawnMsg);
        if (globalChat.length > 80) globalChat.shift();
        broadcastToAll({ type: 'global_chat_message', message: spawnMsg });
        broadcastToAll({ type: 'world_boss_synced', worldBoss });
      }
    }
  }, 1000);

  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
