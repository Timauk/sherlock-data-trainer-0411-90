import * as tf from '@tensorflow/tfjs';
import { Player } from '@/types/gameTypes';
import { ModelVisualization } from '@/types/gameTypes';
import { systemLogger } from '../logging/systemLogger';

export const handlePlayerPredictions = async (
  players: Player[],
  trainedModel: tf.LayersModel,
  currentBoardNumbers: number[],
  nextConcurso: number,
  setNeuralNetworkVisualization: (viz: ModelVisualization | null) => void,
  lunarData: { lunarPhase: string; lunarPatterns: Record<string, number[]> }
): Promise<number[][]> => {
  try {
    systemLogger.log('prediction', 'Iniciando geração de previsões', {
      inputShape: currentBoardNumbers.length,
      playersCount: players.length,
      modelInputShape: trainedModel.inputs[0].shape
    });

    const predictions = await Promise.all(
      players.map(async (player) => {
        // Garantir que temos exatamente 15 números
        const normalizedInput = currentBoardNumbers.slice(0, 15);
        
        // Criar tensor com shape correto [1, 15]
        const inputTensor = tf.tensor2d([normalizedInput]);
        
        systemLogger.log('prediction', 'Tensor de entrada criado', {
          shape: inputTensor.shape,
          values: normalizedInput
        });

        const prediction = trainedModel.predict(inputTensor) as tf.Tensor;
        const result = Array.from(await prediction.data());
        
        // Cleanup
        inputTensor.dispose();
        prediction.dispose();
        
        // Converter previsões para números de 1 a 25
        return result.map(n => Math.round(n * 24) + 1);
      })
    );

    systemLogger.log('prediction', 'Previsões geradas com sucesso', {
      totalPredictions: predictions.length,
      samplePrediction: predictions[0]
    });

    return predictions;
  } catch (error) {
    systemLogger.error('prediction', 'Falha ao gerar previsões', { error });
    throw error;
  }
};