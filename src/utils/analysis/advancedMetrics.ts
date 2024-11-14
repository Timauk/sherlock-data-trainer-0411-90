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
  // Ensure all inputs are valid arrays
  if (!Array.isArray(predictions) || !Array.isArray(actual) || !Array.isArray(historicalData)) {
    return {
      accuracy: 0,
      reliability: 0,
      coverage: 0,
      confidence: 0,
      temporalScore: 0
    };
  }

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
  if (!predictions.length || !actual.length) return 0;
  
  let totalMatches = 0;
  let totalNumbers = 0;

  predictions.forEach((pred, idx) => {
    if (!Array.isArray(pred) || !Array.isArray(actual[idx])) return;
    
    const matches = pred.filter(num => actual[idx]?.includes(num)).length;
    totalMatches += matches;
    totalNumbers += pred.length;
  });

  return totalNumbers > 0 ? totalMatches / totalNumbers : 0;
};

const calculateReliability = (predictions: number[][], actual: number[][]): number => {
  if (!predictions.length || !actual.length) return 0;
  
  const consistencyScores = predictions.map((pred, idx) => {
    if (!Array.isArray(pred) || !Array.isArray(actual[idx])) return 0;
    
    const matches = pred.filter(num => actual[idx]?.includes(num)).length;
    return matches >= 11 ? 1 : matches / 11;
  });

  return consistencyScores.reduce((acc, score) => acc + score, 0) / predictions.length;
};

const calculateCoverage = (predictions: number[][], historical: number[][]): number => {
  if (!predictions.length || !historical.length) return 0;
  
  const allPredicted = new Set(predictions.flat().filter(Boolean));
  const allHistorical = new Set(historical.flat().filter(Boolean));
  
  return allHistorical.size > 0 ? allPredicted.size / allHistorical.size : 0;
};

const calculateConfidence = (predictions: number[][], actual: number[][]): number => {
  if (!predictions.length || !actual.length) return 0;
  
  const confidenceScores = predictions.map((pred, idx) => {
    if (!Array.isArray(pred) || !Array.isArray(actual[idx])) return 0;
    
    const matches = pred.filter(num => actual[idx]?.includes(num)).length;
    return Math.pow(matches / pred.length, 2);
  });

  return confidenceScores.reduce((acc, score) => acc + score, 0) / predictions.length;
};

const calculateTemporalScore = (predictions: number[][], historical: number[][]): number => {
  if (!predictions.length || !historical.length) return 0;
  
  const recentResults = historical.slice(-10);
  if (!recentResults.length) return 0;
  
  const lastPrediction = predictions[predictions.length - 1];
  const lastActual = recentResults[recentResults.length - 1];
  
  if (!Array.isArray(lastPrediction) || !Array.isArray(lastActual)) return 0;
  
  return calculateAccuracy([lastPrediction], [lastActual]);
};