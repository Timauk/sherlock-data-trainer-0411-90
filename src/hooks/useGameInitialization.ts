import { useState } from 'react';
import { Player } from '@/types/gameTypes';
import { systemLogger } from '@/utils/logging/systemLogger';

export const useGameInitialization = () => {
  const [players, setPlayers] = useState<Player[]>([]);

  const initializePlayers = () => {
    // Garantir exatamente 80 jogadores
    const initialPlayers: Player[] = Array.from({ length: 80 }, (_, index) => ({
      id: index + 1,
      name: `Jogador ${index + 1}`,
      score: 0,
      fitness: 0,
      generation: 1,
      weights: Array(15).fill(1),
      predictions: [],
      history: [],
      age: 0,
      niche: Math.floor(Math.random() * 4)
    }));

    setPlayers(initialPlayers);
    systemLogger.log('action', 'Players initialized successfully', { playerCount: initialPlayers.length });
  };

  const updatePlayers = (newPlayers: Player[]) => {
    // Garantir que nunca exceda 80 jogadores
    const limitedPlayers = newPlayers.slice(0, 80);
    setPlayers(limitedPlayers);
  };

  return {
    players,
    setPlayers: updatePlayers,
    initializePlayers
  };
};