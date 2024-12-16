import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../logging/systemLogger';

export class TensorFlowSetup {
  private static instance: TensorFlowSetup;
  private isInitialized: boolean = false;
  private preferredBackend: string = 'cpu'; // Default to CPU for stability

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
      // Configure memory management
      tf.env().set('WEBGL_DELETE_TEXTURE_THRESHOLD', 0);
      tf.env().set('WEBGL_FORCE_F16_TEXTURES', true);
      tf.env().set('WEBGL_VERSION', 1);
      tf.env().set('WEBGL_MAX_TEXTURE_SIZE', 2048); // Reduced from default
      tf.env().set('WEBGL_MAX_TEXTURES_IN_SHADER', 16);

      // Try CPU first as it's more stable
      await tf.setBackend('cpu');
      await tf.ready();
      this.preferredBackend = 'cpu';
      
      systemLogger.log('system', 'TensorFlow.js initialized with CPU backend', {
        backend: tf.getBackend(),
        memory: tf.memory()
      });

      // Schedule regular garbage collection
      setInterval(() => {
        try {
          tf.engine().endScope();
          tf.engine().startScope();
          const memoryInfo = tf.memory();
          systemLogger.log('system', 'Memory cleanup performed', {
            numTensors: memoryInfo.numTensors,
            numBytes: memoryInfo.numBytes
          });
        } catch (error) {
          systemLogger.error('system', 'Error during memory cleanup', { error });
        }
      }, 10000);

    } catch (error) {
      systemLogger.error('system', 'Failed to initialize TensorFlow.js', { error });
      throw new Error('Could not initialize TensorFlow backend');
    }

    this.isInitialized = true;
  }

  async getModel(): Promise<tf.LayersModel | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const model = tf.sequential();
      
      // Simplified model architecture optimized for CPU
      model.add(tf.layers.dense({ 
        units: 64, // Reduced from 128
        activation: 'relu', 
        inputShape: [17],
        kernelInitializer: 'glorotNormal'
      }));
      
      model.add(tf.layers.dense({ 
        units: 32, // Reduced from 64
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
    return this.preferredBackend;
  }

  // Utility method to safely execute tensor operations with proper typing
  async safeTensorOperation<T>(operation: () => Promise<T | tf.Tensor>): Promise<T> {
    return tf.engine().scopedRun(
      async () => {
        try {
          const result = await operation();
          if (result instanceof tf.Tensor) {
            const value = await result.array();
            result.dispose();
            return value as T;
          }
          return result;
        } catch (error) {
          systemLogger.error('system', 'Error in tensor operation', { error });
          throw error;
        }
      },
      () => {}, // beforeFunc
      () => {}  // afterFunc
    );
  }
}

export const tfSetup = TensorFlowSetup.getInstance();