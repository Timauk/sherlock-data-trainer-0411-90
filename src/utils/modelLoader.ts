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
  // First load and parse the model.json file to get topology
  const modelJson = await new Promise<any>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result;
        resolve(JSON.parse(content as string));
      } catch (error) {
        reject(new Error('Failed to parse model.json'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read model.json'));
    reader.readAsText(jsonFile);
  });

  // Verify model topology exists
  if (!modelJson.modelTopology) {
    throw new Error('Invalid model.json file: missing modelTopology field');
  }

  // Create a blob URL for the weights file
  const weightsUrl = URL.createObjectURL(weightsFile);

  try {
    // Load the model using the topology and weights
    const model = await tf.loadLayersModel(tf.io.browserFiles(
      [jsonFile, weightsFile]
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
  } finally {
    // Clean up the blob URL
    URL.revokeObjectURL(weightsUrl);
  }
};