import { performanceMonitor } from "../performance/performanceMonitor";
import { SystemStatus, SpecializedModelsStatus, DataQualityMetrics, AnalysisStatus, ModelMetricsSummary } from '@/types/monitoring';

class ModelMonitoring {
  private static instance: ModelMonitoring;
  private metrics: ModelMetricsSummary = {
    avgAccuracy: 0,
    totalSamples: 0
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
    errorRate: number
  ): void {
    const metrics: ModelMetricsSummary = {
      avgAccuracy: accuracy,
      totalSamples: this.metrics.totalSamples + 1
    };

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
    return {
      active: true,
      activeCount: 4,
      totalCount: 4
    };
  }

  getAnalysisStatus(): AnalysisStatus {
    return {
      active: true,
      activeAnalyses: 8
    };
  }

  getSystemStatus(): SystemStatus {
    return {
      healthy: true,
      health: 98,
      alerts: 0
    };
  }

  getDataQualityMetrics(): DataQualityMetrics {
    return {
      quality: 0.95,
      completeness: 0.98
    };
  }
}

export const modelMonitoring = ModelMonitoring.getInstance();
