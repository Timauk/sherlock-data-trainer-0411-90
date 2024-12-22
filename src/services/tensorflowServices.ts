import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '@/utils/logging/systemLogger';

// Get base API URL from environment or default
const getApiUrl = () => {
  const url = import.meta.env.VITE_API_URL || window.location.origin.replace(/:\d+$/, ':3001');
  return url.replace(/:\/+$/, ''); // Remove trailing :/ if present
};

export class TensorFlowServices {
  static API_BASE_URL = getApiUrl();

  // TF Setup
  static async initialize() {
    try {
      await tf.ready();
      
      // Test API connection
      const response = await fetch(`${this.API_BASE_URL}/test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`API test failed with status ${response.status}`);
      }

      return true;
    } catch (error) {
      systemLogger.error('system', 'Failed to initialize TensorFlow or connect to API', { 
        error,
        apiUrl: this.API_BASE_URL 
      });
      return false;
    }
  }

  // Model Creation and Training
  static async createModel() {
    const model = tf.sequential();
    
    model.add(tf.layers.dense({
      units: 64,
      activation: 'relu',
      inputShape: [15],
      kernelInitializer: 'glorotNormal'
    }));
    
    model.add(tf.layers.dropout({ rate: 0.2 }));
    
    model.add(tf.layers.dense({
      units: 32,
      activation: 'relu',
      kernelInitializer: 'glorotNormal'
    }));
    
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

    return model;
  }

  // Prediction Utils with improved error handling
  static async predictNumbers(model: tf.LayersModel, inputData: number[]): Promise<number[]> {
    try {
      const inputTensor = tf.tensor2d([inputData]);
      const predictions = model.predict(inputTensor) as tf.Tensor;
      const result = Array.from(await predictions.data());
      
      // Cleanup
      inputTensor.dispose();
      predictions.dispose();
      
      return result;
    } catch (error) {
      systemLogger.error('prediction', 'Error predicting numbers', { error, inputData });
      throw error;
    }
  }
}
