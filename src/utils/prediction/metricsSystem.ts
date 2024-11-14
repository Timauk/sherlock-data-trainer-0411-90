import { systemLogger } from '../logging/systemLogger';

interface PredictionMetric {
  timestamp: Date;
  predictedNumbers: number[];
  actualNumbers: number[];
  matches: number;
  accuracy: number;
  estimatedProbability: number;
}

class PredictionMetricsSystem {
  private static instance: PredictionMetricsSystem;
  private metrics: PredictionMetric[] = [];
  private readonly maxStoredMetrics = 100;

  private constructor() {}

  static getInstance(): PredictionMetricsSystem {
    if (!PredictionMetricsSystem.instance) {
      PredictionMetricsSystem.instance = new PredictionMetricsSystem();
    }
    return PredictionMetricsSystem.instance;
  }

  recordPrediction(
    predictedNumbers: number[],
    actualNumbers: number[],
    estimatedProbability: number
  ) {
    const matches = predictedNumbers.filter(num => 
      actualNumbers.includes(num)).length;
    
    const metric: PredictionMetric = {
      timestamp: new Date(),
      predictedNumbers,
      actualNumbers,
      matches,
      accuracy: matches / 15,
      estimatedProbability
    };

    this.metrics.push(metric);
    if (this.metrics.length > this.maxStoredMetrics) {
      this.metrics.shift();
    }

    systemLogger.log('prediction', 'New prediction recorded', {
      matches,
      accuracy: metric.accuracy,
      estimatedProbability
    });

    return metric;
  }

  getAverageAccuracy(): number {
    if (this.metrics.length === 0) return 0;
    return this.metrics.reduce((sum, metric) => 
      sum + metric.accuracy, 0) / this.metrics.length;
  }

  getSuccessRate(): number {
    if (this.metrics.length === 0) return 0;
    const successfulPredictions = this.metrics.filter(m => m.matches >= 11).length;
    return successfulPredictions / this.metrics.length;
  }

  getMetricsSummary() {
    return {
      totalPredictions: this.metrics.length,
      averageAccuracy: this.getAverageAccuracy(),
      successRate: this.getSuccessRate(),
      recentMetrics: this.metrics.slice(-5)
    };
  }
}

export const predictionMetrics = PredictionMetricsSystem.getInstance();