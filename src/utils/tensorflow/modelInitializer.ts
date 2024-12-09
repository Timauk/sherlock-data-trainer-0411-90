import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../logging/systemLogger';

export class ModelInitializer {
  static async initializeModel(): Promise<tf.LayersModel> {
    try {
      const backends = tf.engine().backendNames();
      systemLogger.log('model', 'Backends disponíveis:', { backends });

      if (backends.includes('webgl')) {
        await tf.setBackend('webgl');
        systemLogger.log('model', 'Usando backend WebGL');
      } else {
        await tf.setBackend('cpu');
        systemLogger.log('model', 'Usando backend CPU (WebGL não disponível)');
      }

      const model = tf.sequential();
      
      // Camada de entrada ajustada para 15 números
      model.add(tf.layers.dense({
        units: 256,
        activation: 'relu',
        inputShape: [15], // Ajustado para receber exatamente 15 números
        kernelInitializer: 'glorotNormal',
        kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
      }));
      
      model.add(tf.layers.batchNormalization());
      model.add(tf.layers.dropout({ rate: 0.3 }));
      
      model.add(tf.layers.dense({
        units: 128,
        activation: 'relu',
        kernelInitializer: 'glorotNormal',
        kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
      }));
      
      model.add(tf.layers.batchNormalization());
      
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

      systemLogger.log('model', 'Modelo neural inicializado com sucesso', {
        backend: tf.getBackend(),
        layers: model.layers.length,
        inputShape: model.inputs[0].shape,
        outputShape: model.outputs[0].shape
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