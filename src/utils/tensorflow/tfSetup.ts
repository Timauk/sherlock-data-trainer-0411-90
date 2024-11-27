import * as tf from '@tensorflow/tfjs';
import * as tfjsNode from '@tensorflow/tfjs-node-gpu';
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
      await tf.setBackend('tensorflow');
      await tfjsNode.ready();
      
      // Verifica se GPU está disponível usando tf.env()
      const gpuAvailable = tf.env().get('HAS_WEBGL');
      
      if (gpuAvailable) {
        logger.info('\x1b[32m%s\x1b[0m', 'TensorFlow.js initialized with GPU support');
        logger.info('\x1b[32m%s\x1b[0m', `GPU Memory: ${tf.memory().numBytes} bytes used`);
      } else {
        await tf.setBackend('cpu');
        logger.info('\x1b[32m%s\x1b[0m', 'TensorFlow.js initialized with CPU backend (GPU not available)');
      }
    } catch (error) {
      logger.error('\x1b[31m%s\x1b[0m', 'Failed to initialize TensorFlow.js with GPU:', error);
      
      try {
        await tf.setBackend('cpu');
        logger.info('\x1b[32m%s\x1b[0m', 'TensorFlow.js initialized with CPU backend (fallback)');
      } catch (cpuError) {
        logger.error('\x1b[31m%s\x1b[0m', 'Failed to initialize TensorFlow.js:', cpuError);
        throw new Error('TensorFlow initialization failed');
      }
    }

    await tf.ready();
    this.isInitialized = true;
    
    const memoryInfo = tf.memory();
    logger.info('\x1b[32m%s\x1b[0m', 'TensorFlow.js Memory Info:', {
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
      logger.error('\x1b[31m%s\x1b[0m', 'Error creating TensorFlow model:', error);
      return null;
    }
  }

  disposeModel(model: tf.LayersModel | null) {
    if (model) {
      try {
        model.dispose();
      } catch (error) {
        logger.error('\x1b[31m%s\x1b[0m', 'Error disposing model:', error);
      }
    }
  }
}

export const tfSetup = TensorFlowSetup.getInstance();