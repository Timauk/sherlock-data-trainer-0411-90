import { systemLogger } from './systemLogger';

/**
 * Logger especializado para eventos do jogo
 * Centraliza e padroniza os logs relacionados aos jogadores e suas ações
 */
class GameLogger {
  /**
   * Registra eventos relacionados a jogadores
   * @param playerId ID do jogador
   * @param message Mensagem descritiva
   * @param details Detalhes adicionais do evento
   */
  logPlayerEvent(playerId: number, message: string, details?: any) {
    systemLogger.log('player', `Jogador #${playerId}: ${message}`, {
      ...details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Registra eventos de predição
   * @param message Mensagem descritiva
   * @param details Detalhes da predição
   */
  logPredictionEvent(message: string, details?: any) {
    systemLogger.log('prediction', message, {
      ...details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Registra erros do jogo
   * @param error Objeto de erro
   * @param context Contexto onde o erro ocorreu
   */
  logGameError(error: Error, context: string) {
    systemLogger.error('game', `Erro em ${context}: ${error.message}`, {
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Registra eventos de performance
   * @param message Mensagem descritiva
   * @param metrics Métricas de performance
   */
  logPerformance(message: string, metrics: any) {
    systemLogger.log('performance', message, {
      ...metrics,
      timestamp: new Date().toISOString()
    });
  }
}

export const gameLogger = new GameLogger();