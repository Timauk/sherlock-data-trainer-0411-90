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
  },
  getConfidenceCorrelation: () => {
    // Implementation of confidence correlation calculation
    return 0.75; // Placeholder value
  },
  getAccuracyTrend: () => {
    // Implementation of accuracy trend calculation
    return [0.65, 0.70, 0.75, 0.80]; // Placeholder values
  }
};

// Generate Predictions Function
export const generatePredictions = async (
  champion: Player,
  model: tf.LayersModel,
  lastNumbers: number[],
  selectedNumbers: number[] = []
): Promise<Array<{
  numbers: number[];
  estimatedAccuracy: number;
  targetMatches: number;
  matchesWithSelected: number;
  isGoodDecision: boolean;
}>> => {
  try {
    const predictions = [];
    for (let i = 0; i < 8; i++) {
      const inputTensor = tf.tensor2d([lastNumbers]);
      const rawPrediction = await model.predict(inputTensor) as tf.Tensor;
      const probabilities = Array.from(await rawPrediction.data());
      
      // Get top 15 numbers based on probabilities
      const numbers = probabilities
        .map((prob, index) => ({ prob, num: index + 1 }))
        .sort((a, b) => b.prob - a.prob)
        .slice(0, 15)
        .map(item => item.num)
        .sort((a, b) => a - b);

      const estimatedAccuracy = probabilities.reduce((sum, prob) => sum + prob, 0) / probabilities.length * 100;
      const targetMatches = Math.floor(estimatedAccuracy / 10);
      const matchesWithSelected = selectedNumbers.length > 0 
        ? numbers.filter(n => selectedNumbers.includes(n)).length 
        : 0;
      const isGoodDecision = estimatedAccuracy > 60;

      predictions.push({
        numbers,
        estimatedAccuracy,
        targetMatches,
        matchesWithSelected,
        isGoodDecision
      });

      // Cleanup
      inputTensor.dispose();
      rawPrediction.dispose();
    }

    return predictions;
  } catch (error) {
    systemLogger.error('prediction', 'Error generating predictions', { error });
    throw error;
  }
};

// Alias for backward compatibility
export const calculateConfidence = calculatePredictionConfidence;
export const calculateConfidenceScore = calculatePredictionConfidence;