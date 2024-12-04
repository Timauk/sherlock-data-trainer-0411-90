import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../logging/systemLogger';

export class TensorFlowSetup {
  private static instance: TensorFlowSetup;
  private isInitialized: boolean = false;

  private constructor() {}

  static getInstance(): TensorFlowSetup {
    if (!TensorFlowSetup.instance) {
      TensorFlowSetup.instance = new TensorFlowSetup();
    }
    return TensorFlowSetup.instance;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Try to initialize with WebGL first
      await tf.setBackend('webgl');
      await tf.ready();
      
      systemLogger.log('system', 'TensorFlow.js initialized with WebGL backend');
    } catch (error) {
      systemLogger.log('system', 'WebGL initialization failed, falling back to CPU', { error });
      
      try {
        // Fall back to CPU backend
        await tf.setBackend('cpu');
        await tf.ready();
        systemLogger.log('system', 'TensorFlow.js initialized with CPU backend');
      } catch (cpuError) {
        systemLogger.error('system', 'Failed to initialize TensorFlow.js backends', { error: cpuError });
        throw new Error('Could not initialize TensorFlow backend');
      }
    }

    this.isInitialized = true;
    
    const memoryInfo = tf.memory();
    systemLogger.log('system', 'TensorFlow.js Memory Info', {
      numTensors: memoryInfo.numTensors,
      numDataBuffers: memoryInfo.numDataBuffers,
      numBytes: memoryInfo.numBytes,
    });
  }

  async getModel(): Promise<tf.LayersModel | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const model = tf.sequential();
      
      // Simplified model architecture for better CPU performance
      model.add(tf.layers.dense({ 
        units: 128, 
        activation: 'relu', 
        inputShape: [17] 
      }));
      model.add(tf.layers.dense({ 
        units: 64, 
        activation: 'relu' 
      }));
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
    } catch (error) {
      systemLogger.error('system', 'Error creating TensorFlow model', { error });
      return null;
    }
  }

  disposeModel(model: tf.LayersModel | null) {
    if (model) {
      try {
        model.dispose();
        systemLogger.log('system', 'Model disposed successfully');
      } catch (error) {
        systemLogger.error('system', 'Error disposing model', { error });
      }
    }
  }

  getBackend(): string {
    return tf.getBackend() || 'unknown';
  }
}

export const tfSetup = TensorFlowSetup.getInstance();