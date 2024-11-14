import { PredictionScore } from './types';

export const calculateFrequencyAnalysis = (numbers: number[][]): Record<number, number> => {
  const frequency: Record<number, number> = {};
  const totalGames = numbers.length;
  
  numbers.flat().forEach(num => {
    frequency[num] = (frequency[num] || 0) + 1;
  });
  
  Object.keys(frequency).forEach(key => {
    frequency[Number(key)] = frequency[Number(key)] / totalGames;
  });
  
  return frequency;
};

export const getLunarNumberWeight = (number: number, phase: string): number => {
  const phaseWeights: Record<string, number> = {
    'Nova': 0.8,
    'Crescente': 1.2,
    'Cheia': 1.0,
    'Minguante': 0.9
  };
  
  return phaseWeights[phase] || 1.0;
};

export const calculatePatternScore = (number: number, patterns: any): number => {
  if (!patterns) return 0;
  
  const { consecutive, evenOdd } = patterns;
  const isEven = number % 2 === 0;
  
  return (consecutive * 0.5) + (isEven ? evenOdd : (1 - evenOdd)) * 0.5;
};

export const calculateConsistencyScore = (number: number, patterns: any): number => {
  return 0.5;
};

export const calculateVariabilityScore = (number: number, patterns: any): number => {
  return 0.5;
};