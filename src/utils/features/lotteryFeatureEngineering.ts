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

  systemLogger.log('features', 'Features extraídas', {
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

  numbers.flat().forEach(num => {
    frequency[num] = (frequency[num] || 0) + 1;
  });

  // Normalização min-max para frequências
  const frequencies = Array.from({ length: 25 }, (_, i) => {
    const num = i + 1;
    return (frequency[num] || 0) / (totalGames * 15); // Normaliza pelo máximo possível
  });

  systemLogger.log('features', 'Frequências calculadas', {
    min: Math.min(...frequencies),
    max: Math.max(...frequencies),
    mean: frequencies.reduce((a, b) => a + b) / frequencies.length
  });

  return frequencies;
};

const calculateSequenceFeatures = (numbers: number[][]): number[] => {
  const features: number[] = [];
  
  // Análise de números consecutivos
  const consecutiveRatios = numbers.map(game => {
    let consecutiveCount = 0;
    for (let i = 1; i < game.length; i++) {
      if (game[i] === game[i-1] + 1) consecutiveCount++;
    }
    return consecutiveCount / (game.length - 1);
  });

  // Proporção par/ímpar normalizada
  const evenOddRatios = numbers.map(game => {
    const evenCount = game.filter(n => n % 2 === 0).length;
    return evenCount / game.length;
  });

  features.push(
    ...normalizeArray(consecutiveRatios),
    ...normalizeArray(evenOddRatios)
  );

  systemLogger.log('features', 'Sequências calculadas', {
    consecutiveStats: {
      min: Math.min(...consecutiveRatios),
      max: Math.max(...consecutiveRatios)
    },
    evenOddStats: {
      min: Math.min(...evenOddRatios),
      max: Math.max(...evenOddRatios)
    }
  });

  return features;
};

const calculateTemporalFeatures = (numbers: number[][], dates: Date[]): number[] => {
  const features: number[] = [];
  
  // Distribuição por dia da semana
  const weekdayDistribution = Array(7).fill(0);
  
  dates.forEach((date, idx) => {
    weekdayDistribution[date.getDay()]++;
  });

  // Normalização das features temporais
  const normalizedWeekday = normalizeArray(weekdayDistribution);
  features.push(...normalizedWeekday);

  systemLogger.log('features', 'Features temporais', {
    weekdayStats: {
      min: Math.min(...normalizedWeekday),
      max: Math.max(...normalizedWeekday)
    }
  });

  return features;
};

const calculateStatisticalFeatures = (numbers: number[][]): number[] => {
  const features: number[] = [];
  
  // Média e desvio padrão dos números
  const stats = numbers.map(game => {
    const mean = game.reduce((a, b) => a + b, 0) / game.length;
    const variance = game.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / game.length;
    return {
      mean: mean / 25, // Normaliza pela maior possível
      stdDev: Math.sqrt(variance) / Math.sqrt(625) // Normaliza pelo máximo possível
    };
  });

  features.push(
    ...normalizeArray(stats.map(s => s.mean)),
    ...normalizeArray(stats.map(s => s.stdDev))
  );

  systemLogger.log('features', 'Features estatísticas', {
    meanStats: {
      min: Math.min(...stats.map(s => s.mean)),
      max: Math.max(...stats.map(s => s.mean))
    },
    stdDevStats: {
      min: Math.min(...stats.map(s => s.stdDev)),
      max: Math.max(...stats.map(s => s.stdDev))
    }
  });

  return features;
};

const normalizeArray = (arr: number[]): number[] => {
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const range = max - min || 1;
  return arr.map(val => (val - min) / range);
};

export const enrichTrainingData = (
  numbers: number[][],
  dates: Date[]
): number[][] => {
  const features = extractFeatures(numbers, dates);
  
  // Combina todas as características
  const enrichedFeatures = [
    ...features.frequencyFeatures,
    ...features.sequenceFeatures,
    ...features.temporalFeatures,
    ...features.statisticalFeatures
  ];

  systemLogger.log('features', 'Dados enriquecidos gerados', {
    totalFeatures: enrichedFeatures.length,
    sampleStats: {
      min: Math.min(...enrichedFeatures),
      max: Math.max(...enrichedFeatures),
      mean: enrichedFeatures.reduce((a, b) => a + b) / enrichedFeatures.length
    }
  });

  // Retorna os dados originais enriquecidos com as novas características
  return numbers.map(game => [...game, ...enrichedFeatures]);
};