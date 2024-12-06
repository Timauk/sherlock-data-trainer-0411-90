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
    // Salva o modelo completo (JSON + bin) em um único arquivo
    const saveResult = await model.save('downloads://modelo-aprendiz');
    
    // Salva os metadados separadamente
    localStorage.setItem('model-metadata', JSON.stringify(metadata));
    const config = model.getConfig();
    localStorage.setItem('model-architecture', JSON.stringify(config));
    
    systemLogger.log('system', 'Modelo serializado com sucesso', {
      metadata,
      saveResult,
      weightsManifest: saveResult.weightData ? 'presente' : 'ausente'
    });
    return true;
  } catch (error) {
    systemLogger.error('system', 'Erro ao serializar modelo', { error });
    return false;
  }
};

export const deserializeModel = async (jsonFile: File, weightsFile: File): Promise<{
  model: tf.LayersModel | null;
  metadata: ModelMetadata | null;
}> => {
  try {
    systemLogger.log('system', 'Iniciando carregamento do modelo', {
      jsonFileName: jsonFile.name,
      weightsFileName: weightsFile.name
    });

    // Carrega o modelo usando os dois arquivos
    const model = await tf.loadLayersModel(tf.io.browserFiles(
      [jsonFile, weightsFile]
    ));

    // Carrega os metadados se disponíveis
    const metadata = JSON.parse(localStorage.getItem('model-metadata') || 'null');

    systemLogger.log('system', 'Modelo carregado com sucesso', {
      layers: model.layers.length,
      weights: model.getWeights().length,
      metadata: metadata ? 'presente' : 'ausente'
    });

    return { model, metadata };
  } catch (error) {
    systemLogger.error('system', 'Erro ao deserializar modelo', { 
      error,
      stack: error instanceof Error ? error.stack : undefined
    });
    return { model: null, metadata: null };
  }
};