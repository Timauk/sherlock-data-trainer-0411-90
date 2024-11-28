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
  private cache: { [key: string]: LogEntry[] } = {};

  private constructor() {
    // Initialize cache
    this.cache = {
      latest: [],
      action: [],
      prediction: [],
      performance: [],
      system: [],
      lunar: [],
      player: [],
      checkpoint: [],
      learning: [],
      model: []
    };
  }

  public static getInstance(): SystemLogger {
    if (!SystemLogger.instance) {
      SystemLogger.instance = new SystemLogger();
    }
    return SystemLogger.instance;
  }

  private updateCache(entry: LogEntry): void {
    // Update type-specific cache
    if (!this.cache[entry.type]) {
      this.cache[entry.type] = [];
    }
    this.cache[entry.type].push(entry);

    // Update latest logs cache
    this.cache.latest.push(entry);

    // Trim caches if they exceed maxLogs
    if (this.cache[entry.type].length > this.maxLogs) {
      this.cache[entry.type] = this.cache[entry.type].slice(-this.maxLogs);
    }
    if (this.cache.latest.length > this.maxLogs) {
      this.cache.latest = this.cache.latest.slice(-this.maxLogs);
    }
  }

  public info(type: LogEntry['type'], message: string, details?: any): void {
    this.log(type, message, details);
  }

  public error(type: LogEntry['type'], message: string, details?: any): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      type,
      message: `ERROR: ${message}`,
      details
    };
    
    this.logs.push(entry);
    this.updateCache(entry);
    
    console.error(`[${type.toUpperCase()}] ${message}`, details || '');
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('systemLog', { detail: entry }));
    }
  }

  public log(type: LogEntry['type'], message: string, details?: any): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      type,
      message,
      details
    };

    this.logs.push(entry);
    this.updateCache(entry);

    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('systemLog', { detail: entry }));
    }

    console.log(`[${type.toUpperCase()}] ${message}`, details || '');
  }

  public getLogs(): LogEntry[] {
    return this.cache.latest || [];
  }

  public getLogsByType(type: LogEntry['type']): LogEntry[] {
    return this.cache[type] || [];
  }

  public clearLogs(): void {
    this.logs = [];
    Object.keys(this.cache).forEach(key => {
      this.cache[key] = [];
    });
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('systemLogsClear'));
    }
  }
}

export const systemLogger = SystemLogger.getInstance();