import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../logging/systemLogger';

export const createEnhancedModel = (optimizer: string = 'adam', learningRate: number = 0.001) => {
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

  // Configurar otimizador baseado no parâmetro
  let optimizerInstance;
  switch (optimizer) {
    case 'sgd':
      optimizerInstance = tf.train.sgd(learningRate);
      break;
    case 'rmsprop':
      optimizerInstance = tf.train.rmsprop(learningRate);
      break;
    case 'adam':
    default:
      optimizerInstance = tf.train.adam(learningRate);
  }

  model.compile({
    optimizer: optimizerInstance,
    loss: 'binaryCrossentropy',
    metrics: ['accuracy']
  });

  return model;
};