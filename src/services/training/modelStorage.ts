import * as tf from '@tensorflow/tfjs';

export const saveModel = async (model: tf.LayersModel, name: string, metrics: any) => {
  try {
    const modelData = await model.save('localstorage://temp-model');
    // Salva apenas localmente por enquanto
    localStorage.setItem('model-metrics', JSON.stringify({
      name,
      metrics,
      created_at: new Date().toISOString()
    }));
    
    return { success: true };
  } catch (error) {
    console.error('Error saving model:', error);
    return { success: false, error };
  }
};

export const loadModel = async (modelId: string) => {
  try {
    const metricsStr = localStorage.getItem('model-metrics');
    const data = metricsStr ? JSON.parse(metricsStr) : null;
    
    if (!data) throw new Error('Model not found');

    // Load model from local storage
    const model = await tf.loadLayersModel('localstorage://temp-model');
    return { model, data };
  } catch (error) {
    console.error('Error loading model:', error);
    return { error };
  }
};