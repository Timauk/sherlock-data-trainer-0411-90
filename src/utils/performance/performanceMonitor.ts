import { performanceMonitor as localPerformance } from '../gptengineer';

export const performanceMonitor = {
  ...localPerformance,
  measureExecutionTime: (fn: (...args: any[]) => any) => {
    return async (...args: any[]) => {
      const start = performance.now();
      const result = await fn(...args);
      const end = performance.now();
      console.log(`Execution time: ${end - start}ms`);
      return result;
    };
  },
  
  trackMemoryUsage: () => {
    if (typeof window !== 'undefined') {
      const memory = (performance as any).memory;
      if (memory) {
        return {
          totalJSHeapSize: memory.totalJSHeapSize,
          usedJSHeapSize: memory.usedJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        };
      }
    }
    return null;
  },

  startTransaction: (label: string) => {
    localPerformance.start(label);
    return {
      end: () => {
        localPerformance.end(label);
      }
    };
  },

  measureAsyncOperation: async <T>(
    operation: () => Promise<T>,
    label: string
  ): Promise<T> => {
    const transaction = performanceMonitor.startTransaction(label);
    try {
      const result = await operation();
      return result;
    } finally {
      transaction.end();
    }
  }
};
