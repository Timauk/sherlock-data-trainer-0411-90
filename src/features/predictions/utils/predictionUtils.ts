import * as tf from '@tensorflow/tfjs';
import { Player } from '@/types/gameTypes';
import { systemLogger } from '@/utils/logging/systemLogger';
import { generateCorePredictions } from './predictionCore';
import { PredictionResult } from '../types';

export const generatePredictions = async (
  champion: Player,
  trainedModel: tf.LayersModel,
  lastConcursoNumbers: number[],
  selectedNumbers: number[]
): Promise<PredictionResult[]> => {
  try {
    systemLogger.log('prediction', 'Starting prediction generation', {
      hasChampion: !!champion,
      hasModel: !!trainedModel,
      inputNumbers: lastConcursoNumbers
    });

    // Generate base predictions
    const probabilities = await generateCorePredictions(trainedModel, lastConcursoNumbers);
    
    // Apply champion weights
    const weightedPredictions = probabilities.map((prob, index) => ({
      number: index + 1,
      probability: prob * (champion.weights[index % champion.weights.length] || 1)
    }));

    // Select top 15 numbers
    const predictions = weightedPredictions
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 15)
      .map(p => p.number)
      .sort((a, b) => a - b);

    const matches = selectedNumbers.length > 0 
      ? predictions.filter(n => selectedNumbers.includes(n)).length 
      : 0;

    return [{
      numbers: predictions,
      estimatedAccuracy: 0.75,
      targetMatches: 15,
      matchesWithSelected: matches,
      isGoodDecision: matches >= 8
    }];
  } catch (error) {
    systemLogger.error('prediction', 'Error generating predictions', { error });
    throw error;
  }
};

export const generateDirectPredictions = async (
  model: tf.LayersModel,
  lastNumbers: number[]
): Promise<number[][]> => {
  try {
    const predictions: number[][] = [];
    
    for (let i = 0; i < 10; i++) {
      const probabilities = await generateCorePredictions(model, lastNumbers);
      
      const numbers = probabilities
        .map((prob, index) => ({ number: index + 1, probability: prob }))
        .sort((a, b) => b.probability - a.probability)
        .slice(0, 15)
        .map(p => p.number)
        .sort((a, b) => a - b);
      
      predictions.push(numbers);
    }
    
    return predictions;
  } catch (error) {
    systemLogger.error('prediction', 'Error in direct predictions', { error });
    throw error;
  }
};