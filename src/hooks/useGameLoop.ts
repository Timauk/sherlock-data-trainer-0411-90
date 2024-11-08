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

export const useGameLoop = (
  players: Player[],
  setPlayers: (players: Player[]) => void,
  csvData: number[][],
  trainedModel: tf.LayersModel | null,
  concursoNumber: number,
  setEvolutionData: (data: any) => void,
  generation: number,
  addLog: (message: string, matches?: number) => void,
  updateInterval: number,
  trainingData: number[][],
  setTrainingData: React.Dispatch<React.SetStateAction<number[][]>>,
  setNumbers: React.Dispatch<React.SetStateAction<number[][]>>,
  setDates: React.Dispatch<React.SetStateAction<Date[]>>,
  setNeuralNetworkVisualization: (vis: ModelVisualization | null) => void,
  setBoardNumbers: (numbers: number[]) => void,
  setModelMetrics: (metrics: { 
    accuracy: number; 
    randomAccuracy: number; 
    totalPredictions: number;
    perGameAccuracy: number;
    perGameRandomAccuracy: number;
  }) => void,
  setConcursoNumber: (num: number) => void,
  setGameCount: React.Dispatch<React.SetStateAction<number>>,
  showToast?: (title: string, description: string) => void
) => {
  const gameLoop = useCallback(async () => {
    if (csvData.length === 0 || !trainedModel || concursoNumber >= csvData.length) {
      addLog("Fim dos concursos disponíveis no CSV");
      return;
    }

    // Obtém os números do concurso atual do CSV
    const currentBoardNumbers = csvData[concursoNumber];
    setBoardNumbers(currentBoardNumbers);
    
    const currentDate = new Date();
    const lunarPhase = getLunarPhase(currentDate);
    const lunarPatterns = analyzeLunarPatterns([currentDate], [currentBoardNumbers]);
    
    // Atualiza os números e datas
    setNumbers(currentNumbers => {
      const newNumbers = [...currentNumbers, currentBoardNumbers].slice(-100);
      return newNumbers;
    });
    setDates(currentDates => [...currentDates, currentDate].slice(-100));

    // Processa as apostas dos jogadores para o concurso atual
    const playerPredictions = await Promise.all(
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
    let currentGameMatches = 0;

    // Atualiza os resultados dos jogadores
    const updatedPlayers = players.map((player, index) => {
      const predictions = playerPredictions[index];
      const matches = predictions.filter(num => currentBoardNumbers.includes(num)).length;
      
      totalMatches += matches;
      currentGameMatches += matches;

      if (matches >= 11) {
        const logMessage = logReward(matches, player.id);
        addLog(logMessage, matches);
        
        if (matches >= 13) {
          showToast?.("Desempenho Excepcional!", 
            `Jogador ${player.id} acertou ${matches} números no concurso ${concursoNumber}!`);
        }
      }

      const reward = calculateReward(matches);

      return {
        ...player,
        score: player.score + reward,
        predictions,
        fitness: matches
      };
    });

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

    // Atualiza métricas do modelo
    setModelMetrics({
      accuracy: totalMatches / (players.length * 15),
      randomAccuracy: 0,
      totalPredictions: players.length * (concursoNumber + 1),
      perGameAccuracy: currentGameMatches / (players.length * 15),
      perGameRandomAccuracy: 0
    });

    // Avança para o próximo concurso
    setConcursoNumber(concursoNumber + 1);
    setGameCount(prev => prev + 1);

    // Agenda o próximo loop
    setTimeout(gameLoop, updateInterval);

  }, [
    players,
    setPlayers,
    csvData,
    trainedModel,
    concursoNumber,
    setEvolutionData,
    generation,
    addLog,
    updateInterval,
    setNumbers,
    setDates,
    setBoardNumbers,
    setNeuralNetworkVisualization,
    setModelMetrics,
    setConcursoNumber,
    setGameCount,
    showToast
  ]);

  return gameLoop;
};