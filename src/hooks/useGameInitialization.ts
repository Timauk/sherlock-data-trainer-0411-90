import { useState, useCallback } from 'react';
import { Player } from '@/types/gameTypes';
import { createSpecializedModels } from '@/utils/specializedModels/superSpecialized';
import { systemLogger } from '@/utils/logging/systemLogger';

export const useGameInitialization = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isSpecializedSystemsReady, setIsSpecializedSystemsReady] = useState(false);

  const initializeSpecializedSystems = async (csvData: number[][]) => {
    try {
      const specializedModels = createSpecializedModels();
      
      // Alimenta os sistemas especializados com dados históricos
      await Promise.all([
        specializedModels.pairs.train(csvData),
        specializedModels.odds.train(csvData),
        specializedModels.sequences.train(csvData),
        specializedModels.primes.train(csvData),
        specializedModels.fibonacci.train(csvData),
        specializedModels.lunar.train(csvData)
      ]);

      setIsSpecializedSystemsReady(true);
      systemLogger.log('action', 'Sistemas especializados inicializados com dados históricos');
      return true;
    } catch (error) {
      systemLogger.log('error', 'Erro ao inicializar sistemas especializados');
      return false;
    }
  };

  const initializePlayers = useCallback(() => {
    if (!isSpecializedSystemsReady) {
      systemLogger.log('warning', 'Aguardando inicialização dos sistemas especializados...');
      return;
    }

    const newPlayers = Array.from({ length: 40 }, (_, i) => ({
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
    systemLogger.log('action', 'Jogadores inicializados e prontos para começar');
  }, [isSpecializedSystemsReady]);

  return {
    players,
    setPlayers,
    initializePlayers,
    initializeSpecializedSystems,
    isSpecializedSystemsReady
  };
};