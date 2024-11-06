import { performanceMonitor } from '../performance/performanceMonitor';
import { systemLogger } from '../logging/systemLogger';

export interface PerformanceDiagnosticResult {
  memoryUsage: number;
  cpuUsage: number | null;
  latency: number;
  throughput: number;
}

export const getPerformanceDiagnostics = (): PerformanceDiagnosticResult => {
  const metrics = performanceMonitor.getAverageMetrics();
  
  const result = {
    memoryUsage: metrics.avgMemory,
    cpuUsage: metrics.avgCPU,
    latency: metrics.avgLatency,
    throughput: metrics.avgLatency > 0 ? 1000 / metrics.avgLatency : 0
  };

  systemLogger.log('system', 'Performance Diagnostic completed', result);
  return result;
};