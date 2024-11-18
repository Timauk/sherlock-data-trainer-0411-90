import { useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import { Player, ModelVisualization } from '@/types/gameTypes';
import { makePrediction } from '@/utils/predictionUtils';
import { calculateReward, logReward } from '@/utils/rewardSystem';
import { getLunarPhase, analyzeLunarPatterns } from '@/utils/lunarCalculations';
import { predictionMonitor } from '@/utils/monitoring/predictionMonitor';
import { temporalAccuracyTracker } from '@/utils/prediction/temporalAccuracy';
import { TimeSeriesAnalysis } from '@/utils/analysis/timeSeriesAnalysis';
import { systemLogger } from '@/utils/logging/systemLogger';

interface GameLoopParams {
  players: Player[];
  setPlayers: (players: Player[]) => void;
  csvData: number[][];
  trainedModel: tf.LayersModel | null;
  concursoNumber: number;
  setEvolutionData: (data: any) => void;
  generation: number;
  addLog: (message: string, matches?: number) => void;
  setNeuralNetworkVisualization: (vis: ModelVisualization | null) => void;
  setBoardNumbers: (numbers: number[]) => void;
  setModelMetrics: (metrics: any) => void;
  setConcursoNumber: (num: number) => void;
  setGameCount: React.Dispatch<React.SetStateAction<number>>;
  setIsProcessing: (isProcessing: boolean) => void;
  showToast?: (title: string, description: string) => void;
}

export const useGameLoop = ({
  players,
  setPlayers,
  csvData,
  trainedModel,
  concursoNumber,
  setEvolutionData,
  generation,
  addLog,
  setNeuralNetworkVisualization,
  setBoardNumbers,
  setModelMetrics,
  setConcursoNumber,
  setGameCount,
  setIsProcessing,
  showToast
}: GameLoopParams) => {
  return useCallback(async () => {
    setIsProcessing(true);
    
    try {
      if (!csvData || csvData.length === 0 || !trainedModel || concursoNumber >= csvData.length) {
        addLog("Fim dos concursos disponíveis no CSV");
        return false;
      }

      const currentBoardNumbers = [...csvData[concursoNumber]];
      
      // Força atualização do estado com Promise.resolve
      await Promise.resolve();
      setBoardNumbers(currentBoardNumbers);
      
      systemLogger.log('action', `Game Loop - Processando concurso ${concursoNumber}`, {
        numbers: currentBoardNumbers
      });
      
      const currentDate = new Date();
      const lunarPhase = getLunarPhase(currentDate);
      const lunarPatterns = analyzeLunarPatterns([currentDate], [currentBoardNumbers]);

      const playerResults = await Promise.all(
        players.map(async player => {
          const prediction = await makePrediction(
            trainedModel,
            currentBoardNumbers,
            player.weights,
            concursoNumber,
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
        const predictions = playerResults[index];
        const matches = predictions.filter(num => currentBoardNumbers.includes(num)).length;
        
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
        }

        return {
          ...player,
          score: player.score + reward,
          predictions,
          fitness: matches
        };
      });

      // Força atualização do estado dos jogadores
      await Promise.resolve();
      setPlayers(updatedPlayers);
      
      setEvolutionData(prev => [
        ...prev,
        ...updatedPlayers.map(player => ({
          generation,
          playerId: player.id,
          score: player.score,
          fitness: player.fitness
        }))
      ]);

      const metrics = {
        accuracy: totalMatches / (players.length * 15),
        randomAccuracy: randomMatches / (players.length * 15),
        totalPredictions: players.length * (concursoNumber + 1),
        perGameAccuracy: currentGameMatches / (players.length * 15),
        perGameRandomAccuracy: currentGameRandomMatches / (players.length * 15)
      };

      // Força atualização das métricas
      await Promise.resolve();
      setModelMetrics(metrics);
      
      // Incrementa o número do concurso
      const nextConcurso = concursoNumber + 1;
      setConcursoNumber(nextConcurso);
      setGameCount(prev => prev + 1);

      return true;
    } finally {
      setIsProcessing(false);
    }
  }, [
    players,
    setPlayers,
    csvData,
    trainedModel,
    concursoNumber,
    setEvolutionData,
    generation,
    addLog,
    setNeuralNetworkVisualization,
    setBoardNumbers,
    setModelMetrics,
    setConcursoNumber,
    setGameCount,
    setIsProcessing,
    showToast
  ]);
};