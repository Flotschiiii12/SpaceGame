import { sound } from './audio.ts';

export type MissionType =
  | 'destroy_enemies'
  | 'defeat_bosses'
  | 'survive_time'
  | 'destroy_asteroids'
  | 'trigger_special'
  | 'deal_damage'
  | 'collect_scrap'
  | 'execute_criticals';

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  type: MissionType;
  target: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
  rewardScrap: number;
  rewardDarkMatter: number;
  icon: string;
}

export interface DailyMissionsState {
  date: string;
  missions: DailyMission[];
  bonusClaimed: boolean;
}

const MISSION_TEMPLATES: Array<Omit<DailyMission, 'id' | 'progress' | 'completed' | 'claimed'>> = [
  {
    title: 'Void Swarm Cleansing',
    description: 'Vaporize 50 hostile enemy vessels across any sector.',
    type: 'destroy_enemies',
    target: 50,
    rewardScrap: 850,
    rewardDarkMatter: 18,
    icon: 'Crosshair',
  },
  {
    title: 'Asteroid Field Demolition',
    description: 'Obliterate 30 drifting cosmic asteroids and extract minerals.',
    type: 'destroy_asteroids',
    target: 30,
    rewardScrap: 750,
    rewardDarkMatter: 15,
    icon: 'Sparkles',
  },
  {
    title: 'Deep Space Endurance',
    description: 'Survive in active hostile combat for 5 minutes (300s).',
    type: 'survive_time',
    target: 300,
    rewardScrap: 1100,
    rewardDarkMatter: 25,
    icon: 'Shield',
  },
  {
    title: 'Capital Boss Takedown',
    description: 'Neutralize 2 Capital Dreadnought or Colossus boss flagships.',
    type: 'defeat_bosses',
    target: 2,
    rewardScrap: 1600,
    rewardDarkMatter: 40,
    icon: 'Award',
  },
  {
    title: 'Tactical Overdrive Burst',
    description: 'Activate your starship signature Special Ability 8 times.',
    type: 'trigger_special',
    target: 8,
    rewardScrap: 700,
    rewardDarkMatter: 15,
    icon: 'Zap',
  },
  {
    title: 'Heavy Kinetic Bombardment',
    description: 'Inflict 35,000 total cumulative damage to hostile targets.',
    type: 'deal_damage',
    target: 35000,
    rewardScrap: 1200,
    rewardDarkMatter: 25,
    icon: 'Flame',
  },
  {
    title: 'Salvage Collector',
    description: 'Harvest 2,000 Starlight Scrap from shattered debris.',
    type: 'collect_scrap',
    target: 2000,
    rewardScrap: 900,
    rewardDarkMatter: 20,
    icon: 'Sparkles',
  },
  {
    title: 'Precision Targeting',
    description: 'Score 45 critical strikes with primary cannons or railguns.',
    type: 'execute_criticals',
    target: 45,
    rewardScrap: 800,
    rewardDarkMatter: 18,
    icon: 'Crosshair',
  },
];

class DailyMissionManager {
  public state: DailyMissionsState = {
    date: '',
    missions: [],
    bonusClaimed: false,
  };

  public onMissionCompleted?: (mission: DailyMission) => void;
  public onStateChanged?: (state: DailyMissionsState) => void;

  constructor() {
    this.initOrRefresh();
  }

  private getTodayDateKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  public initOrRefresh() {
    const today = this.getTodayDateKey();
    try {
      const saved = localStorage.getItem('aether_daily_missions');
      if (saved) {
        const parsed: DailyMissionsState = JSON.parse(saved);
        if (parsed.date === today && Array.isArray(parsed.missions) && parsed.missions.length === 3) {
          this.state = parsed;
          return;
        }
      }
    } catch (e) {}

    // Roll 3 distinct random missions for today using seeded index
    this.rollDailyMissions(today);
  }

  private rollDailyMissions(today: string) {
    // Generate deterministic seed from date
    let seed = 0;
    for (let i = 0; i < today.length; i++) {
      seed = (seed << 5) - seed + today.charCodeAt(i);
      seed |= 0;
    }
    const absSeed = Math.abs(seed);

    const shuffled = [...MISSION_TEMPLATES].sort((a, b) => {
      const hashA = (absSeed * (a.title.length + 3)) % 100;
      const hashB = (absSeed * (b.title.length + 7)) % 100;
      return hashA - hashB;
    });

    const chosen = shuffled.slice(0, 3).map((template, idx) => ({
      ...template,
      id: `mission-${today}-${idx}`,
      progress: 0,
      completed: false,
      claimed: false,
    }));

    this.state = {
      date: today,
      missions: chosen,
      bonusClaimed: false,
    };
    this.save();
  }

  public recordProgress(type: MissionType, amount: number = 1) {
    let changed = false;
    for (const mission of this.state.missions) {
      if (mission.type === type && !mission.completed) {
        mission.progress = Math.min(mission.target, mission.progress + amount);
        if (mission.progress >= mission.target) {
          mission.completed = true;
          sound.playUpgrade();
          if (this.onMissionCompleted) {
            this.onMissionCompleted(mission);
          }
        }
        changed = true;
      }
    }

    if (changed) {
      this.save();
      if (this.onStateChanged) {
        this.onStateChanged(this.state);
      }
    }
  }

  public claimReward(missionId: string): { scrap: number; darkMatter: number } | null {
    const mission = this.state.missions.find((m) => m.id === missionId);
    if (!mission || !mission.completed || mission.claimed) return null;

    mission.claimed = true;
    sound.playUpgrade();
    this.save();
    if (this.onStateChanged) this.onStateChanged(this.state);

    return {
      scrap: mission.rewardScrap,
      darkMatter: mission.rewardDarkMatter,
    };
  }

  public claimDailyBonus(): { scrap: number; darkMatter: number } | null {
    const allCompleted = this.state.missions.every((m) => m.completed);
    if (!allCompleted || this.state.bonusClaimed) return null;

    this.state.bonusClaimed = true;
    sound.playUpgrade();
    this.save();
    if (this.onStateChanged) this.onStateChanged(this.state);

    return {
      scrap: 1200,
      darkMatter: 35,
    };
  }

  public getClaimableCount(): number {
    this.initOrRefresh();
    let count = this.state.missions.filter((m) => m.completed && !m.claimed).length;
    const allCompleted =
      this.state.missions.length > 0 && this.state.missions.every((m) => m.completed);
    if (allCompleted && !this.state.bonusClaimed) {
      count += 1;
    }
    return count;
  }

  public getSecondsUntilReset(): number {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return Math.max(0, Math.floor((tomorrow.getTime() - now.getTime()) / 1000));
  }

  private save() {
    try {
      localStorage.setItem('aether_daily_missions', JSON.stringify(this.state));
    } catch (e) {}
  }
}

export const dailyMissions = new DailyMissionManager();
