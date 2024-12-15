import { systemLogger } from './systemLogger';
import * as tf from '@tensorflow/tfjs';

export const modelLogger = {
  logTensorInfo: (tensor: tf.Tensor, context: string) => {
    systemLogger.log('tensor', `Info do Tensor - ${context}`, {
      shape: tensor.shape,
      dtype: tensor.dtype,
      size: tensor.size,
      timestamp: new Date().toISOString()
    });
  },

  logModelArchitecture: (model: tf.LayersModel) => {
    const layers = model.layers.map(layer => ({
      name: layer.name,
      outputShape: layer.outputShape,
      trainable: layer.trainable,
      units: (layer.getConfig() as any).units
    }));

    systemLogger.log('model', 'Arquitetura do modelo', {
      totalLayers: layers.length,
      layers,
      timestamp: new Date().toISOString()
    });
  },

  logPredictionMetrics: (predictions: number[], actual: number[]) => {
    const matches = predictions.filter(p => actual.includes(p)).length;
    
    systemLogger.log('metrics', 'Métricas de previsão', {
      matches,
      accuracy: matches / predictions.length,
      predictions: predictions.slice(0, 5),
      timestamp: new Date().toISOString()
    });
  }
};