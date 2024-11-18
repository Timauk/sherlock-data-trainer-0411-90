import { useState, useCallback } from 'react';
import { Player } from '@/types/gameTypes';

export const useGameInitialization = () => {
  const [players, setPlayers] = useState<Player[]>([]);

  const initializePlayers = useCallback(() => {
    const newPlayers = Array.from({ length: 80 }, (_, i) => ({
      id: i + 1,
      score: 0,
      predictions: [],
      weights: Array.from({ length: 17 }, () => Math.floor(Math.random() * 1001)),
      fitness: 0,
      generation: 1,
      age: 0,
      niche: Math.floor(Math.random() * 4)
    }));

    setPlayers(newPlayers);
  }, []);

  return {
    players,
    setPlayers,
    initializePlayers
  };
};