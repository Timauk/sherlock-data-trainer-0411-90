import * as tf from '@tensorflow/tfjs';
import { Player, ModelVisualization } from '@/types/gameTypes';
import { makePrediction } from '@/utils/predictionUtils';
import { calculateReward, logReward } from '@/utils/rewardSystem';
import { getLunarPhase, analyzeLunarPatterns } from '@/utils/lunarCalculations';
import { predictionMonitor } from '@/utils/monitoring/predictionMonitor';
import { temporalAccuracyTracker } from '@/utils/prediction/temporalAccuracy';
import { TimeSeriesAnalysis } from '@/utils/analysis/timeSeriesAnalysis';
import { systemLogger } from '@/utils/logging/systemLogger';

interface GameIterationParams {
  players: Player[];
  csvData: number[][];
  nextConcurso: number;
  trainedModel: tf.LayersModel;
  generation: number;
  addLog: (message: string, matches?: number) => void;
  setNeuralNetworkVisualization: (vis: ModelVisualization | null) => void;
  showToast?: (title: string, description: string) => void;
}

export const processGameIteration = async ({
  players,
  csvData,
  nextConcurso,
  trainedModel,
  generation,
  addLog,
  setNeuralNetworkVisualization,
  showToast
}: GameIterationParams) => {
  const currentBoardNumbers = csvData[nextConcurso];
  const currentDate = new Date();
  const lunarPhase = getLunarPhase(currentDate);
  const lunarPatterns = analyzeLunarPatterns([currentDate], [currentBoardNumbers]);

  systemLogger.log('prediction', `Iniciando previsões para concurso ${nextConcurso}`);

  const playerPredictions = await Promise.all(
    players.map(async player => {
      const prediction = await makePrediction(
        trainedModel,
        currentBoardNumbers,
        player.weights,
        nextConcurso,
        setNeuralNetworkVisualization,
        { lunarPhase, lunarPatterns },
        { numbers: [[...currentBoardNumbers]], dates: [currentDate] }
      );

      const timeSeriesAnalyzer = new TimeSeriesAnalysis([[...currentBoardNumbers]]);
      const arimaPredictor = timeSeriesAnalyzer.analyzeNumbers();
      predictionMonitor.recordPrediction(prediction, currentBoardNumbers, arimaPredictor);

      return prediction;
    })
  );

  let totalMatches = 0;
  let randomMatches = 0;
  let currentGameMatches = 0;
  let currentGameRandomMatches = 0;

  const updatedPlayers = players.map((player, index) => {
    const predictions = playerPredictions[index];
    const matches = predictions.filter(num => currentBoardNumbers.includes(num)).length;
    
    systemLogger.log('player', `Jogador ${player.id} fez ${matches} acertos`, {
      predictions,
      currentNumbers: currentBoardNumbers
    });

    totalMatches += matches;
    currentGameMatches += matches;

    if (matches >= 15) {
      showToast?.("Resultado Excepcional!", 
        `Jogador ${player.id} acertou ${matches} números!`);
    }

    const randomPrediction = Array.from({ length: 15 }, () => Math.floor(Math.random() * 25) + 1);
    const randomMatch = randomPrediction.filter(num => currentBoardNumbers.includes(num)).length;
    randomMatches += randomMatch;
    currentGameRandomMatches += randomMatch;

    temporalAccuracyTracker.recordAccuracy(matches, 15);

    const reward = calculateReward(matches);
    
    if (matches >= 11) {
      const logMessage = logReward(matches, player.id);
      addLog(logMessage, matches);
      
      if (matches >= 13) {
        showToast?.("Desempenho Excepcional!", 
          `Jogador ${player.id} acertou ${matches} números!`);
      }
    }

    return {
      ...player,
      score: player.score + reward,
      predictions,
      fitness: matches
    };
  });

  const metrics = {
    accuracy: totalMatches / (players.length * 15),
    randomAccuracy: randomMatches / (players.length * 15),
    totalPredictions: players.length * (nextConcurso + 1),
    perGameAccuracy: currentGameMatches / (players.length * 15),
    perGameRandomAccuracy: currentGameRandomMatches / (players.length * 15)
  };

  return { updatedPlayers, metrics };
};