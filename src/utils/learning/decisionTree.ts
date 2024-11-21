import * as tf from '@tensorflow/tfjs';
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
  private model: tf.Sequential | null = null;
  private trainingData: PlayerDecision[] = [];
  
  constructor() {
    this.initModel();
  }

  private async initModel() {
    this.model = tf.sequential();
    
    // Camada de entrada com 4 features
    this.model.add(tf.layers.dense({
      units: 16,
      activation: 'relu',
      inputShape: [4]
    }));
    
    // Camada oculta
    this.model.add(tf.layers.dense({
      units: 8,
      activation: 'relu'
    }));
    
    // Camada de saída (classificação binária)
    this.model.add(tf.layers.dense({
      units: 1,
      activation: 'sigmoid'
    }));

    this.model.compile({
      optimizer: tf.train.adam(0.01),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });
  }

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
    this.trainModel();

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

  private async trainModel() {
    if (!this.model || this.trainingData.length < 10) return;

    const features = this.trainingData.map(d => [
      d.evenCount / 15,
      d.primeCount / 15,
      d.sequentialCount / 14,
      d.lunarPhase === 'Crescente' ? 1 : 0
    ]);

    const labels = this.trainingData.map(d => d.success ? 1 : 0);

    const xs = tf.tensor2d(features);
    const ys = tf.tensor2d(labels, [labels.length, 1]);

    await this.model.fit(xs, ys, {
      epochs: 10,
      batchSize: 32,
      shuffle: true
    });

    xs.dispose();
    ys.dispose();

    logger.info(`Decision tree retrained with ${this.trainingData.length} samples`);
  }

  async predict(numbers: number[], lunarPhase: string): Promise<boolean> {
    if (!this.model) {
      await this.initModel();
      return true;
    }

    const features = tf.tensor2d([[
      numbers.filter(n => n % 2 === 0).length / 15,
      numbers.filter(n => this.isPrime(n)).length / 15,
      this.countSequential(numbers) / 14,
      lunarPhase === 'Crescente' ? 1 : 0
    ]]);

    const prediction = this.model.predict(features) as tf.Tensor;
    const result = await prediction.data();

    features.dispose();
    prediction.dispose();

    return result[0] > 0.5;
  }

  getInsights(): string[] {
    if (!this.model) return [];
    
    return [
      `Total de amostras: ${this.trainingData.length}`,
      `Taxa de sucesso: ${(this.trainingData.filter(d => d.success).length / this.trainingData.length * 100).toFixed(2)}%`,
      `Média de acertos: ${(this.trainingData.reduce((acc, d) => acc + d.matches, 0) / this.trainingData.length).toFixed(2)}`
    ];
  }
}

export const decisionTreeSystem = new PlayerDecisionTree();