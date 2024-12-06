import * as tf from '@tensorflow/tfjs';

export const createModelArchitecture = () => {
  const model = tf.sequential();
  
  // Input layer
  model.add(tf.layers.dense({
    units: 64,
    activation: 'relu',
    inputShape: [23], // 7 engineered features + 16 original values
    kernelInitializer: 'heNormal',
    kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
  }));
  
  model.add(tf.layers.batchNormalization());
  model.add(tf.layers.dropout({ rate: 0.2 }));
  
  // Hidden layer
  model.add(tf.layers.dense({
    units: 32,
    activation: 'relu',
    kernelInitializer: 'heNormal',
    kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
  }));
  
  model.add(tf.layers.batchNormalization());
  
  // Output layer
  model.add(tf.layers.dense({
    units: 15,
    activation: 'softmax',
    kernelInitializer: 'glorotNormal'
  }));
  
  model.compile({
    optimizer: tf.train.adam(0.0001),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });
  
  return model;
};