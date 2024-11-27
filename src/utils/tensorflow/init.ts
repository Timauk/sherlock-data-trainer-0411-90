import * as tf from '@tensorflow/tfjs';

export const initTensorFlow = async (): Promise<boolean> => {
  try {
    await tf.ready();
    console.log('TensorFlow.js initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize TensorFlow.js:', error);
    return false;
  }
};