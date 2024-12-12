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

async function validateModelForPrediction(model: tf.LayersModel): Promise<boolean> {
  try {
    if (!model || !model.layers || model.layers.length === 0) {
      systemLogger.error('model', 'Invalid model or no layers');
      return false;
    }

    // Verify model has expected architecture
    const inputShape = model.inputs[0].shape;
    const outputShape = model.outputs[0].shape;

    if (!inputShape || inputShape[1] !== 13072) {
      systemLogger.error('model', 'Invalid input shape', { shape: inputShape });
      return false;
    }

    if (!outputShape || outputShape[1] !== 15) {
      systemLogger.error('model', 'Invalid output shape', { shape: outputShape });
      return false;
    }

    // Test prediction capability
    const testTensor = tf.zeros([1, 13072]);
    try {
      const testPrediction = model.predict(testTensor) as tf.Tensor;
      testPrediction.dispose();
      testTensor.dispose();
      return true;
    } catch (error) {
      systemLogger.error('model', 'Error testing prediction', { error });
      return false;
    }
  } catch (error) {
    systemLogger.error('model', 'Error validating model', { error });
    return false;
  }
}

async function makePrediction(
  model: tf.LayersModel,
  inputData: number[],
  weights: number[],
  config: { lunarPhase: string; patterns: any }
): Promise<number[]> {
  try {
    // Validate model before prediction
    const isModelValid = await validateModelForPrediction(model);
    if (!isModelValid) {
      throw new Error('Model not compiled or invalid');
    }

    const currentDate = new Date();
    const enrichedData = enrichTrainingData([[...inputData]], [currentDate]);
    
    if (!enrichedData || !enrichedData[0]) {
      throw new Error('Failed to enrich input data');
    }

    // Ensure correct format with padding
    const paddedData = new Array(13072).fill(0);
    for (let i = 0; i < enrichedData[0].length && i < 13072; i++) {
      paddedData[i] = enrichedData[0][i];
    }

    const inputTensor = tf.tensor2d([paddedData]);
    
    systemLogger.log('prediction', 'Input tensor created', {
      shape: inputTensor.shape,
      expectedShape: [1, 13072]
    });

    const predictions = model.predict(inputTensor) as tf.Tensor;
    const result = Array.from(await predictions.data());
    
    // Cleanup
    inputTensor.dispose();
    predictions.dispose();
    
    return result.map((n, i) => Math.round(n * weights[i % weights.length]));
  } catch (error) {
    systemLogger.error('prediction', 'Error in prediction', { error });
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
  systemLogger.log('game', '🎮 Starting predictions', {
    totalPlayers: players.length,
    concurso: nextConcurso,
    modelLoaded: !!trainedModel,
    modelConfig: trainedModel ? {
      layers: trainedModel.layers.length,
      hasWeights: trainedModel.getWeights().length > 0,
      inputShape: trainedModel.inputs[0].shape,
      outputShape: trainedModel.outputs[0].shape
    } : 'no model'
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

        const timeSeriesAnalyzer = new TimeSeriesAnalysis([[...currentBoardNumbers]]);
        const arimaPredictor = timeSeriesAnalyzer.analyzeNumbers();
        predictionMonitor.recordPrediction(prediction, currentBoardNumbers, arimaPredictor);

        return prediction;
      } catch (error) {
        systemLogger.error('player', `Error in Player #${player.id} prediction:`, { error });
        throw error;
      }
    })
  );
};