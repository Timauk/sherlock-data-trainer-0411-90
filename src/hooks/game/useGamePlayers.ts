import { useState, useCallback } from 'react';
import { Player } from '@/types/gameTypes';
import { systemLogger } from '@/utils/logging/systemLogger';

export const useGamePlayers = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [champion, setChampion] = useState<Player | null>(null);

  const initializePlayers = useCallback((numPlayers: number = 100) => {
    systemLogger.log('initialization', 'Iniciando criação dos jogadores');
    
    const initialPlayers: Player[] = Array.from({ length: numPlayers }, (_, index) => {
      // Inicializa pesos com valores aleatórios entre 0.1 e 1
      const weights = Array.from({ length: 17 }, () => 0.1 + Math.random() * 0.9);
      
      return {
        id: index + 1,
        score: 0,
        predictions: [],
        weights: weights,
        fitness: 0,
        generation: 1
      };
    });

    // Define o primeiro jogador como campeão inicial
    setChampion(initialPlayers[0]);
    setPlayers(initialPlayers);

    systemLogger.log('initialization', 'Jogadores criados com sucesso', {
      totalPlayers: initialPlayers.length,
      championId: initialPlayers[0].id,
      sampleWeights: initialPlayers[0].weights
    });

    return initialPlayers;
  }, []);

  const updatePlayers = useCallback((updatedPlayers: Player[]) => {
    setPlayers(updatedPlayers);
    
    // Atualiza o campeão (jogador com maior pontuação)
    const newChampion = updatedPlayers.reduce((prev, current) => 
      current.score > prev.score ? current : prev
    );
    
    if (newChampion.score > (champion?.score || 0)) {
      setChampion(newChampion);
      systemLogger.log('player', `Novo campeão: Jogador #${newChampion.id}`, {
        score: newChampion.score,
        fitness: newChampion.fitness,
        weights: newChampion.weights
      });
    }
  }, [champion]);

  return {
    players,
    champion,
    setPlayers,
    initializePlayers,
    updatePlayers
  };
};