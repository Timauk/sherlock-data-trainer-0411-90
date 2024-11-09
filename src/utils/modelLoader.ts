import * as tf from '@tensorflow/tfjs';
import { useToast } from "@/hooks/use-toast";

export interface ModelMetadata {
  totalSamples?: number;
  playersData?: any[];
  evolutionHistory?: any[];
  timestamp?: string;
}

export const loadModelFiles = async (
  jsonFile: File,
  weightsFile: File,
  metadataFile?: File,
  weightSpecsFile?: File
): Promise<{ model: tf.LayersModel; metadata: ModelMetadata }> => {
  try {
    // Load and parse the model.json file
    const modelJsonContent = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read model.json'));
      reader.readAsText(jsonFile);
    });

    // Parse the JSON content
    let modelJson;
    try {
      modelJson = JSON.parse(modelJsonContent);
    } catch (error) {
      throw new Error('Invalid JSON format in model.json file');
    }

    // Create a blob URL for the model JSON
    const modelJsonBlob = new Blob([JSON.stringify(modelJson)], { type: 'application/json' });
    const modelJsonUrl = URL.createObjectURL(modelJsonBlob);

    try {
      // Load the model using tf.loadLayersModel
      const model = await tf.loadLayersModel(tf.io.browserFiles(
        [new File([modelJsonBlob], 'model.json'), weightsFile]
      ));

      // Load metadata if provided
      let metadata: ModelMetadata = {};
      if (metadataFile) {
        metadata = await new Promise((resolve, reject) => {
          const metadataReader = new FileReader();
          metadataReader.onload = (e) => {
            try {
              const content = e.target?.result;
              resolve(JSON.parse(content as string));
            } catch (error) {
              console.warn('Failed to parse metadata.json, continuing without metadata');
              resolve({});
            }
          };
          metadataReader.onerror = () => {
            console.warn('Failed to read metadata.json, continuing without metadata');
            resolve({});
          };
          metadataReader.readAsText(metadataFile);
        });
      }

      // Cleanup
      URL.revokeObjectURL(modelJsonUrl);

      return { model, metadata };
    } catch (error) {
      URL.revokeObjectURL(modelJsonUrl);
      console.error('Error loading model:', error);
      throw new Error(`Failed to load model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error loading model:', error);
    throw new Error(`Failed to load model: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};