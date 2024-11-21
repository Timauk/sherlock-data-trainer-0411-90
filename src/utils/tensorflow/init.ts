import * as tf from '@tensorflow/tfjs';

export const initTensorFlow = async () => {
  try {
    // Set backend to CPU to avoid WebGL issues
    await tf.setBackend('cpu');
    await tf.ready();
    console.log('TensorFlow.js initialized successfully');
  } catch (error) {
    console.error('Failed to initialize TensorFlow.js:', error);
  }
};