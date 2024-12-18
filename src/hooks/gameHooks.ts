import { useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import { Player } from '@/types/gameTypes';
import { systemLogger } from '@/utils/logging/systemLogger';
import { DataServices } from '@/services/dataServices';
import { calculateReward } from '@/utils/rewardSystem';
import { useToast } from "@/hooks/use-toast";

export const useGameLogic = (csvData: number[][], trainedModel: tf.LayersModel | null) => {
  const {
    players,
    champion,
    setPlayers,
    initializePlayers,
    updatePlayers
  } = useGamePlayers();

  const {
    boardNumbers,
    concursoNumber,
    numbers,
    dates,
    setNumbers,
    setBoardNumbers,
    setConcursoNumber,
    setDates,
    updateBank
  } = useBankSystem();

  const {
    generation,
    evolutionData,
    setEvolutionData,
    evolveGeneration
  } = useGameEvolution();

  const gameState = useGameState();

  const initializeGameData = useCallback(() => {
    systemLogger.log('game', 'Iniciando inicialização do jogo', {
      hasCsvData: csvData?.length > 0,
      hasTrainedModel: !!trainedModel
    });

    if (csvData && csvData.length > 0) {
      setNumbers([csvData[0]]);
      setBoardNumbers(csvData[0]);
      
      if (!players || players.length === 0) {
        initializePlayers(100);
        return true;
      }
    }
    return false;
  }, [csvData, players, setNumbers, setBoardNumbers, initializePlayers]);

  const gameLoop = useCallback(() => {
    if (csvData && csvData.length > 0 && trainedModel) {
      // Game loop logic here
      systemLogger.log('game', 'Executando loop do jogo');
    }
  }, [csvData, trainedModel]);

  return {
    players,
    champion,
    generation,
    evolutionData,
    initializePlayers,
    evolveGeneration,
    dates,
    numbers,
    setNumbers,
    isInfiniteMode: gameState.isInfiniteMode,
    boardNumbers,
    concursoNumber,
    trainedModel,
    gameCount: gameState.gameCount,
    isManualMode: gameState.isManualMode,
    toggleManualMode: useCallback(() => {
      gameState.setIsManualMode(prev => !prev);
    }, [gameState]),
    toggleInfiniteMode: useCallback(() => {
      gameState.setIsInfiniteMode(prev => !prev);
    }, [gameState]),
    initializeGameData,
    gameLoop
  };
};

export const useGamePlayers = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [champion, setChampion] = useState<Player | null>(null);

  const initializePlayers = useCallback((numPlayers: number = 6) => {
    systemLogger.log('initialization', 'Iniciando criação dos jogadores', {
      numPlayers,
      timestamp: new Date().toISOString()
    });
    
    const initialPlayers: Player[] = Array.from({ length: numPlayers }, (_, index) => {
      const weights = Array.from({ length: 13072 }, () => {
        const baseWeight = Math.floor(Math.random() * 1001);
        return baseWeight;
      });
      
      const player: Player = {
        id: index + 1,
        score: 0,
        predictions: [],
        weights,
        fitness: 0,
        generation: 1,
        modelConnection: {
          lastPrediction: null,
          confidence: 0,
          successRate: 0
        }
      };

      return player;
    });

    setChampion(initialPlayers[0]);
    setPlayers(initialPlayers);

    return initialPlayers;
  }, []);

  const updatePlayers = useCallback((updatedPlayers: Player[], model: tf.LayersModel | null) => {
    if (!model) {
      systemLogger.error('players', 'Modelo não disponível para atualização dos jogadores');
      return;
    }

    const validPlayers = updatedPlayers.every(player => 
      player.weights && player.weights.length === 13072
    );

    if (!validPlayers) {
      systemLogger.error('players', 'Erro: Jogadores com número incorreto de pesos');
      return;
    }

    const playersWithModelConnection = updatedPlayers.map(player => ({
      ...player,
      modelConnection: {
        ...player.modelConnection,
        lastUpdate: new Date().toISOString()
      }
    }));

    setPlayers(playersWithModelConnection);
    
    const newChampion = playersWithModelConnection.reduce((prev, current) => 
      current.score > prev.score ? current : prev
    );
    
    if (!champion || newChampion.score > champion.score) {
      setChampion(newChampion);
      systemLogger.log('player', `Novo campeão: Jogador #${newChampion.id}`, {
        score: newChampion.score,
        fitness: newChampion.fitness
      });
    }
  }, [champion]);

  return {
    players,
    champion,
    setPlayers,
    initializePlayers,
    updatePlayers
  };
};

