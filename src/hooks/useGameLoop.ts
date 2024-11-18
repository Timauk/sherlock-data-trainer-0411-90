import { useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import { Player, ModelVisualization } from '@/types/gameTypes';
import { makePrediction } from '@/utils/predictionUtils';
import { calculateReward } from '@/utils/rewardSystem';
import { getLunarPhase } from '@/utils/lunarCalculations';
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
}: GameLoopParams) => {
  return useCallback(async () => {
    if (!csvData || csvData.length === 0 || !trainedModel || concursoNumber >= csvData.length) {
      addLog("Aguardando início do jogo...");
      return false;
    }

    setIsProcessing(true);
    
    try {
      const currentBoardNumbers = [...csvData[concursoNumber]];
      
      // 1. Primeiro faz as previsões dos jogadores
      const playerPredictions = await Promise.all(
        players.map(async player => {
          const prediction = await makePrediction(
            trainedModel,
            currentBoardNumbers,
            player.weights,
            concursoNumber,
            setNeuralNetworkVisualization,
            { 
              lunarPhase: getLunarPhase(new Date()), 
              lunarPatterns: {} 
            },
            { 
              numbers: [[...currentBoardNumbers]], 
              dates: [new Date()] 
            }
          );
          return prediction;
        })
      );

      // 2. Registra as previsões
      systemLogger.log('prediction', `Previsões realizadas para concurso ${concursoNumber}`);

      // 3. Somente depois revela os números da banca
      await new Promise(resolve => setTimeout(resolve, 500));
      setBoardNumbers(currentBoardNumbers);
      
      // 4. Calcula resultados
      const updatedPlayers = players.map((player, index) => {
        const predictions = playerPredictions[index];
        const matches = predictions.filter(num => currentBoardNumbers.includes(num)).length;
        
        systemLogger.log('player', `Jogador ${player.id} fez ${matches} acertos`, {
          predictions,
          currentNumbers: currentBoardNumbers
        });

        return {
          ...player,
          score: player.score + calculateReward(matches),
          predictions,
          fitness: matches
        };
      });

      // 5. Atualiza estado
      setPlayers(updatedPlayers);
      setConcursoNumber(concursoNumber + 1);
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
  ]);
};