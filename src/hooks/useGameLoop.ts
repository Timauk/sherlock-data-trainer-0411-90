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
  setModelMetrics: (metrics: any) => void,
  setConcursoNumber: (num: number) => void,
  setGameCount: React.Dispatch<React.SetStateAction<number>>,
  showToast?: (title: string, description: string) => void
) => {
  const gameLoop = useCallback(async () => {
    if (csvData.length === 0 || !trainedModel || concursoNumber >= csvData.length) {
      addLog("Fim dos concursos disponíveis no CSV");
      return;
    }

    // Obtém os números do concurso atual do CSV e força atualização do estado
    const currentBoardNumbers = [...csvData[concursoNumber]];
    console.log('Game Loop - Setting board numbers:', currentBoardNumbers, 'for concurso:', concursoNumber);
    setBoardNumbers(currentBoardNumbers);
    
    const currentDate = new Date();
    const lunarPhase = getLunarPhase(currentDate);
    const lunarPatterns = analyzeLunarPatterns([currentDate], [currentBoardNumbers]);

    // Atualiza os números e datas simultaneamente
    setNumbers(prev => [...prev, currentBoardNumbers].slice(-100));
    setDates(prev => [...prev, currentDate].slice(-100));

    // Processa todas as apostas dos jogadores simultaneamente
    const playerResults = await Promise.all(
      players.map(async player => {
        const prediction = await makePrediction(
          trainedModel,
          currentBoardNumbers,
          player.weights,
          concursoNumber,
          setNeuralNetworkVisualization,
          { lunarPhase, lunarPatterns },
          { numbers: [currentBoardNumbers], dates: [currentDate] }
        );

        const matches = prediction.filter(num => currentBoardNumbers.includes(num)).length;
        const reward = calculateReward(matches);

        if (matches >= 11) {
          const logMessage = logReward(matches, player.id);
          addLog(logMessage, matches);
          
          if (matches >= 13) {
            showToast?.("Desempenho Excepcional!", 
              `Jogador ${player.id} acertou ${matches} números no concurso ${concursoNumber}!`);
          }
        }

        return {
          ...player,
          score: player.score + reward,
          predictions: prediction,
          fitness: matches
        };
      })
    );

    // Atualiza todos os jogadores simultaneamente
    setPlayers(playerResults);
    
    // Atualiza dados de evolução
    setEvolutionData(prev => [
      ...prev,
      ...playerResults.map(player => ({
        generation,
        playerId: player.id,
        score: player.score,
        fitness: player.fitness
      }))
    ]);

    // Atualiza métricas do modelo
    const totalMatches = playerResults.reduce((sum, player) => sum + player.fitness, 0);
    setModelMetrics({
      accuracy: totalMatches / (players.length * 15),
      totalPredictions: players.length * (concursoNumber + 1),
      perGameAccuracy: totalMatches / (players.length * 15)
    });

    // Avança para o próximo concurso
    console.log('Advancing concurso from', concursoNumber, 'to', concursoNumber + 1);
    setConcursoNumber(concursoNumber + 1);
    setGameCount(gameCount => gameCount + 1);

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