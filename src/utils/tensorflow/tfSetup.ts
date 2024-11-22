import * as tf from '@tensorflow/tfjs';
import { logger } from '../logging/logger';

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
      // Tenta inicializar com WASM primeiro
      await tf.setBackend('wasm');
      logger.info('TensorFlow.js initialized with WASM backend');
    } catch (error) {
      try {
        // Se WASM falhar, tenta com WebGL
        await tf.setBackend('webgl');
        logger.info('TensorFlow.js initialized with WebGL backend');
      } catch (webglError) {
        try {
          // Última tentativa com CPU
          await tf.setBackend('cpu');
          logger.info('TensorFlow.js initialized with CPU backend');
        } catch (cpuError) {
          logger.error('Failed to initialize TensorFlow.js with any backend');
          throw new Error('TensorFlow initialization failed');
        }
      }
    }

    await tf.ready();
    this.isInitialized = true;
  }

  async getModel(): Promise<tf.LayersModel | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const model = tf.sequential();
      model.add(tf.layers.dense({ 
        units: 256, 
        activation: 'relu', 
        inputShape: [17] 
      }));
      model.add(tf.layers.dense({ 
        units: 128, 
        activation: 'relu' 
      }));
      model.add(tf.layers.dense({ 
        units: 15, 
        activation: 'sigmoid' 
      }));

      model.compile({
        optimizer: 'adam',
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });

      return model;
    } catch (error) {
      logger.error('Error creating TensorFlow model:', error);
      return null;
    }
  }

  disposeModel(model: tf.LayersModel | null) {
    if (model) {
      try {
        model.dispose();
      } catch (error) {
        logger.error('Error disposing model:', error);
      }
    }
  }
}

export const tfSetup = TensorFlowSetup.getInstance();