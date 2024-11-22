import { DecisionTree } from 'decision-tree';
import { Player } from '@/types/gameTypes';
import { logger } from '../logging/logger';

interface PlayerDecision {
  numbers: number[];
  success: boolean;
  matches: number;
  lunarPhase: string;
  evenCount: number;
  primeCount: number;
  sequentialCount: number;
}

class PlayerDecisionTree {
  private tree: any;
  private trainingData: PlayerDecision[] = [];
  
  private features = [
    'lunarPhase',
    'evenCount',
    'primeCount',
    'sequentialCount'
  ];

  addPlayerDecision(player: Player, numbers: number[], matches: number, lunarPhase: string) {
    const decision: PlayerDecision = {
      numbers,
      success: matches >= 11,
      matches,
      lunarPhase,
      evenCount: numbers.filter(n => n % 2 === 0).length,
      primeCount: numbers.filter(n => this.isPrime(n)).length,
      sequentialCount: this.countSequential(numbers)
    };

    this.trainingData.push(decision);
    this.trainTree();

    logger.info(`Added new decision from player ${player.id} with ${matches} matches`);
  }

  private isPrime(num: number): boolean {
    for (let i = 2; i <= Math.sqrt(num); i++) {
      if (num % i === 0) return false;
    }
    return num > 1;
  }

  private countSequential(numbers: number[]): number {
    let count = 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i + 1] - sorted[i] === 1) count++;
    }
    return count;
  }

  private trainTree() {
    if (this.trainingData.length < 10) return; // Aguarda dados suficientes

    this.tree = new DecisionTree(this.trainingData, 'success', this.features);
    logger.info(`Decision tree retrained with ${this.trainingData.length} samples`);
  }

  predict(numbers: number[], lunarPhase: string): boolean {
    if (!this.tree) return true; // Retorna true se ainda não há árvore treinada

    const decision = {
      lunarPhase,
      evenCount: numbers.filter(n => n % 2 === 0).length,
      primeCount: numbers.filter(n => this.isPrime(n)).length,
      sequentialCount: this.countSequential(numbers)
    };

    return this.tree.predict(decision);
  }

  getInsights(): string[] {
    if (!this.tree) return [];
    
    return this.features.map(feature => {
      const importance = this.tree.importance(feature);
      return `${feature}: ${(importance * 100).toFixed(2)}% importance`;
    });
  }
}

export const decisionTreeSystem = new PlayerDecisionTree();