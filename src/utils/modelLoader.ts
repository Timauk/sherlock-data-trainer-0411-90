import * as tf from '@tensorflow/tfjs';

export interface ModelMetadata {
  totalSamples?: number;
  playersData?: any[];
  evolutionHistory?: any[];
  timestamp?: string;
}

export const loadModelFiles = async (
  jsonFile: File,
  weightsFile: File,
  metadataFile: File
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
    const modelJson = JSON.parse(modelJsonContent);

    // Verify model structure
    if (!modelJson.modelTopology) {
      throw new Error('Invalid model.json file: missing modelTopology field');
    }

    if (!modelJson.weightsManifest) {
      throw new Error('Invalid model.json file: missing weightsManifest field');
    }

    // Create a blob URL for the model JSON
    const modelJsonBlob = new Blob([JSON.stringify(modelJson)], { type: 'application/json' });

    try {
      // Load the model using tf.loadLayersModel
      const model = await tf.loadLayersModel(tf.io.browserFiles(
        [new File([modelJsonBlob], 'model.json'), weightsFile]
      ));

      // Load metadata separately
      const metadata: ModelMetadata = await new Promise((resolve, reject) => {
        const metadataReader = new FileReader();
        metadataReader.onload = (e) => {
          try {
            const content = e.target?.result;
            resolve(JSON.parse(content as string));
          } catch (error) {
            reject(new Error('Failed to parse metadata.json'));
          }
        };
        metadataReader.onerror = () => reject(new Error('Failed to read metadata.json'));
        metadataReader.readAsText(metadataFile);
      });

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