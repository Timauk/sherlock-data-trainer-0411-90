import { Player } from '../types/gameTypes';

export const createOffspring = (parent1: Player, parent2: Player, generation: number): Player => {
  // Crossover dos pesos
  const childWeights = parent1.weights.map((weight, index) => {
    return Math.random() > 0.5 ? weight : parent2.weights[index];
  });

  // Mutação com taxa adaptativa baseada no tamanho da população
  const mutationRate = 0.1 * (1 + (generation / 100)); // Taxa aumenta gradualmente com as gerações
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
    niche: Math.random() < 0.5 ? parent1.niche : parent2.niche // Herda o nicho de um dos pais
  };
};

export const selectBestPlayers = (players: Player[]): Player[] => {
  // Seleciona os 10 melhores jogadores (50% da população)
  return [...players]
    .sort((a, b) => b.fitness - a.fitness)
    .slice(0, Math.ceil(players.length / 2));
};