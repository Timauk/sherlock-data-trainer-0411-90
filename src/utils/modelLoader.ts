import * as tf from '@tensorflow/tfjs';
import { LoadedModel } from './modelLoader/types';
import { readJsonFile, readMetadataFile, createWeightsFile } from './modelLoader/fileHandlers';
import { getDefaultModelJson } from './modelLoader/modelStructure';
import { logger } from '../../src/utils/logging/logger.js';

const validateTensorShapes = (modelJson: any) => {
  if (!modelJson.weightsManifest || !modelJson.weightsManifest[0].weights) {
    throw new Error('Invalid model format: missing weights manifest');
  }

  const weights = modelJson.weightsManifest[0].weights;
  for (const weight of weights) {
    if (!weight.shape || !Array.isArray(weight.shape)) {
      throw new Error(`Invalid shape for weight ${weight.name}`);
    }
    
    // Validate expected tensor sizes
    const expectedSize = weight.shape.reduce((a: number, b: number) => a * b, 1);
    if (expectedSize === 0) {
      throw new Error(`Invalid tensor size for ${weight.name}: shape results in 0 values`);
    }
  }
};

const validateWeightsData = async (weightsFile: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const buffer = reader.result as ArrayBuffer;
      if (!buffer || buffer.byteLength === 0) {
        reject(new Error('Weights file is empty'));
        return;
      }

      // Verify the buffer size matches expected tensor shapes
      const expectedMinSize = 4352 * 4; // 17x256 floats, 4 bytes each
      if (buffer.byteLength < expectedMinSize) {
        reject(new Error(`Weights file too small: expected at least ${expectedMinSize} bytes but got ${buffer.byteLength}`));
        return;
      }

      resolve(buffer);
    };
    reader.onerror = () => reject(new Error('Failed to read weights file'));
    reader.readAsArrayBuffer(weightsFile);
  });
};

export const loadModelFiles = async (
  jsonFile: File,
  weightsFile: File,
  metadataFile?: File,
  weightSpecsFile?: File
): Promise<LoadedModel> => {
  try {
    let modelJson = await readJsonFile(jsonFile);
    
    if (!modelJson.modelTopology || !modelJson.weightsManifest) {
      logger.warn('Using default model structure');
      modelJson = getDefaultModelJson();
    }

    // Validate tensor shapes before loading
    validateTensorShapes(modelJson);

    // Validate and get weights data
    const weightsBuffer = await validateWeightsData(weightsFile);

    // Create weights manifest
    const weightsManifest = [{
      paths: ['weights.bin'],
      weights: modelJson.weightsManifest[0].weights,
    }];

    // Create model artifacts
    const modelArtifacts = {
      modelTopology: modelJson.modelTopology,
      weightSpecs: modelJson.weightsManifest[0].weights,
      weightData: weightsBuffer,
      format: 'layers-model',
      generatedBy: 'TensorFlow.js',
      convertedBy: null,
    };

    try {
      const model = await tf.loadLayersModel(tf.io.fromMemory(modelArtifacts));

      // Verify model structure matches expected architecture
      const expectedLayers = [256, 128, 15]; // Expected layer sizes
      const actualLayers = model.layers
        .map(layer => {
          const config = (layer as any).getConfig();
          return config?.units;
        })
        .filter(units => typeof units === 'number');
      
      if (!expectedLayers.every((size, i) => actualLayers[i] === size)) {
        throw new Error('Model architecture does not match expected structure');
      }

      const metadata = metadataFile ? await readMetadataFile(metadataFile) : {};
      
      return { model, metadata };
    } catch (error) {
      logger.error('Error loading model:', error);
      throw new Error(`Failed to load model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } catch (error) {
    logger.error('Error loading model:', error);
    throw new Error(`Failed to load model: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Helper function to verify tensor dimensions
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