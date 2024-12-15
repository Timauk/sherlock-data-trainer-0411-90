export interface LogEntry {
  timestamp: Date;
  type: 'action' | 'prediction' | 'performance' | 'system' | 'lunar' | 'player' | 
        'checkpoint' | 'learning' | 'model' | 'initialization' | 'training' | 
        'csv' | 'bank' | 'evolution' | 'players' | 'game' | 'error' | 
        'features' | 'weights' | 'tensor' | 'metrics' | 'validation' | 'reward';
  message: string;
  details?: any;
}

class SystemLogger {
  private static instance: SystemLogger;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
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

    this.logInterval = setInterval(() => {
      try {
        const usage = this.getMemoryUsage();
        if (usage) {
          this.warn('performance', 'Uso de Memória do Sistema', usage);
        }
      } catch (error) {
        console.debug('Não foi possível obter uso de memória:', error);
      }
    }, 300000);
  }

  private getMemoryUsage() {
    try {
      if (typeof performance !== 'undefined' && performance.memory) {
        return {
          // @ts-ignore - propriedade memory existe no Chrome
          jsHeapSizeLimit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + 'MB',
          // @ts-ignore
          totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB',
          // @ts-ignore
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
    this.addLog({
      timestamp: new Date(),
      type,
      message,
      details,
    });
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
    this.addLog({
      timestamp: new Date(),
      type,
      message: `WARNING: ${message}`,
      details,
    });
  }

  public debug(type: LogEntry['type'], message: string, details?: any) {
    this.addLog({
      timestamp: new Date(),
      type,
      message: `DEBUG: ${message}`,
      details,
    });
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

      // Log para console com tratamento de erro
      this.printLog(entry);
    } catch (error) {
      console.error('Erro ao adicionar log:', error);
    }
  }

  private printLog(entry: LogEntry) {
    try {
      const logLevel = entry.message.startsWith('ERROR:') ? 'error' : 
                      entry.message.startsWith('WARNING:') ? 'warn' : 
                      entry.message.startsWith('DEBUG:') ? 'debug' : 'info';

      const colorMap = {
        info: '\x1b[32m',  // Verde
        warn: '\x1b[33m',  // Amarelo
        error: '\x1b[31m', // Vermelho
        debug: '\x1b[36m', // Ciano
      };

      const color = colorMap[logLevel] || '\x1b[0m';
      const logMessage = `${color}[${entry.type.toUpperCase()}] ${entry.message}\x1b[0m`;
      
      console[logLevel](logMessage, entry.details || '');
    } catch (error) {
      // Fallback para log simples em caso de erro
      console.log(entry.message, entry.details);
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
