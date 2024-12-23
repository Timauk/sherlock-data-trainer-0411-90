export interface LogEntry {
  timestamp: Date;
  type: 'action' | 'prediction' | 'performance' | 'system' | 'lunar' | 'player' | 
        'checkpoint' | 'learning' | 'model' | 'initialization' | 'training' | 
        'csv' | 'bank' | 'evolution' | 'players' | 'game' | 'error' | 
        'features' | 'weights' | 'tensor' | 'metrics' | 'validation' | 'reward' | 'clone';
  message: string;
  details?: any;
}

class SystemLogger {
  private static instance: SystemLogger;
  private logs: LogEntry[] = [];
  private maxLogs = 100; // Reduced from 1000
  private logInterval: NodeJS.Timeout | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.startLoggingInterval();
    }
  }

  private startLoggingInterval() {
    if (this.logInterval) {
      clearInterval(this.logInterval);
    }

    // Increased interval from 300000 to 600000 (10 minutes)
    this.logInterval = setInterval(() => {
      try {
        const usage = this.getMemoryUsage();
        if (usage) {
          this.warn('performance', 'Memory Usage', usage);
        }
      } catch (error) {
        console.debug('Memory usage check failed:', error);
      }
    }, 600000);
  }

  private getMemoryUsage() {
    try {
      if (typeof performance !== 'undefined' && performance.memory) {
        return {
          // @ts-ignore - memory exists in Chrome
          usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB'
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  public static getInstance(): SystemLogger {
    if (!SystemLogger.instance) {
      SystemLogger.instance = new SystemLogger();
    }
    return SystemLogger.instance;
  }

  public log(type: LogEntry['type'], message: string, details?: any) {
    if (['error', 'system', 'game', 'model', 'training'].includes(type)) {
      let qualityIndicator = '';
      
      if (details?.loss !== undefined) {
        qualityIndicator += details.loss < 0.5 ? '✅ ' : '⚠️ ';
      }
      
      if (details?.accuracy !== undefined) {
        qualityIndicator += details.accuracy > 0.7 ? '✅ ' : '⚠️ ';
      }

      const enhancedMessage = qualityIndicator + message;
      
      this.addLog({
        timestamp: new Date(),
        type,
        message: enhancedMessage,
        details: {
          ...details,
          qualityAssessment: {
            isGoodLoss: details?.loss < 0.5,
            isGoodAccuracy: details?.accuracy > 0.7,
            recommendation: this.getRecommendation(details)
          }
        },
      });
    }
  }

  private getRecommendation(details: any): string {
    if (!details) return '';
    
    if (details.loss > 0.5 && details.accuracy < 0.7) {
      return 'O modelo precisa de mais treinamento ou ajustes';
    } else if (details.loss < 0.5 && details.accuracy > 0.7) {
      return 'O modelo está apresentando bom desempenho';
    } else if (details.convergenceRate < 0.001) {
      return 'A taxa de aprendizado está muito baixa, considere ajustar';
    }
    
    return 'Continue monitorando o progresso';
  }

  public error(type: LogEntry['type'], message: string, details?: any) {
    this.addLog({
      timestamp: new Date(),
      type,
      message: `ERROR: ${message}`,
      details,
    });
  }

  public warn(type: LogEntry['type'], message: string, details?: any) {
    // Only log performance warnings
    if (type === 'performance') {
      this.addLog({
        timestamp: new Date(),
        type,
        message: `WARNING: ${message}`,
        details,
      });
    }
  }

  private addLog(entry: LogEntry) {
    try {
      this.logs.push(entry);

      if (this.logs.length > this.maxLogs) {
        this.logs = this.logs.slice(-this.maxLogs);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('systemLog', { detail: entry }));
      }

      // Simplified console output
      const logLevel = entry.message.startsWith('ERROR:') ? 'error' : 
                      entry.message.startsWith('WARNING:') ? 'warn' : 'info';
      console[logLevel](`[${entry.type}] ${entry.message}`);
    } catch (error) {
      console.error('Log error:', error);
    }
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public getLogsByType(type: LogEntry['type']): LogEntry[] {
    return this.logs.filter((log) => log.type === type);
  }

  public clearLogs() {
    this.logs = [];
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('systemLogsClear'));
    }
  }

  public dispose() {
    if (this.logInterval) {
      clearInterval(this.logInterval);
      this.logInterval = null;
    }
  }
}

export const systemLogger = SystemLogger.getInstance();
