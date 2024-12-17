import { systemLogger } from '../logging/systemLogger';

class PerformanceMonitor {
  private metrics: {
    latency: number[];
    memory: number[];
    accuracy: number[];
  } = {
    latency: [],
    memory: [],
    accuracy: []
  };

  recordMetric(type: 'latency' | 'memory' | 'accuracy', value: number) {
    this.metrics[type].push(value);
    if (this.metrics[type].length > 100) {
      this.metrics[type] = this.metrics[type].slice(-100);
    }
  }

  getAverageMetric(type: 'latency' | 'memory' | 'accuracy'): number {
    const values = this.metrics[type];
    return values.length > 0 
      ? values.reduce((a, b) => a + b, 0) / values.length 
      : 0;
  }
}

export const performanceMonitor = new PerformanceMonitor();