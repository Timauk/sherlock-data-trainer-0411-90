export interface LogEntry {
  timestamp: Date;
  type: 'action' | 'prediction' | 'performance' | 'system' | 'lunar' | 'player' | 'checkpoint' | 'learning' | 'model';
  message: string;
  details?: any;
}

class SystemLogger {
  private static instance: SystemLogger | null = null;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private constructor() {
    // Initialize empty logs array
    this.logs = [];
  }

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
    
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Dispatch event for UI updates
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('systemLog', { detail: entry });
      window.dispatchEvent(event);
    }

    // Also log to console for debugging
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
  }
}

// Create and export the singleton instance
export const systemLogger = SystemLogger.getInstance();