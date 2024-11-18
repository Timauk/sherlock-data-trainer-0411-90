import * as tf from '@tensorflow/tfjs';
import { ModelMetadata } from './types';

export const readJsonFile = async (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        resolve(JSON.parse(content));
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