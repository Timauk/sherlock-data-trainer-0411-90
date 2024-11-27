import { logger } from './logger';

export class SystemLogger {
  static logError(error: Error, context: Record<string, any> = {}) {
    logger.error('\x1b[31m%s\x1b[0m', 'ERRO DO SISTEMA:', {
      message: error.message,
      stack: error.stack,
      ...context,
      timestamp: new Date().toISOString()
    });
  }

  static logWarning(message: string, context: Record<string, any> = {}) {
    logger.warn('\x1b[33m%s\x1b[0m', 'AVISO DO SISTEMA:', {
      message,
      ...context,
      timestamp: new Date().toISOString()
    });
  }

  static logInfo(message: string, context: Record<string, any> = {}) {
    logger.info('\x1b[32m%s\x1b[0m', 'INFO DO SISTEMA:', {
      message,
      ...context,
      timestamp: new Date().toISOString()
    });
  }

  static logDebug(message: string, context: Record<string, any> = {}) {
    logger.debug('\x1b[36m%s\x1b[0m', 'DEBUG DO SISTEMA:', {
      message,
      ...context,
      timestamp: new Date().toISOString()
    });
  }
}