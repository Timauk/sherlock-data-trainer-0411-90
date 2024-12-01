import { useState, useCallback } from 'react';
import { Player } from '@/types/gameTypes';
import { systemLogger } from '@/utils/logging/systemLogger';

export const useGameInitialization = () => {
  const [players, setPlayers] = useState<Player[]>([]);

  const initializePlayers = useCallback(() => {
    const initialPlayers: Player[] = Array.from({ length: 100 }, (_, index) => ({
      id: index + 1,
      score: 0,
      predictions: [],
      weights: Array.from({ length: 17 }, () => Math.random()),
      fitness: 0,
      generation: 1
    }));

    setPlayers(initialPlayers);
    
    // Seleciona o primeiro campeão baseado em critérios iniciais
    const initialChampion = initialPlayers[0];
    systemLogger.log('player', `Campeão inicial selecionado: Jogador #${initialChampion.id}`);
    
    return initialChampion;
  }, []);

  return {
    players,
    setPlayers,
    initializePlayers
  };
};