/**
 * Hook useGamePlayers
 * 
 * Gerencia o estado e comportamento dos jogadores no sistema.
 * Responsável por:
 * - Inicialização dos jogadores
 * - Atualização de estados
 * - Gerenciamento do campeão
 * - Integração com o modelo de IA
 */
import { useState, useCallback } from 'react';
import { Player } from '@/types/gameTypes';
import { systemLogger } from '@/utils/logging/systemLogger';
import * as tf from '@tensorflow/tfjs';
import { useToast } from "@/hooks/use-toast";

export const useGamePlayers = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [champion, setChampion] = useState<Player | null>(null);
  const { toast } = useToast();

  /**
   * Inicializa um conjunto de jogadores com pesos aleatórios
   * @param numPlayers Número de jogadores a serem criados
   */
  const initializePlayers = useCallback((numPlayers: number = 6) => {
    systemLogger.log('initialization', 'Iniciando criação dos jogadores', {
      numPlayers,
      timestamp: new Date().toISOString()
    });
    
    try {
      const initialPlayers: Player[] = Array.from({ length: numPlayers }, (_, index) => {
        // Reduzindo o tamanho inicial dos pesos para melhor performance
        const weights = Array.from({ length: 1000 }, () => Math.random());
        
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

      systemLogger.log('initialization', 'Jogadores criados com sucesso', {
        totalPlayers: initialPlayers.length,
        samplePlayer: initialPlayers[0]
      });

      setChampion(initialPlayers[0]);
      setPlayers(initialPlayers);

      toast({
        title: "Jogadores Inicializados",
        description: `${numPlayers} jogadores foram criados com sucesso!`
      });

      return initialPlayers;
    } catch (error) {
      systemLogger.error('initialization', 'Erro ao criar jogadores', { error });
      toast({
        title: "Erro na Inicialização",
        description: "Falha ao criar jogadores. Tente novamente.",
        variant: "destructive"
      });
      return [];
    }
  }, [toast]);

  /**
   * Atualiza os jogadores com base no modelo de IA
   * @param updatedPlayers Lista de jogadores a serem atualizados
   * @param model Modelo de IA treinado
   */
  const updatePlayers = useCallback(async (updatedPlayers: Player[], model: tf.LayersModel | null) => {
    if (!model) {
      systemLogger.error('players', 'Modelo não disponível para atualização');
      return;
    }

    try {
      // Gerar previsões para cada jogador
      const updatedPlayersWithPredictions = await Promise.all(
        updatedPlayers.map(async (player) => {
          // Log do processo de previsão
          systemLogger.log('prediction', `Gerando previsão para Jogador #${player.id}`, {
            hasWeights: player.weights?.length > 0,
            currentScore: player.score
          });

          // Criar tensor com os pesos do jogador
          const inputTensor = tf.tensor2d([player.weights]);
          const prediction = model.predict(inputTensor) as tf.Tensor;
          const predictions = Array.from(await prediction.data())
            .map(p => Math.floor(p * 25) + 1)
            .slice(0, 15);

          // Limpar tensores
          inputTensor.dispose();
          prediction.dispose();

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

      setPlayers(updatedPlayersWithPredictions);
      
      // Atualizar campeão se necessário
      const newChampion = updatedPlayersWithPredictions.reduce((prev, current) => 
        current.score > prev.score ? current : prev
      );
      
      if (!champion || newChampion.score > champion.score) {
        setChampion(newChampion);
        systemLogger.log('player', `Novo campeão: Jogador #${newChampion.id}`, {
          score: newChampion.score,
          fitness: newChampion.fitness
        });

        toast({
          title: "Novo Campeão!",
          description: `Jogador #${newChampion.id} é o novo líder com ${newChampion.score} pontos!`
        });
      }
    } catch (error) {
      systemLogger.error('players', 'Erro ao atualizar jogadores', { error });
      toast({
        title: "Erro na Atualização",
        description: "Falha ao atualizar jogadores com o modelo.",
        variant: "destructive"
      });
    }
  }, [champion, toast]);

  return {
    players,
    champion,
    setPlayers,
    initializePlayers,
    updatePlayers
  };
};