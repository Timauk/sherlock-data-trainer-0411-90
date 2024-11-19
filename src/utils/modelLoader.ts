import * as tf from '@tensorflow/tfjs';
import { LoadedModel } from './modelLoader/types';
import { readJsonFile, readMetadataFile, createWeightsFile } from './modelLoader/fileHandlers';
import { getDefaultModelJson } from './modelLoader/modelStructure';
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
    
    // Validate expected tensor sizes
    const expectedSize = weight.shape.reduce((a: number, b: number) => a * b, 1);
    if (expectedSize === 0) {
      throw new Error(`Invalid tensor size for ${weight.name}: shape results in 0 values`);
    }
  }
};

export const loadModelFiles = async (
  jsonFile: File,
  weightsFile: File,
  metadataFile?: File,
  weightSpecsFile?: File
): Promise<LoadedModel> => {
  try {
    let modelJson = await readJsonFile(jsonFile);
    
    // Verify and use default if needed
    if (!modelJson.modelTopology || !modelJson.weightsManifest) {
      console.warn('Using default model structure');
      modelJson = getDefaultModelJson();
    }

    // Validate tensor shapes before loading
    validateTensorShapes(modelJson);

    // Create a new File with the correct name for weights
    const weightsFileWithCorrectName = createWeightsFile(weightsFile);

    // Create model JSON blob
    const modelJsonBlob = new Blob([JSON.stringify(modelJson)], { type: 'application/json' });
    const modelJsonFile = new File([modelJsonBlob], 'model.json', { type: 'application/json' });

    try {
      const model = await tf.loadLayersModel(tf.io.browserFiles(
        [modelJsonFile, weightsFileWithCorrectName]
      ));

      // Verify model structure matches expected architecture
      const expectedLayers = [256, 128, 15]; // Expected layer sizes
      const actualLayers = model.layers
        .map(layer => (layer as any).units)
        .filter(units => typeof units === 'number');
      
      if (!expectedLayers.every((size, i) => actualLayers[i] === size)) {
        throw new Error('Model architecture does not match expected structure');
      }

      const metadata = metadataFile ? await readMetadataFile(metadataFile) : {};
      
      return { model, metadata };
    } catch (error) {
      console.error('Error loading model:', error);
      throw new Error(`Failed to load model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error loading model:', error);
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