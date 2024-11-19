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
  
  // Normalização dos dados base
  const normalizedConcursoNumber = concursoNumber / 3184;
  const normalizedDataSorteio = Date.now() / (1000 * 60 * 60 * 24 * 365);
  
  let enrichedInput = [
    ...inputData.slice(0, 15),
    normalizedConcursoNumber,
    normalizedDataSorteio
  ];
  
  // Análises adicionais
  const currentDate = new Date();
  const lunarPhase = getLunarPhase(currentDate);
  const lunarWeight = getLunarPhaseWeight(lunarPhase);
  const frequencyAnalysis = analyzeFrequency(historicalData.numbers);
  const patterns = analyzeAdvancedPatterns(historicalData.numbers, historicalData.dates);
  
  // Integração com previsões ARIMA
  const randomizedWeights = playerWeights.map((weight, index) => {
    const lunarInfluence = lunarWeight * 0.2;
    const frequencyInfluence = getFrequencyInfluence(index + 1, frequencyAnalysis) * 0.3;
    const patternInfluence = patterns ? (patterns.consecutive + patterns.evenOdd) / 2 * 0.2 : 0;
    const arimaInfluence = arimaPredictor.includes(index + 1) ? 0.3 : 0;
    const randomFactor = 1 + (Math.random() - 0.5) * 0.2;
    
    return weight * (1 + lunarInfluence + frequencyInfluence + patternInfluence + arimaInfluence) * randomFactor;
  });
  
  const weightedInput = enrichedInput.map((value, index) => 
    value * (randomizedWeights[index % randomizedWeights.length] / 1000));
  
  const inputTensor = tf.tensor2d([weightedInput]);
  const predictions = trainedModel.predict(inputTensor) as tf.Tensor;
  const result = Array.from(await predictions.data());
  
  inputTensor.dispose();
  predictions.dispose();
  
  setNeuralNetworkVisualization({
    input: weightedInput,
    output: result,
    weights: trainedModel.getWeights().map(w => Array.from(w.dataSync()))
  });
  
  // Sistema de seleção com influência ARIMA
  const weightedNumbers = Array.from({ length: 25 }, (_, i) => {
    const number = i + 1;
    const baseWeight = result[i % result.length];
    const frequencyBonus = getFrequencyInfluence(number, frequencyAnalysis);
    const lunarBonus = getLunarNumberInfluence(number, lunarPhase);
    const patternBonus = patterns ? getNumberPatternInfluence(number, patterns) : 0;
    const arimaBonus = arimaPredictor.includes(number) ? 0.4 : 0;
    
    return {
      number,
      weight: baseWeight * (1 + frequencyBonus + lunarBonus + patternBonus + arimaBonus)
    };
  }).sort((a, b) => b.weight - a.weight);
  
  const uniqueNumbers = new Set<number>();
  let index = 0;
  
  while (uniqueNumbers.size < 10 && index < weightedNumbers.length) {
    uniqueNumbers.add(weightedNumbers[index].number);
    index++;
  }
  
  while (uniqueNumbers.size < 15) {
    const randomIndex = Math.floor(Math.random() * weightedNumbers.length);
    const number = weightedNumbers[randomIndex].number;
    uniqueNumbers.add(number);
  }
  
  const endTime = performance.now();
  performanceMonitor.recordMetrics(result[0], endTime - startTime);
  
  return Array.from(uniqueNumbers).sort((a, b) => a - b);
}

function getLunarPhaseWeight(phase: string): number {
  const weights: Record<string, number> = {
    'Nova': 0.8,
    'Crescente': 1.2,
    'Cheia': 1.0,
    'Minguante': 0.9
  };
  return weights[phase] || 1.0;
}

function analyzeFrequency(numbers: number[][]): Record<number, number> {
  const frequency: Record<number, number> = {};
  numbers.flat().forEach(num => {
    frequency[num] = (frequency[num] || 0) + 1;
  });
  return frequency;
}

function getFrequencyInfluence(number: number, frequency: Record<number, number>): number {
  const max = Math.max(...Object.values(frequency));
  return frequency[number] ? frequency[number] / max : 0;
}

function getLunarNumberInfluence(number: number, phase: string): number {
  // Diferentes fases lunares podem favorecer diferentes ranges de números
  const ranges = {
    'Nova': [1, 6],
    'Crescente': [7, 12],
    'Cheia': [13, 19],
    'Minguante': [20, 25]
  };
  
  const range = ranges[phase as keyof typeof ranges];
  if (range && number >= range[0] && number <= range[1]) {
    return 0.2;
  }
  return 0;
}

function getPatternInfluence(patterns: any): number {
  return (patterns.consecutive + patterns.evenOdd) / 2;
}

function getNumberPatternInfluence(number: number, patterns: any): number {
  const isEven = number % 2 === 0;
  return isEven ? patterns.evenOdd : (1 - patterns.evenOdd);
}
