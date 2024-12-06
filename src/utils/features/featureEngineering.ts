import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../logging/systemLogger';

export const normalizeFeatures = (data: number[][]): number[][] => {
  try {
    systemLogger.log('features', 'Starting feature normalization', {
      inputShape: [data.length, data[0].length],
      sampleData: data.slice(0, 2)
    });

    const tensor = tf.tensor2d(data);
    const min = tensor.min(0);
    const max = tensor.max(0);
    const normalizedTensor = tensor.sub(min).div(max.sub(min).add(1e-8));
    
    const normalizedData = normalizedTensor.arraySync() as number[][];

    systemLogger.log('features', 'Feature normalization complete', {
      outputShape: [normalizedData.length, normalizedData[0].length],
      sampleOutput: normalizedData.slice(0, 2),
      stats: {
        min: min.arraySync(),
        max: max.arraySync()
      }
    });

    // Cleanup tensors
    tensor.dispose();
    min.dispose();
    max.dispose();
    normalizedTensor.dispose();

    return normalizedData;
  } catch (error) {
    systemLogger.error('features', 'Error in feature normalization', { error });
    throw error;
  }
};

export const extractFeatures = (data: number[][]): number[][] => {
  try {
    systemLogger.log('features', 'Starting feature extraction', {
      inputShape: [data.length, data[0].length]
    });

    const features = data.map(row => {
      // Basic statistical features
      const mean = tf.mean(row).arraySync() as number;
      const std = tf.moments(row).variance.sqrt().arraySync() as number;
      const max = Math.max(...row);
      const min = Math.min(...row);
      
      // Pattern-based features
      const evenCount = row.filter(n => n % 2 === 0).length / row.length;
      const ascending = row.slice(1).filter((n, i) => n > row[i]).length / (row.length - 1);
      
      const features = [
        mean,
        std,
        max,
        min,
        max - min,
        evenCount,
        ascending,
        ...row // Include original values
      ];

      return features;
    });

    systemLogger.log('features', 'Feature extraction complete', {
      outputShape: [features.length, features[0].length],
      sampleFeatures: features.slice(0, 2)
    });

    return normalizeFeatures(features);
  } catch (error) {
    systemLogger.error('features', 'Error in feature extraction', { error });
    throw error;
  }
};