import { systemLogger as localLogger } from '../gptengineer';

export const systemLogger = {
  ...localLogger,
  debug: (message: string, data = {}) => {
    localLogger.log('debug', message, data);
  },
  error: (message: string, data = {}) => {
    localLogger.log('error', message, data);
  }
};
