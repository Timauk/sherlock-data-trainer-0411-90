import * as tf from '@tensorflow/tfjs';
import { LoadedModel } from './modelLoader/types';
import { getDefaultModelJson } from './modelLoader/modelStructure';
import { readJsonFile, readMetadataFile } from './modelLoader/fileHandlers';

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
      modelJson = getDefaultModelJson();
    }

    // Create a new File with the correct name for weights
    const weightsFileWithCorrectName = new File(
      [weightsFile], 
      'weights.bin', 
      { type: weightsFile.type }
    );

    // Create model JSON blob
    const modelJsonBlob = new Blob([JSON.stringify(modelJson)], { type: 'application/json' });
    const modelJsonFile = new File([modelJsonBlob], 'model.json', { type: 'application/json' });

    try {
      const model = await tf.loadLayersModel(tf.io.browserFiles(
        [modelJsonFile, weightsFileWithCorrectName]
      ));

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