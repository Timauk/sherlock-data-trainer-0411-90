interface LogEntry {
  timestamp: Date;
  type: 'action' | 'prediction' | 'performance' | 'system' | 'lunar' | 
        'player' | 'checkpoint' | 'learning' | 'model' | 'training' | 'specialist';
  message: string;
  details?: any;
  severity?: 'info' | 'warning' | 'error' | 'success';
}

class SystemLogger {
  private static instance: SystemLogger;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private subscribers: ((entry: LogEntry) => void)[] = [];

  private constructor() {}

  static getInstance(): SystemLogger {
    if (!SystemLogger.instance) {
      SystemLogger.instance = new SystemLogger();
    }
    return SystemLogger.instance;
  }

  subscribe(callback: (entry: LogEntry) => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  private notify(entry: LogEntry) {
    this.subscribers.forEach(callback => callback(entry));
  }

  log(
    type: LogEntry['type'], 
    message: string, 
    details?: any, 
    severity: LogEntry['severity'] = 'info'
  ) {
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

    // Dispara evento para atualização da UI
    const event = new CustomEvent('systemLog', { detail: entry });
    window.dispatchEvent(event);

    // Notifica subscribers
    this.notify(entry);

    // Console logging com cores
    const styles = this.getConsoleStyles(severity);
    console.log(
      `%c[${type.toUpperCase()}] ${message}`,
      styles,
      details || ''
    );
  }

  private getConsoleStyles(severity: LogEntry['severity'] = 'info'): string {
    const baseStyle = 'padding: 2px 5px; border-radius: 3px; color: white;';
    switch (severity) {
      case 'error':
        return `${baseStyle} background-color: #ef4444;`;
      case 'warning':
        return `${baseStyle} background-color: #f97316;`;
      case 'success':
        return `${baseStyle} background-color: #10b981;`;
      default:
        return `${baseStyle} background-color: #6366f1;`;
    }
  }

  getLogs(): LogEntry[] {
    return this.logs;
  }

  getLogsByType(type: LogEntry['type']): LogEntry[] {
    return this.logs.filter(log => log.type === type);
  }

  getLogsBySeverity(severity: LogEntry['severity']): LogEntry[] {
    return this.logs.filter(log => log.severity === severity);
  }

  clearLogs() {
    this.logs = [];
    this.notify({ 
      timestamp: new Date(), 
      type: 'system', 
      message: 'Logs limpos', 
      severity: 'info' 
    });
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const systemLogger = SystemLogger.getInstance();