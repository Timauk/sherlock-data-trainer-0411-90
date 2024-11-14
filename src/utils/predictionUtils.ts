import * as tf from '@tensorflow/tfjs';
import { ModelVisualization } from '../types/gameTypes';
import { analyzeAdvancedPatterns, enrichPredictionData } from './advancedDataAnalysis';
import { getLunarPhase, analyzeLunarPatterns } from './lunarCalculations';
import { TimeSeriesAnalysis } from './analysis/timeSeriesAnalysis';
import { performanceMonitor } from './performance/performanceMonitor';
import { PredictionScore, LunarData } from './prediction/types';
import { advancedAnalysis } from './analysis/advancedAnalysis';
import { createSpecializedModels } from './specializedModels/superSpecialized';

import {
  calculateFrequencyAnalysis,
  getLunarNumberWeight,
  calculatePatternScore,
  calculateConsistencyScore,
  calculateVariabilityScore
} from './prediction/helpers';

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
  
  // Inicializa análise avançada
  advancedAnalysis.updateData(historicalData.numbers, historicalData.dates);
  const analysisResult = await advancedAnalysis.analyze();
  
  // Obtém previsões dos modelos especializados
  const specializedPredictions = await Promise.all([
    specializedModels.pairs.predict(inputData),
    specializedModels.odds.predict(inputData),
    specializedModels.sequences.predict(inputData),
    specializedModels.primes.predict(inputData),
    specializedModels.fibonacci.predict(inputData),
    specializedModels.lunar.predict(inputData)
  ]);
  
  // Combina previsões
  const combinedPrediction = combinePredictions(
    specializedPredictions,
    analysisResult.predictions.nextDraw,
    playerWeights
  );
  
  // Atualiza visualização
  updateVisualization(
    setNeuralNetworkVisualization,
    inputData,
    combinedPrediction,
    trainedModel
  );
  
  const endTime = performance.now();
  performanceMonitor.recordMetrics(analysisResult.metrics.accuracy, endTime - startTime);
  
  return combinedPrediction;
}

function combinePredictions(
  specializedPredictions: number[][],
  analysisPredicton: number[],
  weights: number[]
): number[] {
  const weightedNumbers = new Map<number, number>();
  
  // Adiciona previsões especializadas
  specializedPredictions.forEach((prediction, index) => {
    prediction.forEach(num => {
      weightedNumbers.set(
        num,
        (weightedNumbers.get(num) || 0) + weights[index] * 0.1
      );
    });
  });
  
  // Adiciona previsões da análise avançada
  analysisPredicton.forEach(num => {
    weightedNumbers.set(
      num,
      (weightedNumbers.get(num) || 0) + 0.4
    );
  });
  
  // Seleciona os 15 números com maiores pesos
  return Array.from(weightedNumbers.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([num]) => num)
    .sort((a, b) => a - b);
}

function prepareInputData(inputData: number[], concursoNumber: number): number[] {
  const normalizedConcursoNumber = concursoNumber / 3184;
  const normalizedDataSorteio = Date.now() / (1000 * 60 * 60 * 24 * 365);
  
  return [
    ...inputData.slice(0, 15).map(n => n / 25),
    normalizedConcursoNumber,
    normalizedDataSorteio
  ];
}

function analyzePatterns(
  historicalData: { numbers: number[][], dates: Date[] },
  lunarData?: LunarData
) {
  const patterns = analyzeAdvancedPatterns(historicalData.numbers, historicalData.dates);
  const frequencyAnalysis = calculateFrequencyAnalysis(historicalData.numbers);
  const lunarInfluence = calculateLunarInfluence(lunarData);
  
  return { patterns, frequencyAnalysis, lunarInfluence };
}

async function generateNeuralPredictions(
  model: tf.LayersModel,
  normalizedInput: number[],
  weights: number[],
  patterns: any
): Promise<PredictionScore[]> {
  const inputTensor = tf.tensor2d([normalizedInput]);
  const predictions = model.predict(inputTensor) as tf.Tensor;
  const rawPredictions = Array.from(await predictions.data());
  
  inputTensor.dispose();
  predictions.dispose();
  
  return Array.from({ length: 25 }, (_, i) => ({
    number: i + 1,
    score: calculateScore(i + 1, rawPredictions[i], patterns),
    confidence: calculateConfidence(i + 1, patterns)
  }));
}

function calculateScore(
  number: number,
  prediction: number,
  patterns: any
): number {
  const { frequencyAnalysis, lunarInfluence, patterns: historicalPatterns } = patterns;
  
  const frequencyScore = frequencyAnalysis[number] || 0;
  const lunarScore = lunarInfluence[number] || 0;
  const patternScore = calculatePatternScore(number, historicalPatterns);
  
  return prediction * 0.4 + frequencyScore * 0.3 + lunarScore * 0.2 + patternScore * 0.1;
}

function calculateConfidence(number: number, patterns: any): number {
  const consistencyScore = calculateConsistencyScore(number, patterns);
  const variabilityScore = calculateVariabilityScore(number, patterns);
  
  return (consistencyScore + variabilityScore) / 2;
}

function selectBestNumbers(
  predictions: PredictionScore[],
  patterns: any
): number[] {
  const sortedPredictions = [...predictions].sort((a, b) => {
    const scoreComparison = b.score - a.score;
    if (Math.abs(scoreComparison) > 0.1) return scoreComparison;
    return b.confidence - a.confidence;
  });
  
  return sortedPredictions.slice(0, 15).map(p => p.number).sort((a, b) => a - b);
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

function calculateLunarInfluence(lunarData?: LunarData): Record<number, number> {
  if (!lunarData) return {};
  
  const influence: Record<number, number> = {};
  const { lunarPhase } = lunarData;
  
  for (let i = 1; i <= 25; i++) {
    influence[i] = getLunarNumberWeight(i, lunarPhase);
  }
  
  return influence;
}
