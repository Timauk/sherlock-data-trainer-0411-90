import { useState, useCallback } from 'react';
import { Player } from '@/types/gameTypes';
import { systemLogger } from '@/utils/logging/systemLogger';

export const useGamePlayers = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [champion, setChampion] = useState<Player | null>(null);

  const initializePlayers = useCallback((numPlayers: number = 100) => {
    systemLogger.log('initialization', 'Iniciando criação dos jogadores', {
      numPlayers,
      timestamp: new Date().toISOString()
    });
    
    const initialPlayers: Player[] = Array.from({ length: numPlayers }, (_, index) => {
      // Inicializa pesos com valores entre 0 e 1000
      const weights = Array.from({ length: 13072 }, () => {
        const baseWeight = Math.floor(Math.random() * 1001); // 0 to 1000
        return baseWeight;
      });
      
      const player = {
        id: index + 1,
        score: 0,
        predictions: [],
        weights,
        fitness: 0,
        generation: 1
      };

      systemLogger.log('player', `Jogador #${player.id} criado`, {
        weightsLength: weights.length,
        timestamp: new Date().toISOString()
      });

      return player;
    });

    setChampion(initialPlayers[0]);
    setPlayers(initialPlayers);

    systemLogger.log('initialization', 'Jogadores criados com sucesso', {
      totalPlayers: initialPlayers.length,
      championId: initialPlayers[0].id,
      weightsLength: initialPlayers[0].weights.length,
      timestamp: new Date().toISOString()
    });

    return initialPlayers;
  }, []);

  const updatePlayers = useCallback((updatedPlayers: Player[]) => {
    systemLogger.log('players', 'Atualizando estado dos jogadores', {
      totalPlayers: updatedPlayers.length,
      timestamp: new Date().toISOString()
    });

    // Validação dos pesos antes da atualização
    const validPlayers = updatedPlayers.every(player => 
      player.weights && player.weights.length === 13072
    );

    if (!validPlayers) {
      systemLogger.error('players', 'Erro: Jogadores com número incorreto de pesos');
      return;
    }

    setPlayers(updatedPlayers);
    
    const newChampion = updatedPlayers.reduce((prev, current) => 
      current.score > prev.score ? current : prev
    );
    
    if (!champion || newChampion.score > champion.score) {
      setChampion(newChampion);
      systemLogger.log('player', `Novo campeão: Jogador #${newChampion.id}`, {
        score: newChampion.score,
        fitness: newChampion.fitness,
        weightsLength: newChampion.weights.length,
        timestamp: new Date().toISOString()
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