interface LogEntry {
  timestamp: Date;
  type: 'action' | 'prediction' | 'performance' | 'system' | 'lunar' | 
        'player' | 'checkpoint' | 'learning' | 'model' | 'training' | 'specialist';
  message: string;
  details?: any;
  severity?: 'info' | 'warning' | 'error' | 'success';
}

import { logger } from './logger';

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

    // Adiciona ao array de logs em memória
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Grava no arquivo usando o logger Pino
    switch (severity) {
      case 'error':
        logger.error({ type, ...entry }, message);
        break;
      case 'warning':
        logger.warn({ type, ...entry }, message);
        break;
      case 'success':
        logger.info({ type, success: true, ...entry }, message);
        break;
      default:
        logger.info({ type, ...entry }, message);
    }

    // Dispara evento para atualização da UI
    const event = new CustomEvent('systemLog', { detail: entry });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(event);
    }

    // Notifica subscribers
    this.notify(entry);
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
    logger.info('Logs limpos pelo usuário');
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