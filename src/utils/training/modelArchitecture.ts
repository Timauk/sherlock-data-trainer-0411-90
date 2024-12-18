import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../logging/systemLogger';

export const createEnhancedModel = () => {
  const model = tf.sequential();

  // Input layer para features combinadas
  model.add(tf.layers.dense({
    units: 256,
    activation: 'relu',
    inputShape: [22], // 15 base + 4 temporal + 1 lunar + 2 statistical
    kernelInitializer: 'heNormal',
    kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
  }));

  model.add(tf.layers.batchNormalization());
  model.add(tf.layers.dropout({ rate: 0.3 }));

  // Hidden layers
  model.add(tf.layers.dense({
    units: 128,
    activation: 'relu',
    kernelInitializer: 'heNormal'
  }));

  model.add(tf.layers.batchNormalization());
  model.add(tf.layers.dropout({ rate: 0.2 }));

  // Output layer (15 números)
  model.add(tf.layers.dense({
    units: 15,
    activation: 'sigmoid',
    kernelInitializer: 'glorotNormal'
  }));

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'binaryCrossentropy',
    metrics: ['accuracy']
  });

  return model;
};