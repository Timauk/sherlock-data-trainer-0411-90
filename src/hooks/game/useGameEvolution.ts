import { useState, useCallback } from 'react';
import { Player } from '@/types/gameTypes';
import { systemLogger } from '@/utils/logging/systemLogger';

export const useGameEvolution = () => {
  const [generation, setGeneration] = useState(1);
  const [evolutionData, setEvolutionData] = useState<Array<{
    generation: number;
    playerId: number;
    score: number;
    fitness: number;
  }>>([]);

  const evolveGeneration = useCallback((players: Player[]) => {
    setGeneration(prev => prev + 1);
    
    const newEvolutionData = players.map(player => ({
      generation,
      playerId: player.id,
      score: player.score,
      fitness: player.fitness
    }));

    setEvolutionData(prev => [...prev, ...newEvolutionData]);

    systemLogger.log('evolution', 'Geração evoluída', {
      newGeneration: generation + 1,
      playersEvolved: players.length
    });
  }, [generation]);

  return {
    generation,
    evolutionData,
    setGeneration,
    setEvolutionData,
    evolveGeneration
  };
};