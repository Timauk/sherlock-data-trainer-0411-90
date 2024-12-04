import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../logging/systemLogger';
import { tfSetup } from '../tensorflow/tfSetup';

export class TFDecisionTree {
  private model: tf.LayersModel | null = null;
  private trained: boolean = false;

  constructor() {
    this.initializeModel();
  }

  private async initializeModel() {
    try {
      await tfSetup.initialize();
      
      systemLogger.log('learning', 'Inicializando modelo de árvore de decisão', {
        backend: tfSetup.getBackend(),
        memory: tf.memory()
      });

      this.model = tf.sequential({
        layers: [
          tf.layers.dense({ units: 32, activation: 'relu', inputShape: [10] }),
          tf.layers.dense({ units: 16, activation: 'relu' }),
          tf.layers.dense({ units: 1, activation: 'sigmoid' })
        ]
      });

      this.model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });

      systemLogger.log('learning', 'Modelo inicializado com sucesso');
    } catch (error) {
      systemLogger.error('learning', 'Erro ao inicializar modelo', { error });
      throw error;
    }
  }

  predict(input: number[]): boolean {
    if (!this.model) {
      throw new Error('Modelo não inicializado');
    }

    try {
      const inputTensor = tf.tensor2d([input]);
      const prediction = this.model.predict(inputTensor) as tf.Tensor;
      const result = prediction.dataSync()[0];

      inputTensor.dispose();
      prediction.dispose();

      return result > 0.5;
    } catch (error) {
      systemLogger.error('learning', 'Erro durante predição', { error });
      return false;
    }
  }
}