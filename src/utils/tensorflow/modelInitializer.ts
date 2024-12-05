import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../logging/systemLogger';

export class ModelInitializer {
  static async initializeModel() {
    try {
      // Try to initialize with WebGL first
      await tf.setBackend('webgl');
      await tf.ready();
      systemLogger.log('system', 'TensorFlow.js inicializado com WebGL');
    } catch (error) {
      systemLogger.log('system', 'Fallback para CPU', { error });
      // Fallback to CPU
      await tf.setBackend('cpu');
      await tf.ready();
    }

    const model = tf.sequential();
    
    // Model configuration
    model.add(tf.layers.dense({ 
      units: 256, 
      activation: 'relu', 
      inputShape: [17],
      kernelInitializer: 'glorotNormal'
    }));
    
    model.add(tf.layers.dense({ 
      units: 128, 
      activation: 'relu'
    }));
    
    model.add(tf.layers.dense({ 
      units: 15, 
      activation: 'sigmoid'
    }));

    // Compile the model - IMPORTANT
    model.compile({ 
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }
}