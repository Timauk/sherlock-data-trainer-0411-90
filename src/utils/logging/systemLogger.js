class SystemLogger {
  static instance;
  logs = [];
  maxLogs = 1000;

  static getInstance() {
    if (!SystemLogger.instance) {
      SystemLogger.instance = new SystemLogger();
    }
    return SystemLogger.instance;
  }

  log(type, message, details) {
    const entry = {
      timestamp: new Date(),
      type,
      message,
      details
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    console.log(`[${type.toUpperCase()}] ${message}`, details || '');
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }

  getLogsByType(type) {
    return this.logs.filter(log => log.type === type);
  }
}

export const systemLogger = SystemLogger.getInstance();