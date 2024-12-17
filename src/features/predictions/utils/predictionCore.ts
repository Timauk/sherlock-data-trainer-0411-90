import * as tf from '@tensorflow/tfjs';

export const temporalAccuracyTracker = {
  accuracyHistory: [] as number[],
  getAverageAccuracy: () => {
    if (temporalAccuracyTracker.accuracyHistory.length === 0) return 0;
    const sum = temporalAccuracyTracker.accuracyHistory.reduce((a, b) => a + b, 0);
    return sum / temporalAccuracyTracker.accuracyHistory.length;
  },
  addAccuracy: (accuracy: number) => {
    temporalAccuracyTracker.accuracyHistory.push(accuracy);
    if (temporalAccuracyTracker.accuracyHistory.length > 100) {
      temporalAccuracyTracker.accuracyHistory.shift();
    }
  }
};

export const validatePrediction = async (model: tf.LayersModel, input: number[]): Promise<boolean> => {
  try {
    const inputTensor = tf.tensor2d([input]);
    const prediction = model.predict(inputTensor) as tf.Tensor;
    const result = await prediction.data();
    
    inputTensor.dispose();
    prediction.dispose();
    
    return result.length > 0;
  } catch (error) {
    return false;
  }
};