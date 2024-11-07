import { useState, useCallback, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import { useToast } from "@/hooks/use-toast";
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
  const [cycleCount, setCycleCount] = useState(0);
  const [lastCloneGameCount, setLastCloneGameCount] = useState(-1);
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
    accuracy: 0,
    randomAccuracy: 0,
    totalPredictions: 0,
  });
  const [dates, setDates] = useState<Date[]>([]);
  const [numbers, setNumbers] = useState<number[][]>([]);
  const [isInfiniteMode, setIsInfiniteMode] = useState(false);
  const [concursoNumber, setConcursoNumber] = useState(0);
  const [trainingData, setTrainingData] = useState<number[][]>([]);
  const [boardNumbers, setBoardNumbers] = useState<number[]>([]);
  const [isManualMode, setIsManualMode] = useState(false);

  const addLog = useCallback((message: string) => {
    systemLogger.log('action', message);
  }, []);

  useEffect(() => {
    if (gameCount > 0 && concursoNumber === 0) {
      setCycleCount(prev => prev + 1);
      systemLogger.log('system', `Novo ciclo iniciado: ${cycleCount + 1}`);
    }
  }, [gameCount, concursoNumber, cycleCount]);

  const canClonePlayer = useCallback((currentGameCount: number) => {
    if (currentGameCount === lastCloneGameCount) {
      return false;
    }

    const currentCycle = Math.floor(currentGameCount / (csvData?.length || 1));
    const gamesInCurrentCycle = currentGameCount % (csvData?.length || 1);
    const isNewCycle = currentCycle > Math.floor(lastCloneGameCount / (csvData?.length || 1));
    const isEndOfCycle = gamesInCurrentCycle === (csvData?.length || 1) - 1;

    return isNewCycle && isEndOfCycle;
  }, [csvData?.length, lastCloneGameCount]);

  const clonePlayer = useCallback((player: Player) => {
    if (!canClonePlayer(gameCount)) {
      const currentCycle = Math.floor(gameCount / (csvData?.length || 1));
      const lastCloneCycle = Math.floor(lastCloneGameCount / (csvData?.length || 1));
      
      toast({
        title: "Clonagem não permitida",
        description: `Você só pode clonar uma vez por ciclo completo do CSV. Último clone: Ciclo ${lastCloneCycle}, Atual: Ciclo ${currentCycle}`,
        variant: "destructive"
      });
      return;
    }

    const clones = cloneChampion(player, 1);
    setPlayers(prevPlayers => [...prevPlayers, ...clones]);
    setLastCloneGameCount(gameCount);
    
    toast({
      title: "Clonagem bem-sucedida",
      description: `Clone do Jogador #${player.id} criado no ciclo ${cycleCount}`,
    });
  }, [gameCount, cycleCount, canClonePlayer, toast, lastCloneGameCount, csvData?.length, setPlayers]);

  const gameLoop = useGameLoop({
    players,
    setPlayers,
    csvData: csvData || [],
    trainedModel,
    concursoNumber,
    setEvolutionData,
    generation,
    addLog,
    updateInterval: 10,
    trainingData,
    setTrainingData,
    setNumbers,
    setDates,
    setNeuralNetworkVisualization,
    setBoardNumbers,
    setModelMetrics,
    setConcursoNumber,
    setGameCount,
    showToast: (title: string, description: string) => toast({ title, description })
  });

  const evolveGeneration = useCallback(() => {
    setGeneration(prev => prev + 1);
    const evolvedPlayers = players.map(player => ({
      ...player,
      generation: generation + 1,
      age: player.age + 1
    }));
    setPlayers(evolvedPlayers);
    systemLogger.log('system', `Generation evolved to ${generation + 1}`);
  }, [players, generation]);

  return {
    players,
    generation,
    evolutionData,
    neuralNetworkVisualization,
    modelMetrics,
    initializePlayers,
    gameLoop,
    addLog,
    toggleInfiniteMode: useCallback(() => setIsInfiniteMode(prev => !prev), []),
    dates,
    numbers,
    isInfiniteMode,
    boardNumbers,
    concursoNumber,
    trainedModel,
    gameCount,
    cycleCount,
    isManualMode,
    toggleManualMode: useCallback(() => setIsManualMode(prev => !prev), []),
    clonePlayer,
    lastCloneGameCount,
    evolveGeneration
  };
};
