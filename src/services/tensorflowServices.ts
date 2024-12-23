import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '@/utils/logging/systemLogger';

const getApiUrl = () => {
  const url = import.meta.env.VITE_API_URL || window.location.origin;
  
  // First remove any trailing slashes and ports
  const cleanUrl = url.replace(/\/+$/, '').replace(/:\d+$/, '');
  
  if (cleanUrl.includes('lovableproject.com')) {
    // For lovableproject.com domains, ensure HTTPS and add port 3001
    return cleanUrl
      .replace('http://', 'https://')
      .replace(/:\d+/, '') // Remove any existing port
      .concat(':3001'); // Add the correct port
  }
  
  // For localhost or other environments
  return cleanUrl.includes('localhost') 
    ? cleanUrl.replace(/:\d+/, ':3001')  // Replace any port with 3001
    : `${cleanUrl}:3001`; // Add port 3001
};

export class TensorFlowServices {
  static API_BASE_URL = getApiUrl();

  static async initialize() {
    try {
      await tf.ready();
      
      const testUrl = `${this.API_BASE_URL}/test`;
      systemLogger.log('system', 'Testing API connection', { 
        url: testUrl,
        baseUrl: this.API_BASE_URL 
      });
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`API test failed with status ${response.status}`);
      }

      const data = await response.json();
      systemLogger.log('system', 'API connection successful', { 
        data,
        baseUrl: this.API_BASE_URL
      });
      
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
