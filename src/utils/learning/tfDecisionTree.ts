import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../logging/systemLogger';

export class TFDecisionTree {
  private model: tf.LayersModel | null = null;
  private trained: boolean = false;

  constructor() {
    this.initializeModel();
  }

  private async initializeModel() {
    try {
      systemLogger.log('model', 'Inicializando modelo de árvore de decisão', {
        backend: tf.getBackend(),
        memory: tf.memory()
      });

      this.model = tf.sequential({
        layers: [
          tf.layers.dense({ units: 64, activation: 'relu', inputShape: [10] }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: 32, activation: 'relu' }),
          tf.layers.dense({ units: 1, activation: 'sigmoid' })
        ]
      });

      this.model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });

      systemLogger.log('model', 'Modelo inicializado com sucesso');
    } catch (error) {
      systemLogger.log('model', 'Erro ao inicializar modelo', { error });
      throw error;
    }
  }

  async train(data: number[][], labels: number[], epochs: number = 50) {
    if (!this.model) {
      throw new Error('Modelo não inicializado');
    }

    try {
      systemLogger.log('model', 'Iniciando treinamento', {
        dataSize: data.length,
        epochs
      });

      const xs = tf.tensor2d(data);
      const ys = tf.tensor2d(labels, [labels.length, 1]);

      await this.model.fit(xs, ys, {
        epochs,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            systemLogger.log('model', `Época ${epoch + 1}/${epochs}`, logs);
          }
        }
      });

      this.trained = true;
      systemLogger.log('model', 'Treinamento concluído com sucesso');

      xs.dispose();
      ys.dispose();
    } catch (error) {
      systemLogger.log('model', 'Erro durante treinamento', { error });
      throw error;
    }
  }

  predict(input: number[]): number {
    if (!this.model || !this.trained) {
      throw new Error('Modelo não treinado');
    }

    try {
      const inputTensor = tf.tensor2d([input]);
      const prediction = this.model.predict(inputTensor) as tf.Tensor;
      const result = prediction.dataSync()[0];

      inputTensor.dispose();
      prediction.dispose();

      return result;
    } catch (error) {
      systemLogger.log('model', 'Erro durante predição', { error });
      throw error;
    }
  }

  async save(path: string): Promise<void> {
    if (!this.model) {
      throw new Error('Modelo não inicializado');
    }

    try {
      await this.model.save(`file://${path}`);
      systemLogger.log('model', 'Modelo salvo com sucesso', { path });
    } catch (error) {
      systemLogger.log('model', 'Erro ao salvar modelo', { error });
      throw error;
    }
  }

  async load(path: string): Promise<void> {
    try {
      this.model = await tf.loadLayersModel(`file://${path}`);
      this.trained = true;
      systemLogger.log('model', 'Modelo carregado com sucesso', { path });
    } catch (error) {
      systemLogger.log('model', 'Erro ao carregar modelo', { error });
      throw error;
    }
  }
}