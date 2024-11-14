import * as tf from '@tensorflow/tfjs';
import { ModelVisualization } from '../types/gameTypes';
import { analyzeAdvancedPatterns, enrichPredictionData } from './advancedDataAnalysis';
import { getLunarPhase, analyzeLunarPatterns } from './lunarCalculations';
import { TimeSeriesAnalysis } from './analysis/timeSeriesAnalysis';
import { performanceMonitor } from './performance/performanceMonitor';
import { PredictionScore, LunarData } from './prediction/types';
import { advancedAnalysis } from './analysis/advancedAnalysis';
import { createSpecializedModels } from './specializedModels/superSpecialized';

const specializedModels = createSpecializedModels();

export async function makePrediction(
  trainedModel: tf.LayersModel | null,
  inputData: number[],
  playerWeights: number[],
  concursoNumber: number,
  setNeuralNetworkVisualization: (vis: ModelVisualization) => void,
  lunarData?: LunarData,
  historicalData?: { numbers: number[][], dates: Date[] }
): Promise<number[]> {
  if (!trainedModel || !historicalData) return [];
  
  const startTime = performance.now();
  
  // Prepare input data with correct shape
  const normalizedInput = prepareInputData(inputData, concursoNumber);
  
  // Initialize advanced analysis
  advancedAnalysis.updateData(historicalData.numbers, historicalData.dates);
  const analysisResult = await advancedAnalysis.analyze();
  
  // Get predictions from specialized models
  const specializedPredictions = await Promise.all([
    specializedModels.pairs.predict(normalizedInput),
    specializedModels.odds.predict(normalizedInput),
    specializedModels.sequences.predict(normalizedInput),
    specializedModels.primes.predict(normalizedInput),
    specializedModels.fibonacci.predict(normalizedInput),
    specializedModels.lunar.predict(normalizedInput)
  ]);
  
  // Combine predictions
  const combinedPrediction = combinePredictions(
    specializedPredictions,
    analysisResult.predictions.nextDraw,
    playerWeights
  );
  
  // Update visualization
  updateVisualization(
    setNeuralNetworkVisualization,
    normalizedInput,
    combinedPrediction,
    trainedModel
  );
  
  const endTime = performance.now();
  performanceMonitor.recordMetrics(analysisResult.metrics.accuracy, endTime - startTime);
  
  return combinedPrediction;
}

function prepareInputData(inputData: number[], concursoNumber: number): number[] {
  const normalizedConcursoNumber = concursoNumber / 3184;
  const normalizedDataSorteio = Date.now() / (1000 * 60 * 60 * 24 * 365);
  
  // Ensure input has length 17 by adding required features
  if (inputData.length === 15) {
    return [
      ...inputData.map(n => n / 25), // Normalize input numbers
      normalizedConcursoNumber,
      normalizedDataSorteio
    ];
  } else if (inputData.length === 17) {
    return inputData;
  } else {
    throw new Error(`Invalid input length: ${inputData.length}. Expected 15 or 17.`);
  }
}

function combinePredictions(
  specializedPredictions: number[][],
  analysisPredicton: number[],
  weights: number[]
): number[] {
  const weightedNumbers = new Map<number, number>();
  
  // Adds specialized predictions
  specializedPredictions.forEach((prediction, index) => {
    prediction.forEach(num => {
      weightedNumbers.set(
        num,
        (weightedNumbers.get(num) || 0) + weights[index] * 0.1
      );
    });
  });
  
  // Adds predictions from advanced analysis
  analysisPredicton.forEach(num => {
    weightedNumbers.set(
      num,
      (weightedNumbers.get(num) || 0) + 0.4
    );
  });
  
  // Select the 15 numbers with the highest weights
  return Array.from(weightedNumbers.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([num]) => num)
    .sort((a, b) => a - b);
}

function updateVisualization(
  setVisualization: (vis: ModelVisualization) => void,
  input: number[],
  predictions: number[],
  model: tf.LayersModel
) {
  setVisualization({
    input,
    output: predictions,
    weights: model.getWeights().map(w => Array.from(w.dataSync()))
  });
}
