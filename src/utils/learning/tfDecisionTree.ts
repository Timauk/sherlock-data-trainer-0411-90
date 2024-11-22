import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../logging/systemLogger';

export class TFDecisionTree {
  private model: tf.Sequential | null = null;
  private decisions: Array<{
    numbers: number[];
    features: number[];
    success: boolean;
  }> = [];

  constructor() {
    this.initializeModel();
  }

  private async initializeModel() {
    this.model = tf.sequential();
    
    // Camada de entrada com 5 features:
    // [evenCount, sum, sequentialCount, lunarPhaseEncoded, primeCount]
    this.model.add(tf.layers.dense({
      units: 16,
      activation: 'relu',
      inputShape: [5]
    }));
    
    this.model.add(tf.layers.dense({
      units: 8,
      activation: 'relu'
    }));
    
    // Saída binária: boa decisão (1) ou má decisão (0)
    this.model.add(tf.layers.dense({
      units: 1,
      activation: 'sigmoid'
    }));

    this.model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    systemLogger.log('system', 'TensorFlow Decision Tree Model initialized');
  }

  private extractFeatures(numbers: number[], lunarPhase: string): number[] {
    const evenCount = numbers.filter(n => n % 2 === 0).length / numbers.length;
    const sum = numbers.reduce((a, b) => a + b, 0) / (25 * numbers.length);
    const sequentialCount = this.countSequential(numbers) / numbers.length;
    const lunarPhaseEncoded = this.encodeLunarPhase(lunarPhase);
    const primeCount = numbers.filter(n => this.isPrime(n)).length / numbers.length;

    return [evenCount, sum, sequentialCount, lunarPhaseEncoded, primeCount];
  }

  private countSequential(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    let count = 0;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === sorted[i-1] + 1) count++;
    }
    return count;
  }

  private isPrime(num: number): boolean {
    if (num <= 1) return false;
    for (let i = 2; i <= Math.sqrt(num); i++) {
      if (num % i === 0) return false;
    }
    return true;
  }

  private encodeLunarPhase(phase: string): number {
    const phases = {
      'Nova': 0,
      'Crescente': 0.33,
      'Cheia': 0.66,
      'Minguante': 1
    };
    return phases[phase as keyof typeof phases] || 0.5;
  }

  async addDecision(numbers: number[], lunarPhase: string, success: boolean) {
    const features = this.extractFeatures(numbers, lunarPhase);
    this.decisions.push({ numbers, features, success });

    if (this.decisions.length >= 10) {
      await this.train();
    }
  }

  private async train() {
    if (!this.model || this.decisions.length < 10) return;

    const features = tf.tensor2d(this.decisions.map(d => d.features));
    const labels = tf.tensor2d(this.decisions.map(d => [d.success ? 1 : 0]));

    try {
      await this.model.fit(features, labels, {
        epochs: 10,
        batchSize: 4,
        shuffle: true,
        verbose: 0
      });

      systemLogger.log('system', 'TensorFlow Decision Tree Model retrained', {
        decisionsCount: this.decisions.length
      });
    } catch (error) {
      systemLogger.log('system', 'Error training TF Decision Tree', { error });
    } finally {
      features.dispose();
      labels.dispose();
    }
  }

  async predict(numbers: number[], lunarPhase: string): Promise<boolean> {
    if (!this.model || this.decisions.length < 10) {
      return true; // Retorna true se não houver dados suficientes
    }

    const features = tf.tensor2d([this.extractFeatures(numbers, lunarPhase)]);
    
    try {
      const prediction = await this.model.predict(features) as tf.Tensor;
      const value = (await prediction.data())[0];
      prediction.dispose();
      features.dispose();
      
      return value > 0.5;
    } catch (error) {
      systemLogger.log('system', 'Error predicting with TF Decision Tree', { error });
      return true;
    }
  }
}

export const tfDecisionTree = new TFDecisionTree();