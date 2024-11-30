import { systemLogger } from './systemLogger';

// Inicializa o logger
export const initLogger = () => {
  if (typeof window !== 'undefined') {
    (window as any).systemLogger = systemLogger;
  }
  return systemLogger;
};