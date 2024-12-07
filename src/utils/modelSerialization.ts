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

const extractModelConfig = (modelJSON: any): any => {
  // Tenta diferentes caminhos para encontrar a configuração
  if (modelJSON.modelTopology?.model_config) {
    return modelJSON.modelTopology.model_config;
  }
  
  if (modelJSON.config) {
    return modelJSON.config;
  }
  
  if (modelJSON.modelTopology?.config) {
    return modelJSON.modelTopology.config;
  }

  // Se não encontrar config, tenta extrair do próprio modelTopology
  if (modelJSON.modelTopology) {
    return {
      layers: modelJSON.modelTopology.layers || [],
      input_layers: modelJSON.modelTopology.input_layers,
      output_layers: modelJSON.modelTopology.output_layers
    };
  }

  return null;
}

const extractModelMetadata = (jsonContent: string): ModelMetadata | null => {
  try {
    systemLogger.log('system', 'Iniciando extração de metadados do JSON', {
      contentLength: jsonContent.length,
      preview: jsonContent.substring(0, 200) // Primeiros 200 caracteres para debug
    });

    const modelJSON = JSON.parse(jsonContent);
    
    systemLogger.log('system', 'Estrutura do JSON recebido', {
      hasModelTopology: !!modelJSON?.modelTopology,
      hasConfig: !!modelJSON?.config,
      hasWeights: !!modelJSON?.weightsManifest,
      modelKeys: Object.keys(modelJSON)
    });

    const config = extractModelConfig(modelJSON);
    
    if (!config) {
      systemLogger.error('system', 'Estrutura do JSON do modelo inválida', { 
        modelJSON,
        availablePaths: {
          'modelTopology.model_config': !!modelJSON?.modelTopology?.model_config,
          'config': !!modelJSON?.config,
          'modelTopology.config': !!modelJSON?.modelTopology?.config,
          'modelTopology': !!modelJSON?.modelTopology
        }
      });
      return null;
    }

    const layers = config.layers || [];
    
    systemLogger.log('system', 'Configuração das camadas encontrada', {
      totalLayers: layers.length,
      firstLayer: layers[0],
      lastLayer: layers[layers.length - 1]
    });

    // Extrai informações básicas do modelo
    const metadata: ModelMetadata = {
      timestamp: new Date().toISOString(),
      architecture: {
        layers: layers.length,
        inputShape: layers[0]?.config?.batch_input_shape || [],
        outputShape: layers[layers.length - 1]?.config?.units ? [layers[layers.length - 1].config.units] : []
      },
      performance: {
        accuracy: 0, // Será atualizado durante o treinamento
        loss: 0
      },
      training: {
        epochs: config.training_config?.epochs || 50,
        batchSize: config.training_config?.batch_size || 32,
        optimizer: config.training_config?.optimizer_config?.class_name || 'adam'
      }
    };

    systemLogger.log('system', 'Metadados extraídos com sucesso', { 
      metadata,
      validationChecks: {
        hasLayers: metadata.architecture.layers > 0,
        hasInputShape: metadata.architecture.inputShape.length > 0,
        hasOutputShape: metadata.architecture.outputShape.length > 0
      }
    });

    return metadata;
  } catch (error) {
    systemLogger.error('system', 'Erro ao extrair metadados do modelo', { 
      error,
      stack: error instanceof Error ? error.stack : undefined
    });
    return null;
  }
};

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

    // Primeiro lê o conteúdo do arquivo JSON
    const jsonContent = await jsonFile.text();
    
    // Extrai os metadados do JSON
    const extractedMetadata = extractModelMetadata(jsonContent);
    if (!extractedMetadata) {
      throw new Error('Não foi possível extrair os metadados do modelo');
    }

    // Carrega o modelo
    const model = await tf.loadLayersModel(tf.io.browserFiles([jsonFile, weightsFile]));
    if (!model) {
      throw new Error('Falha ao carregar o modelo');
    }

    // Armazena os metadados
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

export const serializeModel = async (model: tf.LayersModel, metadata: ModelMetadata) => {
  try {
    const saveResult = await model.save('downloads://modelo-aprendiz');
    
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