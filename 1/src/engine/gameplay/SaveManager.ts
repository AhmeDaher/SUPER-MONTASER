import { AnimalType, PlayerStats } from '../types';

const SAVE_KEY = 'super_montaser_save_v1';

export class SaveManager {
  private static defaultStats: PlayerStats = {
    coins: 0,
    stars: 0,
    discoveredAnimals: [],
    completedMissions: [],
    unlockedBadges: ['Jungle Scout'],
  };

  public static load(): PlayerStats {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { ...this.defaultStats };
    }
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        return { ...this.defaultStats, ...JSON.parse(raw) };
      }
    } catch (e) {
      console.warn('Failed to load save state:', e);
    }
    return { ...this.defaultStats };
  }

  public static save(stats: PlayerStats) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(stats));
    } catch (e) {
      console.warn('Failed to save state:', e);
    }
  }

  public static reset(): PlayerStats {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem(SAVE_KEY);
      } catch (e) {}
    }
    return { ...this.defaultStats };
  }
}

export class RewardManager {
  private stats: PlayerStats;

  constructor() {
    this.stats = SaveManager.load();
  }

  public getStats(): PlayerStats {
    return this.stats;
  }

  public addCoins(amount: number): number {
    this.stats.coins += amount;
    SaveManager.save(this.stats);
    return this.stats.coins;
  }

  public addStars(amount: number): number {
    this.stats.stars += amount;
    SaveManager.save(this.stats);
    return this.stats.stars;
  }

  public recordAnimalDiscovered(type: AnimalType): boolean {
    if (!this.stats.discoveredAnimals.includes(type)) {
      this.stats.discoveredAnimals.push(type);
      SaveManager.save(this.stats);
      return true; // Newly discovered
    }
    return false;
  }

  public recordMissionCompleted(missionId: string, badgeName?: string) {
    if (!this.stats.completedMissions.includes(missionId)) {
      this.stats.completedMissions.push(missionId);
    }
    if (badgeName && !this.stats.unlockedBadges.includes(badgeName)) {
      this.stats.unlockedBadges.push(badgeName);
    }
    SaveManager.save(this.stats);
  }
}
