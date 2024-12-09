import * as tf from '@tensorflow/tfjs';
import { Player } from '@/types/gameTypes';
import { ModelVisualization } from '@/types/gameTypes';
import { systemLogger } from '../logging/systemLogger';
import { enrichTrainingData } from '../features/lotteryFeatureEngineering';

export const handlePlayerPredictions = async (
  players: Player[],
  trainedModel: tf.LayersModel,
  currentBoardNumbers: number[],
  nextConcurso: number,
  setNeuralNetworkVisualization: (viz: ModelVisualization) => void,
  lunarData: { lunarPhase: string; lunarPatterns: Record<string, number[]> }
) => {
  try {
    systemLogger.log('prediction', 'Starting predictions generation', {
      inputNumbers: currentBoardNumbers,
      playersCount: players.length,
      modelInputShape: trainedModel.inputs[0].shape
    });

    // Ensure we have the correct input shape by enriching the data
    const enrichedData = enrichTrainingData([[...currentBoardNumbers]], [new Date()])[0];
    
    systemLogger.log('prediction', 'Data enrichment complete', {
      enrichedDataLength: enrichedData.length,
      expectedLength: 13072
    });

    if (enrichedData.length !== 13072) {
      throw new Error(`Enriched data length mismatch. Expected 13072, got ${enrichedData.length}`);
    }

    const predictions = await Promise.all(
      players.map(async (player) => {
        const inputTensor = tf.tensor2d([enrichedData]);
        
        systemLogger.log('prediction', 'Input tensor created', {
          shape: inputTensor.shape,
          expectedShape: [1, 13072]
        });

        const prediction = trainedModel.predict(inputTensor) as tf.Tensor;
        const result = Array.from(await prediction.data());
        
        inputTensor.dispose();
        prediction.dispose();
        
        // Convert predictions to actual numbers (1-25)
        const finalPrediction = result
          .map((n, i) => ({ value: n, index: i + 1 }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 15)
          .map(item => item.index)
          .sort((a, b) => a - b);

        return finalPrediction;
      })
    );

    systemLogger.log('prediction', 'Predictions generated successfully', {
      totalPredictions: predictions.length,
      samplePrediction: predictions[0]
    });

    return predictions;
  } catch (error) {
    systemLogger.error('prediction', 'Failed to generate predictions', { 
      error,
      inputShape: currentBoardNumbers.length,
      modelInputShape: trainedModel.inputs[0].shape
    });
    throw error;
  }
};