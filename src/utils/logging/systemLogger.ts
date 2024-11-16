interface LogEntry {
  timestamp: Date;
  type: 'action' | 'prediction' | 'performance' | 'system' | 'lunar' | 'player' | 'checkpoint' | 'learning' | 'model';
  message: string;
  details?: any;
  severity?: 'info' | 'warning' | 'error' | 'success';
}

class SystemLogger {
  private static instance: SystemLogger;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private errorHandler?: (error: Error) => void;

  private constructor() {}

  static getInstance(): SystemLogger {
    if (!SystemLogger.instance) {
      SystemLogger.instance = new SystemLogger();
    }
    return SystemLogger.instance;
  }

  setErrorHandler(handler: (error: Error) => void) {
    this.errorHandler = handler;
  }

  log(
    type: LogEntry['type'], 
    message: string, 
    details?: any, 
    severity: LogEntry['severity'] = 'info'
  ) {
    try {
      const entry: LogEntry = {
        timestamp: new Date(),
        type,
        message,
        details,
        severity
      };

      this.logs.push(entry);
      if (this.logs.length > this.maxLogs) {
        this.logs = this.logs.slice(-this.maxLogs);
      }

      // Dispatch event for UI updates
      const event = new CustomEvent('systemLog', { detail: entry });
      window.dispatchEvent(event);

      if (severity === 'error' && this.errorHandler) {
        this.errorHandler(new Error(message));
      }

      console.log(`[${type.toUpperCase()}] ${message}`, details || '');
    } catch (error) {
      console.error('Error in SystemLogger:', error);
      if (this.errorHandler && error instanceof Error) {
        this.errorHandler(error);
      }
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  getLogsByType(type: LogEntry['type']): LogEntry[] {
    return this.logs.filter(log => log.type === type);
  }

  clearLogs() {
    this.logs = [];
  }
}

export const systemLogger = SystemLogger.getInstance();