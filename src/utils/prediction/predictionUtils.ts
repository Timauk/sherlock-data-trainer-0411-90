import { Player, ModelVisualization } from '@/types/gameTypes';
import { predictionMonitor } from '@/utils/monitoring/predictionMonitor';
import { TimeSeriesAnalysis } from '@/utils/analysis/timeSeriesAnalysis';
import { makePrediction } from '@/utils/aiModel';

interface LunarData {
  lunarPhase: string;
  lunarPatterns: Record<string, number[]>;
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