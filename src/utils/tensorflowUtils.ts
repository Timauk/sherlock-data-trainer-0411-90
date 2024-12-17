import * as tf from '@tensorflow/tfjs';
import { systemLogger } from './logging/systemLogger';

export const initializeTensorFlow = async () => {
  try {
    await tf.ready();
    systemLogger.log('system', 'TensorFlow.js initialized successfully');
    return true;
  } catch (error) {
    systemLogger.error('system', 'Failed to initialize TensorFlow.js:', { error });
    return false;
  }
};

export const setupTensorFlowBackend = async () => {
  try {
    await tf.setBackend('webgl');
    await tf.ready();
    
    tf.env().set('WEBGL_MAX_TEXTURE_SIZE', 4096);
    tf.env().set('WEBGL_FORCE_F16_TEXTURES', true);
    tf.env().set('WEBGL_VERSION', 1);
    tf.env().set('WEBGL_CPU_FORWARD', true);
    
    systemLogger.log('system', 'Using WebGL backend with optimized settings');
  } catch (webglError) {
    systemLogger.warn('system', 'WebGL backend failed, trying CPU', { error: webglError });
    
    try {
      await tf.setBackend('cpu');
      await tf.ready();
      systemLogger.log('system', 'Using CPU backend');
    } catch (cpuError) {
      systemLogger.error('system', 'All backends failed', { error: cpuError });
      throw new Error('No suitable backend available');
    }
  }
};

export const createModel = () => {
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
};

export const trainModel = async (
  model: tf.LayersModel,
  data: number[][],
  batchSize: number = 32,
  onProgress?: (epoch: number, logs?: tf.Logs) => void
) => {
  const totalBatches = Math.ceil(data.length / batchSize);
  
  for (let i = 0; i < totalBatches; i++) {
    const start = i * batchSize;
    const end = Math.min((i + 1) * batchSize, data.length);
    const batchData = data.slice(start, end);
    
    const xs = tf.tensor2d(batchData.map(row => row.slice(0, 15)));
    const ys = tf.tensor2d(batchData.map(row => row.slice(-15)));
    
    try {
      await model.fit(xs, ys, {
        epochs: 1,
        batchSize: batchSize,
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
};

export const predictNumbers = async (
  model: tf.LayersModel,
  inputData: number[]
): Promise<number[]> => {
  const inputTensor = tf.tensor2d([inputData]);
  const predictions = model.predict(inputTensor) as tf.Tensor;
  const result = Array.from(await predictions.data());
  inputTensor.dispose();
  predictions.dispose();
  return result;
};