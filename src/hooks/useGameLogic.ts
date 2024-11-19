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
  const [modelMetrics, setModelMetrics] = useState({
    accuracy: 0.5,
    randomAccuracy: 0.3,
    totalPredictions: 0,
    perGameAccuracy: 0,
    perGameRandomAccuracy: 0
  });

  // Initialize players only once when csvData or trainedModel changes
  useEffect(() => {
    if (csvData.length > 0 && trainedModel && players.length === 0) {
      initializePlayers();
      systemLogger.log('action', 'Jogadores inicializados uma única vez');
    }
  }, [csvData, trainedModel, players.length, initializePlayers]);

  const addLog = useCallback((message: string, matches?: number) => {
    const logType = matches ? 'prediction' : 'action';
    systemLogger.log(logType, message, { matches });
  }, []);

  const gameLoop = useGameLoop({
    players,
    setPlayers,
    csvData,
    trainedModel,
    generation,
    addLog,
    setNeuralNetworkVisualization,
    setEvolutionData,
    setGameCount,
    showToast: (title, description) => toast({ title, description })
  });

  const evolveGeneration = useEvolutionLogic(
    players,
    setPlayers,
    generation,
    setGeneration,
    setEvolutionData,
    trainedModel,
    championData,
    setChampionData
  );

  return {
    players,
    generation,
    evolutionData,
    neuralNetworkVisualization,
    modelMetrics,
    initializePlayers,
    gameLoop,
    evolveGeneration,
    addLog
  };
};
