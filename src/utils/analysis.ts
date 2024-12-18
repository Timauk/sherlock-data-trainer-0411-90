import * as tf from '@tensorflow/tfjs';
import { systemLogger } from './logging/systemLogger';

// Noise Reduction
export interface NoiseReductionResult {
  cleanedData: number[][];
  noiseLevel: number;
  confidence: number;
}

export const reduceNoise = (numbers: number[][]): NoiseReductionResult => {
  const movingAverageWindow = 5;
  const cleanedData: number[][] = [];
  let totalNoise = 0;

  for (let i = 0; i < numbers.length; i++) {
    const windowStart = Math.max(0, i - Math.floor(movingAverageWindow / 2));
    const windowEnd = Math.min(numbers.length, i + Math.floor(movingAverageWindow / 2) + 1);
    const window = numbers.slice(windowStart, windowEnd);

    const frequencies: { [key: number]: number } = {};
    window.flat().forEach(num => {
      frequencies[num] = (frequencies[num] || 0) + 1;
    });

    const smoothedGame = numbers[i].map(num => {
      const freq = frequencies[num] || 0;
      const noise = 1 - (freq / window.length);
      totalNoise += noise;
      return num;
    });

    cleanedData.push(smoothedGame);
  }

  const averageNoise = totalNoise / (numbers.length * numbers[0].length);
  const confidence = 1 - averageNoise;

  return {
    cleanedData,
    noiseLevel: averageNoise,
    confidence
  };
};

// Outlier Detection
export interface OutlierAnalysis {
  outliers: number[];
  scores: number[];
  threshold: number;
}

export const detectOutliers = (numbers: number[][]): OutlierAnalysis => {
  const flattened = numbers.flat();
  const mean = flattened.reduce((a, b) => a + b, 0) / flattened.length;
  const stdDev = Math.sqrt(
    flattened.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / flattened.length
  );

  const scores = flattened.map(num => Math.abs((num - mean) / stdDev));
  const threshold = 2.5;

  const outliers = flattened.filter((_, index) => scores[index] > threshold);

  return {
    outliers,
    scores,
    threshold
  };
};

// Time Series Analysis
export class TimeSeriesAnalysis {
  private data: number[][];

  constructor(data: number[][]) {
    this.data = data;
  }

  public analyzeNumbers(): number[] {
    const flattened = this.data.flat();
    const frequencies = new Map<number, number>();
    
    flattened.forEach(num => {
      frequencies.set(num, (frequencies.get(num) || 0) + 1);
    });

    return Array.from(frequencies.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([num]) => num);
  }

  public getPatterns(): { [key: string]: number } {
    const patterns: { [key: string]: number } = {};
    
    for (let i = 1; i < this.data.length; i++) {
      const prev = this.data[i - 1];
      const curr = this.data[i];
      
      const repeatedNumbers = prev.filter(n => curr.includes(n)).length;
      patterns[`repeat_${repeatedNumbers}`] = (patterns[`repeat_${repeatedNumbers}`] || 0) + 1;
    }

    return patterns;
  }
}

// Statistical Analysis
export const calculateStatistics = (numbers: number[][]) => {
  const flattened = numbers.flat();
  const mean = flattened.reduce((a, b) => a + b, 0) / flattened.length;
  const variance = flattened.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / flattened.length;
  const stdDev = Math.sqrt(variance);

  return {
    mean,
    variance,
    stdDev,
    min: Math.min(...flattened),
    max: Math.max(...flattened)
  };
};

// Pattern Recognition
export const findPatterns = (numbers: number[][]): { [key: string]: number } => {
  const patterns: { [key: string]: number } = {};

  numbers.forEach(game => {
    // Sequências consecutivas
    let consecutiveCount = 1;
    for (let i = 1; i < game.length; i++) {
      if (game[i] === game[i - 1] + 1) consecutiveCount++;
      else {
        if (consecutiveCount > 1) {
          patterns[`consecutive_${consecutiveCount}`] = 
            (patterns[`consecutive_${consecutiveCount}`] || 0) + 1;
        }
        consecutiveCount = 1;
      }
    }

    // Números pares/ímpares
    const evenCount = game.filter(n => n % 2 === 0).length;
    patterns[`even_${evenCount}`] = (patterns[`even_${evenCount}`] || 0) + 1;
  });

  return patterns;
};

// Feature Importance
export const calculateFeatureImportance = async (
  model: tf.LayersModel,
  inputData: number[][],
  outputData: number[][]
): Promise<number[]> => {
  const baselineLoss = await evaluateModel(model, inputData, outputData);
  const importance: number[] = [];

  for (let feature = 0; feature < inputData[0].length; feature++) {
    const perturbedData = inputData.map(row => {
      const newRow = [...row];
      newRow[feature] = 0; // Zeroing out the feature
      return newRow;
    });

    const perturbedLoss = await evaluateModel(model, perturbedData, outputData);
    importance.push(Math.abs(perturbedLoss - baselineLoss));
  }

  return importance;
};

async function evaluateModel(
  model: tf.LayersModel,
  inputData: number[][],
  outputData: number[][]
): Promise<number> {
  const xs = tf.tensor2d(inputData);
  const ys = tf.tensor2d(outputData);

  const result = await model.evaluate(xs, ys) as tf.Tensor;
  const loss = (await result.data())[0];

  xs.dispose();
  ys.dispose();
  result.dispose();

  return loss;
}