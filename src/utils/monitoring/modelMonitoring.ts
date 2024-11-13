import { performanceMonitor } from "../performance/performanceMonitor";
import { SystemStatus, SpecializedModelsStatus, DataQualityMetrics, AnalysisStatus, ModelMetricsSummary } from '@/types/monitoring';
import { systemLogger } from '../logging/systemLogger';

class ModelMonitoring {
  private static instance: ModelMonitoring;
  private metrics: ModelMetricsSummary = {
    avgAccuracy: 0,
    totalSamples: 0,
    confidenceScore: 0,
    adaptabilityScore: 0,
    learningRate: 0.001
  };

  private specializedModelsMetrics = {
    seasonal: { accuracy: 0, confidence: 0, samples: 0, adaptability: 0 },
    frequency: { accuracy: 0, confidence: 0, samples: 0, adaptability: 0 },
    lunar: { accuracy: 0, confidence: 0, samples: 0, adaptability: 0 },
    sequential: { accuracy: 0, confidence: 0, samples: 0, adaptability: 0 }
  };

  private modelHealth = {
    overallHealth: 1,
    lastUpdate: new Date(),
    warnings: [] as string[],
    improvements: [] as string[]
  };

  private constructor() {
    this.startAutoDiagnostics();
  }

  static getInstance(): ModelMonitoring {
    if (!ModelMonitoring.instance) {
      ModelMonitoring.instance = new ModelMonitoring();
    }
    return ModelMonitoring.instance;
  }

  private startAutoDiagnostics() {
    setInterval(() => {
      this.runHealthCheck();
    }, 300000); // Every 5 minutes
  }

  private runHealthCheck() {
    const now = new Date();
    const timeSinceLastUpdate = now.getTime() - this.modelHealth.lastUpdate.getTime();
    
    // Check model staleness
    if (timeSinceLastUpdate > 86400000) { // 24 hours
      this.modelHealth.warnings.push('Model hasn\'t been updated in 24 hours');
      this.modelHealth.overallHealth *= 0.9;
    }

    // Check accuracy trends
    if (this.metrics.avgAccuracy < 0.5) {
      this.modelHealth.warnings.push('Model accuracy is below threshold');
      this.modelHealth.overallHealth *= 0.8;
    }

    // Check adaptability
    if (this.metrics.adaptabilityScore < 0.3) {
      this.modelHealth.warnings.push('Model adaptability is low');
      this.modelHealth.overallHealth *= 0.9;
    }

    systemLogger.log('model', 'Health check completed', {
      health: this.modelHealth.overallHealth,
      warnings: this.modelHealth.warnings
    });
  }

  recordMetrics(
    accuracy: number,
    learningRate: number,
    errorRate: number,
    adaptabilityScore: number,
    modelType?: 'seasonal' | 'frequency' | 'lunar' | 'sequential'
  ): void {
    const metrics: ModelMetricsSummary = {
      avgAccuracy: accuracy,
      totalSamples: this.metrics.totalSamples + 1,
      confidenceScore: 1 - errorRate,
      adaptabilityScore,
      learningRate
    };

    if (modelType) {
      this.specializedModelsMetrics[modelType] = {
        accuracy: (this.specializedModelsMetrics[modelType].accuracy + accuracy) / 2,
        confidence: 1 - errorRate,
        samples: this.specializedModelsMetrics[modelType].samples + 1,
        adaptability: adaptabilityScore
      };
    }

    // Record improvements
    if (accuracy > this.metrics.avgAccuracy) {
      this.modelHealth.improvements.push(`Accuracy improved by ${((accuracy - this.metrics.avgAccuracy) * 100).toFixed(2)}%`);
    }

    this.metrics = metrics;
    this.modelHealth.lastUpdate = new Date();
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

    // Check for model degradation
    if (metrics.adaptabilityScore < 0.3) {
      systemLogger.log('model', 'Low adaptability detected', {
        adaptabilityScore: metrics.adaptabilityScore,
        recommendation: 'Consider retraining with more diverse data'
      });
    }
  }

  getMetricsSummary(): ModelMetricsSummary {
    return this.metrics;
  }

  getModelHealth() {
    return this.modelHealth;
  }

  getSpecializedModelsStatus(): SpecializedModelsStatus {
    const modelsAboveThreshold = Object.values(this.specializedModelsMetrics)
      .filter(metrics => metrics.accuracy > 0.4 && metrics.confidence > 0.6).length;

    return {
      active: true,
      activeCount: 4,
      totalCount: 4,
      performance: this.specializedModelsMetrics
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
      healthy: this.modelHealth.overallHealth > 0.7,
      health: Math.round(this.modelHealth.overallHealth * 100),
      alerts: this.modelHealth.warnings.length
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
}

export const modelMonitoring = ModelMonitoring.getInstance();