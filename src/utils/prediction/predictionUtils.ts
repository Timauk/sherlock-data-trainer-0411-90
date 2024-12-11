import { Player, ModelVisualization } from '@/types/gameTypes';
import { predictionMonitor } from '@/utils/monitoring/predictionMonitor';
import { TimeSeriesAnalysis } from '@/utils/analysis/timeSeriesAnalysis';
import { enrichTrainingData } from '@/utils/features/lotteryFeatureEngineering';
import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../logging/systemLogger';

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
  try {
    // Enrich input data
    const enrichedData = enrichTrainingData([[inputData]], [new Date()])[0];
    
    // Ensure correct shape with padding
    const paddedData = new Array(13072).fill(0);
    for (let i = 0; i < enrichedData.length && i < 13072; i++) {
      paddedData[i] = enrichedData[i];
    }

    systemLogger.log('prediction', 'Creating prediction tensor', {
      originalLength: inputData.length,
      enrichedLength: enrichedData.length,
      finalLength: paddedData.length
    });

    const inputTensor = tf.tensor2d([paddedData]);
    const predictions = model.predict(inputTensor) as tf.Tensor;
    const result = Array.from(await predictions.data());
    
    inputTensor.dispose();
    predictions.dispose();
    
    return result.map((n, i) => Math.round(n * weights[i % weights.length]));
  } catch (error) {
    systemLogger.error('prediction', 'Error making prediction', { error });
    throw error;
  }
}

export const handlePlayerPredictions = async (
  players: Player[],
  trainedModel: tf.LayersModel,
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
      predictionMonitor.recordPrediction(prediction, currentBoardNumbers, arimaPredictor);

      return prediction;
    })
  );
};