import * as tf from '@tensorflow/tfjs';

export const createModelArchitecture = () => {
  const model = tf.sequential();
  
  // Input layer - adjusted to match our actual input shape
  model.add(tf.layers.dense({
    units: 256,
    activation: 'relu',
    inputShape: [15], // Changed to match our input shape
    kernelInitializer: 'heNormal',
    kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
  }));
  
  model.add(tf.layers.batchNormalization());
  model.add(tf.layers.dropout({ rate: 0.3 }));
  
  // Hidden layers
  model.add(tf.layers.dense({
    units: 128,
    activation: 'relu',
    kernelInitializer: 'heNormal',
    kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
  }));
  
  model.add(tf.layers.batchNormalization());
  model.add(tf.layers.dropout({ rate: 0.2 }));
  
  // Output layer
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