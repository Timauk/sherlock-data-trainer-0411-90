export interface LogEntry {
  timestamp: Date;
  type: 'action' | 'prediction' | 'performance' | 'system' | 'lunar' | 'player' | 'checkpoint' | 'learning' | 'model';
  message: string;
  details?: any;
}

class SystemLogger {
  private static instance: SystemLogger;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private constructor() {}

  public static getInstance(): SystemLogger {
    if (!SystemLogger.instance) {
      SystemLogger.instance = new SystemLogger();
    }
    return SystemLogger.instance;
  }

  public log(type: LogEntry['type'], message: string, details?: any): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      type,
      message,
      details
    };

    this.logs.push(entry);

    // Limita o número de logs armazenados
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Emite evento para atualizar a interface
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('systemLog', { detail: entry }));
    }

    // Log no console para debug
    console.log(`[${type.toUpperCase()}] ${message}`, details || '');
  }

  public error(type: LogEntry['type'], message: string, details?: any): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      type,
      message: `ERROR: ${message}`,
      details
    };
    
    this.logs.push(entry);
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('systemLog', { detail: entry }));
    }
    
    console.error(`[${type.toUpperCase()}] ${message}`, details || '');
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('systemLogsClear'));
    }
  }
}

export const systemLogger = SystemLogger.getInstance();