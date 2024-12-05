import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../logging/systemLogger';

export class ModelInitializer {
  static async initializeModel(): Promise<tf.LayersModel> {
    try {
      // Check available backends
      const backends = tf.engine().backendNames();
      systemLogger.log('model', 'Backends disponíveis:', { backends });

      // Try to use WebGL if available
      if (backends.includes('webgl')) {
        await tf.setBackend('webgl');
        systemLogger.log('model', 'Usando backend WebGL');
      } else {
        await tf.setBackend('cpu');
        systemLogger.log('model', 'Usando backend CPU (WebGL não disponível)');
      }

      // Create model with architecture matching the saved weights
      const model = tf.sequential();
      
      // Input layer
      model.add(tf.layers.dense({
        units: 256,
        activation: 'relu',
        inputShape: [15],
        kernelInitializer: 'glorotNormal'
      }));
      
      // Add batch normalization and dropout
      model.add(tf.layers.batchNormalization());
      model.add(tf.layers.dropout({ rate: 0.3 }));
      
      // Hidden layer
      model.add(tf.layers.dense({
        units: 128,
        activation: 'relu',
        kernelInitializer: 'glorotNormal'
      }));
      
      // Add batch normalization
      model.add(tf.layers.batchNormalization());
      
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

      // Log model structure for debugging
      systemLogger.log('model', 'Modelo neural inicializado com sucesso', {
        backend: tf.getBackend(),
        layers: model.layers.length,
        layerConfig: model.layers.map(layer => ({
          className: layer.getClassName(),
          config: layer.getConfig()
        })),
        modelSummary: model.summary()
      });

      return model;
    } catch (error) {
      systemLogger.error('model', 'Erro ao inicializar modelo', {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        backend: tf.getBackend(),
        memoryInfo: tf.memory()
      });
      throw error;
    }
  }
}