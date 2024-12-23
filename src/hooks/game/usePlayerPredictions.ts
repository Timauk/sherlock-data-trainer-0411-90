import { useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import { Player } from '@/types/gameTypes';
import { systemLogger } from '@/utils/logging/systemLogger';
import { PLAYER_BASE_WEIGHTS, PREDICTION_CONFIG } from '@/utils/constants';

export const usePlayerPredictions = () => {
  const generatePrediction = useCallback(async (
    player: Player,
    model: tf.LayersModel,
    inputData: number[]
  ): Promise<number[]> => {
    try {
      systemLogger.log('prediction', `Gerando predição para jogador #${player.id}`, {
        inputData,
        weightsLength: player.weights.length,
        timestamp: new Date().toISOString()
      });

      // Criar tensor com os dados de entrada
      const inputTensor = tf.tensor2d([inputData]);
      
      // Gerar predição base do modelo
      const prediction = model.predict(inputTensor) as tf.Tensor;
      const probabilities = Array.from(await prediction.data());

      // Aplicar pesos do jogador
      const weightedPredictions = probabilities.map((prob, index) => ({
        number: index + 1,
        probability: prob * (Object.values(PLAYER_BASE_WEIGHTS)[index % Object.keys(PLAYER_BASE_WEIGHTS).length] / 1000)
      }));

      // Ordenar e selecionar os números mais prováveis
      const selectedNumbers = weightedPredictions
        .sort((a, b) => b.probability - a.probability)
        .slice(0, PREDICTION_CONFIG.NUMBERS_PER_GAME)
        .map(p => p.number)
        .sort((a, b) => a - b);

      systemLogger.log('prediction', `Predição gerada para jogador #${player.id}`, {
        predictions: selectedNumbers,
        timestamp: new Date().toISOString()
      });

      // Limpar tensores
      inputTensor.dispose();
      prediction.dispose();

      return selectedNumbers;
    } catch (error) {
      systemLogger.error('prediction', `Erro ao gerar predição para jogador #${player.id}`, {
        error,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }, []);

  return { generatePrediction };
};