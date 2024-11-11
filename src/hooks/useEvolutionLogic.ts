import { useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import { Player } from '@/types/gameTypes';
import { systemLogger } from '@/utils/logging/systemLogger';
import { selectBestPlayers, updatePlayerGenerations } from '@/utils/evolutionSystem';
import { cloneChampion, updateModelWithChampionKnowledge } from '@/utils/playerEvolution';

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
    // Atualiza a idade e geração dos jogadores
    const updatedPlayers = updatePlayerGenerations(players, generation);
    const bestPlayers = selectBestPlayers(updatedPlayers);
    
    // Verifica se completou um ciclo do CSV
    if (concursoNumber >= csvData.length - 1) {
      if (bestPlayers.length > 0) {
        const champion = bestPlayers[0];
        const clones = cloneChampion(champion, players.length);
        setPlayers(clones);
        
        systemLogger.log('player', 
          `Ciclo completo - Clonando campeão #${champion.id} (Score: ${champion.score})`);
        
        if (trainedModel && championData) {
          try {
            await updateModelWithChampionKnowledge(
              trainedModel,
              champion,
              championData.trainingData
            );
            
            setChampionData({
              player: champion,
              trainingData: trainingData
            });

          } catch (error) {
            systemLogger.log('system', 
              `Erro ao atualizar modelo com conhecimento do campeão: ${error}`);
          }
        }
      }
    } else {
      // Durante o ciclo, mantém os melhores jogadores sem clonar
      const newGeneration = bestPlayers.map(player => ({
        ...player,
        generation: generation + 1
      }));
      
      setPlayers(newGeneration);
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