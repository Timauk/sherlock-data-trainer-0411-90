import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../logging/systemLogger';

export class TensorFlowSetup {
  private static instance: TensorFlowSetup;
  private isInitialized: boolean = false;
  private preferredBackend: string = 'cpu';

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
      tf.env().set('WEBGL_DELETE_TEXTURE_THRESHOLD', 0);
      tf.env().set('WEBGL_FORCE_F16_TEXTURES', true);
      tf.env().set('WEBGL_VERSION', 1);
      tf.env().set('WEBGL_MAX_TEXTURE_SIZE', 2048);
      tf.env().set('WEBGL_MAX_TEXTURES_IN_SHADER', 16);

      await tf.setBackend('cpu');
      await tf.ready();
      this.preferredBackend = 'cpu';
      
      systemLogger.log('system', 'TensorFlow.js initialized with CPU backend', {
        backend: tf.getBackend(),
        memory: tf.memory()
      });

      setInterval(() => {
        try {
          tf.tidy(() => {});
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
      
      model.add(tf.layers.dense({ 
        units: 64,
        activation: 'relu', 
        inputShape: [13057],
        kernelInitializer: 'glorotNormal'
      }));
      
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

  async safeTensorOperation<T>(operation: () => Promise<T>): Promise<T> {
    return tf.tidy(async () => {
      try {
        const result = await operation();
        return result;
      } catch (error) {
        systemLogger.error('system', 'Error in tensor operation', { error });
        throw error;
      }
    });
  }
}

export const tfSetup = TensorFlowSetup.getInstance();