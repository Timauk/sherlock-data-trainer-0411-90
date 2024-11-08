import { useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import { Player, ModelVisualization } from '@/types/gameTypes';
import { makePrediction } from '@/utils/predictionUtils';
import { calculateReward } from '@/utils/rewardSystem';
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
    if (csvData.length === 0 || !trainedModel) {
      systemLogger.log('system', 'Jogo não pode continuar - Dados ou modelo ausentes');
      return;
    }

    const nextConcurso = concursoNumber + 1;
    if (nextConcurso >= csvData.length) {
      systemLogger.log('system', 'Processamento finalizado - Todos os concursos analisados');
      showToast?.("Fim dos Dados", "Todos os jogos foram processados!");
      return;
    }

    setConcursoNumber(nextConcurso);
    setGameCount(prev => prev + 1);

    const currentBoardNumbers = csvData[nextConcurso];
    setBoardNumbers(currentBoardNumbers);

    const currentDate = new Date();
    setNumbers(prev => [...prev, currentBoardNumbers].slice(-100));
    setDates(prev => [...prev, currentDate].slice(-100));

    const playerPredictions = await Promise.all(
      players.map(async player => {
        const prediction = await makePrediction(
          trainedModel,
          currentBoardNumbers,
          player.weights,
          nextConcurso,
          setNeuralNetworkVisualization
        );
        return prediction;
      })
    );

    let totalMatches = 0;
    let currentGameMatches = 0;

    const updatedPlayers = players.map((player, index) => {
      const predictions = playerPredictions[index];
      const matches = predictions.filter(num => currentBoardNumbers.includes(num)).length;
      totalMatches += matches;
      currentGameMatches += matches;

      const reward = calculateReward(matches);
      
      if (matches >= 11) {
        addLog(`Jogador ${player.id} acertou ${matches} números!`, matches);
        
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

    setPlayers(updatedPlayers);
    setModelMetrics({
      accuracy: totalMatches / (players.length * 15),
      totalPredictions: players.length * (nextConcurso + 1),
      perGameAccuracy: currentGameMatches / (players.length * 15)
    });

    setEvolutionData(prev => [
      ...prev,
      ...updatedPlayers.map(player => ({
        generation,
        playerId: player.id,
        score: player.score,
        fitness: player.fitness
      }))
    ]);

    const enhancedTrainingData = [...currentBoardNumbers, ...updatedPlayers[0].predictions];
    setTrainingData(prev => [...prev, enhancedTrainingData]);

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
    setTrainingData,
    setNumbers,
    setDates,
    setNeuralNetworkVisualization,
    setBoardNumbers,
    setModelMetrics,
    setConcursoNumber,
    setGameCount,
    showToast
  ]);

  return gameLoop;
};