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
  const [cycleCount, setCycleCount] = useState(0);
  const [lastCloneGameCount, setLastCloneGameCount] = useState(0);
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
  const [frequencyData, setFrequencyData] = useState<{ [key: string]: number[] }>({});
  const [updateInterval, setUpdateInterval] = useState(10);
  const [isInfiniteMode, setIsInfiniteMode] = useState(false);
  const [concursoNumber, setConcursoNumber] = useState(0);
  const [trainingData, setTrainingData] = useState<number[][]>([]);
  const [boardNumbers, setBoardNumbers] = useState<number[]>([]);
  const [isManualMode, setIsManualMode] = useState(false);

  const addLog = useCallback((message: string, matches?: number) => {
    const logType = matches ? 'prediction' : 'action';
    systemLogger.log(logType, message, { matches });
  }, []);

  // Atualiza a contagem de ciclos quando o CSV reinicia
  useEffect(() => {
    if (gameCount > 0 && concursoNumber === 0) {
      setCycleCount(prev => prev + 1);
    }
  }, [gameCount, concursoNumber]);

  // Controle de clonagem baseado em ciclos completos
  const canClonePlayer = useCallback((currentGameCount: number) => {
    const currentCycle = Math.floor(currentGameCount / csvData.length);
    const gamesInCurrentCycle = currentGameCount % csvData.length;
    const isNewCycle = currentCycle > Math.floor(lastCloneGameCount / csvData.length);
    const isEndOfCycle = gamesInCurrentCycle === csvData.length - 1;

    return isNewCycle && isEndOfCycle;
  }, [csvData.length, lastCloneGameCount]);

  const clonePlayer = useCallback((player: Player) => {
    if (!canClonePlayer(gameCount)) {
      toast({
        title: "Clonagem não permitida",
        description: "Você só pode clonar uma vez por ciclo completo do CSV.",
        variant: "destructive"
      });
      return;
    }

    const clones = cloneChampion(player, 1);
    setPlayers(prevPlayers => [...prevPlayers, ...clones]);
    setLastCloneGameCount(gameCount);
    systemLogger.log('player', `Novo clone do Jogador #${player.id} criado no ciclo ${cycleCount}`);
  }, [gameCount, cycleCount, canClonePlayer, toast]);

  const gameLoop = useGameLoop(
    players,
    setPlayers,
    csvData,
    trainedModel,
    concursoNumber,
    setEvolutionData,
    generation,
    addLog,
    updateInterval,
    trainingData,
    setTrainingData,
    setNumbers,
    setDates,
    setNeuralNetworkVisualization,
    setBoardNumbers,
    setModelMetrics,
    setConcursoNumber,
    setGameCount,
    (title, description) => toast({ title, description })
  );

  const evolveGeneration = useEvolutionLogic(
    players,
    setPlayers,
    generation,
    setGeneration,
    setEvolutionData,
    trainedModel,
    trainingData,
    csvData,
    concursoNumber,
    championData,
    setChampionData
  );

  const updateFrequencyData = useCallback((newFrequencyData: { [key: string]: number[] }) => {
    setFrequencyData(newFrequencyData);
    
    if (trainedModel && players.length > 0) {
      const frequencyFeatures = Object.values(newFrequencyData).flat();
      setTrainingData(prev => {
        const lastEntry = prev[prev.length - 1];
        if (lastEntry) {
          return [...prev.slice(0, -1), [...lastEntry, ...frequencyFeatures]];
        }
        return prev;
      });
    }
  }, [trainedModel, players]);

  const toggleManualMode = useCallback(() => {
    setIsManualMode(prev => {
      const newMode = !prev;
      systemLogger.log('action', newMode ? 
        "Modo Manual Ativado - Clonagem automática desativada" : 
        "Modo Manual Desativado - Clonagem automática reativada"
      );
      return newMode;
    });
  }, []);

  useEffect(() => {
    initializePlayers();
  }, [initializePlayers]);

  useEffect(() => {
    setUpdateInterval(Math.max(10, Math.floor(csvData.length / 10)));
  }, [csvData]);

  return {
    players,
    generation,
    evolutionData,
    neuralNetworkVisualization,
    modelMetrics,
    initializePlayers,
    gameLoop,
    evolveGeneration,
    addLog,
    toggleInfiniteMode: useCallback(() => setIsInfiniteMode(prev => !prev), []),
    dates,
    numbers,
    updateFrequencyData,
    isInfiniteMode,
    boardNumbers,
    concursoNumber,
    trainedModel,
    gameCount,
    cycleCount,
    isManualMode,
    toggleManualMode,
    clonePlayer,
    lastCloneGameCount
  };
};
