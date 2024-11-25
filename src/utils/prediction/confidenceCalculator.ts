import { Player } from '@/types/gameTypes';

interface ConfidenceFactors {
  historicalAccuracy: number;
  patternStrength: number;
  championScore: number;
  predictionStability: number;
}

export const calculatePredictionConfidence = (
  prediction: number[],
  champion: Player | null,
  historicalData: number[][]
): number => {
  const factors = calculateConfidenceFactors(prediction, champion, historicalData);
  
  // Weighted average of all factors
  return (
    factors.historicalAccuracy * 0.4 +
    factors.patternStrength * 0.3 +
    factors.championScore * 0.2 +
    factors.predictionStability * 0.1
  ) * 100; // Convert to percentage
};

const calculateConfidenceFactors = (
  prediction: number[],
  champion: Player | null,
  historicalData: number[][]
): ConfidenceFactors => {
  // Historical accuracy based on champion's performance
  const historicalAccuracy = champion?.fitness || 0.5;

  // Pattern strength based on number frequency
  const patternStrength = calculatePatternStrength(prediction, historicalData);

  // Champion score normalized
  const championScore = champion ? 
    Math.min(champion.score / 1000, 1) : 0.5;

  // Prediction stability based on number distribution
  const predictionStability = calculatePredictionStability(prediction);

  return {
    historicalAccuracy,
    patternStrength,
    championScore,
    predictionStability
  };
};

const calculatePatternStrength = (
  prediction: number[],
  historicalData: number[][]
): number => {
  if (!historicalData.length) return 0.5;
  
  // Calculate frequency of each number in historical data
  const frequency = new Map<number, number>();
  historicalData.forEach(numbers => {
    numbers.forEach(num => {
      frequency.set(num, (frequency.get(num) || 0) + 1);
    });
  });

  // Calculate average frequency of predicted numbers
  const avgFrequency = prediction.reduce((sum, num) => {
    return sum + (frequency.get(num) || 0);
  }, 0) / prediction.length;

  // Normalize to 0-1 range
  return Math.min(avgFrequency / historicalData.length, 1);
};

const calculatePredictionStability = (prediction: number[]): number => {
  // Check number distribution
  const evenCount = prediction.filter(n => n % 2 === 0).length;
  const oddCount = prediction.length - evenCount;
  
  // Perfect balance would be 50/50
  const balance = 1 - Math.abs(evenCount - oddCount) / prediction.length;
  
  return balance;
};