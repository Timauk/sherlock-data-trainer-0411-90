import { useState, useCallback } from 'react';
import { Player } from '@/types/gameTypes';
import { systemLogger } from '@/utils/logging/systemLogger';

export const useGamePlayers = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [champion, setChampion] = useState<Player | null>(null);

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

    // Define o primeiro jogador como campeão inicial
    setChampion(initialPlayers[0]);
    setPlayers(initialPlayers);

    systemLogger.log('initialization', 'Jogadores criados com sucesso', {
      totalPlayers: initialPlayers.length,
      championId: initialPlayers[0].id
    });

    return initialPlayers;
  }, []);

  const updatePlayers = useCallback((updatedPlayers: Player[]) => {
    setPlayers(updatedPlayers);
    // Atualiza o campeão (jogador com maior pontuação)
    const newChampion = updatedPlayers.reduce((prev, current) => 
      current.score > prev.score ? current : prev
    );
    setChampion(newChampion);
  }, []);

  return {
    players,
    champion,
    setPlayers,
    initializePlayers,
    updatePlayers
  };
};