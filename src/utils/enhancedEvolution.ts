import { Player } from '../types/gameTypes';

export const calculateFitness = (player: Player, boardNumbers: number[]): number => {
  const matches = player.predictions.filter(num => boardNumbers.includes(num)).length;
  const consistencyBonus = calculateConsistencyBonus(player);
  const adaptabilityScore = calculateAdaptabilityScore(player);
  const nicheBonus = calculateNicheBonus(player, boardNumbers);
  const specialization = calculateSpecialization(player);
  
  // Aumentando o peso do nicho na pontuação final
  return (matches * 1.5) + (consistencyBonus * 0.2) + (adaptabilityScore * 0.1) + 
         (nicheBonus * 2.0) + (specialization * 1.5);
};

const calculateConsistencyBonus = (player: Player): number => {
  if (player.predictions.length < 2) return 0;
  
  let consistentPredictions = 0;
  for (let i = 1; i < player.predictions.length; i++) {
    const prev = player.predictions[i - 1];
    const curr = player.predictions[i];
    
    if (Array.isArray(prev) && Array.isArray(curr)) {
      const intersection = (prev as number[]).filter(num => (curr as number[]).includes(num));
      if (intersection.length >= 10) consistentPredictions++;
    }
  }
  
  return (consistentPredictions / (player.predictions.length - 1)) * 5;
};

const calculateAdaptabilityScore = (player: Player): number => {
  if (player.predictions.length < 5) return 0;
  
  const recentPredictions = player.predictions.slice(-5);
  if (!recentPredictions.every(pred => Array.isArray(pred))) return 0;
  
  const validPredictions = recentPredictions.map(pred => pred as number[]);
  const uniqueNumbers = new Set(validPredictions.flat());
  
  return (uniqueNumbers.size / (25 * 0.6)) * 5;
};

const calculateNicheBonus = (player: Player, boardNumbers: number[]): number => {
  switch (player.niche) {
    case 0: // Pares
      const evenNumbers = boardNumbers.filter(n => n % 2 === 0);
      const evenPredictions = player.predictions.filter(n => n % 2 === 0);
      return (evenNumbers.length * 0.8) + (evenPredictions.length * 0.5);
      
    case 1: // Ímpares
      const oddNumbers = boardNumbers.filter(n => n % 2 !== 0);
      const oddPredictions = player.predictions.filter(n => n % 2 !== 0);
      return (oddNumbers.length * 0.8) + (oddPredictions.length * 0.5);
      
    case 2: // Sequências
      const sequences = findSequences(boardNumbers);
      const predictionSequences = findSequences(player.predictions);
      return (sequences * 1.2) + (predictionSequences * 0.8);
      
    case 3: // Geral
      // Bonus menor para generalistas para incentivar especialização
      return 0.3;
  }
  return 0;
};

const calculateSpecialization = (player: Player): number => {
  // Recompensa por manter-se no mesmo nicho por várias gerações
  return Math.min(player.age / 10, 5); // Máximo de 5 pontos de bonus
};

const findSequences = (numbers: number[]): number => {
  let sequences = 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  
  for (let i = 0; i < sorted.length - 2; i++) {
    if (sorted[i + 1] === sorted[i] + 1 && sorted[i + 2] === sorted[i] + 2) {
      sequences++;
    }
  }
  
  return sequences;
};

export const createMutatedClone = (player: Player, mutationRate: number = 0.1): Player => {
  // Aumenta a taxa de mutação para jogadores mais velhos
  const adjustedMutationRate = mutationRate * (1 + (player.age / 20));
  
  const mutatedWeights = player.weights.map(weight => {
    if (Math.random() < adjustedMutationRate) {
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
    generation: player.generation + 1,
    age: 0,
    // Reduz a chance de mudar de nicho para promover especialização
    niche: Math.random() < 0.05 ? Math.floor(Math.random() * 4) : player.niche
  };
};

export const crossoverPlayers = (parent1: Player, parent2: Player): Player => {
  const crossoverPoint = Math.floor(Math.random() * parent1.weights.length);
  const childWeights = [
    ...parent1.weights.slice(0, crossoverPoint),
    ...parent2.weights.slice(crossoverPoint)
  ];

  // Favorece herdar o nicho do pai com maior fitness
  const preferredNiche = parent1.fitness > parent2.fitness ? 
    parent1.niche : parent2.niche;

  return {
    id: Math.random(),
    score: 0,
    predictions: [],
    weights: childWeights,
    fitness: 0,
    generation: Math.max(parent1.generation, parent2.generation) + 1,
    age: 0,
    niche: Math.random() < 0.8 ? preferredNiche : Math.floor(Math.random() * 4)
  };
};