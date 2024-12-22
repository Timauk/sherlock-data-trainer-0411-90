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
    
    // Input layer - Reduzido para aceitar apenas os 15 números do jogo anterior
    model.add(tf.layers.dense({
      units: 128,
      activation: 'relu',
      inputShape: [15], // Apenas os 15 números do jogo anterior
      kernelInitializer: 'heNormal',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
    }));
    
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.dropout({ rate: 0.2 }));
    
    // Hidden layer 1 - Processamento de padrões de baixo nível
    model.add(tf.layers.dense({
      units: 256,
      activation: 'relu',
      kernelInitializer: 'heNormal',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
    }));
    
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.dropout({ rate: 0.3 }));
    
    // Hidden layer 2 - Processamento de padrões de alto nível
    model.add(tf.layers.dense({
      units: 128,
      activation: 'relu',
      kernelInitializer: 'heNormal',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
    }));
    
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.dropout({ rate: 0.2 }));
    
    // Output layer - Probabilidades para cada número de 1 a 25
    model.add(tf.layers.dense({
      units: 25,
      activation: 'sigmoid', // Sigmoid para probabilidades independentes
      kernelInitializer: 'glorotNormal'
    }));

    // Compile model com binary crossentropy para cada número
    model.compile({
      optimizer: tf.train.adam(0.0005), // Learning rate reduzido para maior estabilidade
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    // Log detailed model information
    const modelSummary = {
      layers: model.layers.length,
      totalParams: model.countParams(),
      inputShape: model.inputs[0].shape,
      outputShape: model.outputs[0].shape,
      layerDetails: model.layers.map(layer => ({
        name: layer.name,
        className: layer.getClassName(),
        outputShape: layer.outputShape,
        params: layer.countParams(),
        config: layer.getConfig()
      })),
      optimizer: model.optimizer.getConfig(),
      loss: model.loss,
      metrics: model.metrics
    };

    systemLogger.log('model', 'Modelo compilado com sucesso', modelSummary);
    
    // Log memory usage after model creation
    const memoryInfo = tf.memory();
    systemLogger.log('model', 'Uso de memória após criação do modelo', {
      numTensors: memoryInfo.numTensors,
      numDataBuffers: memoryInfo.numDataBuffers,
      byteSize: memoryInfo.numBytes / (1024 * 1024), // Convert to MB
      unreliable: memoryInfo.unreliable,
      reasons: memoryInfo.reasons
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