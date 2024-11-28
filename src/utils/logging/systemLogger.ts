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

  public info(type: LogEntry['type'], message: string, details?: any): void {
    this.addLog(type, message, details);
  }

  public log(type: LogEntry['type'], message: string, details?: any): void {
    this.addLog(type, message, details);
  }

  public error(type: LogEntry['type'], message: string, details?: any): void {
    this.addLog(type, `ERROR: ${message}`, details);
    console.error(`[${type.toUpperCase()}] ${message}`, details || '');
  }

  private addLog(type: LogEntry['type'], message: string, details?: any): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      type,
      message,
      details
    };

    this.logs.push(entry);
    
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Dispatch event for UI updates
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('systemLog', { detail: entry });
      window.dispatchEvent(event);
    }

    // Console log for debugging
    console.log(`[${type.toUpperCase()}] ${message}`, details || '');
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public getLogsByType(type: LogEntry['type']): LogEntry[] {
    return this.logs.filter(log => log.type === type);
  }

  public clearLogs(): void {
    this.logs = [];
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('systemLogsClear'));
    }
  }
}

export const systemLogger = SystemLogger.getInstance();