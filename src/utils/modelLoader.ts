import * as tf from '@tensorflow/tfjs';
import { LoadedModel } from './modelLoader/types';
import { readJsonFile, readMetadataFile, createWeightsFile } from './modelLoader/fileHandlers';
import { getDefaultModelJson } from './modelLoader/modelStructure';
import { logger } from '../utils/logging/logger';
import { useToast } from "@/hooks/use-toast";

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
    throw new Error('No weights file provided');
  }

  try {
    const buffer = await weightsFile.arrayBuffer();
    if (!buffer || buffer.byteLength === 0) {
      throw new Error('Weights file is empty');
    }

    // Minimum expected size for our model architecture
    const expectedMinSize = 4352; // 17x256 minimum size
    if (buffer.byteLength < expectedMinSize) {
      throw new Error(`Weights file too small: expected at least ${expectedMinSize} bytes but got ${buffer.byteLength}`);
    }

    return buffer;
  } catch (error) {
    logger.error('Error validating weights data:', error);
    throw new Error(`Failed to validate weights data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const loadModelFiles = async (
  jsonFile: File,
  weightsFile: File,
  metadataFile?: File,
  weightSpecsFile?: File
): Promise<LoadedModel> => {
  try {
    logger.info('Starting model loading process');
    
    if (!jsonFile || !weightsFile) {
      throw new Error('Missing required model files');
    }

    let modelJson = await readJsonFile(jsonFile);
    if (!modelJson.modelTopology || !modelJson.weightsManifest) {
      logger.warn('Using default model structure');
      modelJson = getDefaultModelJson();
    }

    validateTensorShapes(modelJson);
    logger.info('Model topology validation passed');

    const weightsBuffer = await validateWeightsData(weightsFile);
    logger.info('Weights data validation passed');

    const weightsManifest = [{
      paths: ['weights.bin'],
      weights: modelJson.weightsManifest[0].weights,
    }];

    const modelArtifacts = {
      modelTopology: modelJson.modelTopology,
      weightSpecs: modelJson.weightsManifest[0].weights,
      weightData: weightsBuffer,
      format: 'layers-model',
      generatedBy: 'TensorFlow.js',
      convertedBy: null,
    };

    try {
      logger.info('Loading model from artifacts');
      const model = await tf.loadLayersModel(tf.io.fromMemory(modelArtifacts));

      // Verify model structure
      const expectedLayers = [256, 128, 15];
      const actualLayers = model.layers
        .map(layer => (layer as any).getConfig()?.units)
        .filter(units => typeof units === 'number');

      if (!expectedLayers.every((size, i) => actualLayers[i] === size)) {
        throw new Error('Model architecture does not match expected structure');
      }

      logger.info('Model structure verification passed');
      const metadata = metadataFile ? await readMetadataFile(metadataFile) : {};
      
      return { model, metadata };
    } catch (error) {
      logger.error('Error in model loading/verification:', error);
      throw new Error(`Failed to load model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } catch (error) {
    logger.error('Error in model loading process:', error);
    throw new Error(`Failed to load model: ${error instanceof Error ? error.message : 'Unknown error'}`);
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