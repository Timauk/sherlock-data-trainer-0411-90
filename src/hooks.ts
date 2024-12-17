import { useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import { Player } from './types';
import { Services } from './services';
import { systemLogger } from './logger';
import { useToast } from './hooks/use-toast';

export const useGameState = () => {
  const [isInfiniteMode, setIsInfiniteMode] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [gameCount, setGameCount] = useState(0);
  const [trainingData, setTrainingData] = useState<number[][]>([]);
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
    modelMetrics,
    setModelMetrics
  };
};

export const useGamePlayers = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [champion, setChampion] = useState<Player | null>(null);

  const initializePlayers = useCallback((numPlayers: number = 6) => {
    const initialPlayers = Array.from({ length: numPlayers }, (_, index) => ({
      id: index + 1,
      score: 0,
      predictions: [],
      weights: Array.from({ length: 13072 }, () => Math.floor(Math.random() * 1001)),
      fitness: 0,
      generation: 1,
      modelConnection: {
        lastPrediction: null,
        confidence: 0,
        successRate: 0
      }
    }));

    setChampion(initialPlayers[0]);
    setPlayers(initialPlayers);
    return initialPlayers;
  }, []);

  return {
    players,
    champion,
    setPlayers,
    initializePlayers
  };
};

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

export const useModelTraining = () => {
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const startTraining = useCallback(async (
    historicalData: number[][],
    dates: Date[],
    lunarData: any[]
  ) => {
    try {
      setIsTraining(true);
      setProgress(0);

      const model = await Services.createSharedModel();
      setProgress(40);

      await Services.trainModel(model, historicalData);
      setProgress(90);

      setProgress(100);
      toast({
        title: "Treinamento Concluído",
        description: "O modelo foi treinado e salvo com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro no Treinamento",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsTraining(false);
    }
  }, [toast]);

  return {
    isTraining,
    progress,
    startTraining
  };
};
