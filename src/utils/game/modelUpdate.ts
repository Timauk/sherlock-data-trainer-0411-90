import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../logging/systemLogger';

export async function updateModel(
  model: tf.LayersModel,
  trainingData: number[][],
  onProgress: (message: string) => void
): Promise<void> {
  console.log('Starting model update:', {
    trainingDataSize: trainingData.length,
    modelLayers: model.layers.length,
    inputShape: model.inputs[0].shape,
    outputShape: model.outputs[0].shape
  });

  try {
    const xs = tf.tensor2d(trainingData.map(row => row.slice(0, -15)));
    const ys = tf.tensor2d(trainingData.map(row => row.slice(-15)));

    console.log('Training tensors created:', {
      xShape: xs.shape,
      yShape: ys.shape,
      xSample: Array.from(xs.dataSync()).slice(0, 5),
      ySample: Array.from(ys.dataSync()).slice(0, 5)
    });

    await model.fit(xs, ys, {
      epochs: 10,
      batchSize: 32,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch + 1} complete:`, logs);
          onProgress(`Epoch ${epoch + 1}: loss = ${logs?.loss.toFixed(4)}`);
        }
      }
    });

    console.log('Model update complete:', {
      updatedWeights: model.getWeights().map(w => ({
        shape: w.shape,
        sample: Array.from(w.dataSync()).slice(0, 5)
      }))
    });

    xs.dispose();
    ys.dispose();
  } catch (error) {
    console.error('Error updating model:', error);
    systemLogger.error('model', 'Error updating model', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}