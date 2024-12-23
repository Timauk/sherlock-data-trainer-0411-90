import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../../src/utils/logging/systemLogger.js';

export const createModelArchitecture = () => {
  try {
    // Force CPU backend for consistency
    tf.setBackend('cpu');
    
    systemLogger.log('model', 'Iniciando criação da arquitetura do modelo', {
      timestamp: new Date().toISOString(),
      backend: tf.getBackend(),
      memory: tf.memory()
    });
    
    const model = tf.sequential();
    
    // Input layer - Ajustado para 15 números
    model.add(tf.layers.dense({
      units: 128,
      activation: 'relu',
      inputShape: [15],
      kernelInitializer: 'heNormal',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
    }));
    
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.dropout({ rate: 0.2 }));
    
    // Hidden layer 1
    model.add(tf.layers.dense({
      units: 256,
      activation: 'relu',
      kernelInitializer: 'heNormal',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
    }));
    
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.dropout({ rate: 0.3 }));
    
    // Hidden layer 2
    model.add(tf.layers.dense({
      units: 128,
      activation: 'relu',
      kernelInitializer: 'heNormal',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
    }));
    
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.dropout({ rate: 0.2 }));
    
    // Output layer - 25 números possíveis
    model.add(tf.layers.dense({
      units: 25,
      activation: 'sigmoid',
      kernelInitializer: 'glorotNormal'
    }));

    model.compile({
      optimizer: tf.train.adam(0.0005),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    systemLogger.log('model', 'Modelo compilado com sucesso', {
      layers: model.layers.length,
      inputShape: model.inputs[0].shape,
      outputShape: model.outputs[0].shape
    });

    return model;
  } catch (error) {
    systemLogger.error('model', 'Erro ao criar modelo', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};