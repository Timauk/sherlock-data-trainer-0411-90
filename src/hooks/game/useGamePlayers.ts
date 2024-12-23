import { useState, useCallback } from 'react';
import { Player } from '@/types/gameTypes';
import { systemLogger } from '@/utils/logging/systemLogger';
import { usePlayerPredictions } from './usePlayerPredictions';
import { PLAYER_BASE_WEIGHTS } from '@/utils/constants';
import * as tf from '@tensorflow/tfjs';

export const useGamePlayers = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [champion, setChampion] = useState<Player | null>(null);
  const { generatePrediction } = usePlayerPredictions();

  const initializePlayers = useCallback((numPlayers: number = 10) => {
    try {
      systemLogger.log('initialization', 'Iniciando criação dos jogadores', {
        numPlayers,
        timestamp: new Date().toISOString()
      });
      
      const initialPlayers: Player[] = Array.from({ length: numPlayers }, (_, index) => {
        // Criar pesos personalizados para cada jogador
        const weights = Object.values(PLAYER_BASE_WEIGHTS).map(baseWeight => {
          const variation = (Math.random() - 0.5) * 0.2; // 20% de variação
          return Math.max(1, Math.round(baseWeight * (1 + variation)));
        });
        
        return {
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
      });

      setChampion(initialPlayers[0]);
      setPlayers(initialPlayers);

      return initialPlayers;
    } catch (error) {
      systemLogger.error('error', 'Erro ao criar jogadores', {
        error,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }, []);

  const updatePlayers = useCallback(async (
    currentPlayers: Player[],
    model: tf.LayersModel,
    inputData: number[]
  ) => {
    try {
      systemLogger.log('players', 'Iniciando atualização dos jogadores', {
        playerCount: currentPlayers.length,
        timestamp: new Date().toISOString()
      });

      const updatedPlayers = await Promise.all(
        currentPlayers.map(async (player) => {
          const predictions = await generatePrediction(player, model, inputData);
          return {
            ...player,
            predictions,
            modelConnection: {
              ...player.modelConnection,
              lastPrediction: predictions,
              lastUpdate: new Date().toISOString()
            }
          };
        })
      );

      setPlayers(updatedPlayers);
      
      // Atualizar campeão se necessário
      const newChampion = updatedPlayers.reduce((prev, current) => 
        current.score > prev.score ? current : prev
      );
      
      if (!champion || newChampion.score > champion.score) {
        setChampion(newChampion);
        systemLogger.log('player', `Novo campeão: Jogador #${newChampion.id}`, {
          score: newChampion.score,
          predictions: newChampion.predictions,
          timestamp: new Date().toISOString()
        });
      }

      return updatedPlayers;
    } catch (error) {
      systemLogger.error('error', 'Erro ao atualizar jogadores', {
        error,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }, [champion, generatePrediction]);

  return {
    players,
    champion,
    setPlayers,
    initializePlayers,
    updatePlayers
  };
};