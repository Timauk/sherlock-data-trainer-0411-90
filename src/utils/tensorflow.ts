import * as tf from '@tensorflow/tfjs';
import { systemLogger } from './logging/systemLogger';

// TensorFlow Initialization
export const initTensorFlow = async (): Promise<boolean> => {
  try {
    await tf.ready();
    systemLogger.log('system', 'TensorFlow.js initialized successfully');
    return true;
  } catch (error) {
    systemLogger.error('system', 'Failed to initialize TensorFlow.js:', { error });
    return false;
  }
};

// Model Initialization
export class ModelInitializer {
  private static readonly BATCH_SIZE = 32;
  private static readonly MAX_TEXTURE_SIZE = 4096;

  static async initializeModel(): Promise<tf.LayersModel> {
    try {
      await this.setupBackend();
      
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
    } catch (error) {
      systemLogger.error('system', 'Erro ao inicializar modelo', { error });
      throw error;
    }
  }

  private static async setupBackend(): Promise<void> {
    try {
      await tf.setBackend('cpu');
      await tf.ready();
      systemLogger.log('system', 'Using CPU backend');
      return;
    } catch (cpuError) {
      systemLogger.warn('system', 'CPU backend failed, trying WebGL', { error: cpuError });
    }

    try {
      await tf.setBackend('webgl');
      await tf.ready();
      
      tf.env().set('WEBGL_MAX_TEXTURE_SIZE', this.MAX_TEXTURE_SIZE);
      tf.env().set('WEBGL_FORCE_F16_TEXTURES', true);
      tf.env().set('WEBGL_VERSION', 1);
      tf.env().set('WEBGL_CPU_FORWARD', true);
      
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
        xs.dispose();
        ys.dispose();
        await tf.nextFrame();
      }
    }
  }
}

// Model Utilities
export const predictNumbers = async (
  trainedModel: tf.LayersModel,
  inputData: number[]
): Promise<tf.Tensor> => {
  const inputTensor = tf.tensor2d([inputData]);
  const predictions = trainedModel.predict(inputTensor) as tf.Tensor;
  inputTensor.dispose();
  return predictions;
};