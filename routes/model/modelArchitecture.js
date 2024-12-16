import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../../src/utils/logging/systemLogger.js';

export const createModelArchitecture = () => {
  try {
    // Force CPU backend
    tf.setBackend('cpu');
    
    systemLogger.log('model', 'Iniciando criação da arquitetura do modelo', {
      timestamp: new Date().toISOString(),
      backend: tf.getBackend(),
      memory: tf.memory()
    });
    
    const model = tf.sequential();
    
    // Input layer with correct shape
    const inputLayer = tf.layers.dense({
      units: 256,
      activation: 'relu',
      inputShape: [13057], // Match the expected input shape
      kernelInitializer: 'heNormal',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
    });
    
    model.add(inputLayer);
    
    systemLogger.log('model', 'Camada de entrada configurada', {
      inputShape: inputLayer.inputShape,
      units: inputLayer.units,
      activation: inputLayer.activation
    });
    
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.dropout({ rate: 0.3 }));
    
    // Hidden layer
    const hiddenLayer = tf.layers.dense({
      units: 128,
      activation: 'relu',
      kernelInitializer: 'heNormal',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
    });
    
    model.add(hiddenLayer);
    
    systemLogger.log('model', 'Camada intermediária configurada', {
      units: hiddenLayer.units,
      activation: hiddenLayer.activation
    });
    
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.dropout({ rate: 0.2 }));
    
    // Output layer
    const outputLayer = tf.layers.dense({
      units: 15,
      activation: 'sigmoid',
      kernelInitializer: 'glorotNormal'
    });
    
    model.add(outputLayer);
    
    systemLogger.log('model', 'Camada de saída configurada', {
      units: outputLayer.units,
      activation: outputLayer.activation
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    systemLogger.log('model', 'Modelo compilado com sucesso', {
      layers: model.layers.length,
      totalParams: model.countParams(),
      inputShape: model.inputs[0].shape,
      outputShape: model.outputs[0].shape,
      optimizer: model.optimizer.getConfig(),
      loss: model.loss,
      metrics: model.metrics
    });
    
    return model;
  } catch (error) {
    systemLogger.error('model', 'Erro ao criar modelo', { 
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};