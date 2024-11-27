import { logger } from './logger';

interface LogEntry {
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

  static getInstance(): SystemLogger {
    if (!SystemLogger.instance) {
      SystemLogger.instance = new SystemLogger();
    }
    return SystemLogger.instance;
  }

  log(type: LogEntry['type'], message: string, details?: any) {
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
    const event = new CustomEvent('systemLog', { detail: entry });
    window.dispatchEvent(event);

    // Console logging with colors
    const colorMap = {
      action: '\x1b[34m',
      prediction: '\x1b[32m',
      performance: '\x1b[33m',
      system: '\x1b[35m',
      lunar: '\x1b[36m',
      player: '\x1b[33m',
      checkpoint: '\x1b[31m',
      learning: '\x1b[32m',
      model: '\x1b[36m'
    };

    const color = colorMap[type] || '\x1b[37m';
    logger.info(`${color}[${type.toUpperCase()}]\x1b[0m ${message}`, details);
  }

  getLogs(): LogEntry[] {
    return this.logs;
  }

  getLogsByType(type: LogEntry['type']): LogEntry[] {
    return this.logs.filter(log => log.type === type);
  }

  clearLogs() {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  logError(error: Error, context: Record<string, any> = {}) {
    this.log('system', `Error: ${error.message}`, {
      stack: error.stack,
      ...context
    });
  }

  logWarning(message: string, context: Record<string, any> = {}) {
    this.log('system', `Warning: ${message}`, context);
  }

  logInfo(message: string, context: Record<string, any> = {}) {
    this.log('system', message, context);
  }

  logDebug(message: string, context: Record<string, any> = {}) {
    this.log('system', `Debug: ${message}`, context);
  }
}

export const systemLogger = SystemLogger.getInstance();