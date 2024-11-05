import { useState, useCallback } from 'react';
import { Player } from '@/types/gameTypes';

export const useGameInitialization = () => {
  const [players, setPlayers] = useState<Player[]>([]);

  const initializePlayers = useCallback(() => {
    // Aumentado para 40 jogadores
    const newPlayers = Array.from({ length: 40 }, (_, i) => ({
      id: i + 1,
      score: 0,
      predictions: [],
      weights: Array.from({ length: 17 }, () => Math.floor(Math.random() * 1001)),
      fitness: 0,
      generation: 1,
      age: 0, // Adicionando idade para o sistema de envelhecimento
      niche: Math.floor(Math.random() * 4) // 0: pares, 1: ímpares, 2: sequências, 3: geral
    }));
    setPlayers(newPlayers);
  }, []);

  return {
    players,
    setPlayers,
    initializePlayers
  };
};