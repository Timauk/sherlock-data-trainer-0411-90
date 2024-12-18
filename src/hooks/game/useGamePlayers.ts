import { useState, useCallback } from 'react';
import { Player } from '@/types/gameTypes';
import { gameLogger } from '@/utils/logging/gameLogger';
import { PredictionService } from '@/services/predictionService';
import { useToast } from "@/hooks/use-toast";
import * as tf from '@tensorflow/tfjs';

/**
 * Hook para gerenciar o estado e comportamento dos jogadores
 */
export const useGamePlayers = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [champion, setChampion] = useState<Player | null>(null);
  const { toast } = useToast();

  /**
   * Inicializa jogadores com pesos aleatórios
   */
  const initializePlayers = useCallback((numPlayers: number = 10) => {
    try {
      gameLogger.logPlayerEvent(0, 'Iniciando criação de jogadores', { numPlayers });
      
      const initialPlayers: Player[] = Array.from({ length: numPlayers }, (_, index) => {
        // Reduzindo número de pesos para teste
        const weights = Array.from({ length: 100 }, () => Math.random());
        
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

      gameLogger.logPlayerEvent(0, 'Jogadores criados com sucesso', {
        count: initialPlayers.length
      });

      toast({
        title: "Jogadores Inicializados",
        description: `${numPlayers} jogadores foram criados com sucesso!`
      });

      return initialPlayers;
    } catch (error) {
      gameLogger.logGameError(error as Error, 'initializePlayers');
      toast({
        title: "Erro na Inicialização",
        description: "Falha ao criar jogadores",
        variant: "destructive"
      });
      return [];
    }
  }, [toast]);

  /**
   * Atualiza jogadores com novas predições do modelo
   */
  const updatePlayers = useCallback(async (
    currentPlayers: Player[],
    model: tf.LayersModel | null
  ) => {
    if (!model) {
      gameLogger.logGameError(
        new Error('Modelo não disponível'),
        'updatePlayers'
      );
      return;
    }

    try {
      const updatedPlayers = await PredictionService.generateBatchPredictions(
        currentPlayers,
        model
      );

      setPlayers(updatedPlayers);
      
      // Atualizar campeão se necessário
      const newChampion = updatedPlayers.reduce((prev, current) => 
        current.score > prev.score ? current : prev
      );
      
      if (!champion || newChampion.score > champion.score) {
        setChampion(newChampion);
        gameLogger.logPlayerEvent(newChampion.id, 'Novo campeão', {
          score: newChampion.score,
          fitness: newChampion.fitness
        });

        toast({
          title: "Novo Campeão!",
          description: `Jogador #${newChampion.id} é o novo líder!`
        });
      }
    } catch (error) {
      gameLogger.logGameError(error as Error, 'updatePlayers');
      toast({
        title: "Erro na Atualização",
        description: "Falha ao atualizar jogadores",
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