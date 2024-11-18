import * as tf from '@tensorflow/tfjs';

export interface ModelMetadata {
  totalSamples?: number;
  playersData?: any[];
  evolutionHistory?: any[];
  timestamp?: string;
}

export interface LoadedModel {
  model: tf.LayersModel;
  metadata: ModelMetadata;
}