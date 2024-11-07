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

  // Atualiza a contagem de ciclos quando o CSV reinicia
  useEffect(() => {
    if (gameCount > 0 && concursoNumber === 0) {
      setCycleCount(prev => prev + 1);
      systemLogger.log('system', `Novo ciclo iniciado: ${cycleCount + 1}`);
    }
  }, [gameCount, concursoNumber]);

  // Função melhorada para verificar se pode clonar
  const canClonePlayer = useCallback((currentGameCount: number) => {
    // Não permite clonagem se não houver dados carregados
    if (!csvData.length) {
      return false;
    }

    // Verifica se já houve clonagem neste ciclo
    if (currentGameCount === lastCloneGameCount) {
      return false;
    }

    const currentCycle = Math.floor(currentGameCount / csvData.length);
    const gamesInCurrentCycle = currentGameCount % csvData.length;
    const lastCloneCycle = Math.floor(lastCloneGameCount / csvData.length);
    
    // Só permite clonagem em um novo ciclo
    const isNewCycle = currentCycle > lastCloneCycle;
    // E apenas no final do ciclo
    const isEndOfCycle = gamesInCurrentCycle === csvData.length - 1;

    const canClone = isNewCycle && isEndOfCycle;
    
    if (canClone) {
      systemLogger.log('system', `Clonagem permitida no ciclo ${currentCycle}`);
    }

    return canClone;
  }, [csvData.length, lastCloneGameCount]);

  const clonePlayer = useCallback((player: Player) => {
    if (!canClonePlayer(gameCount)) {
      const currentCycle = Math.floor(gameCount / csvData.length);
      const lastCloneCycle = Math.floor(lastCloneGameCount / csvData.length);
      
      const gamesUntilNextCycle = csvData.length - (gameCount % csvData.length);
      
      toast({
        title: "Clonagem não permitida",
        description: `Aguarde ${gamesUntilNextCycle} jogos para completar o ciclo atual. Último clone: Ciclo ${lastCloneCycle}, Atual: Ciclo ${currentCycle}`,
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
    
    systemLogger.log('player', `Novo clone do Jogador #${player.id} criado no ciclo ${cycleCount}`);
  }, [gameCount, cycleCount, canClonePlayer, toast, lastCloneGameCount, csvData.length]);

  const gameLoop = useGameLoop(
    players,
    setPlayers,
    csvData,
    trainedModel,
    concursoNumber,
    setEvolutionData,
    generation,
    addLog,
    10,
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
    isInfiniteMode,
    boardNumbers,
    concursoNumber,
    trainedModel,
    gameCount,
    cycleCount,
    isManualMode,
    toggleManualMode: useCallback(() => setIsManualMode(prev => !prev), []),
    clonePlayer,
    lastCloneGameCount
  };
};
