import * as tf from '@tensorflow/tfjs';

export interface ModelConfig {
  epochs: number;
}

export async function updateModel(
  model: tf.LayersModel,
  trainingData: number[][],
  config: ModelConfig
): Promise<tf.LayersModel> {
  const xs = tf.tensor2d(trainingData.map(row => row.slice(0, -15)));
  const ys = tf.tensor2d(trainingData.map(row => row.slice(-15)));

  await model.fit(xs, ys, {
    epochs: config.epochs,
    batchSize: 32,
  });

  xs.dispose();
  ys.dispose();

  return model;
}