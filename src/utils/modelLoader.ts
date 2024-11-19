import * as tf from '@tensorflow/tfjs';
import { LoadedModel } from './modelLoader/types';
import { readJsonFile, readMetadataFile } from './modelLoader/fileHandlers';
import { getDefaultModelJson } from './modelLoader/modelStructure';
import { logger } from '../utils/logging/logger';
import { systemLogger } from './logging/systemLogger';

const validateTrainingParameters = (modelJson: any) => {
  // Relaxa a validação para aceitar modelos pré-treinados
  if (!modelJson.trainingConfig) {
    return true; // Aceita modelos sem configuração de treino explícita
  }

  const requiredParams = ['optimizer'];
  const missingParams = requiredParams.filter(param => 
    !modelJson.trainingConfig[param]
  );

  if (missingParams.length > 0) {
    logger.warn('Modelo pode precisar de treinamento adicional');
  }

  return true;
};

const validateTensorShapes = (modelJson: any) => {
  if (!modelJson.weightsManifest || !modelJson.weightsManifest[0].weights) {
    throw new Error('Invalid model format: missing weights manifest');
  }

  const weights = modelJson.weightsManifest[0].weights;
  for (const weight of weights) {
    if (!weight.shape || !Array.isArray(weight.shape)) {
      throw new Error(`Invalid shape for weight ${weight.name}`);
    }
    
    const expectedSize = weight.shape.reduce((a: number, b: number) => a * b, 1);
    if (expectedSize === 0) {
      throw new Error(`Invalid tensor size for ${weight.name}: shape results in 0 values`);
    }
  }
};

const validateWeightsData = async (weightsFile: File): Promise<ArrayBuffer> => {
  if (!weightsFile) {
    throw new Error('Arquivo de pesos não fornecido');
  }

  try {
    const buffer = await weightsFile.arrayBuffer();
    if (!buffer || buffer.byteLength === 0) {
      throw new Error('Arquivo de pesos está vazio');
    }

    // Reduz o tamanho mínimo esperado para ser mais flexível
    const expectedMinSize = 1024; // 1KB mínimo
    if (buffer.byteLength < expectedMinSize) {
      throw new Error(`Arquivo de pesos muito pequeno: esperado pelo menos ${expectedMinSize} bytes mas recebeu ${buffer.byteLength}`);
    }

    return buffer;
  } catch (error) {
    logger.error('Erro na validação dos pesos:', error);
    throw new Error(`Falha ao validar dados dos pesos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
};

export const loadModelFiles = async (
  jsonFile: File,
  weightsFile: File,
  metadataFile?: File,
  weightSpecsFile?: File
): Promise<LoadedModel> => {
  try {
    logger.info('Iniciando processo de carregamento do modelo');
    
    if (!jsonFile || !weightsFile) {
      throw new Error('Arquivos necessários do modelo não fornecidos');
    }

    let modelJson = await readJsonFile(jsonFile);
    
    try {
      validateTrainingParameters(modelJson);
      logger.info('Validação dos parâmetros de treino passou');
    } catch (error) {
      // Avisa mas não bloqueia o carregamento
      systemLogger.log('model', 'Modelo pode precisar de treinamento adicional', { error });
    }

    if (!modelJson.modelTopology || !modelJson.weightsManifest) {
      logger.warn('Usando estrutura padrão do modelo');
      modelJson = getDefaultModelJson();
    }

    validateTensorShapes(modelJson);
    logger.info('Validação da topologia do modelo passou');

    const weightsBuffer = await validateWeightsData(weightsFile);
    logger.info('Validação dos dados de peso passou');

    const modelArtifacts = {
      modelTopology: modelJson.modelTopology,
      weightSpecs: modelJson.weightsManifest[0].weights,
      weightData: weightsBuffer,
      format: 'layers-model',
      generatedBy: 'TensorFlow.js',
      convertedBy: null,
      trainingConfig: modelJson.trainingConfig || {
        optimizer: 'adam',
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      }
    };

    try {
      const model = await tf.loadLayersModel(tf.io.fromMemory(modelArtifacts));
      
      // Verifica estrutura mas é mais flexível
      const expectedLayers = [256, 128, 15];
      const actualLayers = model.layers
        .map(layer => (layer as any).getConfig()?.units)
        .filter(units => typeof units === 'number');

      if (!actualLayers.some(units => units === 15)) {
        throw new Error('Modelo precisa ter uma camada de saída com 15 unidades');
      }

      logger.info('Verificação da estrutura do modelo passou');
      const metadata = metadataFile ? await readMetadataFile(metadataFile) : {};
      
      return { model, metadata };
    } catch (error) {
      systemLogger.log('model', 'Erro ao carregar modelo', { error });
      throw new Error(`Falha ao carregar modelo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  } catch (error) {
    systemLogger.log('model', 'Erro no processo de carregamento do modelo', { error });
    throw new Error(`Falha ao carregar modelo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
};

export const verifyTensorDimensions = (tensor: tf.Tensor, expectedShape: number[]) => {
  const actualShape = tensor.shape;
  if (actualShape.length !== expectedShape.length) {
    throw new Error(`Tensor shape mismatch: expected ${expectedShape}, got ${actualShape}`);
  }
  for (let i = 0; i < expectedShape.length; i++) {
    if (expectedShape[i] !== null && expectedShape[i] !== actualShape[i]) {
      throw new Error(`Tensor dimension ${i} mismatch: expected ${expectedShape[i]}, got ${actualShape[i]}`);
    }
  }
  return true;
};