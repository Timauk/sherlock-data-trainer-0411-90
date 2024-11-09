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
  metadataFile: File,
  weightSpecsFile: File
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

    // Verify complete model structure
    if (!modelJson.modelTopology) {
      // If modelTopology is missing, try to construct it from the file
      const weightSpecs = await new Promise<any>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            resolve(JSON.parse(e.target?.result as string));
          } catch (error) {
            reject(new Error('Failed to parse weight specs'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read weight specs file'));
        reader.readAsText(weightSpecsFile);
      });

      modelJson = {
        modelTopology: {
          class_name: "Sequential",
          config: {
            name: "sequential",
            layers: weightSpecs.map((spec: any) => ({
              class_name: "Dense",
              config: {
                name: spec.name,
                trainable: true,
                dtype: spec.dtype,
                units: spec.shape[spec.shape.length - 1]
              }
            }))
          }
        },
        weightsManifest: [{
          paths: [weightsFile.name],
          weights: weightSpecs
        }],
        format: "layers-model",
        generatedBy: "TensorFlow.js",
        convertedBy: null
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