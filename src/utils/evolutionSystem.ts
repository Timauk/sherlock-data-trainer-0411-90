import { Player } from '../types/gameTypes';
import { systemLogger } from './logging/systemLogger';

export const createOffspring = (parent1: Player, parent2: Player, generation: number): Player => {
  const childWeights = parent1.weights.map((weight, index) => {
    return Math.random() > 0.5 ? weight : parent2.weights[index];
  });

  const mutationRate = 0.1 * (1 + (generation / 100));
  const mutatedWeights = childWeights.map(weight => {
    return Math.random() < mutationRate ? weight + (Math.random() - 0.5) * 0.1 : weight;
  });

  return {
    id: Math.random(),
    score: 0,
    predictions: [],
    weights: mutatedWeights,
    fitness: 0,
    generation: generation + 1,
    age: 0,
    niche: Math.random() < 0.5 ? parent1.niche : parent2.niche
  };
};

export const selectBestPlayers = (players: Player[]): Player[] => {
  // Atualiza idade de todos os jogadores antes da seleção
  const updatedPlayers = players.map(player => ({
    ...player,
    age: player.age + 1
  }));

  // Seleciona os 10 melhores jogadores (50% da população)
  return [...updatedPlayers]
    .sort((a, b) => b.fitness - a.fitness)
    .slice(0, Math.ceil(players.length / 2));
};

export const updatePlayerGenerations = (players: Player[], currentGeneration: number): Player[] => {
  return players.map(player => ({
    ...player,
    generation: currentGeneration
  }));
};