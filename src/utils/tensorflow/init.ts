import { tfSetup } from './tfSetup';
import { logger } from '../logging/logger';

export const initTensorFlow = async () => {
  try {
    await tfSetup.initialize();
    logger.info('TensorFlow.js initialized successfully');
    return true;
  } catch (error) {
    logger.error('Failed to initialize TensorFlow.js:', error);
    return false;
  }
};