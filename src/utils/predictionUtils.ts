import * as tf from '@tensorflow/tfjs';
import { ModelVisualization } from '../types/gameTypes';
import { analyzeAdvancedPatterns, enrichPredictionData } from './advancedDataAnalysis';

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
  if (!trainedModel) return [];
  
  const normalizedConcursoNumber = concursoNumber / 3184;
  const normalizedDataSorteio = Date.now() / (1000 * 60 * 60 * 24 * 365);
  
  // Ensure we only use the first 15 numbers plus concurso and data (total 17)
  let enrichedInput = [
    ...inputData.slice(0, 15), 
    normalizedConcursoNumber, 
    normalizedDataSorteio
  ];
  
  const weightedInput = enrichedInput.map((value, index) => 
    value * (playerWeights[index] / 1000));
  
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
  
  // Ensure 15 unique numbers with weighted random selection
  const uniqueNumbers = new Set<number>();
  const weightedNumbers = result.map((weight, index) => ({
    number: index + 1,
    weight: weight
  })).sort((a, b) => b.weight - a.weight);
  
  while (uniqueNumbers.size < 15) {
    const selectedNumber = weightedNumbers[uniqueNumbers.size].number;
    uniqueNumbers.add(selectedNumber);
  }
  
  return Array.from(uniqueNumbers);
}