import * as tf from '@tensorflow/tfjs';

export const createModelArchitecture = () => {
  const model = tf.sequential();
  
  // Input layer ajustado para receber os dados enriquecidos (13072 features)
  model.add(tf.layers.dense({
    units: 256,
    activation: 'relu',
    inputShape: [13072], // Ajustado para o número correto de features
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