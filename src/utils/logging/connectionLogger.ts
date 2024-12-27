import { systemLogger } from './systemLogger';

class ConnectionLogger {
  logWebSocketError(url: string, error: any) {
    systemLogger.error('connection', 'WebSocket connection failed', {
      url,
      error: error?.message || error,
      timestamp: new Date().toISOString(),
      stack: error?.stack
    });
  }

  logWebSocketAttempt(url: string) {
    systemLogger.log('connection', 'Attempting WebSocket connection', {
      url,
      timestamp: new Date().toISOString()
    });
  }

  logWebSocketSuccess(url: string) {
    systemLogger.log('connection', 'WebSocket connection established', {
      url,
      timestamp: new Date().toISOString()
    });
  }

  logCorsError(url: string, origin: string) {
    systemLogger.error('connection', 'CORS error detected', {
      url,
      origin,
      timestamp: new Date().toISOString()
    });
  }

  logFetchError(url: string, error: any) {
    systemLogger.error('connection', 'Fetch request failed', {
      url,
      error: error?.message || error,
      status: error?.status,
      timestamp: new Date().toISOString()
    });
  }
}

export const connectionLogger = new ConnectionLogger();