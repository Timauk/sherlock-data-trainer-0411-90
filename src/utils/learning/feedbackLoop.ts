// Split into smaller files for better maintainability
import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../logging/systemLogger';
import { deepPatternAnalyzer } from '../analysis/deepPatternAnalysis';
import { rewardSystem } from '../enhancedRewardSystem';
import { FeedbackMetrics, RewardFactors } from './types';
import { MetricsManager } from './metricsManager';
import { PatternMemoryManager } from './patternMemoryManager';
import { ModelUpdater } from './modelUpdater';

export class LearningFeedbackLoop {
  private static instance: LearningFeedbackLoop;
  private metricsManager: MetricsManager;
  private patternMemory: PatternMemoryManager;
  private modelUpdater: ModelUpdater;

  private constructor() {
    this.metricsManager = new MetricsManager();
    this.patternMemory = new PatternMemoryManager();
    this.modelUpdater = new ModelUpdater();
  }

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
    patterns: number[][],
    specialistId?: number
  ): Promise<void> {
    const deepPatterns = await deepPatternAnalyzer.analyzePatterns(patterns);
    this.patternMemory.memorizePatterns(deepPatterns);

    const reward = rewardSystem.calculateReward({
      matches: this.calculateMatches(prediction, actual),
      consistency: this.calculateConsistency(patterns),
      novelty: this.calculateNovelty(deepPatterns),
      efficiency: this.calculateEfficiency(prediction, actual),
      patternDepth: this.patternMemory.calculatePatternDepth(deepPatterns)
    });

    await this.modelUpdater.updateModel(model, prediction, actual, deepPatterns, reward);

    this.metricsManager.recordMetrics({
      accuracy: this.calculateAccuracy(prediction, actual),
      loss: await this.calculateLoss(model, prediction, actual),
      patterns: deepPatterns.length,
      reward,
      patternDepth: this.patternMemory.calculatePatternDepth(deepPatterns)
    });

    if (specialistId) {
      this.logSpecialistFeedback(specialistId, deepPatterns, reward);
    }
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

  private logSpecialistFeedback(specialistId: number, patterns: any[], reward: number): void {
    systemLogger.log('specialist', `Especialista #${specialistId} identificou ${patterns.length} padrões profundos`, {
      patternTypes: patterns.map(p => p.type),
      confidence: patterns.map(p => p.confidence),
      reward
    });
  }

  getMetricsSummary() {
    return this.metricsManager.getMetricsSummary();
  }
}

export const learningFeedbackLoop = LearningFeedbackLoop.getInstance();