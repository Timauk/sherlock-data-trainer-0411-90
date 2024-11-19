import { useState, useCallback, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import { useToast } from "@/components/ui/use-toast";
import { useGameInitialization } from './useGameInitialization';
import { useGameLoop } from './useGameLoop';
import { useEvolutionLogic } from './useEvolutionLogic';
import { ModelVisualization, Player } from '@/types/gameTypes';
import { systemLogger } from '@/utils/logging/systemLogger';
import { cloneChampion } from '@/utils/playerEvolution';

export const useGameLogic = (csvData: number[][], trainedModel: tf.LayersModel | null) => {
  const { toast } = useToast();
  const { players, setPlayers, initializePlayers } = useGameInitialization();
  const [generation, setGeneration] = useState(1);
  const [gameCount, setGameCount] = useState(0);
  const [concursoNumber, setConcursoNumber] = useState(0);
  const [boardNumbers, setBoardNumbers] = useState<number[]>([]);
  const [modelMetrics, setModelMetrics] = useState({
    accuracy: 0.5,
    randomAccuracy: 0.3,
    totalPredictions: 0,
    perGameAccuracy: 0,
    perGameRandomAccuracy: 0
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [championData, setChampionData] = useState<{
    player: Player;
    trainingData: number[][];
  }>();
  const [evolutionData, setEvolutionData] = useState<Array<{
    generation: number;
    playerId: number;
    score: number;
    fitness: number;
  }>>([]);
  const [neuralNetworkVisualization, setNeuralNetworkVisualization] = useState<ModelVisualization | null>(null);
  const [dates, setDates] = useState<Date[]>([]);
  const [numbers, setNumbers] = useState<number[][]>([]);

  const addLog = useCallback((message: string, matches?: number) => {
    const logType = matches ? 'prediction' : 'action';
    systemLogger.log(logType, message, { matches });
  }, []);

  const gameLoop = useGameLoop({
    players,
    setPlayers,
    csvData,
    trainedModel,
    concursoNumber,
    generation,
    addLog,
    setNeuralNetworkVisualization,
    setEvolutionData,
    setBoardNumbers,
    setModelMetrics,
    setConcursoNumber,
    setGameCount,
    setIsProcessing,
    showToast: (title, description) => toast({ title, description })
  });

  const evolveGeneration = useEvolutionLogic(
    players,
    setPlayers,
    generation,
    setGeneration,
    setEvolutionData,
    trainedModel,
    championData?.trainingData || [],
    csvData,
    concursoNumber,
    championData,
    setChampionData
  );

  return {
    players,
    generation,
    evolutionData,
    neuralNetworkVisualization,
    modelMetrics,
    boardNumbers,
    concursoNumber,
    dates,
    numbers,
    trainedModel,
    initializePlayers,
    gameLoop,
    evolveGeneration,
    addLog,
    saveFullModel: async () => {}, // Implement if needed
    loadFullModel: async () => {}, // Implement if needed
    onUpdatePlayer: (playerId: number, newWeights: number[]) => {
      const updatedPlayers = players.map(player =>
        player.id === playerId ? { ...player, weights: newWeights } : player
      );
      setPlayers(updatedPlayers);
    }
  };
};