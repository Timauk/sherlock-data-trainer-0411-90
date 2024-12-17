import { Player } from '../types/gameTypes';

export const createOffspring = (parent1: Player, parent2: Player, generation: number): Player => {
  const childWeights = parent1.weights.map((weight, index) => {
    const parentFitness1 = parent1.fitness || 0.1;
    const parentFitness2 = parent2.fitness || 0.1;
    const totalFitness = parentFitness1 + parentFitness2;
    
    const weight1Contribution = (parentFitness1 / totalFitness) * weight;
    const weight2Contribution = (parentFitness2 / totalFitness) * parent2.weights[index];
    
    return weight1Contribution + weight2Contribution;
  });

  const mutationRate = 0.1 * Math.exp(generation / 100);
  const mutatedWeights = childWeights.map(weight => {
    return Math.random() < mutationRate 
      ? weight + (Math.random() - 0.5) * 0.01
      : weight;
  });

  return {
    id: Math.random(),
    score: 0,
    predictions: [],
    weights: mutatedWeights,
    fitness: 0,
    generation: generation + 1,
    modelConnection: {
      lastPrediction: null,
      confidence: 0,
      successRate: 0
    }
  };
};

export const selectBestPlayers = (players: Player[]): Player[] => {
  const sortedPlayers = [...players].sort((a, b) => b.fitness - a.fitness);
  
  // Elitismo: sempre mantém o melhor jogador sem mutação
  const elite = sortedPlayers[0];
  const eliteCopy = {...elite, id: Math.random()};
  
  // Seleciona 50% dos melhores para reprodução
  const selectedPlayers = sortedPlayers.slice(0, Math.ceil(players.length / 2));
  
  // Adiciona o elite no início do array
  return [eliteCopy, ...selectedPlayers];
};