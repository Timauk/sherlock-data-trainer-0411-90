import { systemLogger } from './systemLogger';

export const initLogger = () => {
  // Inicializa o logger do sistema
  systemLogger.log('initialization', 'Logger system initialized');
};