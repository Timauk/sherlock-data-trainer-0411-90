import { systemLogger } from './systemLogger';
import { Player } from '@/types/gameTypes';
import * as tf from '@tensorflow/tfjs';

/**
 * Utilitário para logging específico do jogo
 * Centraliza todos os logs relacionados ao jogo para facilitar depuração
 */
export const gameLogger = {
  /**
   * Registra eventos relacionados ao modelo
   */
  logModelEvent: (action: string, details?: any) => {
    systemLogger.log('model', `Modelo: ${action}`, details);
  },

  /**
   * Registra eventos relacionados aos jogadores
   */
  logPlayerEvent: (playerId: number, action: string, details?: any) => {
    systemLogger.log('player', `Jogador #${playerId}: ${action}`, details);
  },

  /**
   * Registra eventos relacionados às predições
   */
  logPredictionEvent: (action: string, details?: any) => {
    systemLogger.log('prediction', `Predição: ${action}`, details);
  },

  /**
   * Registra erros específicos do jogo
   */
  logGameError: (error: Error, context: string) => {
    systemLogger.error('game', `Erro em ${context}`, {
      message: error.message,
      stack: error.stack
    });
  }
};