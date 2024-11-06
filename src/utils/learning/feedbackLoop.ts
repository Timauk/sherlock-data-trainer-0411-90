import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../logging/systemLogger';
import { deepPatternAnalyzer } from '../analysis/deepPatternAnalysis';
import { rewardSystem } from '../enhancedRewardSystem';

interface FeedbackMetrics {
  accuracy: number;
  loss: number;
  patterns: number;
  reward: number;
  patternDepth: number;
}

interface RewardFactors {
  matches: number;
  consistency: number;
  novelty: number;
  efficiency: number;
  patternDepth: number;  // This line was added to match the error
}

export class LearningFeedbackLoop {
  private static instance: LearningFeedbackLoop;
  private metrics: FeedbackMetrics[] = [];
  private readonly maxMetrics = 1000;
  private patternMemory: Map<string, number> = new Map();

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
    patterns: number[][],
    specialistId?: number
  ): Promise<void> {
    // Análise profunda de padrões
    const deepPatterns = await deepPatternAnalyzer.analyzePatterns(patterns);
    
    // Memorização de padrões importantes
    deepPatterns.forEach(pattern => {
      const patternKey = `${pattern.type}-${pattern.data.join(',')}`;
      const currentCount = this.patternMemory.get(patternKey) || 0;
      this.patternMemory.set(patternKey, currentCount + 1);
    });

    // Cálculo de recompensa considerando a profundidade dos padrões
    const reward = rewardSystem.calculateReward({
      matches: this.calculateMatches(prediction, actual),
      consistency: this.calculateConsistency(patterns),
      novelty: this.calculateNovelty(deepPatterns),
      efficiency: this.calculateEfficiency(prediction, actual),
      patternDepth: this.calculatePatternDepth(deepPatterns)
    });

    // Atualização do modelo com ênfase em padrões profundos
    await this.updateModelWithDeepPatterns(model, prediction, actual, deepPatterns, reward);

    this.recordMetrics({
      accuracy: this.calculateAccuracy(prediction, actual),
      loss: await this.calculateLoss(model, prediction, actual),
      patterns: deepPatterns.length,
      reward,
      patternDepth: this.calculatePatternDepth(deepPatterns)
    });

    // Log detalhado para especialistas
    if (specialistId) {
      systemLogger.log('specialist', `Especialista #${specialistId} identificou ${deepPatterns.length} padrões profundos`, {
        patternTypes: deepPatterns.map(p => p.type),
        confidence: deepPatterns.map(p => p.confidence),
        reward
      });
    }
  }

  private calculatePatternDepth(patterns: any[]): number {
    return patterns.reduce((depth, pattern) => {
      const frequency = this.patternMemory.get(`${pattern.type}-${pattern.data.join(',')}`) || 0;
      return Math.max(depth, pattern.confidence * (1 + Math.log(frequency + 1)));
    }, 0);
  }

  private async updateModelWithDeepPatterns(
    model: tf.LayersModel,
    prediction: number[],
    actual: number[],
    patterns: any[],
    reward: number
  ): Promise<void> {
    const learningRate = 0.001 * Math.abs(reward) * this.calculatePatternDepth(patterns);
    const optimizer = tf.train.adam(learningRate);
    
    model.compile({
      optimizer,
      loss: 'meanSquaredError',
      metrics: ['accuracy']
    });

    // Tensor com dados enriquecidos com padrões
    const enrichedData = this.enrichDataWithPatterns(prediction, patterns);
    const xs = tf.tensor2d([enrichedData]);
    const ys = tf.tensor2d([actual]);

    // Treinamento com maior peso para padrões profundos
    await model.trainOnBatch(xs, ys);

    xs.dispose();
    ys.dispose();
  }

  private enrichDataWithPatterns(prediction: number[], patterns: any[]): number[] {
    const patternFeatures = patterns.map(p => p.confidence * this.calculatePatternDepth([p]));
    return [...prediction, ...patternFeatures];
  }

  private calculateMatches(prediction: number[], actual: number[]): number {
    return prediction.filter(p => actual.includes(p)).length;
  }

  private calculateConsistency(patterns: number[][]): number {
    // Implementar lógica de consistência
    return 0.5; // Exemplo de retorno fixo
  }

  private calculateNovelty(patterns: any[]): number {
    // Implementar lógica de novidade
    return 0.5; // Exemplo de retorno fixo
  }

  private calculateEfficiency(prediction: number[], actual: number[]): number {
    // Implementar lógica de eficiência
    return 0.5; // Exemplo de retorno fixo
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
    averagePatternDepth: number;
  } {
    const sum = this.metrics.reduce(
      (acc, curr) => ({
        accuracy: acc.accuracy + curr.accuracy,
        loss: acc.loss + curr.loss,
        patterns: acc.patterns + curr.patterns,
        reward: acc.reward + curr.reward,
        patternDepth: acc.patternDepth + curr.patternDepth
      }),
      { accuracy: 0, loss: 0, patterns: 0, reward: 0, patternDepth: 0 }
    );

    const count = this.metrics.length || 1;

    return {
      averageAccuracy: sum.accuracy / count,
      averageLoss: sum.loss / count,
      totalPatterns: sum.patterns,
      totalReward: sum.reward,
      averagePatternDepth: sum.patternDepth / count
    };
  }
}

export const learningFeedbackLoop = LearningFeedbackLoop.getInstance();
