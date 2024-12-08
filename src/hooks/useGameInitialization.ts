import { useState, useCallback } from 'react';
import { Player } from '@/types/gameTypes';
import { systemLogger } from '@/utils/logging/systemLogger';

export const useGameInitialization = () => {
  const [players, setPlayers] = useState<Player[]>([]);

  const initializePlayers = useCallback(() => {
    systemLogger.log('initialization', 'Iniciando criação dos jogadores');
    
    const initialPlayers: Player[] = Array.from({ length: 100 }, (_, index) => ({
      id: index + 1,
      score: 0,
      predictions: [],
      weights: Array.from({ length: 17 }, () => Math.random()),
      fitness: 0,
      generation: 1
    }));

    systemLogger.log('initialization', 'Jogadores criados com sucesso', {
      totalPlayers: initialPlayers.length,
      samplePlayer: initialPlayers[0]
    });

    setPlayers(initialPlayers);
    return initialPlayers;
  }, []);

  return {
    players,
    setPlayers,
    initializePlayers
  };
};