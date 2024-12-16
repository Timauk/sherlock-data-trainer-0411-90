import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../logging/systemLogger';

export class ModelInitializer {
  private static readonly BATCH_SIZE = 32;
  private static readonly MAX_TEXTURE_SIZE = 16384; // Common WebGL limit

  static async initializeModel(): Promise<tf.LayersModel> {
    try {
      await this.setupBackend();
      
      const model = tf.sequential();
      
      // Reduced layer sizes to prevent texture issues
      model.add(tf.layers.dense({
        units: 128, // Reduced from 256
        activation: 'relu',
        inputShape: [15],
        kernelInitializer: 'glorotNormal',
        kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
      }));
      
      model.add(tf.layers.batchNormalization());
      model.add(tf.layers.dropout({ rate: 0.3 }));
      
      model.add(tf.layers.dense({
        units: 64, // Reduced from 128
        activation: 'relu',
        kernelInitializer: 'glorotNormal',
        kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
      }));
      
      model.add(tf.layers.batchNormalization());
      
      model.add(tf.layers.dense({
        units: 15,
        activation: 'sigmoid',
        kernelInitializer: 'glorotNormal'
      }));

      const optimizer = tf.train.adam(0.001);
      optimizer.setWeights([]); // Clear any existing weights

      model.compile({
        optimizer,
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
    // Try different backends in order of preference
    const backends = ['webgl', 'cpu'];
    
    for (const backend of backends) {
      try {
        await tf.setBackend(backend);
        await tf.ready();
        
        if (backend === 'webgl') {
          // Configure WebGL for better stability
          const gl = await tf.backend().getGPGPUContext().gl;
          gl.getExtension('OES_texture_float');
          gl.getExtension('WEBGL_color_buffer_float');
          
          // Set reasonable limits
          tf.env().set('WEBGL_MAX_TEXTURE_SIZE', this.MAX_TEXTURE_SIZE);
          tf.env().set('WEBGL_FORCE_F16_TEXTURES', true);
          tf.env().set('WEBGL_PACK', true);
        }
        
        systemLogger.log('system', `Backend inicializado: ${backend}`, {
          backend: tf.getBackend(),
          memory: tf.memory()
        });
        
        return;
      } catch (error) {
        systemLogger.warn('system', `Falha ao inicializar backend ${backend}`, { error });
        continue;
      }
    }
    
    throw new Error('Nenhum backend disponível');
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
      
      tf.tidy(() => {
        const xs = tf.tensor2d(batchData.map(row => row.slice(0, 15)));
        const ys = tf.tensor2d(batchData.map(row => row.slice(-15)));
        
        return model.fit(xs, ys, {
          epochs: 1,
          batchSize: this.BATCH_SIZE,
          callbacks: {
            onEpochEnd: onProgress
          }
        });
      });
      
      // Force garbage collection between batches
      await tf.nextFrame();
    }
  }
}