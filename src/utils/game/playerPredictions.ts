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
    const predictions = await Promise.all(
      players.map(async (player) => {
        const inputTensor = tf.tensor2d([currentBoardNumbers]);
        const prediction = trainedModel.predict(inputTensor) as tf.Tensor;
        const result = Array.from(await prediction.data());
        
        inputTensor.dispose();
        prediction.dispose();
        
        return result.map(n => Math.round(n * 24) + 1);
      })
    );

    systemLogger.log('prediction', 'Generated predictions for players', {
      playerCount: players.length,
      samplePrediction: predictions[0]
    });

    return predictions;
  } catch (error) {
    systemLogger.error('prediction', 'Failed to generate predictions', { error });
    throw error;
  }
};