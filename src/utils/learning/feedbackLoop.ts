import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../logging/systemLogger';

export async function updateModelWithFeedback(
  model: tf.LayersModel,
  prediction: number[],
  actual: number[],
  weights: number[]
): Promise<void> {
  try {
    const matches = prediction.filter(n => actual.includes(n)).length;
    const reward = calculateReward(matches);
    
    // Ajustar pesos baseado no desempenho
    const adjustedWeights = weights.map(w => w * (1 + (reward * 0.1)));

    systemLogger.log('learning', 'Feedback aplicado', {
      matches,
      reward,
      weightAdjustment: reward * 0.1
    });

    return adjustedWeights;
  } catch (error) {
    systemLogger.error('learning', 'Erro no feedback', { error });
    throw error;
  }
}

function calculateReward(matches: number): number {
  // Recompensa exponencial baseada no número de acertos
  return Math.pow(1.5, matches - 10);
}