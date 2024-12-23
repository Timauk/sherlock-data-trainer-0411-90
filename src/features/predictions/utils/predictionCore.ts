import * as tf from '@tensorflow/tfjs';
import { Player } from '@/types/gameTypes';
import { systemLogger } from '@/utils/logging/systemLogger';
import { PredictionResult } from '../types';
import { PLAYER_BASE_WEIGHTS } from '@/utils/constants';
import { calculateReward } from '@/utils/rewardSystem';

export const generatePredictions = async (
  champion: Player,
  trainedModel: tf.LayersModel,
  lastConcursoNumbers: number[],
  selectedNumbers: number[]
): Promise<PredictionResult[]> => {
  try {
    systemLogger.log('prediction', 'Iniciando geração de previsões', {
      hasChampion: !!champion,
      hasModel: !!trainedModel,
      inputNumbers: lastConcursoNumbers,
      timestamp: new Date().toISOString()
    });

    const inputTensor = tf.tensor2d([lastConcursoNumbers]);
    const prediction = trainedModel.predict(inputTensor) as tf.Tensor;
    const probabilities = Array.from(await prediction.data());
    
    const predictions = probabilities
      .map((prob, index) => ({
        number: index + 1,
        probability: prob * (champion.weights[index % champion.weights.length] || 1)
      }))
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 15)
      .map(p => p.number)
      .sort((a, b) => a - b);

    inputTensor.dispose();
    prediction.dispose();

    const matches = predictions.filter(n => selectedNumbers.includes(n)).length;
    const score = calculateReward(matches);

    systemLogger.log('prediction', 'Previsões geradas com sucesso', {
      predictions,
      matches,
      score,
      timestamp: new Date().toISOString()
    });

    return [{
      numbers: predictions,
      estimatedAccuracy: score / 100,
      targetMatches: 15,
      matchesWithSelected: matches,
      isGoodDecision: matches >= 8
    }];
  } catch (error) {
    systemLogger.error('prediction', 'Erro ao gerar previsões', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
};

export const generateDirectPredictions = async (
  model: tf.LayersModel,
  lastNumbers: number[]
): Promise<number[][]> => {
  try {
    systemLogger.log('prediction', 'Iniciando geração direta', {
      hasModel: !!model,
      inputNumbers: lastNumbers,
      timestamp: new Date().toISOString()
    });

    const predictions: number[][] = [];
    const inputTensor = tf.tensor2d([lastNumbers]);
    
    for (let i = 0; i < 10; i++) {
      const prediction = model.predict(inputTensor) as tf.Tensor;
      const probabilities = Array.from(await prediction.data());
      
      const numbers = probabilities
        .map((prob, index) => ({ number: index + 1, probability: prob }))
        .sort((a, b) => b.probability - a.probability)
        .slice(0, 15)
        .map(p => p.number)
        .sort((a, b) => a - b);
      
      predictions.push(numbers);
      prediction.dispose();
    }
    
    inputTensor.dispose();
    
    systemLogger.log('prediction', 'Previsões diretas geradas', {
      count: predictions.length,
      predictions,
      timestamp: new Date().toISOString()
    });
    
    return predictions;
  } catch (error) {
    systemLogger.error('prediction', 'Erro na geração direta', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
};