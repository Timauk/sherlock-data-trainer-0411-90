import { Player } from '@/types/gameTypes';
import { predictionMonitor } from '@/utils/monitoring/predictionMonitor';
import { TimeSeriesAnalysis } from '@/utils/analysis/timeSeriesAnalysis';
import { enrichTrainingData } from '@/utils/features/lotteryFeatureEngineering';
import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../logging/systemLogger';

interface LunarData {
  lunarPhase: string;
  lunarPatterns: Record<string, number[]>;
}

async function makePrediction(
  model: tf.LayersModel,
  inputData: number[],
  weights: number[],
  config: { lunarPhase: string; patterns: any }
): Promise<number[]> {
  systemLogger.log('prediction', 'Starting prediction with input data', {
    inputLength: inputData.length,
    timestamp: new Date().toISOString()
  });

  try {
    // Enrich input data with features
    const currentDate = new Date();
    const enrichedData = enrichTrainingData([[...inputData]], [currentDate]);
    
    if (!enrichedData || !enrichedData[0]) {
      throw new Error('Failed to enrich input data');
    }

    // Ensure correct shape with padding to match model's expected input
    const paddedData = new Array(13072).fill(0);
    for (let i = 0; i < enrichedData[0].length && i < 13072; i++) {
      paddedData[i] = enrichedData[0][i];
    }

    // Create tensor with correct shape [1, 13072]
    const inputTensor = tf.tensor2d([paddedData]);
    
    // Make prediction
    const predictions = model.predict(inputTensor) as tf.Tensor;
    const result = Array.from(await predictions.data());
    
    // Cleanup tensors
    inputTensor.dispose();
    predictions.dispose();

    // Convert raw predictions to valid lottery numbers (1-25)
    const validNumbers = result.map(value => {
      // Scale the value to be between 1 and 25
      return Math.max(1, Math.min(25, Math.round(value * 25)));
    });

    systemLogger.log('prediction', 'Prediction completed successfully', {
      resultLength: validNumbers.length,
      timestamp: new Date().toISOString()
    });

    return validNumbers;
  } catch (error) {
    systemLogger.error('prediction', 'Error in prediction', {
      error: error instanceof Error ? error.message : 'Unknown error',
      inputDataState: inputData.length,
      weightsState: weights.length,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

export const handlePlayerPredictions = async (
  players: Player[],
  trainedModel: tf.LayersModel,
  currentBoardNumbers: number[],
  nextConcurso: number,
  setNeuralNetworkVisualization: (viz: any) => void,
  lunarData: LunarData
) => {
  systemLogger.log('prediction', 'Starting predictions for all players', {
    playerCount: players.length,
    currentNumbers: currentBoardNumbers,
    concurso: nextConcurso,
    timestamp: new Date().toISOString()
  });

  return Promise.all(
    players.map(async player => {
      try {
        const prediction = await makePrediction(
          trainedModel, 
          currentBoardNumbers, 
          player.weights,
          { lunarPhase: lunarData.lunarPhase, patterns: lunarData.lunarPatterns }
        );

        // Additional analysis
        const timeSeriesAnalyzer = new TimeSeriesAnalysis([[...currentBoardNumbers]]);
        const arimaPredictor = timeSeriesAnalyzer.analyzeNumbers();
        
        // Record prediction for monitoring
        predictionMonitor.recordPrediction(prediction, currentBoardNumbers, arimaPredictor);

        systemLogger.log('prediction', `Prediction completed for Player #${player.id}`, {
          prediction: prediction.slice(0, 5),
          weights: player.weights.slice(0, 5),
          fitness: player.fitness,
          timestamp: new Date().toISOString()
        });

        return prediction;
      } catch (error) {
        systemLogger.error('prediction', `Error in prediction for Player #${player.id}`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          playerState: {
            id: player.id,
            weights: player.weights.length,
            fitness: player.fitness
          },
          timestamp: new Date().toISOString()
        });
        throw error;
      }
    })
  );
};