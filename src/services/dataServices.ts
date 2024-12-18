import { Player } from '@/types/gameTypes';
import { systemLogger } from '@/utils/logging/systemLogger';
import * as tf from '@tensorflow/tfjs';

interface TrainingConfig {
  batchSize: number;
  epochs: number;
  onEpochEnd?: (epoch: number, logs?: tf.Logs) => void;
}

export class DataServices {
  static async createSharedModel() {
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 128, activation: 'relu', inputShape: [15] }));
    model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 15, activation: 'sigmoid' }));
    model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
    return model;
  }

  static async trainModel(
    model: tf.Sequential, 
    data: number[][], 
    onProgress?: (progress: number) => void,
    config?: TrainingConfig
  ) {
    const xs = tf.tensor2d(data.map(row => row.slice(0, 15)));
    const ys = tf.tensor2d(data.map(row => row.slice(15)));
    
    try {
      await model.fit(xs, ys, {
        epochs: config?.epochs || 50,
        batchSize: config?.batchSize || 32,
        shuffle: true,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            const progress = (epoch + 1) / (config?.epochs || 50);
            onProgress?.(progress);
            config?.onEpochEnd?.(epoch, logs);
            
            systemLogger.log('training', `Época ${epoch + 1} finalizada`, {
              loss: logs?.loss,
              valLoss: logs?.val_loss,
              timestamp: new Date().toISOString()
            });
          }
        }
      });

      return model;
    } finally {
      xs.dispose();
      ys.dispose();
    }
  }

  static processCSV(text: string): number[][] {
    const lines = text.trim().split('\n');
    const dataLines = lines.slice(1); // Skip header
    
    return dataLines.map(line => {
      const values = line.split(',');
      const numbers = values.map(Number);
      
      if (numbers.some(isNaN)) {
        throw new Error('Arquivo CSV contém valores inválidos');
      }
      
      return numbers;
    });
  }
}