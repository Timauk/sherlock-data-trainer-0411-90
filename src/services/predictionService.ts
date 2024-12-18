import * as tf from '@tensorflow/tfjs';
import { Player } from '@/types/gameTypes';
import { gameLogger } from '@/utils/logging/gameLogger';

/**
 * Serviço responsável por gerar e gerenciar predições dos jogadores
 */
export class PredictionService {
  /**
   * Gera predições para um jogador usando o modelo treinado
   */
  static async generatePrediction(
    player: Player,
    model: tf.LayersModel
  ): Promise<number[]> {
    try {
      gameLogger.logPredictionEvent('Iniciando geração de predição', {
        playerId: player.id,
        weightsLength: player.weights.length
      });

      // Criar tensor com os pesos do jogador
      const inputTensor = tf.tensor2d([player.weights]);
      
      // Gerar predição
      const prediction = model.predict(inputTensor) as tf.Tensor;
      const predictionData = Array.from(await prediction.data());

      // Limpar tensores
      inputTensor.dispose();
      prediction.dispose();

      gameLogger.logPredictionEvent('Predição gerada com sucesso', {
        playerId: player.id,
        predictionLength: predictionData.length
      });

      return predictionData;
    } catch (error) {
      gameLogger.logGameError(error as Error, 'generatePrediction');
      throw error;
    }
  }

  /**
   * Gera predições em lote para múltiplos jogadores
   */
  static async generateBatchPredictions(
    players: Player[],
    model: tf.LayersModel
  ): Promise<Player[]> {
    try {
      gameLogger.logPredictionEvent('Iniciando predições em lote', {
        playerCount: players.length
      });

      const updatedPlayers = await Promise.all(
        players.map(async (player) => {
          const predictions = await this.generatePrediction(player, model);
          return {
            ...player,
            predictions,
            modelConnection: {
              ...player.modelConnection,
              lastPrediction: predictions,
              lastUpdate: new Date().toISOString()
            }
          };
        })
      );

      gameLogger.logPredictionEvent('Predições em lote concluídas', {
        successCount: updatedPlayers.length
      });

      return updatedPlayers;
    } catch (error) {
      gameLogger.logGameError(error as Error, 'generateBatchPredictions');
      throw error;
    }
  }
}