import * as tf from '@tensorflow/tfjs';
import { logger } from '../logging/logger';

export class TFDecisionTree {
  private model: tf.LayersModel | null = null;
  private trained: boolean = false;

  constructor() {
    this.initializeModel();
  }

  private async initializeModel() {
    try {
      logger.info('Inicializando modelo de árvore de decisão', {
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

      logger.info('Modelo inicializado com sucesso');
    } catch (error) {
      logger.error('Erro ao inicializar modelo', error);
      throw error;
    }
  }

  async train(data: number[][], labels: number[], epochs: number = 50) {
    if (!this.model) {
      throw new Error('Modelo não inicializado');
    }

    try {
      logger.info('Iniciando treinamento', {
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
            logger.info(`Época ${epoch + 1}/${epochs}`, logs);
          }
        }
      });

      this.trained = true;
      logger.info('Treinamento concluído com sucesso');

      xs.dispose();
      ys.dispose();
    } catch (error) {
      logger.error('Erro durante treinamento', error);
      throw error;
    }
  }

  predict(input: number[]): boolean {
    if (!this.model || !this.trained) {
      throw new Error('Modelo não treinado');
    }

    try {
      const inputTensor = tf.tensor2d([input]);
      const prediction = this.model.predict(inputTensor) as tf.Tensor;
      const result = prediction.dataSync()[0];

      inputTensor.dispose();
      prediction.dispose();

      return result > 0.5;
    } catch (error) {
      logger.error('Erro durante predição', error);
      throw error;
    }
  }

  async save(path: string): Promise<void> {
    if (!this.model) {
      throw new Error('Modelo não inicializado');
    }

    try {
      await this.model.save(`file://${path}`);
      logger.info('Modelo salvo com sucesso', { path });
    } catch (error) {
      logger.error('Erro ao salvar modelo', error);
      throw error;
    }
  }

  async load(path: string): Promise<void> {
    try {
      this.model = await tf.loadLayersModel(`file://${path}`);
      this.trained = true;
      logger.info('Modelo carregado com sucesso', { path });
    } catch (error) {
      logger.error('Erro ao carregar modelo', error);
      throw error;
    }
  }
}