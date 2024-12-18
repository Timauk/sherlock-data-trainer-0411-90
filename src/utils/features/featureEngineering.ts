import { getLunarPhase } from '../lunarCalculations';
import { systemLogger } from '../logging/systemLogger';

interface FeatureSet {
  baseFeatures: number[];
  temporalFeatures: number[];
  lunarFeatures: number[];
  statisticalFeatures: number[];
}

export const extractFeatures = (
  numbers: number[],
  date: Date,
  historicalData: number[][]
): FeatureSet => {
  try {
    // Base features (números originais normalizados)
    const baseFeatures = numbers.map(n => n / 25);

    // Features temporais
    const temporalFeatures = extractTemporalFeatures(date);

    // Features lunares
    const lunarFeatures = extractLunarFeatures(date, historicalData);

    // Features estatísticas
    const statisticalFeatures = extractStatisticalFeatures(numbers, historicalData);

    return {
      baseFeatures,
      temporalFeatures,
      lunarFeatures,
      statisticalFeatures
    };
  } catch (error) {
    systemLogger.error('features', 'Erro na extração de features', { error });
    throw error;
  }
};

const extractTemporalFeatures = (date: Date): number[] => {
  const dayOfWeek = date.getDay() / 7;
  const month = date.getMonth() / 12;
  const dayOfMonth = date.getDate() / 31;
  const hour = date.getHours() / 24;
  
  return [dayOfWeek, month, dayOfMonth, hour];
};

const extractLunarFeatures = (date: Date, historicalData: number[][]): number[] => {
  const lunarPhase = getLunarPhase(date);
  const phaseMapping = {
    'Nova': 0,
    'Crescente': 0.25,
    'Cheia': 0.5,
    'Minguante': 0.75
  };

  return [phaseMapping[lunarPhase as keyof typeof phaseMapping]];
};

const extractStatisticalFeatures = (numbers: number[], historicalData: number[][]): number[] => {
  const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  const std = Math.sqrt(
    numbers.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numbers.length
  );
  
  return [mean / 25, std / 25];
};