import * as tf from '@tensorflow/tfjs';
import { systemLogger } from './logging/systemLogger';

export interface ModelMetadata {
  timestamp: string;
  architecture: string[];
  performance: {
    accuracy: number;
    loss: number;
  };
  trainingIterations: number;
}

export const serializeModel = async (model: tf.LayersModel, metadata: ModelMetadata) => {
  try {
    await model.save('indexeddb://current-model');
    localStorage.setItem('model-metadata', JSON.stringify(metadata));
    const config = model.getConfig();
    localStorage.setItem('model-architecture', JSON.stringify(config));
    
    systemLogger.log('system', 'Modelo serializado com sucesso', metadata);
    return true;
  } catch (error) {
    systemLogger.log('system', 'Erro ao serializar modelo', { error });
    return false;
  }
};

export const deserializeModel = async (): Promise<{
  model: tf.LayersModel | null;
  metadata: ModelMetadata | null;
}> => {
  try {
    const model = await tf.loadLayersModel('indexeddb://current-model');
    const metadata = JSON.parse(localStorage.getItem('model-metadata') || 'null');
    return { model, metadata };
  } catch (error) {
    systemLogger.log('system', 'Erro ao deserializar modelo', { error });
    return { model: null, metadata: null };
  }
};