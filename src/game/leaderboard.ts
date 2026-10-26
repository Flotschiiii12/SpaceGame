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

export interface PersonalBest {
  score: number;
  sector: number;
  wave: number;
  kills: number;
  shipClass: string;
  date: string;
  rank?: number;
}

const DEFAULT_FALLBACK_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: 'lb-1',
    rank: 1,
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
    rank: 2,
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
    rank: 3,
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
    rank: 4,
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
    rank: 5,
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
    rank: 6,
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
    rank: 7,
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
    rank: 8,
    callsign: 'SolarFlare',
    score: 44200,
    sector: 3,
    wave: 1,
    kills: 89,
    shipClass: 'cruiser',
    guildTag: 'SOL',
    timestamp: Date.now() - 3600000 * 42,
  },
];

class LeaderboardClient {
  public entries: LeaderboardEntry[] = [...DEFAULT_FALLBACK_LEADERBOARD];
  public topThree: LeaderboardEntry[] = DEFAULT_FALLBACK_LEADERBOARD.slice(0, 3);
  public personalBest: PersonalBest | null = null;
  public onUpdated?: (entries: LeaderboardEntry[]) => void;
  public isLoading: boolean = false;

  constructor() {
    this.loadPersonalBest();
    this.fetchLeaderboard();
  }

  public loadPersonalBest(): PersonalBest | null {
    try {
      const saved = localStorage.getItem('aether_high_score');
      if (saved) {
        this.personalBest = JSON.parse(saved);
        return this.personalBest;
      }
    } catch (e) {}
    return null;
  }

  public async fetchLeaderboard(options?: { shipClass?: string; timeframe?: string }): Promise<LeaderboardEntry[]> {
    this.isLoading = true;
    try {
      const params = new URLSearchParams();
      if (options?.shipClass && options.shipClass !== 'all') {
        params.set('shipClass', options.shipClass);
      }
      if (options?.timeframe && options.timeframe !== 'all') {
        params.set('timeframe', options.timeframe);
      }

      const res = await fetch(`/api/leaderboard?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.entries)) {
          this.entries = data.entries;
          this.topThree = data.topThree || data.entries.slice(0, 3);

          // Update personal best rank if matching callsign found
          if (this.personalBest) {
            const myEntry = this.entries.find((e) => e.score === this.personalBest?.score);
            if (myEntry?.rank) {
              this.personalBest.rank = myEntry.rank;
            }
          }

          if (this.onUpdated) {
            this.onUpdated(this.entries);
          }
          return this.entries;
        }
      }
    } catch (e) {
      // Offline fallback
    } finally {
      this.isLoading = false;
    }
    return this.entries;
  }

  public async submitScore(data: {
    callsign: string;
    score: number;
    sector: number;
    wave: number;
    kills: number;
    shipClass: string;
    guildTag?: string;
  }): Promise<{ success: boolean; rank?: number; isNewHighScore?: boolean }> {
    if (data.score <= 0) return { success: false };

    // Check personal best
    let isPersonalBest = false;
    if (!this.personalBest || data.score > this.personalBest.score) {
      this.personalBest = {
        score: data.score,
        sector: data.sector,
        wave: data.wave,
        kills: data.kills,
        shipClass: data.shipClass,
        date: new Date().toLocaleDateString(),
      };
      isPersonalBest = true;
      try {
        localStorage.setItem('aether_high_score', JSON.stringify(this.personalBest));
      } catch (e) {}
    }

    try {
      const res = await fetch('/api/leaderboard/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.rank && this.personalBest) {
          this.personalBest.rank = result.rank;
        }
        await this.fetchLeaderboard();
        return {
          success: true,
          rank: result.rank,
          isNewHighScore: result.isNewHighScore || isPersonalBest,
        };
      }
    } catch (e) {
      // Local injection fallback if network issue
      const localExisting = this.entries.find(
        (e) => e.callsign.toLowerCase() === data.callsign.toLowerCase()
      );
      if (localExisting) {
        if (data.score > localExisting.score) {
          localExisting.score = data.score;
          localExisting.sector = Math.max(localExisting.sector, data.sector);
          localExisting.wave = Math.max(localExisting.wave, data.wave);
          localExisting.kills = Math.max(localExisting.kills, data.kills);
        }
      } else {
        this.entries.push({
          id: `lb-local-${Date.now()}`,
          callsign: data.callsign,
          score: data.score,
          sector: data.sector,
          wave: data.wave,
          kills: data.kills,
          shipClass: data.shipClass,
          guildTag: data.guildTag,
          timestamp: Date.now(),
        });
      }
      this.entries.sort((a, b) => b.score - a.score);
      this.entries.forEach((entry, idx) => {
        entry.rank = idx + 1;
      });
      this.topThree = this.entries.slice(0, 3);
      if (this.onUpdated) this.onUpdated(this.entries);
    }

    return { success: true, isNewHighScore: isPersonalBest };
  }
}

export const leaderboardClient = new LeaderboardClient();
