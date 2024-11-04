import * as tf from '@tensorflow/tfjs';
import path from 'path';
import { logger } from '../logging/logger.js';

export class ModelManager {
  constructor(fileManager) {
    this.fileManager = fileManager;
  }

  async saveModel(model, checkpointDir) {
    const modelPath = path.join(checkpointDir, 'model');
    await model.save(`file://${modelPath}`);
    logger.debug('Model saved successfully');
  }

  async loadModel(checkpointDir) {
    try {
      const modelPath = path.join(checkpointDir, 'model');
      const model = await tf.loadLayersModel(`file://${modelPath}`);
      logger.debug('Model loaded successfully');
      return model;
    } catch (error) {
      logger.error('Error loading model:', error);
      return null;
    }
  }
}