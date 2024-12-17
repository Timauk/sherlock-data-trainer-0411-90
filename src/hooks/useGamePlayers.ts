import { useState, useCallback } from 'react';
import { Player } from '@/types/gameTypes';
import { systemLogger } from '@/utils/logging/systemLogger';
import * as tf from '@tensorflow/tfjs';

export const useGamePlayers = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [champion, setChampion] = useState<Player | null>(null);

  const initializePlayers = useCallback((numPlayers: number = 6) => {
    systemLogger.log('initialization', 'Initializing players', {
      numPlayers,
      timestamp: new Date().toISOString()
    });
    
    const initialPlayers: Player[] = Array.from({ length: numPlayers }, (_, index) => {
      const weights = Array.from({ length: 17 }, () => {
        return 0.5 + Math.random();
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

    systemLogger.log('initialization', 'Players initialized', {
      totalPlayers: initialPlayers.length,
      championId: initialPlayers[0].id
    });

    return initialPlayers;
  }, []);

  const updatePlayers = useCallback((updatedPlayers: Player[], model: tf.LayersModel | null) => {
    if (!model) {
      systemLogger.error('players', 'Model not available for player update');
      return;
    }

    const validPlayers = updatedPlayers.every(player => 
      player.weights && player.weights.length === 17
    );

    if (!validPlayers) {
      systemLogger.error('players', 'Error: Players with incorrect number of weights');
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
      systemLogger.log('player', `New champion: Player #${newChampion.id}`, {
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