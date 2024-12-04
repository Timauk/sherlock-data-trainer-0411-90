import { Player, ModelVisualization } from '@/types/gameTypes';
import { predictionMonitor } from '@/utils/monitoring/predictionMonitor';
import { TimeSeriesAnalysis } from '@/utils/analysis/timeSeriesAnalysis';
import * as tf from '@tensorflow/tfjs';

interface LunarData {
  lunarPhase: string;
  lunarPatterns: Record<string, number[]>;
}

async function makePrediction(
  model: tf.LayersModel,
  inputData: number[],
  weights: number[],
  config: { lunarPhase: string; patterns: any }
): Promise<number[]> {
  const inputTensor = tf.tensor2d([inputData]);
  const predictions = model.predict(inputTensor) as tf.Tensor;
  const result = Array.from(await predictions.data());
  
  inputTensor.dispose();
  predictions.dispose();
  
  return result.map((n, i) => Math.round(n * weights[i % weights.length]));
}

export const handlePlayerPredictions = async (
  players: Player[],
  trainedModel: any,
  currentBoardNumbers: number[],
  nextConcurso: number,
  setNeuralNetworkVisualization: (viz: ModelVisualization) => void,
  lunarData: LunarData
) => {
  return Promise.all(
    players.map(async player => {
      const prediction = await makePrediction(
        trainedModel, 
        currentBoardNumbers, 
        player.weights,
        { lunarPhase: lunarData.lunarPhase, patterns: lunarData.lunarPatterns }
      );

      const timeSeriesAnalyzer = new TimeSeriesAnalysis([[...currentBoardNumbers]]);
      const arimaPredictor = timeSeriesAnalyzer.analyzeNumbers();
      predictionMonitor.recordPrediction(prediction, currentBoardNumbers, [nextConcurso]);

      return prediction;
    })
  );
};