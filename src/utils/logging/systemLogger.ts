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

  log(type: string, message: string, details?: any, severity?: 'info' | 'warning' | 'error' | 'success') {
    const logEntry: LogEntry = {
      timestamp: new Date(),
      type,
      message,
      details,
      severity
    };

    this.logs.push(logEntry);

    // Dispatch custom event for real-time updates
    const event = new CustomEvent('systemLog', { detail: logEntry });
    window.dispatchEvent(event);
  }

  getLogs(): LogEntry[] {
    return this.logs;
  }

  setErrorHandler(handler: ErrorHandler) {
    this.errorHandler = handler;
  }

  handleError(error: Error) {
    if (this.errorHandler) {
      this.errorHandler(error);
    } else {
      console.error('Unhandled system error:', error);
    }
  }

  clearLogs() {
    this.logs = [];
  }
}

export const systemLogger = new SystemLogger();