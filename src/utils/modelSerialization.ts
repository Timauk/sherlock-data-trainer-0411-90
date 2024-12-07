import * as tf from '@tensorflow/tfjs';
import { systemLogger } from './logging/systemLogger';

export interface ModelMetadata {
  timestamp: string;
  architecture: {
    layers: number;
    inputShape: number[];
    outputShape: number[];
  };
  performance: {
    accuracy: number;
    loss: number;
  };
  training: {
    epochs: number;
    batchSize: number;
    optimizer: string;
  };
}

export const serializeModel = async (model: tf.LayersModel, metadata: ModelMetadata) => {
  try {
    const saveResult = await model.save('downloads://modelo-aprendiz');
    
    // Save metadata in localStorage for later retrieval
    localStorage.setItem('model-metadata', JSON.stringify({
      ...metadata,
      modelConfig: model.getConfig(),
      weightsManifest: saveResult.modelArtifactsInfo?.weightDataBytes ? 'presente' : 'ausente'
    }));
    
    systemLogger.log('system', 'Modelo serializado com sucesso', {
      metadata,
      saveResult,
      weightsPresent: saveResult.modelArtifactsInfo?.weightDataBytes ? 'sim' : 'não'
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

    // Extract metadata from JSON file
    const jsonContent = await jsonFile.text();
    const modelJSON = JSON.parse(jsonContent);
    
    // Create metadata from model configuration
    const extractedMetadata: ModelMetadata = {
      timestamp: new Date().toISOString(),
      architecture: {
        layers: modelJSON.config.layers.length,
        inputShape: modelJSON.config.layers[0].config.batch_input_shape,
        outputShape: modelJSON.config.layers[modelJSON.config.layers.length - 1].config.units
      },
      performance: {
        accuracy: 0, // Will be updated during training
        loss: 0
      },
      training: {
        epochs: modelJSON.config.epochs || 50,
        batchSize: modelJSON.config.batch_size || 32,
        optimizer: modelJSON.config.optimizer_config?.class_name || 'adam'
      }
    };

    // Load the model using both files
    const model = await tf.loadLayersModel(tf.io.browserFiles(
      [jsonFile, weightsFile]
    ));

    // Store metadata for future use
    localStorage.setItem('model-metadata', JSON.stringify(extractedMetadata));

    systemLogger.log('system', 'Modelo carregado com sucesso', {
      layers: model.layers.length,
      weights: model.getWeights().length,
      metadata: 'presente',
      metadataContent: extractedMetadata
    });

    return { model, metadata: extractedMetadata };
  } catch (error) {
    systemLogger.error('system', 'Erro ao deserializar modelo', { 
      error,
      stack: error instanceof Error ? error.stack : undefined
    });
    return { model: null, metadata: null };
  }
};