import { useState } from 'react';
import { Player } from '@/types/gameTypes';
import { systemLogger } from '@/utils/logging/systemLogger';

export const useGameInitialization = () => {
  const [players, setPlayers] = useState<Player[]>([]);

  const initializePlayers = () => {
    const initialPlayers: Player[] = Array.from({ length: 80 }, (_, index) => ({
      id: index + 1,
      name: `Jogador ${index + 1}`,
      score: 0,
      fitness: 0,
      generation: 1,
      weights: Array(15).fill(1),
      predictions: [],
      history: []
    }));

    setPlayers(initialPlayers);
    systemLogger.log('action', 'Players initialized successfully');
  };

  return {
    players,
    setPlayers,
    initializePlayers
  };
};