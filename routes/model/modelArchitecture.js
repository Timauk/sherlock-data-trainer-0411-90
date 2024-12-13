import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../../src/utils/logging/systemLogger.js';

export const createModelArchitecture = () => {
  try {
    systemLogger.log('model', 'Iniciando criação da arquitetura do modelo');
    
    const model = tf.sequential();
    
    // Camada de entrada
    model.add(tf.layers.dense({
      units: 256,
      activation: 'relu',
      inputShape: [13072],
      kernelInitializer: 'heNormal',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
    }));
    
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.dropout({ rate: 0.3 }));
    
    // Camadas intermediárias
    model.add(tf.layers.dense({
      units: 128,
      activation: 'relu',
      kernelInitializer: 'heNormal',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
    }));
    
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.dropout({ rate: 0.2 }));
    
    // Camada de saída
    model.add(tf.layers.dense({
      units: 15,
      activation: 'sigmoid',
      kernelInitializer: 'glorotNormal'
    }));

    systemLogger.log('model', 'Arquitetura do modelo criada com sucesso', {
      layers: model.layers.length,
      inputShape: model.inputs[0].shape,
      outputShape: model.outputs[0].shape
    });
    
    return model;
  } catch (error) {
    systemLogger.error('model', 'Erro ao criar modelo', { error });
    throw error;
  }
};