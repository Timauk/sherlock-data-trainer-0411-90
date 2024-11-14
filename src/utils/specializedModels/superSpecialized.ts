import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../logging/systemLogger';

interface SpecializedModelConfig {
  type: 'pairs' | 'odds' | 'sequences' | 'primes' | 'fibonacci' | 'lunar';
  inputShape: number[];
  layers: number[];
}

class SuperSpecializedModel {
  private model: tf.LayersModel;
  private type: string;
  private metrics: {
    accuracy: number;
    predictions: number;
    successRate: number;
  };

  constructor(config: SpecializedModelConfig) {
    this.type = config.type;
    this.model = this.buildModel(config);
    this.metrics = {
      accuracy: 0,
      predictions: 0,
      successRate: 0
    };
  }

  private buildModel(config: SpecializedModelConfig): tf.LayersModel {
    const model = tf.sequential();
    
    // Primeira camada com inputShape
    model.add(tf.layers.dense({
      units: config.layers[0],
      activation: 'relu',
      inputShape: config.inputShape
    }));

    // Camadas intermediárias com dropout reduzido
    for (let i = 1; i < config.layers.length; i++) {
      model.add(tf.layers.dense({
        units: config.layers[i],
        activation: 'relu'
      }));
      
      // Dropout reduzido e apenas em algumas camadas
      if (i < config.layers.length - 1 && i % 2 === 0) {
        model.add(tf.layers.dropout({ rate: 0.2 }));
      }
    }

    // Camada de saída
    model.add(tf.layers.dense({
      units: 15,
      activation: 'sigmoid'
    }));

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  async train(data: number[][], labels: number[][]): Promise<void> {
    const xs = tf.tensor2d(data);
    const ys = tf.tensor2d(labels);

    try {
      await this.model.fit(xs, ys, {
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.2,
        callbacks: [
          tf.callbacks.earlyStopping({
            monitor: 'val_loss',
            patience: 5,
            restoreBestWeights: true
          }),
          {
            onEpochEnd: (epoch, logs) => {
              if (logs) {
                this.metrics.accuracy = logs.acc;
              }
            }
          }
        ]
      });
    } finally {
      xs.dispose();
      ys.dispose();
    }
  }

  async predict(input: number[]): Promise<number[]> {
    return tf.tidy(() => {
      const inputTensor = tf.tensor2d([input]);
      const prediction = this.model.predict(inputTensor) as tf.Tensor;
      return Array.from(prediction.dataSync());
    });
  }

  getMetrics() {
    return this.metrics;
  }
}

export const createSpecializedModels = () => {
  const models = {
    pairs: new SuperSpecializedModel({
      type: 'pairs',
      inputShape: [17],
      layers: [64, 32, 16]
    }),
    odds: new SuperSpecializedModel({
      type: 'odds',
      inputShape: [17],
      layers: [64, 32, 16]
    }),
    sequences: new SuperSpecializedModel({
      type: 'sequences',
      inputShape: [17],
      layers: [128, 64, 32]
    }),
    primes: new SuperSpecializedModel({
      type: 'primes',
      inputShape: [17],
      layers: [64, 32, 16]
    }),
    fibonacci: new SuperSpecializedModel({
      type: 'fibonacci',
      inputShape: [17],
      layers: [64, 32, 16]
    }),
    lunar: new SuperSpecializedModel({
      type: 'lunar',
      inputShape: [17],
      layers: [64, 32, 16]
    })
  };

  return models;
};
