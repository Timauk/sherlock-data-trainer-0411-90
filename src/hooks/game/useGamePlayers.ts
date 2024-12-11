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
      // Inicializa pesos com valores significativos entre 0.1 e 1
      const weights = Array.from({ length: 17 }, (_, weightIndex) => {
        const baseWeight = 0.1 + Math.random() * 0.9;
        
        // Ajusta pesos baseado em sua função
        switch(weightIndex) {
          case 0: // Aprendizado
            return baseWeight * 1.2;
          case 1: // Adaptabilidade
            return baseWeight * 1.1;
          case 2: // Memória
            return baseWeight * 1.15;
          case 3: // Intuição
            return baseWeight * 1.25;
          default:
            return baseWeight;
        }
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
        weights: weights.slice(0, 5),
        timestamp: new Date().toISOString()
      });

      return player;
    });

    setChampion(initialPlayers[0]);
    setPlayers(initialPlayers);

    systemLogger.log('initialization', 'Jogadores criados com sucesso', {
      totalPlayers: initialPlayers.length,
      championId: initialPlayers[0].id,
      sampleWeights: initialPlayers[0].weights.slice(0, 5),
      timestamp: new Date().toISOString()
    });

    return initialPlayers;
  }, []);

  const updatePlayers = useCallback((updatedPlayers: Player[]) => {
    systemLogger.log('players', 'Atualizando estado dos jogadores', {
      totalPlayers: updatedPlayers.length,
      timestamp: new Date().toISOString()
    });

    setPlayers(updatedPlayers);
    
    // Atualiza o campeão (jogador com maior pontuação)
    const newChampion = updatedPlayers.reduce((prev, current) => 
      current.score > prev.score ? current : prev
    );
    
    if (!champion || newChampion.score > champion.score) {
      setChampion(newChampion);
      systemLogger.log('player', `Novo campeão: Jogador #${newChampion.id}`, {
        score: newChampion.score,
        fitness: newChampion.fitness,
        weights: newChampion.weights.slice(0, 5),
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