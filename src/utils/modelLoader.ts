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

    // Create a new model topology if missing
    if (!modelJson.modelTopology) {
      modelJson.modelTopology = {
        class_name: "Sequential",
        config: {
          name: "sequential_1",
          layers: []
        },
        keras_version: "2.9.0",
        backend: "tensorflow"
      };
    }

    // Create a blob URL for the model JSON
    const modelJsonBlob = new Blob([JSON.stringify(modelJson)], { type: 'application/json' });
    const modelJsonUrl = URL.createObjectURL(modelJsonBlob);

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
    } finally {
      // Clean up the blob URL
      URL.revokeObjectURL(modelJsonUrl);
    }
  } catch (error) {
    console.error('Error loading model:', error);
    throw new Error(`Failed to load model: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};