import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../logging/systemLogger';

export const updateModel = async (
  model: tf.LayersModel,
  trainingData: number[][],
  addLog: (message: string) => void
): Promise<void> => {
  try {
    const xs = tf.tensor2d(trainingData.map(row => row.slice(0, -15)));
    const ys = tf.tensor2d(trainingData.map(row => row.slice(-15)));

    await model.fit(xs, ys, {
      epochs: 5,
      batchSize: 32,
      shuffle: true
    });

    xs.dispose();
    ys.dispose();

    systemLogger.log('model', 'Model updated successfully', {
      trainingDataSize: trainingData.length
    });
  } catch (error) {
    systemLogger.error('model', 'Failed to update model', { error });
    throw error;
  }
};