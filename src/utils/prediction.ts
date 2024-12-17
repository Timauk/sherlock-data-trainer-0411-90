import * as tf from '@tensorflow/tfjs';
import { Player, ModelVisualization } from '@/types/gameTypes';
import { systemLogger } from './logging/systemLogger';

// Confidence Calculator
export const calculateConfidence = (
  predictions: number[],
  historicalAccuracy: number[]
): number => {
  const recentAccuracy = historicalAccuracy.slice(-10);
  const avgAccuracy = recentAccuracy.reduce((a, b) => a + b, 0) / recentAccuracy.length;
  const consistency = 1 - Math.sqrt(
    recentAccuracy.reduce((a, b) => a + Math.pow(b - avgAccuracy, 2), 0) / recentAccuracy.length
  );
  
  return (avgAccuracy * 0.7 + consistency * 0.3) * 100;
};

// Temporal Accuracy
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

    if (recentEntries.length === 0) return 0;

    return recentEntries.reduce((sum, entry) => sum + entry.accuracy, 0) / recentEntries.length;
  }

  getTrend(timeWindowMs: number = 3600000): 'improving' | 'declining' | 'stable' {
    const recentAccuracy = this.getRecentAccuracy(timeWindowMs);
    const previousAccuracy = this.getRecentAccuracy(timeWindowMs * 2) - recentAccuracy;

    if (Math.abs(recentAccuracy - previousAccuracy) < 0.05) return 'stable';
    return recentAccuracy > previousAccuracy ? 'improving' : 'declining';
  }
}

export const temporalAccuracyTracker = new TemporalAccuracyTracker();

// Prediction Generator
export const generatePredictions = async (
  champion: Player,
  trainedModel: tf.LayersModel,
  lastConcursoNumbers: number[],
  selectedNumbers: number[]
): Promise<any[]> => {
  try {
    if (!champion || !trainedModel || !lastConcursoNumbers) {
      throw new Error("Dados necessários não disponíveis");
    }

    const predictions = await makePrediction(
      trainedModel,
      lastConcursoNumbers,
      champion.weights,
      { lunarPhase: 'unknown', patterns: {} }
    );

    return [{
      numbers: predictions,
      confidence: calculateConfidence(predictions, [0.5]), // placeholder historical accuracy
      matchesWithSelected: predictions.filter(n => selectedNumbers.includes(n)).length
    }];

  } catch (error) {
    systemLogger.error('prediction', 'Erro na geração de previsões', { error });
    throw error;
  }
};

// Main Prediction Function
export async function makePrediction(
  model: tf.LayersModel,
  inputData: number[],
  weights: number[],
  config: { lunarPhase: string; patterns: any }
): Promise<number[]> {
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
}