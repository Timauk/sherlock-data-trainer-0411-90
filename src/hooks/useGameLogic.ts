import { useState, useEffect } from 'react';

export const useGameLogic = (csvData: number[][], trainedModel: any) => {
  const [numbers, setNumbers] = useState<number[][]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [generation, setGeneration] = useState(1);
  const [gameCount, setGameCount] = useState(0);
  const [isManualMode, setIsManualMode] = useState(false);
  const [isInfiniteMode, setIsInfiniteMode] = useState(false);
  const [modelMetrics, setModelMetrics] = useState({});

  const initializePlayers = (count: number) => {
    const initialPlayers = Array(count).fill(null).map((_, i) => ({
      id: i + 1,
      score: 0,
      predictions: []
    }));
    setPlayers(initialPlayers);
  };

  const gameLoop = () => {
    setGameCount(prev => prev + 1);
  };

  const evolveGeneration = (currentPlayers: any[]) => {
    setGeneration(prev => prev + 1);
  };

  return {
    numbers,
    setNumbers,
    players,
    generation,
    gameCount,
    isManualMode,
    isInfiniteMode,
    modelMetrics,
    gameLoop,
    initializePlayers,
    evolveGeneration
  };
};