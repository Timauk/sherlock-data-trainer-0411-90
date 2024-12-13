import * as tf from '@tensorflow/tfjs';
import { Player } from '@/types/gameTypes';
import { systemLogger } from '../logging/systemLogger';
import { enrichTrainingData } from '../features/lotteryFeatureEngineering';
import { LunarData } from './lunarAnalysis';

async function validateModelForPrediction(model: tf.LayersModel): Promise<boolean> {
  try {
    if (!model || !model.layers || model.layers.length === 0) {
      systemLogger.error('model', 'Invalid model or no layers');
      return false;
    }

    if (!model.optimizer) {
      systemLogger.error('model', 'Model not compiled');
      model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });
    }

    // Test with correct input shape
    const testTensor = tf.zeros([1, 13072]);
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

async function makePrediction(
  model: tf.LayersModel,
  inputData: number[],
  weights: number[],
  config: { phase: string; patterns: Record<string, number[]> }
): Promise<number[]> {
  try {
    const currentDate = new Date();
    const enrichedData = enrichTrainingData([[...inputData]], [currentDate]);
    
    if (!enrichedData || !enrichedData[0]) {
      throw new Error('Failed to enrich input data');
    }

    // Ensure correct padding to 13072 features
    const paddedData = new Array(13072).fill(0);
    for (let i = 0; i < enrichedData[0].length && i < 13072; i++) {
      paddedData[i] = enrichedData[0][i];
    }
    
    const inputTensor = tf.tensor2d([paddedData]);
    
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
  
  while (result.length < 15) {
    let num = Math.floor(Math.random() * 25) + 1;
    while (uniqueNumbers.has(num)) {
      num = num % 25 + 1;
    }
    uniqueNumbers.add(num);
    result.push(num);
  }
  
  return result.slice(0, 15).sort((a, b) => a - b);
}

export async function handlePlayerPredictions(
  players: Player[],
  trainedModel: tf.LayersModel,
  currentBoardNumbers: number[],
  setNeuralNetworkVisualization: (viz: any) => void,
  lunarData: LunarData
) {
  systemLogger.log('game', 'Starting predictions', {
    totalPlayers: players.length,
    modelLoaded: !!trainedModel,
    lunarPhase: lunarData.phase
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
            phase: lunarData.phase,
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