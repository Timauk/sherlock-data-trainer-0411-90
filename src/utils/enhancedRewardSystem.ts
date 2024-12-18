import { systemLogger } from './logging/systemLogger';

interface RewardFactors {
  matches: number;
  consistency: number;
  novelty: number;
  efficiency: number;
}

export class EnhancedRewardSystem {
  private static instance: EnhancedRewardSystem;
  private historicalRewards: Map<number, number[]> = new Map();
  private readonly maxHistorySize = 100;

  private constructor() {}

  static getInstance(): EnhancedRewardSystem {
    if (!EnhancedRewardSystem.instance) {
      EnhancedRewardSystem.instance = new EnhancedRewardSystem();
    }
    return EnhancedRewardSystem.instance;
  }

  calculateReward(factors: RewardFactors): number {
    const baseReward = this.calculateBaseReward(factors.matches);
    const consistencyMultiplier = this.calculateConsistencyMultiplier(factors.consistency);
    const noveltyBonus = this.calculateNoveltyBonus(factors.novelty);
    const efficiencyMultiplier = this.calculateEfficiencyMultiplier(factors.efficiency);

    const totalReward = baseReward * consistencyMultiplier + noveltyBonus * efficiencyMultiplier;

    this.updateHistory(totalReward);
    return totalReward;
  }

  private calculateBaseReward(matches: number): number {
    if (matches >= 11) {
      return Math.pow(2, matches - 10); // Recompensa exponencial para acertos altos
    }
    return -Math.pow(1.5, 10 - matches); // Punição exponencial para baixo desempenho
  }

  private calculateConsistencyMultiplier(consistency: number): number {
    return 1 + (consistency * 0.5); // Bônus de até 50% para consistência
  }

  private calculateNoveltyBonus(novelty: number): number {
    return novelty * 2; // Bônus para descoberta de novos padrões
  }

  private calculateEfficiencyMultiplier(efficiency: number): number {
    return 1 + (efficiency * 0.3); // Bônus de até 30% para eficiência
  }

  private updateHistory(reward: number) {
    const timestamp = Date.now();
    if (!this.historicalRewards.has(timestamp)) {
      this.historicalRewards.set(timestamp, []);
    }
    this.historicalRewards.get(timestamp)?.push(reward);

    // Limpa histórico antigo
    if (this.historicalRewards.size > this.maxHistorySize) {
      const oldestKey = Math.min(...this.historicalRewards.keys());
      this.historicalRewards.delete(oldestKey);
    }
  }

  getRewardStats() {
    const allRewards = Array.from(this.historicalRewards.values()).flat();
    return {
      average: allRewards.reduce((a, b) => a + b, 0) / allRewards.length,
      max: Math.max(...allRewards),
      min: Math.min(...allRewards),
      total: allRewards.reduce((a, b) => a + b, 0)
    };
  }
}

export const rewardSystem = EnhancedRewardSystem.getInstance();