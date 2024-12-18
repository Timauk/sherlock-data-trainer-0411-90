import { systemLogger } from '@/utils/logging/systemLogger';

export class PerformanceServices {
  private static instance: PerformanceServices;
  private metrics: {
    latency: number[];
    memory: number[];
    accuracy: number[];
  } = {
    latency: [],
    memory: [],
    accuracy: []
  };

  // Add the missing getModelMetrics method
  static getModelMetrics() {
    return {
      accuracy: 0,
      loss: 0,
      predictions: 0,
      successRate: 0
    };
  }

  // Cache Management
  static cacheManager = {
    cache: new Map<string, any>(),
    
    set(key: string, value: any, ttl?: number) {
      this.cache.set(key, {
        value,
        expires: ttl ? Date.now() + ttl : null
      });
    },
    
    get(key: string) {
      const item = this.cache.get(key);
      if (!item) return null;
      if (item.expires && item.expires < Date.now()) {
        this.cache.delete(key);
        return null;
      }
      return item.value;
    },
    
    clear() {
      this.cache.clear();
    }
  };

  // Performance Monitoring
  static recordMetric(type: 'latency' | 'memory' | 'accuracy', value: number) {
    if (!this.instance) {
      this.instance = new PerformanceServices();
    }
    this.instance.metrics[type].push(value);
    if (this.instance.metrics[type].length > 100) {
      this.instance.metrics[type] = this.instance.metrics[type].slice(-100);
    }
  }

  // Model Monitoring
  static monitorModel(accuracy: number, processingTime: number) {
    systemLogger.log('performance', 'Métricas de previsão', {
      accuracy,
      processingTime,
      timestamp: new Date().toISOString()
    });
  }

  // Prediction Monitoring
  static recordPrediction(prediction: number[], actual: number[], arima: number[]) {
    systemLogger.log('prediction', 'Nova previsão registrada', {
      predictionLength: prediction.length,
      actualLength: actual.length,
      arimaLength: arima.length,
      timestamp: new Date().toISOString()
    });
  }
}