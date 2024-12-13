import * as tf from '@tensorflow/tfjs';
import { Player } from '@/types/gameTypes';
import { systemLogger } from '@/utils/logging/systemLogger';
import { enrichTrainingData } from '../features/lotteryFeatureEngineering';

export interface LunarData {
  currentPhase: string;
  patterns: Record<string, any>;
}

async function validateModelForPrediction(model: tf.LayersModel): Promise<boolean> {
  try {
    if (!model || !model.layers || model.layers.length === 0) {
      systemLogger.error('model', 'Invalid model or no layers');
      return false;
    }

    // Ensure model is compiled
    if (!model.optimizer) {
      systemLogger.error('model', 'Model not compiled');
      model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });
    }

    // Test prediction with dummy data
    const testTensor = tf.zeros([1, 13057]); // Updated to match expected shape
    try {
      const testPred = model.predict(testTensor) as tf.Tensor;
      testPred.dispose();
      testTensor.dispose();
      return true;
    } catch (error) {
      systemLogger.error('model', 'Model prediction test failed', { error });
      return false;
    }
  } catch (error) {
    systemLogger.error('model', 'Model validation failed', { error });
    return false;
  }
}

function ensureUniqueNumbers(numbers: number[]): number[] {
  const uniqueNumbers = new Set<number>();
  const result: number[] = [];
  
  for (let num of numbers) {
    num = Math.max(1, Math.min(25, Math.round(num)));
    while (uniqueNumbers.has(num)) {
      num = num % 25 + 1;
    }
    uniqueNumbers.add(num);
    result.push(num);
  }
  
  return result;
}

async function makePrediction(
  model: tf.LayersModel,
  inputData: number[],
  weights: number[],
  config: { lunarPhase: string; patterns: any }
): Promise<number[]> {
  try {
    const isModelValid = await validateModelForPrediction(model);
    if (!isModelValid) {
      throw new Error('Model not compiled or invalid');
    }

    const currentDate = new Date();
    const enrichedData = enrichTrainingData([[...inputData]], [currentDate]);
    
    if (!enrichedData || !enrichedData[0]) {
      throw new Error('Failed to enrich input data');
    }

    // Ensure correct shape with padding
    const paddedData = new Array(13057).fill(0); // Updated to match expected shape
    for (let i = 0; i < enrichedData[0].length && i < 13057; i++) {
      paddedData[i] = enrichedData[0][i];
    }
    
    const inputTensor = tf.tensor2d([paddedData]);
    
    systemLogger.log('prediction', 'Creating prediction tensor', {
      shape: inputTensor.shape,
      expectedShape: [1, 13057]
    });

    const prediction = model.predict(inputTensor) as tf.Tensor;
    const result = Array.from(await prediction.data());
    
    inputTensor.dispose();
    prediction.dispose();

    const weightedNumbers = result.map((n, i) => n * (weights[i % weights.length] || 1));
    return ensureUniqueNumbers(weightedNumbers);
  } catch (error) {
    systemLogger.error('prediction', 'Error making prediction', { error });
    throw error;
  }
}

export async function handlePlayerPredictions(
  players: Player[],
  trainedModel: tf.LayersModel,
  currentBoardNumbers: number[],
  setNeuralNetworkVisualization: (viz: any) => void,
  lunarData: LunarData
) {
  systemLogger.log('game', '🎮 Starting predictions', {
    totalPlayers: players.length,
    modelLoaded: !!trainedModel,
    lunarPhase: lunarData.currentPhase
  });

  if (!trainedModel) {
    throw new Error('Model not loaded');
  }

  const isModelValid = await validateModelForPrediction(trainedModel);
  if (!isModelValid) {
    throw new Error('Model validation failed');
  }

  setNeuralNetworkVisualization({
    layers: trainedModel.layers.map(layer => ({
      units: (layer.getConfig() as any).units || 0,
      activation: (layer.getConfig() as any).activation?.toString() || 'unknown'
    })),
    weights: players[0]?.weights || []
  });

  return Promise.all(
    players.map(async (player) => {
      try {
        const prediction = await makePrediction(
          trainedModel,
          currentBoardNumbers,
          player.weights,
          {
            lunarPhase: lunarData.currentPhase,
            patterns: lunarData.patterns
          }
        );
        
        return prediction;
      } catch (error) {
        systemLogger.error('player', `Error in prediction for Player #${player.id}:`, { error });
        throw error;
      }
    })
  );
}