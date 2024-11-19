type LogEntry = {
  timestamp: Date;
  type: string;
  message: string;
  details?: any;
  severity?: 'info' | 'warning' | 'error' | 'success';
};

type ErrorHandler = (error: Error) => void;

class SystemLogger {
  private logs: LogEntry[] = [];
  private errorHandler: ErrorHandler | null = null;

  log(
    type: string, 
    message: string, 
    details: Record<string, unknown> = {}, 
    severity: 'info' | 'warning' | 'error' | 'success' = 'info'
  ): void {
    try {
      const logEntry: LogEntry = {
        timestamp: new Date(),
        type,
        message,
        details,
        severity
      };

      this.logs.push(logEntry);

      if (typeof window !== 'undefined') {
        const event = new CustomEvent('systemLog', { 
          detail: logEntry 
        });
        window.dispatchEvent(event);
      }

      // Format console output
      const prefix = `[${type.toUpperCase()}]`;
      const detailsStr = details ? JSON.stringify(details) : '';
      console.log(`${prefix} ${message}`, detailsStr);

      // Handle errors automatically
      if (severity === 'error' && this.errorHandler) {
        this.errorHandler(new Error(message));
      }
    } catch (error) {
      console.error('Error in SystemLogger:', error);
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  setErrorHandler(handler: ErrorHandler): void {
    this.errorHandler = handler;
  }

  clearLogs(): void {
    this.logs = [];
  }
}

export const systemLogger = new SystemLogger();