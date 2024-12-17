import { Player, ModelVisualization } from '@/types/gameTypes';
import { systemLogger } from '@/utils/logging/systemLogger';
import * as tf from '@tensorflow/tfjs';

export async function makePrediction(
  model: tf.LayersModel,
  inputData: number[],
  weights: number[],
  config: { lunarPhase: string; patterns: any; lunarPatterns: any },
  extraData?: { numbers: number[][]; dates: Date[] }
): Promise<number[]> {
  try {
    const inputTensor = tf.tensor2d([inputData]);
    const rawPredictions = await model.predict(inputTensor) as tf.Tensor;
    const probabilities = Array.from(await rawPredictions.data());
    
    // Apply player weights
    const weightedProbs = probabilities.map((prob, i) => ({
      number: i + 1,
      probability: prob * weights[i % weights.length]
    }));

    // Sort by probability
    weightedProbs.sort((a, b) => b.probability - a.probability);

    // Select 15 unique numbers
    const selectedNumbers = new Set<number>();
    let index = 0;
    
    while (selectedNumbers.size < 15 && index < weightedProbs.length) {
      const num = weightedProbs[index].number;
      if (num >= 1 && num <= 25) {
        selectedNumbers.add(num);
      }
      index++;
    }

    // Convert to array and sort
    const result = Array.from(selectedNumbers).sort((a, b) => a - b);

    // Cleanup
    inputTensor.dispose();
    rawPredictions.dispose();

    // Feedback for learning
    const feedback = {
      selectedNumbers: result,
      weights: weights,
      probability: weightedProbs.filter(wp => result.includes(wp.number))
                              .reduce((sum, wp) => sum + wp.probability, 0) / 15
    };

    systemLogger.log('prediction', 'Prediction feedback', {
      feedback,
      timestamp: new Date().toISOString()
    });

    return result;
  } catch (error) {
    systemLogger.error('prediction', 'Error making prediction', { error });
    throw error;
  }
}