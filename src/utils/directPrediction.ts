import * as tf from '@tensorflow/tfjs';
import { systemLogger } from './logging/systemLogger';

export async function generateDirectPredictions(
  model: tf.LayersModel,
  lastConcursoNumbers: number[],
  count: number = 10
): Promise<number[][]> {
  try {
    const predictions: number[][] = [];
    
    for (let i = 0; i < count; i++) {
      const inputTensor = tf.tensor2d([lastConcursoNumbers]);
      const prediction = model.predict(inputTensor) as tf.Tensor;
      const probabilities = Array.from(await prediction.data());
      
      // Converte probabilidades em números de 1-25 sem repetição
      const numbers = new Set<number>();
      const sortedProbs = probabilities
        .map((prob, idx) => ({ prob, num: idx + 1 }))
        .sort((a, b) => b.prob - a.prob);
        
      for (const item of sortedProbs) {
        if (numbers.size < 15) {
          numbers.add(item.num);
        }
      }
      
      predictions.push(Array.from(numbers).sort((a, b) => a - b));
      
      inputTensor.dispose();
      prediction.dispose();
    }
    
    systemLogger.log('prediction', 'Previsões diretas geradas', {
      count: predictions.length,
      firstPrediction: predictions[0]
    });
    
    return predictions;
  } catch (error) {
    systemLogger.error('prediction', 'Erro ao gerar previsões diretas', { error });
    throw error;
  }
}