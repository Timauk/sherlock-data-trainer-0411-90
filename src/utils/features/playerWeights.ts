import { Player } from '@/types/gameTypes';

export const createPlayerWeights = (playerId: number): number[] => {
  const baseWeights = {
    aprendizadoBase: 308,
    adaptabilidade: 989,
    memoria: 146,
    intuicao: 678,
    precisao: 448,
    consistencia: 619,
    inovacao: 975,
    equilibrio: 573,
    foco: 224
  };

  // Normalizar pesos para soma 1
  const total = Object.values(baseWeights).reduce((a, b) => a + b, 0);
  const normalizedWeights = Object.values(baseWeights).map(w => w / total);

  return normalizedWeights;
};

export const updatePlayerWeights = (
  player: Player,
  performance: number,
  learningRate: number = 0.01
): number[] => {
  return player.weights.map(weight => {
    const adjustment = (performance - 0.5) * learningRate;
    return Math.max(0, Math.min(1, weight + adjustment));
  });
};