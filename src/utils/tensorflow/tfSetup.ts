import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../logging/systemLogger';

export const tfSetup = {
  async initialize() {
    try {
      await tf.ready();
      return true;
    } catch (error) {
      systemLogger.error('system', 'Failed to initialize TensorFlow', { error });
      return false;
    }
  },

  getBackend() {
    return tf.getBackend();
  }
};