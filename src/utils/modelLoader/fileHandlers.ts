import * as tf from '@tensorflow/tfjs';
import { ModelMetadata } from './types';

export const readJsonFile = async (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const jsonData = JSON.parse(content);
        
        // Ensure weightsManifest has correct paths
        if (jsonData.weightsManifest) {
          jsonData.weightsManifest = jsonData.weightsManifest.map((manifest: any) => ({
            ...manifest,
            paths: ['weights.bin'] // Force the correct weights filename
          }));
        }
        
        resolve(jsonData);
      } catch (error) {
        reject(new Error('Invalid JSON format'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

export const readMetadataFile = async (file: File): Promise<ModelMetadata> => {
  try {
    return await readJsonFile(file);
  } catch (error) {
    console.warn('Failed to parse metadata.json, continuing without metadata');
    return {};
  }
};

export const createWeightsFile = (weightsFile: File): File => {
  return new File([weightsFile], 'weights.bin', { type: weightsFile.type });
};