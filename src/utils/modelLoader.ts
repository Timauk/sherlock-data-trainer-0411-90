import * as tf from '@tensorflow/tfjs';
import { toast } from "@/hooks/use-toast";

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
  // Load the model using the two main files
  const model = await tf.loadLayersModel(
    tf.io.browserFiles([jsonFile, weightsFile])
  );

  // Load metadata
  const metadataReader = new FileReader();
  const metadata: ModelMetadata = await new Promise((resolve, reject) => {
    metadataReader.onload = (e) => {
      try {
        const content = e.target?.result;
        resolve(JSON.parse(content as string));
      } catch (error) {
        reject(error);
      }
    };
    metadataReader.onerror = (error) => reject(error);
    metadataReader.readAsText(metadataFile);
  });

  return { model, metadata };
};