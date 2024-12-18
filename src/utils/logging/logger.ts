import { systemLogger } from './systemLogger';

export type LogType = 'action' | 'prediction' | 'performance' | 'system' | 'lunar' | 
                     'player' | 'checkpoint' | 'learning' | 'model' | 'initialization' | 
                     'training' | 'csv' | 'bank' | 'evolution' | 'players' | 'game' | 
                     'error' | 'features' | 'weights' | 'tensor' | 'metrics' | 
                     'validation' | 'reward' | 'clone';

export interface LogEntry {
  timestamp: Date;
  type: LogType;
  message: string;
  details?: any;
}

class Logger {
  private static instance: Logger;
  
  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  // Métodos básicos de logging
  public debug(message: string, details?: any) {
    systemLogger.log('system', message, details);
  }

  public info(message: string, details?: any) {
    systemLogger.log('system', message, details);
  }

  public warn(message: string, details?: any) {
    systemLogger.warn('system', message, details);
  }

  public error(message: string, details?: any) {
    systemLogger.error('system', message, details);
  }

  // Game Logging
  public logGame(message: string, details?: any) {
    systemLogger.log('game', message, details);
  }

  // Player Logging
  public logPlayer(playerId: number, action: string, details?: any) {
    systemLogger.log('player', `Player #${playerId}: ${action}`, details);
  }

  // Clone Logging
  public logClone(originalId: number, newId: number, details?: any) {
    systemLogger.log('clone', `Cloned Player #${originalId} to #${newId}`, details);
  }

  // Model Logging
  public logModel(action: string, details?: any) {
    systemLogger.log('model', action, details);
  }

  // Prediction Logging
  public logPrediction(playerId: number, predictions: number[], details?: any) {
    systemLogger.log('prediction', `Predictions for Player #${playerId}`, {
      predictions,
      ...details
    });
  }

  // Error Logging
  public logError(type: LogType, error: Error | string, details?: any) {
    systemLogger.error(type, error instanceof Error ? error.message : error, {
      stack: error instanceof Error ? error.stack : undefined,
      ...details
    });
  }

  // Warning Logging
  public logWarning(type: LogType, message: string, details?: any) {
    systemLogger.warn(type, message, details);
  }

  // Performance Logging
  public logPerformance(action: string, duration: number, details?: any) {
    systemLogger.log('performance', `${action} took ${duration}ms`, details);
  }
}

export const logger = Logger.getInstance();