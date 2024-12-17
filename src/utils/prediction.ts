import * as tf from '@tensorflow/tfjs';
import { Player } from '@/types/gameTypes';
import { systemLogger } from './logging/systemLogger';

// Confidence Calculator
export const calculatePredictionConfidence = (
  predictions: number[],
  champion: Player | null | undefined,
  historicalData: number[][]
): number => {
  if (!predictions || !historicalData || historicalData.length === 0) {
    return 0;
  }

  const recentAccuracy = historicalData.slice(-10).map(numbers => 
    predictions.filter(p => numbers.includes(p)).length / predictions.length
  );
  
  const avgAccuracy = recentAccuracy.reduce((a, b) => a + b, 0) / recentAccuracy.length;
  const consistency = 1 - Math.sqrt(
    recentAccuracy.reduce((a, b) => a + Math.pow(b - avgAccuracy, 2), 0) / recentAccuracy.length
  );
  
  return (avgAccuracy * 0.7 + consistency * 0.3) * 100;
};

// Temporal Accuracy Tracker
class TemporalAccuracyTracker {
  private accuracyHistory: { timestamp: number; accuracy: number }[] = [];
  private readonly maxHistorySize = 1000;

  recordAccuracy(matches: number, total: number): void {
    const accuracy = matches / total;
    this.accuracyHistory.push({
      timestamp: Date.now(),
      accuracy
    });

    if (this.accuracyHistory.length > this.maxHistorySize) {
      this.accuracyHistory = this.accuracyHistory.slice(-this.maxHistorySize);
    }
  }

  getRecentAccuracy(timeWindowMs: number = 3600000): number {
    const cutoffTime = Date.now() - timeWindowMs;
    const recentEntries = this.accuracyHistory.filter(
      entry => entry.timestamp >= cutoffTime
    );
    return recentEntries.length === 0 ? 0 : 
      recentEntries.reduce((sum, entry) => sum + entry.accuracy, 0) / recentEntries.length;
  }
}

export const temporalAccuracyTracker = new TemporalAccuracyTracker();

// Feedback System
export const feedbackSystem = {
  analyzePrediction: (prediction: number[], actual: number[]) => {
    const matches = prediction.filter(n => actual.includes(n)).length;
    return {
      accuracy: matches / prediction.length,
      matches,
      total: prediction.length
    };
  }
};

// Main Prediction Function
export const makePrediction = async (
  model: tf.LayersModel,
  inputData: number[],
  weights: number[],
  config: { lunarPhase: string; patterns: any }
): Promise<number[]> => {
  try {
    const inputTensor = tf.tensor2d([inputData]);
    const rawPredictions = await model.predict(inputTensor) as tf.Tensor;
    const probabilities = Array.from(await rawPredictions.data());
    
    const weightedProbs = probabilities.map((prob, i) => ({
      number: i + 1,
      probability: prob * weights[i % weights.length]
    }));

    weightedProbs.sort((a, b) => b.probability - a.probability);

    const selectedNumbers = new Set<number>();
    let index = 0;
    
    while (selectedNumbers.size < 15 && index < weightedProbs.length) {
      const num = weightedProbs[index].number;
      if (num >= 1 && num <= 25) {
        selectedNumbers.add(num);
      }
      index++;
    }

    const result = Array.from(selectedNumbers).sort((a, b) => a - b);

    inputTensor.dispose();
    rawPredictions.dispose();

    return result;
  } catch (error) {
    systemLogger.error('prediction', 'Error making prediction', { error });
    throw error;
  }
};

// Alias for backward compatibility
export const calculateConfidence = calculatePredictionConfidence;
export const calculateConfidenceScore = calculatePredictionConfidence;