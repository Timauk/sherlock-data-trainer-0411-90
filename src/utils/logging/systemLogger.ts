export interface LogEntry {
  timestamp: Date;
  type: 'action' | 'prediction' | 'performance' | 'system' | 'lunar' | 'player' | 'checkpoint' | 'learning' | 'model';
  message: string;
  details?: any;
}

class SystemLogger {
  static instance;
  logs = [];
  maxLogs = 1000;

  constructor() {
    if (SystemLogger.instance) {
      return SystemLogger.instance;
    }
    SystemLogger.instance = this;
  }

  static getInstance() {
    if (!SystemLogger.instance) {
      SystemLogger.instance = new SystemLogger();
    }
    return SystemLogger.instance;
  }

  log(type: LogEntry['type'], message: string, details?: any) {
    const entry = {
      timestamp: new Date(),
      type,
      message,
      details,
    };

    this.addLog(entry);
    this.printLog(entry, 'info');
  }

  error(type: LogEntry['type'], message: string, details?: any) {
    const entry = {
      timestamp: new Date(),
      type,
      message: `ERROR: ${message}`,
      details,
    };

    this.addLog(entry);
    this.printLog(entry, 'error');
  }

  warn(type: LogEntry['type'], message: string, details?: any) {
    const entry = {
      timestamp: new Date(),
      type,
      message: `WARNING: ${message}`,
      details,
    };

    this.addLog(entry);
    this.printLog(entry, 'warn');
  }

  debug(type: LogEntry['type'], message: string, details?: any) {
    const entry = {
      timestamp: new Date(),
      type,
      message: `DEBUG: ${message}`,
      details,
    };

    this.addLog(entry);
    this.printLog(entry, 'debug');
  }

  getLogs() {
    return [...this.logs];
  }

  getLogsByType(type: LogEntry['type']) {
    return this.logs.filter((log) => log.type === type);
  }

  clearLogs() {
    this.logs = [];
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('systemLogsClear'));
    }
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry);

    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('systemLog', { detail: entry }));
    }
  }

  private printLog(entry: LogEntry, level: 'info' | 'warn' | 'error' | 'debug') {
    const colorMap = {
      info: '\x1b[32m',
      warn: '\x1b[33m',
      error: '\x1b[31m',
      debug: '\x1b[36m',
    };

    const color = colorMap[level] || '\x1b[0m';
    console[level](`${color}[${entry.type.toUpperCase()}] ${entry.message}\x1b[0m`, entry.details || '');
  }
}

export const systemLogger = SystemLogger.getInstance();