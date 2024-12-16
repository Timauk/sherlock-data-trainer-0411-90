import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../logging/systemLogger';

export class ModelInitializer {
  private static readonly BATCH_SIZE = 32;
  private static readonly MAX_TEXTURE_SIZE = 4096; // Reduced from 16384 to be safer

  static async initializeModel(): Promise<tf.LayersModel> {
    try {
      await this.setupBackend();
      
      const model = tf.sequential();
      
      // Significantly reduced layer sizes and complexity
      model.add(tf.layers.dense({
        units: 64, // Reduced from 128
        activation: 'relu',
        inputShape: [15],
        kernelInitializer: 'glorotNormal'
      }));
      
      model.add(tf.layers.dropout({ rate: 0.2 }));
      
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

      systemLogger.log('system', 'Modelo neural inicializado com sucesso', {
        backend: tf.getBackend(),
        layers: model.layers.length,
        inputShape: model.inputs[0].shape,
        outputShape: model.outputs[0].shape,
        memoryInfo: tf.memory()
      });

      return model;
    } catch (error) {
      systemLogger.error('system', 'Erro ao inicializar modelo', {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        backend: tf.getBackend(),
        memoryInfo: tf.memory()
      });
      throw error;
    }
  }

  private static async setupBackend(): Promise<void> {
    // Try CPU first as it's more stable
    try {
      await tf.setBackend('cpu');
      await tf.ready();
      systemLogger.log('system', 'Using CPU backend');
      return;
    } catch (cpuError) {
      systemLogger.warn('system', 'CPU backend failed, trying WebGL', { error: cpuError });
    }

    // Try WebGL with reduced settings
    try {
      await tf.setBackend('webgl');
      await tf.ready();
      
      // Configure WebGL for better stability
      tf.env().set('WEBGL_MAX_TEXTURE_SIZE', this.MAX_TEXTURE_SIZE);
      tf.env().set('WEBGL_FORCE_F16_TEXTURES', true);
      tf.env().set('WEBGL_VERSION', 1); // Force WebGL 1.0 for better compatibility
      tf.env().set('WEBGL_CPU_FORWARD', true); // Enable CPU fallback
      
      systemLogger.log('system', 'Using WebGL backend with reduced settings');
    } catch (webglError) {
      systemLogger.error('system', 'All backends failed', { error: webglError });
      throw new Error('No suitable backend available');
    }
  }

  static async trainOnBatch(
    model: tf.LayersModel, 
    data: number[][], 
    onProgress?: (epoch: number, logs?: tf.Logs) => void
  ): Promise<void> {
    const totalBatches = Math.ceil(data.length / this.BATCH_SIZE);
    
    for (let i = 0; i < totalBatches; i++) {
      const start = i * this.BATCH_SIZE;
      const end = Math.min((i + 1) * this.BATCH_SIZE, data.length);
      const batchData = data.slice(start, end);
      
      const xs = tf.tensor2d(batchData.map(row => row.slice(0, 15)));
      const ys = tf.tensor2d(batchData.map(row => row.slice(-15)));
      
      try {
        await model.fit(xs, ys, {
          epochs: 1,
          batchSize: this.BATCH_SIZE,
          callbacks: {
            onEpochEnd: onProgress
          }
        });
      } finally {
        // Clean up tensors
        xs.dispose();
        ys.dispose();
        // Force garbage collection
        await tf.nextFrame();
      }
    }
  }
}