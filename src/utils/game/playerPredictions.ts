import * as tf from '@tensorflow/tfjs';
import { Player } from '@/types/gameTypes';
import { systemLogger } from '@/utils/logging/systemLogger';
import { enrichTrainingData } from '../features/lotteryFeatureEngineering';
import { LunarData } from './lunarAnalysis';

async function validateModelForPrediction(model: tf.LayersModel): Promise<boolean> {
  try {
    if (!model || !model.layers || model.layers.length === 0) {
      systemLogger.error('model', 'Modelo inválido ou sem camadas');
      return false;
    }

    const inputShape = model.inputs[0].shape;
    const outputShape = model.outputs[0].shape;

    if (!inputShape || inputShape[1] !== 13072) {
      systemLogger.error('model', 'Shape de entrada inválido', { shape: inputShape });
      return false;
    }

    if (!outputShape || outputShape[1] !== 15) {
      systemLogger.error('model', 'Shape de saída inválido', { shape: outputShape });
      return false;
    }

    const testTensor = tf.zeros([1, 13072]);
    try {
      const testPrediction = model.predict(testTensor) as tf.Tensor;
      testPrediction.dispose();
      testTensor.dispose();
      return true;
    } catch (error) {
      systemLogger.error('model', 'Erro ao testar previsão', { error });
      return false;
    }
  } catch (error) {
    systemLogger.error('model', 'Erro ao validar modelo', { error });
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
      throw new Error('Modelo não compilado ou inválido');
    }

    const currentDate = new Date();
    const enrichedData = enrichTrainingData([[...inputData]], [currentDate]);
    
    if (!enrichedData || !enrichedData[0]) {
      throw new Error('Falha ao enriquecer dados de entrada');
    }

    const paddedData = new Array(13072).fill(0);
    for (let i = 0; i < enrichedData[0].length && i < 13072; i++) {
      paddedData[i] = enrichedData[0][i];
    }
    
    const inputTensor = tf.tensor2d([paddedData]);
    
    systemLogger.log('prediction', 'Tensor de entrada criado', {
      shape: inputTensor.shape,
      expectedShape: [1, 13072]
    });

    const prediction = model.predict(inputTensor) as tf.Tensor;
    const result = Array.from(await prediction.data());
    
    inputTensor.dispose();
    prediction.dispose();

    const weightedNumbers = result.map((n, i) => n * (weights[i % weights.length] || 1));
    return ensureUniqueNumbers(weightedNumbers);
  } catch (error) {
    systemLogger.error('prediction', 'Erro na previsão', { error });
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
  systemLogger.log('game', '🎮 Iniciando predições', {
    totalPlayers: players.length,
    modelLoaded: !!trainedModel,
    lunarPhase: lunarData.currentPhase
  });

  if (!trainedModel) {
    throw new Error('Modelo não carregado');
  }

  setNeuralNetworkVisualization({
    layers: trainedModel.layers.map(layer => ({
      units: (layer as any).units || 0,
      activation: (layer as any).activation?.toString() || 'unknown'
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
        systemLogger.error('player', `Erro na previsão do Jogador #${player.id}:`, { error });
        throw error;
      }
    })
  );
}