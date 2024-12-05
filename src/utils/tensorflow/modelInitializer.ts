import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../logging/systemLogger';

export class ModelInitializer {
  static async initializeModel(): Promise<tf.LayersModel> {
    try {
      // Check available backends
      const backends = Object.keys(tf.engine().backendNames);
      systemLogger.log('model', 'Backends disponíveis:', { backends });

      // Try to use WebGL if available
      if (backends.includes('webgl')) {
        await tf.setBackend('webgl');
        systemLogger.log('model', 'Usando backend WebGL');
      } else {
        await tf.setBackend('cpu');
        systemLogger.log('model', 'Usando backend CPU (WebGL não disponível)');
      }

      const model = tf.sequential();
      
      model.add(tf.layers.dense({
        units: 128,
        activation: 'relu',
        inputShape: [15]
      }));
      
      model.add(tf.layers.dense({
        units: 64,
        activation: 'relu'
      }));
      
      model.add(tf.layers.dense({
        units: 15,
        activation: 'sigmoid'
      }));

      model.compile({
        optimizer: 'adam',
        loss: 'meanSquaredError',
        metrics: ['accuracy']
      });

      systemLogger.log('model', 'Modelo neural inicializado com sucesso', {
        backend: tf.getBackend(),
        layers: model.layers.length,
        config: model.getConfig()
      });

      return model;
    } catch (error) {
      systemLogger.error('model', 'Erro ao inicializar modelo', {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        backend: tf.getBackend()
      });
      throw error;
    }
  }
}