import * as tf from '@tensorflow/tfjs';
import { systemLogger } from './logging/systemLogger';

export interface ModelMetadata {
  timestamp: string;
  architecture: {
    layers: number[];
    inputShape: number[];
    outputShape: number[];
  };
}

export const deserializeModel = async (jsonFile: File, weightsFile: File): Promise<{
  model: tf.LayersModel | null;
  metadata: ModelMetadata | null;
}> => {
  try {
    systemLogger.log('system', 'Iniciando carregamento do modelo', {
      jsonFileName: jsonFile.name,
      weightsFileName: weightsFile.name,
      jsonFileSize: jsonFile.size,
      weightsFileSize: weightsFile.size
    });

    // Carrega o modelo diretamente sem validações complexas
    const model = await tf.loadLayersModel(tf.io.browserFiles([jsonFile, weightsFile]));
    
    if (!model) {
      throw new Error('Falha ao carregar o modelo');
    }

    // Metadata básico apenas para registro
    const metadata: ModelMetadata = {
      timestamp: new Date().toISOString(),
      architecture: {
        layers: model.layers.map(l => l.units || 0),
        inputShape: model.inputs[0].shape as number[],
        outputShape: model.outputs[0].shape as number[]
      }
    };

    systemLogger.log('system', 'Modelo carregado com sucesso', {
      layers: model.layers.length,
      weights: model.getWeights().length,
      metadata: metadata
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

export const serializeModel = async (model: tf.LayersModel) => {
  try {
    const saveResult = await model.save('downloads://modelo-aprendiz');
    
    systemLogger.log('system', 'Modelo serializado com sucesso', {
      weightsPresent: saveResult.modelArtifactsInfo?.weightDataBytes ? 'sim' : 'não'
    });
    return true;
  } catch (error) {
    systemLogger.error('system', 'Erro ao serializar modelo', { error });
    return false;
  }
};