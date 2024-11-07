import { useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import { Player } from '@/types/gameTypes';
import { systemLogger } from '@/utils/logging/systemLogger';
import { selectBestPlayers } from '@/utils/evolutionSystem';
import { createMutatedClone, crossoverPlayers } from '@/utils/enhancedEvolution';

export const useEvolutionLogic = (
  players: Player[],
  setPlayers: (players: Player[]) => void,
  generation: number,
  setGeneration: (gen: number) => void,
  setEvolutionData: (data: any) => void,
  trainedModel: tf.LayersModel | null,
  trainingData: number[][],
  csvData: number[][],
  concursoNumber: number,
  championData: { player: Player; trainingData: number[][] } | undefined,
  setChampionData: (data: { player: Player; trainingData: number[][] }) => void,
) => {
  return useCallback(async () => {
    // Seleciona os melhores jogadores mantendo diversidade
    const bestPlayers = selectBestPlayers(players);
    
    // Mantém registro do melhor jogador
    const champion = bestPlayers[0];
    
    if (concursoNumber >= csvData.length - 1) {
      // Fim do ciclo - Evolução mais conservadora
      const newPopulation: Player[] = [];
      
      // Mantém os 20% melhores jogadores
      const eliteCount = Math.max(1, Math.floor(players.length * 0.2));
      const elite = bestPlayers.slice(0, eliteCount);
      newPopulation.push(...elite);
      
      // Cria novos jogadores através de crossover e mutação
      while (newPopulation.length < players.length) {
        const parent1 = elite[Math.floor(Math.random() * elite.length)];
        const parent2 = elite[Math.floor(Math.random() * elite.length)];
        
        if (Math.random() < 0.7) {
          // 70% chance de crossover
          const child = crossoverPlayers(parent1, parent2);
          newPopulation.push(child);
        } else {
          // 30% chance de mutação
          const clone = createMutatedClone(parent1, 0.2);
          newPopulation.push(clone);
        }
      }
      
      setPlayers(newPopulation);
      
      systemLogger.log('player', 
        `Ciclo completo - Nova geração criada com ${newPopulation.length} jogadores`);
      
      if (trainedModel && championData) {
        try {
          // Atualiza dados do campeão
          setChampionData({
            player: champion,
            trainingData: trainingData
          });
          
        } catch (error) {
          systemLogger.log('system', 
            `Erro ao atualizar dados do campeão: ${error}`);
        }
      }
    } else {
      // Durante o ciclo - Evolução mais gradual
      const updatedPlayers = bestPlayers.map(player => ({
        ...player,
        generation: generation + 1
      }));
      
      setPlayers(updatedPlayers);
    }

    setGeneration(generation + 1);
    
    setEvolutionData(prev => [
      ...prev,
      ...players.map(player => ({
        generation,
        playerId: player.id,
        score: player.score,
        fitness: player.fitness
      }))
    ]);

    if (bestPlayers.length > 0) {
      systemLogger.log('player', 
        `Melhor jogador da geração ${generation}: Score ${bestPlayers[0].score}`);
    }
  }, [players, setPlayers, generation, setGeneration, setEvolutionData, trainedModel, 
      trainingData, csvData.length, concursoNumber, championData, setChampionData]);
};