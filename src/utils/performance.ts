import * as tf from '@tensorflow/tfjs';
import pako from 'pako';
import { systemLogger } from './logging/systemLogger';

// Batch Processing
export const processPredictionBatch = async (
  model: tf.LayersModel,
  inputs: number[][],
  playerWeights: number[]
): Promise<number[][]> => {
  const BATCH_SIZE = 32;
  const batches = [];
  
  for (let i = 0; i < inputs.length; i += BATCH_SIZE) {
    const batchInputs = inputs.slice(i, i + BATCH_SIZE);
    const inputTensor = tf.tensor2d(batchInputs);
    
    const predictions = await model.predict(inputTensor) as tf.Tensor;
    const batchResults = await predictions.array() as number[][];
    
    batches.push(...batchResults.map(pred => 
      pred.map((p, idx) => p * (playerWeights[idx % playerWeights.length] / 1000))
    ));
    
    inputTensor.dispose();
    predictions.dispose();
  }
  
  return batches;
};

// Performance Monitoring
interface PerformanceMetrics {
  memoryUsage: number;
  modelAccuracy: number;
  predictionLatency: number;
  cpuUsage: number | null;
  timestamp: Date;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private readonly maxStoredMetrics = 1000;
  private lastCpuUsage: number | null = null;

  private constructor() {
    this.startCpuMonitoring();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private startCpuMonitoring() {
    if ('requestIdleCallback' in window) {
      const updateCpuUsage = () => {
        const lastTime = performance.now();
        requestIdleCallback((deadline) => {
          this.lastCpuUsage = 1 - deadline.timeRemaining() / (performance.now() - lastTime);
          setTimeout(updateCpuUsage, 1000);
        });
      };
      updateCpuUsage();
    }
  }

  recordMetrics(accuracy: number, predictionTime: number): void {
    const metrics: PerformanceMetrics = {
      memoryUsage: this.getMemoryUsage(),
      modelAccuracy: accuracy,
      predictionLatency: predictionTime,
      cpuUsage: this.lastCpuUsage,
      timestamp: new Date()
    };

    this.metrics.push(metrics);
    
    if (this.metrics.length > this.maxStoredMetrics) {
      this.metrics = this.metrics.slice(-this.maxStoredMetrics);
    }
  }

  getMemoryUsage(): number {
    if (performance.memory) {
      return performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
    }
    return 0;
  }

  getCPUUsage(): number | null {
    return this.lastCpuUsage;
  }

  getAverageMetrics(timeWindowMinutes: number = 60) {
    const timeThreshold = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp > timeThreshold);

    if (recentMetrics.length === 0) {
      return { avgAccuracy: 0, avgLatency: 0, avgMemory: 0, avgCPU: null };
    }

    return {
      avgAccuracy: this.calculateAverage(recentMetrics.map(m => m.modelAccuracy)),
      avgLatency: this.calculateAverage(recentMetrics.map(m => m.predictionLatency)),
      avgMemory: this.calculateAverage(recentMetrics.map(m => m.memoryUsage)),
      avgCPU: this.calculateAverage(recentMetrics.filter(m => m.cpuUsage !== null).map(m => m.cpuUsage!))
    };
  }

  private calculateAverage(numbers: number[]): number {
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  clearMetrics(): void {
    this.metrics = [];
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

// Data Compression
export const compressHistoricalData = (data: number[][]): Uint8Array => {
  const jsonString = JSON.stringify(data);
  return pako.deflate(jsonString);
};

export const decompressHistoricalData = (compressedData: Uint8Array): number[][] => {
  const jsonString = pako.inflate(compressedData, { to: 'string' });
  return JSON.parse(jsonString);
};

// Worker Pool
export class WorkerPool {
  private workers: Worker[] = [];
  private taskQueue: Array<() => Promise<any>> = [];
  private activeWorkers = 0;
  private maxWorkers: number;

  constructor(maxWorkers = navigator.hardwareConcurrency || 4) {
    this.maxWorkers = maxWorkers;
  }

  async addTask<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.taskQueue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.activeWorkers >= this.maxWorkers || this.taskQueue.length === 0) {
      return;
    }

    const task = this.taskQueue.shift();
    if (!task) return;

    this.activeWorkers++;
    try {
      await task();
    } finally {
      this.activeWorkers--;
      this.processQueue();
    }
  }

  terminate() {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.taskQueue = [];
    this.activeWorkers = 0;
  }
}