import { systemLogger } from './systemLogger';

class ConnectionLogger {
  logWebSocketError(url: string, error: any) {
    systemLogger.error('system', 'WebSocket connection failed', {
      url,
      error: error?.message || error,
      timestamp: new Date().toISOString(),
      stack: error?.stack,
      type: 'connection'
    });
  }

  logWebSocketAttempt(url: string) {
    systemLogger.log('system', 'Attempting WebSocket connection', {
      url,
      timestamp: new Date().toISOString(),
      type: 'connection'
    });
  }

  logWebSocketSuccess(url: string) {
    systemLogger.log('system', 'WebSocket connection established', {
      url,
      timestamp: new Date().toISOString(),
      type: 'connection'
    });
  }

  logCorsError(url: string, origin: string) {
    systemLogger.error('system', 'CORS error detected', {
      url,
      origin,
      timestamp: new Date().toISOString(),
      type: 'connection'
    });
  }

  logFetchError(url: string, error: any) {
    systemLogger.error('system', 'Fetch request failed', {
      url,
      error: error?.message || error,
      status: error?.status,
      timestamp: new Date().toISOString(),
      type: 'connection'
    });
  }
}

export const connectionLogger = new ConnectionLogger();