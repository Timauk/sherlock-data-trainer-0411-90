/**
 * gameLogger.ts
 * 
 * Sistema de logging específico para eventos do jogo
 * Centraliza todos os logs relacionados ao jogo para facilitar
 * o diagnóstico e monitoramento
 */
import { systemLogger } from './systemLogger';
import { Player } from '@/types/gameTypes';

export const gameLogger = {
  /**
   * Registra eventos relacionados aos jogadores
   */
  logPlayerEvent: (
    playerId: number,
    event: string,
    data: any
  ) => {
    systemLogger.log('player', `Jogador #${playerId}: ${event}`, {
      ...data,
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Registra eventos relacionados às previsões
   */
  logPredictionEvent: (
    playerId: number,
    predictions: number[],
    modelInfo: any
  ) => {
    systemLogger.log('prediction', `Previsão gerada para Jogador #${playerId}`, {
      predictions,
      modelInfo,
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Registra eventos relacionados ao modelo
   */
  logModelEvent: (
    event: string,
    modelInfo: any
  ) => {
    systemLogger.log('model', event, {
      ...modelInfo,
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Registra erros específicos do jogo
   */
  logGameError: (
    context: string,
    error: any,
    additionalInfo?: any
  ) => {
    systemLogger.error('game', `Erro em ${context}`, {
      error,
      ...additionalInfo,
      timestamp: new Date().toISOString()
    });
  }
};