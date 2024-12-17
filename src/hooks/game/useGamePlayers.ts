import { useState, useCallback } from 'react';
import { Player } from '@/types/gameTypes';
import { systemLogger } from '@/utils/logging/systemLogger';

export const useGamePlayers = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [champion, setChampion] = useState<Player | null>(null);

  const initializePlayers = useCallback((numPlayers: number = 6) => {
    systemLogger.log('initialization', 'Iniciando criação dos jogadores', {
      numPlayers,
      timestamp: new Date().toISOString()
    });
    
    const initialPlayers: Player[] = Array.from({ length: numPlayers }, (_, index) => {
      const weights = Array.from({ length: 13072 }, () => {
        const baseWeight = Math.floor(Math.random() * 1001);
        return baseWeight;
      });
      
      const player: Player = {
        id: index + 1,
        score: 0,
        predictions: [],
        weights,
        fitness: 0,
        generation: 1,
        modelConnection: {
          lastPrediction: null,
          confidence: 0,
          successRate: 0
        }
      };

      return player;
    });

    setChampion(initialPlayers[0]);
    setPlayers(initialPlayers);

    systemLogger.log('initialization', 'Jogadores criados com sucesso', {
      totalPlayers: initialPlayers.length,
      championId: initialPlayers[0].id
    });

    return initialPlayers;
  }, []);

  const updatePlayers = useCallback((updatedPlayers: Player[], model: tf.LayersModel | null) => {
    if (!model) {
      systemLogger.error('players', 'Modelo não disponível para atualização dos jogadores');
      return;
    }

    const validPlayers = updatedPlayers.every(player => 
      player.weights && player.weights.length === 13072
    );

    if (!validPlayers) {
      systemLogger.error('players', 'Erro: Jogadores com número incorreto de pesos');
      return;
    }

    const playersWithModelConnection = updatedPlayers.map(player => ({
      ...player,
      modelConnection: {
        ...player.modelConnection,
        lastUpdate: new Date().toISOString()
      }
    }));

    setPlayers(playersWithModelConnection);
    
    const newChampion = playersWithModelConnection.reduce((prev, current) => 
      current.score > prev.score ? current : prev
    );
    
    if (!champion || newChampion.score > champion.score) {
      setChampion(newChampion);
      systemLogger.log('player', `Novo campeão: Jogador #${newChampion.id}`, {
        score: newChampion.score,
        fitness: newChampion.fitness
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