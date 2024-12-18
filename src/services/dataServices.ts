import { Player } from '@/types/gameTypes';
import { systemLogger } from '@/utils/logging/systemLogger';
import * as tf from '@tensorflow/tfjs';

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
    onProgress?: (progress: number) => void
  ) {
    const xs = tf.tensor2d(data.map(row => row.slice(0, 15)));
    const ys = tf.tensor2d(data.map(row => row.slice(15)));
    
    try {
      await model.fit(xs, ys, {
        epochs: 50,
        batchSize: 32,
        shuffle: true,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            const progress = (epoch + 1) / 50;
            onProgress?.(progress);
            
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

  // Weighted Training
  static calculateWeights(data: number[][], outcomes: number[]) {
    const weights = new Array(data[0].length).fill(0);
    const totalOutcomes = outcomes.length;

    for (let i = 0; i < totalOutcomes; i++) {
      for (let j = 0; j < data[i].length; j++) {
        weights[j] += data[i][j] * outcomes[i];
      }
    }

    return weights.map(weight => weight / totalOutcomes);
  }

  // Data Summarization
  static summarizeData(data: number[][]) {
    const summary = {
      mean: new Array(data[0].length).fill(0),
      variance: new Array(data[0].length).fill(0),
      count: data.length
    };

    for (const row of data) {
      for (let i = 0; i < row.length; i++) {
        summary.mean[i] += row[i];
      }
    }

    for (let i = 0; i < summary.mean.length; i++) {
      summary.mean[i] /= summary.count;
    }

    for (const row of data) {
      for (let i = 0; i < row.length; i++) {
        summary.variance[i] += Math.pow(row[i] - summary.mean[i], 2);
      }
    }

    for (let i = 0; i < summary.variance.length; i++) {
      summary.variance[i] /= summary.count;
    }

    return summary;
  }

  // Feature Engineering
  static engineerFeatures(data: number[][]) {
    return data.map(row => {
      const newRow = [...row];
      // Example feature engineering: adding a new feature
      newRow.push(row.reduce((a, b) => a + b, 0)); // Sum of all features
      return newRow;
    });
  }

  // Lottery Feature Engineering
  static enrichLotteryData(data: number[][], dates: Date[]) {
    return data.map((row, index) => {
      const enrichedRow = [...row];
      // Example: adding the date as a feature
      enrichedRow.push(dates[index].getTime());
      return enrichedRow;
    });
  }
}