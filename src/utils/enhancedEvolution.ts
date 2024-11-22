import { Player } from '../types/gameTypes';

export const calculateFitness = (player: Player, boardNumbers: number[]): number => {
  const matches = player.predictions.filter(num => boardNumbers.includes(num)).length;
  const consistencyBonus = calculateConsistencyBonus(player);
  const adaptabilityScore = calculateAdaptabilityScore(player);
  const generationBonus = Math.log1p(player.generation) * 0.1; // Bônus pequeno por sobrevivência
  
  return matches + (consistencyBonus * 0.2) + (adaptabilityScore * 0.1) + generationBonus;
};

const calculateConsistencyBonus = (player: Player): number => {
  if (player.predictions.length < 2) return 0;
  
  let consistentPredictions = 0;
  for (let i = 1; i < player.predictions.length; i++) {
    const prev = player.predictions[i - 1];
    const curr = player.predictions[i];
    
    if (Array.isArray(prev) && Array.isArray(curr)) {
      const intersection = prev.filter(num => curr.includes(num));
      if (intersection.length >= 10) consistentPredictions++;
    }
  }
  
  return (consistentPredictions / (player.predictions.length - 1)) * 5;
};

const calculateAdaptabilityScore = (player: Player): number => {
  if (player.predictions.length < 5) return 0;
  
  const recentPredictions = player.predictions.slice(-5);
  if (!recentPredictions.every(pred => Array.isArray(pred))) return 0;
  
  const uniqueNumbers = new Set(recentPredictions.flat());
  
  // Recompensa cobertura de números diferentes (adaptabilidade)
  return (uniqueNumbers.size / (25 * 0.6)) * 5;
};

export const createMutatedClone = (player: Player, mutationRate: number = 0.1): Player => {
  const mutatedWeights = player.weights.map(weight => {
    if (Math.random() < mutationRate) {
      const mutation = (Math.random() - 0.5) * 0.2;
      return weight * (1 + mutation);
    }
    return weight;
  });

  return {
    ...player,
    id: Math.random(),
    score: 0,
    predictions: [],
    weights: mutatedWeights,
    fitness: 0,
    generation: player.generation + 1
  };
};

export const crossoverPlayers = (parent1: Player, parent2: Player): Player => {
  // Crossover com média ponderada pelo fitness
  const parent1Fitness = parent1.fitness || 0.1;
  const parent2Fitness = parent2.fitness || 0.1;
  const totalFitness = parent1Fitness + parent2Fitness;
  
  const childWeights = parent1.weights.map((weight, index) => {
    const weight1Contribution = (parent1Fitness / totalFitness) * weight;
    const weight2Contribution = (parent2Fitness / totalFitness) * parent2.weights[index];
    return weight1Contribution + weight2Contribution;
  });

  return {
    id: Math.random(),
    score: 0,
    predictions: [],
    weights: childWeights,
    fitness: 0,
    generation: Math.max(parent1.generation, parent2.generation) + 1
  };
};