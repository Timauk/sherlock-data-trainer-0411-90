import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../logging/systemLogger';
import { deepPatternAnalyzer } from '../analysis/deepPatternAnalysis';
import { rewardSystem } from '../enhancedRewardSystem';

interface FeedbackMetrics {
  accuracy: number;
  loss: number;
  patterns: number;
  reward: number;
}

export class LearningFeedbackLoop {
  private static instance: LearningFeedbackLoop;
  private metrics: FeedbackMetrics[] = [];
  private readonly maxMetrics = 1000;

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
    
    const reward = rewardSystem.calculateReward({
      matches: this.calculateMatches(prediction, actual),
      consistency: this.calculateConsistency(patterns),
      novelty: this.calculateNovelty(deepPatterns),
      efficiency: this.calculateEfficiency(prediction, actual)
    });

    await this.updateModel(model, prediction, actual, reward);

    this.recordMetrics({
      accuracy: this.calculateAccuracy(prediction, actual),
      loss: await this.calculateLoss(model, prediction, actual),
      patterns: deepPatterns.length,
      reward
    });

    systemLogger.log('learning', 'Feedback processado', {
      reward,
      patternsFound: deepPatterns.length
    });
  }

  private calculateMatches(prediction: number[], actual: number[]): number {
    return prediction.filter(p => actual.includes(p)).length;
  }

  private calculateConsistency(patterns: number[][]): number {
    return 0.5;
  }

  private calculateNovelty(patterns: any[]): number {
    return 0.5;
  }

  private calculateEfficiency(prediction: number[], actual: number[]): number {
    return 0.5;
  }

  private async calculateLoss(
    model: tf.LayersModel,
    prediction: number[],
    actual: number[]
  ): Promise<number> {
    const predTensor = tf.tensor2d([prediction]);
    const actualTensor = tf.tensor2d([actual]);
    
    const loss = model.evaluate(predTensor, actualTensor) as tf.Tensor;
    const result = await loss.data();
    
    predTensor.dispose();
    actualTensor.dispose();
    loss.dispose();
    
    return result[0];
  }

  private calculateAccuracy(prediction: number[], actual: number[]): number {
    const matches = this.calculateMatches(prediction, actual);
    return matches / actual.length;
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
      metrics: ['accuracy']
    });

    const xs = tf.tensor2d([prediction]);
    const ys = tf.tensor2d([actual]);

    await model.trainOnBatch(xs, ys);

    xs.dispose();
    ys.dispose();
  }

  private recordMetrics(metrics: FeedbackMetrics): void {
    this.metrics.push(metrics);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getMetricsSummary(): {
    averageAccuracy: number;
    averageLoss: number;
    totalPatterns: number;
    totalReward: number;
  } {
    const sum = this.metrics.reduce(
      (acc, curr) => ({
        accuracy: acc.accuracy + curr.accuracy,
        loss: acc.loss + curr.loss,
        patterns: acc.patterns + curr.patterns,
        reward: acc.reward + curr.reward
      }),
      { accuracy: 0, loss: 0, patterns: 0, reward: 0 }
    );

    const count = this.metrics.length || 1;

    return {
      averageAccuracy: sum.accuracy / count,
      averageLoss: sum.loss / count,
      totalPatterns: sum.patterns,
      totalReward: sum.reward
    };
  }
}

export const learningFeedbackLoop = LearningFeedbackLoop.getInstance();
