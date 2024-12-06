import * as tf from '@tensorflow/tfjs';
import { logger } from '../../src/utils/logging/logger.js';

export function createModelArchitecture() {
  const model = tf.sequential();
  
  // Input layer com normalização
  model.add(tf.layers.dense({ 
    units: 64, 
    activation: 'relu', 
    inputShape: [17],
    kernelInitializer: 'heNormal'
  }));
  model.add(tf.layers.batchNormalization());
  
  // Hidden layer com skip connection
  const hidden = tf.layers.dense({
    units: 32,
    activation: 'relu',
    kernelInitializer: 'heNormal'
  });
  model.add(hidden);
  model.add(tf.layers.batchNormalization());
  
  // Output layer com inicialização apropriada
  model.add(tf.layers.dense({ 
    units: 15, 
    activation: 'softmax', // Mudando para softmax para melhor probabilidade
    kernelInitializer: 'glorotUniform'
  }));

  // Compilação com otimizador mais conservador
  model.compile({
    optimizer: tf.train.adamax(0.0001), // Adamax é mais estável
    loss: 'categoricalCrossentropy', // Mais apropriado para classificação multi-label
    metrics: ['accuracy']
  });

  logger.info('Novo modelo criado', {
    layers: model.layers.length,
    parameters: model.countParams()
  });

  return model;
}