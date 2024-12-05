import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../logging/systemLogger';

export class ModelInitializer {
  static async initializeModel() {
    try {
      systemLogger.log('tensorflow', 'Iniciando configuração do TensorFlow.js', {
        currentBackend: tf.getBackend(),
        availableBackends: tf.engine().registeredBackends
      });

      // Try to initialize with WebGL first
      try {
        await tf.setBackend('webgl');
        await tf.ready();
        systemLogger.log('tensorflow', 'TensorFlow.js inicializado com WebGL', {
          backend: tf.getBackend(),
          memory: tf.memory()
        });
      } catch (error) {
        systemLogger.warn('tensorflow', 'Fallback para CPU', { 
          error,
          reason: error instanceof Error ? error.message : 'Unknown error'
        });
        // Fallback to CPU
        await tf.setBackend('cpu');
        await tf.ready();
      }

      systemLogger.log('tensorflow', 'Criando modelo sequencial');
      const model = tf.sequential();
      
      // Model configuration
      systemLogger.log('tensorflow', 'Configurando camadas do modelo');
      
      model.add(tf.layers.dense({ 
        units: 256, 
        activation: 'relu', 
        inputShape: [17],
        kernelInitializer: 'glorotNormal'
      }));
      
      model.add(tf.layers.dense({ 
        units: 128, 
        activation: 'relu'
      }));
      
      model.add(tf.layers.dense({ 
        units: 15, 
        activation: 'sigmoid'
      }));

      systemLogger.log('tensorflow', 'Compilando modelo', {
        layersCount: model.layers.length,
        totalParams: model.countParams(),
        modelConfig: model.getConfig()
      });

      // Compile the model
      model.compile({ 
        optimizer: tf.train.adam(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });

      systemLogger.log('tensorflow', 'Modelo inicializado com sucesso', {
        backend: tf.getBackend(),
        memory: tf.memory(),
        modelSummary: {
          layers: model.layers.length,
          trainable: model.trainable,
          optimizer: model.optimizer?.constructor.name
        }
      });

      return model;
    } catch (error) {
      systemLogger.error('tensorflow', 'Erro ao inicializar modelo', {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        tfState: {
          backend: tf.getBackend(),
          memory: tf.memory(),
          engineReady: tf.engine().ready
        }
      });
      throw error;
    }
  }
}