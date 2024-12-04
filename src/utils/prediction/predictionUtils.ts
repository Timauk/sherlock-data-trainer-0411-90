import { Player } from '@/types/gameTypes';
import { predictionMonitor } from '@/utils/monitoring/predictionMonitor';
import { TimeSeriesAnalysis } from '@/utils/analysis/timeSeriesAnalysis';

export const handlePlayerPredictions = async (
  players: Player[],
  trainedModel: any,
  currentBoardNumbers: number[],
  nextConcurso: number,
  setNeuralNetworkVisualization: (viz: any) => void,
  lunarData: { lunarPhase: string; lunarPatterns: any }
) => {
  return Promise.all(
    players.map(async player => {
      const prediction = await makePrediction(
        trainedModel, 
        currentBoardNumbers, 
        player.weights, 
        nextConcurso,
        setNeuralNetworkVisualization,
        lunarData,
        { numbers: [[...currentBoardNumbers]], dates: [new Date()] }
      );

      const timeSeriesAnalyzer = new TimeSeriesAnalysis([[...currentBoardNumbers]]);
      const arimaPredictor = timeSeriesAnalyzer.analyzeNumbers();
      predictionMonitor.recordPrediction(prediction, currentBoardNumbers);

      return prediction;
    })
  );
};