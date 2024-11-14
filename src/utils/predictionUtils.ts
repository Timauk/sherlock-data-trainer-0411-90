import * as tf from '@tensorflow/tfjs';
import { ModelVisualization } from '../types/gameTypes';
import { analyzeAdvancedPatterns, enrichPredictionData } from './advancedDataAnalysis';
import { getLunarPhase, analyzeLunarPatterns } from './lunarCalculations';
import { TimeSeriesAnalysis } from './analysis/timeSeriesAnalysis';
import { performanceMonitor } from './performance/performanceMonitor';

interface LunarData {
  lunarPhase: string;
  lunarPatterns: Record<string, number[]>;
}

interface PredictionScore {
  number: number;
  score: number;
  confidence: number;
}

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
  
  // Análise ARIMA dos dados históricos
  const timeSeriesAnalyzer = new TimeSeriesAnalysis(historicalData.numbers);
  const arimaPredictor = timeSeriesAnalyzer.analyzeNumbers();
  
  // Normalização e preparação dos dados
  const normalizedInput = prepareInputData(inputData, concursoNumber);
  
  // Análise de padrões e influências
  const patterns = analyzePatterns(historicalData, lunarData);
  
  // Gerar previsões usando a rede neural
  const predictions = await generateNeuralPredictions(
    trainedModel,
    normalizedInput,
    playerWeights,
    patterns
  );
  
  // Selecionar os melhores números baseado nas previsões
  const selectedNumbers = selectBestNumbers(predictions, patterns);
  
  // Atualizar visualização
  updateVisualization(
    setNeuralNetworkVisualization,
    normalizedInput,
    predictions,
    trainedModel
  );
  
  const endTime = performance.now();
  performanceMonitor.recordMetrics(predictions[0], endTime - startTime);
  
  return selectedNumbers;
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
  
  return {
    patterns,
    frequencyAnalysis,
    lunarInfluence
  };
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
  
  return (
    prediction * 0.4 +
    frequencyScore * 0.3 +
    lunarScore * 0.2 +
    patternScore * 0.1
  );
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
  // Ordenar por score e confiança
  const sortedPredictions = [...predictions].sort((a, b) => {
    const scoreComparison = b.score - a.score;
    if (Math.abs(scoreComparison) > 0.1) return scoreComparison;
    return b.confidence - a.confidence;
  });
  
  // Selecionar os 15 melhores números
  return sortedPredictions
    .slice(0, 15)
    .map(p => p.number)
    .sort((a, b) => a - b);
}

function updateVisualization(
  setVisualization: (vis: ModelVisualization) => void,
  input: number[],
  predictions: PredictionScore[],
  model: tf.LayersModel
) {
  setVisualization({
    input,
    output: predictions.map(p => p.score),
    weights: model.getWeights().map(w => Array.from(w.dataSync()))
  });
}

// Funções auxiliares
function calculateFrequencyAnalysis(numbers: number[][]): Record<number, number> {
  const frequency: Record<number, number> = {};
  const totalGames = numbers.length;
  
  numbers.flat().forEach(num => {
    frequency[num] = (frequency[num] || 0) + 1;
  });
  
  // Normalizar frequências
  Object.keys(frequency).forEach(key => {
    frequency[Number(key)] = frequency[Number(key)] / totalGames;
  });
  
  return frequency;
}

function calculateLunarInfluence(lunarData?: LunarData): Record<number, number> {
  if (!lunarData) return {};
  
  const influence: Record<number, number> = {};
  const { lunarPhase } = lunarData;
  
  // Mapear influência lunar para cada número
  for (let i = 1; i <= 25; i++) {
    influence[i] = getLunarNumberWeight(i, lunarPhase);
  }
  
  return influence;
}

function getLunarNumberWeight(number: number, phase: string): number {
  const phaseWeights: Record<string, number> = {
    'Nova': 0.8,
    'Crescente': 1.2,
    'Cheia': 1.0,
    'Minguante': 0.9
  };
  
  return phaseWeights[phase] || 1.0;
}

function calculatePatternScore(number: number, patterns: any): number {
  if (!patterns) return 0;
  
  const { consecutive, evenOdd } = patterns;
  const isEven = number % 2 === 0;
  
  return (
    (consecutive * 0.5) +
    (isEven ? evenOdd : (1 - evenOdd)) * 0.5
  );
}

function calculateConsistencyScore(number: number, patterns: any): number {
  // Implementar lógica de consistência baseada em padrões históricos
  return 0.5;
}

function calculateVariabilityScore(number: number, patterns: any): number {
  // Implementar lógica de variabilidade baseada em padrões históricos
  return 0.5;
}