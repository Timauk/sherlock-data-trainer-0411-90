import * as tf from '@tensorflow/tfjs';
import { Player } from '@/types/gameTypes';
import { systemLogger } from '@/utils/logging/systemLogger';
import { DataServices } from '@/services/dataServices';
import { PredictionResult } from '../features/predictions/types';

export const generatePredictions = async (
  champion: Player,
  trainedModel: tf.LayersModel,
  lastConcursoNumbers: number[],
  selectedNumbers: number[]
): Promise<PredictionResult[]> => {
  try {
    const inputTensor = tf.tensor2d([lastConcursoNumbers]);
    const prediction = trainedModel.predict(inputTensor) as tf.Tensor;
    const probabilities = Array.from(await prediction.data());
    
    const predictions = probabilities
      .map((prob, index) => ({
        number: index + 1,
        probability: prob * (champion.weights[index] || 1)
      }))
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 15)
      .map(p => p.number)
      .sort((a, b) => a - b);

    inputTensor.dispose();
    prediction.dispose();

    return [{
      numbers: predictions,
      estimatedAccuracy: 0.75,
      targetMatches: 15,
      matchesWithSelected: predictions.filter(n => selectedNumbers.includes(n)).length,
      isGoodDecision: true
    }];
  } catch (error) {
    systemLogger.error('prediction', 'Erro ao gerar previsões', { error });
    throw error;
  }
};

export const generateDirectPredictions = async (
  model: tf.LayersModel,
  lastNumbers: number[]
): Promise<number[][]> => {
  const predictions: number[][] = [];
  const currentDate = new Date();
  const enrichedData = DataServices.enrichLotteryData([[...lastNumbers]], [currentDate]);
  
  for (let i = 0; i < 10; i++) {
    const inputTensor = tf.tensor2d(enrichedData);
    const prediction = model.predict(inputTensor) as tf.Tensor;
    const probabilities = Array.from(await prediction.data());
    
    const numbers = probabilities
      .map((prob, index) => ({ number: index + 1, probability: prob }))
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 15)
      .map(p => p.number)
      .sort((a, b) => a - b);
    
    predictions.push(numbers);
    
    inputTensor.dispose();
    prediction.dispose();
  }
  
  return predictions;
};