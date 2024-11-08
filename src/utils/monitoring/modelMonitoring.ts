import { performanceMonitor } from "../performance/performanceMonitor";
import { SystemStatus, SpecializedModelsStatus, DataQualityMetrics, AnalysisStatus, ModelMetricsSummary } from '@/types/monitoring';

class ModelMonitoring {
  private static instance: ModelMonitoring;
  private metrics: ModelMetricsSummary = {
    avgAccuracy: 0,
    totalSamples: 0
  };

  private specializedModelsMetrics = {
    seasonal: { accuracy: 0, confidence: 0, samples: 0 },
    frequency: { accuracy: 0, confidence: 0, samples: 0 },
    lunar: { accuracy: 0, confidence: 0, samples: 0 },
    sequential: { accuracy: 0, confidence: 0, samples: 0 }
  };

  private constructor() {}

  static getInstance(): ModelMonitoring {
    if (!ModelMonitoring.instance) {
      ModelMonitoring.instance = new ModelMonitoring();
    }
    return ModelMonitoring.instance;
  }

  recordMetrics(
    accuracy: number,
    learningRate: number,
    errorRate: number,
    modelType?: 'seasonal' | 'frequency' | 'lunar' | 'sequential'
  ): void {
    const metrics: ModelMetricsSummary = {
      avgAccuracy: accuracy,
      totalSamples: this.metrics.totalSamples + 1
    };

    if (modelType) {
      this.specializedModelsMetrics[modelType] = {
        accuracy: (this.specializedModelsMetrics[modelType].accuracy + accuracy) / 2,
        confidence: 1 - errorRate,
        samples: this.specializedModelsMetrics[modelType].samples + 1
      };
    }

    this.metrics = metrics;
    this.checkThresholds(metrics);
  }

  private checkThresholds(metrics: ModelMetricsSummary): void {
    if (metrics.avgAccuracy < 0.5) {
      const event = new CustomEvent('modelAlert', {
        detail: {
          type: 'accuracy',
          value: metrics.avgAccuracy,
          metrics: metrics
        }
      });
      window.dispatchEvent(event);
    }
  }

  getMetricsSummary(): ModelMetricsSummary {
    return this.metrics;
  }

  getSpecializedModelsStatus(): SpecializedModelsStatus {
    const modelsAboveThreshold = Object.values(this.specializedModelsMetrics)
      .filter(metrics => metrics.accuracy > 0.4 && metrics.confidence > 0.6).length;

    return {
      active: true,
      activeCount: 4,
      totalCount: 4,
      performance: {
        seasonal: this.specializedModelsMetrics.seasonal,
        frequency: this.specializedModelsMetrics.frequency,
        lunar: this.specializedModelsMetrics.lunar,
        sequential: this.specializedModelsMetrics.sequential
      }
    };
  }

  getAnalysisStatus(): AnalysisStatus {
    const activeAnalyses = Object.values(this.specializedModelsMetrics)
      .filter(metrics => metrics.samples > 0).length;

    return {
      active: true,
      activeAnalyses: activeAnalyses + 4 // Base analyses + specialized models
    };
  }

  getSystemStatus(): SystemStatus {
    const avgAccuracy = Object.values(this.specializedModelsMetrics)
      .reduce((acc, curr) => acc + curr.accuracy, 0) / 4;

    return {
      healthy: avgAccuracy > 0.5,
      health: Math.round(avgAccuracy * 100),
      alerts: avgAccuracy < 0.5 ? 1 : 0
    };
  }

  getDataQualityMetrics(): DataQualityMetrics {
    const avgConfidence = Object.values(this.specializedModelsMetrics)
      .reduce((acc, curr) => acc + curr.confidence, 0) / 4;

    return {
      quality: avgConfidence,
      completeness: this.metrics.totalSamples > 0 ? 0.98 : 0.5
    };
  }

  getSpecializedModelMetrics(modelType: 'seasonal' | 'frequency' | 'lunar' | 'sequential') {
    return this.specializedModelsMetrics[modelType];
  }
}

export const modelMonitoring = ModelMonitoring.getInstance();