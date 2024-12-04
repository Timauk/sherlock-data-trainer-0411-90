import { Player } from '@/types/gameTypes';

export interface ValidationMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
}

export const performCrossValidation = (
  predictions: number[][],
  actualResults: number[][],
  minSamples: number = 10
): ValidationMetrics[] => {
  const foldSize = Math.floor(predictions.length / minSamples);
  const metrics: ValidationMetrics[] = [];

  for (let i = 0; i < minSamples; i++) {
    const testStart = i * foldSize;
    const testEnd = testStart + foldSize;
    
    const testPredictions = predictions.slice(testStart, testEnd);
    const testActual = actualResults.slice(testStart, testEnd);
    
    metrics.push(calculateMetrics(testPredictions, testActual));
  }

  return metrics;
};

const calculateMetrics = (predictions: number[][], actual: number[][]): ValidationMetrics => {
  let truePositives = 0;
  let falsePositives = 0;
  let falseNegatives = 0;
  
  predictions.forEach((pred, idx) => {
    const actualSet = new Set(actual[idx]);
    pred.forEach(num => {
      if (actualSet.has(num)) {
        truePositives++;
      } else {
        falsePositives++;
      }
    });
    actual[idx].forEach(num => {
      if (!pred.includes(num)) {
        falseNegatives++;
      }
    });
  });

  const precision = truePositives / (truePositives + falsePositives);
  const recall = truePositives / (truePositives + falseNegatives);
  const accuracy = truePositives / (truePositives + falsePositives + falseNegatives);
  const f1Score = 2 * (precision * recall) / (precision + recall);

  return {
    accuracy,
    precision,
    recall,
    f1Score
  };
};