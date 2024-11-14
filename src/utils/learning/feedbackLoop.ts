import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../logging/systemLogger';
import { deepPatternAnalyzer } from '../analysis/deepPatternAnalysis';
import { rewardSystem } from '../enhancedRewardSystem';

interface FeedbackMetrics {
  accuracy: number;
  loss: number;
  patterns: number;
  reward: number;
  consistency: number;
  novelty: number;
  efficiency: number;
}

export class LearningFeedbackLoop {
  private static instance: LearningFeedbackLoop;
  private metrics: FeedbackMetrics[] = [];
  private readonly maxMetrics = 1000;
  private rewardMemory: number[] = [];
  private readonly memorySize = 50;

  private constructor() {}

  static getInstance(): LearningFeedbackLoop {
    if (!LearningFeedbackLoop.instance) {
      LearningFeedbackLoop.instance = new LearningFeedbackLoop();
    }
    return LearningFeedbackLoop.instance;
  }

  async processFeedback(
    model: tf.LayersModel,
    prediction: number[],
    actual: number[],
    patterns: number[][]
  ): Promise<void> {
    const deepPatterns = await deepPatternAnalyzer.analyzePatterns(patterns);
    
    const consistency = this.calculateConsistency(patterns);
    const novelty = this.calculateNovelty(prediction, patterns);
    const efficiency = this.calculateEfficiency(prediction, actual);
    
    const adaptiveReward = this.calculateAdaptiveReward({
      matches: this.calculateMatches(prediction, actual),
      consistency,
      novelty,
      efficiency
    });

    this.updateRewardMemory(adaptiveReward);
    await this.updateModel(model, prediction, actual, adaptiveReward);

    this.recordMetrics({
      accuracy: this.calculateAccuracy(prediction, actual),
      loss: await this.calculateLoss(model, prediction, actual),
      patterns: deepPatterns.length,
      reward: adaptiveReward,
      consistency,
      novelty,
      efficiency
    });

    systemLogger.log('learning', 'Feedback processado', {
      reward: adaptiveReward,
      patternsFound: deepPatterns.length,
      metrics: {
        consistency,
        novelty,
        efficiency
      }
    });
  }

  private calculateConsistency(patterns: number[][]): number {
    if (patterns.length < 2) return 0;
    
    let consistencyScore = 0;
    for (let i = 1; i < patterns.length; i++) {
      const prev = new Set(patterns[i - 1]);
      const curr = new Set(patterns[i]);
      const intersection = new Set([...prev].filter(x => curr.has(x)));
      consistencyScore += intersection.size / Math.max(prev.size, curr.size);
    }
    
    return consistencyScore / (patterns.length - 1);
  }

  private calculateNovelty(prediction: number[], history: number[][]): number {
    const predictionSet = new Set(prediction);
    const historicalNumbers = new Set(history.flat());
    
    const novelElements = [...predictionSet].filter(num => !historicalNumbers.has(num));
    return novelElements.length / predictionSet.size;
  }

  private calculateEfficiency(prediction: number[], actual: number[]): number {
    const matches = this.calculateMatches(prediction, actual);
    const precision = matches / prediction.length;
    const recall = matches / actual.length;
    
    if (precision + recall === 0) return 0;
    return 2 * (precision * recall) / (precision + recall); // F1 Score
  }

  private calculateAdaptiveReward(metrics: {
    matches: number;
    consistency: number;
    novelty: number;
    efficiency: number;
  }): number {
    const baseReward = metrics.matches * 0.4 +
                      metrics.consistency * 0.3 +
                      metrics.novelty * 0.2 +
                      metrics.efficiency * 0.1;
    
    const recentPerformance = this.getRecentPerformanceMultiplier();
    return baseReward * recentPerformance;
  }

  private updateRewardMemory(reward: number): void {
    this.rewardMemory.push(reward);
    if (this.rewardMemory.length > this.memorySize) {
      this.rewardMemory.shift();
    }
  }

  private getRecentPerformanceMultiplier(): number {
    if (this.rewardMemory.length === 0) return 1;
    
    const recentAvg = this.rewardMemory.reduce((a, b) => a + b, 0) / this.rewardMemory.length;
    return Math.max(0.5, Math.min(1.5, 1 + (recentAvg - 0.5)));
  }

  private async updateModel(
    model: tf.LayersModel,
    prediction: number[],
    actual: number[],
    reward: number
  ): Promise<void> {
    const learningRate = 0.001 * Math.abs(reward);
    const optimizer = tf.train.adam(learningRate);
    
    model.compile({
      optimizer,
      loss: 'meanSquaredError',
      metrics: ['accuracy'],
      // Adicionando regularização L2
      regularizers: [tf.regularizers.l2({ l2: 0.01 })]
    });

    const xs = tf.tensor2d([prediction]);
    const ys = tf.tensor2d([actual]);

    await model.trainOnBatch(xs, ys);

    xs.dispose();
    ys.dispose();
  }

  private calculateMatches(prediction: number[], actual: number[]): number {
    return prediction.filter(p => actual.includes(p)).length;
  }

  private calculateAccuracy(prediction: number[], actual: number[]): number {
    const matches = this.calculateMatches(prediction, actual);
    return matches / actual.length;
  }

  private async calculateLoss(
    model: tf.LayersModel,
    prediction: number[],
    actual: number[]
  ): Promise<number> {
    const predTensor = tf.tensor2d([prediction]);
    const actualTensor = tf.tensor2d([actual]);
    
    const loss = model.evaluate(predTensor, actualTensor, {
      batchSize: 1,
      verbose: 0
    }) as tf.Tensor;
    
    const result = await loss.data();
    
    predTensor.dispose();
    actualTensor.dispose();
    loss.dispose();
    
    return result[0];
  }

  getMetricsSummary(): {
    averageAccuracy: number;
    averageLoss: number;
    totalPatterns: number;
    totalReward: number;
    averageConsistency: number;
    averageNovelty: number;
    averageEfficiency: number;
  } {
    const sum = this.metrics.reduce(
      (acc, curr) => ({
        accuracy: acc.accuracy + curr.accuracy,
        loss: acc.loss + curr.loss,
        patterns: acc.patterns + curr.patterns,
        reward: acc.reward + curr.reward,
        consistency: acc.consistency + curr.consistency,
        novelty: acc.novelty + curr.novelty,
        efficiency: acc.efficiency + curr.efficiency
      }),
      { 
        accuracy: 0, 
        loss: 0, 
        patterns: 0, 
        reward: 0,
        consistency: 0,
        novelty: 0,
        efficiency: 0
      }
    );

    const count = this.metrics.length || 1;

    return {
      averageAccuracy: sum.accuracy / count,
      averageLoss: sum.loss / count,
      totalPatterns: sum.patterns,
      totalReward: sum.reward,
      averageConsistency: sum.consistency / count,
      averageNovelty: sum.novelty / count,
      averageEfficiency: sum.efficiency / count
    };
  }
}

export const learningFeedbackLoop = LearningFeedbackLoop.getInstance();