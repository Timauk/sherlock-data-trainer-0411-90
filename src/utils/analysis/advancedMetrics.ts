import { ModelMetrics } from '@/types/monitoring';

export interface DetailedMetrics {
  accuracy: number;
  reliability: number;
  coverage: number;
  confidence: number;
  temporalScore: number;
}

export const calculateDetailedMetrics = (
  predictions: number[][],
  actual: number[][],
  historicalData: number[][]
): DetailedMetrics => {
  const accuracy = calculateAccuracy(predictions, actual);
  const reliability = calculateReliability(predictions, actual);
  const coverage = calculateCoverage(predictions, historicalData);
  const confidence = calculateConfidence(predictions, actual);
  const temporalScore = calculateTemporalScore(predictions, historicalData);

  return {
    accuracy,
    reliability,
    coverage,
    confidence,
    temporalScore
  };
};

const calculateAccuracy = (predictions: number[][], actual: number[][]): number => {
  let totalMatches = 0;
  let totalNumbers = 0;

  predictions.forEach((pred, idx) => {
    const matches = pred.filter(num => actual[idx].includes(num)).length;
    totalMatches += matches;
    totalNumbers += pred.length;
  });

  return totalMatches / totalNumbers;
};

const calculateReliability = (predictions: number[][], actual: number[][]): number => {
  const consistencyScores = predictions.map((pred, idx) => {
    const matches = pred.filter(num => actual[idx].includes(num)).length;
    return matches >= 11 ? 1 : matches / 11;
  });

  return consistencyScores.reduce((acc, score) => acc + score, 0) / predictions.length;
};

const calculateCoverage = (predictions: number[][], historical: number[][]): number => {
  const allPredicted = new Set(predictions.flat());
  const allHistorical = new Set(historical.flat());
  
  return allPredicted.size / allHistorical.size;
};

const calculateConfidence = (predictions: number[][], actual: number[][]): number => {
  const confidenceScores = predictions.map((pred, idx) => {
    const matches = pred.filter(num => actual[idx].includes(num)).length;
    return Math.pow(matches / pred.length, 2);
  });

  return confidenceScores.reduce((acc, score) => acc + score, 0) / predictions.length;
};

const calculateTemporalScore = (predictions: number[][], historical: number[][]): number => {
  // Implementa análise temporal usando últimos N resultados
  const recentResults = historical.slice(-10);
  const recentAccuracy = calculateAccuracy([predictions[predictions.length - 1]], [recentResults[recentResults.length - 1]]);
  
  return recentAccuracy;
};