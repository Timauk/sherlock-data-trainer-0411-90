import { logger } from './logger.js';

class SystemLogger {
  static #instance;
  #logs = [];
  #maxLogs = 1000;

  constructor() {
    if (SystemLogger.#instance) {
      return SystemLogger.#instance;
    }
    SystemLogger.#instance = this;
  }

  static getInstance() {
    if (!SystemLogger.#instance) {
      SystemLogger.#instance = new SystemLogger();
    }
    return SystemLogger.#instance;
  }

  logError(error, context = {}) {
    logger.error('\x1b[31m%s\x1b[0m', 'ERRO DO SISTEMA:', {
      message: error.message,
      stack: error.stack,
      ...context,
      timestamp: new Date().toISOString()
    });
  }

  logWarning(message, context = {}) {
    logger.warn('\x1b[33m%s\x1b[0m', 'AVISO DO SISTEMA:', {
      message,
      ...context,
      timestamp: new Date().toISOString()
    });
  }

  logInfo(message, context = {}) {
    logger.info('\x1b[32m%s\x1b[0m', 'INFO DO SISTEMA:', {
      message,
      ...context,
      timestamp: new Date().toISOString()
    });
  }

  logDebug(message, context = {}) {
    logger.debug('\x1b[36m%s\x1b[0m', 'DEBUG DO SISTEMA:', {
      message,
      ...context,
      timestamp: new Date().toISOString()
    });
  }
}

export const systemLogger = SystemLogger.getInstance();