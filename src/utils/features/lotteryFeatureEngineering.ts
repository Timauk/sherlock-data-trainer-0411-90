import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../logging/systemLogger';

interface LotteryFeatures {
  frequencyFeatures: number[];
  sequenceFeatures: number[];
  temporalFeatures: number[];
  statisticalFeatures: number[];
}

export const extractFeatures = (
  numbers: number[][],
  dates: Date[]
): LotteryFeatures => {
  const features = {
    frequencyFeatures: calculateFrequencyFeatures(numbers),
    sequenceFeatures: calculateSequenceFeatures(numbers),
    temporalFeatures: calculateTemporalFeatures(numbers, dates),
    statisticalFeatures: calculateStatisticalFeatures(numbers)
  };

  systemLogger.log('features', 'Features extracted', {
    frequencyLength: features.frequencyFeatures.length,
    sequenceLength: features.sequenceFeatures.length,
    temporalLength: features.temporalFeatures.length,
    statisticalLength: features.statisticalFeatures.length
  });

  return features;
};

const calculateFrequencyFeatures = (numbers: number[][]): number[] => {
  const frequency: { [key: number]: number } = {};
  const totalGames = numbers.length;
  const features = new Array(5000).fill(0); // Padding to match expected size

  numbers.flat().forEach(num => {
    frequency[num] = (frequency[num] || 0) + 1;
  });

  // Fill first portion with actual frequencies
  for (let i = 1; i <= 25; i++) {
    features[i-1] = (frequency[i] || 0) / (totalGames * 15);
  }

  return features;
};

const calculateSequenceFeatures = (numbers: number[][]): number[] => {
  const features = new Array(3000).fill(0); // Padding to match expected size
  
  numbers.forEach((game, idx) => {
    for (let i = 0; i < game.length - 1; i++) {
      if (game[i + 1] === game[i] + 1) {
        features[i] += 1;
      }
    }
  });

  return features.map(f => f / numbers.length);
};

const calculateTemporalFeatures = (numbers: number[][], dates: Date[]): number[] => {
  const features = new Array(2500).fill(0); // Padding to match expected size
  
  dates.forEach((date, idx) => {
    const dayOfWeek = date.getDay();
    features[dayOfWeek] += 1;
  });

  return features.map(f => f / dates.length);
};

const calculateStatisticalFeatures = (numbers: number[][]): number[] => {
  const features = new Array(2572).fill(0); // Padding to match total size needed
  
  numbers.forEach(game => {
    const mean = game.reduce((a, b) => a + b, 0) / game.length;
    const variance = game.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / game.length;
    
    features[0] = mean / 25;
    features[1] = Math.sqrt(variance) / 25;
  });

  return features;
};

export const enrichTrainingData = (
  numbers: number[][],
  dates: Date[]
): number[][] => {
  try {
    const features = extractFeatures(numbers, dates);
    
    // Combine all features to match expected 13072 size
    const enrichedFeatures = numbers.map(() => {
      const combined = [
        ...features.frequencyFeatures,    // 5000
        ...features.sequenceFeatures,     // 3000
        ...features.temporalFeatures,     // 2500
        ...features.statisticalFeatures   // 2572
      ];                                  // Total: 13072

      if (combined.length !== 13072) {
        throw new Error(`Feature length mismatch: expected 13072, got ${combined.length}`);
      }

      return combined;
    });

    systemLogger.log('features', 'Enriched data generated', {
      totalFeatures: enrichedFeatures[0].length,
      sampleStats: {
        min: Math.min(...enrichedFeatures[0]),
        max: Math.max(...enrichedFeatures[0]),
        mean: enrichedFeatures[0].reduce((a, b) => a + b) / enrichedFeatures[0].length
      }
    });

    return enrichedFeatures;
  } catch (error) {
    systemLogger.error('features', 'Error enriching data', { error });
    throw error;
  }
};