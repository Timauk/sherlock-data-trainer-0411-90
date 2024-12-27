import { useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import { Player } from '@/types/gameTypes';
import { systemLogger } from '@/utils/logging/systemLogger';
import { PLAYER_BASE_WEIGHTS } from '@/utils/constants';

export const usePlayerPredictions = () => {
  const generatePrediction = useCallback(async (
    player: Player,
    model: tf.LayersModel,
    inputData: number[]
  ): Promise<number[]> => {
    try {
      systemLogger.log('prediction', `Iniciando predição para jogador #${player.id}`, {
        playerId: player.id,
        inputDataLength: inputData.length,
        weightsLength: player.weights.length,
        modelInfo: {
          hasModel: !!model,
          layersCount: model?.layers?.length,
          isCompiled: model?.optimizer !== null
        },
        playerState: {
          score: player.score,
          fitness: player.fitness,
          previousPredictions: player.predictions,
          modelConnection: player.modelConnection
        },
        timestamp: new Date().toISOString()
      });

      const inputTensor = tf.tensor2d([inputData]);
      
      systemLogger.log('tensor', 'Tensor de entrada criado', {
        shape: inputTensor.shape,
        dtype: inputTensor.dtype,
        playerId: player.id,
        timestamp: new Date().toISOString()
      });
      
      const prediction = model.predict(inputTensor) as tf.Tensor;
      const probabilities = Array.from(await prediction.data());

      systemLogger.log('prediction', 'Predição base gerada', {
        playerId: player.id,
        probabilitiesLength: probabilities.length,
        minProb: Math.min(...probabilities),
        maxProb: Math.max(...probabilities),
        timestamp: new Date().toISOString()
      });

      const weightedPredictions = probabilities.map((prob, index) => {
        const playerWeight = player.weights[index % player.weights.length];
        const baseWeight = Object.values(PLAYER_BASE_WEIGHTS)[index % Object.keys(PLAYER_BASE_WEIGHTS).length];
        const weightedProb = prob * (playerWeight / 1000) * (baseWeight / 1000);
        
        systemLogger.log('weights', `Peso aplicado índice ${index}`, {
          playerId: player.id,
          originalProb: prob,
          playerWeight,
          baseWeight,
          weightedProb,
          timestamp: new Date().toISOString()
        });
        
        return {
          number: index + 1,
          probability: weightedProb
        };
      });

      const selectedNumbers = weightedPredictions
        .sort((a, b) => b.probability - a.probability)
        .slice(0, 15)
        .map(p => p.number)
        .sort((a, b) => a - b);

      systemLogger.log('prediction', `Predição final para jogador #${player.id}`, {
        predictions: selectedNumbers,
        weightedPredictions: weightedPredictions.slice(0, 15),
        playerState: {
          score: player.score,
          fitness: player.fitness,
          modelConnection: {
            ...player.modelConnection,
            lastPrediction: selectedNumbers,
            lastUpdate: new Date().toISOString()
          }
        },
        timestamp: new Date().toISOString()
      });

      inputTensor.dispose();
      prediction.dispose();

      return selectedNumbers;
    } catch (error) {
      systemLogger.error('prediction', `Erro ao gerar predição para jogador #${player.id}`, {
        error,
        inputData,
        playerWeights: player.weights,
        modelStatus: player.modelConnection,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }, []);

  return { generatePrediction };
};