// Game State Hook
export const useGameState = () => {
  const [isInfiniteMode, setIsInfiniteMode] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [gameCount, setGameCount] = useState(0);
  const [trainingData, setTrainingData] = useState<number[][]>([]);
  const [neuralNetworkVisualization, setNeuralNetworkVisualization] = useState(null);
  const [modelMetrics, setModelMetrics] = useState({
    accuracy: 0,
    randomAccuracy: 0,
    totalPredictions: 0,
    perGameAccuracy: 0,
    perGameRandomAccuracy: 0
  });

  return {
    isInfiniteMode,
    setIsInfiniteMode,
    isManualMode,
    setIsManualMode,
    gameCount,
    setGameCount,
    trainingData,
    setTrainingData,
    neuralNetworkVisualization,
    setNeuralNetworkVisualization,
    modelMetrics,
    setModelMetrics
  };
};

// Bank System Hook
export const useBankSystem = () => {
  const [boardNumbers, setBoardNumbers] = useState<number[]>([]);
  const [concursoNumber, setConcursoNumber] = useState(0);
  const [numbers, setNumbers] = useState<number[][]>([]);
  const [dates, setDates] = useState<Date[]>([]);

  const updateBank = useCallback((newNumbers: number[], newConcurso: number) => {
    setBoardNumbers(newNumbers);
    setConcursoNumber(newConcurso);
    setNumbers(prev => [...prev, newNumbers].slice(-100));
    setDates(prev => [...prev, new Date()].slice(-100));

    systemLogger.log('bank', 'Banca atualizada', {
      concurso: newConcurso,
      numbers: newNumbers
    });
  }, []);

  return {
    boardNumbers,
    concursoNumber,
    numbers,
    dates,
    setNumbers,
    setBoardNumbers,
    setConcursoNumber,
    setDates,
    updateBank
  };
};

// Game Evolution Hook
export const useGameEvolution = () => {
  const [generation, setGeneration] = useState(1);
  const [evolutionData, setEvolutionData] = useState<Array<{
    generation: number;
    playerId: number;
    score: number;
    fitness: number;
  }>>([]);

  const evolveGeneration = useCallback((players: Player[]) => {
    setGeneration(prev => prev + 1);
    
    const newEvolutionData = players.map(player => ({
      generation,
      playerId: player.id,
      score: player.score,
      fitness: player.fitness
    }));

    setEvolutionData(prev => [...prev, ...newEvolutionData]);

    systemLogger.log('evolution', 'Geração evoluída', {
      newGeneration: generation + 1,
      playersEvolved: players.length
    });
  }, [generation]);

  return {
    generation,
    evolutionData,
    setGeneration,
    setEvolutionData,
    evolveGeneration
  };
};

// Game Controls Hook
export const useGameControls = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();

  const playGame = () => {
    setIsPlaying(true);
    toast({
      title: "Jogo Iniciado",
      description: "O jogo está em execução",
    });
  };

  const pauseGame = () => {
    setIsPlaying(false);
    toast({
      title: "Jogo Pausado",
      description: "O jogo foi pausado",
    });
  };

  const resetGame = () => {
    setIsPlaying(false);
    toast({
      title: "Jogo Reiniciado",
      description: "O jogo foi reiniciado",
    });
  };

  return {
    isPlaying,
    playGame,
    pauseGame,
    resetGame
  };
};
