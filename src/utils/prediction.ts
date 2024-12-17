import * as tf from '@tensorflow/tfjs';
import { Player } from '@/types/gameTypes';
import { systemLogger } from './logging/systemLogger';

export interface PredictionConfig {
  lunarPhase: string;
  patterns: any;
  lunarPatterns: any;
}

export const calculatePredictionConfidence = (
  prediction: number[],
  champion: Player | null | undefined,
  historicalData?: number[][]
): number => {
  if (!champion || !historicalData?.length) return 0;
  
  const matchCount = historicalData.reduce((count, numbers) => {
    const matches = prediction.filter(num => numbers.includes(num)).length;
    return count + (matches >= 11 ? 1 : 0);
  }, 0);
  
  return (matchCount / historicalData.length) * 100;
};

export const generatePredictions = async (
  champion: Player,
  trainedModel: tf.LayersModel,
  lastConcursoNumbers: number[],
  selectedNumbers: number[]
): Promise<any[]> => {
  try {
    const predictions = [];
    const batchSize = 8; // Generate 8 predictions

    for (let i = 0; i < batchSize; i++) {
      const inputTensor = tf.tensor2d([lastConcursoNumbers]);
      const prediction = trainedModel.predict(inputTensor) as tf.Tensor;
      const probabilities = Array.from(await prediction.data());
      
      // Convert probabilities to numbers 1-25
      const numbers = probabilities
        .map((prob, index) => ({ prob, num: index + 1 }))
        .sort((a, b) => b.prob - a.prob)
        .slice(0, 15)
        .map(item => item.num)
        .sort((a, b) => a - b);

      const matchesWithSelected = selectedNumbers.length > 0
        ? numbers.filter(n => selectedNumbers.includes(n)).length
        : 0;

      predictions.push({
        numbers,
        estimatedAccuracy: probabilities.reduce((sum, prob) => sum + prob, 0) / probabilities.length * 100,
        targetMatches: 11,
        matchesWithSelected,
        isGoodDecision: true
      });

      // Cleanup tensors
      inputTensor.dispose();
      prediction.dispose();
    }

    return predictions;
  } catch (error) {
    systemLogger.error('prediction', 'Error generating predictions', { error });
    throw error;
  }
};

export const temporalAccuracyTracker = {
  accuracyHistory: [] as { matches: number, total: number }[],
  
  recordAccuracy(matches: number, total: number) {
    this.accuracyHistory.push({ matches, total });
    if (this.accuracyHistory.length > 100) {
      this.accuracyHistory.shift();
    }
  },
  
  getAverageAccuracy() {
    if (this.accuracyHistory.length === 0) return 0;
    const sum = this.accuracyHistory.reduce((acc, curr) => acc + (curr.matches / curr.total), 0);
    return sum / this.accuracyHistory.length;
  }
};