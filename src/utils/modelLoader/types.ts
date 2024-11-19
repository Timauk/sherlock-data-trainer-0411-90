import * as tf from '@tensorflow/tfjs';

export interface ModelMetadata {
  totalSamples?: number;
  playersData?: any[];
  evolutionHistory?: any[];
  timestamp?: string;
  architecture?: {
    inputShape: number[];
    layers: number[];
  };
}

export interface LoadedModel {
  model: tf.LayersModel;
  metadata: ModelMetadata;
}

export interface TensorShape {
  name: string;
  shape: number[];
  dtype: string;
}