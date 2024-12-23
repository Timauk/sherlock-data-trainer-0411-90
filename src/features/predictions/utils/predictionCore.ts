import * as tf from '@tensorflow/tfjs';
import { Player } from '@/types/gameTypes';
import { systemLogger } from '@/utils/logging/systemLogger';
import { PredictionResult } from '../types';

export const generateCorePredictions = async (
  model: tf.LayersModel,
  inputData: number[]
): Promise<number[]> => {
  try {
    const inputTensor = tf.tensor2d([inputData]);
    const prediction = model.predict(inputTensor) as tf.Tensor;
    const probabilities = Array.from(await prediction.data());
    
    inputTensor.dispose();
    prediction.dispose();
    
    return probabilities;
  } catch (error) {
    systemLogger.error('prediction', 'Error in core prediction generation', { error });
    throw error;
  }
};