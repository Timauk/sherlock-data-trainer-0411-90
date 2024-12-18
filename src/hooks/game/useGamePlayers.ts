import { useState, useCallback } from 'react';
import { Player } from '@/types/gameTypes';
import { systemLogger } from '@/utils/logging/systemLogger';
import * as tf from '@tensorflow/tfjs';

/**
 * Hook responsável pela gestão dos jogadores no sistema
 * 
 * Funcionalidades principais:
 * - Inicialização dos jogadores com pesos aleatórios
 * - Atualização do estado dos jogadores
 * - Gerenciamento do campeão atual
 * - Conexão com o modelo de IA
 */
export const useGamePlayers = () => {
  // Estado local para lista de jogadores e campeão atual
  const [players, setPlayers] = useState<Player[]>([]);
  const [champion, setChampion] = useState<Player | null>(null);

  /**
   * Inicializa um conjunto de jogadores com pesos aleatórios
   * @param numPlayers Número de jogadores a serem criados
   */
  const initializePlayers = useCallback((numPlayers: number = 6) => {
    console.log('useGamePlayers - Iniciando criação dos jogadores:', { numPlayers });
    systemLogger.log('initialization', 'Iniciando criação dos jogadores', {
      numPlayers,
      timestamp: new Date().toISOString()
    });
    
    // Cria array de jogadores com pesos aleatórios
    const initialPlayers: Player[] = Array.from({ length: numPlayers }, (_, index) => {
      const weights = Array.from({ length: 13072 }, () => {
        const baseWeight = Math.floor(Math.random() * 1001);
        return baseWeight;
      });
      
      // Estrutura base do jogador
      const player: Player = {
        id: index + 1,
        score: 0,
        predictions: [], // Previsões iniciam vazias
        weights, // Pesos aleatórios gerados
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

    console.log('useGamePlayers - Jogadores criados:', initialPlayers);
    setChampion(initialPlayers[0]); // Define primeiro jogador como campeão inicial
    setPlayers(initialPlayers);

    systemLogger.log('initialization', 'Jogadores criados com sucesso', {
      totalPlayers: initialPlayers.length,
      championId: initialPlayers[0].id
    });

    return initialPlayers;
  }, []);

  /**
   * Atualiza o estado dos jogadores com base no modelo de IA
   * @param updatedPlayers Lista de jogadores a serem atualizados
   * @param model Modelo de IA treinado
   */
  const updatePlayers = useCallback((updatedPlayers: Player[], model: tf.LayersModel | null) => {
    console.log('useGamePlayers - Atualizando jogadores:', { 
      totalPlayers: updatedPlayers.length,
      hasModel: !!model 
    });

    // Validação do modelo
    if (!model) {
      console.error('useGamePlayers - Erro: Modelo não disponível');
      systemLogger.error('players', 'Modelo não disponível para atualização dos jogadores');
      return;
    }

    // Validação dos pesos dos jogadores
    const validPlayers = updatedPlayers.every(player => 
      player.weights && player.weights.length === 13072
    );

    if (!validPlayers) {
      console.error('useGamePlayers - Erro: Jogadores com número incorreto de pesos');
      systemLogger.error('players', 'Erro: Jogadores com número incorreto de pesos');
      return;
    }

    // Atualiza conexão com modelo para cada jogador
    const playersWithModelConnection = updatedPlayers.map(player => ({
      ...player,
      modelConnection: {
        ...player.modelConnection,
        lastUpdate: new Date().toISOString()
      }
    }));

    setPlayers(playersWithModelConnection);
    
    // Atualiza campeão se necessário
    const newChampion = playersWithModelConnection.reduce((prev, current) => 
      current.score > prev.score ? current : prev
    );
    
    if (!champion || newChampion.score > champion.score) {
      console.log('useGamePlayers - Novo campeão:', newChampion);
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