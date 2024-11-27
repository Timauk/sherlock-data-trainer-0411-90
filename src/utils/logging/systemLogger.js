import { logger } from './logger.js';

class SystemLogger {
  static logError(error, context = {}) {
    logger.error('\x1b[31m%s\x1b[0m', 'ERRO DO SISTEMA:', {
      message: error.message,
      stack: error.stack,
      ...context,
      timestamp: new Date().toISOString()
    });
  }

  static logWarning(message, context = {}) {
    logger.warn('\x1b[33m%s\x1b[0m', 'AVISO DO SISTEMA:', {
      message,
      ...context,
      timestamp: new Date().toISOString()
    });
  }

  static logInfo(message, context = {}) {
    logger.info('\x1b[32m%s\x1b[0m', 'INFO DO SISTEMA:', {
      message,
      ...context,
      timestamp: new Date().toISOString()
    });
  }

  static logDebug(message, context = {}) {
    logger.debug('\x1b[36m%s\x1b[0m', 'DEBUG DO SISTEMA:', {
      message,
      ...context,
      timestamp: new Date().toISOString()
    });
  }
}

export { SystemLogger };